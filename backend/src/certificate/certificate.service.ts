import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface CertificateData {
  id: string;
  referenceNumber: string;
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
  private inMemoryCertificates: CertificateData[] = [];

  constructor(private prisma: PrismaService) {}

  private generateRefNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `UP-CER-${year}-${random}`;
  }

  async createCertificate(
    name: string,
    address: string,
    district: string,
    purpose: string,
    preGeneratedRefNum?: string,
  ): Promise<CertificateData> {
    const refNum = preGeneratedRefNum || this.generateRefNumber();
    try {
      return await this.prisma.characterCertificate.create({
        data: {
          referenceNumber: refNum,
          name,
          address,
          district,
          purpose,
        },
      });
    } catch (e) {
      this.logger.warn(`Prisma error: ${e.message}. Using in-memory store.`);
      const mock: CertificateData = {
        id: Math.random().toString(36).substring(7),
        referenceNumber: refNum,
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
      });
    } catch (e) {
      this.logger.warn(`Prisma error: ${e.message}. Reading in-memory store.`);
      return this.inMemoryCertificates.find(c => c.referenceNumber === refNum) || null;
    }
  }

  async getAllCertificates(): Promise<CertificateData[]> {
    try {
      return await this.prisma.characterCertificate.findMany({
        orderBy: { createdAt: 'desc' },
      });
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
