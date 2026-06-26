type Player = {
  user_id: string;
  display_name: string;
};

type Buzz = {
  id: string;
  user_id: string;
};

type Props = {
  players: Player[];
  buzzes: Buzz[];
};

export default function BuzzOrder({
  players,
  buzzes,
}: Props) {
  return (
    <>
      <h2 className="mt-8 text-lg font-bold">
        Orden de respuesta
      </h2>

      <ol className="mt-3 space-y-2">
        {buzzes.map((buzz, index) => {
          const player = players.find(
            (p) =>
              p.user_id === buzz.user_id
          );

          const medal =
            index === 0
              ? "🥇"
              : index === 1
              ? "🥈"
              : index === 2
              ? "🥉"
              : `${index + 1}.`;

          return (
            <li key={buzz.id}>
              {medal}{" "}
              {player?.display_name ??
                "Jugador"}
            </li>
          );
        })}
      </ol>
    </>
  );
}