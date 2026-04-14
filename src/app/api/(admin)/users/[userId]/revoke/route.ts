import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import {
  getUserRevokeStatus,
  OwnerProtectedError,
  setUserRevoked,
} from "@/server/admin/services/adminUserManagementService";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const params = await context.params;
  const session = await getAuthSession(req);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const updated = await setUserRevoked(params.userId, true);
    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof OwnerProtectedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to revoke user" },
      { status: 500 },
    );
  }
}
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const session = await getAuthSession(req);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  try {
    const user = await getUserRevokeStatus(params.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ revoked: user.revoked }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}
