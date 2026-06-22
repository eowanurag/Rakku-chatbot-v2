import * as fs from 'fs';
import * as path from 'path';

function main() {
  const rootDir = path.resolve(__dirname, '..');
  const certPath = path.join(rootDir, 'storage/reports/orphan-file-certification.json');
  
  if (!fs.existsSync(certPath)) {
    console.error('Certification report not found.');
    process.exit(1);
  }

  const cert = JSON.parse(fs.readFileSync(certPath, 'utf8'));
  const safeToDelete: string[] = cert.safeToDelete || [];
  const manualReview: string[] = cert.manualReview || [];
  
  const archiveDir = path.join(rootDir, 'storage/archive');
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  const archived: string[] = [];
  const remaining: string[] = [];

  for (const relPath of safeToDelete) {
    const fullPath = path.join(rootDir, relPath);
    if (fs.existsSync(fullPath)) {
      const destPath = path.join(archiveDir, relPath);
      const destDir = path.dirname(destPath);
      
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      fs.renameSync(fullPath, destPath);
      archived.push(relPath);
      console.log(`Archived: ${relPath} -> storage/archive/${relPath}`);
    } else {
      remaining.push(relPath);
    }
  }

  const report = {
    archived,
    remaining,
    manualReview,
    rollbackPath: "storage/archive"
  };

  const reportsDir = path.join(rootDir, 'storage/reports');
  fs.writeFileSync(
    path.join(reportsDir, 'orphan-cleanup-report.json'),
    JSON.stringify(report, null, 2),
    'utf8'
  );

  console.log('Orphan file archiving complete.');
  console.log('__ORPHAN_ARCHIVE_DONE__');
}

main();
