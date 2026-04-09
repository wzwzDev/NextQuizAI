import HistoryCard from "@/components/dashboard/HistoryCard";
import QuizMeCard from "@/components/dashboard/QuizMeCard";
import HotTopicsCard from "@/components/dashboard/HotTopicsCard";
import { getAuthSession } from "@/server/core/auth";
import { redirect } from "next/navigation";
import React from "react";
import RecentActivityCard from "@/components/dashboard/RecentActivityCard";
import { cookies } from "next/headers";

type Props = {};

export const metadata = {
  title: "Dashboard | Quizzzy",
  description: "Quiz yourself on anything!",
};

const Dasboard = async (props: Props) => {
  const session = await getAuthSession();
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("admin_auth")?.value === "1";
  if (!session?.user && !isAdmin) {
    redirect("/");
  }

  return (
    <main className="p-8 mx-auto max-w-7xl">
      <div className="flex items-center">
        <h2 className="mr-2 text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <div className="grid gap-4 mt-4 md:grid-cols-2">
        <QuizMeCard />
        <HistoryCard />
      </div>
      <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-7">
        <HotTopicsCard />
        <RecentActivityCard />
      </div>
    </main>
  );
};

export default Dasboard;
