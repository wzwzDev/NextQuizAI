import { getAuthSession } from "@/server/core/auth";
import { prisma } from "@/server/core/db";
import { redirect } from "next/navigation";
import HomeClient from "@/components/home/HomeClient";

export default async function Home() {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/");
  }

  // Check if the user is revoked
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { revoked: true },
  });
  if (user?.revoked) {
    redirect("/revoked");
  }

  return <HomeClient />;
}
