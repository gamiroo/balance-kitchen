// app/api/debug/users/route.ts
import { NextResponse } from "next/server"
import { db } from "@/shared/lib/database/client"

export async function GET() {
  try {
    const result = await db.query('SELECT id, email, name FROM users')
    return NextResponse.json({ users: result.rows })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
