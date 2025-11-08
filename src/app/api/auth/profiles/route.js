import { NextResponse } from "next/server"

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const ids = searchParams.get("ids")

  if (!ids) {
    return NextResponse.json({ message: "Steam IDs are required" }, { status: 400 })
  }

  try {
    const steamApiKey = process.env.STEAM_API_KEY
    const response = await fetch(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=${ids}`)
    if (!response.ok) {
      throw new Error("Steam API request failed")
    }

    const data = await response.json()
    const profiles = {}

    if (data.response && data.response.players) {
      data.response.players.forEach((player) => {
        profiles[player.steamid] = {
          displayName: player.personaname,
          avatarUrl: player.avatarfull,
        }
      })
    }

    return NextResponse.json(profiles)
  } catch (error) {
    console.error("Error fetching Steam profiles:", error)
    return NextResponse.json({ message: "Failed to fetch Steam profiles" }, { status: 500 })
  }
}