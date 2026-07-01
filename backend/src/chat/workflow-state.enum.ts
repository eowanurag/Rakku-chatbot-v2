export enum WorkflowState {
    ITEM_EXTRACTION = 'ITEM_EXTRACTION',
    COMPLAINT_TYPE_SELECTION = 'COMPLAINT_TYPE_SELECTION',
    COMPLAINT_LOST_ITEM_CLARIFICATION = 'COMPLAINT_LOST_ITEM_CLARIFICATION',
    INCIDENT_ITEMS_REVIEW = 'INCIDENT_ITEMS_REVIEW',
    INCIDENT_ITEMS_EDIT = 'INCIDENT_ITEMS_EDIT',
    COMPLAINT_REVIEW = 'REVIEW',
    SUBMISSION = 'SUBMISSION',
    AMENDMENT = 'AMENDMENT' // Reserved for future use
}

export enum WorkflowEvent {
    CONTINUE = 'CONTINUE',
    MODIFY = 'MODIFY',
    START_OVER = 'START_OVER',
    SUBMIT = 'SUBMIT',
    CANCEL = 'CANCEL',
    AMEND = 'AMEND' // Reserved for future use
}

export enum ConfidenceLevel {
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW'
}

export enum WorkflowError {
    INVALID_TRANSITION = 'INVALID_TRANSITION',
    SUBMISSION_NOT_ALLOWED = 'SUBMISSION_NOT_ALLOWED',
    REVIEW_REQUIRED = 'REVIEW_REQUIRED',
    UNKNOWN_EVENT = 'UNKNOWN_EVENT'
}

export interface WorkflowContext {
    readonly state: WorkflowState;
    readonly reviewConfirmed: boolean;
    readonly editCycles: number;
}

export interface WorkflowDecisionContext {
    hasAmbiguity: boolean;
    extractionConfidence: ConfidenceLevel;
    reviewConfirmed: boolean;
}

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

export const WORKFLOW_TRANSITIONS: Record<WorkflowState, Partial<Record<WorkflowEvent, WorkflowState>>> = {
    [WorkflowState.COMPLAINT_TYPE_SELECTION]: {
        [WorkflowEvent.CONTINUE]: WorkflowState.ITEM_EXTRACTION
    },
    [WorkflowState.ITEM_EXTRACTION]: {
        [WorkflowEvent.CONTINUE]: WorkflowState.INCIDENT_ITEMS_REVIEW,
        [WorkflowEvent.CANCEL]: WorkflowState.ITEM_EXTRACTION
    },
    [WorkflowState.COMPLAINT_LOST_ITEM_CLARIFICATION]: {
        [WorkflowEvent.CONTINUE]: WorkflowState.INCIDENT_ITEMS_REVIEW
    },
    [WorkflowState.INCIDENT_ITEMS_REVIEW]: {
        [WorkflowEvent.CONTINUE]: WorkflowState.COMPLAINT_REVIEW,
        [WorkflowEvent.MODIFY]: WorkflowState.INCIDENT_ITEMS_EDIT,
        [WorkflowEvent.START_OVER]: WorkflowState.ITEM_EXTRACTION
    },
    [WorkflowState.INCIDENT_ITEMS_EDIT]: {
        [WorkflowEvent.CONTINUE]: WorkflowState.INCIDENT_ITEMS_REVIEW,
        [WorkflowEvent.CANCEL]: WorkflowState.INCIDENT_ITEMS_REVIEW
    },
    [WorkflowState.COMPLAINT_REVIEW]: {
        [WorkflowEvent.SUBMIT]: WorkflowState.SUBMISSION,
        [WorkflowEvent.MODIFY]: WorkflowState.INCIDENT_ITEMS_REVIEW
    },
    [WorkflowState.SUBMISSION]: {},
    [WorkflowState.AMENDMENT]: {}
};

