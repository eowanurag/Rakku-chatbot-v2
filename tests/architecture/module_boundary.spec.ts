import * as fs from 'fs';
import * as path from 'path';

describe('Architecture Boundary Verification', () => {
  const srcDir = path.resolve(__dirname, '../../backend/src');

  function getFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getFiles(filePath));
      } else if (filePath.endsWith('.ts') && !filePath.endsWith('.spec.ts')) {
        results.push(filePath);
      }
    });
    return results;
  }

  it('should guarantee that Copilot layer has no imports referencing the Workflows layer', () => {
    const copilotDir = path.join(srcDir, 'copilot');
    if (!fs.existsSync(copilotDir)) {
      // If folder not created or empty, skip or pass
      return;
    }

    const copilotFiles = getFiles(copilotDir);
    copilotFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line) => {
        if (line.trim().startsWith('import ')) {
          expect(line).not.toContain('/workflows/');
          expect(line).not.toContain('../workflows');
        }
      });
    });
  });

  it('should guarantee that Workflows layer has no imports referencing the Copilot layer', () => {
    const workflowsDir = path.join(srcDir, 'workflows');
    if (!fs.existsSync(workflowsDir)) {
      return;
    }

    const workflowsFiles = getFiles(workflowsDir);
    workflowsFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line) => {
        if (line.trim().startsWith('import ')) {
          expect(line).not.toContain('/copilot/');
          expect(line).not.toContain('../copilot');
        }
      });
    });
  });
});
