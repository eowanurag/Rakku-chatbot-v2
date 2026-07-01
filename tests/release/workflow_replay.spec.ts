import { CitizenWorkflowManager } from '../../backend/src/chat/services/citizen-workflow-manager.service';
import { WorkflowState, WorkflowEvent, ConfidenceLevel } from '../../backend/src/chat/workflow-state.enum';
import { WorkflowContext, WorkflowInput } from '../../backend/src/chat/workflow.types';

describe('Workflow Replay - Deterministic Sequence Verification', () => {
  let manager: CitizenWorkflowManager;

  beforeEach(() => {
    manager = new CitizenWorkflowManager();
  });

  it('should always result in the exact same state after 1000 iterations of identical sequences', () => {
    const sequence = [
      { event: WorkflowEvent.CONTINUE, confidence: ConfidenceLevel.MEDIUM, ambiguity: false, reviewRequired: false, submissionReady: false },
      { event: WorkflowEvent.MODIFY, confidence: ConfidenceLevel.MEDIUM, ambiguity: false, reviewRequired: true, submissionReady: false },
      { event: WorkflowEvent.CONTINUE, confidence: ConfidenceLevel.MEDIUM, ambiguity: false, reviewRequired: false, submissionReady: false },
      { event: WorkflowEvent.CONTINUE, confidence: ConfidenceLevel.MEDIUM, ambiguity: false, reviewRequired: false, submissionReady: true },
    ];

    const finalStates = new Set<string>();

    for (let i = 0; i < 1000; i++) {
      let context: WorkflowContext = {
        schemaVersion: 1,
        workflowVersion: 1,
        state: WorkflowState.ITEM_EXTRACTION,
        reviewConfirmed: false,
        confidence: ConfidenceLevel.MEDIUM,
        editCycles: 0,
      };

      for (const step of sequence) {
        const input: WorkflowInput = {
          workflowContext: context,
          confidence: step.confidence,
          ambiguity: step.ambiguity,
          reviewRequired: step.reviewRequired,
          submissionReady: step.submissionReady,
        };
        const res = manager.transition(input, step.event);
        context = res.workflowContext;
      }

      finalStates.add(context.state);
      expect(context.state).toBe(WorkflowState.COMPLAINT_REVIEW);
      expect(context.reviewConfirmed).toBe(true);
      expect(context.editCycles).toBe(1);
    }

    expect(finalStates.size).toBe(1);
  });
});
