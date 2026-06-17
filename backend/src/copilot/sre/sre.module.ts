import { Module } from '@nestjs/common';
import { SreService } from './sre.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [SreService],
  exports: [SreService],
})
export class SreModule {}
