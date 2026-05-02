import Link from "next/link";
import React from "react";
import UserAccountNav from "./UserAccountNav";
import { ThemeToggle } from "./ThemeToggle";
import { getAuthSession } from "@/server/core/auth";
import SignInButton from "./SignInButton";
import { Home, Sparkles, ShieldCheck, ChartSpline } from "lucide-react";

const Navbar = async () => {
  const session = await getAuthSession();
  const isAuthenticated = Boolean(
    session?.user?.id &&
      session?.user?.email &&
      !session?.user?.banned &&
      !session?.user?.revoked,
  );
  const authenticatedUser = isAuthenticated && session?.user ? session.user : null;

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 py-3 sm:px-6">
      <div className="glass-panel mx-auto flex w-full max-w-7xl items-center justify-between gap-3 rounded-2xl px-3 py-2 sm:px-5">
        <Link href="/" className="group inline-flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/90 text-primary-foreground shadow-sm transition-transform duration-200 group-hover:scale-105">
            <Sparkles className="h-4 w-4" />
          </span>
          <p className="font-display text-lg font-semibold text-foreground sm:text-xl">
            QuizUPM
          </p>
        </Link>

        {isAuthenticated && (
          <nav className="mx-2 hidden flex-1 justify-center md:flex">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/home"
                className="chip-pill lift-hover inline-flex items-center gap-2 px-4 py-2 text-sm text-foreground"
              >
                <Home className="h-4 w-4 text-primary" />
                Home
              </Link>
              <Link
                href="/mystats"
                className="chip-pill lift-hover inline-flex items-center gap-2 px-4 py-2 text-sm text-foreground"
              >
                <ChartSpline className="h-4 w-4 text-secondary-foreground" />
                My Stats
              </Link>
            </div>
          </nav>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle className="mr-1" />
          {authenticatedUser?.isAdmin && (
            <Link
              href="/admin"
              className="chip-pill lift-hover inline-flex items-center gap-2 px-3 py-2 text-xs text-foreground sm:text-sm"
            >
              <ShieldCheck className="h-4 w-4 text-primary" />
              Admin
            </Link>
          )}
          {authenticatedUser ? (
            <UserAccountNav user={authenticatedUser} />
          ) : (
            <SignInButton text={"Sign In"} />
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
