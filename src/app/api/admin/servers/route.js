import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/database"
import { getUserFlags, getUserFromCookies } from "@/lib/api-auth"

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await getUserFromCookies(cookieStore)
    if (!user || !user.steamId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const flags = await getUserFlags(user.steamId)
    if (!flags.includes('@web/root')) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    const servers = await db.query(`
      SELECT 
        s.id,
        s.hostname as name,
        s.address,
        COALESCE(v.is_visible, 1) as visible
      FROM sa_servers s
      LEFT JOIN sp_visibility_settings v ON s.id = v.server_id
      ORDER BY s.id ASC
    `)

    return NextResponse.json(servers)
  } catch (error) {
    console.error("Error fetching admin servers:", error)
    return NextResponse.json(
      { error: "Error fetching servers" },
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
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await getUserFromCookies(cookieStore)
    if (!user || !user.steamId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const flags = await getUserFlags(user.steamId)
    if (!flags.includes('@web/root')) {
      return NextResponse.json(
        { error: "Access denied - Requires @web/root" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { serverId, name, ip, rconPassword, visible } = body
    if (!serverId) {
      return NextResponse.json(
        { error: "Server ID is required" },
        { status: 400 }
      )
    }

    if (name || ip || rconPassword) {
      const updates = []
      const values = []
      
      if (name) {
        updates.push('hostname = ?')
        values.push(name)
      }
      if (ip) {
        updates.push('address = ?')
        values.push(ip)
      }
      if (rconPassword) {
        updates.push('rcon_password = ?')
        values.push(rconPassword)
      }
      
      if (updates.length > 0) {
        values.push(serverId)
        await db.query(
          `UPDATE sa_servers SET ${updates.join(', ')} WHERE id = ?`,
          values
        )
      }
    }

    if (visible !== undefined) {
      const isVisible = visible ? 1 : 0

      const existing = await db.query(
        'SELECT id FROM sp_visibility_settings WHERE server_id = ?',
        [serverId]
      )

      if (existing && existing.length > 0) {
        await db.query(
          'UPDATE sp_visibility_settings SET is_visible = ? WHERE server_id = ?',
          [isVisible, serverId]
        )
      } else {
        await db.query(
          'INSERT INTO sp_visibility_settings (server_id, is_visible) VALUES (?, ?)',
          [serverId, isVisible]
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating server:", error)
    return NextResponse.json(
      { error: "Error updating server" },
      { status: 500 }
    )
  }
}