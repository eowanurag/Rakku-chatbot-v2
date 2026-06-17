import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class GraphMissService {
  private readonly logger = new Logger(GraphMissService.name);

  constructor(private readonly prisma: PrismaService) {}

  public async recordGraphMiss(parentNode: string, proposedNode: string): Promise<void> {
    try {
      const parent = parentNode.toUpperCase().trim();
      const proposed = proposedNode.toUpperCase().trim();

      const existing = await this.prisma.scenarioGraphCandidate.findFirst({
        where: {
          parentNode: parent,
          proposedNode: proposed
        }
      });

      if (existing) {
        await this.prisma.scenarioGraphCandidate.update({
          where: { id: existing.id },
          data: {
            occurrences: existing.occurrences + 1
          }
        });
        this.logger.log(`Updated SRE Graph Candidate: parent=${parent} proposed=${proposed} occurrences=${existing.occurrences + 1}`);
      } else {
        await this.prisma.scenarioGraphCandidate.create({
          data: {
            parentNode: parent,
            proposedNode: proposed,
            occurrences: 1,
            status: "PENDING"
          }
        });
        this.logger.log(`Created SRE Graph Candidate: parent=${parent} proposed=${proposed}`);
      }
    } catch (e: any) {
      this.logger.error('Failed to log SRE graph candidate miss to database', e);
    }
  }
}
