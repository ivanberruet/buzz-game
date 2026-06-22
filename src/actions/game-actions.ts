"use server";

import { createClient } from "@/lib/supabase/server";
import { generateGameCode } from "@/lib/game-code";
import { redirect } from "next/navigation";

export async function createGame() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const code = generateGameCode();

  const { data: game, error } = await supabase
    .from("games")
    .insert({
      code,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  const playerName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email ||
    "Jugador";

  await supabase.from("players").insert({
    game_id: game.id,
    user_id: user.id,
    display_name: playerName,
  });

  redirect(`/lobby/${code}`);
}