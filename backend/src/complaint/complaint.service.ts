import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface ComplaintData {
  id: string;
  referenceNumber: string;
  complaintType: string;
  incidentDetails: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ComplaintService {
  private readonly logger = new Logger(ComplaintService.name);
  private inMemoryComplaints: ComplaintData[] = [];

  constructor(private prisma: PrismaService) {}

  private generateRefNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `UP-CMP-${year}-${random}`;
  }

  async createComplaint(type: string, details: string, preGeneratedRefNum?: string): Promise<ComplaintData> {
    const refNum = preGeneratedRefNum || this.generateRefNumber();
    try {
      return await this.prisma.complaint.create({
        data: {
          referenceNumber: refNum,
          complaintType: type,
          incidentDetails: details,
        },
      });
    } catch (e) {
      this.logger.warn(`Prisma error: ${e.message}. Using in-memory store.`);
      const mock: ComplaintData = {
        id: Math.random().toString(36).substring(7),
        referenceNumber: refNum,
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
      });
    } catch (e) {
      this.logger.warn(`Prisma error: ${e.message}. Reading in-memory store.`);
      return this.inMemoryComplaints.find(c => c.referenceNumber === refNum) || null;
    }
  }

  async getAllComplaints(): Promise<ComplaintData[]> {
    try {
      return await this.prisma.complaint.findMany({
        orderBy: { createdAt: 'desc' },
      });
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
