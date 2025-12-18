import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/database"
import { verifyAdminAccess, getUserFlags } from "@/lib/api-auth"
import { hasPermission } from "@/utils/permissions"
import { sendDiscordWebhook } from "@/services/notifications/discord"
import { getAuthenticatedUser, convertBigIntToString } from "@/utils/api-helpers"

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const { user, error: userError, status: userStatus } = getAuthenticatedUser(cookieStore)
    
    if (userError) {
      return NextResponse.json({ error: userError }, { status: userStatus })
    }

    const { authorized, error: authError, status: authStatus } = await verifyAdminAccess(
      { headers: { cookie: `session=${cookieStore.get('session').value}` } },
      "@web/ban.view"
    )
    if (!authorized) {
      return NextResponse.json(
        { error: authError },
        { status: authStatus }
      )
    }

    const { searchParams } = new URL(request.url)
    const banId = searchParams.get("banId")

    if (!banId) {
      return NextResponse.json(
        { error: "Ban ID is required" },
        { status: 400 }
      )
    }

    const comments = await db.query(
      `SELECT 
        c.id,
        c.ban_id,
        c.admin_steamid,
        c.admin_name,
        c.comment,
        DATE_FORMAT(c.created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
        DATE_FORMAT(c.updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
      FROM sp_ban_comments c
      WHERE c.ban_id = ?
      ORDER BY c.created_at ASC`,
      [banId]
    )

    const formattedComments = (comments || []).map(comment => ({
      ...comment,
      created_at: comment.created_at ? String(comment.created_at) : null,
      updated_at: comment.updated_at ? String(comment.updated_at) : null
    }))

    return NextResponse.json(convertBigIntToString({
      comments: formattedComments
    }))
  } catch (error) {
    console.error("Error fetching ban comments:", error)
    return NextResponse.json(
      { error: "Error fetching comments" },
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

    const flags = await getUserFlags(user.steamId)
    if (!hasPermission(flags, "@web/ban.comment.add")) {
      return NextResponse.json(
        { error: "Access denied - @web/ban.comment.add required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { banId, comment } = body

    if (!banId) {
      return NextResponse.json(
        { error: "Ban ID is required" },
        { status: 400 }
      )
    }

    if (!comment || !comment.trim()) {
      return NextResponse.json(
        { error: "Comment is required" },
        { status: 400 }
      )
    }

    const ban = await db.query(
      `SELECT id, player_name, player_steamid, admin_steamid FROM sa_bans WHERE id = ?`,
      [banId]
    )

    if (!ban || ban.length === 0) {
      return NextResponse.json(
        { error: "Ban not found" },
        { status: 404 }
      )
    }

    const adminQuery = await db.query(
      `SELECT player_name FROM sa_admins WHERE player_steamid = ? LIMIT 1`,
      [user.steamId]
    )
    const adminName = adminQuery && adminQuery.length > 0 ? adminQuery[0].player_name : "Admin Web"

    const result = await db.query(
      `INSERT INTO sp_ban_comments (ban_id, admin_steamid, admin_name, comment)
       VALUES (?, ?, ?, ?)`,
      [banId, user.steamId, adminName, comment.trim()]
    )

    const commentId = Number(result.insertId)

    try {
      const banData = {
        id: banId,
        playerName: ban[0].player_name,
        playerSteamId: ban[0].player_steamid
      }

      const adminData = {
        name: adminName,
        steamId: user.steamId
      }

      await sendDiscordWebhook('create', 'ban_comment', {
        ...banData,
        commentId: commentId,
        comment: comment.trim()
      }, adminData)
    } catch (webhookError) {
      console.error("Error sending webhook (comment created anyway):", webhookError)
    }

    return NextResponse.json({
      success: true,
      message: "Comment added successfully",
      commentId: commentId
    })
  } catch (error) {
    console.error("Error creating ban comment:", error)
    return NextResponse.json(
      { error: "Error creating comment" },
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
    const { id, comment } = body

    if (!id) {
      return NextResponse.json(
        { error: "Comment ID is required" },
        { status: 400 }
      )
    }

    if (!comment || !comment.trim()) {
      return NextResponse.json(
        { error: "Comment is required" },
        { status: 400 }
      )
    }

    const existingComment = await db.query(
      `SELECT admin_steamid, ban_id FROM sp_ban_comments WHERE id = ?`,
      [id]
    )

    if (!existingComment || existingComment.length === 0) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      )
    }

    if (String(existingComment[0].admin_steamid) !== String(user.steamId)) {
      return NextResponse.json(
        { error: "You can only edit your own comments" },
        { status: 403 }
      )
    }

    await db.query(
      `UPDATE sp_ban_comments SET comment = ?, updated_at = NOW() WHERE id = ?`,
      [comment.trim(), id]
    )

    const ban = await db.query(
      `SELECT id, player_name, player_steamid FROM sa_bans WHERE id = ?`,
      [existingComment[0].ban_id]
    )

    const adminQuery = await db.query(
      `SELECT player_name FROM sa_admins WHERE player_steamid = ? LIMIT 1`,
      [user.steamId]
    )
    const adminName = adminQuery && adminQuery.length > 0 ? adminQuery[0].player_name : "Admin Web"

    try {
      const banData = {
        id: existingComment[0].ban_id,
        playerName: ban[0]?.player_name || "Unknown",
        playerSteamId: ban[0]?.player_steamid || "Unknown"
      }

      const adminData = {
        name: adminName,
        steamId: user.steamId
      }

      await sendDiscordWebhook('update', 'ban_comment', {
        ...banData,
        commentId: id,
        comment: comment.trim()
      }, adminData)
    } catch (webhookError) {
      console.error("Error sending webhook (comment updated anyway):", webhookError)
    }

    return NextResponse.json({
      success: true,
      message: "Comment updated successfully"
    })
  } catch (error) {
    console.error("Error updating ban comment:", error)
    return NextResponse.json(
      { error: "Error updating comment" },
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
        { error: "Comment ID is required" },
        { status: 400 }
      )
    }

    const existingComment = await db.query(
      `SELECT admin_steamid, ban_id, comment FROM sp_ban_comments WHERE id = ?`,
      [id]
    )

    if (!existingComment || existingComment.length === 0) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      )
    }

    const flags = await getUserFlags(user.steamId)
    const commentAdminSteamId = String(existingComment[0].admin_steamid)
    const currentUserSteamId = String(user.steamId)

    const canDelete = hasPermission(
      flags,
      "@web/ban.comment.delete",
      true,
      commentAdminSteamId,
      currentUserSteamId
    )

    if (!canDelete) {
      return NextResponse.json(
        { error: "Access denied - You don't have permission to delete this comment" },
        { status: 403 }
      )
    }

    const ban = await db.query(
      `SELECT id, player_name, player_steamid FROM sa_bans WHERE id = ?`,
      [existingComment[0].ban_id]
    )

    const adminQuery = await db.query(
      `SELECT player_name FROM sa_admins WHERE player_steamid = ? LIMIT 1`,
      [user.steamId]
    )
    const adminName = adminQuery && adminQuery.length > 0 ? adminQuery[0].player_name : "Admin Web"

    try {
      const banData = {
        id: existingComment[0].ban_id,
        playerName: ban[0]?.player_name || "Unknown",
        playerSteamId: ban[0]?.player_steamid || "Unknown"
      }

      const adminData = {
        name: adminName,
        steamId: user.steamId
      }

      await sendDiscordWebhook('delete', 'ban_comment', {
        ...banData,
        commentId: id,
        comment: existingComment[0].comment
      }, adminData)
    } catch (webhookError) {
      console.error("Error sending webhook (comment deleted anyway):", webhookError)
    }

    await db.query(`DELETE FROM sp_ban_comments WHERE id = ?`, [id])

    return NextResponse.json({
      success: true,
      message: "Comment deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting ban comment:", error)
    return NextResponse.json(
      { error: "Error deleting comment" },
      { status: 500 }
    )
  }
}