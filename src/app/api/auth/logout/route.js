import { serialize } from "cookie"
import { NextResponse } from "next/server"

export async function POST() {
  const cookie = serialize("session", "", {
    maxAge: -1,
    path: "/",
  })

  return NextResponse.json(
    { message: "Logged out successfully" },
    {
      status: 200,
      headers: {
        "Set-Cookie": cookie,
      },
    },
  )
}