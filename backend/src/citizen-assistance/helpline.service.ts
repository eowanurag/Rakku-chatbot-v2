import { Injectable } from '@nestjs/common';

export interface HelplineContact {
  category: string;
  number: string;
  description: string;
  descriptionHi: string;
}

@Injectable()
export class HelplineService {
  private readonly helplines: HelplineContact[] = [
    {
      category: 'emergency',
      number: '112',
      description: 'Emergency Services (Police / General)',
      descriptionHi: 'आपातकालीन सेवाएं (पुलिस / सामान्य)',
    },
    {
      category: 'women_safety',
      number: '1090',
      description: 'Women Power Line',
      descriptionHi: 'महिला पावर लाइन',
    },
    {
      category: 'cyber_fraud',
      number: '1930',
      description: 'National Cyber Crime Helpline',
      descriptionHi: 'राष्ट्रीय साइबर अपराध हेल्पलाइन',
    },
    {
      category: 'child_safety',
      number: '1098',
      description: 'Child Helpline',
      descriptionHi: 'चाइल्ड हेल्पलाइन',
    },
    {
      category: 'medical',
      number: '108',
      description: 'Ambulance Services',
      descriptionHi: 'एम्बुलेंस सेवाएं',
    },
    {
      category: 'fire',
      number: '101',
      description: 'Fire Service',
      descriptionHi: 'अग्निशमन सेवा',
    },
  ];

  getAll(): HelplineContact[] {
    return this.helplines;
  }

  getByCategory(category: string): HelplineContact | undefined {
    return this.helplines.find(h => h.category === category);
  }
}
