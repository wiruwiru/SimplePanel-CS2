import { NextResponse } from "next/server"
import { getServerDetails } from "@/services/servers/server-query"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { searchParams } = new URL(request.url)

  const address = searchParams.get("address")
  if (!address) {
    return NextResponse.json(
      { error: "Address parameter is required" },
      { status: 400 }
    )
  }

  try {
    const serverInfo = await getServerDetails(address)
    if (serverInfo.offline) {
      return NextResponse.json(serverInfo, { status: 200 })
    }

    return NextResponse.json(serverInfo)
  } catch (error) {
    console.error("Error querying server:", error)
    return NextResponse.json(
      {
        error: "Failed to query server",
        message: error.message,
        offline: true,
      },
      { status: 200 }
    )
  }
}