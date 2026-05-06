import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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
    window.localStorage.clear();
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
      expect(screen.getByText("85")).toBeInTheDocument();
      expect(screen.getByText("70")).toBeInTheDocument();
      expect(screen.getByText("90%")).toBeInTheDocument();
      expect(screen.getByText("N/A")).toBeInTheDocument();
      expect(screen.getAllByText("5").length).toBeGreaterThan(0);
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

  it("paginates statistics when there are many entries", async () => {
    const manyStats = Array.from({ length: 12 }, (_, index) => ({
      quizId: String(index + 1),
      quizTitle: `Quiz ${index + 1}`,
      attempts: index + 1,
      averageScore: 70,
      completionRate: 80,
    }));

    (global.fetch as jest.Mock).mockImplementation(async () => ({
      json: async () => manyStats,
    }));

    render(<QuizStatistics />);

    await waitFor(() => {
      expect(screen.getByText("Quiz 1")).toBeInTheDocument();
    });

    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getByText("Quiz 12")).toBeInTheDocument();
  });

  it("allows changing page size and jumping to a page", async () => {
    const manyStats = Array.from({ length: 12 }, (_, index) => ({
      quizId: String(index + 1),
      quizTitle: `Quiz ${index + 1}`,
      attempts: index + 1,
      averageScore: 70,
      completionRate: 80,
    }));

    (global.fetch as jest.Mock).mockImplementation(async () => ({
      json: async () => manyStats,
    }));

    render(<QuizStatistics />);

    await waitFor(() => {
      expect(screen.getByText("Quiz 1")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Rows:"), {
      target: { value: "5" },
    });

    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Go to:"), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Go" }));

    expect(screen.getByText("Page 3 of 3")).toBeInTheDocument();
    expect(screen.getByText("Quiz 12")).toBeInTheDocument();
  });

  it("persists page size in localStorage", async () => {
    const manyStats = Array.from({ length: 12 }, (_, index) => ({
      quizId: String(index + 1),
      quizTitle: `Quiz ${index + 1}`,
      attempts: index + 1,
      averageScore: 70,
      completionRate: 80,
    }));

    (global.fetch as jest.Mock).mockImplementation(async () => ({
      json: async () => manyStats,
    }));

    window.localStorage.setItem("adminQuizStatsPageSize", "5");

    render(<QuizStatistics />);

    await waitFor(() => {
      expect(screen.getByText("Quiz 1")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Rows:")).toHaveValue("5");
  });
});