import { getAuthSession } from "@/server/core/auth";
import { getUserRevokedStatus } from "@/server/services/userReadService";
import { redirect } from "next/navigation";
import HomeClient from "@/components/home/HomeClient";

export default async function Home() {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/");
  }

  // Check if the user is revoked
  const isRevoked = await getUserRevokedStatus(session.user.id);
  if (isRevoked) {
    redirect("/revoked");
  }

  return <HomeClient />;
}
