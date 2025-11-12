import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/database"
import { verifyAdminAccess, getUserFlags, getApiSession } from "@/lib/api-auth"
import { hasPermission } from "@/lib/permission-utils"
import { findAndKickPlayer, reloadBansOnAllServers } from "@/lib/rcon-utils"

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
        admin_steamid,
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
      adminSteamId: ban.admin_steamid ? String(ban.admin_steamid) : null,
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

export async function POST(request) {
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

    if (!user || !user.steamId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const flags = await getUserFlags(user.steamId)
    if (!hasPermission(flags, "@web/ban.add")) {
      return NextResponse.json(
        { error: "Acceso denegado - Se requiere @web/ban.add" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { playerName, playerSteamId, playerIp, reason, duration } = body

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

    let finalPlayerName = playerName
    if (!finalPlayerName && process.env.STEAM_API_KEY) {
      try {
        const steamApiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${playerSteamId}`
        const steamApiResponse = await fetch(steamApiUrl)
        const steamData = await steamApiResponse.json()

        if (steamData.response?.players?.[0]) {
          finalPlayerName = steamData.response.players[0].personaname || "Desconocido"
        } else {
          finalPlayerName = "Desconocido"
        }
      } catch (steamError) {
        console.error("Error obteniendo nombre del jugador desde Steam:", steamError)
        finalPlayerName = "Desconocido"
      }
    } else if (!finalPlayerName) {
      finalPlayerName = "Desconocido"
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
      console.error("Error al expulsar jugador (ban añadido de todas formas):", rconError)
    }

    try {
      await reloadBansOnAllServers()
    } catch (reloadError) {
      console.error("Error al recargar bans en servidores (ban añadido de todas formas):", reloadError)
    }

    return NextResponse.json({
      success: true,
      message: "Ban añadido correctamente",
      banId: banId
    })
  } catch (error) {
    console.error("Error creating ban:", error)
    return NextResponse.json(
      { error: "Error al crear ban" },
      { status: 500 }
    )
  }
}

export async function PATCH(request) {
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

    if (!user || !user.steamId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, reason, duration, status } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID del ban es requerido" },
        { status: 400 }
      )
    }

    const existingBan = await db.query(
      `SELECT admin_steamid, admin_name, player_steamid FROM sa_bans WHERE id = ?`,
      [id]
    )

    if (!existingBan || existingBan.length === 0) {
      return NextResponse.json(
        { error: "Ban no encontrado" },
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

    if (status === 'UNBANNED') {
      const canUnban = hasPermission(
        flags,
        "@web/ban.unban",
        true,
        banAdminSteamId,
        user.steamId
      )

      if (!canUnban) {
        return NextResponse.json(
          { error: "Acceso denegado - No tienes permisos para desbanear este ban" },
          { status: 403 }
        )
      }
    } else {
      const canEdit = hasPermission(
        flags,
        "@web/ban.edit",
        true,
        banAdminSteamId,
        user.steamId
      )

      if (!canEdit) {
        return NextResponse.json(
          { error: "Acceso denegado - No tienes permisos para editar este ban" },
          { status: 403 }
        )
      }
    }

    const updates = []
    const values = []

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
        { error: "No hay campos para actualizar" },
        { status: 400 }
      )
    }

    values.push(id)

    await db.query(
      `UPDATE sa_bans SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    if (status === 'ACTIVE' && existingBan[0].player_steamid) {
      try {
        const banReason = reason || existingBan[0].reason || "Sanción aplicada"
        await findAndKickPlayer(existingBan[0].player_steamid, banReason)
      } catch (rconError) {
        console.error("Error al expulsar jugador:", rconError)
      }
    }

    if (status === 'ACTIVE') {
      try {
        await reloadBansOnAllServers()
      } catch (reloadError) {
        console.error("Error al recargar bans en servidores:", reloadError)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Ban actualizado correctamente"
    })
  } catch (error) {
    console.error("Error updating ban:", error)
    return NextResponse.json(
      { error: "Error al actualizar ban" },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
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

    if (!user || !user.steamId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID del ban es requerido" },
        { status: 400 }
      )
    }

    const existingBan = await db.query(
      `SELECT admin_steamid, admin_name FROM sa_bans WHERE id = ?`,
      [id]
    )

    if (!existingBan || existingBan.length === 0) {
      return NextResponse.json(
        { error: "Ban no encontrado" },
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
        { error: "Acceso denegado - No tienes permisos para eliminar este ban" },
        { status: 403 }
      )
    }

    await db.query(`DELETE FROM sa_bans WHERE id = ?`, [id])

    return NextResponse.json({
      success: true,
      message: "Ban eliminado correctamente"
    })
  } catch (error) {
    console.error("Error deleting ban:", error)
    return NextResponse.json(
      { error: "Error al eliminar ban" },
      { status: 500 }
    )
  }
}