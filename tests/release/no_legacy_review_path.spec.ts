import * as fs from 'fs';
import * as path from 'path';

describe('Release - No Legacy Review Path', () => {
  it('should assert that only CitizenWorkflowManager transitions review rendering within the complaint workflow', () => {
    const chatServiceContent = fs.readFileSync(path.resolve('backend/src/chat/chat.service.ts'), 'utf8');
    
    const rcStart = chatServiceContent.indexOf('private async runComplaintWorkflow');
    const rcEnd = chatServiceContent.indexOf('private async runVerificationWorkflow');
    
    expect(rcStart).toBeGreaterThan(-1);
    expect(rcEnd).toBeGreaterThan(-1);
    
    const complaintSection = chatServiceContent.substring(rcStart, rcEnd);
    
    const directReviewSetters = complaintSection.match(/session\.step\s*=\s*['"]REVIEW['"]/g);
    expect(directReviewSetters).toBeNull();
  });
});
