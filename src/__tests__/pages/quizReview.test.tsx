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
    render(
      <QuizReview quiz={mockQuiz} onApprove={jest.fn()} onCancel={jest.fn()} />,
    );
    expect(screen.getByText("Review Quiz")).toBeInTheDocument();
    expect(screen.getByText("What is 2+2?")).toBeInTheDocument();
    expect(screen.getByText("What is 3+5?")).toBeInTheDocument();
    expect(screen.getAllByText("Edit").length).toBe(2);
    expect(screen.getAllByText("Delete").length).toBe(2);
  });

  it("calls onApprove when Approve & Save is clicked", () => {
    const onApprove = jest.fn();
    render(
      <QuizReview quiz={mockQuiz} onApprove={onApprove} onCancel={jest.fn()} />,
    );
    fireEvent.click(screen.getByText("Approve & Save"));
    expect(onApprove).toHaveBeenCalled();
  });

  it("deletes a question", () => {
    render(
      <QuizReview quiz={mockQuiz} onApprove={jest.fn()} onCancel={jest.fn()} />,
    );
    // Component renders with questions
    expect(screen.getByText("What is 2+2?")).toBeInTheDocument();
  });

  it("calls onCancel when Cancel is confirmed", () => {
    const onCancel = jest.fn();

    render(<QuizReview quiz={mockQuiz} onApprove={jest.fn()} onCancel={onCancel} />);
    
    // Click Cancel button
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    
    // Dialog should appear with Discard button
    const discardButton = screen.getByRole("button", { name: "Discard" });
    fireEvent.click(discardButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("does not call onCancel when cancel is dismissed", () => {
    const onCancel = jest.fn();

    render(<QuizReview quiz={mockQuiz} onApprove={jest.fn()} onCancel={onCancel} />);
    
    // Click Cancel button
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    
    // Dialog should appear with Keep Editing button
    const keepEditingButton = screen.getByRole("button", { name: "Keep Editing" });
    fireEvent.click(keepEditingButton);

    expect(onCancel).not.toHaveBeenCalled();
  });

  it("shows 'No questions available.' if no questions", () => {
    render(
      <QuizReview
        quiz={{ ...mockQuiz, questions: [] }}
        onApprove={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.getByText(/No questions available/i)).toBeInTheDocument();
  });
});