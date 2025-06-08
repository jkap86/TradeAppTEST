import Allplayers from "@/lib/allplayers.json";

const allplayers: { [key: string]: { [key: string]: string } } =
  Object.fromEntries(
    Allplayers.data.map((player_obj: { [key: string]: string }) => [
      player_obj.player_id,
      player_obj,
    ])
  );

export default function RankPlayers({
  ranks,
  setRanks,
  isLoading,
  generateScores,
}: {
  ranks: { rank: number; player_id: string }[];
  setRanks: (ranks: { rank: number; player_id: string }[]) => void;
  isLoading: boolean;
  generateScores: () => void;
}) {
  const movePlayer = (rank: number, direction: "up" | "down") => {
    const currentRanks = ranks;

    const updatedRanks = currentRanks.map((cr) => {
      if (direction === "up") {
        if (cr.rank === rank) {
          cr.rank--;
        } else if (cr.rank == rank - 1) {
          cr.rank++;
        }
      } else if (direction === "down") {
        if (cr.rank === rank) {
          cr.rank++;
        } else if (cr.rank == rank + 1) {
          cr.rank--;
        }
      }

      return cr;
    });

    setRanks(updatedRanks);
  };

  return (
    <>
      <h2>Rank these players according to your league settings.</h2>
      <table className="table-fixed w-full">
        <tbody>
          {ranks
            .sort((a, b) => a.rank - b.rank)
            .map((player) => {
              return (
                <tr key={player.player_id} className="outline outline-gray-500">
                  <td>{player.rank}</td>
                  <td colSpan={3}>
                    {allplayers[player.player_id]?.position || "-"}
                    &nbsp;
                    {allplayers[player.player_id]?.full_name ||
                      player.player_id}
                    &nbsp;
                    {allplayers[player.player_id]?.team || "FA"}
                  </td>
                  <td
                    onClick={() =>
                      player.rank > 1 && movePlayer(player.rank, "up")
                    }
                    className="text-5xl"
                  >
                    +
                  </td>
                  <td
                    onClick={() =>
                      player.rank < ranks.length &&
                      movePlayer(player.rank, "down")
                    }
                    className="text-5xl"
                  >
                    -
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
      <button
        className="bg-blue-600 text-white px-3 py-1 rounded w-[15rem]"
        onClick={generateScores}
        disabled={isLoading}
      >
        Generate Scores
      </button>
    </>
  );
}
