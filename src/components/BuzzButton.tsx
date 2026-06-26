"use client";

import { useEffect, useState } from "react";

type Props = {
  roundId: string;
  alreadyBuzzed: boolean;
};

export default function BuzzButton({
  roundId,
  alreadyBuzzed,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || alreadyBuzzed || submitted;

  useEffect(() => {
    setSubmitted(false);
  }, [roundId]);

  return (
    <div className="flex justify-center my-10">
      <button
        onClick={handleBuzz}
        disabled={disabled}
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
          hover:cursor-pointer
          ${
            !disabled
              ? "bg-red-600 hover:bg-red-700 hover:scale-105 animate-buzz"
              : "bg-green-600 cursor-not-allowed opacity-90"
          }
        `}
      >
        {loading
          ? "..."
          : alreadyBuzzed || submitted
          ? "✓"
          : "BUZZ"}
      </button>
    </div>
  );
}