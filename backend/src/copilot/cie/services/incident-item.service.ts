import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfidenceLevel } from '../../../chat/workflow-state.enum';
import { IncidentItemCode, ITEM_CATEGORIES } from '../config/incident-item-risk.config';
import {
  MAX_INCIDENT_ITEMS,
  MAX_CONTAINERS,
  MAX_ITEM_LENGTH,
  MAX_ITEM_TEXT,
  MAX_UNKNOWN_ITEMS,
  MAX_ITEMS_PER_CONTAINER,
  MAX_PENDING_EVIDENCE,
  MAX_EVIDENCE_PER_ITEM,
  MAX_SESSION_JSON_SIZE,
  MAX_AMENDMENTS,
  MAX_DEBUG_LOGS,
  MIN_CONFIDENCE_AUTO_ACCEPT
} from '../../workflow.config';

export interface IncidentContainer {
  containerId: string;
  type: 'PURSE' | 'WALLET' | 'BAG' | 'BACKPACK' | 'HANDBAG' | 'LAPTOP_BAG' | 'BRIEFCASE' | 'SLING_BAG' | 'OTHER' | 'UNKNOWN';
  status?: 'LOST' | 'STOLEN' | 'DAMAGED' | 'RECOVERED' | 'UNKNOWN';
  owner?: 'SELF' | 'FAMILY' | 'OTHER' | 'UNKNOWN';
  containerConfidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  containerMetadata?: Record<string, unknown>;
}

export interface IncidentItem {
  itemId: string;
  itemCode: IncidentItemCode;
  status?: 'LOST' | 'STOLEN' | 'DAMAGED' | 'RECOVERED' | 'UNKNOWN';
  confirmed?: boolean;
  quantity?: number;
  amount?: number;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  source?: 'EXPLICIT' | 'INFERRED' | 'LEGACY_MIGRATION';
  reportedLater?: boolean;
  containerId?: string;
  relationship?: 'INSIDE_CONTAINER' | 'ATTACHED_TO_CONTAINER' | 'PART_OF_SET' | 'SEPARATE_ITEM';
  owner?: 'SELF' | 'FAMILY' | 'OTHER' | 'UNKNOWN';
  ownerName?: string;
  requiresCitizenConfirmation?: boolean;
  attributes?: {
    brand?: string;
    model?: string;
    color?: string;
    serialNumber?: string;
    issuer?: string;
    lastFourDigits?: string;
  };
  itemMetadata?: Record<string, unknown>;
}

