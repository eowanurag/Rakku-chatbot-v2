import { IncidentItemCode } from '../../cie/config/incident-item-risk.config';

export enum RecommendationToken {
  BLOCK_ATM_CARD = 'rec.block_atm_card',
  CONTACT_BANK = 'rec.contact_bank',
  CALL_1930 = 'rec.call_1930',
  BLOCK_SIM = 'rec.block_sim',
  DOWNLOAD_E_AADHAAR = 'rec.download_e_aadhaar',
  DUPLICATE_DL = 'rec.duplicate_dl',
  PASSPORT_REISSUE = 'rec.passport_reissue',
  FILE_GENERAL_DIARY = 'rec.file_general_diary',
  TRACK_COMPLAINT_STATUS = 'rec.track_complaint_status'
}

export interface RecommendationRule {
  code: RecommendationToken;
  priority: 'CRITICAL' | 'HIGH' | 'LOW';
  version: number;
  triggers: IncidentItemCode[];
  severity: 'INFO' | 'WARNING' | 'URGENT' | 'CRITICAL';
}

export const RECOMMENDATION_RULES: RecommendationRule[] = [
  {
    code: RecommendationToken.BLOCK_ATM_CARD,
    priority: 'CRITICAL',
    version: 1,
    triggers: ['ATM_CARD', 'UNKNOWN_BANK_CARDS'],
    severity: 'CRITICAL'
  },
  {
    code: RecommendationToken.CONTACT_BANK,
    priority: 'CRITICAL',
    version: 1,
    triggers: ['DEBIT_CARD', 'CREDIT_CARD', 'CHEQUEBOOK', 'UNKNOWN_FINANCIAL', 'UNKNOWN_BANK_CARDS'],
    severity: 'CRITICAL'
  },
  {
    code: RecommendationToken.CALL_1930,
    priority: 'CRITICAL',
    version: 1,
    triggers: ['ATM_CARD', 'DEBIT_CARD', 'CREDIT_CARD', 'UNKNOWN_FINANCIAL', 'UNKNOWN_BANK_CARDS'],
    severity: 'CRITICAL'
  },
  {
    code: RecommendationToken.BLOCK_SIM,
    priority: 'CRITICAL',
    version: 1,
    triggers: ['MOBILE_PHONE', 'UNKNOWN_DEVICE', 'UNKNOWN_ELECTRONICS'],
    severity: 'CRITICAL'
  },
  {
    code: RecommendationToken.DOWNLOAD_E_AADHAAR,
    priority: 'HIGH',
    version: 1,
    triggers: ['AADHAAR_CARD', 'UNKNOWN_DOCUMENT', 'UNKNOWN_IDENTITY_DOCUMENTS'],
    severity: 'URGENT'
  },
  {
    code: RecommendationToken.DUPLICATE_DL,
    priority: 'HIGH',
    version: 1,
    triggers: ['DRIVING_LICENSE', 'UNKNOWN_DOCUMENT', 'UNKNOWN_IDENTITY_DOCUMENTS'],
    severity: 'WARNING'
  },
  {
    code: RecommendationToken.PASSPORT_REISSUE,
    priority: 'HIGH',
    version: 1,
    triggers: ['PASSPORT', 'UNKNOWN_DOCUMENT', 'UNKNOWN_IDENTITY_DOCUMENTS'],
    severity: 'URGENT'
  },
  {
    code: RecommendationToken.FILE_GENERAL_DIARY,
    priority: 'LOW',
    version: 1,
    triggers: ['CASH', 'VEHICLE_RC', 'UNKNOWN_PROPERTY', 'UNKNOWN_OTHER'],
    severity: 'INFO'
  },
  {
    code: RecommendationToken.TRACK_COMPLAINT_STATUS,
    priority: 'LOW',
    version: 1,
    triggers: [], // fallback generic
    severity: 'INFO'
  }
];
