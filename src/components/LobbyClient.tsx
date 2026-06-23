"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
// import { buzz } from "@/actions/game-actions";

type Player = {
  id: string;
  display_name: string;
  joined_at: string;
};

type Props = {
  gameId: string;
  roundId: string;
  code: string;
  initialPlayers: Player[];
};

export default function LobbyClient({
  gameId,
  roundId,
  code,
  initialPlayers,
}: Props) {
  const [players, setPlayers] =
    useState(initialPlayers);

  useEffect(() => {
    const supabase = createClient();

    let channel: ReturnType<typeof supabase.channel>;

    async function setup() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log("SESSION", session);

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
    }

    setup();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [gameId]);  

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("debug-channel")
      .subscribe((status) => {
        console.log("DEBUG CHANNEL:", status);
      });

    console.log("Channels:", supabase.getChannels());

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
      
    </div>
  );
}