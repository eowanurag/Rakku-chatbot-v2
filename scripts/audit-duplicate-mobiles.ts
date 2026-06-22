import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  // Find duplicate mobile numbers
  const duplicateMobilesGroup = await prisma.citizen.groupBy({
    by: ['mobileNumber'],
    _count: {
      id: true
    },
    having: {
      mobileNumber: {
        _count: {
          gt: 1
        }
      }
    }
  });

  const duplicateMobiles = duplicateMobilesGroup.map(g => g.mobileNumber);
  console.log(`Found duplicate mobile numbers: ${JSON.stringify(duplicateMobiles)}`);

  let duplicateRecordsRemoved = 0;

  for (const mobile of duplicateMobiles) {
    // Get all citizens with this mobile, sorted by updatedAt DESC (newest first)
    const citizens = await prisma.citizen.findMany({
      where: { mobileNumber: mobile },
      orderBy: { updatedAt: 'desc' }
    });

    const newest = citizens[0];
    const olderCitizens = citizens.slice(1);

    for (const older of olderCitizens) {
      // Delete referencing tables first to prevent constraint errors
      await prisma.characterCertificate.deleteMany({ where: { citizenId: older.id } });
      await prisma.complaint.deleteMany({ where: { citizenId: older.id } });
      await prisma.eventPermission.deleteMany({ where: { citizenId: older.id } });
      await prisma.notification.deleteMany({ where: { citizenId: older.id } });
      await prisma.verification.deleteMany({ where: { citizenId: older.id } });
      await prisma.submissionFingerprint.deleteMany({ where: { citizenId: older.id } });
      await prisma.citizenPreference.deleteMany({ where: { citizenId: older.id } });
      await prisma.conversationInsight.deleteMany({ where: { citizenId: older.id } });
      await prisma.citizenFeedback.deleteMany({ where: { citizenId: older.id } });

      // Now delete the citizen record
      await prisma.citizen.delete({ where: { id: older.id } });
      duplicateRecordsRemoved++;
    }
  }

  const remainingCitizens = await prisma.citizen.count();

  const report = {
    totalDuplicateMobiles: duplicateMobiles.length,
    duplicateRecordsRemoved,
    remainingCitizens
  };

  const reportsDir = path.resolve(__dirname, '../storage/reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(reportsDir, 'duplicate-mobile-report.json'),
    JSON.stringify(report, null, 2),
    'utf8'
  );

  console.log('Duplicate Mobile Cleanup Finished successfully:', report);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
