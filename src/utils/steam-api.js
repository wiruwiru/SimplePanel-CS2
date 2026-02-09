const CACHE_TTL = 60000 // 1 minute cache
const cache = new Map()

function getSteamApiKey() {
  const key = process.env.STEAM_API_KEY
  if (!key) {
    throw new Error("Steam API key not configured")
  }
  return key
}

function getCacheKey(endpoint, params) {
  return `${endpoint}:${JSON.stringify(params)}`
}

function isCacheValid(entry) {
  return Date.now() - entry.timestamp < CACHE_TTL
}

/**
 * Get player summaries from Steam API
 * @param {string|string[]} steamIds - Single Steam ID or array of Steam IDs
 * @returns {Promise<Object>} Object mapping Steam IDs to player data
 */
export async function getPlayerSummaries(steamIds) {
  const ids = Array.isArray(steamIds) ? steamIds : [steamIds]
  const idsString = ids.filter(Boolean).join(',')
  
  if (!idsString) {
    return {}
  }

  const cacheKey = getCacheKey('GetPlayerSummaries', idsString)
  const cached = cache.get(cacheKey)
  
  if (cached && isCacheValid(cached)) {
    return cached.data
  }

  try {
    const apiKey = getSteamApiKey()
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${idsString}`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Steam API returned status ${response.status}`)
    }

    const data = await response.json()
    const profiles = {}

    if (data.response?.players) {
      data.response.players.forEach((player) => {
        profiles[player.steamid] = {
          displayName: player.personaname,
          avatarUrl: player.avatarfull || player.avatarmedium || "",
        }
      })
    }

    cache.set(cacheKey, { data: profiles, timestamp: Date.now() })
    return profiles
  } catch (error) {
    console.error("Error fetching Steam player summaries:", error)
    throw error
  }
}

export function clearCache() {
  cache.clear()
}