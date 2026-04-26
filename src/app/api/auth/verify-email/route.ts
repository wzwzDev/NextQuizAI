import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmailToken } from "@/server/auth/emailVerification";

const verifySchema = z.object({
  token: z.string().min(20),
});

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const result = await verifyEmailToken(parsed.data.token);
  if (!result.ok) {
    return NextResponse.json(
      { error: "Verification link is invalid or expired." },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, email: result.email }, { status: 200 });
}
