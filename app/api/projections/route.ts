import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const week = req.nextUrl.searchParams.get("week") || "6";
  const url = `https://api.sleeper.app/projections/nfl/2026/${week}?season_type=regular`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: `Sleeper ${res.status}` }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}