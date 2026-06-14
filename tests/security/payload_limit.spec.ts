import { ComplaintService } from '@backend/complaint/complaint.service';
import { PrismaService } from '@backend/prisma.service';

describe('Payload & Spam Protection Spec', () => {
  let complaintService: ComplaintService;
  let prisma: PrismaService;

  beforeAll(() => {
    prisma = new PrismaService();
    complaintService = new ComplaintService(prisma);
  });

  it('should safely process and validate standard size payloads', async () => {
    // Standard size: should work
    const res = await complaintService.createComplaint('Theft', 'Normal size details');
    expect(res.referenceNumber).toBeDefined();
    await prisma.complaint.delete({ where: { referenceNumber: res.referenceNumber } });
  });

  it('should handle deep nesting without crashing', async () => {
    let nestedObj: any = { val: 'base' };
    for (let i = 0; i < 100; i++) {
      nestedObj = { child: nestedObj };
    }

    // Checking that serialization and processing does not throw stack overflow
    const serialized = JSON.stringify(nestedObj);
    expect(serialized).toBeDefined();

    // Call service with large nested representation in details
    const res = await complaintService.createComplaint('Theft', serialized);
    expect(res.referenceNumber).toBeDefined();
    await prisma.complaint.delete({ where: { referenceNumber: res.referenceNumber } });
  });

  it('should handle large arrays without crashing', async () => {
    const largeArray = Array(10000).fill({ val: 'test' });
    const serialized = JSON.stringify(largeArray);
    
    const res = await complaintService.createComplaint('Theft', serialized);
    expect(res.referenceNumber).toBeDefined();
    await prisma.complaint.delete({ where: { referenceNumber: res.referenceNumber } });
  });
});
