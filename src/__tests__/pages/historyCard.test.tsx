import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import HistoryCard from "../../components/dashboard/HistoryCard";

// Mock next/navigation useRouter
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock icon to avoid rendering SVGs
jest.mock("lucide-react", () => ({
  FileClock: () => <svg data-testid="file-clock" />,
}));

// Mock Card components
jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div data-testid="card-title" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>,
}));

describe("HistoryCard", () => {
  it("renders card with title and description", () => {
    render(<HistoryCard />);
    expect(screen.getByTestId("card-title")).toHaveTextContent("History");
    expect(screen.getByTestId("card-content")).toHaveTextContent("View past quiz attempts.");
    expect(screen.getByTestId("file-clock")).toBeInTheDocument();
  });

  it("calls router.push on card click", () => {
    const push = jest.fn();
    // Override the mock for this test
    jest.spyOn(require("next/navigation"), "useRouter").mockReturnValue({ push });
    render(<HistoryCard />);
    fireEvent.click(screen.getByTestId("card"));
    expect(push).toHaveBeenCalledWith("/history");
  });
});