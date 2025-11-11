import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/database"
import { verifyAdminAccess, getUserFlags } from "@/lib/api-auth"
import { hasPermission } from "@/lib/permission-utils"

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
    if (!hasPermission(flags, "@web/mute.add")) {
      return NextResponse.json(
        { error: "Acceso denegado - Se requiere @web/mute.add" },
        { status: 403 }
      )
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
    const { id, reason, duration, status, type } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID del mute es requerido" },
        { status: 400 }
      )
    }

    const existingMute = await db.query(
      `SELECT admin_steamid, admin_name, player_steamid FROM sa_mutes WHERE id = ?`,
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

    values.push(id)

    await db.query(
      `UPDATE sa_mutes SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

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
        { error: "ID del mute es requerido" },
        { status: 400 }
      )
    }

    const existingMute = await db.query(
      `SELECT admin_steamid, admin_name FROM sa_mutes WHERE id = ?`,
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