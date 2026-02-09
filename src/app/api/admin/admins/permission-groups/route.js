import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/database"
import { verifyAdminAccess } from "@/lib/api-auth"
import { syncGroupFlagsToAdmins } from "@/lib/admin-sync"

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { authorized } = await verifyAdminAccess({ headers: { cookie: `session=${sessionToken.value}` } }, "@web/access")
    if (!authorized) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const groups = await db.query(`
      SELECT 
        g.id,
        g.name,
        g.immunity,
        GROUP_CONCAT(DISTINCT gf.flag) as flags,
        COUNT(DISTINCT sa.player_steamid) as member_count
      FROM sa_groups g
      LEFT JOIN sa_groups_flags gf ON g.id = gf.group_id
      LEFT JOIN sa_admins sa ON g.id = sa.group_id
      GROUP BY g.id, g.name, g.immunity
      ORDER BY g.immunity DESC
    `)

    return NextResponse.json({
      groups: groups.map(g => ({
        id: Number(g.id),
        name: g.name,
        immunity: g.immunity,
        flags: g.flags ? g.flags.split(',') : [],
        memberCount: Number(g.member_count) || 0
      }))
    })
  } catch (error) {
    console.error("Error fetching permission groups:", error)
    return NextResponse.json({ error: "Error fetching permission groups" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { authorized } = await verifyAdminAccess({ headers: { cookie: `session=${sessionToken.value}` } }, "@web/group.create")    
    if (!authorized) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const { name, immunity, flags } = body
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const result = await db.query(
      `INSERT INTO sa_groups (name, immunity) VALUES (?, ?)`,
      [name, immunity || 0]
    )

    const groupId = Number(result.insertId)
    if (flags && flags.length > 0) {
      for (const flag of flags) {
        await db.query(
          `INSERT INTO sa_groups_flags (group_id, flag) VALUES (?, ?)`,
          [groupId, flag]
        )
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Group created successfully",
      groupId 
    })
  } catch (error) {
    console.error("Error creating permission group:", error)
    return NextResponse.json({ error: "Error creating group" }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { authorized } = await verifyAdminAccess({ headers: { cookie: `session=${sessionToken.value}` } }, "@web/group.edit")
    if (!authorized) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const { groupId, name, immunity, flags } = body
    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 })
    }

    const oldGroupData = await db.query(
      `SELECT immunity FROM sa_groups WHERE id = ?`,
      [groupId]
    )
    const oldGroupImmunity = oldGroupData[0]?.immunity || 0

    if (name || immunity !== undefined) {
      await db.query(
        `UPDATE sa_groups SET name = ?, immunity = ? WHERE id = ?`,
        [name, immunity || 0, groupId]
      )

      if (immunity !== undefined && Number(immunity) !== Number(oldGroupImmunity)) {
        const oldGroupFlagsResult = await db.query(
          `SELECT flag FROM sa_groups_flags WHERE group_id = ?`,
          [groupId]
        )
        const oldGroupFlags = oldGroupFlagsResult.map(gf => gf.flag)
        await syncGroupFlagsToAdmins(groupId, oldGroupFlags, oldGroupImmunity)
      }
    }

    if (flags !== undefined) {
      const oldGroupFlagsResult = await db.query(
        `SELECT flag FROM sa_groups_flags WHERE group_id = ?`,
        [groupId]
      )
      const oldGroupFlags = oldGroupFlagsResult.map(gf => gf.flag)

      await db.query(`DELETE FROM sa_groups_flags WHERE group_id = ?`, [groupId])
      if (flags.length > 0) {
        for (const flag of flags) {
          await db.query(
            `INSERT INTO sa_groups_flags (group_id, flag) VALUES (?, ?)`,
            [groupId, flag]
          )
        }
      }

      await syncGroupFlagsToAdmins(groupId, oldGroupFlags, oldGroupImmunity)
    }

    return NextResponse.json({ 
      success: true, 
      message: "Group updated successfully" 
    })
  } catch (error) {
    console.error("Error updating permission group:", error)
    return NextResponse.json({ error: "Error updating group" }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { authorized } = await verifyAdminAccess({ headers: { cookie: `session=${sessionToken.value}` } }, "@web/group.delete")
    if (!authorized) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get("groupId")
    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 })
    }

    const adminsInGroup = await db.query(
      `SELECT COUNT(*) as count FROM sa_admins WHERE group_id = ?`,
      [groupId]
    )

    if (Number(adminsInGroup[0].count) > 0) {
      return NextResponse.json({ 
        error: "Cannot delete a group with assigned administrators" 
      }, { status: 400 })
    }

    await db.query(`DELETE FROM sa_groups WHERE id = ?`, [groupId])

    return NextResponse.json({ 
      success: true, 
      message: "Group deleted successfully" 
    })
  } catch (error) {
    console.error("Error deleting permission group:", error)
    return NextResponse.json({ error: "Error deleting permission group" }, { status: 500 })
  }
}