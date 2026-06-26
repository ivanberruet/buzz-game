type Props = {
  currentPlayerName: string;
  noMorePlayers: boolean;
  hasBuzzes: boolean;
};

export default function CurrentTurn({
  currentPlayerName,
  noMorePlayers,
  hasBuzzes,
}: Props) {
  return (
    <div className="mt-6 p-4 border rounded">
      <strong>Turno actual:</strong>{" "}

      {!hasBuzzes
        ? "Esperando respuestas"
        : noMorePlayers
        ? "No quedan participantes"
        : currentPlayerName}
    </div>
  );
}