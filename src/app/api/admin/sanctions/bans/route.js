import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/database"
import { verifyAdminAccess, getUserFlags, getApiSession } from "@/lib/api-auth"
import { hasPermission } from "@/utils/permissions"
import { findAndKickPlayer, reloadBansOnAllServers } from "@/services/servers/rcon"
import { sendDiscordWebhook } from "@/services/notifications/discord"
import { getAuthenticatedUser, formatSanction } from "@/utils/api-helpers"

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const { user, error: userError, status: userStatus } = await getAuthenticatedUser(cookieStore)
    
    if (userError) {
      return NextResponse.json({ error: userError }, { status: userStatus })
    }

    const { authorized, error: authError, status: authStatus } = await verifyAdminAccess({ headers: { cookie: `session=${cookieStore.get('session').value}` } }, "@web/ban.view")
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
        b.id,
        b.player_name,
        b.player_steamid,
        b.player_ip,
        b.admin_name,
        b.admin_steamid,
        b.reason,
        b.duration,
        b.ends,
        b.created,
        b.status,
        ub.reason as unban_reason,
        ub_admin.player_name as unban_admin_name
      FROM sa_bans b
      LEFT JOIN sa_unbans ub ON b.unban_id = ub.id
      LEFT JOIN sa_admins ub_admin ON ub.admin_id = ub_admin.id
    `
    
    let countQuery = "SELECT COUNT(*) as total FROM sa_bans b"
    let params = []
    let countParams = []

    if (search) {
      query += ` WHERE (b.player_name LIKE ? OR b.player_steamid LIKE ? OR b.player_ip LIKE ?)`
      countQuery += ` WHERE (b.player_name LIKE ? OR b.player_steamid LIKE ? OR b.player_ip LIKE ?)`
      const searchParam = `%${search}%`
      params = [searchParam, searchParam, searchParam]
      countParams = [searchParam, searchParam, searchParam]
    }

    query += " ORDER BY b.created DESC LIMIT ? OFFSET ?"
    params.push(limit, offset)

    const [bans, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, countParams)
    ])

    const formattedBans = bans.map(ban => formatSanction(ban, 'ban'))

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

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const { user, error: userError, status: userStatus } = await getAuthenticatedUser(cookieStore)
    
    if (userError) {
      return NextResponse.json({ error: userError }, { status: userStatus })
    }

    const flags = await getUserFlags(user.steamId)
    if (!hasPermission(flags, "@web/ban.add")) {
      return NextResponse.json(
        { error: "Access denied - @web/ban.add required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { playerName, playerSteamId, playerIp, reason, duration } = body

    if (!playerSteamId) {
      return NextResponse.json(
        { error: "Player SteamID is required" },
        { status: 400 }
      )
    }

    if (!reason) {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      )
    }

    let finalPlayerName = playerName
    if (!finalPlayerName) {
      try {
        const { getPlayerSummaries } = await import("@/utils/steam-api")
        const profiles = await getPlayerSummaries([playerSteamId])
        const playerProfile = profiles[playerSteamId]
        finalPlayerName = playerProfile?.displayName || "Unknown"
      } catch (steamError) {
        console.error("Error obteniendo nombre del jugador desde Steam:", steamError)
        finalPlayerName = "Unknown"
      }
    }

    const adminQuery = await db.query(
      `SELECT player_name FROM sa_admins WHERE player_steamid = ? LIMIT 1`,
      [user.steamId]
    )
    const adminName = adminQuery && adminQuery.length > 0 ? adminQuery[0].player_name : "Admin Web"
  
    let ends = null
    const durationMinutes = duration ? parseInt(duration) : 0
    if (durationMinutes > 0) {
      ends = new Date(Date.now() + durationMinutes * 60 * 1000)
    }

    const result = await db.query(
      `INSERT INTO sa_bans (player_name, player_steamid, player_ip, admin_name, admin_steamid, reason, duration, ends, created, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'ACTIVE')`,
      [finalPlayerName, playerSteamId, playerIp || null, adminName, user.steamId, reason, durationMinutes, ends]
    )

    const banId = Number(result.insertId)
    try {
      await findAndKickPlayer(playerSteamId, reason)
    } catch (rconError) {
      console.error("Error kicking player (ban added anyway):", rconError)
    }

    try {
      await reloadBansOnAllServers()
    } catch (reloadError) {
      console.error("Error reloading bans on servers (ban added anyway):", reloadError)
    }

    try {
      const banData = {
        id: banId,
        playerName: finalPlayerName,
        playerSteamId: playerSteamId,
        playerIp: playerIp || null,
        reason: reason,
        duration: durationMinutes,
        ends: ends,
        status: 'ACTIVE'
      }

      const adminData = {
        name: adminName,
        steamId: user.steamId
      }

      await sendDiscordWebhook('create', 'ban', banData, adminData)
    } catch (webhookError) {
      console.error("Error sending webhook (ban created anyway):", webhookError)
    }

    return NextResponse.json({
      success: true,
      message: "Ban added successfully",
      banId: banId
    })
  } catch (error) {
    console.error("Error creating ban:", error)
    return NextResponse.json(
      { error: "Error creating ban" },
      { status: 500 }
    )
  }
}

export async function PATCH(request) {
  try {
    const cookieStore = await cookies()
    const { user, error: userError, status: userStatus } = await getAuthenticatedUser(cookieStore)
    
    if (userError) {
      return NextResponse.json({ error: userError }, { status: userStatus })
    }

    const body = await request.json()
    const { id, playerSteamId, playerIp, reason, duration, status, unbanReason } = body

    if (!id) {
      return NextResponse.json(
        { error: "Ban ID is required" },
        { status: 400 }
      )
    }

    const existingBan = await db.query(
      `SELECT admin_steamid, admin_name, player_steamid, player_name, player_ip, reason, duration, ends, status, unban_id FROM sa_bans WHERE id = ?`,
      [id]
    )

    if (!existingBan || existingBan.length === 0) {
      return NextResponse.json(
        { error: "Ban not found" },
        { status: 404 }
      )
    }

    let banAdminSteamId = existingBan[0].admin_steamid
    if (!banAdminSteamId && existingBan[0].admin_name) {
      const adminQuery = await db.query(
        `SELECT player_steamid FROM sa_admins WHERE player_name = ? LIMIT 1`,
        [existingBan[0].admin_name]
      )
      if (adminQuery && adminQuery.length > 0) {
        banAdminSteamId = adminQuery[0].player_steamid
      }
    }

    if (banAdminSteamId) {
      banAdminSteamId = String(banAdminSteamId)
    }
    
    const flags = await getUserFlags(user.steamId)

    if (status === 'UNBANNED') {
      if (!banAdminSteamId) {
        if (!hasPermission(flags, "@web/ban.unban", false)) {
          return NextResponse.json(
            { error: "Access denied - You don't have permission to unban this ban" },
            { status: 403 }
          )
        }
      } else {
        const canUnban = hasPermission(
          flags,
          "@web/ban.unban",
          true,
          banAdminSteamId,
          String(user.steamId)
        )

        if (!canUnban) {
          return NextResponse.json(
            { error: "Access denied - You don't have permission to unban this ban" },
            { status: 403 }
          )
        }
      }
    } else {
      if (!banAdminSteamId) {
        if (!hasPermission(flags, "@web/ban.edit", false)) {
          return NextResponse.json(
            { error: "Access denied - You don't have permission to edit this ban" },
            { status: 403 }
          )
        }
      } else {
        const canEdit = hasPermission(
          flags,
          "@web/ban.edit",
          true,
          banAdminSteamId,
          String(user.steamId)
        )

        if (!canEdit) {
          return NextResponse.json(
            { error: "Access denied - You don't have permission to edit this ban" },
            { status: 403 }
          )
        }
      }
    }

    const updates = []
    const values = []

    if (playerSteamId !== undefined) {
      updates.push('player_steamid = ?')
      values.push(playerSteamId)

      if (playerSteamId && playerSteamId !== existingBan[0].player_steamid) {
        try {
          const { getPlayerSummaries } = await import("@/utils/steam-api")
          const profiles = await getPlayerSummaries([playerSteamId])
          const playerProfile = profiles[playerSteamId]
          if (playerProfile?.displayName) {
            updates.push('player_name = ?')
            values.push(playerProfile.displayName)
          }
        } catch (steamError) {
          console.error("Error getting player name from Steam:", steamError)
        }
      }
    }

    if (playerIp !== undefined) {
      updates.push('player_ip = ?')
      values.push(playerIp === '' || playerIp === null ? null : playerIp)
    }

    if (reason !== undefined) {
      updates.push('reason = ?')
      values.push(reason)
    }

    if (duration !== undefined) {
      const durationMinutes = duration ? parseInt(duration) : 0
      updates.push('duration = ?')
      values.push(durationMinutes)

      let ends = null
      if (durationMinutes > 0) {
        ends = new Date(Date.now() + durationMinutes * 60 * 1000)
      }
      updates.push('ends = ?')
      values.push(ends)
    }

    if (status !== undefined) {
      updates.push('status = ?')
      values.push(status)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      )
    }

    let unbanId = null
    if (status === 'UNBANNED') {
      if (existingBan[0].unban_id) {
        return NextResponse.json(
          { error: "This ban has already been unbanned" },
          { status: 400 }
        )
      }

      const adminIdQuery = await db.query(
        `SELECT id FROM sa_admins WHERE player_steamid = ? LIMIT 1`,
        [user.steamId]
      )
      const adminId = adminIdQuery && adminIdQuery.length > 0 ? adminIdQuery[0].id : 0

      const unbanReasonValue = unbanReason && unbanReason.trim() ? unbanReason.trim() : 'Unknown'
      const unbanResult = await db.query(
        `INSERT INTO sa_unbans (ban_id, admin_id, reason, date) VALUES (?, ?, ?, NOW())`,
        [id, adminId, unbanReasonValue]
      )
      unbanId = unbanResult.insertId

      updates.push('unban_id = ?')
      values.push(unbanId)
    }

    values.push(id)

    const oldBanData = {
      id: id,
      playerName: existingBan[0].player_name,
      playerSteamId: existingBan[0].player_steamid,
      playerIp: existingBan[0].player_ip,
      reason: existingBan[0].reason,
      duration: existingBan[0].duration,
      ends: existingBan[0].ends,
      status: existingBan[0].status
    }

    await db.query(
      `UPDATE sa_bans SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    const updatedBan = await db.query(
      `SELECT player_name, player_steamid, player_ip, reason, duration, ends, status FROM sa_bans WHERE id = ?`,
      [id]
    )

    const newBanData = {
      id: id,
      playerName: updatedBan[0].player_name,
      playerSteamId: updatedBan[0].player_steamid,
      playerIp: updatedBan[0].player_ip,
      reason: updatedBan[0].reason,
      duration: updatedBan[0].duration,
      ends: updatedBan[0].ends,
      status: updatedBan[0].status
    }

    if (status === 'UNBANNED' && unbanReason) {
      newBanData.unbanReason = unbanReason.trim()
    }

    const currentAdminQuery = await db.query(
      `SELECT player_name FROM sa_admins WHERE player_steamid = ? LIMIT 1`,
      [user.steamId]
    )
    const currentAdminName = currentAdminQuery && currentAdminQuery.length > 0 ? currentAdminQuery[0].player_name : "Admin Web"

    try {
      const adminData = {
        name: currentAdminName,
        steamId: user.steamId
      }

      const action = status === 'UNBANNED' ? 'unban' : 'update'
      await sendDiscordWebhook(action, 'ban', newBanData, adminData, oldBanData)
    } catch (webhookError) {
      console.error("Error sending webhook (ban updated anyway):", webhookError)
    }

    if (status === 'ACTIVE' && existingBan[0].player_steamid) {
      try {
        const banReason = reason || existingBan[0].reason || "Sanción aplicada"
        await findAndKickPlayer(existingBan[0].player_steamid, banReason)
      } catch (rconError) {
        console.error("Error kicking player:", rconError)
      }
    }

    try {
      await reloadBansOnAllServers()
    } catch (reloadError) {
      console.error("Error reloading bans on servers:", reloadError)
    }

    return NextResponse.json({
      success: true,
      message: "Ban updated successfully"
    })
  } catch (error) {
    console.error("Error updating ban:", error)
    return NextResponse.json(
      { error: "Error updating ban" },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const cookieStore = await cookies()
    const { user, error: userError, status: userStatus } = await getAuthenticatedUser(cookieStore)
    
    if (userError) {
      return NextResponse.json({ error: userError }, { status: userStatus })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Ban ID is required" },
        { status: 400 }
      )
    }

    const existingBan = await db.query(
      `SELECT admin_steamid, admin_name, player_name, player_steamid, player_ip, reason, duration, ends, status FROM sa_bans WHERE id = ?`,
      [id]
    )

    if (!existingBan || existingBan.length === 0) {
      return NextResponse.json(
        { error: "Ban not found" },
        { status: 404 }
      )
    }

    let banAdminSteamId = existingBan[0].admin_steamid
    if (!banAdminSteamId && existingBan[0].admin_name) {
      const adminQuery = await db.query(
        `SELECT player_steamid FROM sa_admins WHERE player_name = ? LIMIT 1`,
        [existingBan[0].admin_name]
      )
      if (adminQuery && adminQuery.length > 0) {
        banAdminSteamId = adminQuery[0].player_steamid
      }
    }
    const flags = await getUserFlags(user.steamId)

    const canRemove = hasPermission(
      flags,
      "@web/ban.remove",
      true,
      banAdminSteamId,
      user.steamId
    )

    if (!canRemove) {
      return NextResponse.json(
        { error: "Access denied - You don't have permission to delete this ban" },
        { status: 403 }
      )
    }

    const currentAdminQuery = await db.query(
      `SELECT player_name FROM sa_admins WHERE player_steamid = ? LIMIT 1`,
      [user.steamId]
    )
    const currentAdminName = currentAdminQuery && currentAdminQuery.length > 0 ? currentAdminQuery[0].player_name : "Admin Web"

    try {
      const banData = {
        id: id,
        playerName: existingBan[0].player_name,
        playerSteamId: existingBan[0].player_steamid,
        playerIp: existingBan[0].player_ip,
        reason: existingBan[0].reason,
        duration: existingBan[0].duration,
        ends: existingBan[0].ends,
        status: existingBan[0].status
      }

      const adminData = {
        name: currentAdminName,
        steamId: user.steamId
      }

      await sendDiscordWebhook('delete', 'ban', banData, adminData)
    } catch (webhookError) {
      console.error("Error enviando webhook (ban eliminado de todas formas):", webhookError)
    }

    await db.query(`DELETE FROM sa_bans WHERE id = ?`, [id])

    try {
      await reloadBansOnAllServers()
    } catch (reloadError) {
      console.error("Error reloading bans on servers:", reloadError)
    }

    return NextResponse.json({
      success: true,
      message: "Ban deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting ban:", error)
    return NextResponse.json(
      { error: "Error deleting ban" },
      { status: 500 }
    )
  }
}