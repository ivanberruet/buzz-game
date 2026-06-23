import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");

  console.log("CALLBACK CODE:", code);

  if (code) {
    const supabase = await createClient();

    const result = await supabase.auth.exchangeCodeForSession(code);

    console.log("SESSION RESULT:", result);
  }

  return NextResponse.redirect(origin);
}