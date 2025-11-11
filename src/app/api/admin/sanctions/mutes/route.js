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

    const { authorized, error: authError, status: authStatus } = await verifyAdminAccess({ headers: { cookie: `session=${sessionToken.value}` } }, "@web/mute.view")
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
        admin_name,
        reason,
        duration,
        ends,
        created,
        status,
        type
      FROM sa_mutes
    `
    
    let countQuery = "SELECT COUNT(*) as total FROM sa_mutes"
    let params = []
    let countParams = []

    if (search) {
      query += ` WHERE (player_name LIKE ? OR player_steamid LIKE ?)`
      countQuery += ` WHERE (player_name LIKE ? OR player_steamid LIKE ?)`
      const searchParam = `%${search}%`
      params = [searchParam, searchParam]
      countParams = [searchParam, searchParam]
    }

    query += " ORDER BY created DESC LIMIT ? OFFSET ?"
    params.push(limit, offset)

    const [mutes, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, countParams)
    ])

    const formattedMutes = mutes.map(mute => ({
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

    return NextResponse.json({
      mutes: formattedMutes,
      total: Number(countResult[0].total),
      page,
      limit
    })
  } catch (error) {
    console.error("Error fetching admin mutes:", error)
    return NextResponse.json(
      { error: "Failed to fetch mutes" },
      { status: 500 }
    )
  }
}