import { Controller, Post, Put, Get, Body, Param, NotFoundException } from '@nestjs/common';
import { ComplaintService } from './complaint.service';

@Controller('complaint')
export class ComplaintController {
  constructor(private readonly complaintService: ComplaintService) {}

  @Post()
  async create(@Body() body: { type: string; details: string }) {
    return this.complaintService.createComplaint(body.type, body.details);
  }

  @Put(':refNum')
  async modify(@Param('refNum') refNum: string, @Body() body: { details: string }) {
    const updated = await this.complaintService.modifyComplaint(refNum, body.details);
    if (!updated) {
      throw new NotFoundException(`Complaint with reference number ${refNum} not found`);
    }
    return updated;
  }

  @Get(':refNum')
  async get(@Param('refNum') refNum: string) {
    const complaint = await this.complaintService.getComplaint(refNum);
    if (!complaint) {
      throw new NotFoundException(`Complaint with reference number ${refNum} not found`);
    }
    return complaint;
  }

  @Get()
  async getAll() {
    return this.complaintService.getAllComplaints();
  }

  @Put(':refNum/status')
  async updateStatus(@Param('refNum') refNum: string, @Body() body: { status: string }) {
    const updated = await this.complaintService.updateComplaintStatus(refNum, body.status);
    if (!updated) {
      throw new NotFoundException(`Complaint with reference number ${refNum} not found`);
    }
    return updated;
  }
}
