/**
 * API Route Helpers - Reusable utilities for route handlers
 * NOT Next.js middleware - just common functions for routes to call
 */

import { NextResponse } from "next/server";
import { getAuthSession } from "./auth";
import { getUserRevokedStatus } from "../services/userReadService";

export interface ApiUser {
  userId: string;
  isAdmin: boolean;
}

/**
 * Helper: Validates authentication and revocation in one call
 * Returns user info or error response
 */
export async function requireAuth(
  req: Request,
): Promise<{ user: ApiUser } | { error: NextResponse }> {
  try {
    const session = await getAuthSession(req);
    
    if (!session?.user?.id) {
      return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const isRevoked = await getUserRevokedStatus(session.user.id);
    if (isRevoked) {
      return { error: NextResponse.json({ error: "User is revoked" }, { status: 403 }) };
    }

    return {
      user: {
        userId: session.user.id,
        isAdmin: session.user.isAdmin || false,
      },
    };
  } catch {
    return { error: NextResponse.json({ error: "Authentication error" }, { status: 500 }) };
  }
}
