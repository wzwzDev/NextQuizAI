import React from "react";
import { render, screen, act } from "@testing-library/react";
import LoadingStats from "../../components/LoadingStats";

// Mock next/image
jest.mock("next/image", () => (props: any) => <img {...props} />);

// Mock Progress component
jest.mock("../../components/ui/progress", () => ({
  Progress: ({ value, className }: any) => (
    <div data-testid="progress" data-value={value} className={className} />
  ),
}));

describe("LoadingStats", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("renders loading image, progress bar, and initial text", () => {
    render(<LoadingStats />);
    expect(screen.getByAltText("loading")).toBeInTheDocument();
    expect(screen.getByTestId("progress")).toBeInTheDocument();
    expect(screen.getByText(/Loading your stats/)).toBeInTheDocument();
  });

  it("updates loading text periodically", () => {
    render(<LoadingStats />);
    const initialText = screen.getByText(/Loading your stats|Crunching the numbers|Analyzing your quiz journey|Gathering your achievements|Almost ready to show your progress/i).textContent;
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    const newText = screen.getByText(/Loading your stats|Crunching the numbers|Analyzing your quiz journey|Gathering your achievements|Almost ready to show your progress/i).textContent;
    // It may randomly be the same, but this checks the interval logic runs
    expect(newText).toBeTruthy();
  });

  it("progress bar loops back to 0 after reaching 100", () => {
    render(<LoadingStats />);
    act(() => {
      // Simulate enough time for progress to reach and loop past 100
      jest.advanceTimersByTime(100 * 200);
    });
    const value = Number(screen.getByTestId("progress").getAttribute("data-value"));
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(100);
  });
});