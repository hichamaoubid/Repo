/** Pure domain logic runs in plain Node; UI tests can add a jest-expo project later. */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  transform: { '^.+\\.[jt]sx?$': 'babel-jest' },
  collectCoverageFrom: ['src/lib/**/*.ts', 'src/theme/**/*.ts', 'src/i18n/**/*.ts', '!**/__fixtures__/**', '!**/__tests__/**'],
};
