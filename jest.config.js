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
  moduleNameMapper: {
    '^@backend/(.*)$': '<rootDir>/backend/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1'
  }
};

module.exports = config;
