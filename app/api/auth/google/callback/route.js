import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { hashPassword } from "@/lib/hash";

const COOKIE_OPTIONS = { 
  path: "/", 
  maxAge: 60 * 60 * 24 * 30,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax"
};

const PUBLIC_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax"
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  
  const host = request.headers.get("host") || "localhost:3000";
  let proto = "http";
  if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
    const reqUrlObj = new URL(request.url);
    proto = request.headers.get("x-forwarded-proto") || reqUrlObj.protocol.replace(":", "");
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/login?error=Google login rad etildi`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    let email, name;

    if (!clientId || !clientSecret || code === "mock_dev_code") {
      email = "developer@joy.uz";
      name = "Developer Joy";
    } else {
      // Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        })
      });

      const tokens = await tokenResponse.json();
      if (tokens.error) {
        console.error("Google token error:", tokens);
        return NextResponse.redirect(`${appUrl}/login?error=Token olishda xatolik yuz berdi`);
      }

      // Get user info from access token
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`
        }
      });

      const userInfo = await userInfoResponse.json();
      if (!userInfo.email) {
        return NextResponse.redirect(`${appUrl}/login?error=Email manzili topilmadi`);
      }

      email = userInfo.email;
      name = userInfo.name || userInfo.given_name || "Google User";
    }

    // Query or Register user in DB
    const { rows: existingUser } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    let user;

    if (existingUser.length > 0) {
      user = existingUser[0];
    } else {
      const randomDigits = Math.floor(1000000 + Math.random() * 9000000).toString();
      const placeholderPhone = `google_${randomDigits}`;
      const dummyPassword = hashPassword(Math.random().toString(36));

      const { rows: newUser } = await pool.query(
        "INSERT INTO users (name, phone, password, email) VALUES ($1, $2, $3, $4) RETURNING *",
        [name, placeholderPhone, dummyPassword, email]
      );
      user = newUser[0];
    }

    const cookieStore = cookies();
    cookieStore.set("user_id", String(user.id), COOKIE_OPTIONS);
    cookieStore.set("user_name", user.name, COOKIE_OPTIONS);
    cookieStore.set("user_display_name", user.name, PUBLIC_COOKIE_OPTIONS);
    cookieStore.set("user_phone", user.phone, COOKIE_OPTIONS);
    cookieStore.set("user_role", user.role || "user", PUBLIC_COOKIE_OPTIONS);
    cookieStore.set("is_logged_in", "true", PUBLIC_COOKIE_OPTIONS);

    return NextResponse.redirect(`${appUrl}/profile`);
  } catch (err) {
    console.error("Google OAuth error:", err);
    return NextResponse.redirect(`${appUrl}/login?error=Tizimda xatolik yuz berdi`);
  }
}
