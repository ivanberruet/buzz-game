"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function joinGame(formData: FormData) {
  const code = String(formData.get("code") || "")
    .trim()
    .toUpperCase();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  const { data: game } = await supabase
    .from("games")
    .select("*")
    .eq("code", code)
    .single();

  if (!game) {
    throw new Error("Partida no encontrada");
  }

  const playerName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email ||
    "Jugador";

  const { data: existingPlayer } = await supabase
    .from("players")
    .select("id")
    .eq("game_id", game.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingPlayer) {
    await supabase.from("players").insert({
      game_id: game.id,
      user_id: user.id,
      display_name: playerName,
    });
  }

  redirect(`/lobby/${code}`);
}