import React from "react";
import { render, screen } from "@testing-library/react";
import BlankAnswerInput from "../../components/BlankAnswerInput";

jest.mock("keyword-extractor", () => ({
  extract: jest.fn(() => ["test", "answer"]),
}));

describe("BlankAnswerInput", () => {
  it("renders blanks and input fields for keywords", () => {
    const setBlankAnswer = jest.fn();
    render(<BlankAnswerInput answer="This is a test answer." setBlankAnswer={setBlankAnswer} />);
    // Should render two input fields for two keywords
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.length).toBe(2);
    // Should render the text with blanks
    expect(screen.getByText(/This is a/)).toBeInTheDocument();
    expect(screen.getByText(/\./)).toBeInTheDocument();
  });
});