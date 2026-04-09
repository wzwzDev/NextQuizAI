import Link from "next/link";
import React from "react";
import UserAccountNav from "./UserAccountNav";
import { ThemeToggle } from "./ThemeToggle";
import { getAuthSession } from "@/server/core/auth";
import SignInButton from "./SignInButton";

const Navbar = async () => {
  const session = await getAuthSession();

  return (
    <div className="fixed inset-x-0 top-0 bg-white dark:bg-gray-950 z-[10] h-fit border-b border-zinc-300 py-2">
      <div className="flex items-center justify-between h-full gap-2 px-8 mx-auto max-w-7xl">
        {/* Logo */}
        <Link href={"/"} className="flex items-center gap-2">
          <p className="rounded-lg border-4 border-blue-900 bg-white px-3 py-1 text-xl font-bold text-blue-700 hover:bg-blue-100 hover:text-blue-900 transition-all hover:-translate-y-1 md:block">
            QuizUPM
          </p>
        </Link>
        {/* Centered Home and My Stats buttons */}
        <div className="flex-1 flex justify-center">
          <div className="flex gap-4">
            <Link
              href="/home"
              className="px-5 py-1 rounded font-bold text-blue-700 border-2 border-blue-700 bg-white hover:bg-blue-700 hover:text-white transition text-lg"
            >
              Home
            </Link>
            <Link
              href="/mystats"
              className="px-5 py-1 rounded font-bold text-blue-700 border-2 border-blue-700 bg-white hover:bg-blue-700 hover:text-white transition text-lg"
            >
              My Stats
            </Link>
          </div>
        </div>
        {/* Right side: Theme, Admin, User */}
        <div className="flex items-center">
          <ThemeToggle className="mr-4" />
          {/* Only show Admin link if user is admin */}
          {session?.user?.isAdmin && (
            <Link
              href="/admin"
              className="mr-4 px-3 py-1 rounded bg-blue-900 text-white font-semibold hover:bg-blue-700 transition"
            >
              Admin
            </Link>
          )}
          {session?.user ? (
            <UserAccountNav user={session.user} />
          ) : (
            <SignInButton text={"Sign In"} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
