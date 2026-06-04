import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

let pool;

if (!global.pgPool) {
  global.pgPool = new Pool({
    connectionString,
    ssl: connectionString && connectionString.includes("railway.internal")
      ? false // Internal connection does not need SSL usually, but let's allow flexibility
      : { rejectUnauthorized: false } // Required for external Railway postgres connection
  });
}

pool = global.pgPool;

export default pool;
