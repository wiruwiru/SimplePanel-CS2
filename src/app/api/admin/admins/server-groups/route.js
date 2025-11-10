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

    const { authorized } = await verifyAdminAccess({ headers: { cookie: `session=${sessionToken.value}` } }, "@web/access")
    if (!authorized) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const groups = await db.query(`
      SELECT 
        sg.id,
        sg.name,
        sg.description,
        sg.color,
        COUNT(DISTINCT sgs.server_id) as server_count
      FROM sp_server_groups sg
      LEFT JOIN sp_server_group_servers sgs ON sg.id = sgs.server_group_id
      GROUP BY sg.id, sg.name, sg.description, sg.color
      ORDER BY sg.name ASC
    `)

    const groupsWithServers = await Promise.all(
      groups.map(async (group) => {
        const servers = await db.query(`
          SELECT s.id, s.hostname, s.address
          FROM sa_servers s
          INNER JOIN sp_server_group_servers sgs ON s.id = sgs.server_id
          WHERE sgs.server_group_id = ?
          ORDER BY s.id ASC
        `, [group.id])

        return {
          id: Number(group.id),
          name: group.name,
          description: group.description,
          color: group.color,
          serverCount: Number(group.server_count) || 0,
          servers: servers.map(s => ({
            id: Number(s.id),
            name: s.hostname,
            address: s.address
          }))
        }
      })
    )

    return NextResponse.json({ groups: groupsWithServers })
  } catch (error) {
    console.error("Error fetching server groups:", error)
    return NextResponse.json({ error: "Error al obtener grupos de servidores" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')
    if (!sessionToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { authorized } = await verifyAdminAccess({ headers: { cookie: `session=${sessionToken.value}` } }, "@web/root")
    if (!authorized) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, color, serverIds } = body
    if (!name) {
      return NextResponse.json({ error: "Nombre es requerido" }, { status: 400 })
    }

    const result = await db.query(
      `INSERT INTO sp_server_groups (name, description, color, created_at)
       VALUES (?, ?, ?, NOW())`,
      [name, description || '', color || '#6B7280']
    )

    const groupId = Number(result.insertId)

    if (serverIds && serverIds.length > 0) {
      for (const serverId of serverIds) {
        await db.query(
          `INSERT INTO sp_server_group_servers (server_group_id, server_id)
           VALUES (?, ?)`,
          [groupId, serverId]
        )
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Grupo de servidores creado correctamente",
      groupId 
    })
  } catch (error) {
    console.error("Error creating server group:", error)
    return NextResponse.json({ error: "Error al crear grupo de servidores" }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')
    if (!sessionToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { authorized } = await verifyAdminAccess({ headers: { cookie: `session=${sessionToken.value}` } }, "@web/root")
    if (!authorized) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const body = await request.json()
    const { groupId, name, description, color, serverIds } = body
    if (!groupId) {
      return NextResponse.json({ error: "ID de grupo es requerido" }, { status: 400 })
    }

    await db.query(
      `UPDATE sp_server_groups 
       SET name = ?, description = ?, color = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, description || '', color || '#6B7280', groupId]
    )

    if (serverIds !== undefined) {
      await db.query(
        `DELETE FROM sp_server_group_servers WHERE server_group_id = ?`,
        [groupId]
      )

      if (serverIds.length > 0) {
        for (const serverId of serverIds) {
          await db.query(
            `INSERT INTO sp_server_group_servers (server_group_id, server_id)
             VALUES (?, ?)`,
            [groupId, serverId]
          )
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Grupo de servidores actualizado correctamente" 
    })
  } catch (error) {
    console.error("Error updating server group:", error)
    return NextResponse.json({ error: "Error al actualizar grupo de servidores" }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')
    if (!sessionToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { authorized } = await verifyAdminAccess({ headers: { cookie: `session=${sessionToken.value}` } }, "@web/root")
    if (!authorized) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get("groupId")
    if (!groupId) {
      return NextResponse.json({ error: "ID de grupo es requerido" }, { status: 400 })
    }

    await db.query(`DELETE FROM sp_server_groups WHERE id = ?`, [groupId])

    return NextResponse.json({ 
      success: true, 
      message: "Grupo de servidores eliminado correctamente" 
    })
  } catch (error) {
    console.error("Error deleting server group:", error)
    return NextResponse.json({ error: "Error al eliminar grupo de servidores" }, { status: 500 })
  }
}