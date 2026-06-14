import 'reflect-metadata';
import { ChatController } from '@backend/chat/chat.controller';
import { IntelligenceController } from '@backend/citizen-assistance/intelligence.controller';
import { EventController } from '@backend/event/event.controller';
import { JurisdictionRoutingController } from '@backend/jurisdiction-routing/jurisdiction-routing.controller';
import { AppModule } from '@backend/app.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('Rate Limiting Configuration Spec', () => {
  it('should verify global ThrottlerGuard registration in AppModule', () => {
    const providers = Reflect.getMetadata('providers', AppModule) || [];
    const hasGlobalGuard = providers.some((p: any) => {
      return p && p.provide === APP_GUARD && p.useClass === ThrottlerGuard;
    });
    expect(hasGlobalGuard).toBe(true);
  });

  const controllersToTest = [
    { controller: ChatController, method: 'sendMessage', expectedLimit: 15, expectedTtl: 60000 },
    { controller: EventController, method: 'create', expectedLimit: 15, expectedTtl: 60000 },
    { controller: IntelligenceController, method: 'submitFeedback', expectedLimit: 15, expectedTtl: 60000 },
    { controller: JurisdictionRoutingController, method: 'updateLifecycle', expectedLimit: 15, expectedTtl: 60000 },
  ];

  controllersToTest.forEach(({ controller, method, expectedLimit, expectedTtl }) => {
    it(`should verify strict rate limit decoration on ${controller.name}.${method}`, () => {
      const targetMethod = controller.prototype[method];
      expect(targetMethod).toBeDefined();

      const limit = Reflect.getMetadata('THROTTLER:LIMITdefault', targetMethod);
      const ttl = Reflect.getMetadata('THROTTLER:TTLdefault', targetMethod);

      expect(limit).toBe(expectedLimit);
      expect(ttl).toBe(expectedTtl);
    });
  });
});
