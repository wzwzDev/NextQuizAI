import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import UserQuizStats from "../../components/UserQuizStats";

let mockSessionState: { data: { user: { name: string } } | null; status: "loading" | "authenticated" | "unauthenticated" } = {
  data: null,
  status: "loading",
};

jest.mock("next-auth/react", () => ({
  useSession: () => mockSessionState,
}));

jest.mock("../../components/LoadingStats", () => () => <div>Loading...</div>);

jest.mock("../../components/ui/table", () => ({
  Table: ({ children }: any) => <table>{children}</table>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableHead: ({ children }: any) => <th>{children}</th>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  TableCell: ({ children }: any) => <td>{children}</td>,
  TableCaption: ({ children }: any) => <caption>{children}</caption>,
}));

jest.mock("../../components/ui/chart", () => ({
  ChartContainer: ({ children }: any) => <div data-testid="chart">{children}</div>,
  ChartTooltip: () => <div data-testid="chart-tooltip" />,
  ChartLegend: () => <div data-testid="chart-legend" />,
}));

jest.mock("recharts", () => ({
  BarChart: ({ children }: any) => <svg data-testid="barchart">{children}</svg>,
  Bar: () => <rect data-testid="bar" />,
  XAxis: () => <g data-testid="xaxis" />,
  YAxis: () => <g data-testid="yaxis" />,
}));

const mockStats = [
  {
    id: "1",
    title: "Quiz 1",
    attempts: 3,
    averageScore: 80,
    lastAttempt: "2024-06-30T12:00:00Z",
  },
  {
    id: "2",
    title: "Quiz 2",
    attempts: 2,
    averageScore: 90,
    lastAttempt: "2024-07-01T10:00:00Z",
  },
];

describe("UserQuizStats", () => {
  beforeEach(() => {
    mockSessionState = {
      data: { user: { name: "Test User" } },
      status: "authenticated",
    };

    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ quizStats: mockStats }),
    }) as jest.Mock;
  });

  afterEach(() => {
    // @ts-expect-error cleanup in jsdom test environment
    global.fetch = undefined;
  });

  it("renders loading state", () => {
    mockSessionState = { data: null, status: "loading" };

    render(<UserQuizStats />);

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it("fetches and renders quiz stats when authenticated", async () => {
    render(<UserQuizStats />);

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });

    expect(screen.getByText("Recent Attempt")).toBeInTheDocument();
    expect(screen.getByText("Total Attempts")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Total Completed")).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.getByTestId("chart")).toBeInTheDocument();
  });
});
