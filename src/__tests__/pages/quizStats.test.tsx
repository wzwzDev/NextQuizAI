import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import QuizStatistics from "../../components/admin/QuizStatistics";

const mockStats = [
  {
    quizId: "1",
    quizTitle: "Math Quiz",
    attempts: 10,
    averageScore: 85,
    completionRate: 90,
  },
  {
    quizId: "2",
    quizTitle: "Science Quiz",
    attempts: 5,
    averageScore: 70,
    // completionRate is undefined
  },
];

describe("QuizStatistics", () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => mockStats,
    });
  });

  afterEach(() => {
    // @ts-ignore
    global.fetch = undefined;
  });

  it("renders table headers and fetched statistics", async () => {
    render(<QuizStatistics />);
    expect(screen.getByText(/Quiz Statistics/i)).toBeInTheDocument();
    expect(screen.getByText(/Quiz Title/i)).toBeInTheDocument();
    expect(screen.getByText(/Attempts/i)).toBeInTheDocument();
    expect(screen.getByText(/Average Score/i)).toBeInTheDocument();
    expect(screen.getByText(/Completion Rate/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Math Quiz")).toBeInTheDocument();
      expect(screen.getByText("Science Quiz")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("85")).toBeInTheDocument();
      expect(screen.getByText("70")).toBeInTheDocument();
      expect(screen.getByText("90%")).toBeInTheDocument();
      expect(screen.getByText("N/A")).toBeInTheDocument();
    });
  });

  it("handles fetch error gracefully", async () => {
    // @ts-ignore
    global.fetch = jest.fn().mockRejectedValue(new Error("API error"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    render(<QuizStatistics />);
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        "Error fetching quiz statistics:",
        expect.any(Error)
      );
    });
    errorSpy.mockRestore();
  });
});