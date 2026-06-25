import { Injectable } from '@nestjs/common';
import { IncidentItem, IncidentContainer } from './incident-item.service';
import {
  IncidentItemCode,
  SENSITIVE_ITEMS,
  ITEM_RISK_SCORES,
  ITEM_CATEGORIES,
  RISK_TIERS,
  OfficerAlertToken
} from '../config/incident-item-risk.config';

export interface IncidentPriorityResult {
  primaryComplaintType: string;
  secondaryComplaintTypes: string[];
  incidentType: 'LOST' | 'THEFT' | 'SNATCHING' | 'FRAUD' | 'UNKNOWN';
  risk: {
    score: number;
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    reasons: string[];
  };
}

@Injectable()
export class ComplaintPriorityService {
  public resolveComplaintPriority(
    items: IncidentItem[],
    narrativeText: string = ''
  ): IncidentPriorityResult {
    const categories = items.map(i => ITEM_CATEGORIES[i.itemCode]);
    const lowerNarrative = narrativeText.toLowerCase();

    // Override detection based on keywords
    let incidentType: IncidentPriorityResult['incidentType'] = 'LOST';
    if (lowerNarrative.includes('snatch') || lowerNarrative.includes('snatching') || lowerNarrative.includes('jhapatta')) {
      incidentType = 'SNATCHING';
    } else if (lowerNarrative.includes('theft') || lowerNarrative.includes('stolen') || lowerNarrative.includes('chori')) {
      incidentType = 'THEFT';
    } else if (lowerNarrative.includes('fraud') || lowerNarrative.includes('scam') || lowerNarrative.includes('unauthorized transaction')) {
      incidentType = 'FRAUD';
    }

    // Determine primary complaint type based on hierarchy:
    // THEFT/SNATCHING > Cyber Fraud / Financial Loss > Lost Mobile / Theft > Lost Document > Property
    let primaryComplaintType = 'Lost Document';
    const secondaryComplaintTypes: string[] = [];

    const hasTheftOverride = incidentType === 'THEFT' || incidentType === 'SNATCHING';
    const hasFinancial = categories.includes('FINANCIAL') || items.some(i => i.itemCode === 'UNKNOWN_BANK_CARDS');
    const hasDevice = categories.includes('DEVICE') || items.some(i => i.itemCode === 'UNKNOWN_ELECTRONICS');
    const hasDocument = categories.includes('DOCUMENT') || items.some(i => i.itemCode === 'UNKNOWN_IDENTITY_DOCUMENTS');

    if (hasTheftOverride) {
      primaryComplaintType = 'Lost Mobile / Theft';
      if (hasFinancial) secondaryComplaintTypes.push('Cyber Fraud / Financial Loss');
      if (hasDocument) secondaryComplaintTypes.push('Lost Document');
    } else if (hasFinancial) {
      primaryComplaintType = 'Cyber Fraud / Financial Loss';
      if (hasDevice) secondaryComplaintTypes.push('Lost Mobile / Theft');
      if (hasDocument) secondaryComplaintTypes.push('Lost Document');
    } else if (hasDevice) {
      primaryComplaintType = 'Lost Mobile / Theft';
      if (hasDocument) secondaryComplaintTypes.push('Lost Document');
    } else {
      primaryComplaintType = 'Lost Document';
    }

    // Calculate Risk properties
    const risk = this.computeRisk(items);

    return {
      primaryComplaintType,
      secondaryComplaintTypes,
      incidentType,
      risk
    };
  }

  public computeRisk(items: IncidentItem[]): IncidentPriorityResult['risk'] {
    let score = 0;
    const reasons: string[] = [];

    if (!items || items.length === 0) {
      return { score: 0, level: 'LOW', reasons: ['No items reported'] };
    }

    // Accumulate scores
    for (const item of items) {
      const itemScore = ITEM_RISK_SCORES[item.itemCode] || 5;
      score += itemScore;
    }

    // Dynamic escalation flags
    const itemCodes = items.map(i => i.itemCode);
    const categories = items.map(i => ITEM_CATEGORIES[i.itemCode]);

    const hasAadhaar = itemCodes.includes('AADHAAR_CARD');
    const hasPan = itemCodes.includes('PAN_CARD');
    const hasPassport = itemCodes.includes('PASSPORT');
    const hasDrivingLicense = itemCodes.includes('DRIVING_LICENSE');
    const hasPhone = itemCodes.includes('MOBILE_PHONE') || itemCodes.includes('UNKNOWN_DEVICE');
    const hasFinancial = categories.includes('FINANCIAL') || itemCodes.includes('UNKNOWN_BANK_CARDS');

    const sensitiveCount = items.filter(i => SENSITIVE_ITEMS.includes(i.itemCode)).length;

    // Escalation rules
    let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    
    if (score <= RISK_TIERS.LOW[1]) {
      level = 'LOW';
    } else if (score <= RISK_TIERS.MEDIUM[1]) {
      level = 'MEDIUM';
    } else if (score <= RISK_TIERS.HIGH[1]) {
      level = 'HIGH';
    } else {
      level = 'CRITICAL';
    }

    if (sensitiveCount >= 2) {
      reasons.push('Multiple sensitive documents lost');
      if (level === 'LOW' || level === 'MEDIUM') {
        level = 'HIGH';
      }
    }

    const containsIdentityRisk = hasAadhaar || hasPan || hasPassport;
    const containsFinancialRisk = hasFinancial;

    if (containsIdentityRisk && containsFinancialRisk) {
      level = 'CRITICAL';
      reasons.push('Identity and Financial exposure combined');
    }

    if (sensitiveCount >= 2 && hasPhone) {
      level = 'CRITICAL';
      reasons.push('Mobile and multiple sensitive documents lost');
    }

    return {
      score,
      level,
      reasons
    };
  }

