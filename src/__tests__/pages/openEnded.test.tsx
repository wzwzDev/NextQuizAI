import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OpenEnded from "../../components/OpenEnded";

// Mocks
jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));
jest.mock("../../components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  buttonVariants: () => "btn",
}));
jest.mock("../../components/OpenEndedPercentage", () => () => <div data-testid="open-ended-percentage" />);
jest.mock("../../components/BlankAnswerInput", () => ({ setBlankAnswer, onAnswerChange }: any) => (
  <input
    data-testid="blank-input"
    onChange={e => {
      setBlankAnswer(e.target.value);
      onAnswerChange?.(e.target.value);
    }}
    defaultValue=""
  />
));
jest.mock("@tanstack/react-query", () => ({
  useMutation: () => ({
    mutate: (_?: any, { onSuccess }: any = {}) => onSuccess?.({ percentageSimilar: 80 }),
    status: "idle",
  }),
}));
jest.mock("axios", () => ({
  post: jest.fn(() => Promise.resolve({ data: { percentageSimilar: 80 } })),
}));
jest.mock("../../components/ui/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));
jest.mock("date-fns", () => ({
  differenceInSeconds: () => 42,
}));
jest.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
  formatTimeDelta: (s: number) => `${s}s`,
}));

const mockGame = {
  id: "game1",
  topic: "Science",
  timeStarted: new Date(),
  questions: [
    { id: "q1", question: "What is H2O?", answer: "Water" },
    { id: "q2", question: "What planet is known as the Red Planet?", answer: "Mars" },
  ],
};

