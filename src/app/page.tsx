import SignInButton from "@/components/SignInButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
export default async function Home() {
  const session = await getServerSession();
  if (session?.user) {
    const email = session.user.email;
    if (!email) {
      redirect("/dashboard");
    }
    // Fetch user from DB to check banned status
    const user = await prisma.user.findUnique({
      where: { email },
      select: { banned: true },
    });
    if (user?.banned) {
      redirect("/banned");
    }
    redirect("/dashboard");
  }
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
      <Card className="w-[300px]">
        <CardHeader>
          <CardTitle>Welcome to QuizUPM 🔥!</CardTitle>
          <CardDescription>
            QuizUPM is a platform for creating quizzes using AI!.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInButton text="Sign In with Google" />
        </CardContent>
      </Card>
    </div>
  );
}
