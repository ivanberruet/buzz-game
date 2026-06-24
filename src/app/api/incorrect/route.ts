import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request
) {
  const { roundId } =
    await request.json();

  const supabase =
    await createClient();

  const { data: round } =
    await supabase
      .from("rounds")
      .select("current_position")
      .eq("id", roundId)
      .single();

  if (!round) {
    return NextResponse.json(
      { error: "Round not found" },
      { status: 404 }
    );
  }

  const { error } =
    await supabase
      .from("rounds")
      .update({
        current_position:
          round.current_position + 1,
      })
      .eq("id", roundId);

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