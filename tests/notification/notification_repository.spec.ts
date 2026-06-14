import { NotificationRepository } from '@backend/notification/notification.repository';
import { NotificationService } from '@backend/notification/notification.service';
import { PrismaService } from '@backend/prisma.service';
import { NotificationChannel, NotificationStatus } from '../../backend/node_modules/@prisma/client';

describe('Notification Infrastructure Test Suite', () => {
  let repository: NotificationRepository;
  let service: NotificationService;
  let prisma: PrismaService;
  let citizenId: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();

    repository = new NotificationRepository(prisma);
    service = new NotificationService(repository);

    // Create a mock citizen to verify relations
    const citizen = await prisma.citizen.create({
      data: {
        fullName: 'Notification Test Citizen',
        mobileNumber: '7766554433',
        isConfirmed: true,
      },
    });
    citizenId = citizen.id;
  });

  afterAll(async () => {
    // Clean up notifications and test citizen
    await prisma.notification.deleteMany({ where: { citizenId } });
    await prisma.citizen.delete({ where: { id: citizenId } });
    await prisma.$disconnect();
  });

  it('should create a notification via repository and verify fields', async () => {
    const notification = await repository.create({
      citizenId,
      channel: NotificationChannel.SMS,
      status: NotificationStatus.PENDING,
      template: 'MOCK_OTP_TEMPLATE',
      workflowType: 'CHARACTER_CERTIFICATE',
      workflowId: 'CC-2026-9999',
      metadata: { otp: '123456' },
    });

    expect(notification).toBeDefined();
    expect(notification.id).toBeDefined();
    expect(notification.channel).toBe(NotificationChannel.SMS);
    expect(notification.status).toBe(NotificationStatus.PENDING);
    expect(notification.template).toBe('MOCK_OTP_TEMPLATE');
    expect(notification.workflowType).toBe('CHARACTER_CERTIFICATE');
    expect(notification.workflowId).toBe('CC-2026-9999');
    expect((notification.metadata as any).otp).toBe('123456');

    // Verify relation lookup
    const retrieved = await repository.findById(notification.id);
    expect(retrieved?.citizen).toBeDefined();
    expect(retrieved?.citizen?.fullName).toBe('Notification Test Citizen');
  });

  it('should transition status via repository', async () => {
    const notification = await repository.create({
      citizenId,
      channel: NotificationChannel.WHATSAPP,
      status: NotificationStatus.PENDING,
      template: 'MOCK_ALERT',
    });

    const updated = await repository.updateStatus(notification.id, NotificationStatus.SENT);
    expect(updated.status).toBe(NotificationStatus.SENT);
    expect(updated.sentAt).toBeDefined();

    const failedUpdate = await repository.updateStatus(notification.id, NotificationStatus.FAILED);
    expect(failedUpdate.status).toBe(NotificationStatus.FAILED);
  });

  it('should send notification via service and automatically transition to SENT', async () => {
    const notification = await service.sendNotification({
      channel: NotificationChannel.PUSH,
      template: 'WELCOME_PUSH',
      citizenId,
      workflowType: 'LOST_MOBILE',
      workflowId: 'LM-2026-0000',
      metadata: { message: 'Welcome to Rakku!' },
    });

    expect(notification).toBeDefined();
    expect(notification.channel).toBe(NotificationChannel.PUSH);
    expect(notification.status).toBe(NotificationStatus.SENT);
    expect(notification.sentAt).toBeDefined();
    expect(notification.workflowType).toBe('LOST_MOBILE');
    expect(notification.workflowId).toBe('LM-2026-0000');
  });
});
