"use client";

type Props = {
  gameId: string;
  roundId: string;
  currentTurn: number;
  buzzCount: number;
  noMorePlayers: boolean;
};

export default function HostPanel({
  gameId,
  roundId,
  currentTurn,
  buzzCount,
  noMorePlayers,
}: Props) {
  return (
    <div className="mt-8 border rounded-lg p-4">
      <h2 className="text-lg font-bold mb-4">
        Panel del Host
      </h2>

      <div className="flex flex-wrap gap-3">

        {buzzCount > 0 && !noMorePlayers && (
          <>
            <button
              onClick={async () => {
                await fetch("/api/correct", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    gameId,
                    roundId,
                  }),
                });
              }}
              className="bg-green-600 text-white px-5 py-2 rounded"
            >
              ✅ Correcta
            </button>

            <button
              onClick={async () => {
                await fetch("/api/incorrect", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    roundId,
                    currentTurn,
                  }),
                });
              }}
              className="bg-yellow-500 text-white px-5 py-2 rounded"
            >
              ❌ Incorrecta
            </button>
          </>
        )}

        <button
          onClick={async () => {
            await fetch("/api/new-round", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                gameId,
                roundId,
              }),
            });
          }}
          className="bg-blue-600 text-white px-5 py-2 rounded"
        >
          🔄 Nueva ronda
        </button>

        <button
          onClick={async () => {
            await fetch("/api/finish-game", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                gameId,
              }),
            });
          }}
          className="bg-red-700 text-white px-5 py-2 rounded"
        >
          🏁 Finalizar partida
        </button>

      </div>
    </div>
  );
}