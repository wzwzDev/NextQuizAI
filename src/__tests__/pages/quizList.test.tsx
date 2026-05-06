import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import QuizList from "../../components/admin/QuizList";

// Mock fetch globally
beforeEach(() => {
  // @ts-ignore
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
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
      ok: true,
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
      expect(screen.queryByText("Math Quiz")).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue("All Difficulties"), {
      target: { value: "easy" },
    });

    await waitFor(() => {
      expect(screen.queryByText("Science Quiz")).not.toBeInTheDocument();
      expect(screen.queryByText("Math Quiz")).not.toBeInTheDocument();
      expect(screen.getByText(/No quizzes found/i)).toBeInTheDocument();
    });
  });

  it("calls handleDelete and removes quiz from table", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
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
          total: 1,
        }),
      })
      .mockResolvedValueOnce({ ok: true }); // For DELETE

    render(<QuizList />);
    await waitFor(() => {
      expect(screen.getByText("Math Quiz")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText("Delete")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Delete quiz" }));
    await waitFor(() => {
      expect(screen.queryByText("Math Quiz")).not.toBeInTheDocument();
    });
  });

  it("deletes all quizzes on the current page", async () => {
    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo) => {
      const url = String(input);
      if (url.includes("/api/quiz-review?") && !url.includes("id=")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
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
            total: 2,
          }),
        } as any);
      }

      return Promise.resolve({ ok: true } as any);
    });

    render(<QuizList />);

    await waitFor(() => {
      expect(screen.getByText("Math Quiz")).toBeInTheDocument();
      expect(screen.getByText("Science Quiz")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Delete page" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete page" }));

    await waitFor(() => {
      expect(screen.queryByText("Math Quiz")).not.toBeInTheDocument();
      expect(screen.queryByText("Science Quiz")).not.toBeInTheDocument();
    });
  });

  it("deletes selected quizzes", async () => {
    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo) => {
      const url = String(input);
      if (url.includes("/api/quiz-review?") && !url.includes("id=")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
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
            total: 2,
          }),
        } as any);
      }

      return Promise.resolve({ ok: true } as any);
    });

    render(<QuizList />);

    await waitFor(() => {
      expect(screen.getByText("Math Quiz")).toBeInTheDocument();
      expect(screen.getByText("Science Quiz")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Select Math Quiz"));
    fireEvent.click(screen.getByRole("button", { name: "Delete selected" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete selected" }));

    await waitFor(() => {
      expect(screen.queryByText("Math Quiz")).not.toBeInTheDocument();
      expect(screen.getByText("Science Quiz")).toBeInTheDocument();
    });
  });
});