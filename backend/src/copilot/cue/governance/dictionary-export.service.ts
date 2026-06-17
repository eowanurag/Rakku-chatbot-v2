import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class DictionaryExportService {
  private readonly logger = new Logger(DictionaryExportService.name);

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

  public async exportApprovedTerms(targetVersion?: string): Promise<{ success: boolean; exportedCount: number; newVersions: any }> {
    const pendingTerms = await this.prisma.understandingTerm.findMany({
      where: { exportedVersion: null }
    });

    if (pendingTerms.length === 0) {
      return { success: true, exportedCount: 0, newVersions: {} };
    }

    const groups: Record<string, typeof pendingTerms> = {
      SYNONYM: [],
      DIALECT: [],
      ABBREVIATION: []
    };

    for (const term of pendingTerms) {
      const src = term.source.toUpperCase();
      if (groups[src]) {
        groups[src].push(term);
      }
    }

    const newVersions: Record<string, string> = {};

    // 1. Export Synonyms
    if (groups.SYNONYM.length > 0) {
      newVersions.synonyms = await this.exportToDictionaryFile(
        'understanding/synonyms.json',
        groups.SYNONYM,
        targetVersion
      );
    }

    // 2. Export Dialects
    if (groups.DIALECT.length > 0) {
      newVersions.dialects = await this.exportToDictionaryFile(
        'understanding/dialects.json',
        groups.DIALECT,
        targetVersion
      );
    }

    // 3. Export Abbreviations
    if (groups.ABBREVIATION.length > 0) {
      newVersions.abbreviations = await this.exportToDictionaryFile(
        'understanding/abbreviations.json',
        groups.ABBREVIATION,
        targetVersion
      );
    }

    const exportedAt = new Date();

    // Update terms and candidates in DB
    for (const term of pendingTerms) {
      const mappedVersion = newVersions[term.source.toLowerCase() + 's'] || targetVersion || "1.0.1";
      
      await this.prisma.understandingTerm.update({
        where: { id: term.id },
        data: {
          exportedVersion: mappedVersion,
          exportedAt
        }
      });

      // Update matching candidates status
      await this.prisma.understandingCandidate.updateMany({
        where: {
          term: term.term,
          status: "APPROVED"
        },
        data: {
          status: "EXPORTED",
          promotedToTerm: true
        }
      });
    }

    return {
      success: true,
      exportedCount: pendingTerms.length,
      newVersions
    };
  }

  private async exportToDictionaryFile(subpath: string, terms: any[], targetVersion?: string): Promise<string> {
    const filePath = this.getFilePath(subpath);
    let dict = { version: "1.0.0", lastUpdated: "", exportBatchId: "", entries: {} as Record<string, string> };

    if (fs.existsSync(filePath)) {
      dict = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    // Add new entries
    for (const term of terms) {
      dict.entries[term.term] = term.meaning;
    }

    // Version increment (semantic version patch increment)
    let newVer = targetVersion;
    if (!newVer) {
      const currentVer = dict.version || "1.0.0";
      const parts = currentVer.split('.');
      if (parts.length === 3) {
        parts[2] = (parseInt(parts[2]) + 1).toString();
        newVer = parts.join('.');
      } else {
        newVer = "1.0.1";
      }
    }

    dict.version = newVer;
    dict.lastUpdated = new Date().toISOString().split('T')[0];
    dict.exportBatchId = `EXPORT_${dict.lastUpdated.replace(/-/g, '_')}_${Math.random().toString(36).substring(7)}`;

    // Ensure parent directories exist
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(dict, null, 2), 'utf8');

    return newVer;
  }
}
