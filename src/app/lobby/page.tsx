import { createClient } from "@/lib/supabase/server";

export default async function LobbyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <pre>
      {JSON.stringify(user, null, 2)}
    </pre>
  );
}