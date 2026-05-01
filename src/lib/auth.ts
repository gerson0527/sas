import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { getDatabaseUrlTarget, prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const logPrefix = "[auth/credentials]"
        try {
          if (!credentials?.email || !credentials?.password) {
            console.warn(`${logPrefix} missing fields`, {
              hasEmail: !!credentials?.email,
              hasPassword: !!credentials?.password,
            })
            return null
          }

          const emailInput = String(credentials.email).trim()
          if (!emailInput) {
            console.warn(`${logPrefix} email vacío tras trim`)
            return null
          }
          console.info(`${logPrefix} attempt`, {
            emailSuffix: emailInput.includes("@") ? emailInput.split("@")[1]!.toLowerCase() : "(no-domain)",
            dbTarget: getDatabaseUrlTarget(),
          })

          const user = await prisma.user.findFirst({
            where: {
              email: { equals: emailInput, mode: "insensitive" },
            },
          })

          if (!user) {
            console.warn(`${logPrefix} user not found`, { dbTarget: getDatabaseUrlTarget() })
            return null
          }
          if (!user.password) {
            console.warn(`${logPrefix} user has no password (OAuth-only?)`, { userId: user.id })
            return null
          }

          const passwordsMatch = await bcrypt.compare(credentials.password as string, user.password)

          if (!passwordsMatch) {
            console.warn(`${logPrefix} password mismatch`)
            return null
          }

          console.info(`${logPrefix} success`, { userId: user.id })
          return user
        } catch (err) {
          console.error(`${logPrefix} authorize error`, { dbTarget: getDatabaseUrlTarget(), err })
          return null
        }
      }
    })
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.info("[auth/jwt] attaching user id to token", { userId: user.id })
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      if (!token.id && session.user) {
        console.warn("[auth/session] session without token.id", { email: session.user.email })
      }
      return session
    },
  },
})