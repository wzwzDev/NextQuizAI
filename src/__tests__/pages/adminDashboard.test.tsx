import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import AdminDashboardClient from "../../components/admin/AdminDashboardClient";

// Mock child components to isolate the dashboard layout logic
jest.mock("@/components/admin/QuizUpload", () => () => <div>QuizUpload</div>);
jest.mock("@/components/admin/QuizReview", () => () => <div>QuizReview</div>);
jest.mock("@/components/admin/QuizList", () => () => <div>QuizList</div>);
jest.mock("@/components/admin/QuizStatistics", () => () => <div>QuizStatistics</div>);
jest.mock("@/components/admin/UserManagement", () => () => <div>UserManagement</div>);

describe("AdminDashboardClient", () => {
  it("renders dashboard sections", () => {
    render(<AdminDashboardClient />);
    expect(screen.getByText(/Admin Dashboard/)).toBeInTheDocument();
    expect(screen.getByText(/Upload New Quiz/)).toBeInTheDocument();
    expect(screen.getByText(/Quiz Statistics/)).toBeInTheDocument();
    expect(screen.getByText(/Quiz Review \/ List/)).toBeInTheDocument();
    expect(screen.getByText(/User Management/)).toBeInTheDocument();
    expect(screen.getByText("QuizUpload")).toBeInTheDocument();
    expect(screen.getByText("QuizStatistics")).toBeInTheDocument();
    expect(screen.getByText("QuizList")).toBeInTheDocument();
    expect(screen.getByText("UserManagement")).toBeInTheDocument();
  });

  it("opens centered dialog when a card expand button is clicked", () => {
    render(<AdminDashboardClient />);

    expect(screen.getAllByText("QuizStatistics")).toHaveLength(1);

    fireEvent.click(
      screen.getByRole("button", { name: /expand quiz statistics/i }),
    );

    expect(screen.getAllByText("QuizStatistics")).toHaveLength(2);
    expect(screen.getAllByText("Overview of quiz performance and stats.")).toHaveLength(2);
  });

  it("supports keyboard open/close shortcuts and minimize action", () => {
    render(<AdminDashboardClient />);

    expect(screen.getAllByText("QuizList")).toHaveLength(1);

    fireEvent.keyDown(window, { key: "2", altKey: true });
    expect(screen.getAllByText("QuizList")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: /minimize expanded section/i }));
    expect(screen.getAllByText("QuizList")).toHaveLength(1);

    fireEvent.keyDown(window, { key: "3", altKey: true });
    expect(screen.getAllByText("UserManagement")).toHaveLength(2);

    fireEvent.keyDown(window, { key: "0", altKey: true });
    expect(screen.getAllByText("UserManagement")).toHaveLength(1);
  });
});