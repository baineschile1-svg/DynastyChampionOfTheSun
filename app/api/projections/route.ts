import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week") || "1";

  try {
    const res = await fetch(
      `https://api.sleeper.app/v1/projections/nfl/2026/${week}?season_type=regular`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) {
      return NextResponse.json([], { status: 200 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json([], { status: 200 });
  }
}
