require('dotenv').config({ path: '.env.test' });

module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testMatch: ["**/__tests__/**/*.test.tsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  rootDir: ".",
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/jest.setup.ts"],
  collectCoverage: true,
  coverageReporters: ["lcov", "text"],
  coverageDirectory: "coverage-frontend",
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  collectCoverageFrom: [
    "src/components/admin/OpenAIGenerator.tsx",
    "src/components/ui/avatar.tsx",
    "src/components/ui/button.tsx",
    "src/components/ui/card.tsx",
    "src/components/ui/dialog.tsx",
    "src/components/ui/input.tsx",
    "src/components/ui/navigation-menu.tsx",
    "src/components/ui/table.tsx",
    "src/components/ui/toast.tsx",
    "src/app/auth/verify-email/page.tsx",
    "src/app/auth/verify-email/verify-email-content.tsx",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
    "!src/**/test-utils/**"
  ],
  reporters: [
    "default",
    ["jest-html-reporter", {
      "pageTitle": "Test Report",
      "outputPath": "test-report.html"
    }]
  ],
  transform: {
    "^.+\\.(ts|tsx)$": ["babel-jest", { configFile: "./babel.jest.config.js" }]
  }
};