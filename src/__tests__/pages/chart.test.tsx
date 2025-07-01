import React from "react";
import { render } from "@testing-library/react";
import { ChartContainer, ChartLegendContent, ChartTooltipContent } from "../../components/ui/chart";

// Mock recharts primitives to avoid rendering actual charts in tests
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Tooltip: (props: any) => <div data-testid="tooltip" {...props} />,
  Legend: (props: any) => <div data-testid="legend" {...props} />,
}));

describe("ChartContainer", () => {
  it("renders ChartContainer with children", () => {
    const config = { foo: { color: "#000", label: "Foo" } };
    const { getByTestId } = render(
      <ChartContainer config={config}>
        <div>Chart Content</div>
      </ChartContainer>
    );
    expect(getByTestId("responsive-container")).toBeInTheDocument();
    expect(getByTestId("responsive-container")).toHaveTextContent("Chart Content");
  });
});

describe("ChartLegendContent", () => {
  it("renders legend items", () => {
    const config = { foo: { color: "#000", label: "Foo" } };
    const payload = [{ dataKey: "foo", color: "#000", value: "Foo" }];
    const { getByText } = render(
      <ChartContainer config={config}>
        <ChartLegendContent payload={payload} />
      </ChartContainer>
    );
    expect(getByText("Foo")).toBeInTheDocument();
  });
});

describe("ChartTooltipContent", () => {
  it("renders nothing if not active", () => {
    const config = { foo: { color: "#000", label: "Foo" } };
    const { queryByTestId } = render(
      <ChartContainer config={config}>
        <ChartTooltipContent active={false} payload={[]} />
      </ChartContainer>
    );
    // The tooltip should not be rendered
    expect(queryByTestId("tooltip")).not.toBeInTheDocument();
  });
});