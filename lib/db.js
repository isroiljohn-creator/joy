import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

let pool;

if (!global.pgPool) {
  global.pgPool = new Pool({
    connectionString,
    // Ulanishlar hovuzi sozlamalari
    max: 10,
    idleTimeoutMillis: 30000,
    ssl: connectionString && connectionString.includes("railway.internal")
      ? false // Ichki ulanish uchun SSL kerak emas
      : { rejectUnauthorized: false } // Tashqi Railway postgres ulanishi uchun kerak
  });
}

pool = global.pgPool;

export default pool;
