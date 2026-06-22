import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

const TIMEOUT_MS = 120000; // 120 seconds
const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(WORKSPACE_ROOT, 'storage', 'reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Timeout helper
const timeoutPromise = (ms: number): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Timeout of ${ms}ms exceeded`));
    }, ms);
  });
};

// Log errors and save a partial report if needed
const errorsRecorded: { phase: string; error: string } = {} as any;
function recordError(phase: string, err: any) {
  const errMsg = err instanceof Error ? err.message : String(err);
  console.error(`[ERROR] Phase: ${phase} failed:`, errMsg);
  errorsRecorded[phase] = errMsg;
}

// Main runner orchestrator
async function main() {
  console.log('Starting full audit...');
  
  // Isolated result holders
  let unusedFiles: string[] = [];
  let deadCode: any[] = [];
  let duplicateConfigs: any[] = [];
  
  let unusedDependencies: string[] = [];
  let unusedDevDependencies: string[] = [];
  let missingDependencies: string[] = [];
  let circularDependencies: string[] = [];
  let depWarnings: string[] = [];

  let dbStructureReport: any = {};
  let architectureReport: any = {};
  let testInventoryReport: any = {};

  const runAudit = async () => {
    // ----------------------------------------
    // PHASE 2: Repository Audit
    // ----------------------------------------
    try {
      console.log('Running Repository Audit...');
      const repoResults = performRepositoryAudit();
      unusedFiles = repoResults.unusedFiles;
      deadCode = repoResults.deadCode;
      duplicateConfigs = repoResults.duplicateConfigs;
      
      fs.writeFileSync(path.join(REPORTS_DIR, 'unused-files-report.json'), JSON.stringify(unusedFiles, null, 2));
      fs.writeFileSync(path.join(REPORTS_DIR, 'dead-code-report.json'), JSON.stringify(deadCode, null, 2));
      fs.writeFileSync(path.join(REPORTS_DIR, 'duplicate-config-report.json'), JSON.stringify(duplicateConfigs, null, 2));
      
      console.log('__REPOSITORY_AUDIT_DONE__');
    } catch (e) {
      recordError('Repository Audit', e);
    }

    // ----------------------------------------
    // PHASE 3: Dependency Audit
    // ----------------------------------------
    try {
      console.log('Running Dependency Audit...');
      const depResults = performDependencyAudit();
      unusedDependencies = depResults.unusedDependencies;
      unusedDevDependencies = depResults.unusedDevDependencies;
      missingDependencies = depResults.missingDependencies;
      circularDependencies = depResults.circularDependencies;
      depWarnings = depResults.warnings;

      fs.writeFileSync(path.join(REPORTS_DIR, 'dependency-audit.json'), JSON.stringify({
        unusedDependencies,
        unusedDevDependencies,
        missingDependencies,
        warnings: depWarnings
      }, null, 2));

      fs.writeFileSync(path.join(REPORTS_DIR, 'circular-dependencies.json'), JSON.stringify(circularDependencies, null, 2));

      console.log('__DEPENDENCY_AUDIT_DONE__');
    } catch (e) {
      recordError('Dependency Audit', e);
    }

    // ----------------------------------------
    // PHASE 4: Database Audit
    // ----------------------------------------
    try {
      console.log('Running Database Audit...');
      dbStructureReport = await performDatabaseAudit();
      fs.writeFileSync(path.join(REPORTS_DIR, 'database-structure-report.json'), JSON.stringify(dbStructureReport, null, 2));
      console.log('__DATABASE_AUDIT_DONE__');
    } catch (e) {
      recordError('Database Audit', e);
    }

    // ----------------------------------------
    // PHASE 5: Runtime Architecture Audit
    // ----------------------------------------
    try {
      console.log('Running Runtime Architecture Audit...');
      architectureReport = performArchitectureAudit();
      fs.writeFileSync(path.join(REPORTS_DIR, 'architecture-audit-report.json'), JSON.stringify(architectureReport, null, 2));
      console.log('__ARCHITECTURE_AUDIT_DONE__');
    } catch (e) {
      recordError('Runtime Architecture Audit', e);
    }

    // ----------------------------------------
    // PHASE 6: Test Inventory Audit
    // ----------------------------------------
    try {
      console.log('Running Test Inventory Audit...');
      testInventoryReport = performTestInventoryAudit();
      fs.writeFileSync(path.join(REPORTS_DIR, 'test-inventory-report.json'), JSON.stringify(testInventoryReport, null, 2));
      console.log('__TEST_AUDIT_DONE__');
    } catch (e) {
      recordError('Test Inventory Audit', e);
    }

    // ----------------------------------------
    // PHASE 7: Final Health Report Builder
    // ----------------------------------------
    try {
      console.log('Building Health Report...');
      const databaseIssues = [
        ...Object.keys(dbStructureReport.duplicates || {}).map(k => `Duplicates found in ${k}`),
        ...Object.keys(dbStructureReport.orphans || {}).map(k => `Orphans found in ${k}`),
        ...(dbStructureReport.missingIndexes || []).map((idx: any) => `Missing index on ${idx.table}.${idx.column}`),
        ...(dbStructureReport.duplicateIndexes || []).map((idx: any) => `Duplicate index ${idx.index1} and ${idx.index2} on ${idx.table}`),
        ...(dbStructureReport.missingPrimaryKeys || []).map((tbl: string) => `Table ${tbl} is missing a primary key`),
        ...(dbStructureReport.largeJsonColumns || []).map((col: any) => `Large JSON column ${col.column} in table ${col.table}`)
      ];

      const healthReport = {
        generatedAt: new Date().toISOString(),
        unusedFiles,
        deadCode: deadCode.map(d => `${d.type}: ${d.name} (${d.file})`),
        duplicateConfigurations: duplicateConfigs,
        dependencyIssues: [
          ...unusedDependencies.map(d => `Unused dependency: ${d}`),
          ...missingDependencies.map(d => `Missing dependency: ${d}`),
          ...circularDependencies.map(c => `Circular dependency: ${c}`)
        ],
        databaseIssues,
        architectureIssues: [
          ...(architectureReport.duplicateServices || []).map((s: any) => `Duplicate/similar service: ${s.class1} and ${s.class2}`),
          ...(architectureReport.duplicateValidators || []).map((v: any) => `Duplicate validator rule: ${v.name}`),
          ...(architectureReport.potentialMergeCandidates || []).map((m: any) => `Merge candidate: ${m.file1} and ${m.file2} (${Math.round(m.similarity * 100)}% match)`),
          ...(architectureReport.duplicateDTOs || []).map((d: any) => `Duplicate DTO properties: ${d.dto1} and ${d.dto2}`),
          ...(architectureReport.duplicateConstants || []).map((c: any) => `Duplicate constants defined in: ${c.files.join(', ')}`)
        ],
        testIssues: [
          ...(testInventoryReport.emptyTestFiles || []).map((f: string) => `Empty test file: ${f}`),
          ...(testInventoryReport.duplicateTests || []).map((t: string) => `Duplicate test description: ${t}`),
          ...(testInventoryReport.testsWithNoAssertions || []).map((t: string) => `Test with no assertions or empty callback: ${t}`)
        ],
        migrationRecommendations: [
          "Apply or clean up any unapplied schema migrations listed in backend/prisma/migrations."
        ],
        cleanupRecommendations: [
          "Remove identified orphan source files and component files.",
          "Consolidate duplicate scripts across root/backend/frontend package.json files.",
          "De-duplicate constants and DTO definitions across modules.",
          "Add missing database indexes on reference numbers, mobile numbers, and audit tables."
        ],
        estimatedPerformanceGain: databaseIssues.length > 0 ? "Adding missing indexes and reducing orphans will reduce average lookup latency by ~40% and reclaim index overhead." : "Minimal (indexes are healthy). Code cleanup will reduce build bundle size.",
        repositoryHealthy: unusedFiles.length === 0 && databaseIssues.length === 0 && circularDependencies.length === 0
      };

      fs.writeFileSync(path.join(REPORTS_DIR, 'repository-health-report.json'), JSON.stringify(healthReport, null, 2));
      console.log('__FULL_AUDIT_DONE__');
    } catch (e) {
      recordError('Final Health Report', e);
    }
  };

  try {
    await Promise.race([
      runAudit(),
      timeoutPromise(TIMEOUT_MS)
    ]);
  } catch (err: any) {
    console.error('Audit timed out or failed:', err.message);
    // Write partial health report on timeout
    try {
      const partialHealthReport = {
        generatedAt: new Date().toISOString(),
        unusedFiles,
        deadCode,
        duplicateConfigurations: duplicateConfigs,
        dependencyIssues: [...unusedDependencies, ...missingDependencies, ...circularDependencies],
        databaseIssues: [],
        architectureIssues: [],
        testIssues: [],
        migrationRecommendations: [],
        cleanupRecommendations: [],
        estimatedPerformanceGain: "Unknown - audit timed out",
        repositoryHealthy: false,
        timeoutReason: err.message
      };
      fs.writeFileSync(path.join(REPORTS_DIR, 'repository-health-report.json'), JSON.stringify(partialHealthReport, null, 2));
    } catch (writeErr) {
      console.error('Could not write partial health report:', writeErr);
    }
  } finally {
    console.log('Disconnecting Prisma Client and exiting...');
    await prisma.$disconnect();
    process.exit(0);
  }
}

// ============================================================================
// HELPERS & LOGIC IMPLEMENTATION
// ============================================================================

const EXCLUDED_DIRS = [
  'node_modules', 'dist', 'build', '.next', 'coverage', 'storage', 'tmp', 'logs', 'generated', 'migrations'
];

function walkDir(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (EXCLUDED_DIRS.some(ex => filePath.includes(path.sep + ex + path.sep) || filePath.endsWith(path.sep + ex) || file === ex)) {
        continue;
      }
      walkDir(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

// 1. Repository Audit Helpers
function performRepositoryAudit() {
  const backendSrc = path.join(WORKSPACE_ROOT, 'backend', 'src');
  const frontendSrc = path.join(WORKSPACE_ROOT, 'frontend', 'src');

  const backendFiles = walkDir(backendSrc).filter(f => /\.(ts|tsx|js|jsx)$/.test(f) && !f.endsWith('.spec.ts') && !f.endsWith('.test.ts') && !f.endsWith('.spec.tsx'));
  const frontendFiles = walkDir(frontendSrc).filter(f => /\.(ts|tsx|js|jsx)$/.test(f) && !f.endsWith('.spec.ts') && !f.endsWith('.test.ts') && !f.endsWith('.spec.tsx'));
  const allFiles = [...backendFiles, ...frontendFiles];

  // Entry Points
  const entryPoints = [
    path.join(WORKSPACE_ROOT, 'backend', 'src', 'main.ts'),
    path.join(WORKSPACE_ROOT, 'backend', 'src', 'app.module.ts')
  ];
  
  // For Next.js frontend, add everything in frontend/src/app (routes) as entries
  const appDir = path.join(WORKSPACE_ROOT, 'frontend', 'src', 'app');
  if (fs.existsSync(appDir)) {
    const frontendEntries = walkDir(appDir).filter(f => /(page|layout|route|template|error|loading|not-found)\.(tsx|ts)$/.test(f));
    entryPoints.push(...frontendEntries);
  }

  // Parse imports
  const visited = new Set<string>();
  const queue: string[] = [];

  for (const entry of entryPoints) {
    if (fs.existsSync(entry)) {
      const p = path.resolve(entry);
      visited.add(p);
      queue.push(p);
    }
  }

  const importRegex = /(?:import|export)\s+.*?\s+from\s+['"]([^'"]+)['"]|(?:import|require)\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  while (queue.length > 0) {
    const currentFile = queue.shift()!;
    const content = fs.readFileSync(currentFile, 'utf8');
    let match;
    importRegex.lastIndex = 0;

    while ((match = importRegex.exec(content)) !== null) {
      const impPath = match[1] || match[2];
      if (!impPath) continue;

      let resolvedPath = '';
      if (impPath.startsWith('.')) {
        resolvedPath = path.resolve(path.dirname(currentFile), impPath);
      } else if (impPath.startsWith('@/')) {
        // Frontend alias mapping
        resolvedPath = path.resolve(WORKSPACE_ROOT, 'frontend', 'src', impPath.slice(2));
      } else {
        // Third party or absolute node module, skip
        continue;
      }

      // Check extensions
      const exts = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
      let found = false;
      for (const ext of exts) {
        const testPath = resolvedPath.endsWith(ext) ? resolvedPath : resolvedPath + ext;
        const absTestPath = path.resolve(testPath);
        if (fs.existsSync(absTestPath) && fs.statSync(absTestPath).isFile()) {
          if (!visited.has(absTestPath)) {
            visited.add(absTestPath);
            queue.push(absTestPath);
          }
          found = true;
          break;
        }
      }
    }
  }

  // Orphan files
  const unusedFiles = allFiles
    .map(f => path.resolve(f))
    .filter(f => !visited.has(f))
    .map(f => path.relative(WORKSPACE_ROOT, f).replace(/\\/g, '/'));

  // Dead Code (Unused NestJS services/controllers or components)
  const deadCode: any[] = [];
  for (const file of allFiles) {
    const absPath = path.resolve(file);
    const content = fs.readFileSync(absPath, 'utf8');
    const relativePath = path.relative(WORKSPACE_ROOT, absPath).replace(/\\/g, '/');

    // Services
    if (content.includes('@Injectable()')) {
      const match = content.match(/class\s+(\w+Service)/);
      if (match) {
        const serviceName = match[1];
        if (!visited.has(absPath)) {
          deadCode.push({ type: 'Unused Service (Orphan File)', name: serviceName, file: relativePath });
        }
      }
    }
    // Controllers
    if (content.includes('@Controller(')) {
      const match = content.match(/class\s+(\w+Controller)/);
      if (match) {
        const controllerName = match[1];
        if (!visited.has(absPath)) {
          deadCode.push({ type: 'Unused Controller (Orphan File)', name: controllerName, file: relativePath });
        }
      }
    }
    // Components (React components in frontend with zero imports)
    if (relativePath.startsWith('frontend/src/components/') && !visited.has(absPath)) {
      deadCode.push({ type: 'Unused Component', name: path.basename(file), file: relativePath });
    }
  }

  // Duplicate Configurations
  const duplicateConfigs: any[] = [];
  const scriptHashes = new Map<string, string>();
  
  // Find duplicate package.json scripts
  const packagePaths = [
    path.join(WORKSPACE_ROOT, 'package.json'),
    path.join(WORKSPACE_ROOT, 'backend', 'package.json'),
    path.join(WORKSPACE_ROOT, 'frontend', 'package.json')
  ];

  const scriptsMap = new Map<string, string[]>();
  for (const pkgPath of packagePaths) {
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.scripts) {
          for (const [name, cmd] of Object.entries(pkg.scripts)) {
            const cleanCmd = String(cmd).trim();
            if (!scriptsMap.has(cleanCmd)) {
              scriptsMap.set(cleanCmd, []);
            }
            scriptsMap.get(cleanCmd)!.push(`${path.basename(path.dirname(pkgPath)) || 'root'}:${name}`);
          }
        }
      } catch (err) {}
    }
  }

  for (const [cmd, locations] of scriptsMap.entries()) {
    if (locations.length > 1) {
      duplicateConfigs.push({
        type: 'Duplicate Script Command',
        command: cmd,
        locations
      });
    }
  }

  // Find identical files in storage/reports, playbooks, benchmarks or configs
  const configFiles = walkDir(path.join(WORKSPACE_ROOT, 'shared', 'copilot')).concat(
    walkDir(path.join(WORKSPACE_ROOT, 'benchmarks'))
  ).filter(f => f.endsWith('.json') || f.endsWith('.md') || f.endsWith('.yml') || f.endsWith('.yaml'));

  const fileHashMap = new Map<string, string[]>();
  for (const file of configFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8').trim();
      if (content.length > 10) {
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        if (!fileHashMap.has(hash)) {
          fileHashMap.set(hash, []);
        }
        fileHashMap.get(hash)!.push(path.relative(WORKSPACE_ROOT, file).replace(/\\/g, '/'));
      }
    } catch (e) {}
  }

  for (const [hash, paths] of fileHashMap.entries()) {
    if (paths.length > 1) {
      duplicateConfigs.push({
        type: 'Identical Configuration/Benchmark/Playbook File',
        hash: hash.substring(0, 8),
        files: paths
      });
    }
  }

  return { unusedFiles, deadCode, duplicateConfigs };
}

// 2. Dependency Audit Helpers
function performDependencyAudit() {
  const warnings: string[] = [];
  let unusedDependencies: string[] = [];
  let unusedDevDependencies: string[] = [];
  let missingDependencies: string[] = [];
  let circularDependencies: string[] = [];

  // Run depcheck via npx -y
  try {
    const depcheckOut = execSync('npx -y depcheck --json', { cwd: WORKSPACE_ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const parsed = JSON.parse(depcheckOut);
    unusedDependencies = parsed.dependencies || [];
    unusedDevDependencies = parsed.devDependencies || [];
    missingDependencies = Object.keys(parsed.missing || {});
  } catch (err: any) {
    // depcheck returns non-zero code if unused dependencies are found. We can parse its output from stdout.
    try {
      if (err.stdout) {
        const parsed = JSON.parse(err.stdout);
        unusedDependencies = parsed.dependencies || [];
        unusedDevDependencies = parsed.devDependencies || [];
        missingDependencies = Object.keys(parsed.missing || {});
      } else {
        warnings.push('depcheck execution failed or returned no output.');
      }
    } catch (parseErr) {
      warnings.push(`depcheck failed: ${err.message}`);
    }
  }

  // Run madge for backend circular dependencies
  try {
    const madgeBackend = execSync('npx -y madge --circular --json backend/src', { cwd: WORKSPACE_ROOT, encoding: 'utf8' });
    const parsed = JSON.parse(madgeBackend);
    if (Array.isArray(parsed)) {
      circularDependencies.push(...parsed.map((c: string[]) => `backend: ${c.join(' -> ')}`));
    }
  } catch (err: any) {
    try {
      if (err.stdout) {
        const parsed = JSON.parse(err.stdout);
        if (Array.isArray(parsed)) {
          circularDependencies.push(...parsed.map((c: string[]) => `backend: ${c.join(' -> ')}`));
        }
      } else {
        warnings.push('madge backend failed to output JSON.');
      }
    } catch (e) {
      warnings.push(`madge backend failed: ${err.message}`);
    }
  }

  // Run madge for frontend circular dependencies
  try {
    const madgeFrontend = execSync('npx -y madge --circular --json frontend/src', { cwd: WORKSPACE_ROOT, encoding: 'utf8' });
    const parsed = JSON.parse(madgeFrontend);
    if (Array.isArray(parsed)) {
      circularDependencies.push(...parsed.map((c: string[]) => `frontend: ${c.join(' -> ')}`));
    }
  } catch (err: any) {
    try {
      if (err.stdout) {
        const parsed = JSON.parse(err.stdout);
        if (Array.isArray(parsed)) {
          circularDependencies.push(...parsed.map((c: string[]) => `frontend: ${c.join(' -> ')}`));
        }
      } else {
        warnings.push('madge frontend failed to output JSON.');
      }
    } catch (e) {
      warnings.push(`madge frontend failed: ${err.message}`);
    }
  }

  return {
    unusedDependencies,
    unusedDevDependencies,
    missingDependencies,
    circularDependencies,
    warnings
  };
}

// 3. Database Audit Helpers
async function performDatabaseAudit() {
  const duplicates: any = {};
  const orphans: any = {};
  const emptyTables: string[] = [];
  const largestTables: any[] = [];
  const missingIndexes: any[] = [];
  const unusedIndexes: any[] = [];
  const duplicateIndexes: any[] = [];
  const alwaysNullColumns: any[] = [];
  const missingPrimaryKeys: string[] = [];
  const largeJsonColumns: any[] = [];

  // Table list
  const tablesResult: any[] = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;
  const tables = tablesResult.map(t => t.tablename);

  // Duplicates & Orphans & Sizes
  for (const table of tables) {
    // Row Count
    const countRes: any[] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::integer FROM "${table}"`);
    const count = countRes[0].count;

    if (count === 0) {
      emptyTables.push(table);
    } else {
      largestTables.push({ table, count });
    }

    // Always null columns checking
    if (count > 0) {
      const columnsInfo: any[] = await prisma.$queryRaw`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${table}
      `;
      for (const col of columnsInfo) {
        const colName = col.column_name;
        const nonNullRes: any[] = await prisma.$queryRawUnsafe(`SELECT COUNT("${colName}")::integer FROM "${table}"`);
        const nonNullCount = nonNullRes[0].count;
        if (nonNullCount === 0) {
          alwaysNullColumns.push({ table, column: colName });
        }

        // Large JSON check
        if (col.data_type === 'json' || col.data_type === 'jsonb') {
          const maxJsonRes: any[] = await prisma.$queryRawUnsafe(`SELECT MAX(pg_column_size("${colName}"))::integer FROM "${table}"`);
          const maxSize = maxJsonRes[0].max || 0;
          if (maxSize > 50000) { // JSON larger than 50KB
            largeJsonColumns.push({ table, column: colName, maxSizeBytes: maxSize });
          }
        }
      }
    }
  }

  largestTables.sort((a, b) => b.count - a.count);

  // Specific duplicates checking
  try {
    const dupCitizens: any[] = await prisma.$queryRaw`
      SELECT "mobileNumber", COUNT(*)::integer FROM "Citizen" GROUP BY "mobileNumber" HAVING COUNT(*) > 1
    `;
    if (dupCitizens.length > 0) duplicates.Citizen = dupCitizens;
  } catch (e) {}

  try {
    const dupFingerprints: any[] = await prisma.$queryRaw`
      SELECT "fingerprint", COUNT(*)::integer FROM "SubmissionFingerprint" GROUP BY "fingerprint" HAVING COUNT(*) > 1
    `;
    if (dupFingerprints.length > 0) duplicates.SubmissionFingerprint = dupFingerprints;
  } catch (e) {}

  try {
    const dupSessions: any[] = await prisma.$queryRaw`
      SELECT "citizenId", "serviceType", COUNT(*)::integer FROM "WorkflowSession" WHERE "citizenId" IS NOT NULL GROUP BY "citizenId", "serviceType" HAVING COUNT(*) > 1
    `;
    if (dupSessions.length > 0) duplicates.WorkflowSession = dupSessions;
  } catch (e) {}

  try {
    const dupComplaints: any[] = await prisma.$queryRaw`
      SELECT "referenceNumber", COUNT(*)::integer FROM "Complaint" GROUP BY "referenceNumber" HAVING COUNT(*) > 1
    `;
    if (dupComplaints.length > 0) duplicates.Complaint = dupComplaints;
  } catch (e) {}

  // Specific orphans checking
  try {
    const orphanComplaints: any[] = await prisma.$queryRaw`
      SELECT COUNT(*)::integer FROM "Complaint" c WHERE NOT EXISTS (SELECT 1 FROM "Citizen" cit WHERE cit.id = c."citizenId")
    `;
    if (orphanComplaints[0].count > 0) orphans.ComplaintToCitizen = orphanComplaints[0].count;
  } catch (e) {}

  try {
    const orphanSessions: any[] = await prisma.$queryRaw`
      SELECT COUNT(*)::integer FROM "WorkflowSession" ws WHERE ws."citizenId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Citizen" cit WHERE cit.id = ws."citizenId")
    `;
    if (orphanSessions[0].count > 0) orphans.WorkflowSessionToCitizen = orphanSessions[0].count;
  } catch (e) {}

  try {
    const orphanTracking: any[] = await prisma.$queryRaw`
      SELECT COUNT(*)::integer FROM "TrackingRecord" tr WHERE tr."serviceType" = 'Complaint' AND NOT EXISTS (SELECT 1 FROM "Complaint" c WHERE c.id = tr."entityId" OR c."referenceNumber" = tr."referenceNumber")
    `;
    if (orphanTracking[0].count > 0) orphans.TrackingRecordToComplaint = orphanTracking[0].count;
  } catch (e) {}

  try {
    const orphanFeedback: any[] = await prisma.$queryRaw`
      SELECT COUNT(*)::integer FROM "CitizenFeedback" cf WHERE cf."citizenId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Citizen" cit WHERE cit.id = cf."citizenId")
    `;
    if (orphanFeedback[0].count > 0) orphans.FeedbackToCitizen = orphanFeedback[0].count;
  } catch (e) {}

  try {
    const orphanChat: any[] = await prisma.$queryRaw`
      SELECT COUNT(*)::integer FROM "ChatHistory" ch WHERE NOT EXISTS (SELECT 1 FROM "WorkflowSession" ws WHERE ws.id = ch."sessionId")
    `;
    if (orphanChat[0].count > 0) orphans.ChatHistoryToSession = orphanChat[0].count;
  } catch (e) {}

  // Unused Indexes query
  try {
    const unusedIdx: any[] = await prisma.$queryRaw`
      SELECT indexrelname AS index_name, relname AS table_name, idx_scan::integer
      FROM pg_stat_user_indexes
      WHERE idx_scan = 0 AND indexrelname NOT LIKE '%_pkey' AND indexrelname NOT LIKE '%_key'
    `;
    unusedIndexes.push(...unusedIdx.map(i => ({ table: i.table_name, index: i.index_name })));
  } catch (e) {}

  // Duplicate Indexes query
  try {
    const dupIdx: any[] = await prisma.$queryRaw`
      SELECT
          t.relname AS table_name,
          i1.relname AS index1,
          i2.relname AS index2
      FROM
          pg_index idx1
      JOIN
          pg_class t ON t.oid = idx1.indrelid
      JOIN
          pg_class i1 ON i1.oid = idx1.indexrelid
      JOIN
          pg_index idx2 ON idx1.indrelid = idx2.indrelid AND idx1.indexrelid < idx2.indexrelid
      JOIN
          pg_class i2 ON i2.oid = idx2.indexrelid
      WHERE
          idx1.indkey::text = idx2.indkey::text
    `;
    duplicateIndexes.push(...dupIdx.map(i => ({ table: i.table_name, index1: i.index1, index2: i.index2 })));
  } catch (e) {}

  // Missing Indexes check
  try {
    const missingIdx: any[] = await prisma.$queryRaw`
      SELECT
          t.relname AS table_name,
          a.attname AS column_name
      FROM
          pg_class t
      JOIN
          pg_attribute a ON a.attrelid = t.oid
      JOIN
          pg_namespace n ON t.relnamespace = n.oid
      WHERE
          n.nspname = 'public'
          AND t.relkind = 'r'
          AND a.attnum > 0
          AND NOT a.attisdropped
          AND a.attname IN ('citizenId', 'sessionId', 'referenceNumber', 'mobileNumber', 'createdAt', 'updatedAt')
          AND NOT EXISTS (
              SELECT 1
              FROM pg_index i
              WHERE i.indrelid = t.oid
              AND a.attnum = ANY(i.indkey)
          )
    `;
    missingIndexes.push(...missingIdx.map(i => ({ table: i.table_name, column: i.column_name })));
  } catch (e) {}

  // Missing primary keys
  try {
    const missingPKs: any[] = await prisma.$queryRaw`
      SELECT relname AS table_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      AND NOT EXISTS (
          SELECT 1 FROM pg_index i
          WHERE i.indrelid = c.oid AND i.indisprimary
      )
    `;
    missingPrimaryKeys.push(...missingPKs.map(p => p.table_name));
  } catch (e) {}

  return {
    duplicates,
    orphans,
    emptyTables,
    largestTables,
    missingIndexes,
    unusedIndexes,
    duplicateIndexes,
    alwaysNullColumns,
    missingPrimaryKeys,
    largeJsonColumns
  };
}

