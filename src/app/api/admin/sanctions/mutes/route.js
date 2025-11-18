import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/database"
import { verifyAdminAccess, getUserFlags } from "@/lib/api-auth"
import { hasPermission } from "@/utils/permissions"
import { sendDiscordWebhook } from "@/services/notifications/discord"
import { getAuthenticatedUser, checkPermission, formatSanction } from "@/utils/api-helpers"

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const { user, error: userError, status: userStatus } = getAuthenticatedUser(cookieStore)
    
    if (userError) {
      return NextResponse.json({ error: userError }, { status: userStatus })
    }

    const { authorized, error: authError, status: authStatus } = await verifyAdminAccess({ headers: { cookie: `session=${cookieStore.get('session').value}` } }, "@web/mute.view")
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
        m.id,
        m.player_name,
        m.player_steamid,
        m.admin_name,
        m.admin_steamid,
        m.reason,
        m.duration,
        m.ends,
        m.created,
        m.status,
        m.type,
        um.reason as unmute_reason,
        um_admin.player_name as unmute_admin_name
      FROM sa_mutes m
      LEFT JOIN sa_unmutes um ON m.unmute_id = um.id
      LEFT JOIN sa_admins um_admin ON um.admin_id = um_admin.id
    `
    
    let countQuery = "SELECT COUNT(*) as total FROM sa_mutes m"
    let params = []
    let countParams = []

    if (search) {
      query += ` WHERE (m.player_name LIKE ? OR m.player_steamid LIKE ?)`
      countQuery += ` WHERE (m.player_name LIKE ? OR m.player_steamid LIKE ?)`
      const searchParam = `%${search}%`
      params = [searchParam, searchParam]
      countParams = [searchParam, searchParam]
    }

    query += " ORDER BY m.created DESC LIMIT ? OFFSET ?"
    params.push(limit, offset)

    const [mutes, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, countParams)
    ])

    const formattedMutes = mutes.map(mute => formatSanction({ ...mute, type: mute.type || 'GAG' }, 'mute'))

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

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const { user, error: userError, status: userStatus } = getAuthenticatedUser(cookieStore)
    
    if (userError) {
      return NextResponse.json({ error: userError }, { status: userStatus })
    }

    const { authorized, error: permError, status: permStatus } = await checkPermission(user.steamId, "@web/mute.add")
    if (!authorized) {
      return NextResponse.json({ error: permError }, { status: permStatus })
    }

    const body = await request.json()
    const { playerName, playerSteamId, reason, duration, type } = body

    if (!playerSteamId) {
      return NextResponse.json(
        { error: "SteamID del jugador es requerido" },
        { status: 400 }
      )
    }

    if (!reason) {
      return NextResponse.json(
        { error: "La razón es requerida" },
        { status: 400 }
      )
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
      `INSERT INTO sa_mutes (player_name, player_steamid, admin_name, admin_steamid, reason, duration, ends, created, status, type)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'ACTIVE', ?)`,
      [playerName || "Desconocido", playerSteamId, adminName, user.steamId, reason, durationMinutes, ends, type || 'GAG']
    )

    const muteId = Number(result.insertId)

    try {
      const muteData = {
        id: muteId,
        playerName: playerName || "Desconocido",
        playerSteamId: playerSteamId,
        reason: reason,
        duration: durationMinutes,
        ends: ends,
        status: 'ACTIVE',
        type: type || 'GAG'
      }

      const adminData = {
        name: adminName,
        steamId: user.steamId
      }

      await sendDiscordWebhook('create', 'mute', muteData, adminData)
    } catch (webhookError) {
      console.error("Error enviando webhook (mute creado de todas formas):", webhookError)
    }

    return NextResponse.json({
      success: true,
      message: "Mute añadido correctamente",
      muteId: muteId
    })
  } catch (error) {
    console.error("Error creating mute:", error)
    return NextResponse.json(
      { error: "Error al crear mute" },
      { status: 500 }
    )
  }
}

export async function PATCH(request) {
  try {
    const cookieStore = await cookies()
    const { user, error: userError, status: userStatus } = getAuthenticatedUser(cookieStore)
    
    if (userError) {
      return NextResponse.json({ error: userError }, { status: userStatus })
    }

    const body = await request.json()
    const { id, playerSteamId, reason, duration, status, type, unmuteReason } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID del mute es requerido" },
        { status: 400 }
      )
    }

    const existingMute = await db.query(
      `SELECT admin_steamid, admin_name, player_steamid, player_name, reason, duration, ends, status, type, unmute_id FROM sa_mutes WHERE id = ?`,
      [id]
    )

    if (!existingMute || existingMute.length === 0) {
      return NextResponse.json(
        { error: "Mute no encontrado" },
        { status: 404 }
      )
    }

    let muteAdminSteamId = existingMute[0].admin_steamid
    if (!muteAdminSteamId && existingMute[0].admin_name) {
      const adminQuery = await db.query(
        `SELECT player_steamid FROM sa_admins WHERE player_name = ? LIMIT 1`,
        [existingMute[0].admin_name]
      )
      if (adminQuery && adminQuery.length > 0) {
        muteAdminSteamId = adminQuery[0].player_steamid
      }
    }
    const flags = await getUserFlags(user.steamId)

    if (status === 'UNMUTED') {
      const canUnmute = hasPermission(
        flags,
        "@web/mute.unmute",
        true,
        muteAdminSteamId,
        user.steamId
      )

      if (!canUnmute) {
        return NextResponse.json(
          { error: "Acceso denegado - No tienes permisos para desmutear este mute" },
          { status: 403 }
        )
      }
    } else {
      const canEdit = hasPermission(
        flags,
        "@web/mute.edit",
        true,
        muteAdminSteamId,
        user.steamId
      )

      if (!canEdit) {
        return NextResponse.json(
          { error: "Acceso denegado - No tienes permisos para editar este mute" },
          { status: 403 }
        )
      }
    }

    const updates = []
    const values = []

    if (playerSteamId !== undefined) {
      updates.push('player_steamid = ?')
      values.push(playerSteamId)

      if (playerSteamId && playerSteamId !== existingMute[0].player_steamid) {
        try {
          const { getPlayerSummaries } = await import("@/utils/steam-api")
          const profiles = await getPlayerSummaries([playerSteamId])
          const playerProfile = profiles[playerSteamId]
          if (playerProfile?.displayName) {
            updates.push('player_name = ?')
            values.push(playerProfile.displayName)
          }
        } catch (steamError) {
          console.error("Error obteniendo nombre del jugador desde Steam:", steamError)
        }
      }
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

    if (type !== undefined) {
      updates.push('type = ?')
      values.push(type)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No hay campos para actualizar" },
        { status: 400 }
      )
    }

    let unmuteId = null
    if (status === 'UNMUTED') {
      if (existingMute[0].unmute_id) {
        return NextResponse.json(
          { error: "Este mute ya ha sido desmuteado anteriormente" },
          { status: 400 }
        )
      }

      const adminIdQuery = await db.query(
        `SELECT id FROM sa_admins WHERE player_steamid = ? LIMIT 1`,
        [user.steamId]
      )
      const adminId = adminIdQuery && adminIdQuery.length > 0 ? adminIdQuery[0].id : 0

      const unmuteReasonValue = unmuteReason && unmuteReason.trim() ? unmuteReason.trim() : 'Unknown'
      const unmuteResult = await db.query(
        `INSERT INTO sa_unmutes (mute_id, admin_id, reason, date) VALUES (?, ?, ?, NOW())`,
        [id, adminId, unmuteReasonValue]
      )
      unmuteId = unmuteResult.insertId

      updates.push('unmute_id = ?')
      values.push(unmuteId)
    }

    values.push(id)

    const oldMuteData = {
      id: id,
      playerName: existingMute[0].player_name,
      playerSteamId: existingMute[0].player_steamid,
      reason: existingMute[0].reason,
      duration: existingMute[0].duration,
      ends: existingMute[0].ends,
      status: existingMute[0].status,
      type: existingMute[0].type
    }

    await db.query(
      `UPDATE sa_mutes SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    const updatedMute = await db.query(
      `SELECT player_name, player_steamid, reason, duration, ends, status, type FROM sa_mutes WHERE id = ?`,
      [id]
    )

    const newMuteData = {
      id: id,
      playerName: updatedMute[0].player_name,
      playerSteamId: updatedMute[0].player_steamid,
      reason: updatedMute[0].reason,
      duration: updatedMute[0].duration,
      ends: updatedMute[0].ends,
      status: updatedMute[0].status,
      type: updatedMute[0].type
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

      const action = status === 'UNMUTED' ? 'unmute' : 'update'
      await sendDiscordWebhook(action, 'mute', newMuteData, adminData, oldMuteData)
    } catch (webhookError) {
      console.error("Error enviando webhook (mute actualizado de todas formas):", webhookError)
    }

    return NextResponse.json({
      success: true,
      message: "Mute actualizado correctamente"
    })
  } catch (error) {
    console.error("Error updating mute:", error)
    return NextResponse.json(
      { error: "Error al actualizar mute" },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const cookieStore = await cookies()
    const { user, error: userError, status: userStatus } = getAuthenticatedUser(cookieStore)
    
    if (userError) {
      return NextResponse.json({ error: userError }, { status: userStatus })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID del mute es requerido" },
        { status: 400 }
      )
    }

    const existingMute = await db.query(
      `SELECT admin_steamid, admin_name, player_name, player_steamid, reason, duration, ends, status, type FROM sa_mutes WHERE id = ?`,
      [id]
    )

    if (!existingMute || existingMute.length === 0) {
      return NextResponse.json(
        { error: "Mute no encontrado" },
        { status: 404 }
      )
    }

    let muteAdminSteamId = existingMute[0].admin_steamid
    if (!muteAdminSteamId && existingMute[0].admin_name) {
      const adminQuery = await db.query(
        `SELECT player_steamid FROM sa_admins WHERE player_name = ? LIMIT 1`,
        [existingMute[0].admin_name]
      )
      if (adminQuery && adminQuery.length > 0) {
        muteAdminSteamId = adminQuery[0].player_steamid
      }
    }
    const flags = await getUserFlags(user.steamId)

    const canRemove = hasPermission(
      flags,
      "@web/mute.remove",
      true,
      muteAdminSteamId,
      user.steamId
    )

    if (!canRemove) {
      return NextResponse.json(
        { error: "Acceso denegado - No tienes permisos para eliminar este mute" },
        { status: 403 }
      )
    }

    const currentAdminQuery = await db.query(
      `SELECT player_name FROM sa_admins WHERE player_steamid = ? LIMIT 1`,
      [user.steamId]
    )
    const currentAdminName = currentAdminQuery && currentAdminQuery.length > 0 ? currentAdminQuery[0].player_name : "Admin Web"

    try {
      const muteData = {
        id: id,
        playerName: existingMute[0].player_name,
        playerSteamId: existingMute[0].player_steamid,
        reason: existingMute[0].reason,
        duration: existingMute[0].duration,
        ends: existingMute[0].ends,
        status: existingMute[0].status,
        type: existingMute[0].type
      }

      const adminData = {
        name: currentAdminName,
        steamId: user.steamId
      }

      await sendDiscordWebhook('delete', 'mute', muteData, adminData)
    } catch (webhookError) {
      console.error("Error enviando webhook (mute eliminado de todas formas):", webhookError)
    }

    await db.query(`DELETE FROM sa_mutes WHERE id = ?`, [id])

    return NextResponse.json({
      success: true,
      message: "Mute eliminado correctamente"
    })
  } catch (error) {
    console.error("Error deleting mute:", error)
    return NextResponse.json(
      { error: "Error al eliminar mute" },
      { status: 500 }
    )
  }
}