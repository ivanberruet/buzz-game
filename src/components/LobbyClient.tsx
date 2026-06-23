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
  isHost: boolean;
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
  isHost,
}: Props) {
  const [players, setPlayers] = useState(initialPlayers);
  
  const [buzzes, setBuzzes] = useState<Buzz[]>([]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [activeRoundId, setActiveRoundId] = useState(roundId);

  const alreadyBuzzed = buzzes.some(
    (buzz) => buzz.user_id === currentUserId
  );

  useEffect(() => {
    const supabase = createClient();

    let channel: ReturnType<typeof supabase.channel>;
    let buzzChannel: ReturnType<typeof supabase.channel>;
    let roundsChannel: ReturnType<typeof supabase.channel>;

    async function setup() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setCurrentUserId(session.user.id);
      }

      const { data: buzzData } = await supabase
        .from("buzzes")
        .select("*")
        .eq("round_id", activeRoundId)
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
        .channel(`buzzes-${activeRoundId}`)
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
              .eq("round_id", activeRoundId)
              .order("pressed_at");

            if (data) {
              setBuzzes(data);
            }
          }
        )
        .subscribe((status) => {
          console.log("Buzz realtime:", status);
        });

      roundsChannel = supabase
        .channel(`rounds-${gameId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "rounds",
          },
          async () => {
            const { data } = await supabase
              .from("rounds")
              .select("*")
              .eq("game_id", gameId)
              .eq("status", "active")
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            if (data) {
              setActiveRoundId(data.id);
              setBuzzes([]);
            }
          }
        )
        .subscribe();
      
    }

    setup();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }

      if (buzzChannel) {
        supabase.removeChannel(buzzChannel);
      }

      if (roundsChannel) {
        supabase.removeChannel(roundsChannel);
      }
    };
  }, [gameId, activeRoundId]);  


  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">
        Código: {code}
      </h1>

      <p className="mt-2 text-gray-500">
        Ronda: {activeRoundId.slice(0, 8)}
      </p>

      <h2 className="mt-6 text-lg">
        Jugadores
      </h2>

      <ul className="mt-3">
        {players.map((player) => (
          <li key={player.id}>
            {player.display_name}
            {buzzes.some(
              (b) => b.user_id === player.user_id
            ) && " ✅"}
          </li>
        ))}
      </ul>

      <button
        disabled={alreadyBuzzed}
        onClick={async () => {
          const response = await fetch("/api/buzz", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              activeRoundId,
            }),
          });

          const result = await response.json();

          console.log(result);
        }}
        className="mt-8 bg-red-600 text-white px-6 py-3 rounded disabled:opacity-50"
      >
        {alreadyBuzzed
          ? "Ya respondiste"
          : "BUZZ"}
      </button>

      {isHost && (
        <button
          onClick={async () => {
            const response = await fetch(
              "/api/new-round",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  gameId,
                  roundId: activeRoundId,
                }),
              }
            );

            const result = await response.json();

            console.log(result);
          }}
          className="ml-4 bg-blue-600 text-white px-6 py-3 rounded"
        >
          Nueva ronda
        </button>
      )}


      <h2 className="mt-8 text-lg font-bold">
        Orden de respuesta
      </h2>

      <ol className="mt-3 space-y-2">
        {buzzes.map((buzz, index) => {
          const player = players.find(
            (p) => p.user_id === buzz.user_id
          );

          const medal =
            index === 0 ? "🥇" :
            index === 1 ? "🥈" :
            index === 2 ? "🥉" :
            `${index + 1}.`;

          return (
            <li key={buzz.id}>
              {medal} {player?.display_name ?? "Jugador"}
            </li>
          );
        })}
      </ol>
    </div>
  );
}