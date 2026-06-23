import { Module } from '@nestjs/common';
import { ConsensusEngineService } from './consensus-engine.service';

@Module({
  providers: [ConsensusEngineService],
  exports: [ConsensusEngineService],
})
export class ConsensusModule {}
