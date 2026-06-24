const SYSTEM_ACTIONS = [
  'Modify Details',
  'Confirm Details',
  'Continue',
  'Back',
  'Cancel',
  'Confirm',
  'Yes',
  'No',
  'Change Location',
  'Submit Application'
];

export function isSystemAction(input: string, step?: string): boolean {
  if (!input) return false;
  
  const cleanInput = input.trim();
  const lowerInput = cleanInput.toLowerCase();
  
  const isMatch = SYSTEM_ACTIONS.some(action => {
    const actionLower = action.toLowerCase();
    return lowerInput === actionLower || lowerInput === `option:${actionLower}`;
  });

  if (!isMatch) return false;

  if (step) {
    const validSteps = [
      'REVIEW',
      'REVIEW_EDIT_SELECTION',
      'REVIEW_CONFIRM',
      'PROFILE_CONFIRM',
      'MENU_SELECTION',
      'START',
      'PRE_ONBOARDING_OPTIONS',
      'PRE_ONBOARDING_RESUME_CHOICE',
      'CONFIRM_LOCATION',
      'EMERGENCY_CONFIRM',
      'MODIFY_PROFILE_SELECT',
      'PRP_CHOICE',
      'PRP_CONFIRM',
      'ASK_FEEDBACK',
      'FEEDBACK_COMMENT_OPTIONAL',
      'FEEDBACK_COMMENT_REQUIRED'
    ];
    if (!validSteps.includes(step)) {
      return false;
    }
  }

  return true;
}

export function normalizeComplaintText(input: string): string {
  if (!input) return '';
  let text = input.trim().toLowerCase();
  
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ');
  
  // Remove emojis
  text = text.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '');
  
  // Remove punctuation (keep alphanumeric and spaces)
  text = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’।!?]/g, '');
  
  // Collapse whitespace again
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

export function normalizeSelection(input: string): string {
  if (!input) return '';
  let text = input.trim();
  if (text.toLowerCase().startsWith('option:')) {
    text = text.substring(7).trim();
  }
  return text;
}
