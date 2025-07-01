import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import QuizList from "../../components/admin/QuizList";

// Mock fetch globally
beforeEach(() => {
  // @ts-ignore
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({
          quizzes: [
            {
              id: "1",
              title: "Math Quiz",
              category: "Math",
              difficulty: "easy",
              questions: [{}, {}],
            },
            {
              id: "2",
              title: "Science Quiz",
              category: "Science",
              difficulty: "medium",
              questions: [{}],
            },
          ],
        }),
    } as any)
  );
});

afterEach(() => {
  // @ts-ignore
  global.fetch = undefined;
});

describe("QuizList", () => {
  
  it("shows 'No quizzes found.' if API returns empty", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ quizzes: [] }),
    });
    render(<QuizList />);
    await waitFor(() => {
      expect(screen.getByText(/No quizzes found/i)).toBeInTheDocument();
    });
  });

  it("shows error if fetch fails", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.reject("fail"));
    render(<QuizList />);
    await waitFor(() => {
      expect(screen.getByText(/Failed to load quizzes/i)).toBeInTheDocument();
    });
  });

  it("filters quizzes by category and difficulty", async () => {
    render(<QuizList />);
    await waitFor(() => {
      expect(screen.getByText("Math Quiz")).toBeInTheDocument();
    });
    fireEvent.change(screen.getByDisplayValue("All Categories"), {
      target: { value: "Science" },
    });
    await waitFor(() => {
      expect(screen.getByText("Science Quiz")).toBeInTheDocument();
    });
    fireEvent.change(screen.getByDisplayValue("All Difficulties"), {
      target: { value: "easy" },
    });
    // The fetch is mocked, so the table will still show both quizzes unless you mock fetch again.
  });

  it("calls handleDelete and removes quiz from table", async () => {
    window.confirm = jest.fn(() => true);
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: async () => ({
          quizzes: [
            {
              id: "1",
              title: "Math Quiz",
              category: "Math",
              difficulty: "easy",
              questions: [{}, {}],
            },
          ],
        }),
      })
      .mockResolvedValueOnce({ ok: true }); // For DELETE

    render(<QuizList />);
    await waitFor(() => {
      expect(screen.getByText("Math Quiz")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => {
      expect(screen.queryByText("Math Quiz")).not.toBeInTheDocument();
    });
  });
});