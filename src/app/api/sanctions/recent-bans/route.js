import { NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET() {
  try {
    const recentBans = await db.query(`
      SELECT 
        id,
        player_name,
        player_steamid,
        admin_name,
        reason,
        duration,
        created,
        status
      FROM sa_bans
      WHERE status = 'ACTIVE'
      ORDER BY created DESC
      LIMIT 5
    `)

    const formattedBans = recentBans.map(ban => ({
      id: Number(ban.id),
      player: ban.player_name || "Desconocido",
      steamId: ban.player_steamid ? String(ban.player_steamid) : "",
      admin: ban.admin_name || "Consola",
      reason: ban.reason || "Sin razón especificada",
      duration: ban.duration === 0 ? "Permanente" : `${ban.duration} minutos`,
      date: new Date(ban.created).toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      status: 'active'
    }))

    return NextResponse.json(formattedBans)
  } catch (error) {
    console.error("Error fetching recent bans:", error)
    return NextResponse.json(
      { error: "Failed to fetch recent bans" },
      { status: 500 }
    )
  }
}