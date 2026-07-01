import * as fs from 'fs';
import * as path from 'path';

describe('V2.8.6 ChatService Complexity Gate', () => {
  let content: string;

  beforeAll(() => {
    const filePath = path.resolve(__dirname, '../../backend/src/chat/chat.service.ts');
    content = fs.readFileSync(filePath, 'utf8');
  });

  it('should ensure ChatService does not contain direct workflow mutations', () => {
    // Should not mutate workflow state inline
    expect(content).not.toContain("state.workflow = 'complaint'");
    expect(content).not.toContain("state.step = WorkflowState.");
  });

  it('should ensure ChatService does not contain UI rendering templates', () => {
    // Should not construct review screen inline
    expect(content).not.toContain("reviewScreen +=");
    expect(content).not.toContain("this.localizationService.translate('REVIEW_APPLICANT_PROFILE'");
  });

  it('should ensure ChatService does not duplicate recovery logic', () => {
    // Should delegate recovery to CitizenWorkflowManager
    const matches = content.match(/session\.step\s*=\s*nextStep/g);
    // Should only have recovery step resolution delegation
    expect(matches ? matches.length : 0).toBeLessThanOrEqual(2);
  });
});
