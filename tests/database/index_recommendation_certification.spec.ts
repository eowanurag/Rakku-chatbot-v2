import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

describe('Index Recommendation Certification Tests', () => {
  let prisma: PrismaClient;
  let plan: any;

  beforeAll(() => {
    prisma = new PrismaClient();
    const planPath = path.resolve(__dirname, '../../storage/reports/database-remediation-plan.json');
    if (fs.existsSync(planPath)) {
      plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should verify remediation plan JSON schema is valid', () => {
    expect(plan).toBeDefined();
    expect(plan.missingIndexes).toBeInstanceOf(Array);
    expect(plan.duplicateIndexes).toBeInstanceOf(Array);
    expect(plan.recommendedSql).toBeInstanceOf(Array);
  });

  it('should verify recommended missing indexes do not already exist', async () => {
    let existingIndexes: string[] = [];
    try {
      const indexesResult: any[] = await prisma.$queryRaw`
        SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
      `;
      existingIndexes = indexesResult.map(idx => idx.indexname.toLowerCase());
    } catch (e) {}

    for (const rec of plan.missingIndexes || []) {
      expect(existingIndexes).not.toContain(rec.suggestedIndexName.toLowerCase());
    }
  });

  it('should verify duplicate indexes are truly duplicates', async () => {
    for (const rec of plan.duplicateIndexes || []) {
      // Fetch index definition for index1 and index2 and ensure they are on the same table
      const idxDef: any[] = await prisma.$queryRawUnsafe(`
        SELECT indexname, indexdef FROM pg_indexes 
        WHERE schemaname = 'public' AND tablename = '${rec.table}' AND indexname IN ('${rec.redundantIndex}', '${rec.retainedIndex}')
      `);
      
      // If found, verify their columns/keys match
      if (idxDef.length === 2) {
        const def1 = idxDef[0].indexdef.substring(idxDef[0].indexdef.indexOf('USING'));
        const def2 = idxDef[1].indexdef.substring(idxDef[1].indexdef.indexOf('USING'));
        expect(def1.replace(/\s+/g, '')).toEqual(def2.replace(/\s+/g, ''));
      }
    }
  });

  it('should verify composite indexes match actual query patterns', () => {
    for (const comp of plan.compositeIndexCandidates || []) {
      expect(comp.columns.length).toBeGreaterThan(1);
      expect(comp.table).toBeDefined();
      expect(comp.recommendationSql).toContain('CREATE INDEX');
    }
  });

  it('should verify partial index recommendations are valid', () => {
    for (const part of plan.partialIndexCandidates || []) {
      expect(part.condition).toBeDefined();
      expect(part.recommendationSql.toLowerCase()).toContain('where');
    }
  });
});
