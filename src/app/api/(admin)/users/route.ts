import { NextResponse } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import { getUsersForAdmin } from "@/server/admin/services/adminUserManagementService";

export async function GET(req: Request) {
  const session = await getAuthSession(req);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10) || 1;
  const limit = parseInt(searchParams.get("limit") ?? "10", 10) || 10;

  const users = await getUsersForAdmin();
  const total = Array.isArray(users) ? users.length : 0;
  const start = (page - 1) * limit;
  const pageItems = Array.isArray(users) ? users.slice(start, start + limit) : [];

  return NextResponse.json({ users: pageItems, total });
}
