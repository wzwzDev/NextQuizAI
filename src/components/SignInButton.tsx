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
    >
      {text}
    </Button>
  );
};

export default SignInButton;
