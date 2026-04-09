"use client";
import React from "react";
import { Button } from "./ui/button";
import { signIn } from "next-auth/react";

type Props = { text: string };

const SignInButton = ({ text }: Props) => {
  return (
    <Button
      type="button"
      onClick={() => {
        signIn("google", { prompt: "select_account" }).catch(console.error);
      }}
    >
      {text}
    </Button>
  );
};

export default SignInButton;
