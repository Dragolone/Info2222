import NextAuth from "next-auth/next";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/encryption/password";
import { generateToken } from "@/lib/auth/jwt";
import { z } from "zod";

// Schema for validation
const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
});

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // Validate input
          const validatedFields = loginSchema.safeParse(credentials);
          if (!validatedFields.success) {
            return null;
          }

          const { username, password } = validatedFields.data;

          // Find user by username (could also search by email)
          const user = await prisma.user.findUnique({
            where: { username },
          });

          if (!user) {
            console.log("User not found");
            return null;
          }

          // Verify password
          const isPasswordValid = await verifyPassword(user.hashedPassword, password);
          if (!isPasswordValid) {
            console.log("Invalid password");
            return null;
          }

          // Check if user is verified
          if (!user.isVerified) {
            console.log("User not verified");
            throw new Error("Please verify your email before logging in");
          }

          // Log the login attempt
          await prisma.userSecurityLog.create({
            data: {
              userId: user.id,
              action: "LOGIN",
              success: true,
              details: "User logged in successfully",
              // In a real implementation, you would get these from the request
              ipAddress: "127.0.0.1",
              userAgent: "NextAuth Browser",
            },
          });

          // Return the authenticated user
          return {
            id: user.id,
            name: user.username,
            email: user.email,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24, // 1 day
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

// Export handler for API route
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
