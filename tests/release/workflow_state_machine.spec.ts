import { CitizenWorkflowManager } from '../../backend/src/chat/services/citizen-workflow-manager.service';
import { WorkflowState, WorkflowEvent, ConfidenceLevel } from '../../backend/src/chat/workflow-state.enum';
import { WorkflowContext, WorkflowInput } from '../../backend/src/chat/workflow.types';

describe('Workflow State Machine - CitizenWorkflowManager', () => {
  let manager: CitizenWorkflowManager;

  beforeEach(() => {
    manager = new CitizenWorkflowManager();
  });

  it('should transition from ITEM_EXTRACTION to INCIDENT_ITEMS_REVIEW on CONTINUE', () => {
    const context: WorkflowContext = {
      schemaVersion: 1,
      workflowVersion: 1,
      state: WorkflowState.ITEM_EXTRACTION,
      reviewConfirmed: false,
      confidence: ConfidenceLevel.HIGH,
      editCycles: 0,
    };
    const input: WorkflowInput = {
      workflowContext: context,
      confidence: ConfidenceLevel.HIGH,
      ambiguity: false,
      reviewRequired: false,
      submissionReady: false,
    };

    const res = manager.transition(input, WorkflowEvent.CONTINUE);
    expect(res.workflowContext.state).toBe(WorkflowState.INCIDENT_ITEMS_REVIEW);
    expect(res.workflowContext.reviewConfirmed).toBe(false);
  });

  it('should transition from INCIDENT_ITEMS_REVIEW to COMPLAINT_REVIEW on CONTINUE and set reviewConfirmed', () => {
    const context: WorkflowContext = {
      schemaVersion: 1,
      workflowVersion: 1,
      state: WorkflowState.INCIDENT_ITEMS_REVIEW,
      reviewConfirmed: false,
      confidence: ConfidenceLevel.HIGH,
      editCycles: 0,
    };
    const input: WorkflowInput = {
      workflowContext: context,
      confidence: ConfidenceLevel.HIGH,
      ambiguity: false,
      reviewRequired: false,
      submissionReady: false,
    };

    const res = manager.transition(input, WorkflowEvent.CONTINUE);
    expect(res.workflowContext.state).toBe(WorkflowState.COMPLAINT_REVIEW);
    expect(res.workflowContext.reviewConfirmed).toBe(true);
  });

  it('should increment edit cycles when transitioning to INCIDENT_ITEMS_EDIT', () => {
    const context: WorkflowContext = {
      schemaVersion: 1,
      workflowVersion: 1,
      state: WorkflowState.INCIDENT_ITEMS_REVIEW,
      reviewConfirmed: false,
      confidence: ConfidenceLevel.HIGH,
      editCycles: 2,
    };
    const input: WorkflowInput = {
      workflowContext: context,
      confidence: ConfidenceLevel.HIGH,
      ambiguity: false,
      reviewRequired: true,
      submissionReady: false,
    };

    const res = manager.transition(input, WorkflowEvent.MODIFY);
    expect(res.workflowContext.state).toBe(WorkflowState.INCIDENT_ITEMS_EDIT);
    expect(res.workflowContext.editCycles).toBe(3);
  });

  it('should block transition to SUBMISSION if review is not confirmed', () => {
    const context: WorkflowContext = {
      schemaVersion: 1,
      workflowVersion: 1,
      state: WorkflowState.COMPLAINT_REVIEW,
      reviewConfirmed: false,
      confidence: ConfidenceLevel.MEDIUM,
      editCycles: 0,
    };
    const input: WorkflowInput = {
      workflowContext: context,
      confidence: ConfidenceLevel.MEDIUM,
      ambiguity: true,
      reviewRequired: true,
      submissionReady: false,
    };

    const res = manager.transition(input, WorkflowEvent.SUBMIT);
    expect(res.workflowContext.state).toBe(WorkflowState.COMPLAINT_REVIEW); // stays same
    expect(res.warnings?.[0]).toContain('Transition to SUBMISSION blocked');
  });

  it('should allow transition to SUBMISSION if review is not confirmed but confidence is HIGH and no ambiguity exists', () => {
    const context: WorkflowContext = {
      schemaVersion: 1,
      workflowVersion: 1,
      state: WorkflowState.COMPLAINT_REVIEW,
      reviewConfirmed: false,
      confidence: ConfidenceLevel.HIGH,
      editCycles: 0,
    };
    const input: WorkflowInput = {
      workflowContext: context,
      confidence: ConfidenceLevel.HIGH,
      ambiguity: false,
      reviewRequired: false,
      submissionReady: true,
    };

    const res = manager.transition(input, WorkflowEvent.SUBMIT);
    expect(res.workflowContext.state).toBe(WorkflowState.SUBMISSION);
  });
});
