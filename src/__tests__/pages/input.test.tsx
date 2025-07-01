import React from "react";
import { render, screen } from "@testing-library/react";
import { Input } from "../../components/ui/input";

describe("Input", () => {
  it("renders with default props", () => {
    render(<Input />);
    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass("w-full");
  });

  it("applies custom className", () => {
    render(<Input className="custom-class" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("custom-class");
  });

  it("forwards ref", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("passes props to input", () => {
    render(<Input placeholder="Type here" disabled />);
    const input = screen.getByPlaceholderText("Type here");
    expect(input).toBeDisabled();
  });
});