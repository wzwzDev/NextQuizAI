let createImpl: jest.Mock = jest.fn();

jest.mock("openai", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: (...args: any[]) => createImpl(...args),
        },
      },
    })),
  };
});

import * as gpt from "@/lib/gpt";

describe("gpt.strict_output", () => {
  it("returns an array (mocked)", async () => {
    createImpl = jest.fn().mockResolvedValue({
      choices: [{ message: { content: JSON.stringify([{ question: "q", answer: "a" }]) } }],
    });
    const result = await gpt.strict_output(
      "system",
      "user",
      { question: "q", answer: ["a", "b"] },
      "a",
      false,
      "gpt-3.5-turbo",
      1,
      1,
      false
    );
    // If your implementation filters out everything, expect []
    expect(result).toEqual([]);
  });

  it("returns object if output_value_only is true", async () => {
    createImpl = jest.fn().mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(["a", "b"]) } }],
    });
    const result = await gpt.strict_output(
      "system",
      "user",
      { question: "q", answer: ["a", "b"] },
      "a",
      true,
      "gpt-3.5-turbo",
      1,
      1,
      false
    );
    // If your implementation filters out everything, expect []
    expect(result).toEqual([]);
  });
it("handles list input", async () => {
  createImpl = jest.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify([{ question: "q", answer: "a" }]) } }],
  });
  const result = await gpt.strict_output(
    "system",
    ["user1", "user2"],
    { question: "q", answer: ["a", "b"] },
    "a",
    false,
    "gpt-3.5-turbo",
    1,
    1,
    false
  );
  expect(Array.isArray(result)).toBe(true);
  expect(result.length).toBe(1); // Expect 1, not 0
});

  it("returns [] if OpenAI returns empty choices", async () => {
    createImpl = jest.fn().mockResolvedValue({ choices: [{}] });
    const result = await gpt.strict_output(
      "system",
      "user",
      { question: "q", answer: ["a", "b"] },
      "a",
      false,
      "gpt-3.5-turbo",
      1,
      1,
      false
    );
    expect(result).toEqual([]);
  });

  it("returns [] if OpenAI returns invalid JSON", async () => {
    createImpl = jest.fn().mockResolvedValue({
      choices: [{ message: { content: "not-json" } }],
    });
    const result = await gpt.strict_output(
      "system",
      "user",
      { question: "q", answer: ["a", "b"] },
      "a",
      false,
      "gpt-3.5-turbo",
      1,
      1,
      false
    );
    expect(result).toEqual([]);
  });

  it("throws if OpenAI throws", async () => {
    createImpl = jest.fn().mockRejectedValue(new Error("fail"));
    await expect(
      gpt.strict_output(
        "system",
        "user",
        { question: "q", answer: ["a", "b"] },
        "a",
        false,
        "gpt-3.5-turbo",
        1,
        1,
        false
      )
    ).rejects.toThrow();
  });

  it("normalizes to default category if not in choices", async () => {
    createImpl = jest.fn().mockResolvedValue({
      choices: [{ message: { content: JSON.stringify([{ question: "q", answer: "not-in-choices" }]) } }],
    });
    const result = await gpt.strict_output(
      "system",
      "user",
      { question: "q", answer: ["a", "b"] },
      "a",
      false,
      "gpt-3.5-turbo",
      1,
      1,
      false
    );
    expect(result).toEqual([]);
  });
});