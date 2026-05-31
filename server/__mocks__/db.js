// Global mock for the MySQL pool — prevents real DB connections in tests
const pool = {
  execute:       jest.fn(),
  query:         jest.fn(),
  getConnection: jest.fn(),
};

module.exports = pool;
