import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/database"
import { verifyAdminAccess } from "@/lib/api-auth"

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      authorized,
      error: authError,
      status: authStatus,
    } = await verifyAdminAccess({ headers: { cookie: `session=${sessionToken.value}` } }, "@web/chatlogs.view")
    if (!authorized) {
      return NextResponse.json({ error: authError }, { status: authStatus })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const playerSearch = searchParams.get("playerSearch") || ""
    const team = searchParams.get("team") || ""
    const messageType = searchParams.get("messageType") || ""
    const serverId = searchParams.get("serverId") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    let query = `
      SELECT 
        id,
        serverId,
        playerSteam64,
        playerName,
        message,
        is_team,
        player_team,
        created
      FROM sa_chatlogs
      WHERE 1=1
    `
    
    let countQuery = "SELECT COUNT(*) as total FROM sa_chatlogs WHERE 1=1"
    let params = []
    let countParams = []

    if (search) {
      query += ` AND message LIKE ?`
      countQuery += ` AND message LIKE ?`
      const searchParam = `%${search}%`
      params.push(searchParam)
      countParams.push(searchParam)
    }

    if (playerSearch) {
      query += ` AND (playerName LIKE ? OR playerSteam64 LIKE ?)`
      countQuery += ` AND (playerName LIKE ? OR playerSteam64 LIKE ?)`
      const playerSearchParam = `%${playerSearch}%`
      params.push(playerSearchParam, playerSearchParam)
      countParams.push(playerSearchParam, playerSearchParam)
    }

    if (team !== "") {
      const teamValue = parseInt(team)
      if (!isNaN(teamValue)) {
        query += ` AND player_team = ?`
        countQuery += ` AND player_team = ?`
        params.push(teamValue)
        countParams.push(teamValue)
      }
    }

    if (messageType !== "") {
      const messageTypeValue = messageType === "team" ? 1 : 0
      query += ` AND is_team = ?`
      countQuery += ` AND is_team = ?`
      params.push(messageTypeValue)
      countParams.push(messageTypeValue)
    }

    if (serverId) {
      query += ` AND serverId = ?`
      countQuery += ` AND serverId = ?`
      params.push(String(serverId))
      countParams.push(String(serverId))
    }

    query += " ORDER BY created DESC LIMIT ? OFFSET ?"
    params.push(limit, offset)

    const [chatlogs, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, countParams)
    ])

    const formattedChatlogs = chatlogs.map(log => ({
      id: Number(log.id),
      serverId: log.serverId,
      playerSteam64: log.playerSteam64,
      playerName: log.playerName || "Unknown",
      message: log.message || "",
      isTeam: Boolean(log.is_team),
      playerTeam: Number(log.player_team),
      created: new Date(log.created).toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      createdSort: new Date(log.created).getTime()
    }))

    return NextResponse.json({
      chatlogs: formattedChatlogs,
      total: Number(countResult[0].total),
      page,
      limit
    })
  } catch (error) {
    console.error("Error fetching chatlogs:", error)
    return NextResponse.json(
      { error: "Failed to fetch chatlogs" },
      { status: 500 }
    )
  }
}