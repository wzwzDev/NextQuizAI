import { NextResponse } from "next/server";
import { z } from "zod";
import {
  registerUserWithEmailPassword,
  RegistrationConflictError,
} from "@/server/services/authRegistrationService";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid registration data", details: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    await registerUserWithEmailPassword({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
    });
  } catch (error) {
    if (error instanceof RegistrationConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    throw error;
  }

  return NextResponse.json(
    {
      success: true,
      message: "Registration successful. Check your email to verify your account.",
    },
    { status: 201 },
  );
}
