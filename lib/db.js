import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

let pool;

if (!global.pgPool) {
  global.pgPool = new Pool({
    connectionString,
    // Ulanishlar hovuzi sozlamalari
    max: 10,
    idleTimeoutMillis: 30000,
    ssl: connectionString && (connectionString.includes("localhost") || connectionString.includes("127.0.0.1"))
      ? false // Lokal ulanishlar uchun SSL kerak emas
      : { rejectUnauthorized: false } // Railway (tashqi va ichki tarmoq) ulanishlari uchun SSL shart (postgres-ssl tasviri ishlatilyapti)
  });
}

pool = global.pgPool;

export default pool;
