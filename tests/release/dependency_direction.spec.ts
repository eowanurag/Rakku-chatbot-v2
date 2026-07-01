import * as fs from 'fs';
import * as path from 'path';

describe('V2.8.6 Dependency Direction Gate', () => {
  it('should enforce that CitizenWorkflowManager never imports Copilot, Gemini, FastAPI, or LLMs', () => {
    const filePath = path.resolve(__dirname, '../../backend/src/chat/services/citizen-workflow-manager.service.ts');
    const content = fs.readFileSync(filePath, 'utf8');

    // Manager should not import from copilot directory or AI clients
    const matches = content.match(/import.*from.*(copilot|gemini|fastapi|ai-classifier|intelligence)/g);
    expect(matches).toBeNull();
  });

  it('should enforce that Renderer never imports WorkflowManager, AI, or Business Services', () => {
    const files = ['review-renderer.ts', 'menu-renderer.ts', 'recovery-renderer.ts'];
    for (const file of files) {
      const filePath = path.resolve(__dirname, `../../backend/src/chat/utils/${file}`);
      const content = fs.readFileSync(filePath, 'utf8');

      const matches = content.match(/import.*from.*(citizen-workflow-manager|copilot|ai|business|consensus|duplicate)/g);
      expect(matches).toBeNull();
    }
  });

  it('should enforce that Business Services never mutate workflowContext', () => {
    // Check key services like DuplicateComplaintService, incidentClusteringService, etc.
    const rootDir = path.resolve(__dirname, '../../backend/src');
    
    const checkFile = (filePath: string) => {
      if (fs.statSync(filePath).isDirectory()) {
        fs.readdirSync(filePath).forEach(child => checkFile(path.join(filePath, child)));
      } else if (filePath.endsWith('.service.ts') && !filePath.includes('citizen-workflow-manager') && !filePath.includes('chat.service.ts')) {
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).not.toContain('.workflowContext =');
        expect(content).not.toContain('.workflowContext?.state =');
      }
    };

    checkFile(rootDir);
  });
});
