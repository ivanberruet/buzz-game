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
  currentPosition: number;
  code: string;
  initialPlayers: Player[];
  isHost: boolean;
};

type Buzz = {
  id: string;
  user_id: string;
  pressed_at: string;
};

type Score = {
  user_id: string;
  points: number;
};

export default function LobbyClient({
  gameId,
  roundId,
  currentPosition,
  code,
  initialPlayers,
  isHost,
}: Props) {
  const [players, setPlayers] = useState(initialPlayers);
  
  const [buzzes, setBuzzes] = useState<Buzz[]>([]);

  const [scores, setScores] = useState<Score[]>([]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [activeRoundId, setActiveRoundId] = useState(roundId);

  const [currentTurn, setCurrentTurn] = useState(currentPosition);

  const alreadyBuzzed = buzzes.some(
    (buzz) => buzz.user_id === currentUserId
  );

  useEffect(() => {
    const supabase = createClient();

    let channel: ReturnType<typeof supabase.channel>;
    let buzzChannel: ReturnType<typeof supabase.channel>;
    let roundsChannel: ReturnType<typeof supabase.channel>;
    let scoresChannel: ReturnType<typeof supabase.channel>;

    async function setup() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setCurrentUserId(session.user.id);
      }

      // BUZZES
      const { data: buzzData } = await supabase
        .from("buzzes")
        .select("*")
        .eq("round_id", activeRoundId)
        .order("pressed_at");

      if (buzzData) {
        setBuzzes(buzzData);
      }
      
      //SCORES
      const { data: scoreData } = await supabase
        .from("scores")
        .select("*")
        .eq("game_id", gameId)
        .order("points", { ascending: false });

      if (scoreData) {
        setScores(scoreData);
      }

      //REALTIME CHANNELS
      channel = supabase
        .channel(`players-${gameId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "players",
          },
          async () => {
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
        .subscribe();

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
        .subscribe();

      roundsChannel = supabase
        .channel(`rounds-${gameId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
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
              const isNewRound =
                data.id !== activeRoundId;

              if (isNewRound) {
                setActiveRoundId(data.id);
                setBuzzes([]);
              }

              setCurrentTurn(
                data.current_position
              );
            }
          }
        )
        .subscribe();

      scoresChannel = supabase
        .channel(`scores-${gameId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "scores",
          },
          async () => {
            const { data } = await supabase
              .from("scores")
              .select("*")
              .eq("game_id", gameId)
              .order("points", { ascending: false });

            if (data) {
              setScores(data);
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

      if (scoresChannel) {
        supabase.removeChannel(scoresChannel);
      }
    };
  }, [gameId, activeRoundId]);  

  const currentBuzz =
  buzzes[currentTurn - 1];

  const currentPlayer = players.find((p) =>
    p.user_id === currentBuzz?.user_id
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">
        Código: {code}
      </h1>

      <div className="mt-6 p-4 border rounded">
        <strong>Turno actual:</strong>{" "}
        {currentPlayer?.display_name ??
          "Esperando respuestas"}
      </div>

      <h2 className="mt-6 text-lg font-bold">
        Clasificación General
      </h2>

      <table className="mt-2 border-collapse">
        <thead>
          <tr>
            <th className="pr-6 text-left">
              Pos
            </th>

            <th className="pr-6 text-left">
              Jugador
            </th>

            <th className="text-left">
              Puntos
            </th>
          </tr>
        </thead>

        <tbody>
          {scores.map((score, index) => {
            const player = players.find(
              (p) => p.user_id === score.user_id
            );

            return (
              <tr key={score.user_id}>
                <td>{index + 1}</td>

                <td>
                  {player?.display_name ??
                    "Desconocido"}
                </td>

                <td>{score.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

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
              roundId: activeRoundId,
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

      <button
        onClick={async () => {
          await fetch("/api/incorrect", {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              roundId: activeRoundId,
            }),
          });
        }}
        className="ml-4 bg-yellow-600 text-white px-6 py-3 rounded"
      >
        Incorrecta
      </button>


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