@Injectable()
export class IncidentItemService {
  public extractItemsAndContainers(
    text: string,
    existingItems: IncidentItem[] = [],
    existingContainers: IncidentContainer[] = []
  ): { items: IncidentItem[]; containers: IncidentContainer[]; truncatedInput?: boolean; reviewReasons?: string[] } {
    const items = [...existingItems];
    const containers = [...existingContainers];
    const reviewReasons: string[] = [];
    let truncatedInput = false;

    if (!text) {
      return { items, containers };
    }

    // Input size guard
    if (text.length > MAX_ITEM_TEXT) {
      truncatedInput = true;
      reviewReasons.push('TOO_MANY_ITEMS');
      
      const parsedItem: IncidentItem = {
        itemId: `item_${String(items.length + 1).padStart(3, '0')}`,
        itemCode: 'UNKNOWN_OTHER',
        status: 'LOST',
        confidence: 'LOW',
        source: 'INFERRED',
        requiresCitizenConfirmation: true
      };
      items.push(parsedItem);
      return { items, containers, truncatedInput, reviewReasons };
    }

    const lowerText = text.toLowerCase();

    // Container parsing
    const containerKeywords: { kw: string; type: IncidentContainer['type'] }[] = [
      { kw: 'laptop bag', type: 'LAPTOP_BAG' },
      { kw: 'laptopbag', type: 'LAPTOP_BAG' },
      { kw: 'sling bag', type: 'SLING_BAG' },
      { kw: 'slingbag', type: 'SLING_BAG' },
      { kw: 'briefcase', type: 'BRIEFCASE' },
      { kw: 'handbag', type: 'HANDBAG' },
      { kw: 'backpack', type: 'BACKPACK' },
      { kw: 'purse', type: 'PURSE' },
      { kw: 'wallet', type: 'WALLET' },
      { kw: 'bag', type: 'BAG' }
    ];

    let foundContainer: IncidentContainer | null = null;
    for (const entry of containerKeywords) {
      if (lowerText.includes(entry.kw)) {
        // Detect owner
        let owner: IncidentContainer['owner'] = 'SELF';
        if (lowerText.includes('my family') || lowerText.includes("father") || lowerText.includes("mother") || lowerText.includes("wife") || lowerText.includes("husband")) {
          owner = 'FAMILY';
        } else if (lowerText.includes("friend") || lowerText.includes("someone else")) {
          owner = 'OTHER';
        }
        
        // Status
        let status: IncidentContainer['status'] = 'LOST';
        if (lowerText.includes('stolen') || lowerText.includes('snatched') || lowerText.includes('chori') || lowerText.includes('robbed')) {
          status = 'STOLEN';
        }

        const containerId = `container_${String(containers.length + 1).padStart(3, '0')}`;
        foundContainer = {
          containerId,
          type: entry.type,
          status,
          owner,
          containerConfidence: 'HIGH'
        };
        containers.push(foundContainer);
        break; // Max 1 new container per sentence parsing
      }
    }

    // Synonym mapping for low confidence container
    if (!foundContainer && (lowerText.includes('stuff') || lowerText.includes('belongings') || lowerText.includes('saman') || lowerText.includes('samana') || lowerText.includes('things'))) {
      const containerId = `container_${String(containers.length + 1).padStart(3, '0')}`;
      foundContainer = {
        containerId,
        type: 'UNKNOWN',
        status: lowerText.includes('stolen') ? 'STOLEN' : 'LOST',
        owner: 'UNKNOWN',
        containerConfidence: 'LOW'
      };
      containers.push(foundContainer);
    }

    // Item extraction
    const itemMapping: { patterns: string[]; code: IncidentItemCode }[] = [
      { patterns: ['aadhaar', 'adhar', 'uidai'], code: 'AADHAAR_CARD' },
      { patterns: ['pan card', 'pan doc', 'pancard'], code: 'PAN_CARD' },
      { patterns: ['driving license', 'driving licence', 'dl license', 'driving doc'], code: 'DRIVING_LICENSE' },
      { patterns: ['passport'], code: 'PASSPORT' },
      { patterns: ['atm card', 'atmcard'], code: 'ATM_CARD' },
      { patterns: ['debit card', 'debitcard'], code: 'DEBIT_CARD' },
      { patterns: ['credit card', 'creditcard'], code: 'CREDIT_CARD' },
      { patterns: ['mobile phone', 'phone', 'mobile', 'iphone', 'android', 'device'], code: 'MOBILE_PHONE' },
      { patterns: ['cash', 'rupees', 'money', 'rs', 'inr', '₹'], code: 'CASH' },
      { patterns: ['chequebook', 'cheque book', 'checkbook'], code: 'CHEQUEBOOK' },
      { patterns: ['vehicle rc', 'rc doc', 'registration certificate', 'bike rc', 'car rc'], code: 'VEHICLE_RC' },
      { patterns: ['some documents', 'other documents'], code: 'UNKNOWN_IDENTITY_DOCUMENTS' },
      { patterns: ['some cards', 'bank cards'], code: 'UNKNOWN_BANK_CARDS' },
      { patterns: ['electronics', 'other devices'], code: 'UNKNOWN_ELECTRONICS' }
    ];

    const currentExtracted: IncidentItem[] = [];

    for (const entry of itemMapping) {
      const matched = entry.patterns.some(pattern => {
        if (pattern === 'rs') {
          return /\brs\b/.test(lowerText);
        }
        return lowerText.includes(pattern);
      });
      if (matched) {
        // Prevent duplicate mapping if already extracted in this run
        if (currentExtracted.some(i => i.itemCode === entry.code)) continue;

        // Attributes detection
        const attributes: IncidentItem['attributes'] = {};
        if (entry.code === 'MOBILE_PHONE') {
          // Look for colors
          const colors = ['black', 'white', 'blue', 'red', 'green', 'gold', 'silver', 'grey'];
          for (const c of colors) {
            if (lowerText.includes(c)) {
              attributes.color = c;
              break;
            }
          }
        }

        // Amount detection for Cash
        let amount: number | undefined = undefined;
        if (entry.code === 'CASH') {
          const moneyRegex = /(?:\b(?:rs\.?|rupees|inr)\b|₹)\s*(\d+)/i;
          const match = text.match(moneyRegex);
          if (match && match[1]) {
            amount = parseInt(match[1], 10);
          }
        }

        // Owner
        let owner: IncidentItem['owner'] = 'SELF';
        if (lowerText.includes("my father's") || lowerText.includes("my mother's") || lowerText.includes("my wife's") || lowerText.includes("father's") || lowerText.includes("mother's")) {
          owner = 'FAMILY';
        } else if (lowerText.includes("friend's") || lowerText.includes("his") || lowerText.includes("her")) {
          owner = 'OTHER';
        }

        const itemId = `item_${String(items.length + currentExtracted.length + 1).padStart(3, '0')}`;
        const requiresCitizenConfirmation = (MIN_CONFIDENCE_AUTO_ACCEPT as string) !== 'MEDIUM' && (MIN_CONFIDENCE_AUTO_ACCEPT as string) !== 'LOW';

        const newItem: IncidentItem = {
          itemId,
          itemCode: entry.code,
          status: foundContainer ? foundContainer.status : (lowerText.includes('stolen') ? 'STOLEN' : 'LOST'),
          confirmed: false,
          quantity: 1,
          amount,
          confidence: entry.code === 'UNKNOWN_OTHER' ? 'LOW' : (entry.code.startsWith('UNKNOWN_') ? 'MEDIUM' : 'HIGH'),
          source: 'EXPLICIT',
          containerId: foundContainer?.containerId,
          relationship: foundContainer ? 'INSIDE_CONTAINER' : 'SEPARATE_ITEM',
          owner,
          requiresCitizenConfirmation,
          attributes
        };
        currentExtracted.push(newItem);
      }
    }

    // Fallback if container found but no items extracted
    if (foundContainer && currentExtracted.length === 0) {
      const itemId = `item_${String(items.length + 1).padStart(3, '0')}`;
      const fallbackItem: IncidentItem = {
        itemId,
        itemCode: 'UNKNOWN_OTHER',
        status: foundContainer.status,
        confirmed: false,
        confidence: 'LOW',
        source: 'INFERRED',
        containerId: foundContainer.containerId,
        relationship: 'INSIDE_CONTAINER',
        owner: foundContainer.owner,
        requiresCitizenConfirmation: true
      };
      currentExtracted.push(fallbackItem);
    }

    items.push(...currentExtracted);

    // Enforce overall limit
    if (items.length > MAX_INCIDENT_ITEMS) {
      items.splice(MAX_INCIDENT_ITEMS);
    }
    if (containers.length > MAX_CONTAINERS) {
      containers.splice(MAX_CONTAINERS);
    }

    return { items, containers, truncatedInput, reviewReasons };
  }