describe("OpenEnded", () => {
  it("renders question and topic", () => {
    render(<OpenEnded game={mockGame as any} />);
    expect(screen.getByText("What is H2O?")).toBeInTheDocument();
    expect(screen.getByText("Science")).toBeInTheDocument();
    expect(screen.getByTestId("open-ended-percentage")).toBeInTheDocument();
  });

  it("calls checkAnswer and goes to next question on Next click", async () => {
    render(<OpenEnded game={mockGame as any} />);
    fireEvent.change(screen.getByTestId("blank-input"), { target: { value: "Water" } });
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    await waitFor(() => {
      expect(screen.getByText("What planet is known as the Red Planet?")).toBeInTheDocument();
    });
  });

  it("shows completion message after last question", async () => {
    render(<OpenEnded game={mockGame as any} />);
    // Answer first question
    fireEvent.change(screen.getByTestId("blank-input"), { target: { value: "Water" } });
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    // Answer second question
    fireEvent.change(screen.getByTestId("blank-input"), { target: { value: "Mars" } });
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    await waitFor(() => {
      expect(screen.getByText(/You Completed in/)).toBeInTheDocument();
      expect(screen.getByText(/View Statistics/)).toBeInTheDocument();
    });
  });

  it("disables Next button when hasEnded", async () => {
    render(<OpenEnded game={mockGame as any} />);
    // Complete all questions
    fireEvent.change(screen.getByTestId("blank-input"), { target: { value: "Water" } });
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    fireEvent.change(screen.getByTestId("blank-input"), { target: { value: "Mars" } });
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    await waitFor(() => {
      expect(screen.getByText(/You Completed in/)).toBeInTheDocument();
    });
    // Button should not be in the document
    expect(screen.queryByRole("button", { name: /Next/i })).not.toBeInTheDocument();
  });

  it("renders a textarea for code-style questions", () => {
    const codeGame = {
      ...mockGame,
      questions: [
        {
          id: "q-code",
          question: "console.log('Hello world');",
          answer: "Hello world",
        },
      ],
    };

    render(<OpenEnded game={codeGame as any} />);

    expect(screen.getByText(/console\.log/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/output here/i)).toBeInTheDocument();
  });

  it("renders fill-blank input for [FILL_BLANK] script questions", () => {
    const fillBlankCodeGame = {
      ...mockGame,
      questions: [
        {
          id: "q-code-blank",
          question: "[FILL_BLANK] Complete output\\n\\nconsole.log('A');\\nOutput: _____",
          answer: "A",
        },
      ],
    };

    render(<OpenEnded game={fillBlankCodeGame as any} />);

    expect(screen.getByText(/Code Output Challenge/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type exact output/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/output here/i)).not.toBeInTheDocument();
  });

  describe("Answer variations tolerance", () => {
    it("accepts answer with different case - uppercase", async () => {
      render(<OpenEnded game={mockGame as any} />);
      // Answer with uppercase instead of lowercase
      fireEvent.change(screen.getByTestId("blank-input"), { target: { value: "WATER" } });
      fireEvent.click(screen.getByRole("button", { name: /Next/i }));
      // Should proceed to next question without error (mock returns 80% match)
      await waitFor(() => {
        expect(screen.getByText("What planet is known as the Red Planet?")).toBeInTheDocument();
      });
    });

    it("accepts answer with mixed case", async () => {
      render(<OpenEnded game={mockGame as any} />);
      // Answer with mixed case
      fireEvent.change(screen.getByTestId("blank-input"), { target: { value: "WaTeR" } });
      fireEvent.click(screen.getByRole("button", { name: /Next/i }));
      await waitFor(() => {
        expect(screen.getByText("What planet is known as the Red Planet?")).toBeInTheDocument();
      });
    });

    it("accepts answer with trailing period", async () => {
      render(<OpenEnded game={mockGame as any} />);
      // Answer with period at the end
      fireEvent.change(screen.getByTestId("blank-input"), { target: { value: "Water." } });
      fireEvent.click(screen.getByRole("button", { name: /Next/i }));
      await waitFor(() => {
        expect(screen.getByText("What planet is known as the Red Planet?")).toBeInTheDocument();
      });
    });

    it("accepts answer with leading/trailing spaces", async () => {
      render(<OpenEnded game={mockGame as any} />);
      // Answer with spaces
      fireEvent.change(screen.getByTestId("blank-input"), { target: { value: "  Water  " } });
      fireEvent.click(screen.getByRole("button", { name: /Next/i }));
      await waitFor(() => {
        expect(screen.getByText("What planet is known as the Red Planet?")).toBeInTheDocument();
      });
    });

    it("accepts answer with comma by mistake", async () => {
      render(<OpenEnded game={mockGame as any} />);
      // Answer with comma
      fireEvent.change(screen.getByTestId("blank-input"), { target: { value: "Water," } });
      fireEvent.click(screen.getByRole("button", { name: /Next/i }));
      await waitFor(() => {
        expect(screen.getByText("What planet is known as the Red Planet?")).toBeInTheDocument();
      });
    });

    it("accepts answer with exclamation mark", async () => {
      render(<OpenEnded game={mockGame as any} />);
      // Answer with exclamation
      fireEvent.change(screen.getByTestId("blank-input"), { target: { value: "Water!" } });
      fireEvent.click(screen.getByRole("button", { name: /Next/i }));
      await waitFor(() => {
        expect(screen.getByText("What planet is known as the Red Planet?")).toBeInTheDocument();
      });
    });

    it("accepts answer with one extra space in the middle", async () => {
      render(<OpenEnded game={mockGame as any} />);
      // Answer with extra space
      fireEvent.change(screen.getByTestId("blank-input"), { target: { value: "Water  " } });
      fireEvent.click(screen.getByRole("button", { name: /Next/i }));
      await waitFor(() => {
        expect(screen.getByText("What planet is known as the Red Planet?")).toBeInTheDocument();
      });
    });

    it("processes all questions with mixed case answers", async () => {
      render(<OpenEnded game={mockGame as any} />);
      // Answer first question with lowercase
      fireEvent.change(screen.getByTestId("blank-input"), { target: { value: "water" } });
      fireEvent.click(screen.getByRole("button", { name: /Next/i }));
      // Answer second question with uppercase
      fireEvent.change(screen.getByTestId("blank-input"), { target: { value: "MARS" } });
      fireEvent.click(screen.getByRole("button", { name: /Next/i }));
      await waitFor(() => {
        expect(screen.getByText(/You Completed in/)).toBeInTheDocument();
      });
    });
  });
});