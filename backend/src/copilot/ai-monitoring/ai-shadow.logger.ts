import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface ShadowLogEntry {
  timestamp: string;
  deterministicResult: any;
  aiResult: any;
  matched: boolean;
}

@Injectable()
export class AiShadowLogger {
  private readonly logger = new Logger(AiShadowLogger.name);
  private readonly logPath = path.resolve(process.cwd(), 'storage/ai-shadow-logs.jsonl');
  
  // 10% default sampling rate
  private samplingRate = 0.10;

  public configure(samplingRate: number) {
    this.samplingRate = samplingRate;
    this.logger.log(`AI Shadow Logger configured with sampling rate: ${samplingRate * 100}%`);
  }

  public logComparison(deterministicResult: any, aiResult: any) {
    // Check sampling rate
    if (Math.random() > this.samplingRate) {
      return;
    }

    try {
      const matched = this.compareResults(deterministicResult, aiResult);
      const entry: ShadowLogEntry = {
        timestamp: new Date().toISOString(),
        deterministicResult,
        aiResult,
        matched
      };

      const dir = path.dirname(this.logPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.appendFileSync(this.logPath, JSON.stringify(entry) + '\n', 'utf8');
      this.logger.log(`Shadow log recorded. Match result: ${matched}`);
    } catch (err: any) {
      this.logger.error(`Failed to record shadow log entry: ${err.message}`);
    }
  }

  private compareResults(det: any, ai: any): boolean {
    if (!det || !ai) return false;
    
    // Compare primary intents / classifications
    const detIntent = det.intent || det.predictedIntent || '';
    const aiIntent = ai.intent || ai.predictedIntent || '';
    
    if (detIntent && aiIntent) {
      return detIntent.toLowerCase() === aiIntent.toLowerCase();
    }
    
    return JSON.stringify(det) === JSON.stringify(ai);
  }
}
