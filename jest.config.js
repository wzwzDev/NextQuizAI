require('dotenv').config({ path: '.env.test' });

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node", // or "jsdom" if you use React Testing Library
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  rootDir: ".",
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/jest.setup.ts"],
  collectCoverage: true,
  coverageReporters: ["lcov", "text"],
  coverageDirectory: "coverage",
  reporters: [
    "default",
    ["jest-html-reporter", {
      "pageTitle": "Test Report",
      "outputPath": "test-report.html"
    }]
  ]
};