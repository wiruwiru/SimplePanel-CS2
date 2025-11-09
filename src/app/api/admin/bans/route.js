import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/database"
import { verifyAdminAccess } from "@/lib/api-auth"

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    let user
    try {
      user = JSON.parse(Buffer.from(sessionToken.value, "base64").toString())
    } catch (error) {
      return NextResponse.json(
        { error: "Sesión inválida" },
        { status: 401 }
      )
    }

    const { authorized, error: authError, status: authStatus } = await verifyAdminAccess({ headers: { cookie: `session=${sessionToken.value}` } }, "@web/ban.view")
    if (!authorized) {
      return NextResponse.json(
        { error: authError },
        { status: authStatus }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    let query = `
      SELECT 
        id,
        player_name,
        player_steamid,
        player_ip,
        admin_name,
        reason,
        duration,
        ends,
        created,
        status
      FROM sa_bans
    `
    
    let countQuery = "SELECT COUNT(*) as total FROM sa_bans"
    let params = []
    let countParams = []

    if (search) {
      query += ` WHERE (player_name LIKE ? OR player_steamid LIKE ? OR player_ip LIKE ?)`
      countQuery += ` WHERE (player_name LIKE ? OR player_steamid LIKE ? OR player_ip LIKE ?)`
      const searchParam = `%${search}%`
      params = [searchParam, searchParam, searchParam]
      countParams = [searchParam, searchParam, searchParam]
    }

    query += " ORDER BY created DESC LIMIT ? OFFSET ?"
    params.push(limit, offset)

    const [bans, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, countParams)
    ])

    const formattedBans = bans.map(ban => ({
      id: Number(ban.id),
      player: ban.player_name || "Desconocido",
      steamId: ban.player_steamid ? String(ban.player_steamid) : "",
      ip: ban.player_ip || "",
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
      status: ban.status || 'ACTIVE'
    }))

    return NextResponse.json({
      bans: formattedBans,
      total: Number(countResult[0].total),
      page,
      limit
    })
  } catch (error) {
    console.error("Error fetching admin bans:", error)
    return NextResponse.json(
      { error: "Failed to fetch bans" },
      { status: 500 }
    )
  }
}