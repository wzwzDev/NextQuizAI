import React from "react";
import { render } from "@testing-library/react";
import { Button } from "../../components/ui/button";

describe("Button", () => {
  it("renders with default props", () => {
    const { getByRole } = render(<Button>Click me</Button>);
    const btn = getByRole("button");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent("Click me");
  });

  it("applies variant and size classes", () => {
    const { getByRole } = render(
      <Button variant="destructive" size="lg">
        Danger
      </Button>
    );
    const btn = getByRole("button");
    expect(btn.className).toMatch(/bg-destructive/);
    expect(btn.className).toMatch(/h-10/);
    expect(btn).toHaveTextContent("Danger");
  });

  it("renders as a child component when asChild is true", () => {
    const { getByText } = render(
      <Button asChild>
        <a href="#">Link</a>
      </Button>
    );
    const link = getByText("Link");
    expect(link.tagName).toBe("A");
  });
});