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
    "src/**/*.{js,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
    "!src/**/test-utils/**"
  ],
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