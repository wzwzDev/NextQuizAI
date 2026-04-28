import React from "react";
import { render, screen } from "@testing-library/react";
import VerifyEmailPage from "../../app/auth/verify-email/page";

let mockShouldSuspend = false;

jest.mock("../../app/auth/verify-email/verify-email-content", () => ({
  VerifyEmailContent: () => {
    if (mockShouldSuspend) {
      throw new Promise(() => {});
    }

    return <div data-testid="verify-email-content" />;
  },
}));

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    mockShouldSuspend = false;
  });

  it("renders the loading fallback while content is suspended", () => {
    mockShouldSuspend = true;

    render(<VerifyEmailPage />);

    expect(screen.getByText("Preparing verification...")).toBeInTheDocument();
    expect(screen.queryByTestId("verify-email-content")).not.toBeInTheDocument();
  });
});