import { POST } from "@/app/api/questions/route";
jest.setTimeout(45000);

describe("/api/questions Route Handler", () => {
  const callHandler = async (body: object) => {
    const req = new Request("http://localhost/api/questions", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    return await POST(req);
  };

  it("handles valid request with real dependency behavior", async () => {
    const res = await callHandler({ amount: 1, topic: "AI", type: "open_ended" });
    const json = await res.json();

    if (process.env.OPENAI_API_KEY) {
      expect(res.status).toBe(200);
      expect(Array.isArray(json.questions)).toBe(true);
      expect(json.questions[0].question).toBeDefined();
      expect(json.questions[0].answer).toBeDefined();
      return;
    }

    expect(res.status).toBe(500);
    expect(json.error).toBe("An unexpected error occurred.");
  });

  it("returns 400 for invalid body (fails zod validation)", async () => {
    const res = await callHandler({ topic: "", type: "mcq", amount: 0 });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
    expect(Array.isArray(json.error)).toBe(true);
  });

  it("returns 500 on invalid JSON", async () => {
    const badRequest = new Request("http://localhost/api/questions", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(badRequest);
    expect(res?.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("An unexpected error occurred.");
  });
});