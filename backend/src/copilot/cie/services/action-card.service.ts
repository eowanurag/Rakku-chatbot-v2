import { Injectable } from '@nestjs/common';

export interface ActionCard {
  id: string;
  title: string;
  actionType: 'DOWNLOAD_ACKNOWLEDGEMENT' | 'TRACK_CASE' | 'ADD_DETAILS';
  payload: Record<string, any>;
  description: string;
}

@Injectable()
export class ActionCardService {
  generateCards(workflowType: string, referenceNumber: string): ActionCard[] {
    const cards: ActionCard[] = [];

    if (referenceNumber) {
      cards.push({
        id: `download-ack-${referenceNumber}`,
        title: 'Download Acknowledgement',
        actionType: 'DOWNLOAD_ACKNOWLEDGEMENT',
        payload: { referenceNumber },
        description: 'Download the certified PDF acknowledgement of your application.'
      });

      cards.push({
        id: `track-${referenceNumber}`,
        title: 'Track Application Status',
        actionType: 'TRACK_CASE',
        payload: { referenceNumber },
        description: 'Track the live resolution status of your complaint/request.'
      });
    }

    if (workflowType === 'complaint') {
      cards.push({
        id: `add-details-${referenceNumber || 'new'}`,
        title: 'Upload Supporting Documents',
        actionType: 'ADD_DETAILS',
        payload: { referenceNumber },
        description: 'Attach photos, invoices, or identity cards to strengthen your case.'
      });
    }

    return cards;
  }
}
