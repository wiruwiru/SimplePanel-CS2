import { parse } from "cookie"
import { db } from "@/lib/database"

export async function getApiSession(req) {
  try {
    const cookies = parse(req.headers.cookie || "")
    const sessionToken = cookies.session
    if (!sessionToken) {
      return { user: null, flags: [] }
    }

    const user = JSON.parse(Buffer.from(sessionToken, "base64").toString())
    return { user }
  } catch (error) {
    console.error("Error al obtener la sesión:", error)
    return { user: null, flags: [] }
  }
}

export async function getUserFlags(steamId) {
  try {
    if (!steamId) return []

    const adminQuery = await db.query(
      `SELECT sa.id, sa.flags, sa.immunity, sa.group_id, sa.ends
       FROM sa_admins sa
       WHERE sa.player_steamid = ?
       AND (sa.ends IS NULL OR sa.ends > NOW())`,
      [steamId],
    )

    if (!adminQuery || adminQuery.length === 0) {
      return []
    }

    const admin = adminQuery[0]
    const allFlags = new Set()

    const adminFlagsQuery = await db.query(`SELECT flag FROM sa_admins_flags WHERE admin_id = ?`, [admin.id])
    if (adminFlagsQuery && adminFlagsQuery.length > 0) {
      adminFlagsQuery.forEach((row) => allFlags.add(row.flag))
    }

    if (admin.group_id) {
      const groupFlagsQuery = await db.query(`SELECT flag FROM sa_groups_flags WHERE group_id = ?`, [admin.group_id])

      if (groupFlagsQuery && groupFlagsQuery.length > 0) {
        groupFlagsQuery.forEach((row) => allFlags.add(row.flag))
      }
    }

    return Array.from(allFlags)
  } catch (error) {
    console.error("Error al obtener flags del usuario:", error)
    return []
  }
}

export async function hasFlag(steamId, requiredFlag) {
  const flags = await getUserFlags(steamId)
  if (flags.includes("@web/root")) {
    return true
  }

  return flags.includes(requiredFlag)
}

export async function verifyAdminAccess(req, requiredFlag = null) {
  try {
    const { user } = await getApiSession(req)
    if (!user || !user.steamId) {
      return { authorized: false, error: "No autorizado", status: 401 }
    }

    const flags = await getUserFlags(user.steamId)
    if (flags.length === 0) {
      return { authorized: false, error: "Acceso denegado", status: 403 }
    }

    if (flags.includes("@web/root")) {
      return { authorized: true, flags }
    }

    if (requiredFlag && !flags.includes(requiredFlag)) {
      return { authorized: false, error: "Acceso denegado", status: 403 }
    }

    return { authorized: true, flags }
  } catch (error) {
    console.error("Error al verificar permisos:", error)
    return { authorized: false, error: "Error interno del servidor", status: 500 }
  }
}