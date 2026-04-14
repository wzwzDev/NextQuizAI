module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.env.setup.ts"],
  testMatch: ["**/__tests__/api/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  rootDir: ".",
  collectCoverage: true,
  coverageReporters: ["lcov", "text"],
  coverageDirectory: "coverage-backend",
  collectCoverageFrom: [
    "src/app/api/**/*.ts",
    "src/server/**/*.ts",
    "src/schemas/**/*.ts",
    "!src/server/**/index.ts",
    "!src/server/repositories/adminQuizRepository.ts",
    "!src/server/services/adminQuizService.ts",
    "!src/server/services/adminQuizAttemptService.ts",
    "!src/server/services/userService.ts",
    "!src/server/ai/experimental/**",
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