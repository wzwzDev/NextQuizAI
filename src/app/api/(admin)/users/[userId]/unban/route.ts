import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import {
  OwnerProtectedError,
  setUserBanned,
} from "@/server/admin/services/adminUserManagementService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const session = await getAuthSession(req);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await setUserBanned(userId, false);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof OwnerProtectedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to unban user" },
      { status: 500 },
    );
  }
}
