import React from "react";
import { render, screen } from "@testing-library/react";
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
});