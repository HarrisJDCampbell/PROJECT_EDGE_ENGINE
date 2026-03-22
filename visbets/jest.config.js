module.exports = {
  // Use ts-jest for TypeScript support without Expo runtime issues
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/__tests__/**',
  ],
  // Ignore node_modules except for specific packages
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|expo|@expo)/)',
  ],
  // Don't try to load Expo modules in tests
  modulePathIgnorePatterns: [
    '<rootDir>/node_modules/.cache',
    '<rootDir>/app/',
  ],
};
