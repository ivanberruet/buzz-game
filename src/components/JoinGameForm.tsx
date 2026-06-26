"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinGameForm() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function joinGame() {
    setLoading(true);
    setError("");

    const response = await fetch(
      "/api/join",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          code,
        }),
      }
    );

    const result =
      await response.json();

    setLoading(false);

    if (!response.ok) {
      setError(result.error);
      return;
    }

    router.push(
      `/lobby/${code.toUpperCase()}`
    );
  }

  return (
    <div className="flex flex-col gap-2">

      <div>

        <input
          value={code}
          onChange={(e) =>
            setCode(
              e.target.value.toUpperCase()
            )
          }
          placeholder="Código"
          className="border p-2 rounded uppercase"
        />

        <button
          onClick={joinGame}
          disabled={loading}
          className="ml-2 bg-green-600 text-white px-4 py-2 rounded"
        >
          {loading
            ? "Uniéndose..."
            : "Unirse"}
        </button>

      </div>

      {error && (
        <span className="text-red-500 text-sm">
          {error}
        </span>
      )}

    </div>
  );
}