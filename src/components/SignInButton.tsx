"use client";
import React from "react";
import { Button } from "./ui/button";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type Props = {
  text: string;
  mode?: "portal" | "google";
  callbackUrl?: string;
};

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.6-5.5 3.6-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.3 12 2.3 6.8 2.3 2.6 6.5 2.6 11.7S6.8 21.1 12 21.1c6.9 0 9.1-4.8 9.1-7.3 0-.5-.1-.9-.1-1.3H12z"
      />
      <path
        fill="#34A853"
        d="M2.6 7.1l3.2 2.3C6.6 7.3 9 5.7 12 5.7c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.3 12 2.3 8.2 2.3 4.9 4.4 2.6 7.1z"
      />
      <path
        fill="#FBBC05"
        d="M12 21.1c2.5 0 4.7-.8 6.2-2.3l-2.9-2.4c-.8.5-1.8.9-3.3.9-3.1 0-5.7-2.1-6.6-4.9l-3.2 2.5C4.5 18.4 8 21.1 12 21.1z"
      />
      <path
        fill="#4285F4"
        d="M21.1 13.8c0-.5-.1-.9-.1-1.3H12v3.9h5.5c-.3 1.2-1.1 2.2-2.1 2.9l2.9 2.4c1.7-1.6 2.8-4 2.8-6.9z"
      />
    </svg>
  );
}

const SignInButton = ({ text, mode = "portal", callbackUrl }: Props) => {
  const router = useRouter();

  const handleClick = () => {
    if (mode === "google") {
      signIn("google", {
        prompt: "select_account",
        ...(callbackUrl ? { callbackUrl } : {}),
      }).catch(console.error);
      return;
    }

    router.push("/auth/signin");
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2"
    >
      {mode === "google" ? <GoogleLogo /> : null}
      {text}
    </Button>
  );
};

export default SignInButton;
