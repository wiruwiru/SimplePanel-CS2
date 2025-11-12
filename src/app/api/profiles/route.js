import { NextResponse } from "next/server"
import { getPlayerSummaries } from "@/utils/steam-api"

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const ids = searchParams.get("ids")

  if (!ids) {
    return NextResponse.json({ message: "Steam IDs are required" }, { status: 400 })
  }

  try {
    const idsArray = ids.split(',').filter(Boolean)
    const profiles = await getPlayerSummaries(idsArray)
    return NextResponse.json(profiles)
  } catch (error) {
    console.error("Error fetching Steam profiles:", error)
    return NextResponse.json({ message: "Failed to fetch Steam profiles" }, { status: 500 })
  }
}