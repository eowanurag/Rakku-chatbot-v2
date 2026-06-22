module.exports = {
  testMatch: ['**/tests/database/**/*.spec.ts'],
  testTimeout: 30000,
  detectOpenHandles: true,
  maxWorkers: 1,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
