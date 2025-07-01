import React from "react";
import { render, screen } from "@testing-library/react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";

// Mock Radix Dialog primitives for test environment
jest.mock("@radix-ui/react-dialog", () => {
  const React = require("react");
  return {
    __esModule: true,
    Root: ({ children }: any) => <div data-testid="dialog-root">{children}</div>,
    Trigger: React.forwardRef((props: any, ref: any) => <button ref={ref} {...props} />),
    Portal: ({ children }: any) => <div data-testid="dialog-portal">{children}</div>,
    Overlay: React.forwardRef((props: any, ref: any) => <div ref={ref} data-testid="dialog-overlay" {...props} />),
    Content: React.forwardRef((props: any, ref: any) => <div ref={ref} data-testid="dialog-content" {...props} />),
    Close: React.forwardRef((props: any, ref: any) => <button ref={ref} data-testid="dialog-close" {...props} />),
    Title: React.forwardRef((props: any, ref: any) => <h2 ref={ref} data-testid="dialog-title" {...props} />),
    Description: React.forwardRef((props: any, ref: any) => <p ref={ref} data-testid="dialog-description" {...props} />),
  };
});

describe("Dialog UI components", () => {
  it("renders Dialog with content and header/footer", () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogHeader>
          <div>Dialog body</div>
          <DialogFooter>
            <button>Footer Button</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId("dialog-root")).toBeInTheDocument();
    expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
    expect(screen.getByTestId("dialog-title")).toHaveTextContent("Dialog Title");
    expect(screen.getByTestId("dialog-description")).toHaveTextContent("Dialog description");
    expect(screen.getByText("Dialog body")).toBeInTheDocument();
    expect(screen.getByText("Footer Button")).toBeInTheDocument();
  });
});