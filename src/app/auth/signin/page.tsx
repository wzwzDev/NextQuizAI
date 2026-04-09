"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SignInButton from "@/components/SignInButton";

function SignInInner() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  let errorMessage = "";
  if (error === "AccessDenied") {
    errorMessage = "Your account has been blocked. Please contact support.";
  } else if (error === "google") {
    errorMessage =
      "Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local and restart the server.";
  } else if (error === "OAuthSignin" || error === "OAuthCallback") {
    errorMessage =
      "Google authentication failed. Verify OAuth redirect URI and client credentials in Google Cloud Console.";
  } else if (error) {
    errorMessage = `Sign-in failed (${error}).`;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Sign In</h1>
      {errorMessage && <div className="mb-4 text-red-600">{errorMessage}</div>}
      <SignInButton text="Sign in with Google" />
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInInner />
    </Suspense>
  );
}