import { NextResponse } from "next/server"
import { getUserFromCookies } from "@/lib/api-auth"
import { getUserFlags } from "@/lib/api-auth"
import { hasPermission } from "@/utils/permissions"
import { formatDate, formatDuration } from "@/utils/formatters"

/**
 * Get authenticated user from request cookies
 * @param {Object} cookieStore - Next.js cookies() return value
 * @returns {Object} { user, error, status }
 */
export function getAuthenticatedUser(cookieStore) {
  const sessionToken = cookieStore.get('session')
  
  if (!sessionToken) {
    return {
      user: null,
      error: "Unauthorized",
      status: 401
    }
  }

  const user = getUserFromCookies(cookieStore)
  
  if (!user) {
    return {
      user: null,
      error: "Invalid session",
      status: 401
    }
  }

  if (!user.steamId) {
    return {
      user: null,
      error: "Unauthorized",
      status: 401
    }
  }

  return { user, error: null, status: null }
}

/**
 * Check if user has required permission
 * @param {string} userSteamId - User's Steam ID
 * @param {string} requiredFlag - Required permission flag
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} { authorized, error, status }
 */
export async function checkPermission(userSteamId, requiredFlag, options = {}) {
  const flags = await getUserFlags(userSteamId)
  
  if (!hasPermission(flags, requiredFlag, options.isOwn, options.resourceAdminSteamId, options.currentUserSteamId)) {
    return {
      authorized: false,
      error: `Access denied - ${requiredFlag} required`,
      status: 403
    }
  }

  return { authorized: true, error: null, status: null }
}

/**
 * Format sanction data for response
 * @param {Object} sanction - Sanction data from database
 * @param {string} type - Type of sanction ('ban' or 'mute')
 * @returns {Object} Formatted sanction object
 */
export function formatSanction(sanction, type = 'ban') {
  const formatted = {
    id: Number(sanction.id),
    player: sanction.player_name || "Unknown",
    steamId: sanction.player_steamid ? String(sanction.player_steamid) : "",
    admin: sanction.admin_name || "Console",
    adminSteamId: sanction.admin_steamid ? String(sanction.admin_steamid) : null,
    reason: sanction.reason || "No reason specified",
    duration: formatDuration(sanction.duration),
    date: formatDate(sanction.created, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: undefined
    }),
    status: sanction.status || 'ACTIVE',
  }

  if (type === 'ban' && sanction.player_ip) {
    formatted.ip = sanction.player_ip
  }

  if (type === 'mute' && sanction.type) {
    formatted.type = sanction.type
  }

  if (sanction.unban_reason && sanction.unban_reason !== 'Unknown') {
    formatted.unbanReason = sanction.unban_reason
  }
  if (sanction.unmute_reason && sanction.unmute_reason !== 'Unknown') {
    formatted.unmuteReason = sanction.unmute_reason
  }
  if (sanction.unban_admin_name) {
    formatted.unbanAdmin = sanction.unban_admin_name
  }
  if (sanction.unmute_admin_name) {
    formatted.unmuteAdmin = sanction.unmute_admin_name
  }

  return formatted
}

/**
 * Create error response
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @returns {NextResponse} Error response
 */
export function createErrorResponse(message, status = 500) {
  return NextResponse.json(
    { error: message },
    { status }
  )
}

/**
 * Create success response
 * @param {Object} data - Response data
 * @param {number} status - HTTP status code
 * @returns {NextResponse} Success response
 */
export function createSuccessResponse(data, status = 200) {
  return NextResponse.json(data, { status })
}

/**
 * Convert BigInt values to strings recursively in an object
 * @param {any} obj - Object that may contain BigInt values
 * @returns {any} - Object with BigInt values converted to strings
 */
export function convertBigIntToString(obj) {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (typeof obj === 'bigint') {
    return String(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString)
  }
  
  if (typeof obj === 'object') {
    const converted = {}
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToString(value)
    }
    return converted
  }
  
  return obj
}