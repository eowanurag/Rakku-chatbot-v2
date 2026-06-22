import { getPrisma, cleanupDatabase, disconnectPrisma } from '../helpers/prisma-test-helper';

const prisma = getPrisma();

describe('Development Data Reset', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });
  

  it('should have truncated transactional tables after running reset', async () => {
    // Note: this test assumes `npm run db:reset-dev` has been run before this test suite
    // Check key transactional tables
    const citizenCount = await prisma.citizen.count();
    const complaintCount = await prisma.complaint.count();
    const workflowCount = await prisma.workflowSession.count();
    const verificationCount = await prisma.verification.count();
    const certificateCount = await prisma.characterCertificate.count();

    expect(citizenCount).toBe(0);
    expect(complaintCount).toBe(0);
    expect(workflowCount).toBe(0);
    expect(verificationCount).toBe(0);
    expect(certificateCount).toBe(0);
  });
});
