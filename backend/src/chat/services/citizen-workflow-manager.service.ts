import { Injectable } from '@nestjs/common';
import { 
  WorkflowState, 
  WorkflowEvent, 
  ConfidenceLevel,
  WORKFLOW_TRANSITIONS 
} from '../workflow-state.enum';
import { WorkflowContext, WorkflowInput, WorkflowAdvice } from '../workflow.types';
import { WorkflowError } from '../workflow.errors';

export interface WorkflowGuardResult {
  allowed: boolean;
  reason?: string;
  errorType?: WorkflowError;
}

export interface WorkflowAuditEvent {
  id: string;
  from: WorkflowState;
  event: WorkflowEvent;
  to: WorkflowState;
  timestamp: string;
}

@Injectable()
export class CitizenWorkflowManager {
  public validateTransition(state: WorkflowState, event: WorkflowEvent): boolean {
    return !!(WORKFLOW_TRANSITIONS[state] && WORKFLOW_TRANSITIONS[state][event]);
  }

  public resolveMissingWorkflowStep(session: any, input: WorkflowInput): WorkflowState {
    const complaintType = session.data?.type;
    const containerClarificationPending = !!(
      input.ambiguity && 
      (session.data?.containers?.length > 0 || session.intelligence?.containerDetected) && 
      !session.data?.lostItemContents
    );
    const incidentItemsReviewed = session.data?.workflowContext?.reviewConfirmed || session.data?.workflow?.reviewConfirmed;

    if (!complaintType) {
      return WorkflowState.COMPLAINT_TYPE_SELECTION;
    }
    if (containerClarificationPending) {
      return WorkflowState.COMPLAINT_LOST_ITEM_CLARIFICATION;
    }
    if (!incidentItemsReviewed) {
      return WorkflowState.INCIDENT_ITEMS_REVIEW;
    }
    if (!session.data?.workflowContext?.reviewConfirmed) {
      return WorkflowState.COMPLAINT_REVIEW;
    }
    return WorkflowState.SUBMISSION;
  }

  public transition(
      input: WorkflowInput,
      event: WorkflowEvent,
      session?: any
  ): { workflowContext: WorkflowContext; auditEvents?: WorkflowAuditEvent[]; warnings?: string[] } {
    const { workflowContext, confidence, ambiguity, reviewRequired, submissionReady } = input;
    const currentState = workflowContext.state;
    const auditEvents: WorkflowAuditEvent[] = [];
    const warnings: string[] = [];

    // Enforce Invariant 7: WorkflowManager never skips mandatory workflow states.
    if (session) {
      const resolvedState = this.resolveMissingWorkflowStep(session, input);
      if (resolvedState !== WorkflowState.SUBMISSION && resolvedState !== currentState) {
        const nextWorkflowContext: WorkflowContext = {
          schemaVersion: workflowContext.schemaVersion || 1,
          workflowVersion: workflowContext.workflowVersion || 1,
          state: resolvedState,
          reviewConfirmed: false,
          confidence,
          editCycles: workflowContext.editCycles
        };
        return { workflowContext: nextWorkflowContext };
      }
    }

    if (!this.validateTransition(currentState, event)) {
      warnings.push(`Illegal transition: state ${currentState} does not support event ${event}`);
      return { workflowContext, warnings };
    }

    let nextState = WORKFLOW_TRANSITIONS[currentState][event]!;

    if (session && nextState === WorkflowState.COMPLAINT_REVIEW) {
      const resolvedState = this.resolveMissingWorkflowStep(session, input);
      if (resolvedState !== WorkflowState.COMPLAINT_REVIEW && resolvedState !== WorkflowState.SUBMISSION) {
        nextState = resolvedState;
      }
    }

    if (nextState === WorkflowState.SUBMISSION) {
      const guardRes = this.evaluateSubmission(input);
      if (!guardRes.allowed) {
        warnings.push(`Transition to SUBMISSION blocked: ${guardRes.reason}`);
        return { workflowContext, warnings };
      }
    }

    let reviewConfirmed = workflowContext.reviewConfirmed;
    if (event === WorkflowEvent.CONTINUE && currentState === WorkflowState.INCIDENT_ITEMS_REVIEW) {
      reviewConfirmed = true;
    }
    if (nextState === WorkflowState.INCIDENT_ITEMS_EDIT || nextState === WorkflowState.INCIDENT_ITEMS_REVIEW) {
      reviewConfirmed = false;
    }

    let editCycles = workflowContext.editCycles;
    if (nextState === WorkflowState.INCIDENT_ITEMS_EDIT && currentState === WorkflowState.INCIDENT_ITEMS_REVIEW) {
      editCycles += 1;
    }

    const nextWorkflowContext: WorkflowContext = {
      schemaVersion: workflowContext.schemaVersion || 1,
      workflowVersion: workflowContext.workflowVersion || 1,
      state: nextState,
      reviewConfirmed,
      confidence,
      editCycles
    };

    const auditId = `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    auditEvents.push({
      id: auditId,
      from: currentState,
      event,
      to: nextState,
      timestamp: new Date().toISOString()
    });

    return { workflowContext: nextWorkflowContext, auditEvents };
  }

  public getRecoveryStep(session: any): WorkflowState {
    const context = session.data?.workflowContext;
    const state = context?.state;

    if (state && Object.values(WorkflowState).includes(state)) {
      if (!context.reviewConfirmed && state === WorkflowState.COMPLAINT_REVIEW) {
        return WorkflowState.INCIDENT_ITEMS_REVIEW;
      }
      return state;
    }

    if (session.data?.incidentItems?.length > 0) {
      if (context?.reviewConfirmed) {
        return WorkflowState.COMPLAINT_REVIEW;
      }
      return WorkflowState.INCIDENT_ITEMS_REVIEW;
    }

    return WorkflowState.ITEM_EXTRACTION;
  }

  public resetWorkflow(session: any): void {
    if (!session.data) session.data = {};
    session.data.workflowContext = {
      schemaVersion: 1,
      workflowVersion: 1,
      state: WorkflowState.ITEM_EXTRACTION,
      reviewConfirmed: false,
      confidence: ConfidenceLevel.MEDIUM,
      editCycles: 0
    };
    // Sync to legacy for backward compatibility
    session.data.workflow = {
      state: WorkflowState.ITEM_EXTRACTION,
      reviewConfirmed: false,
      editCycles: 0,
      confidence: ConfidenceLevel.MEDIUM
    };
  }

  public evaluateSubmission(input: WorkflowInput): WorkflowGuardResult {
    const { workflowContext, confidence, ambiguity, reviewRequired, submissionReady } = input;
    if (!workflowContext.reviewConfirmed) {
      if (confidence === ConfidenceLevel.HIGH && !ambiguity) {
        return { allowed: true };
      }
      return { 
        allowed: false, 
        reason: 'Citizen has not confirmed extracted items.', 
        errorType: WorkflowError.SUBMISSION_BLOCKED 
      };
    }
    return { allowed: true };
  }

  public evaluateReview(input: WorkflowInput): WorkflowGuardResult {
    return { allowed: true };
  }

  public evaluateRecovery(session: any): WorkflowGuardResult {
    return { allowed: true };
  }

  public evaluateEdit(session: any): WorkflowGuardResult {
    return { allowed: true };
  }
}

