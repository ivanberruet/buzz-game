"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginButton() {
  const signInWithGoogle = async () => {
    const supabase = createClient();

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <button
      onClick={signInWithGoogle}
      className="px-4 py-2 rounded bg-blue-600 text-white"
    >
      Ingresar con Google
    </button>
  );
}