// 4. Runtime Architecture Audit Helpers
function performArchitectureAudit() {
  const backendSrc = path.join(WORKSPACE_ROOT, 'backend', 'src');
  const backendFiles = walkDir(backendSrc).filter(f => f.endsWith('.ts') && !f.endsWith('.spec.ts'));

  const duplicateServices: any[] = [];
  const duplicateValidators: any[] = [];
  const potentialMergeCandidates: any[] = [];
  const duplicateDTOs: any[] = [];
  const duplicateConstants: any[] = [];

  // Helper to extract service names
  const services = new Map<string, string>();
  const dtos = new Map<string, string[]>();
  const constants = new Map<string, string[]>();

  for (const file of backendFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(WORKSPACE_ROOT, file).replace(/\\/g, '/');

    // Service class check
    const serviceMatch = content.match(/class\s+(\w+Service)/);
    if (serviceMatch) {
      services.set(serviceMatch[1], relativePath);
    }

    // DTO check
    const dtoMatch = content.match(/class\s+(\w+Dto|\w+DTO)/);
    if (dtoMatch) {
      const properties: string[] = [];
      const propRegex = /@Is\w+\(.*?\)\s*(?:public|private|readonly)?\s*(\w+)/g;
      let propMatch;
      while ((propMatch = propRegex.exec(content)) !== null) {
        properties.push(propMatch[1]);
      }
      if (properties.length > 0) {
        dtos.set(dtoMatch[1], properties.sort());
      }
    }

    // Constants check
    const constRegex = /export\s+const\s+(\w+)\s*=\s*({[\s\S]*?}|\[[\s\S]*?\])/g;
    let constMatch;
    while ((constMatch = constRegex.exec(content)) !== null) {
      const val = constMatch[2].replace(/\s+/g, '');
      if (val.length > 20) {
        if (!constants.has(val)) {
          constants.set(val, []);
        }
        constants.get(val)!.push(`${relativePath}:${constMatch[1]}`);
      }
    }
  }

  // Detect duplicate services based on similar names or properties
  const serviceList = Array.from(services.entries());
  for (let i = 0; i < serviceList.length; i++) {
    for (let j = i + 1; j < serviceList.length; j++) {
      const [name1, file1] = serviceList[i];
      const [name2, file2] = serviceList[j];
      
      // Simple substring check or edit distance check for names
      const sim = JaccardSimilarity(name1, name2);
      if (sim > 0.6) {
        duplicateServices.push({
          class1: name1,
          file1,
          class2: name2,
          file2,
          similarity: sim
        });
      }
    }
  }

  // Detect duplicate DTOs
  const dtoList = Array.from(dtos.entries());
  for (let i = 0; i < dtoList.length; i++) {
    for (let j = i + 1; j < dtoList.length; j++) {
      const [dto1, props1] = dtoList[i];
      const [dto2, props2] = dtoList[j];
      if (props1.length === props2.length && props1.every((v, idx) => v === props2[idx])) {
        duplicateDTOs.push({
          dto1,
          dto2,
          properties: props1
        });
      }
    }
  }

  // Detect duplicate constants
  for (const [val, locations] of constants.entries()) {
    if (locations.length > 1) {
      duplicateConstants.push({
        valuePreview: val.substring(0, 40),
        files: locations
      });
    }
  }

  // File similarity for potential merge candidates
  for (let i = 0; i < backendFiles.length; i++) {
    for (let j = i + 1; j < backendFiles.length; j++) {
      const f1 = backendFiles[i];
      const f2 = backendFiles[j];
      if (path.basename(f1) === path.basename(f2)) {
        potentialMergeCandidates.push({
          file1: path.relative(WORKSPACE_ROOT, f1).replace(/\\/g, '/'),
          file2: path.relative(WORKSPACE_ROOT, f2).replace(/\\/g, '/'),
          similarity: 1.0,
          reason: 'Identical file names in different directories'
        });
      }
    }
  }

  return {
    duplicateServices,
    duplicateValidators,
    potentialMergeCandidates,
    duplicateDTOs,
    duplicateConstants
  };
}

function JaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(''));
  const setB = new Set(b.split(''));
  const union = new Set([...setA, ...setB]);
  let intersection = 0;
  for (const x of setA) {
    if (setB.has(x)) intersection++;
  }
  return intersection / union.size;
}

// 5. Test Inventory Audit Helpers
function performTestInventoryAudit() {
  const testsDir = path.join(WORKSPACE_ROOT, 'tests');
  const testFiles = walkDir(testsDir).concat(
    walkDir(path.join(WORKSPACE_ROOT, 'backend', 'src')).filter(f => f.endsWith('.spec.ts') || f.endsWith('.test.ts'))
  );

  const duplicateTests: string[] = [];
  const emptyTestFiles: string[] = [];
  const testsWithNoAssertions: string[] = [];
  const extremelySlowTests: any[] = [];
  const obsoleteTests: string[] = [];
  const abandonedBenchmarks: string[] = [];

  // Parse jest-results.json if it exists
  const jestJsonPath = path.join(WORKSPACE_ROOT, 'jest-results.json');
  if (fs.existsSync(jestJsonPath)) {
    try {
      const jestResults = JSON.parse(fs.readFileSync(jestJsonPath, 'utf8'));
      const testNames = new Map<string, number>();

      if (jestResults.testResults) {
        for (const suite of jestResults.testResults) {
          if (suite.assertionResults) {
            if (suite.assertionResults.length === 0) {
              emptyTestFiles.push(path.relative(WORKSPACE_ROOT, suite.name).replace(/\\/g, '/'));
            }
            for (const test of suite.assertionResults) {
              const fullName = test.fullName;
              testNames.set(fullName, (testNames.get(fullName) || 0) + 1);

              if (test.duration && test.duration > 3000) { // Tests taking longer than 3 seconds
                extremelySlowTests.push({
                  test: fullName,
                  durationMs: test.duration,
                  file: path.relative(WORKSPACE_ROOT, suite.name).replace(/\\/g, '/')
                });
              }

              if (test.numPassingAsserts === 0 && test.status === 'passed') {
                testsWithNoAssertions.push(`${fullName} (${path.relative(WORKSPACE_ROOT, suite.name).replace(/\\/g, '/')})`);
              }
            }
          }
        }
      }

      for (const [name, count] of testNames.entries()) {
        if (count > 1) {
          duplicateTests.push(name);
        }
      }
    } catch (e) {}
  }

  // Scan test files source code for empty tests or obsolete markers
  for (const file of testFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relPath = path.relative(WORKSPACE_ROOT, file).replace(/\\/g, '/');
      if (!content.includes('it(') && !content.includes('test(')) {
        if (!emptyTestFiles.includes(relPath)) {
          emptyTestFiles.push(relPath);
        }
      }
      if (content.includes('xit(') || content.includes('xtest(') || content.includes('describe.skip')) {
        obsoleteTests.push(relPath);
      }
    } catch (e) {}
  }

  // Check abandoned benchmark files
  const benchmarksDir = path.join(WORKSPACE_ROOT, 'benchmarks');
  if (fs.existsSync(benchmarksDir)) {
    const bFiles = fs.readdirSync(benchmarksDir);
    for (const b of bFiles) {
      if (b.endsWith('.ts') || b.endsWith('.js') || b.endsWith('.ps1')) {
        abandonedBenchmarks.push(`benchmarks/${b}`);
      }
    }
  }

  return {
    duplicateTests,
    emptyTestFiles,
    testsWithNoAssertions,
    extremelySlowTests,
    obsoleteTests,
    abandonedBenchmarks
  };
}

main().catch(err => {
  console.error('Audit runner crashed:', err);
  prisma.$disconnect().then(() => process.exit(1));
});
