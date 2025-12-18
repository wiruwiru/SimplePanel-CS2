import { RCON } from "@fabricio-191/valve-server-query"
import { db } from "@/lib/database"

export async function getAllServers() {
  try {
    const servers = await db.query(`
      SELECT id, hostname, address, rcon_password as rcon
      FROM sa_servers
      WHERE rcon_password IS NOT NULL AND rcon_password != ''
    `)
    return servers || []
  } catch (error) {
    try {
      const servers = await db.query(`
        SELECT id, hostname, address
        FROM sa_servers
      `)
      return (servers || []).map(server => ({ ...server, rcon: null }))
    } catch (fallbackError) {
      console.error("Error obteniendo servidores:", fallbackError)
      return []
    }
  }
}

export async function getPlayersFromServer(serverAddress, rconPassword) {
  let rcon = null
  try {
    const [host, portStr] = serverAddress.split(":")
    const port = parseInt(portStr)
    
    if (!host || !port) {
      throw new Error("Dirección de servidor inválida")
    }

    rcon = await RCON({
      ip: host,
      port: port,
      password: rconPassword
    })

    const response = await rcon.exec("css_players")
    rcon.destroy()
    
    if (!response || typeof response !== 'string') {
      return []
    }

    const players = []
    const lines = response.split('\n')
    let inPlayerList = false
    
    for (const line of lines) {
      if (line.includes('PLAYER LIST')) {
        inPlayerList = true
        continue
      }
      if (line.includes('END PLAYER LIST')) {
        break
      }
      if (!inPlayerList) continue

      const match = line.match(/\[#(\d+)\]\s+"([^"]+)"\s+\(IP Address:\s+"([^"]+)"\s+SteamID64:\s+"(\d+)"\)/)
      if (match) {
        players.push({
          userId: parseInt(match[1]),
          name: match[2],
          ip: match[3],
          steamId64: match[4]
        })
      }
    }

    return players
  } catch (error) {
    console.error(`Error obteniendo jugadores del servidor ${serverAddress}:`, error.message)
    if (rcon) {
      try {
        rcon.destroy()
      } catch (e) {}
    }
    return []
  }
}

export async function kickPlayerFromServer(serverAddress, rconPassword, userId, reason = "Sanción aplicada") {
  let rcon = null
  try {
    const [host, portStr] = serverAddress.split(":")
    const port = parseInt(portStr)
    
    if (!host || !port) {
      throw new Error("Dirección de servidor inválida")
    }

    rcon = await RCON({
      ip: host,
      port: port,
      password: rconPassword
    })

    const command = `css_kick #${userId} "${reason}"`
    const response = await rcon.exec(command)
    rcon.destroy()
    
    return { success: true, response }
  } catch (error) {
    console.error(`Error expulsando jugador del servidor ${serverAddress}:`, error.message)
    if (rcon) {
      try {
        rcon.destroy()
      } catch (e) {}
    }
    return { success: false, error: error.message }
  }
}

export async function findAndKickPlayer(steamId64, reason = "Sanción aplicada") {
  const servers = await getAllServers()
  const results = []

  for (const server of servers) {
    if (!server.rcon) {
      continue
    }
    
    try {
      const players = await getPlayersFromServer(server.address, server.rcon)
      const player = players.find(p => p.steamId64 === steamId64)
      
      if (player) {
        const kickResult = await kickPlayerFromServer(
          server.address,
          server.rcon,
          player.userId,
          reason
        )
        
        results.push({
          serverId: server.id,
          serverAddress: server.address,
          player: player,
          kicked: kickResult.success,
          error: kickResult.error
        })
      }
    } catch (error) {
      console.error(`Error procesando servidor ${server.address}:`, error.message)
      results.push({
        serverId: server.id,
        serverAddress: server.address,
        kicked: false,
        error: error.message
      })
    }
  }

  return results
}

// NOTE: no longer necessary (for the time being)
// export async function reloadBansOnAllServers() {
//   const servers = await getAllServers()
//   const results = []

//   for (const server of servers) {
//     if (!server.rcon) {
//       continue
//     }
    
//     let rcon = null
//     try {
//       const [host, portStr] = server.address.split(":")
//       const port = parseInt(portStr)
      
//       if (!host || !port) {
//         throw new Error("Dirección de servidor inválida")
//       }

//       rcon = await RCON({
//         ip: host,
//         port: port,
//         password: server.rcon
//       })

//       const response = await rcon.exec("css_reloadbans")
//       rcon.destroy()
      
//       results.push({
//         serverId: server.id,
//         serverAddress: server.address,
//         success: true,
//         response: response
//       })
//     } catch (error) {
//       console.error(`Error recargando bans en servidor ${server.address}:`, error.message)
//       if (rcon) {
//         try {
//           rcon.destroy()
//         } catch (e) {}
//       }
//       results.push({
//         serverId: server.id,
//         serverAddress: server.address,
//         success: false,
//         error: error.message
//       })
//     }
//   }

//   return results
// }