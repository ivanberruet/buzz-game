import { createClient } from "@/lib/supabase/server";

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
    <div className="p-8">
      <h1 className="text-2xl font-bold">
        Código: {code}
      </h1>

      <h2 className="mt-6 text-lg">
        Jugadores
      </h2>

      <ul className="mt-2">
        {players?.map((player) => (
          <li key={player.id}>
            {player.display_name}
          </li>
        ))}
      </ul>
    </div>
  );
}