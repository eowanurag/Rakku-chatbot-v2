import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface EventPermissionData {
  id: string;
  referenceNumber: string;
  eventType: string; // Event, Procession, Protest, Film Shooting
  eventName: string;
  location: string;
  date: string;
  expectedAttendance: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);
  private inMemoryEvents: EventPermissionData[] = [];

  constructor(private prisma: PrismaService) {}

  private generateRefNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `UP-EVP-${year}-${random}`;
  }

  async createEventPermission(
    type: string,
    eventName: string,
    location: string,
    date: string,
    expectedAttendance: number,
  ): Promise<EventPermissionData> {
    const refNum = this.generateRefNumber();
    try {
      return await this.prisma.eventPermission.create({
        data: {
          referenceNumber: refNum,
          eventType: type,
          eventName,
          location,
          date,
          expectedAttendance,
        },
      });
    } catch (e) {
      this.logger.warn(`Prisma error: ${e.message}. Using in-memory store.`);
      const mock: EventPermissionData = {
        id: Math.random().toString(36).substring(7),
        referenceNumber: refNum,
        eventType: type,
        eventName,
        location,
        date,
        expectedAttendance,
        status: 'Submitted',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.inMemoryEvents.push(mock);
      return mock;
    }
  }

  async getEventPermission(refNum: string): Promise<EventPermissionData | null> {
    try {
      return await this.prisma.eventPermission.findUnique({
        where: { referenceNumber: refNum },
      });
    } catch (e) {
      this.logger.warn(`Prisma error: ${e.message}. Reading in-memory store.`);
      return this.inMemoryEvents.find(ev => ev.referenceNumber === refNum) || null;
    }
  }

  async getAllEvents(): Promise<EventPermissionData[]> {
    try {
      return await this.prisma.eventPermission.findMany({
        orderBy: { createdAt: 'desc' },
      });
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
