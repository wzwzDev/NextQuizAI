import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/core/auth";
import { markUserOfflineByEmail } from "@/server/services/userService";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      await markUserOfflineByEmail(session.user.email);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Sign-out error:", error);

    // Prisma error: user not found
    if (error.code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          error: "Usuario no encontrado para cerrar sesión.",
        },
        { status: 404 },
      );
    }

    // Database connection error
    if (error.code === "ECONNREFUSED") {
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
