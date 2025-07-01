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
    questions: [{}, {}],
  },
  {
    id: "2",
    title: "Physics 101",
    category: "Science",
    difficulty: "Medium",
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
    expect(await screen.findByText("Algebra Basics")).toBeInTheDocument();
    expect(screen.getByText("Physics 101")).toBeInTheDocument();
  });

  it("filters quizzes by category", async () => {
    render(<HomeClient />);
    await screen.findByText("Algebra Basics");
    fireEvent.change(screen.getByLabelText("Category:"), { target: { value: "Math" } });
    expect(screen.getByText("Algebra Basics")).toBeInTheDocument();
    expect(screen.queryByText("Physics 101")).not.toBeInTheDocument();
  });

  it("filters quizzes by difficulty", async () => {
    render(<HomeClient />);
    await screen.findByText("Algebra Basics");
    fireEvent.change(screen.getByLabelText("Difficulty:"), { target: { value: "Medium" } });
    expect(screen.getByText("Physics 101")).toBeInTheDocument();
    expect(screen.queryByText("Algebra Basics")).not.toBeInTheDocument();
  });

  it("shows error message on fetch failure", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.reject());
    render(<HomeClient />);
    expect(await screen.findByText("Error loading quizzes.")).toBeInTheDocument();
  });

  it("shows 'No quizzes found.' if filter returns nothing", async () => {
    render(<HomeClient />);
    await screen.findByText("Algebra Basics");
    fireEvent.change(screen.getByLabelText("Category:"), { target: { value: "Programming" } });
    expect(screen.getByText("No quizzes found.")).toBeInTheDocument();
  });
});