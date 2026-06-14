import { Controller, Post, Get, Put, Body, Param, NotFoundException } from '@nestjs/common';
import { EventService } from './event.service';
import { Throttle } from '@nestjs/throttler';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post()
  async create(
    @Body() body: {
      type: string;
      eventName: string;
      location: string;
      date: string;
      expectedAttendance: number;
    },
  ) {
    return this.eventService.createEventPermission(
      body.type,
      body.eventName,
      body.location,
      body.date,
      body.expectedAttendance,
    );
  }

  @Get(':refNum')
  async get(@Param('refNum') refNum: string) {
    const data = await this.eventService.getEventPermission(refNum);
    if (!data) {
      throw new NotFoundException(`Event Permission with reference number ${refNum} not found`);
    }
    return data;
  }

  @Get()
  async getAll() {
    return this.eventService.getAllEvents();
  }

  @Put(':refNum/status')
  async updateStatus(@Param('refNum') refNum: string, @Body() body: { status: string }) {
    const updated = await this.eventService.updateEventStatus(refNum, body.status);
    if (!updated) {
      throw new NotFoundException(`Event Permission with reference number ${refNum} not found`);
    }
    return updated;
  }
}
