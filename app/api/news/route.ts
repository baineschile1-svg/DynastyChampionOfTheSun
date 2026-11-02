import { NextResponse } from "next/server";

const FP_KEY = "S1zuNx6MSd62vH9KcucxL8R7ZTq4yQpc8LJOhciA";
const FP_BASE = "https://api.fantasypros.com/public/v2/json";

export async function GET() {
  try {
    const res = await fetch(`${FP_BASE}/nfl/news?limit=8`, {
      headers: { "x-api-key": FP_KEY },
    });
    if (!res.ok) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
