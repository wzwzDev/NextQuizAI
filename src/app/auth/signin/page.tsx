"use client";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import SignInButton from "@/components/SignInButton";

function SignInInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const error = searchParams.get("error");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const destination = session?.user?.isAdmin ? "/admin" : "/dashboard";
    router.replace(destination);
    router.refresh();
  }, [router, session?.user?.isAdmin, status]);

  let errorMessage = "";
  if (error === "AccessDenied") {
    errorMessage = "Your account has been blocked. Please contact support.";
  } else if (error === "CredentialsSignin") {
    errorMessage = "Admin credentials are invalid.";
  } else if (error === "google") {
    errorMessage =
      "Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local and restart the server.";
  } else if (error === "OAuthSignin" || error === "OAuthCallback") {
    errorMessage =
      "Google authentication failed. Verify OAuth redirect URI and client credentials in Google Cloud Console.";
  } else if (error) {
    errorMessage = `Sign-in failed (${error}).`;
  }

  const handleAdminSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAdminError(null);
    setIsSubmittingAdmin(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        username: username.trim(),
        password,
        callbackUrl: "/admin",
      });

      if (!result || result.error) {
        setAdminError("Invalid admin username or password.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setAdminError("Admin sign-in failed. Please try again.");
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  if (status === "authenticated") {
    return (
      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-8">
        <div className="section-shell rounded-2xl p-6 text-sm text-muted-foreground">
          Redirecting...
        </div>
      </main>
    );
  }

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-8">
      <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(circle_at_15%_20%,var(--glow-primary),transparent_65%),radial-gradient(circle_at_90%_10%,var(--glow-secondary),transparent_65%)]" />

      <div className="grid w-full gap-6 md:grid-cols-2">
        <section className="section-shell rounded-2xl p-6">
          <span className="chip-pill mb-3 w-fit text-primary">User Access</span>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Sign In
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Continue with your regular account.
          </p>

          {errorMessage && (
            <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="mt-6">
            <SignInButton
              text="Sign in with Google"
              mode="google"
              callbackUrl="/dashboard"
            />
          </div>
        </section>

        <section className="section-shell rounded-2xl p-6">
          <span className="chip-pill mb-3 w-fit bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
            Admin Access
          </span>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Admin Sign In
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Dedicated credentials for admin dashboard access.
          </p>

          <form className="mt-5 space-y-4" onSubmit={handleAdminSignIn}>
            <div className="space-y-1">
              <label htmlFor="admin-username" className="text-sm font-semibold text-foreground">
                Username
              </label>
              <input
                id="admin-username"
                type="text"
                className="h-11 w-full rounded-xl border border-border/70 bg-card/85 px-3 text-sm text-foreground backdrop-blur-md focus:border-primary focus:outline-none"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                placeholder="admin"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="admin-password" className="text-sm font-semibold text-foreground">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                className="h-11 w-full rounded-xl border border-border/70 bg-card/85 px-3 text-sm text-foreground backdrop-blur-md focus:border-primary focus:outline-none"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {adminError && (
              <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {adminError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmittingAdmin}
              className="pulse-focus inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingAdmin ? "Signing in..." : "Sign in as Admin"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInInner />
    </Suspense>
  );
}