import React from "react";
import { render, screen } from "@testing-library/react";
import AccuracyCard from "../../components/statistics/AccuracyCard";

describe("AccuracyCard", () => {
  it("renders the accuracy value", () => {
    render(<AccuracyCard accuracy={87.12} />);
    expect(screen.getByText("87.12%")).toBeInTheDocument();
    expect(screen.getByText(/Average Accuracy/)).toBeInTheDocument();
  });
});