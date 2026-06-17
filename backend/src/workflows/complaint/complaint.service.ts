import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { SubmissionFingerprintService } from '../../security/submission-fingerprint.service';

export interface ComplaintData {
  id: string;
  referenceNumber: string;
  citizenId: string;
  complaintType: string;
  incidentDetails: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ComplaintService {
  private readonly logger = new Logger(ComplaintService.name);
  private inMemoryComplaints: any[] = [];

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
    return `UP-CMP-${year}-${random}`;
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

  async createComplaint(type: string, details: string, preGeneratedRefNum?: string, citizenId?: string): Promise<ComplaintData> {
    const refNum = preGeneratedRefNum || this.generateRefNumber();
    const resolvedCitizenId = citizenId || await this.getOrCreateDefaultCitizenId();

    const fingerprint = this.fingerprintService.generateFingerprint(resolvedCitizenId, 'Complaint', { type, details });
    if (await this.fingerprintService.isDuplicate(fingerprint, 'Complaint')) {
      throw new BadRequestException({
        success: false,
        message: "Duplicate submission detected. Please wait before submitting again."
      });
    }
    await this.fingerprintService.recordFingerprint(fingerprint, resolvedCitizenId, 'Complaint');

    try {
      return await this.prisma.complaint.create({

        data: {
          referenceNumber: refNum,
          complaintType: type,
          incidentDetails: details,
          citizenId: resolvedCitizenId,
        },
      }) as unknown as ComplaintData;
    } catch (e) {
      this.logger.warn(`Prisma error: ${e.message}. Using in-memory store.`);
      const mock: ComplaintData = {
        id: Math.random().toString(36).substring(7),
        referenceNumber: refNum,
        citizenId: resolvedCitizenId,
        complaintType: type,
        incidentDetails: details,
        status: 'Submitted',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.inMemoryComplaints.push(mock);
      return mock;
    }
  }

  async modifyComplaint(refNum: string, details: string): Promise<ComplaintData | null> {
    try {
      return await this.prisma.complaint.update({
        where: { referenceNumber: refNum },
        data: { incidentDetails: details },
      });
    } catch (e) {
      this.logger.warn(`Prisma error: ${e.message}. Updating in-memory store.`);
      const idx = this.inMemoryComplaints.findIndex(c => c.referenceNumber === refNum);
      if (idx !== -1) {
        this.inMemoryComplaints[idx].incidentDetails = details;
        this.inMemoryComplaints[idx].updatedAt = new Date();
        return this.inMemoryComplaints[idx];
      }
      return null;
    }
  }

  async getComplaint(refNum: string): Promise<ComplaintData | null> {
    try {
      return await this.prisma.complaint.findUnique({
        where: { referenceNumber: refNum },
        include: { citizen: true },
      }) as unknown as ComplaintData;
    } catch (e) {
      this.logger.warn(`Prisma error: ${e.message}. Reading in-memory store.`);
      return this.inMemoryComplaints.find(c => c.referenceNumber === refNum) || null;
    }
  }

  async getAllComplaints(): Promise<ComplaintData[]> {
    try {
      return await this.prisma.complaint.findMany({
        orderBy: { createdAt: 'desc' },
        include: { citizen: true },
      }) as unknown as ComplaintData[];
    } catch (e) {
      this.logger.warn(`Prisma error: ${e.message}. Reading in-memory store.`);
      return [...this.inMemoryComplaints].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }

  async updateComplaintStatus(refNum: string, status: string): Promise<ComplaintData | null> {
    try {
      return await this.prisma.complaint.update({
        where: { referenceNumber: refNum },
        data: { status },
      });
    } catch (e) {
      this.logger.warn(`Prisma error: ${e.message}. Updating in-memory store.`);
      const idx = this.inMemoryComplaints.findIndex(c => c.referenceNumber === refNum);
      if (idx !== -1) {
        this.inMemoryComplaints[idx].status = status;
        this.inMemoryComplaints[idx].updatedAt = new Date();
        return this.inMemoryComplaints[idx];
      }
      return null;
    }
  }
}
