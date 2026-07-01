export enum ContainerType {
  WALLET = 'WALLET',
  PURSE = 'PURSE',
  BAG = 'BAG',
  BACKPACK = 'BACKPACK',
  SUITCASE = 'SUITCASE',
  LUGGAGE = 'LUGGAGE',
  OTHER = 'OTHER'
}

export const CONTAINER_DISPLAY_LABELS: Record<ContainerType, string> = {
  [ContainerType.WALLET]: 'wallet',
  [ContainerType.PURSE]: 'purse',
  [ContainerType.BAG]: 'bag',
  [ContainerType.BACKPACK]: 'backpack',
  [ContainerType.SUITCASE]: 'suitcase',
  [ContainerType.LUGGAGE]: 'luggage',
  [ContainerType.OTHER]: 'bag'
};

export interface ContainerMapping {
  kw: string;
  type: ContainerType;
}

export const INCIDENT_CONTAINERS: ContainerMapping[] = [
  { kw: 'wallet', type: ContainerType.WALLET },
  { kw: 'batua', type: ContainerType.WALLET },
  { kw: 'purse', type: ContainerType.PURSE },
  { kw: 'laptop bag', type: ContainerType.BAG },
  { kw: 'laptopbag', type: ContainerType.BAG },
  { kw: 'briefcase', type: ContainerType.BAG },
  { kw: 'handbag', type: ContainerType.PURSE },
  { kw: 'backpack', type: ContainerType.BACKPACK },
  { kw: 'pithu bag', type: ContainerType.BACKPACK },
  { kw: 'pithubag', type: ContainerType.BACKPACK },
  { kw: 'school bag', type: ContainerType.BAG },
  { kw: 'schoolbag', type: ContainerType.BAG },
  { kw: 'school ka bag', type: ContainerType.BAG },
  { kw: 'office bag', type: ContainerType.BAG },
  { kw: 'officebag', type: ContainerType.BAG },
  { kw: 'shopping bag', type: ContainerType.BAG },
  { kw: 'shoppingbag', type: ContainerType.BAG },
  { kw: 'polybag', type: ContainerType.OTHER },
  { kw: 'poly bag', type: ContainerType.OTHER },
  { kw: 'plastic bag', type: ContainerType.OTHER },
  { kw: 'plasticbag', type: ContainerType.OTHER },
  { kw: 'luggage', type: ContainerType.LUGGAGE },
  { kw: 'samaan ka bag', type: ContainerType.LUGGAGE },
  { kw: 'suitcase', type: ContainerType.SUITCASE },
  { kw: 'trolley bag', type: ContainerType.SUITCASE },
  { kw: 'trolleybag', type: ContainerType.SUITCASE },
  { kw: 'thela', type: ContainerType.OTHER },
  { kw: 'jhola', type: ContainerType.OTHER },
  { kw: 'bag', type: ContainerType.BAG }
];

export const LOSS_CONTEXT_KEYWORDS = [
  'lost', 'stolen', 'missing', 'snatched', 'misplaced',
  'chori', 'gum', 'kho', 'taken', 'pickpocketed', 'pick-pocketed',
  'left somewhere', 'forgot', "can't find", 'cannot find',
  'not able to find', 'disappeared', 'gum ho gaya', 'kho gaya',
  'not getting', 'unable to locate', 'gone missing'
];

export const RECOVERED_CONTEXT_KEYWORDS = [
  'got it back', 'recovered', 'has been returned', 'returned to me', 'mil gaya', 'mil gayi'
];

export interface ContainerContext {
  shouldClarify: boolean;
  containers: ContainerType[];
  displayLabel?: string;
}

