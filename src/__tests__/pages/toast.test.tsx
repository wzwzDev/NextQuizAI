jest.mock("@radix-ui/react-toast", () => {
  const React = require("react");
  return {
    Provider: ({ children }: any) => <div data-testid="toast-provider">{children}</div>,
    Viewport: React.forwardRef((props: any, ref: React.Ref<any>) => <div ref={ref} data-testid={props["data-testid"] || "toast-viewport"}>{props.children}</div>),
    Root: React.forwardRef((props: any, ref: React.Ref<any>) => <div ref={ref} data-testid={props["data-testid"] || "toast-root"}>{props.children}</div>),
    Title: ({ children }: any) => <div>{children}</div>,
    Description: ({ children }: any) => <div>{children}</div>,
    Close: React.forwardRef((props: any, ref: React.Ref<any>) => <button ref={ref} data-testid={props["data-testid"] || "toast-close"}>{props.children}</button>),
    Action: React.forwardRef((props: any, ref: React.Ref<any>) => <button ref={ref} data-testid={props["data-testid"] || "toast-action"}>{props.children}</button>),
  };
});
import React from "react";
import { render, screen } from "@testing-library/react";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from "../../components/ui/toast";

describe("Toast UI components", () => {
  it("renders ToastProvider and ToastViewport", () => {
    render(
      <ToastProvider>
        <ToastViewport data-testid="toast-viewport" />
      </ToastProvider>
    );
    expect(screen.getByTestId("toast-viewport")).toBeInTheDocument();
  });

  it("renders Toast with title and description", () => {
    render(
      <ToastProvider>
        <Toast data-testid="toast-root" variant="success">
          <ToastTitle>Success!</ToastTitle>
          <ToastDescription>This is a success message.</ToastDescription>
        </Toast>
      </ToastProvider>
    );
    expect(screen.getByText("Success!")).toBeInTheDocument();
    expect(screen.getByText("This is a success message.")).toBeInTheDocument();
  });

  it("renders ToastClose button", () => {
    render(
      <ToastProvider>
        <Toast>
          <ToastClose data-testid="toast-close" />
        </Toast>
      </ToastProvider>
    );
    expect(screen.getByTestId("toast-close")).toBeInTheDocument();
  });

  it("renders ToastAction button", () => {
    render(
      <ToastProvider>
        <Toast>
          <ToastAction data-testid="toast-action" altText="Undo the last action">Undo</ToastAction>
        </Toast>
      </ToastProvider>
    );
    expect(screen.getByTestId("toast-action")).toBeInTheDocument();
    expect(screen.getByText("Undo")).toBeInTheDocument();
  });
});