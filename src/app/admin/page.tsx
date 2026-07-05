import { redirect } from "next/navigation";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { getAuthSession } from "@/server/core/auth";
import { getUserRevokedStatus } from "@/server/services/userReadService";

const AdminPage = async () => {
  const session = await getAuthSession();
  if (!session?.user?.isAdmin) {
    redirect("/");
  }
  
  // Check if user is revoked
  if (session.user.id) {
    const isRevoked = await getUserRevokedStatus(session.user.id);
    if (isRevoked) {
      redirect("/revoked");
    }
  }
  
  return <AdminDashboardClient />;
};

export default AdminPage;
