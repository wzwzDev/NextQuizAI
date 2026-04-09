require('dotenv').config({ path: '.env.test' });

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/api/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  rootDir: ".",
  collectCoverage: true,
  coverageReporters: ["lcov", "text"],
  coverageDirectory: "coverage-backend",
  collectCoverageFrom: [
    "src/app/api/**/*.ts",
    "src/server/**/*.ts",
    "src/schemas/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
    "!src/**/test-utils/**"
  ],
  coverageThreshold: {
    "src/server/repositories/**/*.ts": {
      branches: 70,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    "src/server/services/**/*.ts": {
      branches: 45,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  reporters: [
    "default",
    ["jest-html-reporter", {
      "pageTitle": "Backend Test Report",
      "outputPath": "test-report-backend.html"
    }]
  ],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  }
};