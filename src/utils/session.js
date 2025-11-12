/**
 * Parse session cookie from request
 * @param {Request|Object} request - Request object or object with headers
 * @returns {Object|null} Parsed user object or null
 */
export function parseSession(request) {
  try {
    let sessionToken = null
    
    if (request.headers) {
      const cookies = request.headers.get?.('cookie') || request.headers.cookie || ''
      const cookieMatch = cookies.match(/session=([^;]+)/)
      sessionToken = cookieMatch ? cookieMatch[1] : null
    } else if (typeof request === 'string') {
      sessionToken = request
    }
    
    if (!sessionToken) {
      return null
    }
    
    const user = JSON.parse(Buffer.from(sessionToken, "base64").toString())
    return user
  } catch (error) {
    console.error("Error parsing session:", error)
    return null
  }
}

/**
 * Get session from cookies (Next.js cookies() helper)
 * @param {Object} cookieStore - Next.js cookies() return value
 * @returns {Object|null} Parsed user object or null
 */
export function getSessionFromCookies(cookieStore) {
  try {
    const sessionToken = cookieStore.get('session')
    if (!sessionToken) {
      return null
    }
    
    const user = JSON.parse(Buffer.from(sessionToken.value, "base64").toString())
    return user
  } catch (error) {
    console.error("Error parsing session from cookies:", error)
    return null
  }
}