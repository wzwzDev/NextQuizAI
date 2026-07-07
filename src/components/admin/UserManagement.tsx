"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type User = {
  id: string;
  name?: string | null;
  email: string;
  lastSeen?: string;
  banned?: boolean;
  revoked?: boolean;
  isAdmin?: boolean;
  isOwner?: boolean;
};

type UserManagementProps = {
  compact?: boolean;
};

const UserManagement = ({ compact = false }: UserManagementProps) => {
  const { data: session } = useSession();
  const currentEmail = (session as any)?.user?.email?.toLowerCase?.();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async (pageNum?: number) => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (pageNum === undefined) {
        response = await fetch(`/api/users`);
      } else {
        const params = new URLSearchParams();
        params.set("page", String(pageNum));
        params.set("limit", String(limit));
        response = await fetch(`/api/users?${params.toString()}`);
      }
      const data = await response.json();
      if (Array.isArray(data.users) || Array.isArray(data)) {
        // support both legacy and new paginated responses
        const usersList = Array.isArray(data.users) ? data.users : data;
        setUsers(usersList);
        setTotal(Number.isFinite(Number(data.total)) ? Number(data.total) : usersList.length);
      } else {
        setUsers([]);
        setError(data.error || "Failed to load users");
      }
    } catch {
      setUsers([]);
      setError("Failed to load users");
    }
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleBanUser = async (userId: string) => {
    const response = await fetch(`/api/users/${userId}/ban`, { method: "POST" });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(
        typeof payload?.error === "string"
          ? payload.error
          : "Failed to ban user.",
      );
      return;
    }
    setError(null);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, banned: true } : u)),
    );
  };

  const handleUnbanUser = async (userId: string) => {
    const response = await fetch(`/api/users/${userId}/unban`, { method: "POST" });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(
        typeof payload?.error === "string"
          ? payload.error
          : "Failed to unban user.",
      );
      return;
    }
    setError(null);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, banned: false } : u)),
    );
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
    const response = await fetch(`/api/users/${userId}/assign-admin`, {
      method: "POST",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(
        typeof payload?.error === "string"
          ? payload.error
          : "Failed to assign admin role.",
      );
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isAdmin: true } : u)),
    );
  };

  const handleDeleteUser = async (user: User) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(
          typeof payload?.error === "string"
            ? payload.error
            : "Failed to delete user.",
        );
        setIsDeleting(false);
        return;
      }

      setUsers((prev) => prev.filter((candidate) => candidate.id !== userToDelete.id));
      setTotal((prev) => Math.max(0, prev - 1));
      setShowDeleteDialog(false);
      setUserToDelete(null);
      setError(null);
    } catch (err) {
      setError("Failed to delete user. Please try again.");
      setIsDeleting(false);
    }
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
        onClick={() => fetchUsers(undefined)}
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
                  {user.isOwner ? (
                    <span className="text-amber-700 font-bold flex items-center gap-1">
                      Owner
                      <span title="Owner" role="img" aria-label="owner">
                        👑
                      </span>
                    </span>
                  ) : user.isAdmin ? (
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
                  {user.isOwner !== true && user.email.toLowerCase() !== currentEmail && (
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
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="bg-rose-700 text-white px-2 py-1 rounded hover:bg-rose-800"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination controls */}
      <div className="mt-4 flex items-center justify-between">
        <div>
          <button
            className="px-3 py-1 mr-2 rounded border"
            onClick={() => {
              const next = Math.max(1, page - 1);
              setPage(next);
              fetchUsers(next);
            }}
            disabled={page <= 1}
          >
            Previous
          </button>
          <button
            className="px-3 py-1 rounded border"
            onClick={() => {
              const next = page + 1;
              setPage(next);
              fetchUsers(next);
            }}
            disabled={page * limit >= total}
          >
            Next
          </button>
        </div>
        <div className="text-sm text-muted-foreground">
          Page {page} — {Math.min(page * limit, total)} of {total}
        </div>
      </div>

      {/* Delete User Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete User Account</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{userToDelete?.email}</strong>?
            <br />
            <br />
            This action cannot be undone. The user will:
            <ul className="list-disc list-inside mt-2 ml-2 text-sm">
              <li>Be permanently removed from the system</li>
              <li>Have all active sessions terminated</li>
              <li>Need to sign up again if they want to use the app</li>
              <li>Lose access to all their quiz data</li>
            </ul>
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end mt-4">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              disabled={isDeleting}
              className="bg-rose-700 hover:bg-rose-800"
            >
              {isDeleting ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
