import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UserManagement from "../../components/admin/UserManagement";

const mockUsers = [
  {
    id: "1",
    email: "user1@example.com",
    lastSeen: new Date(Date.now()).toISOString(),
    banned: false,
    revoked: false,
    isAdmin: false,
  },
  {
    id: "2",
    email: "user2@example.com",
    lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    banned: true,
    revoked: true,
    isAdmin: false,
  },
  {
    id: "3",
    email: "admin@example.com",
    lastSeen: new Date(Date.now()).toISOString(),
    banned: false,
    revoked: false,
    isAdmin: true,
  },
  {
    id: "4",
    email: "waelwzwz@gmail.com", // Developer email
    lastSeen: new Date(Date.now()).toISOString(),
    banned: false,
    revoked: false,
    isAdmin: true,
  },
];

beforeEach(() => {
  // @ts-ignore
  global.fetch = jest.fn().mockResolvedValue({
    json: async () => mockUsers,
  });
});

afterEach(() => {
  // @ts-ignore
  global.fetch = undefined;
});

describe("UserManagement", () => {
  it("renders loading and then user table", async () => {
    render(<UserManagement />);
    expect(screen.getByText(/Loading users/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("User Management")).toBeInTheDocument();
      expect(screen.getByText("user1@example.com")).toBeInTheDocument();
      expect(screen.getByText("user2@example.com")).toBeInTheDocument();
      expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    });
  });

  it("shows error if fetch fails", async () => {
    // @ts-ignore
    global.fetch = jest.fn().mockRejectedValue(new Error("fail"));
    render(<UserManagement />);
    await waitFor(() => {
      expect(screen.getByText(/Failed to load users/i)).toBeInTheDocument();
    });
  });

  it("shows correct status and actions for users", async () => {
    render(<UserManagement />);
    await waitFor(() => {
      expect(screen.getAllByText("Online").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Offline").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Banned").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Revoked").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Admin").length).toBeGreaterThan(0);
      expect(screen.getAllByText("User").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Ban").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Unban").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Revoke").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Unrevoke").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Assign Admin").length).toBeGreaterThan(0);
    });
  });

  it("refreshes users when Refresh button is clicked", async () => {
    render(<UserManagement />);
    await waitFor(() => {
      expect(screen.getByText("User Management")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /Refresh/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/users");
    });
  });

 
});