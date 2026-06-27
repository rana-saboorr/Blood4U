module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  collectCoverageFrom: [
    'services/**/*.js',
    'controllers/**/*.js',
    'repositories/**/*.js',
    'utils/**/*.js',
    '!utils/logger.js',
    '!**/node_modules/**',
  ],
  testTimeout: 15000,
};
