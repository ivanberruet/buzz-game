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

  const { error: roundError } = await supabase
  .from("rounds")
  .insert({
    game_id: game.id,
  });

  if (roundError) {
    throw roundError;
  }

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

export async function buzz(roundId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const { data: existing } = await supabase
    .from("buzzes")
    .select("id")
    .eq("round_id", roundId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return;
  }

  const { error } = await supabase
    .from("buzzes")
    .insert({
      round_id: roundId,
      user_id: user.id,
    });

  if (error) {
    throw error;
  }
}