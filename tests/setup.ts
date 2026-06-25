import { disconnectPrisma } from './helpers/prisma-test-helper';

jest.setTimeout(180000);

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

afterAll(async () => {
  await disconnectPrisma();
  console.log('__DATABASE_TESTS_DONE__');
});
