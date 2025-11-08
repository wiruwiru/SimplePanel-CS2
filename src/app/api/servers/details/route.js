import { NextResponse } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { searchParams } = new URL(request.url)

  const address = searchParams.get("address")
  if (!address) {
    return NextResponse.json(
      { error: "Address parameter is required" },
      { status: 400 }
    )
  }

  try {
    const steamApiKey = process.env.STEAM_API_KEY
    if (!steamApiKey) {
      throw new Error("Steam API key not configured")
    }

    const steamApiUrl = `https://api.steampowered.com/IGameServersService/GetServerList/v1/?key=${steamApiKey}&limit=9999&filter=\\gamedir\\csgo`
    const steamResponse = await fetch(steamApiUrl, {
      next: { revalidate: 0 }
    })

    if (!steamResponse.ok) {
      throw new Error(`Steam API returned status ${steamResponse.status}`)
    }

    const steamData = await steamResponse.json()
    if (!steamData.response || !steamData.response.servers) {
      return NextResponse.json(
        {
          error: "No server data available from Steam",
          offline: true,
        },
        { status: 200 }
      )
    }

    const steamServer = steamData.response.servers.find(s => s.addr === address)
    if (!steamServer) {
      return NextResponse.json(
        {
          error: "Server not found or offline",
          message: "The server is not responding or is offline",
          offline: true,
        },
        { status: 200 }
      )
    }

    let players = []
    try {
      const [host, portStr] = address.split(":")
      const port = parseInt(portStr)
      
      if (host && port) {
        const { Server } = await import("@fabricio-191/valve-server-query")
        const serverInstance = await Server({
          ip: host,
          port: port,
          timeout: 5000,
        })
        
        const playerData = await serverInstance.getPlayers()
        
        players = playerData.map((player) => {
          let timeInSeconds = 0
          if (player.timeOnline && typeof player.timeOnline === 'object') {
            const hours = player.timeOnline.hours || 0
            const minutes = player.timeOnline.minutes || 0
            const seconds = player.timeOnline.seconds || 0
            timeInSeconds = (hours * 3600) + (minutes * 60) + seconds
          } else if (typeof player.timeOnline === 'number') {
            timeInSeconds = player.timeOnline
          }

          return {
            name: player.name || "Unknown",
            score: player.score || 0,
            time: timeInSeconds,
          }
        })
      }
    } catch (playerError) {
      console.error("Could not fetch detailed player data:", playerError.message)
    }

    const serverInfo = {
      name: steamServer.name || "Unknown Server",
      map: steamServer.map || "unknown",
      maxPlayers: steamServer.max_players || 0,
      numPlayers: steamServer.players || 0,
      players: players,
      address: steamServer.addr,
      gameType: steamServer.gametype || "",
    }

    return NextResponse.json(serverInfo)
  } catch (error) {
    console.error("Error querying server:", error)
    return NextResponse.json(
      {
        error: "Failed to query server",
        message: error.message,
        offline: true,
      },
      { status: 200 }
    )
  }
}