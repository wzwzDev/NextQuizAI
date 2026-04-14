import { NextResponse } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import { getUsersForAdmin } from "@/server/admin/services/adminUserManagementService";

export async function GET(req: Request) {
  const session = await getAuthSession(req);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const users = await getUsersForAdmin();
  return NextResponse.json(users);
}
