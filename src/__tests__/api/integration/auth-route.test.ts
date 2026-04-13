jest.mock("next-auth/next", () => ({
  __esModule: true,
  default: jest.fn(() => jest.fn()),
}));

import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { GET, POST } from "@/app/api/auth/[...nextauth]/route";

describe("/api/auth/[...nextauth] Route Handler", () => {
  it("creates handler with auth options", () => {
    expect(NextAuth).toHaveBeenCalledTimes(1);
    expect(NextAuth).toHaveBeenCalledWith(authOptions);
  });

  it("exports same handler for GET and POST", () => {
    expect(GET).toBe(POST);
    expect(typeof GET).toBe("function");
  });
});