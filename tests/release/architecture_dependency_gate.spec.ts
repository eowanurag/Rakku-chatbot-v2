import * as fs from 'fs';
import * as path from 'path';

describe('Release - Architecture Dependency Gate', () => {
  it('should enforce that WorkflowManager and Renderer have no higher-level imports', () => {
    const managerContent = fs.readFileSync(path.resolve('backend/src/chat/services/citizen-workflow-manager.service.ts'), 'utf8');
    const rendererContent = fs.readFileSync(path.resolve('backend/src/chat/utils/review-renderer.ts'), 'utf8');

    expect(managerContent).not.toContain("import { ChatService }");
    expect(rendererContent).not.toContain("import { CitizenWorkflowManager }");
  });
});
