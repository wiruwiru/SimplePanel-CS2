import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/database"
import { verifyAdminAccess } from "@/lib/api-auth"

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')
    if (!sessionToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { authorized, error: authError, status: authStatus } = await verifyAdminAccess({ headers: { cookie: `session=${sessionToken.value}` } }, "@web/root")
    if (!authorized) {
      return NextResponse.json({ error: authError }, { status: authStatus })
    }

    const admins = await db.query(`
      SELECT 
        sa.id,
        sa.player_name,
        sa.player_steamid,
        sa.immunity,
        sa.server_id,
        sa.ends,
        sa.group_id,
        sg.name as group_name,
        GROUP_CONCAT(DISTINCT saf.flag) as flags,
        s.hostname as server_name
      FROM sa_admins sa
      LEFT JOIN sa_groups sg ON sa.group_id = sg.id
      LEFT JOIN sa_admins_flags saf ON sa.id = saf.admin_id
      LEFT JOIN sa_servers s ON sa.server_id = s.id
      WHERE sa.player_steamid != 0
      GROUP BY sa.id, sa.player_name, sa.player_steamid, sa.immunity, sa.server_id, sa.ends, sa.group_id, sg.name, s.hostname
      ORDER BY sa.immunity DESC, sa.player_name ASC
    `)

    const adminMap = new Map()    
    admins.forEach(admin => {
      const steamId = String(admin.player_steamid)
      
      if (!adminMap.has(steamId)) {
        adminMap.set(steamId, {
          id: Number(admin.id),
          name: admin.player_name,
          steamId: steamId,
          immunity: admin.immunity,
          group: admin.group_name || 'Sin grupo',
          groupId: admin.group_id ? Number(admin.group_id) : null,
          flags: admin.flags ? admin.flags.split(',') : [],
          servers: [],
          expires: admin.ends
        })
      }
      
      const adminData = adminMap.get(steamId)
      if (admin.server_id) {
        adminData.servers.push({
          id: Number(admin.server_id),
          name: admin.server_name
        })
      }
    })

    return NextResponse.json({
      admins: Array.from(adminMap.values())
    })
  } catch (error) {
    console.error("Error fetching admins:", error)
    return NextResponse.json({ error: "Error al obtener administradores" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')
    if (!sessionToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { authorized, error: authError, status: authStatus } = await verifyAdminAccess({ headers: { cookie: `session=${sessionToken.value}` } }, "@web/admin.create")
    if (!authorized) {
      return NextResponse.json({ error: authError }, { status: authStatus })
    }

    const body = await request.json()
    const { steamId, name, groupId, serverGroupId, flags, immunity, expires } = body
    if (!steamId || !name) {
      return NextResponse.json({ error: "SteamID y nombre son requeridos" }, { status: 400 })
    }

    const existing = await db.query(
      `SELECT id FROM sa_admins WHERE player_steamid = ? LIMIT 1`,
      [steamId]
    )

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "Este usuario ya es administrador" }, { status: 400 })
    }

    let servers = []
    if (serverGroupId === 'all') {
      const allServers = await db.query(`SELECT id FROM sa_servers`)
      servers = allServers.map(s => Number(s.id))
    } else {
      const groupServers = await db.query(
        `SELECT server_id FROM sp_server_group_servers WHERE server_group_id = ?`,
        [serverGroupId]
      )
      servers = groupServers.map(s => Number(s.server_id))
    }

    for (const serverId of servers) {
      const result = await db.query(
        `INSERT INTO sa_admins (player_name, player_steamid, immunity, server_id, ends, group_id, created)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [name, steamId, immunity || 0, serverId, expires || null, groupId || null]
      )

      const adminId = Number(result.insertId)

      if (flags && flags.length > 0) {
        for (const flag of flags) {
          await db.query(
            `INSERT INTO sa_admins_flags (admin_id, flag) VALUES (?, ?)`,
            [adminId, flag]
          )
        }
      }

      if (groupId) {
        const groupFlags = await db.query(
          `SELECT flag FROM sa_groups_flags WHERE group_id = ?`,
          [groupId]
        )
        
        for (const gf of groupFlags) {
          await db.query(
            `INSERT IGNORE INTO sa_admins_flags (admin_id, flag) VALUES (?, ?)`,
            [adminId, gf.flag]
          )
        }
      }
    }

    return NextResponse.json({ success: true, message: "Administrador creado correctamente" })
  } catch (error) {
    console.error("Error creating admin:", error)
    return NextResponse.json({ error: "Error al crear administrador" }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')
    if (!sessionToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { authorized, error: authError, status: authStatus } = await verifyAdminAccess({ headers: { cookie: `session=${sessionToken.value}` } }, "@web/admin.edit")
    if (!authorized) {
      return NextResponse.json({ error: authError }, { status: authStatus })
    }

    const body = await request.json()
    const { steamId, name, groupId, serverGroupId, flags, immunity, expires } = body
    if (!steamId) {
      return NextResponse.json({ error: "SteamID es requerido" }, { status: 400 })
    }

    await db.query(`DELETE FROM sa_admins WHERE player_steamid = ?`, [steamId])

    let servers = []
    if (serverGroupId === 'all') {
      const allServers = await db.query(`SELECT id FROM sa_servers`)
      servers = allServers.map(s => Number(s.id))
    } else {
      const groupServers = await db.query(
        `SELECT server_id FROM sp_server_group_servers WHERE server_group_id = ?`,
        [serverGroupId]
      )
      servers = groupServers.map(s => Number(s.server_id))
    }

    for (const serverId of servers) {
      const result = await db.query(
        `INSERT INTO sa_admins (player_name, player_steamid, immunity, server_id, ends, group_id, created)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [name, steamId, immunity || 0, serverId, expires || null, groupId || null]
      )

      const adminId = Number(result.insertId)

      if (flags && flags.length > 0) {
        for (const flag of flags) {
          await db.query(
            `INSERT INTO sa_admins_flags (admin_id, flag) VALUES (?, ?)`,
            [adminId, flag]
          )
        }
      }

      if (groupId) {
        const groupFlags = await db.query(
          `SELECT flag FROM sa_groups_flags WHERE group_id = ?`,
          [groupId]
        )
        
        for (const gf of groupFlags) {
          await db.query(
            `INSERT IGNORE INTO sa_admins_flags (admin_id, flag) VALUES (?, ?)`,
            [adminId, gf.flag]
          )
        }
      }
    }

    return NextResponse.json({ success: true, message: "Administrador actualizado correctamente" })
  } catch (error) {
    console.error("Error updating admin:", error)
    return NextResponse.json({ error: "Error al actualizar administrador" }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')
    if (!sessionToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { authorized, error: authError, status: authStatus } = await verifyAdminAccess({ headers: { cookie: `session=${sessionToken.value}` } }, "@web/admin.delete")
    if (!authorized) {
      return NextResponse.json({ error: authError }, { status: authStatus })
    }

    const { searchParams } = new URL(request.url)
    const steamId = searchParams.get("steamId")
    if (!steamId) {
      return NextResponse.json({ error: "SteamID es requerido" }, { status: 400 })
    }

    await db.query(`DELETE FROM sa_admins WHERE player_steamid = ?`, [steamId])

    return NextResponse.json({ success: true, message: "Administrador eliminado correctamente" })
  } catch (error) {
    console.error("Error deleting admin:", error)
    return NextResponse.json({ error: "Error al eliminar administrador" }, { status: 500 })
  }
}