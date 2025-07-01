import { POST } from "@/app/api/questions/route";
import { getAuthSession } from "@/lib/nextauth";
import { strict_output } from "@/lib/gpt";
jest.setTimeout(30000);
// Mock getAuthSession and strict_output
jest.mock("@/lib/nextauth", () => ({
  getAuthSession: jest.fn(),
}));
jest.mock("@/lib/gpt", () => ({
  strict_output: jest.fn(),
}));

describe("/api/questions Route Handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const callHandler = async (body: object) => {
    const req = new Request("http://localhost/api/questions", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    return await POST(req, {} as Response);
  };

  it("returns 200 and questions for valid open_ended request", async () => {
    (strict_output as jest.Mock).mockResolvedValue([
      { question: "What is AI?", answer: "Artificial Intelligence." },
    ]);
    const res = await callHandler({ amount: 1, topic: "AI", type: "open_ended" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.questions)).toBe(true);
    expect(json.questions[0].question).toBeDefined();
    expect(json.questions[0].answer).toBeDefined();
  });

  it("returns 200 and questions for valid mcq request", async () => {
    (strict_output as jest.Mock).mockResolvedValue([
      {
        question: "What is 2+2?",
        answer: "4",
        option1: "3",
        option2: "5",
        option3: "6",
      },
    ]);
    const res = await callHandler({ amount: 1, topic: "math", type: "mcq" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.questions)).toBe(true);
    expect(json.questions[0].option1).toBeDefined();
  });

  it("returns 400 for invalid body", async () => {
    const res = await callHandler({ topic: "", type: "mcq", amount: 0 });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 500 if strict_output throws", async () => {
    (strict_output as jest.Mock).mockRejectedValue(new Error("gpt fail"));
    const res = await callHandler({ amount: 1, topic: "AI", type: "open_ended" });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("An unexpected error occurred.");
  });

  // Uncomment if you enable authentication in the handler
  // it("returns 401 if not authenticated", async () => {
  //   (getAuthSession as jest.Mock).mockResolvedValue(null);
  //   const res = await callHandler({ amount: 1, topic: "AI", type: "open_ended" });
  //   expect(res.status).toBe(401);
  // });

  it("returns 500 on invalid JSON", async () => {
    const badRequest = new Request("http://localhost/api/questions", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(badRequest, {} as Response);
    expect(res?.status).toBe(500);
  });
});