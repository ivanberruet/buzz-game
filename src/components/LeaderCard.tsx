type Leader = {
  user_id: string;
  display_name: string;
  points: number;
};

type Props = {
  leaders: Leader[];
};

export default function LeaderCard({
  leaders,
}: Props) {
  return (
    <div className="mt-6 p-4 border rounded">
      <h2 className="font-bold">
        Líder actual
      </h2>

      <p className="mt-2">
        {leaders.length === 0
          ? "Sin líder"
          : leaders
              .map((l) => l.display_name)
              .join(", ")}
      </p>
    </div>
  );
}