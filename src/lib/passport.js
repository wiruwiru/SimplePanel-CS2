import passport from "passport"
import { Strategy as SteamStrategy } from "passport-steam"
import { db } from "@/lib/database"

passport.serializeUser((user, done) => {
  done(null, user)
})

passport.deserializeUser((obj, done) => {
  done(null, obj)
})

passport.use(
  new SteamStrategy(
    {
      returnURL: `${process.env.BASE_URL || "http://localhost:3000"}/api/auth/steam/return`,
      realm: process.env.BASE_URL || "http://localhost:3000",
      apiKey: process.env.STEAM_API_KEY,
    },
    async (identifier, profile, done) => {
      const steamId64 = profile.id
      try {
        await db.execute(
          "INSERT INTO sp_users (steam_id) VALUES (?) ON DUPLICATE KEY UPDATE last_login = CURRENT_TIMESTAMP",
          [steamId64],
        )

        return done(null, { ...profile, steamId64 })
      } catch (error) {
        console.error("Error saving user to database:", error)
        return done(error)
      }
    },
  ),
)

export default passport