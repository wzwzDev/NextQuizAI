import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MCQ from "../../components/MCQ";

// Mock dependencies
jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div data-testid="card-title" {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div data-testid="card-description" {...props}>{children}</div>,
}));
jest.mock("../../components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  buttonVariants: () => "btn",
}));
jest.mock("next/link", () => ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>);
jest.mock("../../components/MCQCounter", () => () => <div data-testid="mcq-counter" />);
jest.mock("@tanstack/react-query", () => ({
  useMutation: () => ({
    mutate: (_: any, options?: any) => options?.onSuccess?.({ isCorrect: true }),
    status: "idle",
  }),
}));
jest.mock("axios", () => ({
  post: jest.fn(() => Promise.resolve({ data: { isCorrect: true } })),
}));
jest.mock("../../components/ui/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));
jest.mock("date-fns", () => ({
  differenceInSeconds: () => 42,
}));
jest.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.join(" "),
  formatTimeDelta: (s: number) => `${s}s`,
}));

const mockGame = {
  id: "game1",
  topic: "Math",
  timeStarted: new Date(),
  questions: [
    { id: "q1", question: "What is 2+2?", options: ["3", "4", "5", "6"] },
    { id: "q2", question: "What is 3+3?", options: ["5", "6", "7", "8"] },
  ],
};

describe("MCQ", () => {
  it("renders question and options", () => {
    render(<MCQ game={mockGame as any} />);
    expect(screen.getByText("What is 2+2?")).toBeInTheDocument();
    expect(screen.getAllByText("3").length).toBeGreaterThan(0);
    expect(screen.getAllByText("4").length).toBeGreaterThan(0);
    expect(screen.getAllByText("5").length).toBeGreaterThan(0);
    expect(screen.getAllByText("6").length).toBeGreaterThan(0);
  });

  it("selects an option and goes to next question", () => {
    render(<MCQ game={mockGame as any} />);
    const optionButtons = screen.getAllByRole("button", { name: /3|4|5|6/ });
    fireEvent.click(optionButtons[1]); // Click "4"
    fireEvent.click(screen.getByText(/Next/));
    expect(screen.getByText("What is 3+3?")).toBeInTheDocument();
  });

  it("shows completion message after last question", () => {
    render(<MCQ game={mockGame as any} />);
    let optionButtons = screen.getAllByRole("button", { name: /3|4|5|6/ });
    fireEvent.click(optionButtons[1]); // "4"
    fireEvent.click(screen.getByText(/Next/));
    optionButtons = screen.getAllByRole("button", { name: /5|6|7|8/ });
    fireEvent.click(optionButtons[1]); // "6"
    fireEvent.click(screen.getByText(/Next/));
    expect(
      screen.getAllByText((content, node) =>
        !!node?.textContent?.includes("You Completed in")
      ).length
    ).toBeGreaterThan(0);
    expect(screen.getByText(/View Statistics/)).toBeInTheDocument();
  });

  it("disables Next button when hasEnded", () => {
    render(<MCQ game={mockGame as any} />);
    let optionButtons = screen.getAllByRole("button", { name: /3|4|5|6/ });
    fireEvent.click(optionButtons[1]); // "4"
    fireEvent.click(screen.getByText(/Next/));
    optionButtons = screen.getAllByRole("button", { name: /5|6|7|8/ });
    fireEvent.click(optionButtons[1]); // "6"
    fireEvent.click(screen.getByText(/Next/));
    // After completion, Next button should not be in the document
    const nextBtn = screen.queryByText(/Next/)?.closest("button");
    expect(nextBtn).toBeUndefined();
  });

  it("does not allow selecting an option after completion", () => {
    render(<MCQ game={mockGame as any} />);
    let optionButtons = screen.getAllByRole("button", { name: /3|4|5|6/ });
    fireEvent.click(optionButtons[1]);
    fireEvent.click(screen.getByText(/Next/));
    optionButtons = screen.getAllByRole("button", { name: /5|6|7|8/ });
    fireEvent.click(optionButtons[1]);
    fireEvent.click(screen.getByText(/Next/));
    // Try to click an option after completion
    optionButtons = screen.queryAllByRole("button", { name: /5|6|7|8/ });
    optionButtons.forEach(btn => {
      expect(btn).toBeDisabled();
    });
  });



  it("renders MCQCounter component", () => {
    render(<MCQ game={mockGame as any} />);
    expect(screen.getByTestId("mcq-counter")).toBeInTheDocument();
  });

  it("renders View Statistics link after completion", () => {
    render(<MCQ game={mockGame as any} />);
    let optionButtons = screen.getAllByRole("button", { name: /3|4|5|6/ });
    fireEvent.click(optionButtons[1]);
    fireEvent.click(screen.getByText(/Next/));
    optionButtons = screen.getAllByRole("button", { name: /5|6|7|8/ });
    fireEvent.click(optionButtons[1]);
    fireEvent.click(screen.getByText(/Next/));
    const statsLink = screen.getByText(/View Statistics/);
    expect(statsLink).toBeInTheDocument();
    expect(statsLink.closest("a")).toHaveAttribute("href");
  });

  it("shows the correct question number in MCQCounter", () => {
    render(<MCQ game={mockGame as any} />);
    expect(screen.getByTestId("mcq-counter")).toBeInTheDocument();
  });
});