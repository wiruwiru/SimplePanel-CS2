import { NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET() {
  try {
    const dbServers = await db.query(`
      SELECT 
        s.id, 
        s.hostname, 
        s.address 
      FROM sa_servers s
      LEFT JOIN sp_visibility_settings v ON s.id = v.server_id
      WHERE COALESCE(v.is_visible, 1) = 1
      ORDER BY s.id ASC
    `)
    
    if (!dbServers || dbServers.length === 0) {
      return NextResponse.json([])
    }

    const steamApiKey = process.env.STEAM_API_KEY
    const steamApiUrl = `https://api.steampowered.com/IGameServersService/GetServerList/v1/?key=${steamApiKey}&limit=9999&filter=\\gamedir\\csgo`

    let steamServers = []
    try {
      const steamResponse = await fetch(steamApiUrl)
      const steamData = await steamResponse.json()
      if (steamData.response && steamData.response.servers) {
        steamServers = steamData.response.servers
      }
    } catch (error) {
      console.error("Error fetching from Steam API:", error)
    }

    const serversWithInfo = dbServers.map((dbServer) => {
      const steamServer = steamServers.find((s) => s.addr === dbServer.address)
      
      if (steamServer) {
        return {
          id: dbServer.id,
          name: steamServer.name || dbServer.hostname,
          address: dbServer.address,
          map: steamServer.map || "unknown",
          players: steamServer.players || 0,
          maxPlayers: steamServer.max_players || 0,
          status: "online",
        }
      }

      return {
        id: dbServer.id,
        name: dbServer.hostname,
        address: dbServer.address,
        map: "unknown",
        players: 0,
        maxPlayers: 0,
        status: "offline",
      }
    })

    return NextResponse.json(serversWithInfo)
  } catch (error) {
    console.error("Error fetching servers:", error)
    return NextResponse.json(
      { error: "Failed to fetch servers" },
      { status: 500 }
    )
  }
}