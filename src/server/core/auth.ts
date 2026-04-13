import { PrismaAdapter } from "@next-auth/prisma-adapter";
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/server/core/db";

const resolvedAuthSecret =
  process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

if (!resolvedAuthSecret && process.env.NODE_ENV === "production") {
  throw new Error(
    "Missing NextAuth secret. Set NEXTAUTH_SECRET (or AUTH_SECRET) in your environment.",
  );
}

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      isAdmin?: boolean;
      banned?: boolean;
      revoked?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isAdmin?: boolean;
    banned?: boolean;
    revoked?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  // In development we allow a deterministic fallback to avoid local boot failures.
  // Production always requires NEXTAUTH_SECRET/AUTH_SECRET.
  secret: resolvedAuthSecret ?? "local-dev-nextauth-secret",
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ user }) {
      const db_user = await prisma.user.findUnique({
        where: { email: user.email ?? undefined },
        select: { banned: true },
      });
      if (db_user?.banned) {
        // Block sign in for banned users
        return false;
      }
      return true;
    },
    jwt: async ({ token }) => {
      const db_user = await prisma.user.findFirst({
        where: {
          email: token?.email ?? undefined,
        },
      });
      if (db_user) {
        token.id = db_user.id;
        token.isAdmin = db_user.isAdmin;
        token.banned = db_user.banned;
        token.name = db_user.name;
        token.email = db_user.email;
        token.picture = db_user.image;
        token.revoked = db_user.revoked;

        let retries = 3;
        while (retries > 0) {
          try {
            await prisma.user.update({
              where: { id: db_user.id },
              data: { isOnline: true },
            });
            break; // success, exit loop
          } catch (err: unknown) {
            const code =
              typeof err === "object" &&
              err !== null &&
              "code" in err &&
              typeof (err as { code?: unknown }).code === "string"
                ? (err as { code: string }).code
                : undefined;

            const message =
              typeof err === "object" &&
              err !== null &&
              "message" in err &&
              typeof (err as { message?: unknown }).message === "string"
                ? (err as { message: string }).message
                : undefined;

            if (
              retries > 1 &&
              (code === "P2034" ||
                (message && message.includes("Lock wait timeout")))
            ) {
              await new Promise((res) => setTimeout(res, 500));
              retries--;
            } else {
              throw err;
            }
          }
        }
      }
      return token;
    },
    session: ({ session, token }) => {
      if (token.id) {
        session.user.id = token.id;
        session.user.isAdmin = token.isAdmin;
        session.user.banned = token.banned;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        session.user.revoked = token.revoked;
      }
      return session;
    },
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
};

export const getAuthSession = () => {
  return getServerSession(authOptions);
};
