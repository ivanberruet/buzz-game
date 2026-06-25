import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request
) {
  const { gameId } = await request.json();

  const supabase = await createClient();

  const { error } = await supabase
    .from("games")
    .update({
      status: "finished",
    })
    .eq("id", gameId);

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