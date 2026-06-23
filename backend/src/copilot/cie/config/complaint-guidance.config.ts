export interface GuidanceField {
  key: string;
  label: string;
  description: string;
  tip?: string;
}

export interface ComplaintGuidanceTemplate {
  workflowType: string;
  fields: GuidanceField[];
  criticalTips: string[];
}

export const complaintGuidanceConfig: Record<string, ComplaintGuidanceTemplate> = {
  LOST_MOBILE: {
    workflowType: 'LOST_MOBILE',
    fields: [
      { key: 'imei', label: 'IMEI', description: 'Unique 15-digit hardware identification number.', tip: 'Dial *#06# on your mobile to find the IMEI.' },
      { key: 'mobileModel', label: 'Model', description: 'Brand and exact model name of the device.', tip: 'Example: Samsung Galaxy S23.' },
      { key: 'lastSeen', label: 'Last Seen', description: 'Estimated time and place where the device was last present.', tip: 'Provide landmarks if exact address is unknown.' }
    ],
    criticalTips: [
      'Immediately contact your network operator to block the SIM card.',
      'Report IMEI block on CEIR portal to prevent abuse.'
    ]
  },
  CYBER_FRAUD: {
    workflowType: 'CYBER_FRAUD',
    fields: [
      { key: 'transactionId', label: 'Transaction ID', description: 'Unique transaction reference number from SMS or bank statement.', tip: 'Usually 12 digits starting with bank prefix.' },
      { key: 'upi', label: 'UPI', description: 'Unified Payments Interface ID or UPI reference used in transaction.', tip: 'Looks like recipient@upi or transaction ID in GPay/PhonePe.' },
      { key: 'bank', label: 'Bank', description: 'Name of the account/bank holder from which money was debited.', tip: 'Specify both sender and recipient banks if known.' }
    ],
    criticalTips: [
      'File the complaint within 24 hours of the incident to increase chance of fund blocking.',
      'Call 1930 Cyber Helpline immediately for financial fraud assistance.'
    ]
  }
};
