import { joinGame } from "@/actions/join-game";

export default function JoinPage() {
  return (
    <form
      action={joinGame}
      className="flex min-h-screen items-center justify-center gap-3"
    >
      <input
        name="code"
        placeholder="Código"
        className="border p-2 rounded uppercase"
      />

      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Entrar
      </button>
    </form>
  );
}