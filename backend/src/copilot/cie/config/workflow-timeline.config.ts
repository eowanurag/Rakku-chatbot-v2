export interface TimelineStage {
  stageId: string;
  label: string;
  durationDays: number;
  description: string;
}

export interface WorkflowTimelineConfig {
  workflowType: string;
  stages: TimelineStage[];
}

export const workflowTimelineConfig: Record<string, WorkflowTimelineConfig> = {
  complaint: {
    workflowType: 'complaint',
    stages: [
      { stageId: 'SUBMITTED', label: 'Complaint Registered', durationDays: 1, description: 'Complaint is registered in system and reference number is generated.' },
      { stageId: 'ALLOCATED', label: 'Assigned to Officer', durationDays: 2, description: 'Assigned to the local jurisdictional police station/cell for investigation.' },
      { stageId: 'INVESTIGATION', label: 'Under Investigation', durationDays: 10, description: 'Evidence compilation and tracking details search.' },
      { stageId: 'RESOLVED', label: 'Final Resolution', durationDays: 2, description: 'Case closure report or dispatch of recovery confirmation.' }
    ]
  },
  verification: {
    workflowType: 'verification',
    stages: [
      { stageId: 'SUBMITTED', label: 'Request Registered', durationDays: 1, description: 'Tenant/employee verification request recorded.' },
      { stageId: 'SCHEDULED', label: 'Field Visit Scheduled', durationDays: 3, description: 'Verification officer schedules a physical address visit.' },
      { stageId: 'VERIFIED', label: 'Verification Complete', durationDays: 4, description: 'Background checks and verification completed.' },
      { stageId: 'APPROVED', label: 'Approval & Report', durationDays: 2, description: 'Final report approved by Station House Officer.' }
    ]
  },
  certificate: {
    workflowType: 'certificate',
    stages: [
      { stageId: 'SUBMITTED', label: 'Application Filed', durationDays: 1, description: 'Application for character certificate received.' },
      { stageId: 'DOCS_CHECK', label: 'Documents Verification', durationDays: 2, description: 'Scrutiny of identity cards and references.' },
      { stageId: 'POLICE_VERIFICATION', label: 'Police Verification', durationDays: 7, description: 'Local police verification and criminal record check.' },
      { stageId: 'ISSUED', label: 'Certificate Issued', durationDays: 2, description: 'Digital certificate generated and sent to dashboard.' }
    ]
  }
};
