import { NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET() {
  try {
    const [bansResult, mutesResult] = await Promise.all([
      db.query("SELECT COUNT(*) as count FROM sa_bans"),
      db.query("SELECT COUNT(*) as count FROM sa_mutes")
    ])

    return NextResponse.json({
      activeBans: Number(bansResult[0].count),
      activeMutes: Number(mutesResult[0].count)
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
}