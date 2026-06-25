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
  gameStatus: string;
  hostName: string;
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

type RoundResult = {
  id: string;
  winner_user_id: string;
};

export default function LobbyClient({
  gameId,
  roundId,
  currentPosition,
  code,
  initialPlayers,
  isHost,
  gameStatus: initialGameStatus,
  hostName
}: Props) {
  const [players, setPlayers] = useState(initialPlayers);
  
  const [buzzes, setBuzzes] = useState<Buzz[]>([]);

  const [scores, setScores] = useState<Score[]>([]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [activeRoundId, setActiveRoundId] = useState(roundId);

  const [currentTurn, setCurrentTurn] = useState(currentPosition);

  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);

  const [gameStatus, setGameStatus] = useState(initialGameStatus);

  const alreadyBuzzed = buzzes.some(
    (buzz) => buzz.user_id === currentUserId
  );

  const sortedScores = [...scores].sort(
    (a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }

      const playerA = players.find(
        (p) => p.user_id === a.user_id
      );

      const playerB = players.find(
        (p) => p.user_id === b.user_id
      );

      return (
        playerA?.display_name ?? ""
      ).localeCompare(
        playerB?.display_name ?? ""
      );
    }
  );


  useEffect(() => {
    const supabase = createClient();

    let channel: ReturnType<typeof supabase.channel>;
    let buzzChannel: ReturnType<typeof supabase.channel>;
    let roundsChannel: ReturnType<typeof supabase.channel>;
    let scoresChannel: ReturnType<typeof supabase.channel>;
    let resultsChannel: ReturnType<typeof supabase.channel>;
    let gameChannel: ReturnType<typeof supabase.channel>;

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

      //RESULTS
      const { data: results } = await supabase
        .from("round_results")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at");

      if (results) {
        setRoundResults(results);
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

      resultsChannel = supabase
        .channel(`results-${gameId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "round_results",
          },
          async () => {
            const { data } = await supabase
              .from("round_results")
              .select("*")
              .eq("game_id", gameId)
              .order("created_at");

            if (data) {
              setRoundResults(data);
            }
          }
        )
        .subscribe();
        
      gameChannel = supabase
        .channel(`game-${gameId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "games",
          },
          async () => {
            const { data } = await supabase
              .from("games")
              .select("status")
              .eq("id", gameId)
              .single();

            if (data) {
              setGameStatus(data.status);
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

      if (resultsChannel) {
        supabase.removeChannel(resultsChannel);
      }

      if (gameChannel) {
        supabase.removeChannel(gameChannel);
      }
    };
  }, [gameId, activeRoundId]);  

  const currentBuzz = buzzes[currentTurn - 1];

  const currentPlayer = players.find((p) =>
    p.user_id === currentBuzz?.user_id
  );

  const leader = sortedScores[0];

  const leaderPlayer = players.find(
    (p) => p.user_id === leader?.user_id
  );

  const roundFinished = gameStatus === "finished";


  if (gameStatus === "finished") {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold">
          🏆 Resultado Final
        </h1>

        <table className="mt-6">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Jugador</th>
              <th>Puntos</th>
            </tr>
          </thead>

          <tbody>
            {sortedScores.map((score, index) => {
              const player = players.find(
                (p) =>
                  p.user_id === score.user_id
              );

              return (
                <tr
                  key={score.user_id}
                >
                  <td>{index + 1}</td>

                  <td>
                    {player?.display_name}
                  </td>

                  <td>{score.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="p-8">
      <p className="text-gray-400">
        👑 Host: {hostName}
      </p>

      <h1 className="text-2xl font-bold">
        Código: {code}
      </h1>

      <div className="mt-6 p-4 border rounded bg-yellow-100 text-black">
        🎤 Respondiendo:
        <strong className="ml-2">
          {currentPlayer?.display_name ??
            "Esperando respuestas"}
        </strong>
      </div>

      <h2 className="mt-6 text-lg font-bold">
        Clasificación General
      </h2>

      <div className="mt-3 p-3 border rounded">
        🏆 Líder actual:
        <strong className="ml-2">
          {leaderPlayer?.display_name ??
            "Sin líder"}
        </strong>
        {" "}
        ({leader?.points ?? 0} pts)
      </div>

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
          {sortedScores.map((score, index) => {
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

      <h2 className="mt-8 text-lg font-bold">
        Historial de rondas
      </h2>

      <ul className="mt-3">
        {roundResults.map((result, index) => {
          const player = players.find(
            (p) =>
              p.user_id === result.winner_user_id
          );

          return (
            <li key={result.id}>
              Ronda {index + 1}:{" "}
              {player?.display_name}
            </li>
          );
        })}
      </ul>

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
        disabled={alreadyBuzzed || roundFinished}
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
        {
          roundFinished
            ? "Partida finalizada"
            : alreadyBuzzed
              ? "Ya respondiste"
              : "BUZZ"
        }
      </button>

      {isHost && (
        <>
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

        <button
          onClick={async () => {
            const response =
              await fetch(
                "/api/correct",
                {
                  method: "POST",
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                  body: JSON.stringify({
                    gameId,
                    roundId:
                      activeRoundId,
                  }),
                }
              );

            const result =
              await response.json();

            console.log(result);
            console.log('CORRECT ROUND', activeRoundId)
          }}
          className="ml-4 bg-green-600 text-white px-6 py-3 rounded"
        >
          Correcta
        </button>

        <button
          onClick={async () => {
            await fetch(
              "/api/finish-game",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  gameId,
                }),
              }
            );
          }}
          className="ml-4 bg-black text-white px-6 py-3 rounded"
        >
          Finalizar partida
        </button>

        </>
      )}
    
      <h2 className="mt-8 text-lg font-bold">
        Orden de respuesta
      </h2>

      <ol className="mt-3 space-y-1 border rounded p-3">
        {buzzes.map((buzz, index) => {
          const player = players.find(
            (p) => p.user_id === buzz.user_id
          );

          const medal =
            index === 0 ? "🥇" :
            index === 1 ? "🥈" :
            index === 2 ? "🥉" :
            `${index + 1}.`;

          const firstBuzzTime =
            buzzes.length > 0
              ? new Date(buzzes[0].pressed_at).getTime()
              : 0;

          const diffMs =
            new Date(buzz.pressed_at).getTime() -
            firstBuzzTime;

          const diffText =
            index === 0
              ? "—"
              : `+${(diffMs / 1000).toFixed(3)}s`;

          const isCurrentTurn = index === currentTurn - 1;

          return (
            <li
              key={buzz.id}
              className={`flex justify-between items-center p-2 rounded ${
                isCurrentTurn
                  ? "font-bold bg-yellow-100 text-black p-2 rounded"
                  : ""
              }`}
            >
              <span>
                {medal} {player?.display_name ?? "Jugador"}
              </span>

              <span className="text-gray-500">
                {diffText}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}