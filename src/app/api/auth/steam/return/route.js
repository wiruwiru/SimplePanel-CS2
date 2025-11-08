import { db } from "@/lib/database"
import { serialize } from "cookie"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)

    // Verificar que la respuesta es válida
    const mode = searchParams.get("openid.mode")
    if (mode !== "id_res") {
      return createErrorResponse("invalid_response", request.url)
    }

    // Extraer el Steam ID de la claimed_id
    const claimedId = searchParams.get("openid.claimed_id")
    const steamIdMatch = claimedId?.match(/\/id\/(\d+)/)

    if (!steamIdMatch) {
      return createErrorResponse("no_steam_id", request.url)
    }

    const steamId64 = steamIdMatch[1]

    // Validar la respuesta con Steam
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
      return createErrorResponse("validation_failed", request.url)
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
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    })

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Autenticación exitosa</title>
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
              console.error('[v0] Error in auth callback:', e);
              window.location.href = '/';
            }
          </script>
        </head>
        <body>
          <p style="text-align: center; padding: 20px;">Autenticación exitosa. Redirigiendo...</p>
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
    console.error("Error in Steam return:", error)
    return createErrorResponse("server_error", request.url)
  }
}

function createErrorResponse(errorCode, requestUrl) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Error de autenticación</title>
        <script>
          try {
            if (window.opener) {
              window.opener.postMessage('auth_error', window.location.origin);
              setTimeout(function() {
                window.close();
              }, 500);
            } else {
              window.location.href = '/?error=${errorCode}';
            }
          } catch (e) {
            window.location.href = '/?error=${errorCode}';
          }
        </script>
      </head>
      <body>
        <p style="text-align: center; padding: 20px;">Error de autenticación. Cerrando...</p>
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