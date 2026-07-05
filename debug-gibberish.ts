// Quick test to see which cases are failing
import { isGibberish } from "@/schemas/forms/quiz";

const testCases = [
  { input: "a", expected: false, name: "single letter 'a'" },
  { input: "b", expected: true, name: "single consonant 'b'" },
  { input: "xylophone", expected: false, name: "xylophone" },
  { input: "python3", expected: false, name: "python3" },
  { input: "string", expected: true, name: "string with str cluster" },
  { input: "bcdfg", expected: true, name: "consonant cluster bcdfg" },
];

console.log("\n🔍 Testing isGibberish():");
testCases.forEach(({ input, expected, name }) => {
  const result = isGibberish(input);
  const status = result === expected ? "✅" : "❌";
  console.log(`${status} ${name}: isGibberish("${input}") = ${result} (expected ${expected})`);
});
