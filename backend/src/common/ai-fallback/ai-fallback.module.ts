import { Module } from '@nestjs/common';
import { AiFallbackService } from './ai-fallback.service';

@Module({
  providers: [AiFallbackService],
  exports: [AiFallbackService],
})
export class AiFallbackModule {}
