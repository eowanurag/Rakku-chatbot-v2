import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class CueHealthService {
  constructor(private readonly prisma: PrismaService) {}

  private getFilePath(subpath: string): string {
    let p = path.resolve(process.cwd(), 'shared/copilot', subpath);
    if (fs.existsSync(p)) return p;
    p = path.resolve(process.cwd(), '../shared/copilot', subpath);
    if (fs.existsSync(p)) return p;
    for (let i = 1; i <= 5; i++) {
      const dots = '../'.repeat(i);
      const testPath = path.resolve(__dirname, dots, 'shared/copilot', subpath);
      if (fs.existsSync(testPath)) return testPath;
    }
    return p;
  }

  private countEntries(subpath: string): number {
    try {
      const p = this.getFilePath(subpath);
      if (fs.existsSync(p)) {
        const dict = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (dict.entries) {
          return Object.keys(dict.entries).length;
        }
      }
    } catch (e) {
      // Ignore
    }
    return 0;
  }

  public async getHealthMetrics() {
    const synonymsSize = this.countEntries('understanding/synonyms.json');
    const dialectsSize = this.countEntries('understanding/dialects.json');
    const abbreviationsSize = this.countEntries('understanding/abbreviations.json');
    
    const dictionarySize = synonymsSize + dialectsSize + abbreviationsSize;

    const candidateCount = await this.prisma.understandingCandidate.count();
    const pendingCandidates = await this.prisma.understandingCandidate.count({
      where: { status: "PENDING" }
    });

    const approvedNotExported = await this.prisma.understandingTerm.count({
      where: { exportedVersion: null }
    });

    const exportedTerms = await this.prisma.understandingTerm.count({
      where: { NOT: { exportedVersion: null } }
    });

    // Mock/default average confidence and coverage calculations
    const avgConfidence = 0.89;
    
    // Coverage: total terms mapped vs pending candidates ratio
    const totalWordsCount = dictionarySize + candidateCount;
    const dictionaryCoverage = totalWordsCount > 0 ? parseFloat((dictionarySize / totalWordsCount).toFixed(2)) : 1.0;

    return {
      dictionarySize,
      candidateCount,
      pendingCandidates,
      approvedNotExported,
      exportedTerms,
      avgConfidence,
      dictionaryCoverage
    };
  }
}
