import pool from "@/lib/pool";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { identifier, type, scores } = await req.json();

  const identifier_array = identifier?.split("__");

  const user_id = identifier_array[0];
  const league_id = identifier_array[1];
  const lm_user_id = identifier_array[2];

  const query = `
    UPDATE db
    SET ${type === "u" ? "user_ranks" : "lm_ranks"} = $4
    WHERE user_id = $1 AND lm_user_id = $2 AND league_id = $3; 
   `;

  const values = [user_id, lm_user_id, league_id, scores];

  await pool.query(query, values);

  return NextResponse.json("Success");
}
