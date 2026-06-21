import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class SubmissionFingerprintService implements OnModuleInit {
  private readonly logger = new Logger(SubmissionFingerprintService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('Executing startup cleanup of submission fingerprints...');
    await this.cleanupFingerprints();
  }

  /**
   * Normalize payload by stripping dynamic properties, sorting keys, and ignoring case/whitespace/empty values.
   */
  normalizePayload(payload: any): any {
    if (payload === null || payload === undefined) {
      return undefined;
    }

    if (typeof payload === 'string') {
      const cleaned = payload.trim().toLowerCase().replace(/\s+/g, '');
      return cleaned === '' ? undefined : cleaned;
    }

    if (Array.isArray(payload)) {
      const cleanedArr = payload
        .map(item => this.normalizePayload(item))
        .filter(item => item !== undefined && item !== null && !(Array.isArray(item) && item.length === 0));
      return cleanedArr.length === 0 ? undefined : cleanedArr;
    }

    if (typeof payload === 'object') {
      const cleanObj: any = {};
      const sortedKeys = Object.keys(payload).sort();
      for (const key of sortedKeys) {
        const lowerKey = key.toLowerCase();
        
        // Exclude dynamic keys
        if (
          lowerKey.includes('sessionid') ||
          lowerKey.includes('timestamp') ||
          lowerKey.includes('date') || 
          lowerKey.includes('trackingid') ||
          lowerKey.includes('debug') ||
          lowerKey.includes('metadata') ||
          lowerKey === 'id' ||
          lowerKey === 'createdat' ||
          lowerKey === 'updatedat' ||
          lowerKey === 'referencenumber'
        ) {
          continue;
        }

        const value = payload[key];
        const normVal = this.normalizePayload(value);
        if (normVal !== undefined && normVal !== null && !(Array.isArray(normVal) && normVal.length === 0)) {
          cleanObj[lowerKey] = normVal;
        }
      }
      return Object.keys(cleanObj).length === 0 ? undefined : cleanObj;
    }

    return payload;
  }

  /**
   * Generate SHA-256 fingerprint.
   */
  generateFingerprint(citizenId: string | null, serviceType: string, payload: any): string {
    const norm = this.normalizePayload(payload);
    const serializedPayload = JSON.stringify(norm || {});
    
    const inputStr = `${citizenId || ''}:${serviceType}:${serializedPayload}`;
    return crypto.createHash('sha256').update(inputStr).digest('hex');
  }

  /**
   * Check if a duplicate submission exists within the window (default 5 minutes).
   */
  async isDuplicate(fingerprint: string, serviceType: string, windowMs: number = 300000): Promise<boolean> {
    const cutoff = new Date(Date.now() - windowMs);
    const existing = await this.prisma.submissionFingerprint.findFirst({
      where: {
        fingerprint,
        serviceType,
        createdAt: {
          gte: cutoff,
        },
      },
    });
    return !!existing;
  }

  /**
   * Store fingerprint.
   */
  async recordFingerprint(fingerprint: string, citizenId: string | null, serviceType: string): Promise<void> {
    try {
      await this.prisma.submissionFingerprint.create({
        data: {
          fingerprint,
          citizenId,
          serviceType,
        },
      });
    } catch (e) {
      // Handle race condition gracefully if already created
      this.logger.warn(`Failed to record fingerprint: ${e.message}`);
    }
  }

  /**
   * Delete fingerprints older than 24 hours.
   */
  async cleanup(): Promise<number> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await this.prisma.submissionFingerprint.deleteMany({
      where: {
        createdAt: {
          lt: cutoff,
        },
      },
    });
    this.logger.log(`Cleaned up ${result.count} submission fingerprints older than 24h.`);
    return result.count;
  }

  async cleanupFingerprints(): Promise<number> {
    return this.cleanup();
  }
}
