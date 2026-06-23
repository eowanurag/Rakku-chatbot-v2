import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class DuplicateComplaintService {
  constructor(private readonly prisma: PrismaService) {}

  public async checkDuplicate(
    mobileNumber: string,
    complaintType: string,
    incidentDate: string,
    description: string
  ): Promise<{ isDuplicate: boolean; reason?: string; referenceNumber?: string }> {
    if (!mobileNumber) {
      return { isDuplicate: false };
    }

    // Find citizen(s) with matching mobile
    const citizens = await this.prisma.citizen.findMany({
      where: { mobileNumber },
      select: { id: true }
    });

    if (citizens.length === 0) {
      return { isDuplicate: false };
    }

    const citizenIds = citizens.map(c => c.id);

    // Find complaints with same type by these citizens
    const existingComplaints = await this.prisma.complaint.findMany({
      where: {
        citizenId: { in: citizenIds },
        complaintType: complaintType
      }
    });

    for (const comp of existingComplaints) {
      // 1. Check description similarity (word overlap)
      const desc1 = (description || '').toLowerCase().split(/\s+/).filter(Boolean);
      const desc2 = (comp.incidentDetails || '').toLowerCase().split(/\s+/).filter(Boolean);
      
      const commonWords = desc1.filter(w => desc2.includes(w));
      const similarity = (desc1.length + desc2.length) > 0 
        ? (2 * commonWords.length) / (desc1.length + desc2.length)
        : 0;

      // 2. check duplicate criteria: same mobile + same complaint type + (similar description OR same details)
      if (similarity > 0.6) {
        return {
          isDuplicate: true,
          reason: `A similar complaint with Reference Number ${comp.referenceNumber} has already been registered for this mobile number.`,
          referenceNumber: comp.referenceNumber
        };
      }
    }

    return { isDuplicate: false };
  }
}
