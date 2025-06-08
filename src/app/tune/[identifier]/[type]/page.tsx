"use client";

import axios from "axios";
import { use, useEffect, useState } from "react";
import Allplayers from "@/lib/allplayers.json";
import { Trade } from "@/app/api/fairtrades/route";
import { useRouter } from "next/navigation";

const allplayers: { [key: string]: { [key: string]: string } } =
  Object.fromEntries(
    Allplayers.data.map((player_obj: { [key: string]: string }) => [
      player_obj.player_id,
      player_obj,
    ])
  );

export default function Tune({
  params,
}: {
  params: Promise<{ identifier: string; type: "u" | "l" }>;
}) {
  const router = useRouter();
  const { identifier, type } = use(params);
  const [league_name, setLeague_name] = useState("");
  const [scores, setScores] = useState<
    { rank: number; player_id: string; score: number; manager: "u" | "l" }[]
  >([]);
  const [fairTrades, setFairTrades] = useState<Trade[]>([]);

  useEffect(() => {
    const fetchScores = async () => {
      const response = await axios.get("/api/fetchplayers", {
        params: {
          identifier,
        },
      });

      setLeague_name(response.data.league_name);

      if (type === "u") {
        setScores(response.data.user_ranks);
      } else if (type === "l") {
        setScores(response.data.lm_ranks);
      }
    };

    fetchScores();
  }, [identifier, type]);

  useEffect(() => {
    if (scores.length > 0) {
      const fetchFairTrades = async () => {
        const response = await axios.post("/api/fairtrades", {
          scores,
        });

        setFairTrades(response.data);
      };

      fetchFairTrades();
    }
  }, [scores]);

  const updateScores = async () => {
    const response = await axios.post("/api/updatescores", {
      scores,
      verdicts: fairTrades,
    });

    setScores(response.data.scores);
  };

  const finalizeScores = async () => {
    await axios.post("/api/savescores", {
      scores,
      identifier,
      type,
    });

    router.push(`/summary/${identifier}`);
  };

  const pickSide = (fairTrade: Trade, winner: "a" | "b" | "even") => {
    const existingFairTrades = fairTrades;

    setFairTrades([
      ...existingFairTrades.filter(
        (c) =>
          !(
            c.sideA.join("") === fairTrade.sideA.join("") &&
            c.sideB.join("") === fairTrade.sideB.join("")
          )
      ),
      {
        ...fairTrade,
        winner,
      },
    ]);
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center text-center">
      <h1>{league_name}</h1>
      <table className="table-fixed m-8 border-separate border-spacing-y-2">
        <tbody>
          {scores
            .sort((a, b) => b.score - a.score)
            .map((player) => {
              return (
                <tr key={player.player_id} className="outline outline-gray-500">
                  <td colSpan={3} className="p-1">
                    {allplayers[player.player_id]?.position || "-"}
                    &nbsp;
                    {allplayers[player.player_id]?.full_name ||
                      player.player_id}
                    &nbsp;
                    {allplayers[player.player_id]?.team || "FA"}
                  </td>
                  <td>
                    <strong className="m-2">{player.score}</strong>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>

      <table className="table-fixed w-full border-separate border-spacing-y-4 border-spacing-x-1">
        <tbody>
          {fairTrades
            .sort((a, b) =>
              [...a.sideA, ...a.sideB].join("") >
              [...b.sideA, ...b.sideB].join("")
                ? 1
                : -1
            )
            .map((fairTrade) => {
              return (
                <tr
                  key={
                    fairTrade.sideA.join("") + "_" + fairTrade.sideB.join("")
                  }
                  className="bg-slate-600"
                >
                  <td
                    colSpan={3}
                    className={
                      fairTrade.winner === "a"
                        ? "outline outline-2 outline-green-500"
                        : ""
                    }
                    onClick={() => pickSide(fairTrade, "a")}
                  >
                    {fairTrade.sideA.map((player_id) => {
                      return (
                        <p key={player_id}>
                          {allplayers[player_id]?.full_name || player_id}
                        </p>
                      );
                    })}
                  </td>
                  <td
                    className={
                      fairTrade.winner === "even"
                        ? "outline outline-2 outline-green-500"
                        : ""
                    }
                    onClick={() => pickSide(fairTrade, "even")}
                  >
                    EVEN
                  </td>
                  <td
                    colSpan={3}
                    className={
                      fairTrade.winner === "b"
                        ? "outline outline-2 outline-green-500"
                        : ""
                    }
                    onClick={() => pickSide(fairTrade, "b")}
                  >
                    {fairTrade.sideB.map((player_id) => {
                      return (
                        <p key={player_id}>
                          {allplayers[player_id]?.full_name || player_id}
                        </p>
                      );
                    })}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
      <button
        className="bg-blue-600 text-white px-3 py-1 rounded w-[15rem]"
        onClick={updateScores}
      >
        Update Scores
      </button>

      <button
        className="bg-red-600 text-yellow px-3 py-1 rounded w-[15rem] m-8"
        onClick={finalizeScores}
      >
        Finalize Scores
      </button>
    </div>
  );
}
