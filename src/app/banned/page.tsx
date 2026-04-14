import { getAuthSession } from "@/server/core/auth";
import { redirect } from "next/navigation";

const BannedPage = async () => {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/");
  }

  if (!session.user.banned) {
    redirect("/home");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-4 text-3xl font-bold text-red-600">Access blocked</h1>
      <p className="max-w-xl text-lg text-gray-700">
        Your account has been blocked by an administrator. If you think this is
        a mistake, please contact support.
      </p>
    </div>
  );
};

export default BannedPage;
