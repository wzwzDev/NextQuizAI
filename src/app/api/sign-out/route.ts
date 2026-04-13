import { NextResponse } from "next/server";
import { getAuthSession } from "@/server/core/auth";
import { markUserOfflineByEmail } from "@/server/services/userService";

function getErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (session?.user?.email) {
      await markUserOfflineByEmail(session.user.email);
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Sign-out error:", error);
    const errorCode = getErrorCode(error);

    // Prisma error: user not found
    if (errorCode === "P2025") {
      return NextResponse.json(
        {
          success: false,
          error: "Usuario no encontrado para cerrar sesión.",
        },
        { status: 404 },
      );
    }

    // Database connection error
    if (errorCode === "ECONNREFUSED") {
      return NextResponse.json(
        {
          success: false,
          error: "No se pudo conectar con la base de datos.",
        },
        { status: 503 },
      );
    }

    // Default: unexpected error
    return NextResponse.json(
      {
        success: false,
        error: "Error inesperado al cerrar sesión.",
      },
      { status: 500 },
    );
  }
}