  public computeIncidentHash(items: IncidentItem[]): string {
    if (!items || items.length === 0) return '';
    const sorted = [...items]
      .sort((a, b) => {
        if (a.itemCode !== b.itemCode) return a.itemCode.localeCompare(b.itemCode);
        const ownerA = a.owner || 'UNKNOWN';
        const ownerB = b.owner || 'UNKNOWN';
        if (ownerA !== ownerB) return ownerA.localeCompare(ownerB);
        const qtyA = a.quantity || 1;
        const qtyB = b.quantity || 1;
        if (qtyA !== qtyB) return qtyA - qtyB;
        const amtA = a.amount || 0;
        const amtB = b.amount || 0;
        return amtA - amtB;
      });

    const values = sorted.map(i => {
      return `${i.itemCode}:${i.owner || 'UNKNOWN'}:${i.quantity || 1}:${i.amount || 0}`;
    }).join('|');

    return crypto.createHash('sha256').update(values).digest('hex');
  }

  public normalizeItems(items: IncidentItem[]): IncidentItem[] {
    const unique: IncidentItem[] = [];
    const keys = new Set<string>();

    for (const item of items) {
      const key = `${item.itemCode}:${item.containerId || 'NONE'}:${item.owner || 'UNKNOWN'}`;
      if (!keys.has(key)) {
        keys.add(key);
        unique.push(item);
      }
    }
    return unique;
  }

