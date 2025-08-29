import { NuxtAuthHandler } from '#auth'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import EmailProvider from 'next-auth/providers/email'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prismaClient } from '../../utils/prisma'

const useDevCredentials = process.env.NODE_ENV !== 'production'
  && !process.env.GITHUB_ID
  && !process.env.GOOGLE_ID
  && !process.env.EMAIL_SERVER

export default NuxtAuthHandler({
  secret: process.env.NEXTAUTH_SECRET,
  adapter: useDevCredentials ? undefined : PrismaAdapter(prismaClient),
  session: { strategy: useDevCredentials ? 'jwt' : 'database' },
  pages: {
    signIn: '/auth/signin'
  },
  providers: [
    // Dev fallback: credentials (no DB required)
    ...(useDevCredentials
      ? [
          // @ts-expect-error next-auth v4 with Vite SSR requires .default
          CredentialsProvider.default({
            name: 'Credentials',
            credentials: {
              email: { label: 'Email', type: 'email' }
            },
            async authorize(credentials: Record<string, unknown> | undefined) {
              if (!credentials?.email) return null
              const email = String((credentials as { email: string }).email)
              return { id: email, email, name: 'Dev User' }
            }
          })
        ]
      : []),
    // OAuth providers (configure env vars before enabling)
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          // @ts-expect-error next-auth v4 with Vite SSR requires .default
          GithubProvider.default({ clientId: process.env.GITHUB_ID!, clientSecret: process.env.GITHUB_SECRET! })
        ]
      : []),
    ...(process.env.GOOGLE_ID && process.env.GOOGLE_SECRET
      ? [
          // @ts-expect-error next-auth v4 with Vite SSR requires .default
          GoogleProvider.default({ clientId: process.env.GOOGLE_ID!, clientSecret: process.env.GOOGLE_SECRET! })
        ]
      : []),
    // Email magic link
    ...(process.env.EMAIL_SERVER && process.env.EMAIL_FROM
      ? [
          // @ts-expect-error next-auth v4 with Vite SSR requires .default
          EmailProvider.default({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM
          })
        ]
      : [])
  ]
})


