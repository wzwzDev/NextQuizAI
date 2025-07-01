import React from "react";
import { render } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../components/ui/card";

describe("Card UI components", () => {
  it("renders Card with children", () => {
    const { getByTestId } = render(
      <Card data-testid="card-root">
        <span>Card Content</span>
      </Card>
    );
    expect(getByTestId("card-root")).toBeInTheDocument();
    expect(getByTestId("card-root")).toHaveTextContent("Card Content");
  });

  it("renders CardHeader, CardTitle, CardDescription, CardContent, CardFooter", () => {
    const { getByText } = render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );
    expect(getByText("Title")).toBeInTheDocument();
    expect(getByText("Description")).toBeInTheDocument();
    expect(getByText("Content")).toBeInTheDocument();
    expect(getByText("Footer")).toBeInTheDocument();
  });
});