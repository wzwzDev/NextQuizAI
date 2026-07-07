import { redirect } from "next/navigation";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { getAuthSession } from "@/server/core/auth";
import {
  getUserBannedStatusById,
} from "@/server/services/userReadService";

const AdminPage = async () => {
  const session = await getAuthSession();
  if (!session?.user?.isAdmin) {
    redirect("/");
  }
  
  // Check if user is banned
  if (session.user.id) {
    const isBanned = await getUserBannedStatusById(session.user.id);
    if (isBanned) {
      redirect("/banned");
    }
  }
  
  return <AdminDashboardClient />;
};

export default AdminPage;
