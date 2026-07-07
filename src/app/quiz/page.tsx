import React from "react";

import { getAuthSession } from "@/server/core/auth";
import {
  getUserBannedStatusById,
} from "@/server/services/userReadService";
import { redirect } from "next/navigation";
import QuizCreation from "@/components/forms/QuizCreation";
export const metadata = {
  title: "Quiz | QuizUPMm",
  description: "Quiz yourself on anything!",
};

interface Props {
  searchParams: Promise<{
    topic?: string;
  }>;
}

const Quiz = async ({ searchParams }: Props) => {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/");
  }
  
  // Check if user is banned
  if (session.user.id) {
    const isBanned = await getUserBannedStatusById(session.user.id);
    if (isBanned) {
      redirect("/banned");
    }
  }
  
  const params = await searchParams;
  return <QuizCreation topic={params.topic ?? ""} />;
};

export default Quiz;
