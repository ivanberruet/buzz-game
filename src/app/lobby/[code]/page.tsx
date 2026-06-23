import { createClient } from "@/lib/supabase/server";
import LobbyClient from "@/components/LobbyClient";

type Props = {
  params: Promise<{
    code: string;
  }>;
};

export default async function GameLobbyPage({
  params,
}: Props) {
  const { code } = await params;

  const supabase = await createClient();

  const { data: game } = await supabase
    .from("games")
    .select("*")
    .eq("code", code)
    .single();

  if (!game) {
    return <div>Partida no encontrada</div>;
  }

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("game_id", game.id)
    .order("joined_at");

  return (
    <LobbyClient
      gameId={game.id}
      code={code}
      initialPlayers={players ?? []}
    />
  );
}