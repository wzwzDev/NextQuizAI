import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HomeClient from "../../components/home/HomeClient";

// Mock next/image to avoid SSR issues
jest.mock("next/image", () => (props: any) => <img {...props} />);

// Mock LoadingQuizzes
jest.mock("@/components/LoadingQuizzes", () => () => <div data-testid="loading-quizzes" />);

type QuizMock = {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  quizType: string;
  questions: unknown[];
  createdAt: string;
  attemptStatus?: "available" | "pending" | "completed";
};

const buildQuiz = (overrides: Partial<QuizMock> = {}): QuizMock => ({
  id: "1",
  title: "Algebra Basics",
  category: "Math",
  difficulty: "Easy",
  quizType: "open_ended",
  questions: [{}, {}],
  createdAt: "2024-01-01T10:00:00.000Z",
  attemptStatus: "available",
  ...overrides,
});

const mockQuizzes = [
  buildQuiz(),
  buildQuiz({
    id: "2",
    title: "Physics 101",
    category: "Science",
    difficulty: "Medium",
    createdAt: "2024-02-01T10:00:00.000Z",
  }),
];

describe("HomeClient", () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ quizzes: mockQuizzes }),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders loading state and then quizzes", async () => {
    render(<HomeClient />);
    expect(screen.getByTestId("loading-quizzes")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId("loading-quizzes")).not.toBeInTheDocument();
    });

    expect(screen.getAllByText("Algebra Basics").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Physics 101").length).toBeGreaterThan(0);
  });

  it("filters quizzes by category", async () => {
    render(<HomeClient />);
    await waitFor(() => {
      expect(screen.queryByTestId("loading-quizzes")).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Category:"), { target: { value: "Math" } });

    await waitFor(() => {
      expect(document.querySelector('a[href="/playme/1"]')).toBeInTheDocument();
      expect(document.querySelector('a[href="/playme/2"]')).not.toBeInTheDocument();
    });
  });

  it("filters quizzes by difficulty", async () => {
    render(<HomeClient />);

    await waitFor(() => {
      expect(screen.queryByTestId("loading-quizzes")).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Category:"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Difficulty:"), { target: { value: "medium" } });

    await waitFor(() => {
      expect(document.querySelector('a[href="/playme/2"]')).toBeInTheDocument();
      expect(document.querySelector('a[href="/playme/1"]')).not.toBeInTheDocument();
    });
  });

  it("shows error message on fetch failure", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.reject());
    render(<HomeClient />);
    expect(await screen.findByText("Error loading quizzes.")).toBeInTheDocument();
  });

  it("shows 'No quizzes found.' if filter returns nothing", async () => {
    render(<HomeClient />);

    await waitFor(() => {
      expect(screen.queryByTestId("loading-quizzes")).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Category:"), { target: { value: "Programming" } });
    expect(screen.getByText("No quizzes found.")).toBeInTheDocument();
  });

  it("paginates available quizzes", async () => {
    const manyQuizzes = Array.from({ length: 12 }, (_, index) =>
      buildQuiz({
        id: String(index + 1),
        title: `Quiz ${index + 1}`,
        createdAt: `2024-03-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`,
      }),
    );

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ quizzes: manyQuizzes }),
    });

    render(<HomeClient />);

    await waitFor(() => {
      expect(screen.queryByTestId("loading-quizzes")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    expect(screen.getAllByText("Quiz 12").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getAllByText("Quiz 1").length).toBeGreaterThan(0);
  });

  it("can hide completed quizzes with the toggle", async () => {
    const quizzesWithCompleted = [
      buildQuiz(),
      buildQuiz({
        id: "3",
        title: "Completed Quiz",
        attemptStatus: "completed",
        createdAt: "2024-04-01T10:00:00.000Z",
      }),
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ quizzes: quizzesWithCompleted }),
    });

    render(<HomeClient />);

    await waitFor(() => {
      expect(screen.queryByTestId("loading-quizzes")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Completed Quizzes")).toBeInTheDocument();
    expect(screen.getAllByText("Completed Quiz").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByLabelText("Show completed quizzes"));

    expect(screen.queryByText("Completed Quizzes")).not.toBeInTheDocument();
  });
});