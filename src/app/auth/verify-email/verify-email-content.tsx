"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type VerifyStatus = "idle" | "loading" | "success" | "error";

function VerifyEmailView({
  status,
  message,
}: {
  status: VerifyStatus;
  message: string;
}) {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10 sm:px-8">
      <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(circle_at_15%_20%,var(--glow-primary),transparent_65%),radial-gradient(circle_at_90%_10%,var(--glow-secondary),transparent_65%)]" />

      <section className="section-shell w-full rounded-2xl p-6">
        <span className="chip-pill mb-3 w-fit text-primary">Email Verification</span>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Verify Email</h1>

        <p
          className={`mt-4 rounded-md border px-3 py-2 text-sm ${
            status === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : status === "error"
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-border/70 bg-card/85 text-muted-foreground"
          }`}
        >
          {message}
        </p>

        <div className="mt-5 flex gap-3">
          <Link
            href="/auth/signin"
            className="pulse-focus inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            Go to sign in
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border/70 bg-card/85 px-4 text-sm font-semibold text-foreground transition hover:bg-card"
          >
            Register another account
          </Link>
        </div>
      </section>
    </main>
  );
}

export function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<VerifyStatus>("idle");
  const [message, setMessage] = useState("Preparing verification...");

  useEffect(() => {
    const runVerification = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Missing verification token.");
        return;
      }

      setStatus("loading");
      setMessage("Verifying your email...");

      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const payload = (await response.json()) as { error?: string; email?: string };
        if (!response.ok) {
          setStatus("error");
          setMessage(payload.error || "Verification failed.");
          return;
        }

        setStatus("success");
        setMessage(
          payload.email
            ? `Email ${payload.email} verified successfully. You can now sign in.`
            : "Email verified successfully. You can now sign in.",
        );
      } catch {
        setStatus("error");
        setMessage("Verification failed. Please try again.");
      }
    };

    runVerification().catch(() => {
      setStatus("error");
      setMessage("Verification failed. Please try again.");
    });
  }, [token]);

  return <VerifyEmailView status={status} message={message} />;
}
