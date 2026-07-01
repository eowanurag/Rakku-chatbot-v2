import * as fs from 'fs';
import * as path from 'path';

describe('V2.8.6 Orchestrator Only Gate', () => {
  it('should enforce that ChatService never mutates workflowContext.state directly', () => {
    const filePath = path.resolve(__dirname, '../../backend/src/chat/chat.service.ts');
    const content = fs.readFileSync(filePath, 'utf8');

    // Ensure no direct mutations like "workflowContext.state =" exist
    const stateMutationRegex = /\.workflowContext(\??)\.state\s*=/;
    expect(content).not.toMatch(stateMutationRegex);
  });

  it('should verify that ChatService only imports renderers directly, not via business services', () => {
    const rootDir = path.resolve(__dirname, '../../backend/src');

    // Check all services under copilot/business/etc. to make sure they do not import renderers
    const checkFile = (filePath: string) => {
      if (fs.statSync(filePath).isDirectory()) {
        fs.readdirSync(filePath).forEach(child => checkFile(path.join(filePath, child)));
      } else if (filePath.endsWith('.service.ts') && !filePath.includes('chat.service.ts')) {
        const content = fs.readFileSync(filePath, 'utf8');
        const matches = content.match(/import.*from.*renderer/g);
        expect(matches).toBeNull();
      }
    };

    checkFile(rootDir);
  });
});
