import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { TrackingService } from './tracking.service';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get(':refNum')
  async track(@Param('refNum') refNum: string) {
    const status = await this.trackingService.track(refNum);
    if (!status) {
      throw new NotFoundException(`Application with reference number ${refNum} not found`);
    }
    return status;
  }
}
