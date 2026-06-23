export interface FieldSuggestion {
  field: string;
  description: string;
}

export interface FieldAssistanceTemplate {
  complaintType: string;
  suggestions: FieldSuggestion[];
}

export const fieldAssistanceConfig: Record<string, FieldAssistanceTemplate> = {
  LOST_MOBILE: {
    complaintType: 'LOST_MOBILE',
    suggestions: [
      { field: 'IMEI', description: 'Unique 15-digit hardware identifier of the device.' },
      { field: 'Device Model', description: 'Manufacturer and exact model name.' },
      { field: 'Last Seen Location', description: 'The last known place where the device was present.' }
    ]
  },
  CYBER_FRAUD: {
    complaintType: 'CYBER_FRAUD',
    suggestions: [
      { field: 'Transaction ID', description: 'Transaction reference number from receipt or SMS.' },
      { field: 'UPI ID', description: 'The UPI ID / VPA associated with the transaction.' },
      { field: 'Bank Name', description: 'The name of the bank where the account is held.' }
    ]
  },
  MISSING_PERSON: {
    complaintType: 'MISSING_PERSON',
    suggestions: [
      { field: 'Photograph', description: 'A recent high-quality photograph of the missing person.' },
      { field: 'Clothing Description', description: 'What the missing person was wearing when last seen.' },
      { field: 'Last Seen Location', description: 'Where and when the missing person was last seen.' }
    ]
  }
};
