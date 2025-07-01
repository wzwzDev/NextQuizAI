import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OpenAIGenerator from "../../components/admin/OpenAIGenerator";

describe("OpenAIGenerator", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("renders textarea and button", () => {
    render(<OpenAIGenerator onQuizReady={jest.fn()} />);
    expect(screen.getByPlaceholderText(/Enter topic or text/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generate/i })).toBeInTheDocument();
  });

  it("disables button when prompt is empty", () => {
    render(<OpenAIGenerator onQuizReady={jest.fn()} />);
    expect(screen.getByRole("button", { name: /generate/i })).toBeDisabled();
  });

  it("shows loading state and calls API, then displays questions", async () => {
    const mockQuestions = [
      { question: "What is AI?", answer: "Artificial Intelligence" },
      { question: "What is ML?", answer: "Machine Learning" },
    ];
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ questions: mockQuestions }),
    }) as any;
    const onQuizReady = jest.fn();

    render(<OpenAIGenerator onQuizReady={onQuizReady} />);
    fireEvent.change(screen.getByPlaceholderText(/Enter topic or text/i), {
      target: { value: "AI" },
    });
    const button = screen.getByRole("button", { name: /generate/i });
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(screen.getByText(/Generating.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("Q:").length).toBe(2);
      expect(screen.getAllByText("A:").length).toBe(2);
      expect(screen.getByText(/What is AI\?/)).toBeInTheDocument();
      expect(screen.getByText(/Artificial Intelligence/)).toBeInTheDocument();
      expect(onQuizReady).toHaveBeenCalledWith({
        title: "AI",
        questions: mockQuestions,
      });
    });
  });

  it("shows error if API returns no questions", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ questions: [] }),
    }) as any;
    render(<OpenAIGenerator onQuizReady={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/Enter topic or text/i), {
      target: { value: "AI" },
    });
    fireEvent.click(screen.getByRole("button", { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to generate quiz questions/i)).toBeInTheDocument();
    });
  });

  it("shows error if fetch throws", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
    render(<OpenAIGenerator onQuizReady={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/Enter topic or text/i), {
      target: { value: "AI" },
    });
    fireEvent.click(screen.getByRole("button", { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });
});