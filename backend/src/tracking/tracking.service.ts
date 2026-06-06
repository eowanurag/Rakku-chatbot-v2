import { Injectable } from '@nestjs/common';
import { ComplaintService } from '../complaint/complaint.service';
import { VerificationService } from '../verification/verification.service';
import { CertificateService } from '../certificate/certificate.service';
import { EventService } from '../event/event.service';

export interface TrackingStatus {
  referenceNumber: string;
  serviceType: string;
  status: string;
  updatedAt: Date;
  details: any;
}

@Injectable()
export class TrackingService {
  constructor(
    private complaintService: ComplaintService,
    private verificationService: VerificationService,
    private certificateService: CertificateService,
    private eventService: EventService,
  ) {}

  async track(refNum: string): Promise<TrackingStatus | null> {
    const refUpper = refNum.toUpperCase().trim();

    // 1. Check Complaint
    if (refUpper.startsWith('UP-CMP-')) {
      const cmp = await this.complaintService.getComplaint(refUpper);
      if (cmp) {
        return {
          referenceNumber: cmp.referenceNumber,
          serviceType: 'Complaint Registration',
          status: cmp.status,
          updatedAt: cmp.updatedAt,
          details: { type: cmp.complaintType, description: cmp.incidentDetails },
        };
      }
    }

    // 2. Check Verification
    if (refUpper.startsWith('UP-VER-')) {
      const ver = await this.verificationService.getVerification(refUpper);
      if (ver) {
        return {
          referenceNumber: ver.referenceNumber,
          serviceType: `${ver.verificationType} Verification`,
          status: ver.status,
          updatedAt: ver.updatedAt,
          details: { name: ver.name, address: ver.address },
        };
      }
    }

    // 3. Check Certificate
    if (refUpper.startsWith('UP-CER-')) {
      const cer = await this.certificateService.getCertificate(refUpper);
      if (cer) {
        return {
          referenceNumber: cer.referenceNumber,
          serviceType: 'Character Certificate',
          status: cer.status,
          updatedAt: cer.updatedAt,
          details: { name: cer.name, purpose: cer.purpose, district: cer.district },
        };
      }
    }

    // 4. Check Event
    if (refUpper.startsWith('UP-EVP-')) {
      const ev = await this.eventService.getEventPermission(refUpper);
      if (ev) {
        return {
          referenceNumber: ev.referenceNumber,
          serviceType: ev.eventType,
          status: ev.status,
          updatedAt: ev.updatedAt,
          details: { eventName: ev.eventName, location: ev.location, date: ev.date },
        };
      }
    }

    // Mock Fallback: If the user inputs a valid format reference number but it wasn't saved,
    // simulate a response to ensure demo scenarios function perfectly without database seeds.
    const formats = [
      { prefix: 'UP-CMP-', type: 'Complaint Registration' },
      { prefix: 'UP-VER-', type: 'Tenant Verification' },
      { prefix: 'UP-CER-', type: 'Character Certificate' },
      { prefix: 'UP-EVP-', type: 'Event Permission' },
    ];

    const match = formats.find(f => refUpper.startsWith(f.prefix));
    if (match && refUpper.length >= 15) {
      // Simulate status based on last digit
      const digit = refUpper.charCodeAt(refUpper.length - 1) % 5;
      const statuses = ['Submitted', 'Under Review', 'Pending Verification', 'Approved', 'Rejected'];
      return {
        referenceNumber: refUpper,
        serviceType: match.type,
        status: statuses[digit],
        updatedAt: new Date(Date.now() - 3600000 * 24 * 2), // 2 days ago
        details: { note: 'Simulated tracking data for prototype testing.' },
      };
    }

    return null;
  }
}
