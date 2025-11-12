import { NextResponse } from "next/server"
import { db } from "@/lib/database"
import { getServersWithStatus } from "@/services/servers/server-query"

export async function GET() {
  try {
    const dbServers = await db.query(`
      SELECT 
        s.id, 
        s.hostname, 
        s.address 
      FROM sa_servers s
      LEFT JOIN sp_visibility_settings v ON s.id = v.server_id
      WHERE COALESCE(v.is_visible, 1) = 1
      ORDER BY s.id ASC
    `)
    
    if (!dbServers || dbServers.length === 0) {
      return NextResponse.json([])
    }

    const serversWithInfo = await getServersWithStatus(dbServers)

    return NextResponse.json(serversWithInfo)
  } catch (error) {
    console.error("Error fetching servers:", error)
    return NextResponse.json(
      { error: "Failed to fetch servers" },
      { status: 500 }
    )
  }
}