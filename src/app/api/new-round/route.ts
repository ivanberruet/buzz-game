import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request
) {
  const { gameId, roundId } =
    await request.json();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "No autenticado" },
      { status: 401 }
    );
  }

  const { data: game } = await supabase
    .from("games")
    .select("created_by")
    .eq("id", gameId)
    .single();

  if (
    !game ||
    game.created_by !== user.id
  ) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 403 }
    );
  }

  await supabase
    .from("rounds")
    .update({
      status: "closed",
    })
    .eq("id", roundId);

  const { error } = await supabase
    .from("rounds")
    .insert({
      game_id: gameId,
    });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}