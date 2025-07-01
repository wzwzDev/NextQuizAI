import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import QuizReview from "../../components/admin/QuizReview";

const mockQuiz = {
  title: "Sample Quiz",
  category: "Math",
  difficulty: "easy",
  questions: [
    { question: "What is 2+2?", answer: "4" },
    { question: "What is 3+5?", answer: "8" },
  ],
};

describe("QuizReview", () => {
  it("renders quiz info and questions", () => {
    render(<QuizReview quiz={mockQuiz} onApprove={jest.fn()} />);
    expect(screen.getByText("Review Quiz")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Sample Quiz")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Math")).toBeInTheDocument();
    expect(screen.getByDisplayValue("easy")).toBeInTheDocument();
    expect(screen.getByText("What is 2+2?")).toBeInTheDocument();
    expect(screen.getByText("What is 3+5?")).toBeInTheDocument();
    expect(screen.getAllByText("Edit").length).toBe(2);
    expect(screen.getAllByText("Delete").length).toBe(2);
  });

  it("edits a question and saves", () => {
    render(<QuizReview quiz={mockQuiz} onApprove={jest.fn()} />);
    fireEvent.click(screen.getAllByText("Edit")[0]);
    const inputQ = screen.getAllByDisplayValue("What is 2+2?")[0];
    const inputA = screen.getAllByDisplayValue("4")[0];
    fireEvent.change(inputQ, { target: { value: "What is 2+3?" } });
    fireEvent.change(inputA, { target: { value: "5" } });
    fireEvent.click(screen.getByText("Save"));
    expect(screen.getByText("What is 2+3?")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  

  it("deletes a question", () => {
    render(<QuizReview quiz={mockQuiz} onApprove={jest.fn()} />);
    fireEvent.click(screen.getAllByText("Delete")[0]);
    expect(screen.queryByText("What is 2+2?")).not.toBeInTheDocument();
  });

  it("calls onApprove with updated quiz", () => {
    const onApprove = jest.fn();
    render(<QuizReview quiz={mockQuiz} onApprove={onApprove} />);
    fireEvent.change(screen.getByDisplayValue("Sample Quiz"), { target: { value: "New Title" } });
    fireEvent.change(screen.getByDisplayValue("Math"), { target: { value: "Science" } });
    fireEvent.change(screen.getByDisplayValue("easy"), { target: { value: "hard" } });
    fireEvent.click(screen.getByText("Approve & Save"));
    expect(onApprove).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "New Title",
        category: "Science",
        difficulty: "hard",
      })
    );
  });

  it("shows 'No questions available.' if no questions", () => {
    render(<QuizReview quiz={{ ...mockQuiz, questions: [] }} onApprove={jest.fn()} />);
    expect(screen.getByText(/No questions available/i)).toBeInTheDocument();
  });
});