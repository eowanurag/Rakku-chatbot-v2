import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const citizens = await prisma.citizen.findMany({
    where: { mobileNumber: { startsWith: "78787878" } }
  });
  console.log("Found", citizens.length, "citizens to delete.");
  for (const citizen of citizens) {
    const cid = citizen.id;
    await prisma.complaint.deleteMany({ where: { citizenId: cid } });
    await prisma.verification.deleteMany({ where: { citizenId: cid } });
    await prisma.characterCertificate.deleteMany({ where: { citizenId: cid } });
    await prisma.eventPermission.deleteMany({ where: { citizenId: cid } });
    await prisma.notification.deleteMany({ where: { citizenId: cid } });
    await prisma.workflowSession.deleteMany({ where: { citizenId: cid } });
    await prisma.citizen.delete({ where: { id: cid } });
  }
  console.log("Deletion complete.");
  await prisma.$disconnect();
}

main().catch(console.error);
