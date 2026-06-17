import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class DictionaryGovernanceReportService {
  constructor(private readonly prisma: PrismaService) {}

  public async generateReport() {
    const pendingReview = await this.prisma.understandingCandidate.count({
      where: { status: "PENDING" }
    });

    const approvedPendingExport = await this.prisma.understandingTerm.count({
      where: { exportedVersion: null }
    });

    // Find the latest exported version
    const latestExported = await this.prisma.understandingTerm.findFirst({
      where: { NOT: { exportedVersion: null } },
      orderBy: { exportedAt: 'desc' }
    });

    let exportedThisRelease = 0;
    if (latestExported && latestExported.exportedVersion) {
      exportedThisRelease = await this.prisma.understandingTerm.count({
        where: { exportedVersion: latestExported.exportedVersion }
      });
    }

    const frequentCandidates = await this.prisma.understandingCandidate.findMany({
      where: { status: "PENDING" },
      orderBy: { occurrences: 'desc' },
      take: 5
    });

    const mostFrequentUnknownTerms = frequentCandidates.map(c => c.term);

    const totalExported = await this.prisma.understandingTerm.count({
      where: { NOT: { exportedVersion: null } }
    });

    const totalTerms = await this.prisma.understandingTerm.count();
    const dictionaryGrowthRate = totalTerms > 0 ? (totalExported / totalTerms) * 100 : 0.0;

    return {
      pendingReview,
      approvedPendingExport,
      exportedThisRelease,
      mostFrequentUnknownTerms,
      dictionaryGrowthRate: parseFloat(dictionaryGrowthRate.toFixed(2))
    };
  }
}