  public buildStatistics(items: IncidentItem[]) {
    const sensitiveItemCount = items.filter(i => SENSITIVE_ITEMS.includes(i.itemCode)).length;
    const financialItemCount = items.filter(i => ITEM_CATEGORIES[i.itemCode] === 'FINANCIAL').length;
    const documentCount = items.filter(i => ITEM_CATEGORIES[i.itemCode] === 'DOCUMENT').length;
    const containerCount = Array.from(new Set(items.map(i => i.containerId).filter(Boolean))).length;
    const unknownCount = items.filter(i => ITEM_CATEGORIES[i.itemCode] === 'UNKNOWN' || i.itemCode === 'UNKNOWN_OTHER').length;

    return {
      sensitiveItemCount,
      financialItemCount,
      documentCount,
      containerCount,
      unknownCount
    };
  }

  public getSupportingItems(items: IncidentItem[]) {
    const documents = items.filter(i => ITEM_CATEGORIES[i.itemCode] === 'DOCUMENT');
    const financial = items.filter(i => ITEM_CATEGORIES[i.itemCode] === 'FINANCIAL');
    const devices = items.filter(i => ITEM_CATEGORIES[i.itemCode] === 'DEVICE');

    return {
      documents,
      financial,
      devices
    };
  }

  public computeRiskFlags(items: IncidentItem[]) {
    const itemCodes = items.map(i => i.itemCode);
    const categories = items.map(i => ITEM_CATEGORIES[i.itemCode]);

    const hasAadhaar = itemCodes.includes('AADHAAR_CARD');
    const hasPan = itemCodes.includes('PAN_CARD');
    const hasPassport = itemCodes.includes('PASSPORT');
    const hasDrivingLicense = itemCodes.includes('DRIVING_LICENSE');
    const hasPhone = itemCodes.includes('MOBILE_PHONE') || itemCodes.includes('UNKNOWN_DEVICE');
    const hasFinancial = categories.includes('FINANCIAL') || itemCodes.includes('UNKNOWN_BANK_CARDS');

    const containsIdentityRisk = hasAadhaar || hasPan || hasPassport;
    const containsFinancialRisk = hasFinancial;
    const requiresImmediateAction = hasFinancial || hasPhone;

    return {
      containsIdentityRisk,
      containsFinancialRisk,
      requiresImmediateAction
    };
  }

  public getRiskScore(itemCode: IncidentItemCode): number {
    return ITEM_RISK_SCORES[itemCode] || 5;
  }

  public getCategory(itemCode: IncidentItemCode): string {
    return ITEM_CATEGORIES[itemCode] || 'OTHER';
  }

  public getOfficerAlerts(items: IncidentItem[]): OfficerAlertToken[] {
    const alerts: OfficerAlertToken[] = [];
    const itemCodes = items.map(i => i.itemCode);
    const categories = items.map(i => ITEM_CATEGORIES[i.itemCode]);

    const hasAadhaar = itemCodes.includes('AADHAAR_CARD');
    const hasPan = itemCodes.includes('PAN_CARD');
    const hasPassport = itemCodes.includes('PASSPORT');
    const hasDrivingLicense = itemCodes.includes('DRIVING_LICENSE');
    const hasPhone = itemCodes.includes('MOBILE_PHONE') || itemCodes.includes('UNKNOWN_DEVICE');
    const hasFinancial = categories.includes('FINANCIAL') || itemCodes.includes('UNKNOWN_BANK_CARDS');

    const sensitiveCount = items.filter(i => SENSITIVE_ITEMS.includes(i.itemCode)).length;

    // Trigger Rules
    // POSSIBLE_IDENTITY_MISUSE: Aadhaar+PAN, PAN+Passport, Aadhaar+Passport
    const identityDocs = [hasAadhaar, hasPan, hasPassport].filter(Boolean).length;
    if (identityDocs >= 2) {
      alerts.push('POSSIBLE_IDENTITY_MISUSE');
    }

    // DEVICE_IDENTITY_COMBINATION: Phone + Aadhaar + PAN
    if (hasPhone && hasAadhaar && hasPan) {
      alerts.push('DEVICE_IDENTITY_COMBINATION');
    }

    // MULTI_FINANCIAL_EXPOSURE: 3+ financial assets
    const financialAssetsCount = items.filter(i => 
      ['ATM_CARD', 'CREDIT_CARD', 'DEBIT_CARD', 'CHEQUEBOOK', 'UNKNOWN_BANK_CARDS', 'UNKNOWN_FINANCIAL'].includes(i.itemCode)
    ).length;
    if (financialAssetsCount >= 3) {
      alerts.push('MULTI_FINANCIAL_EXPOSURE');
    }

    // MULTIPLE_GOVERNMENT_DOCUMENTS: 2+ government/identity documents
    const governmentDocsCount = items.filter(i => 
      ['AADHAAR_CARD', 'PAN_CARD', 'PASSPORT', 'DRIVING_LICENSE', 'VEHICLE_RC'].includes(i.itemCode)
    ).length;
    if (governmentDocsCount >= 2) {
      alerts.push('MULTIPLE_GOVERNMENT_DOCUMENTS');
    }

    if (sensitiveCount >= 2) {
      alerts.push('MULTIPLE_SENSITIVE_ITEMS');
    }

    if (hasPhone && hasFinancial) {
      alerts.push('DEVICE_AND_BANKING_COMBINATION');
    }

    return alerts;
  }
}
