import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import QuizUpload from "../../components/admin/QuizUpload";

describe("QuizUpload", () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn();
  });

  afterEach(() => {
    // @ts-ignore
    global.fetch = undefined;
  });

  it("renders upload area and button", () => {
    render(<QuizUpload onQuizReady={jest.fn()} />);
    expect(screen.getByText(/Drag & drop or click to select a JSON\/TXT file/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Upload & Generate/i })).toBeInTheDocument();
  });

  it("shows error for invalid file type", () => {
    render(<QuizUpload onQuizReady={jest.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["dummy"], "test.pdf", { type: "application/pdf" });
    fireEvent.change(input, {
      target: { files: [file] },
    });
    expect(screen.getByText(/Only JSON or TXT files are accepted/i)).toBeInTheDocument();
  });

  it("accepts valid file and enables upload", () => {
    render(<QuizUpload onQuizReady={jest.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["{}"], "test.json", { type: "application/json" });
    fireEvent.change(input, {
      target: { files: [file] },
    });
    expect(screen.getByText(/test.json/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Upload & Generate/i })).not.toBeDisabled();
  });

 

  it("calls onQuizReady on successful upload", async () => {
    const mockQuestions = [{ question: "Q1", answer: "A1" }];
    // @ts-ignore
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ questions: mockQuestions }),
    });
    const onQuizReady = jest.fn();
    render(<QuizUpload onQuizReady={onQuizReady} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['{"questions":[{"question":"Q1","answer":"A1"}]}'], "quiz.json", { type: "application/json" });
    fireEvent.change(input, {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: /Upload & Generate/i }));
    await waitFor(() => {
      expect(onQuizReady).toHaveBeenCalledWith({
        title: "quiz.json",
        questions: mockQuestions,
      });
    });
  });

  it("shows error if API returns no questions", async () => {
    // @ts-ignore
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({}),
    });
    render(<QuizUpload onQuizReady={jest.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["{}"], "test.json", { type: "application/json" });
    fireEvent.change(input, {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: /Upload & Generate/i }));
    await waitFor(() => {
      expect(screen.getByText(/Failed to generate quiz from file/i)).toBeInTheDocument();
    });
  });

  it("shows error if fetch throws", async () => {
    // @ts-ignore
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
    render(<QuizUpload onQuizReady={jest.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["{}"], "test.json", { type: "application/json" });
    fireEvent.change(input, {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: /Upload & Generate/i }));
    await waitFor(() => {
      expect(screen.getByText(/Failed to generate quiz from file/i)).toBeInTheDocument();
    });
  });
});