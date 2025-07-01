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