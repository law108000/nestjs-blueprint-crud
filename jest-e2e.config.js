module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/test/e2e/**/*.e2e-spec.ts',
    '<rootDir>/examples/apps/**/test/**/*.e2e-spec.ts',
  ],
  moduleNameMapper: {
    '^nestjs-blueprint-crud$': '<rootDir>/src/index.ts',
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.e2e.json',
    },
  },
  setupFilesAfterEnv: ['<rootDir>/test/e2e/setup.ts'],
  maxWorkers: 1,
};
