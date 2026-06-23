"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
// import { buzz } from "@/actions/game-actions";

type Player = {
  id: string;
  user_id: string;
  display_name: string;
  joined_at: string;
};

type Props = {
  gameId: string;
  roundId: string;
  code: string;
  initialPlayers: Player[];
};

type Buzz = {
  id: string;
  user_id: string;
  pressed_at: string;
};

export default function LobbyClient({
  gameId,
  roundId,
  code,
  initialPlayers,
}: Props) {
  const [players, setPlayers] = useState(initialPlayers);
  
  const [buzzes, setBuzzes] = useState<Buzz[]>([]);

  useEffect(() => {
    const supabase = createClient();

    let channel: ReturnType<typeof supabase.channel>;
    let buzzChannel: ReturnType<typeof supabase.channel>;

    async function setup() {
      const { data: { session } } = await supabase.auth.getSession();

      console.log("SESSION", session);

      const { data: buzzData } = await supabase
        .from("buzzes")
        .select("*")
        .eq("round_id", roundId)
        .order("pressed_at");

      if (buzzData) {
        setBuzzes(buzzData);
      }

      channel = supabase
        .channel(`players-${gameId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "players",
          },
          async (payload) => {
            console.log("Realtime event:", payload);

            const { data } = await supabase
              .from("players")
              .select("*")
              .eq("game_id", gameId)
              .order("joined_at");

            if (data) {
              setPlayers(data);
            }
          }
        )
        .subscribe((status) => {
          console.log("Realtime status:", status);
        });

      buzzChannel = supabase
        .channel(`buzzes-${roundId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "buzzes",
          },
          async () => {
            const { data } = await supabase
              .from("buzzes")
              .select("*")
              .eq("round_id", roundId)
              .order("pressed_at");

            if (data) {
              setBuzzes(data);
            }
          }
        )
        .subscribe((status) => {
          console.log("Buzz realtime:", status);
        });
        
    }

    setup();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }

      if (buzzChannel) {
        supabase.removeChannel(buzzChannel);
      }
    };
  }, [gameId, roundId]);  


  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">
        Código: {code}
      </h1>

      <h2 className="mt-6 text-lg">
        Jugadores
      </h2>

      <ul className="mt-3">
        {players.map((player) => (
          <li key={player.id}>
            {player.display_name}
          </li>
        ))}
      </ul>

      <button
        onClick={async () => {
          const response = await fetch("/api/buzz", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              roundId,
            }),
          });

          const result = await response.json();

          console.log(result);
        }}
        className="mt-8 bg-red-600 text-white px-6 py-3 rounded"
      >
        BUZZ
      </button>


      <h2 className="mt-8 text-lg font-bold">
        Orden de respuesta
      </h2>

      <ol className="mt-3">
        {buzzes.map((buzz, index) => (
          <li key={buzz.id}>
            {index + 1}. {buzz.user_id}
          </li>
        ))}
      </ol>
    </div>
  );
}