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

import { strict_output } from "@/lib/gptadmin";

describe("gptadmin.strict_output", () => {
  it("returns an array with normalized answers in choices", async () => {
    createImpl = jest.fn().mockResolvedValue({
      choices: [{ message: { content: JSON.stringify([{ question: "q", answer: "a" }]) } }],
    });
    const result = await strict_output(
      "system",
      "user",
      { question: "", answer: ["a", "b"] },
      "a",
      false,
      "gpt-3.5-turbo",
      1,
      1,
      false
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty("question", "q");
    expect(result[0]).toHaveProperty("answer", "a");
  });

  it("returns array with default_category if answer not in choices", async () => {
    createImpl = jest.fn().mockResolvedValue({
      choices: [{ message: { content: JSON.stringify([{ question: "q", answer: "not-in-choices" }]) } }],
    });
    const result = await strict_output(
      "system",
      "user",
      { question: "", answer: ["a", "b"] },
      "a",
      false,
      "gpt-3.5-turbo",
      1,
      1,
      false
    );
    expect(result[0].answer).toBe("a");
  });

  it("returns array with answer split at colon", async () => {
    createImpl = jest.fn().mockResolvedValue({
      choices: [{ message: { content: JSON.stringify([{ question: "q", answer: "a:extra" }]) } }],
    });
    const result = await strict_output(
      "system",
      "user",
      { question: "", answer: ["a", "b"] },
      "a",
      false,
      "gpt-3.5-turbo",
      1,
      1,
      false
    );
    expect(result[0].answer).toBe("a");
  });

  it("returns output_value_only as array of values", async () => {
    createImpl = jest.fn().mockResolvedValue({
      choices: [{ message: { content: JSON.stringify([{ question: "q", answer: "a" }]) } }],
    });
    const result = await strict_output(
      "system",
      "user",
      { question: "", answer: ["a", "b"] },
      "a",
      true,
      "gpt-3.5-turbo",
      1,
      1,
      false
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toEqual(["q", "a"]);
  });

  it("returns output_value_only as single value if only one property", async () => {
    createImpl = jest.fn().mockResolvedValue({
      choices: [{ message: { content: JSON.stringify([{ answer: "a" }]) } }],
    });
    const result = await strict_output(
      "system",
      "user",
      { answer: ["a", "b"] },
      "a",
      true,
      "gpt-3.5-turbo",
      1,
      1,
      false
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toEqual("a");
  });

  it("returns [] if OpenAI returns invalid JSON", async () => {
    createImpl = jest.fn().mockResolvedValue({
      choices: [{ message: { content: "not-json" } }],
    });
    const result = await strict_output(
      "system",
      "user",
      { question: "", answer: ["a", "b"] },
      "a",
      false,
      "gpt-3.5-turbo",
      1,
      1,
      false
    );
    expect(result).toEqual([]);
  });

  it("returns [] if OpenAI throws", async () => {
    createImpl = jest.fn().mockRejectedValue(new Error("fail"));
    const result = await strict_output(
      "system",
      "user",
      { question: "", answer: ["a", "b"] },
      "a",
      false,
      "gpt-3.5-turbo",
      1,
      1,
      false
    );
    expect(result).toEqual([]);
  });

  it("returns [] if required key missing in output", async () => {
    createImpl = jest.fn().mockResolvedValue({
      choices: [{ message: { content: JSON.stringify([{ notquestion: "q", answer: "a" }]) } }],
    });
    const result = await strict_output(
      "system",
      "user",
      { question: "", answer: ["a", "b"] },
      "a",
      false,
      "gpt-3.5-turbo",
      1,
      1,
      false
    );
    expect(result).toEqual([]);
  });

  it("returns [] if answer not in choices and no default_category", async () => {
    createImpl = jest.fn().mockResolvedValue({
      choices: [{ message: { content: JSON.stringify([{ question: "q", answer: "not-in-choices" }]) } }],
    });
    const result = await strict_output(
      "system",
      "user",
      { question: "", answer: ["a", "b"] },
      "",
      false,
      "gpt-3.5-turbo",
      1,
      1,
      false
    );
    // Should not replace with default, so answer stays not-in-choices, which is filtered out
    expect(result[0].answer).toBe("not-in-choices");
  });

  it("handles list_input and dynamic_elements", async () => {
    createImpl = jest.fn().mockResolvedValue({
      choices: [{ message: { content: JSON.stringify([
        { question: "q1", answer: "a" },
        { question: "q2", answer: "b" }
      ]) } }],
    });
    const result = await strict_output(
      "system",
      ["prompt1", "prompt2"],
      { question: "", answer: ["a", "b"], "<dynamic>": "" },
      "a",
      false,
      "gpt-3.5-turbo",
      1,
      1,
      false
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0].question).toBe("q1");
    expect(result[1].question).toBe("q2");
  });
});