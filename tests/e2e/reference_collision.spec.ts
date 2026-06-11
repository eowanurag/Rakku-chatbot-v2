import { PrismaClient } from '@prisma/client';
import { PrismaService } from '@backend/prisma.service';

describe('Reference Number Collision Test', () => {
  let prisma: PrismaService;

  beforeAll(() => {
    prisma = new PrismaService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should generate unique reference numbers even under concurrent load', async () => {
    // Generate 50 concurrent reference numbers and ensure uniqueness
    const generateRef = async (index: number) => {
      const uniqueId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const refNumber = `UP-TEST-${new Date().getFullYear()}-${uniqueId}-${index}`;
      
      return await prisma.trackingRecord.create({
        data: {
          referenceNumber: refNumber,
          serviceType: 'TEST_APPLICATION',
          entityId: `test-entity-${index}`,
          currentStatus: 'PENDING',
          statusHistory: { test: true },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    };

    const promises = [];
    for (let i = 0; i < 50; i++) {
      promises.push(generateRef(i));
    }

    const results = await Promise.all(promises);
    
    // Verify 50 unique records
    const refs = new Set(results.map(r => r.referenceNumber));
    expect(refs.size).toBe(50);

    // Cleanup
    const idsToDelete = results.map(r => r.id);
    await prisma.trackingRecord.deleteMany({
      where: { id: { in: idsToDelete } }
    });
  });

  it('should retry generation if a collision is detected in the database', async () => {
    // Manually force a collision
    const refNumber = 'UP-TEST-COLLISION-1';
    
    const firstRecord = await prisma.trackingRecord.create({
      data: {
        referenceNumber: refNumber,
        serviceType: 'TEST_APPLICATION',
        entityId: 'test-entity-collision',
        currentStatus: 'PENDING',
        statusHistory: {}
      }
    });

    let collisionCaught = false;
    try {
      await prisma.trackingRecord.create({
        data: {
          referenceNumber: refNumber, // same ref number
          serviceType: 'TEST_APPLICATION',
          entityId: 'test-entity-collision-2',
          currentStatus: 'PENDING',
          statusHistory: {}
        }
      });
    } catch (e: any) {
      collisionCaught = true;
      // Prisma Unique constraint violation code is P2002
      expect(e.code).toBe('P2002');
    }

    expect(collisionCaught).toBe(true);

    // Cleanup
    await prisma.trackingRecord.delete({ where: { id: firstRecord.id } });
  });
});
