export interface QuestionAssistanceItem {
  field: string;
  example: string;
  hint: string;
  acceptableFormats?: string[];
}

export const questionAssistanceConfig: Record<string, QuestionAssistanceItem> = {
  INCIDENT_DATE: {
    field: 'Incident Date',
    example: 'Example: 01/01/2026',
    hint: 'Provide the date when the incident occurred (DD/MM/YYYY).'
  },
  ADDRESS: {
    field: 'Address',
    example: 'Example: House 15, Sector 5, Gomti Nagar',
    hint: 'Enter your complete street or property address details.'
  },
  TRANSACTION_ID: {
    field: 'Transaction ID',
    example: 'Example: UPI123456789',
    hint: 'A unique 12-digit transaction ID or reference from your receipt or SMS.'
  }
};
