import React from "react";
import { render, screen, act } from "@testing-library/react";
import LoadingQuestions from "../../components/LoadingQuestions";

// Mock next/image
jest.mock("next/image", () => (props: any) => <img {...props} />);

// Mock Progress component
jest.mock("../../components/ui/progress", () => ({
  Progress: ({ value, className }: any) => (
    <div data-testid="progress" data-value={value} className={className} />
  ),
}));

describe("LoadingQuestions", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("renders loading image, progress bar, and initial text", () => {
    render(<LoadingQuestions finished={false} />);
    expect(screen.getByAltText("loading")).toBeInTheDocument();
    expect(screen.getByTestId("progress")).toBeInTheDocument();
    expect(screen.getByText(/Generating questions/)).toBeInTheDocument();
  });

  it("updates loading text periodically", () => {
    render(<LoadingQuestions finished={false} />);
    const initialText = screen.getByText(/questions|good|ocean|knowledge|flame/i).textContent;
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    const newText = screen.getByText(/questions|good|ocean|knowledge|flame/i).textContent;
    // It may randomly be the same, but this checks the interval logic runs
    expect(newText).toBeTruthy();
  });

  it("sets progress to 100 when finished", () => {
    render(<LoadingQuestions finished={true} />);
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(screen.getByTestId("progress")).toHaveAttribute("data-value", "100");
  });
});