import UserQuizStats from "@/components/UserQuizStats";
import { getAuthSession } from "@/server/core/auth";
import { getUserRevokedStatus, getUserBannedStatusById } from "@/server/services/userReadService";
import { redirect } from "next/navigation";

export default async function MyStatsPage() {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/");
  }

  // Check if the user is banned
  const isBanned = await getUserBannedStatusById(session.user.id);
  if (isBanned) {
    redirect("/banned");
  }

  // Check if the user is revoked
  const isRevoked = await getUserRevokedStatus(session.user.id);
  if (isRevoked) {
    redirect("/revoked");
  }
  
  return (
    <main className="p-8 max-w-4xl mx-auto">
      <UserQuizStats />
    </main>
  );
}
