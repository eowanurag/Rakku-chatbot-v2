import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface VerificationData {
  id: string;
  referenceNumber: string;
  citizenId: string;
  verificationType: string;
  name: string;
  address: string;
  mobile: string;
  propertyDetails: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private inMemoryVerifications: any[] = [];

  constructor(private prisma: PrismaService) {}

  private generateRefNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `UP-VER-${year}-${random}`;
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

  async createVerification(
    type: string,
    name: string,
    address: string,
    mobile: string,
    propertyDetails: string,
    preGeneratedRefNum?: string,
    citizenId?: string,
  ): Promise<VerificationData> {
    const refNum = preGeneratedRefNum || this.generateRefNumber();
    const resolvedCitizenId = citizenId || await this.getOrCreateDefaultCitizenId();
    try {
      return await this.prisma.verification.create({
        data: {
          referenceNumber: refNum,
          verificationType: type,
          name,
          address,
          mobile,
          propertyDetails,
          citizenId: resolvedCitizenId,
        },
      }) as unknown as VerificationData;
    } catch (e) {
      this.logger.warn(`Prisma error: ${e.message}. Using in-memory store.`);
      const mock: VerificationData = {
        id: Math.random().toString(36).substring(7),
        referenceNumber: refNum,
        citizenId: resolvedCitizenId,
        verificationType: type,
        name,
        address,
        mobile,
        propertyDetails,
        status: 'Submitted',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.inMemoryVerifications.push(mock);
      return mock;
    }
  }

  async getVerification(refNum: string): Promise<VerificationData | null> {
    try {
      return await this.prisma.verification.findUnique({
        where: { referenceNumber: refNum },
        include: { citizen: true },
      }) as unknown as VerificationData;
    } catch (e) {
      this.logger.warn(`Prisma error: ${e.message}. Reading in-memory store.`);
      return this.inMemoryVerifications.find(v => v.referenceNumber === refNum) || null;
    }
  }

  async getAllVerifications(): Promise<VerificationData[]> {
    try {
      return await this.prisma.verification.findMany({
        orderBy: { createdAt: 'desc' },
        include: { citizen: true },
      }) as unknown as VerificationData[];
    } catch (e) {
      this.logger.warn(`Prisma error: ${e.message}. Reading in-memory store.`);
      return [...this.inMemoryVerifications].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }

  async updateVerificationStatus(refNum: string, status: string): Promise<VerificationData | null> {
    try {
      return await this.prisma.verification.update({
        where: { referenceNumber: refNum },
        data: { status },
      });
    } catch (e) {
      this.logger.warn(`Prisma error: ${e.message}. Updating in-memory store.`);
      const idx = this.inMemoryVerifications.findIndex(v => v.referenceNumber === refNum);
      if (idx !== -1) {
        this.inMemoryVerifications[idx].status = status;
        this.inMemoryVerifications[idx].updatedAt = new Date();
        return this.inMemoryVerifications[idx];
      }
      return null;
    }
  }
}
