import pool from "@/lib/pool";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // expect { rankings: [{player_id, rank}, …] }
    if (!Array.isArray(body.rankings)) {
      return NextResponse.json(
        { error: "rankings must be an array" },
        { status: 400 }
      );
    }

    const scores = generateLinearScores(body.rankings);

    const identifier_array = body.identifier?.split("__");

    const user_id = identifier_array[0];
    const league_id = identifier_array[1];
    const lm_user_id = identifier_array[2];

    const query = `
        UPDATE db
        SET ${body.type === "u" ? "user_ranks" : "lm_ranks"} = $4
        WHERE user_id = $1 AND lm_user_id = $2 AND league_id = $3; 
    `;

    const values = [user_id, lm_user_id, league_id, scores];

    await pool.query(query, values);

    return NextResponse.json({ scores });
  } catch (err) {
    console.error("generate-linear-scores error:", err);
    return NextResponse.json(
      { error: "Invalid JSON or server error" },
      { status: 500 }
    );
  }
}

const generateLinearScores = (
  rankings: { player_id: string; rank: number; manager: "u" | "l" }[]
): { rank: number; player_id: string; score: number; manager: "u" | "l" }[] => {
  if (rankings.length === 0) return [];

  const maxRank = Math.max(...rankings.map((r) => r.rank));
  const minRank = Math.min(...rankings.map((r) => r.rank));
  const range = maxRank - minRank;

  return rankings.map((r) => {
    const score = range === 0 ? 100 : ((maxRank - r.rank) / range) * 100; // linear 100 → 0
    return {
      rank: r.rank,
      player_id: r.player_id,
      score: Math.round(score),
      manager: r.manager,
    };
  });
};
