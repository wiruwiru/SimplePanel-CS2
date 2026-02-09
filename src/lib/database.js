import mariadb from "mariadb"
import fs from "fs"
import path from "path"

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
})

const createDbInterface = (pool) => ({
  async query(sql, params) {
    let conn
    try {
      conn = await pool.getConnection()
      const result = await conn.query(sql, params)
      return result
    } catch (error) {
      console.error("Database error:", error)
      throw error
    } finally {
      if (conn) conn.release()
    }
  },
  async execute(sql, params) {
    let conn
    try {
      conn = await pool.getConnection()
      const results = await conn.query(sql, params)
      return Array.isArray(results) ? results : [results]
    } catch (error) {
      console.error("Database error:", error)
      throw error
    } finally {
      if (conn) conn.release()
    }
  },
})

const db = createDbInterface(pool)

function hasDbCredentials() {
  return !!(
    process.env.DB_HOST &&
    process.env.DB_USER &&
    process.env.DB_PASSWORD &&
    process.env.DB_NAME
  )
}

async function checkTableExists(tableName) {
  try {
    const initPool = mariadb.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    })
    const conn = await initPool.getConnection()
    try {
      const result = await conn.query(
        `SELECT COUNT(*) as count FROM information_schema.tables 
         WHERE table_schema = ? AND table_name = ?`,
        [process.env.DB_NAME, tableName]
      )
      return result?.[0]?.count > 0
    } finally {
      conn.release()
      await initPool.end()
    }
  } catch {
    return false
  }
}

async function initializeDatabase() {
  if (!hasDbCredentials()) {
    console.log("Database credentials not configured, skipping initialization")
    return
  }

  try {
    if (await checkTableExists("sp_users")) {
      return
    }

    console.log("Initializing database...")
    const sqlPath = path.join(process.cwd(), "scripts", "create-tables.sql")
    const sqlContent = fs.readFileSync(sqlPath, "utf-8")

    const initPool = mariadb.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true,
    })

    const conn = await initPool.getConnection()
    try {
      await conn.query(sqlContent)
      console.log("Database initialized successfully")
    } finally {
      conn.release()
      await initPool.end()
    }
  } catch (error) {
    if (error.code === "ECONNREFUSED" || error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("Cannot connect to database. Please check your credentials.")
    } else {
      console.error("Error during database initialization:", error)
    }
    throw error
  }
}

let initPromise = null
function ensureInitialized() {
  if (!initPromise) {
    initPromise = initializeDatabase().catch((error) => {
      console.error("Failed to initialize database:", error)
    })
  }
  return initPromise
}

const dbWithInit = {
  async query(sql, params) {
    await ensureInitialized()
    return db.query(sql, params)
  },
  async execute(sql, params) {
    await ensureInitialized()
    return db.execute(sql, params)
  },
}

ensureInitialized()

export { dbWithInit as db }