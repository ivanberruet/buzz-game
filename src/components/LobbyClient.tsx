"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CurrentTurn from "./CurrentTurn";
import LeaderCard from "./LeaderCard";
import RankingTable from "./RankingTable";
import PlayerList from "./PlayerList";
import HostPanel from "./HostPanel";
import BuzzOrder from "./BuzzOrder";
import BuzzButton from "./BuzzButton";
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
        .gt("points", 0)
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
              .gt("points", 0)
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

  const noMorePlayers = buzzes.length > 0 && currentTurn > buzzes.length;

  const leader = sortedScores[0];

  const leaderPlayer = players.find(
    (p) => p.user_id === leader?.user_id
  );

  const roundFinished = gameStatus === "finished";

  const playersWithScores = players
    .map((player) => {
      const score = scores.find(
        (s) => s.user_id === player.user_id
      );

      return {
        user_id: player.user_id,
        display_name: player.display_name,
        points: score?.points ?? 0,
      };
    })
    .sort((a, b) => b.points - a.points);

  const maxPoints = Math.max(
    ...playersWithScores.map((p) => p.points),
    0
  );

  const leaders =
    maxPoints === 0
      ? []
      : playersWithScores.filter(
          (p) => p.points === maxPoints
        );

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
      <h1 className="text-2xl font-bold">
        Código: {code}
      </h1>

      <CurrentTurn
        currentPlayerName={
          currentPlayer?.display_name ??
          "Esperando respuestas"
        }
        noMorePlayers={noMorePlayers}
        hasBuzzes={buzzes.length > 0}
      />

      <LeaderCard
        leaders={leaders}
      />

      <RankingTable
        players={playersWithScores}
      />

      <p className="mt-2 text-gray-500">
        Ronda: {activeRoundId.slice(0, 8)}
      </p>

      <PlayerList
        players={players}
        buzzes={buzzes}
      />

      <BuzzButton
        roundId={activeRoundId}
        alreadyBuzzed={alreadyBuzzed}
      />

      {isHost && (
        <HostPanel
          gameId={gameId}
          roundId={activeRoundId}
          currentTurn={currentTurn}
          buzzCount={buzzes.length}
          noMorePlayers={noMorePlayers}
        />
      )}

      <BuzzOrder
        players={players}
        buzzes={buzzes}
      />
    </div>
  );}