export function detectContainerContext(
  text: string,
  sessionIntelligence?: any
): ContainerContext {
  if (!text) {
    return { shouldClarify: false, containers: [] };
  }
  const lowerText = text.toLowerCase();
  const containers: ContainerType[] = [];
  let matchedKw = '';

  const matches: { mapping: ContainerMapping; index: number }[] = [];
  for (const mapping of INCIDENT_CONTAINERS) {
    const regex = new RegExp(`\\b${mapping.kw}\\b`, 'gi');
    let match;
    while ((match = regex.exec(lowerText)) !== null) {
      matches.push({ mapping, index: match.index });
    }
  }

  // Sort matches by textual order (index in text) to preserve textual order of appearance
  matches.sort((a, b) => a.index - b.index);

  for (const m of matches) {
    if (!containers.includes(m.mapping.type)) {
      containers.push(m.mapping.type);
    }
    if (!matchedKw) {
      matchedKw = m.mapping.kw;
    }
  }

  let hasLoss = LOSS_CONTEXT_KEYWORDS.some(kw => {
    if (kw.includes("'") || kw.includes(" ")) {
      return lowerText.includes(kw);
    }
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    return regex.test(lowerText);
  });

  // Handle flexible "left my bag in taxi/bus/train"
  if (!hasLoss) {
    const hasLeft = /\bleft\b/i.test(lowerText);
    const hasTransit = /\b(taxi|bus|train|auto|metro|cab)\b/i.test(lowerText);
    if (hasLeft && hasTransit) {
      hasLoss = true;
    }
  }

  // AI read-only fallback
  if (!hasLoss) {
    // ignore AI fallback
  } else if (containers.length === 0 && sessionIntelligence?.entities?.container) {
    containers.push(ContainerType.OTHER);
    matchedKw = sessionIntelligence.entities.container;
  }

  const isRecovered = RECOVERED_CONTEXT_KEYWORDS.some(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    return regex.test(lowerText);
  });

  const shouldClarify = containers.length > 0 && hasLoss && !isRecovered;
  const displayLabel = matchedKw || (containers[0] ? CONTAINER_DISPLAY_LABELS[containers[0]] : undefined);

  return {
    shouldClarify,
    containers,
    displayLabel
  };
}

export function routeContainerIncident(
  session: any,
  ctx: { displayLabel?: string }
) {
  session.step = 'COMPLAINT_LOST_ITEM_CLARIFICATION';
  session.pendingComplaintType = 'AMBIGUOUS_CONTAINER_INCIDENT';
  session.currentWorkflowState = 'COMPLAINT';
}

export function ensureComplaintType(session: any): boolean {
  return !!session.data.type;
}

export function ensureWorkflowConsistency(session: any): boolean {
  if (
    session.pendingComplaintType === 'AMBIGUOUS_CONTAINER_INCIDENT' &&
    (!session.data.incidentItems || session.data.incidentItems.length === 0)
  ) {
    return false;
  }
  return true;
}

export function ensureContainerWorkflowComplete(session: any): boolean {
  if (
    session.pendingComplaintType === 'AMBIGUOUS_CONTAINER_INCIDENT' &&
    session.step !== 'COMPLAINT_LOST_ITEM_CLARIFICATION' &&
    !session.data.type
  ) {
    return false;
  }
  return true;
}

export function descriptionLooksCorrupted(text?: string): boolean {
  if (!text) return true;
  const normalized = text.toLowerCase().trim();
  return normalized.length < 5 || ['lost mobile / theft', 'lost document', 'simple harassment', 'cyber fraud / financial loss'].includes(normalized);
}

export function locationLooksCorrupted(text?: string, citizenCity?: string): boolean {
  if (!text) return true;
  const normalized = text.toLowerCase().trim();
  if (citizenCity && normalized === citizenCity.toLowerCase().trim()) {
    return true;
  }
  return normalized.length < 3 || ['lost mobile / theft', 'lost document', 'simple harassment', 'cyber fraud / financial loss'].includes(normalized);
}

export function recoverComplaintType(session: any) {
  session.currentWorkflowState = 'COMPLAINT_TYPE';
  delete session.data.typeConfirmation;
  
  if (!session.data.type && session.step === 'REVIEW') {
    if (locationLooksCorrupted(session.data.location, session.citizen?.city)) {
      session.data.location = null;
    }
  }
  
  session.data.incidentItems ??= [];
  session.data.partialIncidentItems ??= []; // Preserve partial items progress
  
  session.step = getRecoveryStep(session);
}

export function getRecoveryStep(session: any): string {
  if (session.data.incidentItems?.length) {
    return 'INCIDENT_ITEMS_REVIEW';
  }
  if (session.data.partialIncidentItems?.length) {
    return 'INCIDENT_ITEMS_PENDING_CONFIRMATION';
  }
  const descCtx = detectContainerContext(session.data?.description, session.intelligence);
  if (
    session.pendingComplaintType === 'AMBIGUOUS_CONTAINER_INCIDENT' ||
    session.pendingComplaintType === 'AMBIGUOUS_LOST_ITEM' ||
    descCtx.shouldClarify
  ) {
    if (descCtx.shouldClarify) {
      session.pendingComplaintType = 'AMBIGUOUS_CONTAINER_INCIDENT';
    }
    return 'COMPLAINT_LOST_ITEM_CLARIFICATION';
  }
  return '2';
}
