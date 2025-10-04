const path = require('path');

module.exports = {
  rootDir: path.resolve(__dirname, '../..'),
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@examples/(.*)$': '<rootDir>/examples/$1',
  },
  collectCoverageFrom: ['examples/apps/**/*.(t|j)s'],
  coverageDirectory: '<rootDir>/coverage/examples',
  testEnvironment: 'node',
};
