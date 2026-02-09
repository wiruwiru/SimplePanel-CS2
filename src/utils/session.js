import { SignJWT, jwtVerify } from "jose"

const getSecretKey = () => {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set")
  }
  return new TextEncoder().encode(secret)
}

/**
 * Generate JWT token for user session
 * @param {Object} user - User object with steamId
 * @returns {Promise<string>} JWT token
 */
export async function generateSessionToken(user) {
  const secretKey = getSecretKey()
  const expiresIn = 60 * 60 * 24 * 7 // 7 days in seconds

  const token = await new SignJWT({ steamId: user.steamId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(secretKey)

  return token
}

/**
 * Check if token is a valid JWT format (has 3 parts separated by dots)
 * @param {string} token - Token to check
 * @returns {boolean} True if token looks like a JWT
 */
function isJWTFormat(token) {
  if (!token || typeof token !== 'string') {
    return false
  }
  const parts = token.split('.')
  return parts.length === 3
}

/**
 * Verify and parse JWT token
 * @param {string} token - JWT token
 * @returns {Promise<Object|null>} Parsed user object or null
 */
export async function verifySessionToken(token) {
  try {
    if (!token) {
      return null
    }

    if (!isJWTFormat(token)) {
      return null
    }

    const secretKey = getSecretKey()
    const { payload } = await jwtVerify(token, secretKey)

    return {
      steamId: payload.steamId,
    }
  } catch (error) {
    if (error.code === "ERR_JWT_EXPIRED") {
      return null
    } else if (error.code === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED") {
      return null
    } else {
      return null
    }
  }
}

/**
 * Parse session cookie from request
 * @param {Request|Object} request - Request object or object with headers
 * @returns {Promise<Object|null>} Parsed user object or null
 */
export async function parseSession(request) {
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
    
    return await verifySessionToken(sessionToken)
  } catch (error) {
    console.error("Error parsing session:", error)
    return null
  }
}

/**
 * Get session from cookies (Next.js cookies() helper)
 * @param {Object} cookieStore - Next.js cookies() return value
 * @returns {Promise<Object|null>} Parsed user object or null
 */
export async function getSessionFromCookies(cookieStore) {
  try {
    const sessionToken = cookieStore.get('session')
    if (!sessionToken) {
      return null
    }
    
    return await verifySessionToken(sessionToken.value)
  } catch (error) {
    console.error("Error parsing session from cookies:", error)
    return null
  }
}