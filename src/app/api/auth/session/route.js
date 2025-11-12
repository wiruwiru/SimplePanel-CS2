import { parse } from "cookie"
import { getUserFlags } from "@/lib/api-auth"
import { NextResponse } from "next/server"
import { getPlayerSummaries } from "@/utils/steam-api"
import { parseSession } from "@/utils/session"

export async function GET(req) {
  const cookies = parse(req.headers.get("cookie") || "")
  const sessionToken = cookies.session

  if (!sessionToken) {
    return NextResponse.json({ user: null, isAdmin: false, flags: [] })
  }

  try {
    const user = parseSession(sessionToken)
    
    if (!user) {
      return NextResponse.json(
        { error: "Error parsing session", user: null, isAdmin: false, flags: [] },
        { status: 400 },
      )
    }

    let profile = null
    if (user.steamId) {
      try {
        const profiles = await getPlayerSummaries([user.steamId])
        const playerProfile = profiles[user.steamId]
        if (playerProfile) {
          profile = {
            displayName: playerProfile.displayName || "Usuario",
            avatarUrl: playerProfile.avatarUrl || "",
          }
        }
      } catch (error) {
        console.error("Error fetching Steam profile:", error)
      }
    }

    let flags = []
    let isAdmin = false

    if (user.steamId) {
      try {
        flags = await getUserFlags(user.steamId)
        isAdmin = flags.length > 0
      } catch (error) {
        console.error("Error verificando flags de administrador:", error)
        return NextResponse.json(
          { error: "Error verificando permisos", message: error.message, user: null, isAdmin: false, flags: [] },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      user: {
        steamId: user.steamId,
        displayName: profile?.displayName || "Usuario",
        avatarUrl: profile?.avatarUrl || "",
      },
      isAdmin,
      flags,
    })
  } catch (error) {
    console.error("Error parsing session:", error)
    return NextResponse.json(
      { error: "Error parsing session", message: error.message, user: null, isAdmin: false, flags: [] },
      { status: 400 },
    )
  }
}