import { Injectable } from '@nestjs/common';

@Injectable()
export class ComplaintCompletenessService {
  public calculateCompleteness(score: number): 'INCOMPLETE' | 'PARTIAL' | 'READY' {
    if (score < 0.50) {
      return 'INCOMPLETE';
    } else if (score < 0.90) {
      return 'PARTIAL';
    } else {
      return 'READY';
    }
  }
}
