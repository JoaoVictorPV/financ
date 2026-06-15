import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const APP_USER = process.env.APP_USER;
    const APP_PASSWORD = process.env.APP_PASSWORD;

    if (!APP_USER || !APP_PASSWORD) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    if (username === APP_USER && password === APP_PASSWORD) {
      const token = "fin_token_" + Math.random().toString(36).slice(2);
      return NextResponse.json({ success: true, token });
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}