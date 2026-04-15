import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HomeClient from "../../components/home/HomeClient";

// Mock next/image to avoid SSR issues
jest.mock("next/image", () => (props: any) => <img {...props} />);

// Mock LoadingQuizzes
jest.mock("@/components/LoadingQuizzes", () => () => <div data-testid="loading-quizzes" />);

const mockQuizzes = [
  {
    id: "1",
    title: "Algebra Basics",
    category: "Math",
    difficulty: "Easy",
    quizType: "open_ended",
    questions: [{}, {}],
  },
  {
    id: "2",
    title: "Physics 101",
    category: "Science",
    difficulty: "Medium",
    quizType: "open_ended",
    questions: [{}],
  },
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
});