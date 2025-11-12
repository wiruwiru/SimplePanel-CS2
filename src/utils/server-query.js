/**
 * Parse server address into IP and port
 * @param {string} address - Server address in format "IP:PORT"
 * @returns {{ip: string, port: number}|null}
 */
export function parseServerAddress(address) {
  if (!address) return null
  
  const [host, portStr] = address.split(":")
  const port = parseInt(portStr)
  
  if (!host || !port || isNaN(port)) {
    return null
  }
  
  return { ip: host, port }
}

/**
 * Get server info using valve-server-query
 * @param {string} address - Server address in format "IP:PORT"
 * @param {Object} options - Query options
 * @param {number} options.timeout - Connection timeout in ms (default: 5000)
 * @returns {Promise<Object>} Server info object
 */
export async function getServerInfo(address, options = {}) {
  const { timeout = 5000 } = options
  const parsed = parseServerAddress(address)
  
  if (!parsed) {
    throw new Error("Invalid server address format")
  }

  try {
    const { Server } = await import("@fabricio-191/valve-server-query")
    const serverInstance = await Server({
      ip: parsed.ip,
      port: parsed.port,
      timeout,
    })
    
    const info = await serverInstance.getInfo()
    await serverInstance.disconnect()
    
    return info
  } catch (error) {
    console.error(`Error querying server ${address}:`, error.message)
    throw error
  }
}

/**
 * Get server players using valve-server-query
 * @param {string} address - Server address in format "IP:PORT"
 * @param {Object} options - Query options
 * @param {number} options.timeout - Connection timeout in ms (default: 5000)
 * @returns {Promise<Array>} Array of player objects
 */
export async function getServerPlayers(address, options = {}) {
  const { timeout = 5000 } = options
  const parsed = parseServerAddress(address)
  
  if (!parsed) {
    throw new Error("Invalid server address format")
  }

  try {
    const { Server } = await import("@fabricio-191/valve-server-query")
    const serverInstance = await Server({
      ip: parsed.ip,
      port: parsed.port,
      timeout,
    })
    
    const players = await serverInstance.getPlayers()
    await serverInstance.disconnect()

    return players.map((player) => {
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
        index: player.index,
      }
    })
  } catch (error) {
    console.error(`Error querying server players ${address}:`, error.message)
    throw error
  }
}

/**
 * Get both server info and players in a single connection
 * @param {string} address - Server address in format "IP:PORT"
 * @param {Object} options - Query options
 * @param {number} options.timeout - Connection timeout in ms (default: 5000)
 * @returns {Promise<Object>} Object with info and players
 */
export async function getServerInfoAndPlayers(address, options = {}) {
  const { timeout = 5000 } = options
  const parsed = parseServerAddress(address)
  
  if (!parsed) {
    throw new Error("Invalid server address format")
  }

  try {
    const { Server } = await import("@fabricio-191/valve-server-query")
    const serverInstance = await Server({
      ip: parsed.ip,
      port: parsed.port,
      timeout,
    })
    
    const [info, players] = await Promise.all([
      serverInstance.getInfo(),
      serverInstance.getPlayers().catch(() => [])
    ])

    await serverInstance.disconnect()

    const transformedPlayers = players.map((player) => {
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
        index: player.index,
      }
    })
    
    return {
      info,
      players: transformedPlayers,
    }
  } catch (error) {
    console.error(`Error querying server ${address}:`, error.message)
    throw error
  }
}