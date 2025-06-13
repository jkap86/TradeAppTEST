import Tune from "../../components/Tune";
import { fetchPlayers } from "@/lib/fetchPlayers";
import Allplayers from "@/lib/allplayers.json";

const allplayers: { [key: string]: { [key: string]: string } } =
  Object.fromEntries(
    Allplayers.data.map((player_obj: { [key: string]: string }) => [
      player_obj.player_id,
      player_obj,
    ])
  );

export async function generateMetadata({
  params,
}: {
  params: Promise<{ identifier: string; type: "u" | "l" }>;
}) {
  const { identifier, type } = await params;

  const data = await fetchPlayers(identifier);

  const username = type === "u" ? data.username : data.lm_username;
  const lm_username = type === "u" ? data.lm_username : data.username;
  const league_name = data.league_name;

  return {
    title: "Trade App",
    description: `
      ${username}, Please rank following players to generate fair trades with ${lm_username} in ${league_name}:
      \n
     ${data.players
       .map(
         (player: { player_id: string }) =>
           allplayers[player.player_id]?.player_id || player.player_id
       )
       .join("\n")}
    `,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ identifier: string; type: "u" | "l" }>;
}) {
  const { identifier, type } = await params;
  return <Tune identifier={identifier} type={type} />;
}
