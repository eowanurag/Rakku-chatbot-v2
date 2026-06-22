import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(WORKSPACE_ROOT, 'storage', 'reports');

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

const EXCLUDED_DIRS = [
  'node_modules', 'dist', 'build', '.next', 'coverage', 'storage', 'tmp', 'logs', 'generated', '.git'
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

function classifyFile(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const relPath = path.relative(WORKSPACE_ROOT, filePath).replace(/\\/g, '/');
  
  if (relPath.includes('backend/prisma/migrations/')) return 'migration';
  if (relPath.startsWith('tests/') || relPath.endsWith('.spec.ts') || relPath.endsWith('.test.ts') || relPath.endsWith('.spec.tsx')) return 'test';
  if (relPath.includes('storage/reports/')) return 'report';
  if (['.json', '.yml', '.yaml', '.config.js', '.config.ts'].some(cfg => relPath.endsWith(cfg)) && !relPath.startsWith('storage/reports/')) return 'config';
  if (['.png', '.jpg', '.jpeg', '.svg', '.gif', '.ico'].includes(ext)) return 'asset';
  if (['.ts', '.tsx', '.js', '.jsx', '.py'].includes(ext)) return 'source';
  return 'generated';
}

function main() {
  console.log('Generating repository manifest...');

  const allFiles = walkDir(WORKSPACE_ROOT);
  const filesData: any[] = [];
  const hashCount = new Map<string, string[]>();

  for (const file of allFiles) {
    try {
      const stat = fs.statSync(file);
      const content = fs.readFileSync(file);
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      const relPath = path.relative(WORKSPACE_ROOT, file).replace(/\\/g, '/');
      const classification = classifyFile(file);

      // Find imports count (rough estimation)
      let imports = 0;
      if (classification === 'source' || classification === 'test') {
        const text = content.toString('utf8');
        const match = text.match(/(?:import|require)\b/g);
        imports = match ? match.length : 0;
      }

      filesData.push({
        path: relPath,
        hash,
        size: stat.size,
        type: path.extname(file),
        classification,
        imports,
        exportedSymbols: [],
        lastModified: stat.mtime.toISOString()
      });

      if (!hashCount.has(hash)) {
        hashCount.set(hash, []);
      }
      hashCount.get(hash)!.push(relPath);
    } catch (e) {}
  }

  // Calculate score
  const duplicates = Array.from(hashCount.values()).filter(arr => arr.length > 1).length;
  const repositoryHealthScore = Math.max(0, 100 - (duplicates * 5));

  const manifest = {
    generatedAt: new Date().toISOString(),
    gitCommit: process.env.COMMIT_SHA || "dev-latest",
    repositoryHealthScore,
    files: filesData
  };

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'repository-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  // Store history
  const historyPath = path.join(REPORTS_DIR, 'repository-manifest-history.json');
  let history: any[] = [];
  if (fs.existsSync(historyPath)) {
    try {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      if (!Array.isArray(history)) history = [];
    } catch (e) {}
  }

  history.push({
    timestamp: manifest.generatedAt,
    gitCommit: manifest.gitCommit,
    repositoryHealthScore: manifest.repositoryHealthScore,
    filesCount: filesData.length
  });

  if (history.length > 500) {
    history = history.slice(-500);
  }

  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

  console.log('__REPOSITORY_MANIFEST_DONE__');
}

main();
