export async function GET(request) {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000"
  const returnURL = `${baseUrl}/api/auth/steam/return`
  const realm = baseUrl

  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnURL,
    "openid.realm": realm,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  })

  const steamLoginUrl = `https://steamcommunity.com/openid/login?${params.toString()}`

  return Response.redirect(steamLoginUrl)
}
