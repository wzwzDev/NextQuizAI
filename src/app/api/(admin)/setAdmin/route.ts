import { NextResponse } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import {
  OwnerProtectedError,
  setUserAdmin,
} from "@/server/admin/services/adminUserManagementService";

export async function POST(
  req: Request,
) {
  const session = await getAuthSession(req);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { userId?: string };
  const userId = body.userId;
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const user = await setUserAdmin(userId, true);
    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    if (error instanceof OwnerProtectedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to assign admin role." },
      { status: 500 },
    );
  }
}
