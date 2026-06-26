"use client";

import { useState } from "react";

type Props = {
  roundId: string;
  alreadyBuzzed: boolean;
};

export default function BuzzButton({
  roundId,
  alreadyBuzzed,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleBuzz() {
    if (loading || alreadyBuzzed) return;

    setLoading(true);

    try {
      const response = await fetch("/api/buzz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roundId,
        }),
      });

      await response.json();
    } finally {
      setLoading(false);
    }
  }

  const enabled = !alreadyBuzzed && !loading;

  return (
    <div className="flex justify-center my-10">
      <button
        onClick={handleBuzz}
        disabled={!enabled}
        className={`
          w-64
          h-64
          rounded-full
          text-white
          font-extrabold
          text-5xl
          shadow-2xl
          transition-all
          duration-200
          select-none
          active:scale-95
          ${
            enabled
              ? "bg-red-600 hover:bg-red-700 hover:scale-105 animate-buzz"
              : "bg-green-600 cursor-not-allowed opacity-90"
          }
        `}
      >
        {loading
          ? "..."
          : alreadyBuzzed
          ? "✓"
          : "BUZZ"}
      </button>
    </div>
  );
}