import { NextRequest, NextResponse } from "next/server";

export interface PlayerScore {
  rank: number;
  player_id: string;
  score: number;
  manager: "u" | "l";
}

export interface TradeVerdict {
  diff: number;
  sideA: string[];
  sideB: string[];
  winner: "a" | "b" | "even"; // UI values
}

export async function POST(req: NextRequest) {
  try {
    const {
      scores,
      verdicts,
      eta = (process.env.ETA && parseFloat(process.env.ETA)) || 0.1,
      epochs = (process.env.EPOCHS && parseFloat(process.env.EPOCHS)) || 5,
    } = (await req.json()) as {
      scores: PlayerScore[];
      verdicts: TradeVerdict[];
      eta?: number;
      epochs?: number;
    };

    if (!Array.isArray(scores) || !Array.isArray(verdicts))
      return NextResponse.json(
        { error: "'scores' and 'verdicts' must be arrays" },
        { status: 400 }
      );

    const ids = scores.map((p) => p.player_id);
    const idx = Object.fromEntries(ids.map((id, i) => [id, i]));
    const theta = scores.map((p) => p.score);

    const rows: number[][] = [];
    const targets: number[] = [];
    for (const v of verdicts) {
      const row = new Array(theta.length).fill(0);
      v.sideA.forEach((id) => (row[idx[id]] += v.diff));
      v.sideB.forEach((id) => (row[idx[id]] -= v.diff));
      rows.push(row);
      targets.push(v.winner === "a" ? 1 : v.winner === "b" ? 0 : 0.5);
    }

    sgdUpdate(theta, rows, targets, eta, epochs);

    const out: PlayerScore[] = scores
      .map((p, i) => ({ ...p, score: clamp(Math.round(theta[i])) }))
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({ scores: out });
  } catch (err) {
    console.error("SGD BT update error", err);
    return NextResponse.json(
      { error: "Invalid JSON or server error" },
      { status: 500 }
    );
  }
}

/* ─────────── SGD Bradley‑Terry updater ─────────── */
function sgdUpdate(
  theta: number[],
  rows: number[][],
  targets: number[],
  eta: number,
  epochs: number
) {
  for (let e = 0; e < epochs; e++) {
    for (let r = 0; r < rows.length; r++) {
      const dot = rows[r].reduce((sum, w, i) => sum + w * theta[i], 0);
      const p = 1 / (1 + Math.exp(-dot));
      const grad = p - targets[r];
      for (let i = 0; i < theta.length; i++)
        theta[i] -= eta * grad * rows[r][i];
    }
  }
}

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
