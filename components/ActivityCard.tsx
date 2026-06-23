"use client";

import { useState, useEffect, useTransition } from "react";
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
  userRating: number;
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
              ? "text-yellow-400"
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

  // Sync when server data arrives (e.g. after page reload loads userRatings async)
  useEffect(() => { setOptimisticRating(userRating); }, [userRating]);
  useEffect(() => { setOptimisticTotal(voteCount); }, [voteCount]);
  useEffect(() => { setOptimisticCount(ratingCount); }, [ratingCount]);
  const [isDeleting, startDeleting] = useTransition();
  const [confirming, setConfirming] = useState(false);

  // voter_id match = definitive owner; name match = fallback for old activities;
  // null voter_id = activity predates tracking, anyone can clean it up
  const isOwner =
    (voterId && activityVoterId && activityVoterId === voterId) ||
    (userName && addedBy && addedBy.toLowerCase() === userName.toLowerCase()) ||
    activityVoterId === null;

  function handleRate(stars: number) {
    const prev = optimisticRating;
    const starDiff = stars - prev;
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
      await removeActivity(id);
    });
  }

  if (isDeleting) return null;

  return (
    <div
      className="glass glass-hover rounded-2xl p-5 slide-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex gap-4 items-start">
        <div className="text-3xl shrink-0 mt-0.5 select-none">{emoji}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-lg text-white leading-tight">{title}</h3>

            {isOwner && (
              <div className="shrink-0 flex items-center gap-1.5 mt-0.5">
                {confirming ? (
                  <>
                    <button
                      onClick={handleDelete}
                      className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors bg-red-400/10 hover:bg-red-400/20 rounded-lg px-2 py-0.5"
                    >
                      Slett
                    </button>
                    <button
                      onClick={() => setConfirming(false)}
                      className="text-xs text-white/30 hover:text-white/60 transition-colors"
                    >
                      Avbryt
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirming(true)}
                    className="text-white/20 hover:text-red-400 transition-colors text-base leading-none"
                    title="Slett aktivitet"
                  >
                    🗑
                  </button>
                )}
              </div>
            )}
          </div>

          {description && (
            <p className="text-sm text-white/50 mt-1 leading-relaxed">{description}</p>
          )}
          <p className="text-xs text-white/25 mt-1.5">Foreslått av {addedBy}</p>
        </div>
      </div>

      <div className={`mt-4 transition-opacity ${!userName ? "opacity-30 pointer-events-none select-none" : ""}`}>
        <div className="flex items-center justify-between gap-3">
          <StarPicker value={optimisticRating} onChange={handleRate} disabled={isRating || !userName} />
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
    </div>
  );
}
