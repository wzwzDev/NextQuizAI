import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { VerifyEmailContent } from "../../app/auth/verify-email/verify-email-content";

const mockGet = jest.fn();

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: mockGet }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("VerifyEmailContent", () => {
  beforeEach(() => {
    mockGet.mockReset();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("shows a missing-token error when no token is present", async () => {
    mockGet.mockReturnValue(null);

    render(<VerifyEmailContent />);

    expect(await screen.findByText("Missing verification token.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("verifies the token and shows the success state with email", async () => {
    mockGet.mockReturnValue("valid-token");
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, email: "user@example.com" }),
    });

    render(<VerifyEmailContent />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "valid-token" }),
      });
    });

    expect(
      await screen.findByText(
        "Email user@example.com verified successfully. You can now sign in.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to sign in/i })).toHaveAttribute(
      "href",
      "/auth/signin",
    );
    expect(
      screen.getByRole("link", { name: /register another account/i }),
    ).toHaveAttribute("href", "/auth/register");
  });

  it("shows the generic success message when the API omits the email", async () => {
    mockGet.mockReturnValue("valid-token-no-email");
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<VerifyEmailContent />);

    expect(
      await screen.findByText("Email verified successfully. You can now sign in."),
    ).toBeInTheDocument();
  });

  it("shows the API error message on verification failure", async () => {
    mockGet.mockReturnValue("invalid-token-1234567890");
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Verification link is invalid or expired." }),
    });

    render(<VerifyEmailContent />);

    expect(
      await screen.findByText("Verification link is invalid or expired."),
    ).toBeInTheDocument();
  });

  it("shows the fallback error message when fetch rejects", async () => {
    mockGet.mockReturnValue("network-failure-token");
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("network failure"));

    render(<VerifyEmailContent />);

    expect(
      await screen.findByText("Verification failed. Please try again."),
    ).toBeInTheDocument();
  });
});