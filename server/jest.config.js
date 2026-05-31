module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFiles: ['./jest.setup.js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    'routes/**/*.js',
    'models/**/*.js',
  ],
  coverageThreshold: {
    global: { lines: 60 },
  },
  moduleNameMapper: {
    '^../config/db$': '<rootDir>/__mocks__/db.js',
    '^./config/db$':  '<rootDir>/__mocks__/db.js',
  },
};
