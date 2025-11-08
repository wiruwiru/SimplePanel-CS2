import { parse } from "cookie"
import { getUserFlags } from "@/lib/api-auth"
import { NextResponse } from "next/server"

export async function GET(req) {
  const cookies = parse(req.headers.get("cookie") || "")
  const sessionToken = cookies.session

  if (sessionToken) {
    try {
      const user = JSON.parse(Buffer.from(sessionToken, "base64").toString())

      let profile = null
      if (user.steamId && process.env.STEAM_API_KEY) {
        try {
          const steamApiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${user.steamId}`
          const steamApiResponse = await fetch(steamApiUrl)
          const steamData = await steamApiResponse.json()

          if (steamData.response?.players?.[0]) {
            const player = steamData.response.players[0]
            profile = {
              displayName: player.personaname || "Usuario",
              avatarUrl: player.avatarfull || player.avatarmedium || "",
            }
          }
        } catch (error) {
          console.error("Error fetching Steam profile:", error)
        }
      }

      let flags = []
      let isAdmin = false

      if (user && user.steamId) {
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
  } else {
    return NextResponse.json({ user: null, isAdmin: false, flags: [] })
  }
}