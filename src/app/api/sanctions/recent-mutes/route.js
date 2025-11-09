import { NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET() {
  try {
    const recentMutes = await db.query(`
      SELECT 
        id,
        player_name,
        player_steamid,
        admin_name,
        reason,
        duration,
        created,
        status,
        type
      FROM sa_mutes
      ORDER BY created DESC
      LIMIT 5
    `)

    const formattedMutes = recentMutes.map(mute => ({
      id: Number(mute.id),
      player: mute.player_name || "Desconocido",
      steamId: mute.player_steamid ? String(mute.player_steamid) : "",
      admin: mute.admin_name || "Consola",
      reason: mute.reason || "Sin razón especificada",
      duration: mute.duration === 0 ? "Permanente" : `${mute.duration} minutos`,
      date: new Date(mute.created).toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      status: mute.status || 'ACTIVE',
      type: mute.type || 'GAG'
    }))

    return NextResponse.json(formattedMutes)
  } catch (error) {
    console.error("Error fetching recent mutes:", error)
    return NextResponse.json(
      { error: "Failed to fetch recent mutes" },
      { status: 500 }
    )
  }
}