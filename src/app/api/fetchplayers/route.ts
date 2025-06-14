import { fetchPlayers } from "@/lib/fetchPlayers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const identifier = searchParams.get("identifier") as string;

  const data = await fetchPlayers(identifier);

  return NextResponse.json(data);
}
