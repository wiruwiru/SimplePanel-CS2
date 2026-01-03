import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/database"
import { verifyAdminAccess } from "@/lib/api-auth"

function intToIp(int) {
  return [(int >>> 24) & 0xff, (int >>> 16) & 0xff, (int >>> 8) & 0xff, int & 0xff].join(".")
}

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
    } = await verifyAdminAccess({ headers: { cookie: `session=${sessionToken.value}` } }, "@web/search.players")
    if (!authorized) {
      return NextResponse.json({ error: authError }, { status: authStatus })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    let query = `
      SELECT 
        steamid,
        name,
        address,
        used_at
      FROM sa_players_ips
    `

    let countQuery = "SELECT COUNT(*) as total FROM sa_players_ips"
    let params = []
    let countParams = []

    if (search) {
      const looksLikeIp = search.includes(".")
      if (looksLikeIp) {
        query += ` WHERE (
          name LIKE ? OR 
          steamid LIKE ? OR 
          INET_NTOA(address) LIKE ?
        )`
        countQuery += ` WHERE (
          name LIKE ? OR 
          steamid LIKE ? OR 
          INET_NTOA(address) LIKE ?
        )`
      } else {
        query += ` WHERE (name LIKE ? OR steamid LIKE ?)`
        countQuery += ` WHERE (name LIKE ? OR steamid LIKE ?)`
      }

      const searchParam = `%${search}%`
      params = looksLikeIp ? [searchParam, searchParam, searchParam] : [searchParam, searchParam]
      countParams = looksLikeIp ? [searchParam, searchParam, searchParam] : [searchParam, searchParam]
    }

    query += " ORDER BY used_at DESC LIMIT ? OFFSET ?"
    params.push(limit, offset)

    const [records, countResult] = await Promise.all([db.query(query, params), db.query(countQuery, countParams)])

    const playerMap = new Map()
    records.forEach((record) => {
      const steamId = String(record.steamid)
      if (!playerMap.has(steamId)) {
        playerMap.set(steamId, {
          steamId,
          name: record.name || "Unknown",
          connections: [],
          lastConnection: record.used_at,
        })
      }

      const player = playerMap.get(steamId)
      player.connections.push({
        ip: intToIp(record.address),
        date: record.used_at,
      })

      if (new Date(record.used_at) > new Date(player.lastConnection)) {
        player.lastConnection = record.used_at
      }
    })

    const formattedPlayers = Array.from(playerMap.values()).map((player) => ({
      steamId: player.steamId,
      name: player.name,
      lastConnection: new Date(player.lastConnection).toLocaleString("es-AR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      totalConnections: player.connections.length,
      recentIps: player.connections.slice(0, 5).map((conn) => ({
        ip: conn.ip,
        date: new Date(conn.date).toLocaleString("es-AR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
    }))

    return NextResponse.json({
      players: formattedPlayers,
      total: Number(countResult[0].total),
      page,
      limit,
    })
  } catch (error) {
    console.error("Error fetching player IPs:", error)
    return NextResponse.json({ error: "Failed to fetch player records" }, { status: 500 })
  }
}