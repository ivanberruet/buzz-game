"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Player = {
  id: string;
  display_name: string;
  joined_at: string;
};

type Props = {
  gameId: string;
  code: string;
  initialPlayers: Player[];
};

export default function LobbyClient({
  gameId,
  code,
  initialPlayers,
}: Props) {
  const [players, setPlayers] =
    useState(initialPlayers);

  useEffect(() => {
    async function setup() {
      const supabase = createClient();
    
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log("SESSION", session);


      const channel = supabase
        .channel(`players-${gameId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "players",
            // sin filtrar
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
        return () => {
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
    </div>
  );
}