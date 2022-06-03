module.exports = {
  globals: {
    __DEV__: true,
  },
  clearMocks: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/graph/', // an error is thrown, didn't figure out why
  ],
  coverageProvider: 'v8',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: [
    '**/*.test.ts',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
  ],
  transformIgnorePatterns: [
    '/node_modules/',
    '\\.pnp\\.[^\\/]+$',
  ],
};
