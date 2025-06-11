import { NextRequest, NextResponse } from "next/server";

export interface Trade {
  sideA: string[]; // player_id(s) on A side
  sideB: string[]; // player_id(s) on B side
  diff: number; // |score(A) − score(B)| (lower ⇒ fairer)
  winner: "a" | "b" | "even" | "";
}

export async function POST(req: NextRequest) {
  const { scores, fairTradesAnswered } = await req.json();

  const trades = buildFairTrades(scores, fairTradesAnswered);

  return NextResponse.json(trades);
}

const SIZE_PAIRS: [number, number][] = [
  [2, 1], // 2‑for‑1
  [2, 2], // 2‑for‑2
  [3, 1], // 3‑for‑1
  //[3, 2], // 3‑for‑2
];

const buildFairTrades = (
  players: { player_id: string; score: number }[],
  fairTradesAnswered: Trade[],
  diff = 25
) => {
  const player_ids = players.map((p) => p.player_id);
  const score = Object.fromEntries(players.map((p) => [p.player_id, p.score]));
  const trades: Trade[] = [];

  for (const [sizeA, sizeB] of SIZE_PAIRS) {
    // Pick A‑side combos
    for (const sideA of combos(player_ids, sizeA)) {
      const remaining = player_ids.filter((id) => !sideA.includes(id));
      const scoreA = sum(sideA, score);

      // Pick B‑side combos from remaining pool
      for (const sideB of combos(remaining, sizeB)) {
        const gap = Math.abs(scoreA - sum(sideB, score));
        if (gap < diff)
          trades.push({
            sideA,
            sideB,
            diff: gap,
            winner: gap === 0 ? "even" : scoreA > sum(sideB, score) ? "a" : "b",
          });
      }
    }
  }

  // Deduplicate symmetric cases (A vs B same as B vs A when sizes equal)
  const seen = new Set<string>();
  const unique: Trade[] = [];
  for (const t of trades) {
    const key =
      [...t.sideA].sort().join("|") + "_vs_" + [...t.sideB].sort().join("|");
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(t);
    }
  }

  const sorted = unique
    .filter(
      (t) =>
        !fairTradesAnswered.some(
          (fta: Trade) =>
            t.sideA.join("") === fta.sideA.join("") &&
            t.sideB.join("") === fta.sideB.join("")
        )
    )
    .sort((a, b) => Math.random() - Math.random());

  const variedTrades: Trade[] = [];

  for (const player_id of player_ids) {
    if (
      variedTrades.some(
        (vt) => vt.sideA.includes(player_id) || vt.sideB.includes(player_id)
      )
    )
      continue;

    const playerTrade = sorted.find(
      (t) => t.sideA.includes(player_id) || t.sideB.includes(player_id)
    );

    if (playerTrade) variedTrades.push(playerTrade);
    if (variedTrades.length === 5) break;
  }

  variedTrades.push(
    ...sorted
      .filter(
        (s) =>
          !variedTrades.some(
            (vt) =>
              vt.sideA.join("") === s.sideA.join("") &&
              vt.sideB.join("") === s.sideB.join("")
          )
      )
      .slice(0, 5 - variedTrades.length)
  );
  for (const t of sorted) {
    if (variedTrades.length === 5) break;

    const overlaps = [...t.sideA, ...t.sideB].some((p) =>
      variedTrades.some((vt) => vt.sideA.includes(p) || vt.sideB.includes(p))
    );
    if (!overlaps) variedTrades.push(t);
  }

  return variedTrades;
};

const sum = (ids: string[], map: Record<string, number>) =>
  ids.reduce((s, id) => s + (map[id] ?? 0), 0);

/** Generate all k‑combinations of arr (lexicographic) */
function* combos(arr: string[], k: number, start = 0): Generator<string[]> {
  if (k === 0) {
    yield [];
    return;
  }
  for (let i = start; i <= arr.length - k; i++) {
    for (const tail of combos(arr, k - 1, i + 1)) yield [arr[i], ...tail];
  }
}
