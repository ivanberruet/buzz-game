import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { roundId } = await request.json();
  
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Usuario no autenticado" },
      { status: 401 }
    );
  }

  const { data: existing } = await supabase
    .from("buzzes")
    .select("id")
    .eq("round_id", roundId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase
      .from("buzzes")
      .insert({
        round_id: roundId,
        user_id: user.id,
      });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: true,
  });
}