import { getServerInfoAndPlayers, getServerInfo } from "@/utils/server-query"

/**
 * @param {string} address - Server address in format "IP:PORT"
 * @param {Object} options - Query options
 * @param {boolean} options.includePlayers - Whether to fetch player list (default: true)
 * @returns {Promise<Object>} Server details object
 */
export async function getServerDetails(address, options = {}) {
  if (!address) {
    throw new Error("Server address is required")
  }

  const { includePlayers = true } = options
  try {
    if (includePlayers) {
      const { info, players } = await getServerInfoAndPlayers(address)
      return {
        name: info.name || "Unknown Server",
        map: info.map || "OFFLINE",
        maxPlayers: info.players?.max || 0,
        numPlayers: info.players?.online || 0,
        players: players || [],
        address: address,
        gameType: info.game || "",
        offline: false,
      }
    } else {
      const info = await getServerInfo(address)
      return {
        name: info.name || "Unknown Server",
        map: info.map || "OFFLINE",
        maxPlayers: info.players?.max || 0,
        numPlayers: info.players?.online || 0,
        players: [],
        address: address,
        gameType: info.game || "",
        offline: false,
      }
    }
  } catch (error) {
    return {
      error: "Server not found or offline",
      message: "The server is not responding or is offline",
      offline: true,
    }
  }
}

/**
 * @param {Array} dbServers - Array of server objects from database
 * @param {Object} options - Query options
 * @param {number} options.timeout - Query timeout per server in ms (default: 3000)
 * @param {number} options.concurrency - Number of parallel queries (default: 5)
 * @returns {Promise<Array>} Array of servers with status information
 */
export async function getServersWithStatus(dbServers, options = {}) {
  if (!dbServers || dbServers.length === 0) {
    return []
  }

  const { timeout = 3000, concurrency = 5 } = options

  const results = []
  for (let i = 0; i < dbServers.length; i += concurrency) {
    const batch = dbServers.slice(i, i + concurrency)
    const batchResults = await Promise.allSettled(
      batch.map(async (dbServer) => {
        try {
          const info = await getServerInfo(dbServer.address, { timeout })
          
          return {
            id: dbServer.id,
            name: info.name || dbServer.hostname,
            address: dbServer.address,
            map: info.map || "OFFLINE",
            players: info.players?.online || 0,
            maxPlayers: info.players?.max || 0,
            status: "online",
          }
        } catch (error) {
          return {
            id: dbServer.id,
            name: dbServer.hostname,
            address: dbServer.address,
            map: "OFFLINE",
            players: 0,
            maxPlayers: 0,
            status: "offline",
          }
        }
      })
    )

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        const dbServer = batch[index]
        results.push({
          id: dbServer.id,
          name: dbServer.hostname,
          address: dbServer.address,
          map: "OFFLINE",
          players: 0,
          maxPlayers: 0,
          status: "offline",
        })
      }
    })
  }

  return results
}