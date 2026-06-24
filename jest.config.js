const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', '<rootDir>/backend/node_modules'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { isolatedModules: true }],
  },
  collectCoverageFrom: [
    'backend/src/**/*.(t|j)s',
    'frontend/src/**/*.(t|j)s'
  ],
  coverageDirectory: './coverage',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 60000,
  moduleNameMapper: {
    '^@backend/complaint/(.*)$': '<rootDir>/backend/src/workflows/complaint/$1',
    '^@backend/verification/(.*)$': '<rootDir>/backend/src/workflows/verification/$1',
    '^@backend/certificate/(.*)$': '<rootDir>/backend/src/workflows/certificate/$1',
    '^@backend/event/(.*)$': '<rootDir>/backend/src/workflows/event/$1',
    '^@backend/tracking/(.*)$': '<rootDir>/backend/src/workflows/tracking/$1',
    '^@backend/(.*)$': '<rootDir>/backend/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1'
  }
};

module.exports = config;
