import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { code } = await request.json();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "Debes iniciar sesión.",
      },
      {
        status: 401,
      }
    );
  }

  const { data: game } = await supabase
    .from("games")
    .select("*")
    .eq("code", code.toUpperCase())
    .single();

  if (!game) {
    return NextResponse.json(
      {
        error:
          "No existe esa partida.",
      },
      {
        status: 404,
      }
    );
  }

  const { data: existing } =
    await supabase
      .from("players")
      .select("id")
      .eq("game_id", game.id)
      .eq("user_id", user.id)
      .maybeSingle();

  if (!existing) {
    const playerName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email ||
      "Jugador";

    await supabase
      .from("players")
      .insert({
        game_id: game.id,
        user_id: user.id,
        display_name: playerName,
      });
  }

  return NextResponse.json({
    success: true,
  });
}