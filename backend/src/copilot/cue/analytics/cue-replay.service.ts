import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { DictionaryUnderstandingProvider } from '../runtime/providers/dictionary-understanding.provider';

@Injectable()
export class CueReplayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: DictionaryUnderstandingProvider
  ) {}

  public async runReplay(oldVersion: string, newVersion: string, sampleNarratives: string[]) {
    let improvedCount = 0;

    for (const narrative of sampleNarratives) {
      // Re-run understanding
      const result = await this.provider.understand(narrative);
      // Heuristic: if understandingStatus is UNDERSTOOD, count as resolved
      if (result.understandingStatus === 'UNDERSTOOD') {
        improvedCount++;
      }
    }

    const improvementScore = sampleNarratives.length > 0 ? improvedCount / sampleNarratives.length : 1.0;

    // Save replay audit log
    const saved = await this.prisma.cueReplayResult.create({
      data: {
        replayVersion: `REPLAY_${Date.now()}`,
        oldVersion,
        newVersion,
        improvementScore
      }
    });

    return {
      replayId: saved.id,
      oldVersion,
      newVersion,
      improvementScore,
      totalReplayed: sampleNarratives.length,
      improved: improvedCount
    };
  }
}
