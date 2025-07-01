import React from "react";
import { render, screen } from "@testing-library/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "../../components/ui/dropdown-menu";

// Mock Radix DropdownMenu primitives for test environment
jest.mock("@radix-ui/react-dropdown-menu", () => {
  const React = require("react");
  return {
    __esModule: true,
    Root: ({ children }: any) => <div data-testid="dropdown-root">{children}</div>,
    Trigger: React.forwardRef((props: any, ref: any) => <button ref={ref} data-testid="dropdown-trigger" {...props} />),
    Content: React.forwardRef((props: any, ref: any) => <div ref={ref} data-testid="dropdown-content" {...props} />),
    Item: React.forwardRef((props: any, ref: any) => <div ref={ref} data-testid="dropdown-item" {...props} />),
    CheckboxItem: React.forwardRef((props: any, ref: any) => <div ref={ref} data-testid="dropdown-checkbox-item" {...props} />),
    RadioItem: React.forwardRef((props: any, ref: any) => <div ref={ref} data-testid="dropdown-radio-item" {...props} />),
    Label: React.forwardRef((props: any, ref: any) => <div ref={ref} data-testid="dropdown-label" {...props} />),
    Separator: React.forwardRef((props: any, ref: any) => <div ref={ref} data-testid="dropdown-separator" {...props} />),
    Group: ({ children }: any) => <div data-testid="dropdown-group">{children}</div>,
    Portal: ({ children }: any) => <div data-testid="dropdown-portal">{children}</div>,
    Sub: ({ children }: any) => <div data-testid="dropdown-sub">{children}</div>,
    SubContent: React.forwardRef((props: any, ref: any) => <div ref={ref} data-testid="dropdown-sub-content" {...props} />),
    SubTrigger: React.forwardRef((props: any, ref: any) => <button ref={ref} data-testid="dropdown-sub-trigger" {...props} />),
    RadioGroup: ({ children }: any) => <div data-testid="dropdown-radio-group">{children}</div>,
    ItemIndicator: ({ children }: any) => <span data-testid="dropdown-item-indicator">{children}</span>,
  };
});

describe("DropdownMenu UI components", () => {
  it("renders DropdownMenu with trigger and content", () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByTestId("dropdown-root")).toBeInTheDocument();
    expect(screen.getByTestId("dropdown-trigger")).toHaveTextContent("Open");
    expect(screen.getByTestId("dropdown-content")).toBeInTheDocument();
    expect(screen.getByTestId("dropdown-item")).toHaveTextContent("Item 1");
  });

  it("renders CheckboxItem, RadioItem, Label, Separator, and Shortcut", () => {
    render(
      <DropdownMenu>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem>Check</DropdownMenuCheckboxItem>
          <DropdownMenuRadioItem value="radio1">Radio</DropdownMenuRadioItem>
          <DropdownMenuLabel>Label</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByTestId("dropdown-checkbox-item")).toHaveTextContent("Check");
    expect(screen.getByTestId("dropdown-radio-item")).toHaveTextContent("Radio");
    expect(screen.getByTestId("dropdown-label")).toHaveTextContent("Label");
    expect(screen.getByTestId("dropdown-separator")).toBeInTheDocument();
    expect(screen.getByText("Ctrl+S")).toBeInTheDocument();
  });

  it("renders Group, Portal, Sub, SubContent, SubTrigger, and RadioGroup", () => {
    render(
      <DropdownMenu>
        <DropdownMenuPortal>
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>SubTrigger</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>SubContent</DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuRadioGroup>
              <DropdownMenuRadioItem value="radio-item">RadioItem</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuPortal>
      </DropdownMenu>
    );
    expect(screen.getByTestId("dropdown-portal")).toBeInTheDocument();
    expect(screen.getByTestId("dropdown-group")).toBeInTheDocument();
    expect(screen.getByTestId("dropdown-sub")).toBeInTheDocument();
    expect(screen.getByTestId("dropdown-sub-trigger")).toHaveTextContent("SubTrigger");
    expect(screen.getByTestId("dropdown-sub-content")).toHaveTextContent("SubContent");
    expect(screen.getByTestId("dropdown-radio-group")).toBeInTheDocument();
    expect(screen.getByTestId("dropdown-radio-item")).toHaveTextContent("RadioItem");
  });
});