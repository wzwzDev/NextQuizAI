import React, { Suspense } from "react";
import { VerifyEmailContent } from "./verify-email-content";

function VerifyEmailFallback() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10 sm:px-8">
      <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(circle_at_15%_20%,var(--glow-primary),transparent_65%),radial-gradient(circle_at_90%_10%,var(--glow-secondary),transparent_65%)]" />

      <section className="section-shell w-full rounded-2xl p-6">
        <span className="chip-pill mb-3 w-fit text-primary">Email Verification</span>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Verify Email</h1>

        <p className="border-border/70 bg-card/85 text-muted-foreground mt-4 rounded-md border px-3 py-2 text-sm">
          Preparing verification...
        </p>
      </section>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
