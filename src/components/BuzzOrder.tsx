type Player = {
  user_id: string;
  display_name: string;
};

type Buzz = {
  id: string;
  user_id: string;
  pressed_at: string;
};

type Props = {
  players: Player[];
  buzzes: Buzz[];
};

export default function BuzzOrder({
  players,
  buzzes,
}: Props) {
  if (buzzes.length === 0) {
    return null;
  }

  function formatDiff(ms: number) {
    if (ms < 1000) {
      return `+${Math.round(ms)} ms`;
    }

    return `+${(ms / 1000).toFixed(3)} s`;
  }

  return (
    <>
      <h2 className="mt-8 text-lg font-bold">
        Orden de respuesta
      </h2>

      <table className="mt-3 min-w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">
              Pos
            </th>

            <th className="text-left py-2">
              Jugador
            </th>

            <th className="text-right py-2">
              Diferencia
            </th>
          </tr>
        </thead>

        <tbody>
          {buzzes.map((buzz, index) => {
            const player = players.find(
              (p) => p.user_id === buzz.user_id
            );

            const previousBuzz =
              index > 0
                ? buzzes[index - 1]
                : null;

            const diff =
              previousBuzz
                ? new Date(buzz.pressed_at).getTime() -
                  new Date(previousBuzz.pressed_at).getTime()
                : 0;

            const medal =
              index === 0
                ? "🥇"
                : index === 1
                ? "🥈"
                : index === 2
                ? "🥉"
                : `${index + 1}`;

            return (
              <tr
                key={buzz.id}
                className="border-b"
              >
                <td className="py-2">
                  {medal}
                </td>

                <td>
                  {player?.display_name ??
                    "Jugador"}
                </td>

                <td className="text-right">
                  {index === 0
                    ? "—"
                    : formatDiff(diff)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}