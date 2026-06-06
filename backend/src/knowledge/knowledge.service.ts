import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface KnowledgeItemData {
  id: string;
  category: string;
  question: string;
  answer: string;
}

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);
  
  // Local static KB for fallback/prototype
  private readonly staticKnowledge: KnowledgeItemData[] = [
    {
      id: 'kb-1',
      category: 'Complaint Registration',
      question: 'How do I file an e-FIR for lost property in UP?',
      answer: 'You can file an e-FIR for lost mobile phones, documents, or personal belongings using the official UPCOP Mobile App or the UP Police Citizen Portal. Go to Services > e-FIR, fill in your details, incident date, location, and details of lost item. A digital signature will generate your FIR document with a unique registration ID.',
    },
    {
      id: 'kb-2',
      category: 'Complaint Registration',
      question: 'Can I register a complaint online if the accused is known?',
      answer: 'For complaints where the accused is known, you should file a regular complaint on the UP Police portal. However, for serious cognizable crimes, you must visit the nearest police station to lodge an official FIR (First Information Report). Online e-FIR is primarily for unknown offenders/lost items.',
    },
    {
      id: 'kb-3',
      category: 'Character Certificate',
      question: 'What is the processing time for a Character Certificate in UP?',
      answer: 'The official processing time for character certificate verification in Uttar Pradesh is 15 to 21 working days. It involves local beat constable verification at your permanent address and a criminal record database search before final superintendent approval.',
    },
    {
      id: 'kb-4',
      category: 'Character Certificate',
      question: 'What documents are required to apply for a Character Certificate?',
      answer: 'You need: 1. Passport size photograph, 2. Identity proof (Aadhaar, PAN, Voter ID), 3. Address proof (Electricity bill, Ration card, Landlord declaration), and 4. A minor processing fee of Rs. 50 payable online via Rajkosh.',
    },
    {
      id: 'kb-5',
      category: 'Tenant Verification',
      question: 'Is tenant verification mandatory in Uttar Pradesh?',
      answer: 'Yes, tenant verification is mandatory under directives issued by District Magistrates across Uttar Pradesh. Landlords who fail to register tenant details with their local police station can face penalties under Section 188 of the Indian Penal Code (IPC) for violation of public order.',
    },
    {
      id: 'kb-6',
      category: 'Tenant Verification',
      question: 'How do I perform tenant verification online?',
      answer: 'Landlords can verify tenants through the UPCOP App or the UP Police Citizen Portal. Under Tenant Verification section, enter landlord details, tenant personal details (name, permanent address, ID proof, occupation), and upload photographs. A verification status is sent after police beat check.',
    },
    {
      id: 'kb-7',
      category: 'Event Permission',
      question: 'How do I get permission for a public protest or procession?',
      answer: 'Submit an online request under the "Event/Protest/Procession Request" tab on the UP Police Portal at least 7-10 days in advance. You must provide: event route details, speaker/mic permissions requested, expected headcount, organizer ID proof, and local police station NOC (No Objection Certificate). Permission is subject to law and order checks.',
    },
    {
      id: 'kb-8',
      category: 'Event Permission',
      question: 'What is the film shooting permission protocol in UP?',
      answer: 'Uttar Pradesh promotes film tourism. Permissions can be requested online via UP Police portal or UP Film Bandhu. Organizers need to upload the script synopsis, shooting location map, date schedule, details of security required, and pay appropriate fees. Approvals are routed through local Police Commissioners/SPs.',
    },
    {
      id: 'kb-9',
      category: 'Postmortem Report Request',
      question: 'How can I obtain a Postmortem (PM) Report copy?',
      answer: 'To obtain a postmortem report copy: 1. File a written request at the district Chief Medical Officer (CMO) office. 2. Attach a copy of the inquest report (Panchnama) prepared by police, death certificate, and a family relation proof. 3. The CMO office verifies and issues a certified copy to blood relatives.',
    },
    {
      id: 'kb-10',
      category: 'Police Services',
      question: 'What is 112 Uttar Pradesh?',
      answer: 'UP 112 is the integrated emergency response system (IERS) in Uttar Pradesh. It handles emergencies related to police, fire, medical services, and disaster management. Dialing 112 connects you directly to a dispatch center that routes GPS-tracked police response vehicles (PRVs) to your location within minutes.',
    },
    {
      id: 'kb-11',
      category: 'FAQs',
      question: 'What is a cognizable offence vs non-cognizable?',
      answer: 'A cognizable offence is one where police can arrest the accused without a warrant and start an investigation immediately (e.g. murder, theft, rape). In non-cognizable offences, police cannot arrest without a warrant, and require a magistrate order to begin investigation (e.g. simple cheating, defamation).',
    },
  ];

  constructor(private prisma: PrismaService) {}

  async search(query: string): Promise<KnowledgeItemData[]> {
    const qLower = query.toLowerCase();
    try {
      // Attempt DB search
      const items = await this.prisma.knowledgeItem.findMany({
        where: {
          OR: [
            { question: { contains: qLower, mode: 'insensitive' } },
            { answer: { contains: qLower, mode: 'insensitive' } },
          ],
        },
      });
      if (items.length > 0) return items;
    } catch (e) {
      this.logger.warn(`Prisma knowledge search failed (${e.message}). Using local static fallback.`);
    }

    // Static matching
    return this.staticKnowledge.filter(
      item => item.question.toLowerCase().includes(qLower) || item.answer.toLowerCase().includes(qLower) || item.category.toLowerCase().includes(qLower),
    );
  }

  async getByCategory(category: string): Promise<KnowledgeItemData[]> {
    try {
      const items = await this.prisma.knowledgeItem.findMany({
        where: { category },
      });
      if (items.length > 0) return items;
    } catch (e) {
      this.logger.warn(`Prisma getByCategory failed. Using static fallback.`);
    }
    return this.staticKnowledge.filter(item => item.category.toLowerCase() === category.toLowerCase());
  }

  async getAll(): Promise<KnowledgeItemData[]> {
    try {
      const items = await this.prisma.knowledgeItem.findMany();
      if (items.length > 0) return items;
    } catch (e) {
      this.logger.warn(`Prisma getAll failed. Using static fallback.`);
    }
    return this.staticKnowledge;
  }
}
