import * as fs from 'fs';
import * as path from 'path';

describe('CUE Architecture Separation Boundary Verification', () => {
  it('should guarantee runtime source files do not import DB entities or governance services for lookup', () => {
    const runtimeDir = path.resolve(__dirname, '../../backend/src/copilot/cue/runtime');
    const files = fs.readdirSync(runtimeDir);

    for (const file of files) {
      if (file.endsWith('.ts')) {
        const content = fs.readFileSync(path.join(runtimeDir, file), 'utf8');
        
        // Assert no imports of governance classes
        expect(content).not.toContain('dictionary-governance');
        expect(content).not.toContain('dictionary-lifecycle');
        expect(content).not.toContain('dictionary-export');

        // Normalizer modules must not have prisma lookup queries
        if (file.includes('normalizer') || file.includes('resolver') || file.includes('validator')) {
          expect(content).not.toContain('prisma.understandingTerm');
          expect(content).not.toContain('prisma.understandingCandidate');
        }
      }
    }
  });
});
