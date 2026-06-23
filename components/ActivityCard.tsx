"use client";

import { useState, useTransition } from "react";
import { toggleVote } from "@/app/actions";

type Props = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  addedBy: string;
  voteCount: number;
  hasVoted: boolean;
  voterId: string;
  index: number;
};

export default function ActivityCard({
  id,
  title,
  description,
  emoji,
  addedBy,
  voteCount,
  hasVoted,
  voterId,
  index,
}: Props) {
  const [optimisticVoted, setOptimisticVoted] = useState(hasVoted);
  const [optimisticCount, setOptimisticCount] = useState(voteCount);
  const [isPending, startTransition] = useTransition();

  function handleVote() {
    const prevVoted = optimisticVoted;
    const nextVoted = !prevVoted;
    setOptimisticVoted(nextVoted);
    setOptimisticCount((c) => (nextVoted ? c + 1 : c - 1));

    startTransition(async () => {
      const result = await toggleVote(id, voterId, prevVoted);
      if (result.error) {
        // Roll back optimistic update
        setOptimisticVoted(prevVoted);
        setOptimisticCount((c) => (nextVoted ? c - 1 : c + 1));
      }
    });
  }

  return (
    <div
      className="glass glass-hover rounded-2xl p-5 flex gap-4 items-start slide-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Emoji */}
      <div className="text-3xl shrink-0 mt-0.5 select-none">{emoji}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-lg text-white leading-tight">{title}</h3>
        {description && (
          <p className="text-sm text-white/50 mt-1 leading-relaxed">{description}</p>
        )}
        <p className="text-xs text-white/30 mt-2">Foreslått av {addedBy}</p>
      </div>

      {/* Vote */}
      <button
        onClick={handleVote}
        disabled={isPending}
        className={`vote-btn shrink-0 flex flex-col items-center gap-1 rounded-xl border px-3 py-2 min-w-[52px] ${
          optimisticVoted
            ? "voted text-white border-transparent shadow-[0_0_20px_rgba(199,125,255,0.3)]"
            : "border-white/10 text-white/60 hover:border-white/20 hover:text-white bg-white/[0.03]"
        }`}
      >
        <span className="text-lg leading-none">{optimisticVoted ? "💜" : "🤍"}</span>
        <span className="text-sm font-bold leading-none">{optimisticCount}</span>
      </button>
    </div>
  );
}
