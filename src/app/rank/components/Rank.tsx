"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import RankPlayers from "@/components/RankPlayers";
import { useRouter } from "next/navigation";

export default function Rank({
  identifier,
  type,
}: {
  identifier: string;
  type: "u" | "l";
}) {
  const router = useRouter();
  const [league_name, setLeague_name] = useState("");
  const [rankings, setRankings] = useState<
    { rank: number; player_id: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      const response = await axios.get("/api/fetchplayers", {
        params: {
          identifier,
        },
      });

      setLeague_name(response.data.league_name);

      if (type === "u") {
        if (response.data.user_ranks.length === 0) {
          setRankings(
            response.data.players.map(
              (
                player: { player_id: string; manager: "u" | "l" },
                index: number
              ) => {
                return { rank: index + 1, ...player };
              }
            )
          );
        } else {
          setRankings(response.data.user_ranks);
        }
      } else if (type === "l") {
        if (response.data.lm_ranks.length === 0) {
          setRankings(
            response.data.players.map(
              (
                player: { player_id: string; manager: "u" | "l" },
                index: number
              ) => {
                return { rank: index + 1, ...player };
              }
            )
          );
        } else {
          setRankings(response.data.lm_ranks);
        }
      }
    };

    fetchPlayers();
  }, [identifier, type]);

  const generateScores = async () => {
    setIsLoading(true);
    await axios.post("/api/generatescores", {
      identifier,
      rankings,
      type,
    });

    setIsLoading(false);

    router.push(`/tune/${identifier}/${type}`);
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center text-center">
      <h1>{league_name}</h1>
      <RankPlayers
        ranks={rankings}
        setRanks={setRankings}
        isLoading={isLoading}
        generateScores={generateScores}
      />
    </div>
  );
}
