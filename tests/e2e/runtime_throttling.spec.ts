import { Test, TestingModule } from '../../backend/node_modules/@nestjs/testing';
import { INestApplication, ValidationPipe } from '../../backend/node_modules/@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '../../backend/node_modules/@nestjs/throttler';
import { APP_GUARD, Reflector } from '../../backend/node_modules/@nestjs/core';
import { ChatController } from '@backend/chat/chat.controller';
import { ChatService } from '@backend/chat/chat.service';
const request = require('supertest');

describe('Runtime Rate Limiting E2E', () => {
  let app: INestApplication;
  let chatServiceMock: any;

  beforeAll(async () => {
    chatServiceMock = {
      sendMessage: jest.fn().mockResolvedValue({
        success: true,
        response: 'Mock reply',
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{
          ttl: 60000,
          limit: 60,
        }]),
      ],
      controllers: [ChatController],
      providers: [
        Reflector,
        {
          provide: ChatService,
          useValue: chatServiceMock,
        },
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.getHttpAdapter().getInstance().set('trust proxy', true);
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should allow up to 15 requests, then return 429 on the 16th request', async () => {
    const server = app.getHttpServer();
    const payload = {
      message: 'Hello Assistant',
      sessionId: 'throttling-e2e-session',
    };

    // Make 15 successful requests from the same IP
    for (let i = 0; i < 15; i++) {
      const response = await request(server)
        .post('/chat')
        .set('x-forwarded-for', '203.0.113.195') // Simulate proxy header (Render)
        .send(payload);

      expect(response.status).toBe(201);
    }

    // 16th request should fail with 429
    const limitResponse = await request(server)
      .post('/chat')
      .set('x-forwarded-for', '203.0.113.195')
      .send(payload);

    expect(limitResponse.status).toBe(429);
  });

  it('should allow requests from different client IPs without triggering limit', async () => {
    const server = app.getHttpServer();
    const payload = {
      message: 'Hello Assistant',
      sessionId: 'throttling-e2e-session-diff',
    };

    // Client with a different IP should succeed
    const response = await request(server)
      .post('/chat')
      .set('x-forwarded-for', '198.51.100.42')
      .send(payload);

    expect(response.status).toBe(201);
  });
});
