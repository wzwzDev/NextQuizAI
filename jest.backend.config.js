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
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  collectCoverageFrom: [
    "src/app/api/**/*.ts",
    "src/server/**/*.ts",
    "src/schemas/**/*.ts",
    "!src/app/api/auth/[...nextauth]/route.ts",
    "!src/app/api/auth/register/route.ts",
    "!src/app/api/auth/verify-email/route.ts",
    "!src/server/ai/**",
    "!src/server/auth/**",
    "!src/server/core/auth.ts",
    "!src/server/core/quizQuestionMetadata.ts",
    "!src/server/mailer/email.ts",
    "!src/server/question-generation/generateQuestions.ts",
    "!src/server/services/questionGenerationService.ts",
    "!src/server/services/uploadQuizGenerationService.ts",
    "!src/server/services/authRegistrationService.ts",
    "!src/server/admin/services/aiReviewService.ts",
    "!src/server/**/index.ts",
    "!src/server/repositories/adminQuizRepository.ts",
    "!src/server/services/adminQuizService.ts",
    "!src/server/services/adminQuizAttemptService.ts",
    "!src/server/services/userService.ts",
    "!src/server/ai/experimental/**",
    "!src/server/repositories/userQuizAttemptRepository.ts",
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