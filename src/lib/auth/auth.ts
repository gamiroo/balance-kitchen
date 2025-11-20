// lib/auth/auth.ts
import NextAuth, { AuthOptions, SessionStrategy } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "../database/client"
import { captureErrorSafe } from '../utils/error-utils'
import { logger } from '../logging/logger'
import { AuditLogger } from '../logging/audit-logger'


const authSecret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET

if (!authSecret && process.env.NODE_ENV === "production") {
  // This will fail fast with a clearer error than the NextAuth generic one
  throw new Error("Missing NEXTAUTH_SECRET / AUTH_SECRET in production environment")
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
    }
  }
  
  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role?: string
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Only log when actual credentials are provided (not on page load)
        if (credentials?.email || credentials?.password) {
          logger.debug("Auth attempt started", { 
            email: credentials?.email ? `${credentials.email.substring(0, 3)}***@${credentials.email.split('@')[1]}` : 'MISSING',
            action: 'authorize_attempt'
          })
        }
        
        if (!credentials?.email || !credentials?.password) {
          // Don't log this as an error on page load - it's expected
          if (credentials?.email || credentials?.password) {
            logger.debug("Missing credentials in auth attempt", { 
              hasEmail: !!credentials?.email,
              hasPassword: !!credentials?.password
            })
          }
          return null
        }

        try {
          logger.info("User authentication attempt", { 
            email: `${credentials.email.substring(0, 3)}***@${credentials.email.split('@')[1]}` 
          })
          
          const result = await db.query(
            'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
            [credentials.email]
          )
          
          if (result.rows.length === 0) {
            logger.info("Authentication failed - user not found", { 
              email: `${credentials.email.substring(0, 3)}***@${credentials.email.split('@')[1]}` 
            })
            AuditLogger.logFailedAction(
              undefined,
              'LOGIN_ATTEMPT',
              'auth',
              'USER_NOT_FOUND',
              { email: `${credentials.email.substring(0, 3)}***@${credentials.email.split('@')[1]}` }
            )
            return null
          }

          const user = result.rows[0]
          logger.debug("User found for authentication", { 
            email: `${user.email.substring(0, 3)}***@${user.email.split('@')[1]}`,
            userId: user.id 
          })
          
          const isValid = await bcrypt.compare(credentials.password, user.password_hash)
          
          if (!isValid) {
            logger.info("Authentication failed - invalid password", { 
              email: `${credentials.email.substring(0, 3)}***@${credentials.email.split('@')[1]}`,
              userId: user.id 
            })
            AuditLogger.logFailedAction(
              user.id,
              'LOGIN_ATTEMPT',
              'auth',
              'INVALID_PASSWORD',
              { email: `${credentials.email.substring(0, 3)}***@${credentials.email.split('@')[1]}` }
            )
            return null
          }

          logger.info("Authentication successful", { 
            email: `${user.email.substring(0, 3)}***@${user.email.split('@')[1]}`,
            userId: user.id 
          })
          
          AuditLogger.logUserAction(
            user.id,
            'LOGIN_SUCCESS',
            'auth',
            { email: `${user.email.substring(0, 3)}***@${user.email.split('@')[1]}` }
          )
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role || 'user',
          }
        } catch (error: unknown) {
          captureErrorSafe(error, { 
            action: 'user_authentication',
            email: credentials?.email ? `${credentials.email.substring(0, 3)}***@${credentials.email.split('@')[1]}` : 'MISSING',
            service: 'auth'
          })
          
          AuditLogger.logFailedAction(
            undefined,
            'LOGIN_ATTEMPT',
            'auth',
            'SYSTEM_ERROR',
            { 
              email: credentials?.email ? `${credentials.email.substring(0, 3)}***@${credentials.email.split('@')[1]}` : 'MISSING',
              error: String(error) 
            }
          )
          
          return null
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
    signOut: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      try {
        if (session.user && token.id) {
          session.user.id = token.id as string
          session.user.role = token.role as string || 'user'
        }
        return session
      } catch (error: unknown) {
        captureErrorSafe(error, {
          action: 'session_callback',
          service: 'auth'
        })
        logger.error('Session callback failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        })
        return session
      }
    },
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id
          token.role = user.role || 'user'
        }
        return token
      } catch (error: unknown) {
        captureErrorSafe(error, {
          action: 'jwt_callback',
          service: 'auth'
        })
        logger.error('JWT callback failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        })
        return token
      }
    },
    async redirect({ url, baseUrl }) {
      try {
        // Allows relative callback URLs
        if (url.startsWith("/")) return `${baseUrl}${url}`
        // Allows callback URLs on the same origin
        else if (new URL(url).origin === baseUrl) return url
        return baseUrl
      } catch (error: unknown) {
        captureErrorSafe(error, {
          action: 'redirect_callback',
          service: 'auth'
        })
        logger.error('Redirect callback failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        })
        return baseUrl
      }
    }
  },
  session: {
    strategy: "jwt" as SessionStrategy,
  },
  secret: authSecret,
}

export const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
