import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface EventPermissionData {
  id: string;
  referenceNumber: string;
  citizenId: string;
  eventType: string; // Event, Procession, Protest, Film Shooting
  eventName: string;
  location: string;
  date: string;
  expectedAttendance: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  organizerName?: string | null;
  organizerAddress?: string | null;
  organizerMobile?: string | null;
  organizerIsApplicant?: boolean;
}

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);
  private inMemoryEvents: any[] = [];

  constructor(private prisma: PrismaService) {}

  private generateRefNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `UP-EVP-${year}-${random}`;
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

  async createEventPermission(
    type: string,
    eventName: string,
    location: string,
    date: string,
    expectedAttendance: number,
    preGeneratedRefNum?: string,
    citizenId?: string,
    organizerName?: string,
    organizerAddress?: string,
    organizerMobile?: string,
    organizerIsApplicant: boolean = true,
  ): Promise<EventPermissionData> {
    const refNum = preGeneratedRefNum || this.generateRefNumber();
    const resolvedCitizenId = citizenId || await this.getOrCreateDefaultCitizenId();
    try {
      return await this.prisma.eventPermission.create({
        data: {
          referenceNumber: refNum,
          eventType: type,
          eventName,
          location,
          date,
          expectedAttendance,
          citizenId: resolvedCitizenId,
          organizerName: organizerName || null,
          organizerAddress: organizerAddress || null,
          organizerMobile: organizerMobile || null,
          organizerIsApplicant,
        },
      }) as unknown as EventPermissionData;
    } catch (e) {
      this.logger.warn(`Prisma error: ${e.message}. Using in-memory store.`);
      const mock: EventPermissionData = {
        id: Math.random().toString(36).substring(7),
        referenceNumber: refNum,
        citizenId: resolvedCitizenId,
        eventType: type,
        eventName,
        location,
        date,
        expectedAttendance,
        status: 'Submitted',
        createdAt: new Date(),
        updatedAt: new Date(),
        organizerName: organizerName || null,
        organizerAddress: organizerAddress || null,
        organizerMobile: organizerMobile || null,
        organizerIsApplicant,
      };
      this.inMemoryEvents.push(mock);
      return mock;
    }
  }

  async getEventPermission(refNum: string): Promise<EventPermissionData | null> {
    try {
      return await this.prisma.eventPermission.findUnique({
        where: { referenceNumber: refNum },
        include: { citizen: true },
      }) as unknown as EventPermissionData;
    } catch (e) {
      this.logger.warn(`Prisma error: ${e.message}. Reading in-memory store.`);
      return this.inMemoryEvents.find(ev => ev.referenceNumber === refNum) || null;
    }
  }

  async getAllEvents(): Promise<EventPermissionData[]> {
    try {
      return await this.prisma.eventPermission.findMany({
        orderBy: { createdAt: 'desc' },
        include: { citizen: true },
      }) as unknown as EventPermissionData[];
    } catch (e) {
      this.logger.warn(`Prisma error: ${e.message}. Reading in-memory store.`);
      return [...this.inMemoryEvents].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }

  async updateEventStatus(refNum: string, status: string): Promise<EventPermissionData | null> {
    try {
      return await this.prisma.eventPermission.update({
        where: { referenceNumber: refNum },
        data: { status },
      });
    } catch (e) {
      this.logger.warn(`Prisma error: ${e.message}. Updating in-memory store.`);
      const idx = this.inMemoryEvents.findIndex(ev => ev.referenceNumber === refNum);
      if (idx !== -1) {
        this.inMemoryEvents[idx].status = status;
        this.inMemoryEvents[idx].updatedAt = new Date();
        return this.inMemoryEvents[idx];
      }
      return null;
    }
  }
}
