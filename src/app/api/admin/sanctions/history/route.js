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

    let user
    try {
      user = JSON.parse(Buffer.from(sessionToken.value, "base64").toString())
    } catch (error) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
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
    const steamId = searchParams.get("steamId")
    if (!steamId) {
      return NextResponse.json({ message: "Steam ID is required" }, { status: 400 })
    }

    const bansQuery = `
      SELECT 
        id,
        player_name,
        player_steamid,
        admin_name,
        reason,
        duration,
        ends,
        created,
        status
      FROM sa_bans
      WHERE player_steamid = ?
      ORDER BY created DESC
    `

    const mutesQuery = `
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
      WHERE player_steamid = ?
      ORDER BY created DESC
    `

    const [bans, mutes] = await Promise.all([
      db.query(bansQuery, [steamId]),
      db.query(mutesQuery, [steamId])
    ])

    const formattedBans = bans.map(ban => {
      const createdDate = new Date(ban.created)
      return {
        id: Number(ban.id),
        player: ban.player_name || "Unknown",
        steamId: ban.player_steamid ? String(ban.player_steamid) : "",
        admin: ban.admin_name || "Console",
        reason: ban.reason || "No reason specified",
        duration: ban.duration === 0 ? "Permanent" : `${ban.duration} minutes`,
        ends: ban.ends ? new Date(ban.ends).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }) : null,
        date: createdDate.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        dateSort: createdDate.getTime(),
        status: ban.status || 'ACTIVE',
        type: 'BAN'
      }
    })

    const formattedMutes = mutes.map(mute => {
      const createdDate = new Date(mute.created)
      return {
        id: Number(mute.id),
        player: mute.player_name || "Unknown",
        steamId: mute.player_steamid ? String(mute.player_steamid) : "",
        admin: mute.admin_name || "Console",
        reason: mute.reason || "No reason specified",
        duration: mute.duration === 0 ? "Permanent" : `${mute.duration} minutes`,
        ends: mute.ends ? new Date(mute.ends).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }) : null,
        date: createdDate.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        dateSort: createdDate.getTime(),
        status: mute.status || 'ACTIVE',
        type: mute.type || 'GAG'
      }
    })

    const allSanctions = [...formattedBans, ...formattedMutes].sort((a, b) => {
      return b.dateSort - a.dateSort
    })

    return NextResponse.json({
      sanctions: allSanctions,
      bans: formattedBans,
      mutes: formattedMutes,
      total: allSanctions.length
    })
  } catch (error) {
    console.error("Error fetching sanctions history:", error)
    return NextResponse.json(
      { error: "Failed to fetch sanctions history" },
      { status: 500 }
    )
  }
}