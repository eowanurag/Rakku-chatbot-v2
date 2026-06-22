import * as fs from 'fs';
import * as path from 'path';

function main() {
  const rootDir = path.resolve(__dirname, '..');
  const obsoleteFiles = [
    'tests/reporting/deployment_readiness_report.ts',
    'tests/helpers/prisma-test-helper.ts'
  ];
  
  const archiveDir = path.join(rootDir, 'storage/archive');

  for (const relPath of obsoleteFiles) {
    const fullPath = path.join(rootDir, relPath);
    if (fs.existsSync(fullPath)) {
      const destPath = path.join(archiveDir, relPath);
      const destDir = path.dirname(destPath);
      
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      fs.renameSync(fullPath, destPath);
      console.log(`Archived obsolete test file: ${relPath} -> storage/archive/${relPath}`);
    }
  }

  // Also verify setup.ts is ignored by configuring jest config ignore patterns if needed
  console.log('Obsolete test archiving complete.');
  console.log('__TEST_ARCHIVE_DONE__');
}

main();
