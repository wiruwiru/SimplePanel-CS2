import mariadb from "mariadb"

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

export const db = createDbInterface(pool)