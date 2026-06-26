type RankingPlayer = {
  display_name: string;
  points: number;
};

type Props = {
  players: RankingPlayer[];
};

export default function RankingTable({
  players,
}: Props) {
  return (
    <>
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
          {players.map(
            (player, index) => (
              <tr
                key={player.display_name}
              >
                <td>{index + 1}</td>

                <td>
                  {player.display_name}
                </td>

                <td>
                  {player.points}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </>
  );
}