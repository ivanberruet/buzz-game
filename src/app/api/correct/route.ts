import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request
) {
  const {
    gameId,
    roundId,
  } = await request.json();

  const supabase =
    await createClient();

  const { data: round } =
    await supabase
      .from("rounds")
      .select("*")
      .eq("id", roundId)
      .single();

  if (!round) {
    return NextResponse.json(
      { error: "Round not found" },
      { status: 404 }
    );
  }

  const { data: buzzes } =
    await supabase
      .from("buzzes")
      .select("*")
      .eq("round_id", roundId)
      .order("pressed_at");

  const winner =
    buzzes?.[
      round.current_position - 1
    ];

  if (!winner) {
    return NextResponse.json(
      { error: "No winner" },
      { status: 400 }
    );
  }

  const { data: score } =
    await supabase
      .from("scores")
      .select("*")
      .eq("game_id", gameId)
      .eq("user_id", winner.user_id)
      .maybeSingle();

  if (score) {
    await supabase
      .from("scores")
      .update({
        points: score.points + 1,
      })
      .eq("id", score.id);
  } else {
    await supabase
      .from("scores")
      .insert({
        game_id: gameId,
        user_id: winner.user_id,
        points: 1,
      });
  }

  await supabase
    .from("rounds")
    .update({
      status: "finished",
    })
    .eq("id", roundId);

  await supabase
    .from("rounds")
    .insert({
      game_id: gameId,
      status: "active",
      current_position: 1,
    });

  return NextResponse.json({
    success: true,
  });
}