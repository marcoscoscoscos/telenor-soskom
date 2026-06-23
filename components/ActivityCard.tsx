"use client";

import { useState, useTransition } from "react";
import { rateActivity, removeActivity } from "@/app/actions";

type Props = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  addedBy: string;
  activityVoterId: string | null;
  voteCount: number;
  ratingCount: number;
  userRating: number; // 0 = not rated
  voterId: string;
  userName: string;
  index: number;
};

function StarPicker({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex gap-0.5" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star === value ? 0 : star)}
          onMouseEnter={() => setHovered(star)}
          className={`text-xl leading-none transition-all duration-100 disabled:cursor-default ${
            star <= active
              ? "text-yellow-400 scale-110"
              : "text-white/20 hover:text-white/40"
          }`}
          style={{ transform: star <= active ? "scale(1.15)" : "scale(1)" }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ActivityCard({
  id,
  title,
  description,
  emoji,
  addedBy,
  activityVoterId,
  voteCount,
  ratingCount,
  userRating,
  voterId,
  userName,
  index,
}: Props) {
  const [optimisticRating, setOptimisticRating] = useState(userRating);
  const [optimisticTotal, setOptimisticTotal] = useState(voteCount);
  const [optimisticCount, setOptimisticCount] = useState(ratingCount);
  const [isRating, startRating] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  // Match by voter_id (new activities) or by name (old activities before voter_id was added)
  const isOwner =
    (voterId && activityVoterId && activityVoterId === voterId) ||
    (userName && addedBy && addedBy.toLowerCase() === userName.toLowerCase());

  function handleRate(stars: number) {
    const prev = optimisticRating;
    const starDiff = stars - prev; // can be negative, zero, or positive
    setOptimisticRating(stars);
    setOptimisticTotal((t) => Math.max(0, t + starDiff));
    if (prev === 0 && stars > 0) setOptimisticCount((c) => c + 1);
    if (prev > 0 && stars === 0) setOptimisticCount((c) => Math.max(0, c - 1));

    startRating(async () => {
      const result = await rateActivity(id, voterId, stars);
      if (result.error) {
        setOptimisticRating(prev);
        setOptimisticTotal((t) => Math.max(0, t - starDiff));
        if (prev === 0 && stars > 0) setOptimisticCount((c) => Math.max(0, c - 1));
        if (prev > 0 && stars === 0) setOptimisticCount((c) => c + 1);
      }
    });
  }

  function handleDelete() {
    startDeleting(async () => {
      await removeActivity(id, voterId);
    });
  }

  if (isDeleting) return null;

  return (
    <div
      className="glass glass-hover rounded-2xl p-5 slide-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex gap-4 items-start">
        {/* Emoji */}
        <div className="text-3xl shrink-0 mt-0.5 select-none">{emoji}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-lg text-white leading-tight">{title}</h3>
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="shrink-0 text-white/20 hover:text-red-400 transition-colors text-sm mt-0.5"
                title="Slett aktivitet"
              >
                🗑
              </button>
            )}
          </div>
          {description && (
            <p className="text-sm text-white/50 mt-1 leading-relaxed">{description}</p>
          )}
          <p className="text-xs text-white/25 mt-1.5">Foreslått av {addedBy}</p>
        </div>
      </div>

      {/* Star rating row */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <StarPicker
          value={optimisticRating}
          onChange={handleRate}
          disabled={isRating}
        />
        <div className="text-xs text-white/35 text-right">
          {optimisticCount > 0 ? (
            <>
              <span className="text-yellow-400 font-semibold">{optimisticTotal} ⭐</span>
              {" "}fra {optimisticCount} {optimisticCount === 1 ? "person" : "personer"}
            </>
          ) : (
            <span className="text-white/25">Ingen har stemt ennå</span>
          )}
        </div>
      </div>
    </div>
  );
}
