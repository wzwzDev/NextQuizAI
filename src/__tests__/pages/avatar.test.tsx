import React from "react";
import { render } from "@testing-library/react";
import { Avatar, AvatarImage, AvatarFallback } from "../../components/ui/avatar";

// Mock Radix Avatar primitives for test environment
jest.mock("@radix-ui/react-avatar", () => {
  const React = require("react");
  return {
    __esModule: true,
    Root: React.forwardRef((props: any, ref: any) => <span ref={ref} {...props} />),
    Image: React.forwardRef((props: any, ref: any) => <img ref={ref} {...props} />),
    Fallback: React.forwardRef((props: any, ref: any) => <span ref={ref} {...props} />),
  };
});

describe("Avatar UI components", () => {
  it("renders Avatar root", () => {
    const { container } = render(<Avatar data-testid="avatar-root" />);
    expect(container.querySelector('[data-testid="avatar-root"]')).toBeInTheDocument();
  });

  it("renders AvatarImage with src", () => {
    const { getByAltText } = render(
      <Avatar>
        <AvatarImage src="test.png" alt="avatar" data-testid="avatar-image" />
      </Avatar>
    );
    expect(getByAltText("avatar")).toBeInTheDocument();
  });

  it("renders AvatarFallback", () => {
    const { getByText } = render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    );
    expect(getByText("AB")).toBeInTheDocument();
  });
});