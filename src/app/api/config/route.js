import { NextResponse } from "next/server"

export async function GET() {
  try {
    const config = {
      baseUrl: process.env.BASE_URL || "http://localhost:3000",
      defaultLang: process.env.DEFAULT_LANG || "en-US",
      defaultTheme: process.env.DEFAULT_THEME || "default",
      panelName: process.env.PANEL_NAME || "SimplePanel",
      enableChatLogs: process.env.ENABLE_CHAT_LOGS !== "false",
      enableAdminColumn: process.env.ENABLE_ADMIN_COLUMN !== "false",
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error("Error fetching config:", error)
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    )
  }
}