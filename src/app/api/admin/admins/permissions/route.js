import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/database"
import { verifyAdminAccess } from "@/lib/api-auth"

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { authorized, error: authError, status: authStatus } = await verifyAdminAccess({ headers: { cookie: `session=${sessionToken.value}` } }, "@web/access")
    if (!authorized) {
      return NextResponse.json({ error: authError }, { status: authStatus })
    }

    const permissions = await db.query(`
      SELECT id, flag, description, is_custom, created_at
      FROM sp_permissions
      ORDER BY is_custom ASC, flag ASC
    `)

    return NextResponse.json({
      permissions: permissions.map(p => ({
        id: String(p.id),
        flag: p.flag,
        description: p.description,
        isCustom: p.is_custom === 1,
        createdAt: p.created_at
      }))
    })
  } catch (error) {
    console.error("Error fetching permissions:", error)
    return NextResponse.json({ error: "Error fetching permissions" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { authorized, error: authError, status: authStatus } = await verifyAdminAccess({ headers: { cookie: `session=${sessionToken.value}` } }, "@web/root")
    if (!authorized) {
      return NextResponse.json({ error: authError }, { status: authStatus })
    }

    const body = await request.json()
    const { flag, description } = body

    if (!flag || !description) {
      return NextResponse.json({ error: "Flag and description are required" }, { status: 400 })
    }

    if (!flag.startsWith('@')) {
      return NextResponse.json({ error: "The flag must start with @" }, { status: 400 })
    }

    const existing = await db.query(
      `SELECT id FROM sp_permissions WHERE flag = ?`,
      [flag]
    )

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "This flag already exists" }, { status: 400 })
    }

    await db.query(
      `INSERT INTO sp_permissions (flag, description, is_custom, created_at)
       VALUES (?, ?, 1, NOW())`,
      [flag, description]
    )

    return NextResponse.json({ 
      success: true, 
      message: "Permission created successfully" 
    })
  } catch (error) {
    console.error("Error creating permission:", error)
    return NextResponse.json({ error: "Error creating permission" }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { authorized, error: authError, status: authStatus } = await verifyAdminAccess({ headers: { cookie: `session=${sessionToken.value}` } }, "@web/root")
    if (!authorized) {
      return NextResponse.json({ error: authError }, { status: authStatus })
    }

    const { searchParams } = new URL(request.url)
    const flag = searchParams.get("flag")
    if (!flag) {
      return NextResponse.json({ error: "Flag is required" }, { status: 400 })
    }

    const permission = await db.query(
      `SELECT is_custom FROM sp_permissions WHERE flag = ?`,
      [flag]
    )

    if (!permission || permission.length === 0) {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 })
    }

    if (permission[0].is_custom === 0) {
      return NextResponse.json({ 
        error: "Cannot delete system permissions" 
      }, { status: 400 })
    }

    await db.query(`DELETE FROM sa_groups_flags WHERE flag = ?`, [flag])
    await db.query(`DELETE FROM sa_admins_flags WHERE flag = ?`, [flag])
    await db.query(`DELETE FROM sp_permissions WHERE flag = ?`, [flag])

    return NextResponse.json({ 
      success: true, 
      message: "Permission deleted successfully" 
    })
  } catch (error) {
    console.error("Error deleting permission:", error)
    return NextResponse.json({ error: "Error deleting permission" }, { status: 500 })
  }
}