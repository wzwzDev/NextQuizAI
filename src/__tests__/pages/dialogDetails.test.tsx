import React from "react";
import { render, screen } from "@testing-library/react";
import DetailsDialog from "../../components/DialogDetails";

// Mock Dialog and Image components to isolate DetailsDialog
jest.mock("../../components/ui/dialog", () => ({
  Dialog: ({ children }: any) => <div data-testid="dialog">{children}</div>,
  DialogTrigger: ({ children }: any) => <button data-testid="dialog-trigger">{children}</button>,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
}));

jest.mock("lucide-react", () => ({
  HelpCircle: () => <svg data-testid="help-circle" />,
}));

jest.mock("next/image", () => (props: any) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img {...props} />
));

describe("DetailsDialog", () => {
  it("renders About trigger and dialog content", () => {
    render(<DetailsDialog />);
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("dialog-trigger")).toHaveTextContent("About");
    expect(screen.getByTestId("help-circle")).toBeInTheDocument();
    expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
    expect(screen.getByTestId("dialog-header")).toBeInTheDocument();
    expect(screen.getByTestId("dialog-title")).toHaveTextContent("Welcome to QuizUPM!");
    expect(screen.getByTestId("dialog-description")).toHaveTextContent("QuizUPM");
    expect(screen.getByAltText("planetscale")).toBeInTheDocument();
    expect(screen.getByAltText("nextjs")).toBeInTheDocument();
    expect(screen.getByAltText("tailwind")).toBeInTheDocument();
    expect(screen.getByAltText("nextauth")).toBeInTheDocument();
    expect(screen.getByAltText("openai")).toBeInTheDocument();
    expect(screen.getByAltText("react query")).toBeInTheDocument();
    expect(screen.getByAltText("primsa")).toBeInTheDocument();
    expect(screen.getByAltText("typescript")).toBeInTheDocument();
    expect(screen.getByText("Wael Louati")).toBeInTheDocument();
    expect(screen.getByText("Alonso Valverde")).toBeInTheDocument();
  });
});