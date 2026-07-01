import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const citizens = await prisma.citizen.findMany({
    where: { mobileNumber: "7878787878" }
  });
  console.log("Number of citizens with 7878787878:", citizens.length);
  for (const c of citizens) {
    console.log("Citizen:", c);
  }
  await prisma.$disconnect();
}

main().catch(console.error);
