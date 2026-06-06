import { Controller, Post, Get, Put, Body, Param, NotFoundException } from '@nestjs/common';
import { CertificateService } from './certificate.service';

@Controller('certificate')
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Post()
  async create(
    @Body() body: {
      name: string;
      address: string;
      district: string;
      purpose: string;
    },
  ) {
    return this.certificateService.createCertificate(
      body.name,
      body.address,
      body.district,
      body.purpose,
    );
  }

  @Get(':refNum')
  async get(@Param('refNum') refNum: string) {
    const data = await this.certificateService.getCertificate(refNum);
    if (!data) {
      throw new NotFoundException(`Character Certificate with reference number ${refNum} not found`);
    }
    return data;
  }

  @Get()
  async getAll() {
    return this.certificateService.getAllCertificates();
  }

  @Put(':refNum/status')
  async updateStatus(@Param('refNum') refNum: string, @Body() body: { status: string }) {
    const updated = await this.certificateService.updateCertificateStatus(refNum, body.status);
    if (!updated) {
      throw new NotFoundException(`Character Certificate with reference number ${refNum} not found`);
    }
    return updated;
  }
}