  public trimSessionData(sessionData: any): void {
    const serialized = JSON.stringify(sessionData);
    if (serialized.length <= MAX_SESSION_JSON_SIZE) {
      return;
    }

    const dataObj = sessionData.data || sessionData;
    const rootObj = sessionData;

    // 1. debug.logs
    const debugObj = rootObj.debug || dataObj.debug;
    if (debugObj) {
      if (debugObj.logs && debugObj.logs.length > 5) {
        debugObj.logs = debugObj.logs.slice(-5);
      } else {
        delete rootObj.debug;
        delete dataObj.debug;
      }
    }

    if (JSON.stringify(sessionData).length <= MAX_SESSION_JSON_SIZE) return;

    // 2. assetsReview.partialItems
    const assetsReview = dataObj.assetsReview || rootObj.assetsReview;
    if (assetsReview && assetsReview.partialItems) {
      delete assetsReview.partialItems;
    }

    if (JSON.stringify(sessionData).length <= MAX_SESSION_JSON_SIZE) return;

    // 3. amendments
    const amendmentsObj = dataObj.amendments || rootObj.amendments;
    if (amendmentsObj) {
      if (amendmentsObj.length > 5) {
        if (dataObj.amendments) dataObj.amendments = dataObj.amendments.slice(-5);
        if (rootObj.amendments) rootObj.amendments = rootObj.amendments.slice(-5);
      } else {
        delete dataObj.amendments;
        delete rootObj.amendments;
      }
    }

    if (JSON.stringify(sessionData).length <= MAX_SESSION_JSON_SIZE) return;

    // 4. recommendationReasoning inside intelligence metadata
    const intelligence = rootObj.intelligence || dataObj.intelligence;
    if (intelligence && intelligence.recommendationReasoning) {
      delete intelligence.recommendationReasoning;
    }

    if (JSON.stringify(sessionData).length <= MAX_SESSION_JSON_SIZE) return;

    // 5. old telemetry / other non-core log metrics
    const keysToDelete = ['telemetry', 'metrics', 'validationFailuresCount', 'modificationsCount', 'backActionsCount'];
    for (const k of keysToDelete) {
      delete rootObj[k];
      delete dataObj[k];
    }
  }

  public getIncidentItemsHelper(sessionData: any): IncidentItem[] {
    if (!sessionData) return [];
    if (Array.isArray(sessionData.incidentItems)) {
      return sessionData.incidentItems;
    }
    if (Array.isArray(sessionData.incidentAssets)) {
      return sessionData.incidentAssets;
    }
    if (Array.isArray(sessionData.reportedItems)) {
      return sessionData.reportedItems;
    }
    return [];
  }

