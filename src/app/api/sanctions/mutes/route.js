import { NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "15")
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
      player: mute.player_name || "Unknown",
      steamId: mute.player_steamid ? String(mute.player_steamid) : "",
      admin: mute.admin_name || "Console",
      reason: mute.reason || "No reason specified",
      duration: mute.duration === 0 ? "Permanent" : `${mute.duration} minutes`,
      durationMinutes: mute.duration || 0,
      date: new Date(mute.created).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      created: mute.created ? new Date(mute.created).getTime() : null,
      ends: mute.ends ? new Date(mute.ends).getTime() : null,
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
    console.error("Error fetching mutes:", error)
    return NextResponse.json(
      { error: "Failed to fetch mutes" },
      { status: 500 }
    )
  }
}