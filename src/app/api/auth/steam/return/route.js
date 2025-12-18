import { db } from "@/lib/database"
import { serialize } from "cookie"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)

    const mode = searchParams.get("openid.mode")
    if (mode !== "id_res") {
      return createErrorResponse("cancelled", request.url)
    }

    const claimedId = searchParams.get("openid.claimed_id")
    const steamIdMatch = claimedId?.match(/\/id\/(\d+)/)

    if (!steamIdMatch) {
      return createErrorResponse("failed", request.url)
    }

    const steamId64 = steamIdMatch[1]

    const validationParams = new URLSearchParams()
    searchParams.forEach((value, key) => {
      validationParams.append(key, value)
    })
    validationParams.set("openid.mode", "check_authentication")

    const validationResponse = await fetch("https://steamcommunity.com/openid/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: validationParams.toString(),
    })

    const validationText = await validationResponse.text()

    if (!validationText.includes("is_valid:true")) {
      return createErrorResponse("failed", request.url)
    }

    await db.execute(
      "INSERT INTO sp_users (steam_id, last_login) VALUES (?, CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE last_login = CURRENT_TIMESTAMP",
      [steamId64],
    )

    const user = {
      steamId: steamId64,
    }

    const token = Buffer.from(JSON.stringify(user)).toString("base64")
    const cookie = serialize("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Authentication successful</title>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage('auth_success', window.location.origin);
                setTimeout(function() {
                  window.close();
                }, 500);
              } else {
                window.location.href = '/';
              }
            } catch (e) {
              console.error('Error in authentication callback:', e);
              window.location.href = '/';
            }
          </script>
        </head>
        <body>
          <p style="text-align: center; padding: 20px;">Authentication successful. Redirecting...</p>
        </body>
      </html>
    `

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Set-Cookie": cookie,
      },
    })
  } catch (error) {
    console.error("Error in Steam authentication:", error)
    return createErrorResponse("failed", request.url)
  }
}

function createErrorResponse(errorReason, requestUrl) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Authentication error</title>
        <script>
          try {
            if (window.opener) {
              window.opener.postMessage('auth_error', window.location.origin);
              setTimeout(function() {
                window.close();
              }, 500);
            } else {
              window.location.href = '/auth/error?reason=${errorReason}';
            }
          } catch (e) {
            window.location.href = '/auth/error?reason=${errorReason}';
          }
        </script>
      </head>
      <body>
        <p style="text-align: center; padding: 20px;">Authentication error. Closing...</p>
      </body>
    </html>
  `

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html",
    },
  })
}