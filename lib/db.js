import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

let pool;

if (!global.pgPool) {
  global.pgPool = new Pool({
    connectionString,
    // Ulanishlar hovuzi sozlamalari
    max: 10,
    idleTimeoutMillis: 30000,
    ssl: connectionString && (connectionString.includes("railway.internal") || connectionString.includes("localhost") || connectionString.includes("127.0.0.1"))
      ? false // Ichki va lokal ulanishlar uchun SSL kerak emas
      : { rejectUnauthorized: false } // Tashqi Railway postgres ulanishlari uchun SSL shart
  });
}

pool = global.pgPool;

export default pool;
