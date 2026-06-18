const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");

// Load env variables manually for raw node execution if .env exists
try {
  const envPath = path.join(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, "utf-8");
    envFile.split("\n").forEach(line => {
      const parts = line.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join("=").trim().replace(/^["']|["']$/g, "");
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.error("Failed to load .env file", e);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  const testPhone = "+998 99 999 99 99";
  const testCode = "777777";
  try {
    console.log("Cleaning up old test codes...");
    await client.query("DELETE FROM verification_codes WHERE phone = $1", [testPhone]);

    console.log("Inserting test OTP code...");
    await client.query("INSERT INTO verification_codes (phone, code) VALUES ($1, $2)", [testPhone, testCode]);

    console.log("Querying test OTP code...");
    const { rows } = await client.query(
      "SELECT * FROM verification_codes WHERE phone = $1 AND code = $2 AND created_at > NOW() - INTERVAL '5 minutes'",
      [testPhone, testCode]
    );

    if (rows.length > 0 && rows[0].code === testCode) {
      console.log("SUCCESS: Database table works perfectly and code is retrievable!");
    } else {
      console.error("FAIL: Code not retrieved or incorrect.");
    }

    console.log("Deleting test OTP code...");
    await client.query("DELETE FROM verification_codes WHERE phone = $1", [testPhone]);
  } catch (err) {
    console.error("Error running test:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
