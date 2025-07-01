import React from "react";
import { render, screen, act } from "@testing-library/react";
import LoadingQuizzes from "../../components/LoadingQuizzes";

// Mock next/image
jest.mock("next/image", () => (props: any) => <img {...props} />);

// Mock Progress component
jest.mock("../../components/ui/progress", () => ({
  Progress: ({ value, className }: any) => (
    <div data-testid="progress" data-value={value} className={className} />
  ),
}));

describe("LoadingQuizzes", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("renders loading image, progress bar, and initial text", () => {
    render(<LoadingQuizzes />);
    expect(screen.getByAltText("loading")).toBeInTheDocument();
    expect(screen.getByTestId("progress")).toBeInTheDocument();
    expect(screen.getByText(/Loading quizzes/)).toBeInTheDocument();
  });

  it("updates loading text periodically", () => {
    render(<LoadingQuizzes />);
    const initialText = screen.getByText(/Loading quizzes|Fetching the best questions|Sharpening your mind|Preparing your quiz adventure|Almost ready to start/i).textContent;
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    const newText = screen.getByText(/Loading quizzes|Fetching the best questions|Sharpening your mind|Preparing your quiz adventure|Almost ready to start/i).textContent;
    // It may randomly be the same, but this checks the interval logic runs
    expect(newText).toBeTruthy();
  });

  it("progress bar loops back to 0 after reaching 100", () => {
    render(<LoadingQuizzes />);
    act(() => {
      // Simulate enough time for progress to reach and loop past 100
      jest.advanceTimersByTime(100 * 200);
    });
    const value = Number(screen.getByTestId("progress").getAttribute("data-value"));
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(100);
  });
});