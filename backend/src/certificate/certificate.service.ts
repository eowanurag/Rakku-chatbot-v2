import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SubmissionFingerprintService } from '../security/submission-fingerprint.service';

export interface CertificateData {
  id: string;
  referenceNumber: string;
  citizenId: string;
  name: string;
  address: string;
  district: string;
  purpose: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CertificateService {
  private readonly logger = new Logger(CertificateService.name);
  private inMemoryCertificates: any[] = [];

  constructor(
    private prisma: PrismaService,
    private fingerprintService?: SubmissionFingerprintService
  ) {
    if (!this.fingerprintService) {
      this.fingerprintService = new SubmissionFingerprintService(this.prisma);
    }
  }

  private generateRefNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `UP-CER-${year}-${random}`;
  }

  private async getOrCreateDefaultCitizenId(): Promise<string> {
    try {
      const defaultCitizen = await this.prisma.citizen.findFirst();
      if (defaultCitizen) return defaultCitizen.id;
      const newCitizen = await this.prisma.citizen.create({
        data: {
          fullName: "Default Citizen",
          mobileNumber: "9999999999",
          isConfirmed: true,
        }
      });
      return newCitizen.id;
    } catch {
      return "mock-default-citizen-id";
    }
  }

  async createCertificate(
    name: string,
    address: string,
    district: string,
    purpose: string,
    preGeneratedRefNum?: string,
    citizenId?: string,
    usedProfileReuse: boolean = false,
    profileSnapshot?: any,
    profileSnapshotVersion: number = 1,
  ): Promise<CertificateData> {
    const refNum = preGeneratedRefNum || this.generateRefNumber();
    const resolvedCitizenId = citizenId || await this.getOrCreateDefaultCitizenId();

    const fingerprint = this.fingerprintService.generateFingerprint(resolvedCitizenId, 'Certificate', { name, address, district, purpose });
    if (await this.fingerprintService.isDuplicate(fingerprint, 'Certificate')) {
      throw new BadRequestException({
        success: false,
        message: "Duplicate submission detected. Please wait before submitting again."
      });
    }
    await this.fingerprintService.recordFingerprint(fingerprint, resolvedCitizenId, 'Certificate');

    try {
      return await this.prisma.characterCertificate.create({
        data: {
          referenceNumber: refNum,
          name,
          address,
          district,
          purpose,
          citizenId: resolvedCitizenId,
          usedProfileReuse,
          profileSnapshot: profileSnapshot || null,
          profileSnapshotVersion,
        },
      }) as unknown as CertificateData;
    } catch (e) {
      this.logger.warn(`Prisma error: ${e.message}. Using in-memory store.`);
      const mock: CertificateData = {
        id: Math.random().toString(36).substring(7),
        referenceNumber: refNum,
        citizenId: resolvedCitizenId,
        name,
        address,
        district,
        purpose,
        status: 'Submitted',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.inMemoryCertificates.push(mock);
      return mock;
    }
  }

  async getCertificate(refNum: string): Promise<CertificateData | null> {
    try {
      return await this.prisma.characterCertificate.findUnique({
        where: { referenceNumber: refNum },
        include: { citizen: true },
      }) as unknown as CertificateData;
    } catch (e) {
      this.logger.warn(`Prisma error: ${e.message}. Reading in-memory store.`);
      return this.inMemoryCertificates.find(c => c.referenceNumber === refNum) || null;
    }
  }

  async getAllCertificates(): Promise<CertificateData[]> {
    try {
      return await this.prisma.characterCertificate.findMany({
        orderBy: { createdAt: 'desc' },
        include: { citizen: true },
      }) as unknown as CertificateData[];
    } catch (e) {
      this.logger.warn(`Prisma error: ${e.message}. Reading in-memory store.`);
      return [...this.inMemoryCertificates].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }

  async updateCertificateStatus(refNum: string, status: string): Promise<CertificateData | null> {
    try {
      return await this.prisma.characterCertificate.update({
        where: { referenceNumber: refNum },
        data: { status },
      });
    } catch (e) {
      this.logger.warn(`Prisma error: ${e.message}. Updating in-memory store.`);
      const idx = this.inMemoryCertificates.findIndex(c => c.referenceNumber === refNum);
      if (idx !== -1) {
        this.inMemoryCertificates[idx].status = status;
        this.inMemoryCertificates[idx].updatedAt = new Date();
        return this.inMemoryCertificates[idx];
      }
      return null;
    }
  }
}