  public applyModification(
    items: IncidentItem[],
    citizenMessage: string
  ): { items: IncidentItem[]; needsClarification?: boolean } {
    const cleanMsg = citizenMessage.toLowerCase().trim();
    
    // Check CLEAR_ALL first
    const clearAllKeywords = ['clear all', 'remove all', 'delete all', 'clear everything', 'remove everything'];
    if (clearAllKeywords.some(kw => cleanMsg.includes(kw))) {
      return { items: [] };
    }

    const itemMapping: { patterns: string[]; code: IncidentItemCode }[] = [
      { patterns: ['aadhaar', 'adhar', 'uidai'], code: 'AADHAAR_CARD' },
      { patterns: ['pan card', 'pan doc', 'pancard'], code: 'PAN_CARD' },
      { patterns: ['driving license', 'driving licence', 'dl license', 'driving doc', 'dl'], code: 'DRIVING_LICENSE' },
      { patterns: ['passport'], code: 'PASSPORT' },
      { patterns: ['atm card', 'atmcard'], code: 'ATM_CARD' },
      { patterns: ['debit card', 'debitcard'], code: 'DEBIT_CARD' },
      { patterns: ['credit card', 'creditcard'], code: 'CREDIT_CARD' },
      { patterns: ['mobile phone', 'phone', 'mobile', 'iphone', 'android', 'device'], code: 'MOBILE_PHONE' },
      { patterns: ['cash', 'rupees', 'money', 'rs', 'inr', '₹'], code: 'CASH' },
      { patterns: ['chequebook', 'cheque book', 'checkbook'], code: 'CHEQUEBOOK' },
      { patterns: ['vehicle rc', 'rc doc', 'registration certificate', 'bike rc', 'car rc'], code: 'VEHICLE_RC' },
      { patterns: ['some documents', 'other documents'], code: 'UNKNOWN_IDENTITY_DOCUMENTS' },
      { patterns: ['some cards', 'bank cards'], code: 'UNKNOWN_BANK_CARDS' },
      { patterns: ['electronics', 'other devices'], code: 'UNKNOWN_ELECTRONICS' }
    ];

    const matchedCodes: IncidentItemCode[] = [];
    for (const entry of itemMapping) {
      const matched = entry.patterns.some(pattern => {
        if (pattern === 'rs') {
          return /\brs\b/.test(cleanMsg);
        }
        return cleanMsg.includes(pattern);
      });
      if (matched) {
        matchedCodes.push(entry.code);
      }
    }

    if (matchedCodes.length === 0) {
      return { items, needsClarification: true };
    }

    let updatedItems = [...items];
    let actionTaken = false;

    // 1. REMOVE
    const removeKeywords = ['remove', 'delete', 'clear', 'exclude', 'drop', 'wasn\'t carrying', 'not carrying', 'lost only', 'except', 'don\'t have'];
    const isRemove = removeKeywords.some(kw => cleanMsg.includes(kw));

    if (isRemove) {
      for (const code of matchedCodes) {
        const index = updatedItems.findIndex(i => i.itemCode === code);
        if (index !== -1) {
          updatedItems.splice(index, 1);
          actionTaken = true;
        }
      }
    }

    // 2. REPLACE
    const replaceKeywords = ['replace', 'instead of', 'change', 'swap', 'instead'];
    const isReplace = replaceKeywords.some(kw => cleanMsg.includes(kw));
    if (isReplace && matchedCodes.length >= 2) {
      const toRemove = matchedCodes.find(code => updatedItems.some(i => i.itemCode === code));
      const toAdd = matchedCodes.find(code => !updatedItems.some(i => i.itemCode === code));
      if (toRemove && toAdd) {
        const index = updatedItems.findIndex(i => i.itemCode === toRemove);
        if (index !== -1) {
          updatedItems[index] = {
            ...updatedItems[index],
            itemCode: toAdd,
            confidence: 'HIGH',
            confirmed: false
          };
          actionTaken = true;
        }
      }
    }

    // 3. ADD
    const addKeywords = ['add', 'also', 'and', 'with', 'plus', 'as well', 'include', 'too'];
    const isAdd = !isRemove && !isReplace;
    const hasAddIntent = isAdd || (addKeywords.some(kw => cleanMsg.includes(kw)) && !isReplace);

    if (hasAddIntent) {
      for (const code of matchedCodes) {
        if (!updatedItems.some(i => i.itemCode === code)) {
          const itemId = `item_${String(updatedItems.length + 1).padStart(3, '0')}`;
          updatedItems.push({
            itemId,
            itemCode: code,
            status: 'LOST',
            confirmed: false,
            quantity: 1,
            confidence: 'HIGH',
            source: 'EXPLICIT',
            relationship: 'SEPARATE_ITEM',
            owner: 'SELF',
            requiresCitizenConfirmation: true
          });
          actionTaken = true;
        }
      }
    }

    if (!actionTaken) {
      return { items, needsClarification: true };
    }

    updatedItems = this.normalizeItems(updatedItems);
    return { items: updatedItems };
  }

  public calculateOverallConfidence(items: IncidentItem[]): ConfidenceLevel {
    if (!items || items.length === 0) {
      return ConfidenceLevel.LOW;
    }
    const confidences = items.map(i => i.confidence);
    if (confidences.includes('LOW')) {
      return ConfidenceLevel.LOW;
    }
    if (confidences.includes('MEDIUM')) {
      return ConfidenceLevel.MEDIUM;
    }
    return ConfidenceLevel.HIGH;
  }

  public clearItems(session: any): void {
    if (!session.data) session.data = {};
    session.data.incidentItems = [];
    session.data.partialIncidentItems = [];
    delete session.data.pendingComplaintType;
  }
}
