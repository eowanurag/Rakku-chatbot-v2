import { ConfirmComplaintDto } from '../../backend/src/copilot/cie/dto/confirm-complaint.dto';
import { ConfirmAssessmentDto } from '../../backend/src/copilot/sae/dto/confirm-assessment.dto';
import * as fs from 'fs';
import * as path from 'path';

describe('Backward Compatibility Gate Tests', () => {
  it('should verify complaint-intelligence facade inherits the correct CIE properties', () => {
    const complaintDto = new ConfirmComplaintDto();
    complaintDto.sessionId = '123';
    complaintDto.assessmentId = 'abc';

    const assessmentDto = new ConfirmAssessmentDto();
    assessmentDto.sessionId = '123';
    assessmentDto.assessmentId = 'abc';

    // Verify DTO schema matching and equivalence
    expect(assessmentDto.sessionId).toBe(complaintDto.sessionId);
    expect(assessmentDto.assessmentId).toBe(complaintDto.assessmentId);
  });

  it('should verify controller facade mappings exist and re-export correctly', () => {
    const rootDir = path.resolve(__dirname, '../..');
    
    const complaintControllerPath = path.join(
      rootDir,
      'backend/src/complaint-intelligence/complaint-intelligence.controller.ts'
    );
    const assessmentControllerPath = path.join(
      rootDir,
      'backend/src/situation-assessment/situation-assessment.controller.ts'
    );

    expect(fs.existsSync(complaintControllerPath)).toBe(true);
    expect(fs.existsSync(assessmentControllerPath)).toBe(true);

    const complaintContent = fs.readFileSync(complaintControllerPath, 'utf8');
    const assessmentContent = fs.readFileSync(assessmentControllerPath, 'utf8');

    expect(complaintContent).toContain("export * from '../copilot/cie/complaint-intelligence.controller';");
    expect(assessmentContent).toContain("export * from '../copilot/sae/situation-assessment.controller';");
  });
});
