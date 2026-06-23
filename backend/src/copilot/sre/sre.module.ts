import { Module } from '@nestjs/common';
import { SreService } from './sre.service';
import { SreRecommendationsService } from './services/sre-recommendations.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [SreService, SreRecommendationsService],
  exports: [SreService, SreRecommendationsService],
})
export class SreModule {}
