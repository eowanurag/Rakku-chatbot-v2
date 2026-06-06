import { Controller, Post, Get, Put, Body, Param, NotFoundException } from '@nestjs/common';
import { VerificationService } from './verification.service';

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post()
  async create(
    @Body() body: {
      type: string;
      name: string;
      address: string;
      mobile: string;
      propertyDetails: string;
    },
  ) {
    return this.verificationService.createVerification(
      body.type,
      body.name,
      body.address,
      body.mobile,
      body.propertyDetails,
    );
  }

  @Get(':refNum')
  async get(@Param('refNum') refNum: string) {
    const data = await this.verificationService.getVerification(refNum);
    if (!data) {
      throw new NotFoundException(`Verification application with reference number ${refNum} not found`);
    }
    return data;
  }

  @Get()
  async getAll() {
    return this.verificationService.getAllVerifications();
  }

  @Put(':refNum/status')
  async updateStatus(@Param('refNum') refNum: string, @Body() body: { status: string }) {
    const updated = await this.verificationService.updateVerificationStatus(refNum, body.status);
    if (!updated) {
      throw new NotFoundException(`Verification application with reference number ${refNum} not found`);
    }
    return updated;
  }
}
