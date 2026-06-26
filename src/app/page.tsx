import LoginButton from "@/components/LoginButton";
import { createClient } from "@/lib/supabase/server";
import { createGame } from "@/actions/game-actions";
import JoinGameForm from "@/components/JoinGameForm";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoginButton />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">

      <p>
        Hola {user.user_metadata?.full_name}
      </p>

      <form action={createGame}>
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded"
        >
          Crear partida
        </button>
      </form>

      <div>o</div>

      <JoinGameForm />

    </main>
  );
}