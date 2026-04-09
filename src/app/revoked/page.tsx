import { getAuthSession } from "@/server/core/auth";
import { redirect } from "next/navigation";
import React from "react";

const RevokedPage = async () => {
  const session = await getAuthSession();

  // If the user is not logged in, redirect to home (or login)
  if (!session?.user) {
    redirect("/");
  }

  // If the user is not revoked, redirect to home
  if (!session.user.revoked) {
    redirect("/");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Acceso revocado</h1>
      <p className="text-lg text-gray-700">
        Tu acceso a la plataforma ha sido revocado. Si crees que esto es un
        error, por favor contacta con el administrador.
      </p>
    </div>
  );
};

export default RevokedPage;
