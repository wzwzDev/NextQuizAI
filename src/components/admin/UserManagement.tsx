"use client";
import React, { useEffect, useState } from "react";

type User = {
  id: string;
  name?: string | null;
  email: string;
  lastSeen?: string;
  banned?: boolean;
  revoked?: boolean;
  isAdmin?: boolean;
};

const DEVELOPER_EMAIL = "waelwzwz@gmail.com";

type UserManagementProps = {
  compact?: boolean;
};

const UserManagement = ({ compact = false }: UserManagementProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
        setError(data.error || "Failed to load users");
      }
    } catch {
      setUsers([]);
      setError("Failed to load users");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBanUser = async (userId: string) => {
    await fetch(`/api/users/${userId}/ban`, { method: "POST" });
    fetchUsers();
  };

  const handleUnbanUser = async (userId: string) => {
    await fetch(`/api/users/${userId}/unban`, { method: "POST" });
    fetchUsers();
  };
  const handleRevokeUser = async (userId: string) => {
    await fetch(`/api/users/${userId}/revoke`, { method: "POST" });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, revoked: true } : u)),
    );
  };

  const handleUnrevokeUser = async (userId: string) => {
    await fetch(`/api/users/${userId}/unrevoke`, { method: "POST" });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, revoked: false } : u)),
    );
  };

  const handleAssignAdmin = async (userId: string) => {
    await fetch(`/api/users/${userId}/assign-admin`, { method: "POST" });
    // Optimistically update UI
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isAdmin: true } : u)),
    );
  };

  const isUserOnline = (lastSeen?: string) => {
    if (!lastSeen) return false;
    return new Date().getTime() - new Date(lastSeen).getTime() < 2 * 60 * 1000;
  };

  if (loading) {
    return <div>Loading users...</div>;
  }
  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className={compact ? "h-full" : "rounded-xl bg-white p-8 shadow dark:bg-black"}>
      {!compact && <h2 className="mb-4 text-2xl font-bold">User Management</h2>}
      <button
        onClick={fetchUsers}
        className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Refresh
      </button>
      <div className="overflow-x-auto rounded shadow bg-white dark:bg-black">
        <table className="w-full min-w-full">
          <thead>
            <tr>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Online Status</th>
              <th className="py-3 px-4 text-left">Banned</th>
              <th className="py-3 px-4 text-left">Revoked</th>
              <th className="py-3 px-4 text-left">Admin</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className={`${user.banned ? "bg-red-100" : ""} border-b last:border-b-0`}
              >
                <td className="py-4 px-4">{user.email}</td>
                <td className="py-4 px-4">
                  {isUserOnline(user.lastSeen) ? (
                    <span className="text-green-600 font-bold">Online</span>
                  ) : (
                    <span className="text-gray-500">Offline</span>
                  )}
                </td>
                <td className="py-4 px-4">
                  {user.banned ? (
                    <span className="text-red-600 font-bold">Banned</span>
                  ) : (
                    <span className="text-green-600">Active</span>
                  )}
                </td>
                <td className="py-4 px-4">
                  {user.revoked ? (
                    <span className="text-yellow-600 font-bold">Revoked</span>
                  ) : (
                    <span className="text-green-600">Allowed</span>
                  )}
                </td>
                <td className="py-4 px-4">
                  {user.isAdmin ? (
                    <span className="text-blue-600 font-bold flex items-center gap-1">
                      Admin{" "}
                      <span title="Admin" role="img" aria-label="admin">
                        🛡️
                      </span>
                    </span>
                  ) : (
                    <span className="text-gray-500">User</span>
                  )}
                </td>
                <td className="py-4 px-4 space-x-2">
                  {/* Hide actions for developer email */}
                  {user.email !== DEVELOPER_EMAIL && (
                    <>
                      {!user.isAdmin && (
                        <button
                          onClick={() => handleAssignAdmin(user.id)}
                          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        >
                          Assign Admin
                        </button>
                      )}
                      {user.revoked ? (
                        <button
                          onClick={() => handleUnrevokeUser(user.id)}
                          className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                        >
                          Unrevoke
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRevokeUser(user.id)}
                          className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                        >
                          Revoke
                        </button>
                      )}
                      {user.banned ? (
                        <button
                          onClick={() => handleUnbanUser(user.id)}
                          className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                        >
                          Unban
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBanUser(user.id)}
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                          Ban
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
