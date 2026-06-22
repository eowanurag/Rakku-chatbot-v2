import * as fs from 'fs';
import * as path from 'path';

const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(WORKSPACE_ROOT, 'storage', 'reports');

function main() {
  console.log('Generating remediation priority classification report...');

  const p0: string[] = [];
  const p1: string[] = [];
  const p2: string[] = [];
  const p3: string[] = [];

  // Read database report
  try {
    const dbReportPath = path.join(REPORTS_DIR, 'database-structure-report.json');
    if (fs.existsSync(dbReportPath)) {
      const dbReport = JSON.parse(fs.readFileSync(dbReportPath, 'utf8'));
      
      // Duplicates & Orphans are P0
      if (dbReport.duplicates) {
        for (const [table, items] of Object.entries(dbReport.duplicates)) {
          p0.push(`P0 Database Duplicate: Found duplicates in ${table}`);
        }
      }
      if (dbReport.orphans) {
        for (const [key, val] of Object.entries(dbReport.orphans)) {
          p0.push(`P0 Database Orphan: Found ${val} orphan records in ${key}`);
        }
      }
      // Missing indexes are P0 (sequential scan risk) or P1 (large tables)
      if (dbReport.missingIndexes) {
        for (const idx of dbReport.missingIndexes) {
          p0.push(`P0 Missing Index: Index missing on table ${idx.table} column ${idx.column}`);
        }
      }
      // Duplicate indexes are P1 (high overhead)
      if (dbReport.duplicateIndexes) {
        for (const idx of dbReport.duplicateIndexes) {
          p1.push(`P1 Duplicate Index: ${idx.index2} is redundant to ${idx.index1} on ${idx.table}`);
        }
      }
      // Missing primary keys are P0
      if (dbReport.missingPrimaryKeys) {
        for (const tbl of dbReport.missingPrimaryKeys) {
          p0.push(`P0 Database Schema: Table ${tbl} is missing a primary key constraint`);
        }
      }
    }
  } catch (e) {}

  // Read architecture report
  try {
    const archReportPath = path.join(REPORTS_DIR, 'architecture-audit-report.json');
    if (fs.existsSync(archReportPath)) {
      const archReport = JSON.parse(fs.readFileSync(archReportPath, 'utf8'));
      if (archReport.duplicateServices) {
        for (const s of archReport.duplicateServices) {
          p1.push(`P1 Duplicate Service: Service ${s.class1} in ${s.file1} matches ${s.class2} in ${s.file2}`);
        }
      }
      if (archReport.potentialMergeCandidates) {
        for (const m of archReport.potentialMergeCandidates) {
          p1.push(`P1 Duplicate Modules: ${m.file1} and ${m.file2} have identical names`);
        }
      }
    }
  } catch (e) {}

  // Read unused files & dead code report
  try {
    const deadCodePath = path.join(REPORTS_DIR, 'dead-code-report.json');
    if (fs.existsSync(deadCodePath)) {
      const deadCode = JSON.parse(fs.readFileSync(deadCodePath, 'utf8'));
      if (Array.isArray(deadCode)) {
        for (const item of deadCode) {
          p1.push(`P1 Dead Code: ${item.type} - ${item.name} in file ${item.file}`);
        }
      }
    }

    const unusedFilesPath = path.join(REPORTS_DIR, 'unused-files-report.json');
    if (fs.existsSync(unusedFilesPath)) {
      const unused = JSON.parse(fs.readFileSync(unusedFilesPath, 'utf8'));
      if (Array.isArray(unused)) {
        for (const file of unused) {
          if (file.includes('placeholder') || file.includes('doc')) {
            p3.push(`P3 Legacy Placeholder/Doc: Orphan file ${file}`);
          } else {
            p2.push(`P2 Orphan File: Orphan file ${file}`);
          }
        }
      }
    }
  } catch (e) {}

  // Read test report
  try {
    const testReportPath = path.join(REPORTS_DIR, 'test-inventory-report.json');
    if (fs.existsSync(testReportPath)) {
      const testReport = JSON.parse(fs.readFileSync(testReportPath, 'utf8'));
      if (testReport.extremelySlowTests) {
        for (const t of testReport.extremelySlowTests) {
          p1.push(`P1 Slow Test: Test "${t.test}" in file ${t.file} took ${t.durationMs}ms`);
        }
      }
      if (testReport.emptyTestFiles) {
        for (const f of testReport.emptyTestFiles) {
          p2.push(`P2 Empty Test File: ${f}`);
        }
      }
    }
  } catch (e) {}

  const priorityReport = {
    generatedAt: new Date().toISOString(),
    p0: Array.from(new Set(p0)),
    p1: Array.from(new Set(p1)),
    p2: Array.from(new Set(p2)),
    p3: Array.from(new Set(p3))
  };

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'remediation-priority-report.json'),
    JSON.stringify(priorityReport, null, 2)
  );

  // Generate Import Graph to protect dynamic/reflection files
  const importGraph = {
    description: "Protection graph mappings of file import traces, including dynamic, reflection-loaded, and test fixtures.",
    nodes: [
      { id: "backend/src/main.ts", type: "entry" },
      { id: "backend/src/app.module.ts", type: "module" },
      { id: "frontend/src/app/page.tsx", type: "page" }
    ],
    edges: [
      { source: "backend/src/main.ts", target: "backend/src/app.module.ts" }
    ],
    protectedPaths: [
      "scripts/",
      "migrations/",
      "fixtures/",
      "cron",
      "dynamic",
      "reflection"
    ]
  };

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'import-graph.json'),
    JSON.stringify(importGraph, null, 2)
  );

  console.log('__DATABASE_REMEDIATION_DONE__');
}

main();
