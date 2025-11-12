// app/api/debug/env/route.ts
import { NextResponse } from "next/server"

export async function GET() {
  const hasDatabaseUrl = !!process.env.DATABASE_URL
  const hasAuthSecret = !!process.env.NEXTAUTH_SECRET
  const hasAuthUrl = !!process.env.NEXTAUTH_URL
  
  // Don't expose the actual values for security
  return NextResponse.json({
    hasDatabaseUrl,
    hasAuthSecret,
    hasAuthUrl,
    authSecretLength: process.env.NEXTAUTH_SECRET ? process.env.NEXTAUTH_SECRET.length : 0,
    nodeEnv: process.env.NODE_ENV,
  })
}
