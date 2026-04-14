import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import QuizPage from "../../app/playme/[id]/page";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "quiz-1" }),
  useRouter: () => ({ push: mockPush }),
}));

describe("Playme QuizPage", () => {
  beforeEach(() => {
    mockPush.mockReset();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders MCQ options when quiz type is mcq", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        quiz: {
          id: "quiz-1",
          title: "MCQ Quiz",
          category: "General",
          difficulty: "easy",
          quizType: "mcq",
          questions: [
            {
              id: "q1",
              question: "What is 2 + 2?",
              options: ["3", "4", "5"],
            },
          ],
        },
      }),
    });

    render(<QuizPage />);

    expect(await screen.findByText("What is 2 + 2?")).toBeInTheDocument();
    expect(screen.getByLabelText("3")).toBeInTheDocument();
    expect(screen.getByLabelText("4")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/Type your answer/i),
    ).not.toBeInTheDocument();
  });

  it("submits selected MCQ answers to start-quiz POST endpoint", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          quiz: {
            id: "quiz-1",
            title: "MCQ Quiz",
            category: "General",
            difficulty: "easy",
            quizType: "mcq",
            questions: [
              {
                id: "q1",
                question: "What is 2 + 2?",
                options: ["3", "4", "5"],
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          quizId: "quiz-1",
          title: "MCQ Quiz",
          quizType: "mcq",
          score: 100,
          questionResults: [
            {
              question: "What is 2 + 2?",
              expectedAnswer: "4",
              userAnswer: "4",
              percentageSimilar: 100,
              isAccepted: true,
              gradingMethod: "exact_match",
            },
          ],
        }),
      });

    render(<QuizPage />);

    expect(await screen.findByText("What is 2 + 2?")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("4"));
    fireEvent.click(screen.getByRole("button", { name: /Finish/i }));

    await waitFor(() => {
      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(
        2,
      );
    });

    const postCall = (global.fetch as jest.Mock).mock.calls[1];
    expect(postCall[0]).toBe("/api/start-quiz");
    expect(postCall[1]).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    expect(JSON.parse(postCall[1].body)).toEqual({
      quizId: "quiz-1",
      answers: ["4"],
    });

    expect(await screen.findByText("Quiz Finished!")).toBeInTheDocument();
    expect(screen.getByText(/Score:/i)).toBeInTheDocument();
  });
});
