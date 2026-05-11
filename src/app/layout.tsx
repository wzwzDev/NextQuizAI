import { cn } from "@/lib/utils";
import "./globals.css";
import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import { ensureSystemUsers } from "@/server/core/systemUsers";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "QuizUPytxwM",
  description: "Quiz yourself!",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureSystemUsers();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn(
          manrope.variable,
          sora.variable,
          "min-h-screen bg-background pt-16 text-foreground antialiased",
        )}
      >
        <Providers>
          <Navbar />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
