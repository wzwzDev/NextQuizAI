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
import { Sparkles, Trophy } from "lucide-react";
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
    <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center px-4 py-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_20%,var(--glow-primary),transparent_40%),radial-gradient(circle_at_85%_8%,var(--glow-secondary),transparent_42%)]" />
      <Card className="section-shell animated-fade-up w-full max-w-md border-0 p-1">
        <div className="rounded-[calc(var(--radius)+2px)] bg-card/95 p-1">
          <CardHeader>
            <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Learning
            </div>
            <CardTitle className="font-display text-3xl leading-tight">
              Welcome to QuizUPM
            </CardTitle>
            <CardDescription>
              QuizUPM is your smart quiz studio for learning, challenge, and exam preparation with AI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="h-4 w-4 text-secondary-foreground" />
              Build, play, and track progress in one place.
            </div>
            <SignInButton text="Sign In with Google" />
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
