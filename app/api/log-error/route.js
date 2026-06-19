import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req) {
  try {
    const body = await req.json();
    const { message, url, line, col, stack, ua } = body;

    const logDir = "/Users/a1234/.gemini/antigravity/brain/db0697c6-bb47-405c-b1c1-ce62c7b819aa/scratch";
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logPath = path.join(logDir, "browser_errors.log");
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] UA: ${ua}\nMsg: ${message}\nURL: ${url}:${line}:${col}\nStack: ${stack}\n----------------------------------------\n`;

    fs.appendFileSync(logPath, logEntry, "utf8");
    console.log("Logged browser error successfully.");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to log browser error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
