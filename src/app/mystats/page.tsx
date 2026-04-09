import UserQuizStats from "@/components/UserQuizStats";
import { getAuthSession } from "@/server/core/auth";
import { redirect } from "next/navigation";

export default async function MyStatsPage() {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/");
  }
  return (
    <main className="p-8 max-w-4xl mx-auto">
      <UserQuizStats />
    </main>
  );
}
