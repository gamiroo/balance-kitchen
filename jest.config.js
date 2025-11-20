// jest.config.js
module.exports = {
  testEnvironment: '<rootDir>/src/tests/minimal-dom-environment.js',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/test-setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    'next-auth/react': '<rootDir>/src/tests/mocks/next-auth-react.ts',
    '@testing-library/jest-dom': '<rootDir>/src/tests/mocks/jest-dom.ts',
    '@babel/runtime/helpers/(.*)$': '<rootDir>/src/tests/mocks/babel-helper.js',
    '\\.(css|less|scss|sass)$': '<rootDir>/src/tests/styleMock.js'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/types/**',
    '!src/tests/**',
    '!src/app/**/route.ts', // API routes tested separately
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
