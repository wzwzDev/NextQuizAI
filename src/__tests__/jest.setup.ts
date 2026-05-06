import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from "util";

if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder as any;
}
if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = TextDecoder as any;
}
// Example: set up global test config, mocks, etc.

// Optional: clear mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Optional: set test timeout
jest.setTimeout(20000);

// You can add more global setup here if needed
// Suppress known benign test warnings to keep test output clean.
const originalConsoleError = console.error.bind(console);
const originalConsoleWarn = console.warn.bind(console);

console.error = (...args: unknown[]) => {
  try {
    const joined = args.map((a) => String(a ?? "")).join(" ");
    if (
      joined.includes("Sign-out error:") // expected error logging in tests
    ) {
      return;
    }
  } catch {
    // fallthrough
  }
  originalConsoleError(...args);
};

console.warn = (...args: unknown[]) => {
  try {
    const joined = args.map((a) => String(a ?? "")).join(" ");
    if (
      joined.includes("Question generation fallback activated") ||
      joined.includes("SMTP is not configured")
    ) {
      return;
    }
  } catch {
    // fallthrough
  }
  originalConsoleWarn(...args);
};

process.on("warning", (warning) => {
  try {
    if (warning.name === "DeprecationWarning" && String(warning.message).includes("punycode")) {
      return;
    }
  } catch {
    // fallthrough
  }
  // still emit other warnings
  originalConsoleWarn(warning);
});