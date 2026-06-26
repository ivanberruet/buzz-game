type Player = {
  id: string;
  user_id: string;
  display_name: string;
};

type Buzz = {
  user_id: string;
};

type Props = {
  players: Player[];
  buzzes: Buzz[];
};

export default function PlayerList({
  players,
  buzzes,
}: Props) {
  return (
    <>
      <h2 className="mt-6 text-lg">
        Jugadores
      </h2>

      <ul className="mt-3">
        {players.map((player) => (
          <li key={player.id}>
            {player.display_name}

            {buzzes.some(
              (b) =>
                b.user_id === player.user_id
            ) && " ✅"}
          </li>
        ))}
      </ul>
    </>
  );
}