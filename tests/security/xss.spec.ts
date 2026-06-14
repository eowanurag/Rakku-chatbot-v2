import { ComplaintService } from '@backend/complaint/complaint.service';
import { PrismaService } from '@backend/prisma.service';

describe('Cross-Site Scripting (XSS) Mitigation Spec', () => {
  let complaintService: ComplaintService;
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    complaintService = new ComplaintService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const xssPayloads = [
    "<script>alert('xss')</script>",
    "<img src=x onerror=alert(1)>",
    "javascript:alert(1)",
    "<svg/onload=alert(1)>"
  ];

  xssPayloads.forEach((payload, idx) => {
    it(`should safely store and handle XSS payload ${idx}: "${payload}" without corruption`, async () => {
      const res = await complaintService.createComplaint('Cyber Crime', payload);
      expect(res.referenceNumber).toBeDefined();

      const retrieved = await prisma.complaint.findUnique({
        where: { referenceNumber: res.referenceNumber }
      });
      expect(retrieved?.incidentDetails).toBe(payload);

      await prisma.complaint.delete({
        where: { referenceNumber: res.referenceNumber }
      });
    });
  });
});
