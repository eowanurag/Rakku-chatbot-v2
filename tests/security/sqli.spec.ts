import { ComplaintService } from '@backend/complaint/complaint.service';
import { PrismaService } from '@backend/prisma.service';

describe('SQL Injection Prevention Spec', () => {
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

  const sqlPayloads = [
    "' OR 1=1 --",
    "UNION SELECT username, password FROM users",
    "DROP TABLE \"Complaint\" CASCADE;",
    "'; SELECT pg_sleep(5); --"
  ];

  sqlPayloads.forEach((payload, idx) => {
    it(`should safely escape SQL injection payload ${idx}: "${payload}"`, async () => {
      // Create complaint directly via service
      const res = await complaintService.createComplaint('Theft', payload);
      expect(res.referenceNumber).toBeDefined();

      // Retrieve from database
      const retrieved = await prisma.complaint.findUnique({
        where: { referenceNumber: res.referenceNumber }
      });
      
      // If escaping worked correctly, the payload is treated as a literal string.
      expect(retrieved?.incidentDetails).toBe(payload);

      // Clean up
      await prisma.complaint.delete({
        where: { referenceNumber: res.referenceNumber }
      });
    });
  });
});
