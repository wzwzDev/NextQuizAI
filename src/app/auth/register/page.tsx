"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setError(payload.error || "Registration failed.");
        return;
      }

      setSuccess(
        payload.message || "Registration successful. Please verify your email before sign in.",
      );
      setPassword("");
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10 sm:px-8">
      <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(circle_at_15%_20%,var(--glow-primary),transparent_65%),radial-gradient(circle_at_90%_10%,var(--glow-secondary),transparent_65%)]" />

      <section className="section-shell w-full rounded-2xl p-6">
        <span className="chip-pill mb-3 w-fit text-primary">Create Account</span>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Register</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use email/password and verify your email to access your dashboard.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-semibold text-foreground">
              Name (optional)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-11 w-full rounded-xl border border-border/70 bg-card/85 px-3 text-sm text-foreground backdrop-blur-md focus:border-primary focus:outline-none"
              autoComplete="name"
              placeholder="Your name"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-semibold text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 w-full rounded-xl border border-border/70 bg-card/85 px-3 text-sm text-foreground backdrop-blur-md focus:border-primary focus:outline-none"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-semibold text-foreground">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 w-full rounded-xl border border-border/70 bg-card/85 px-3 pr-16 text-sm text-foreground backdrop-blur-md focus:border-primary focus:outline-none"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-2 my-1 rounded-md px-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : null}

          {success ? (
            <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="pulse-focus inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>

          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/signin" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
