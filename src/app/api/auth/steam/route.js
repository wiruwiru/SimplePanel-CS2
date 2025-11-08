export async function GET(request) {
  const returnURL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/steam/return`
  const realm = process.env.NEXT_PUBLIC_BASE_URL

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
