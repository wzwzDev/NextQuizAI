import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import {
  deleteUserForAdmin,
  OwnerProtectedError,
  SelfDeleteNotAllowedError,
} from "@/server/admin/services/adminUserManagementService";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await getAuthSession(req);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actorUserId = session.user.id;
  if (!actorUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  try {
    await deleteUserForAdmin(actorUserId, userId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof OwnerProtectedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof SelfDeleteNotAllowedError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
