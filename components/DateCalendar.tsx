"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { getDateVotes, voteOnDate } from "@/app/actions";

const WEEKDAY_HEADERS = ["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"];
const MONTHS = ["jan","feb","mar","apr","mai","jun","jul","aug","sep","okt","nov","des"];

function toLocalDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Props = {
  activityId: string;
  voterId: string;
  userName: string;
};

export default function DateCalendar({ activityId, voterId, userName }: Props) {
  const [open, setOpen] = useState(false);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const dates = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    }), [today]);

  const todayStr = toLocalDateStr(today);

  // Monday-first weekday (0=Mon … 6=Sun)
  const startOffset = (dates[0].getDay() + 6) % 7;

  useEffect(() => {
    if (!open) return;
    getDateVotes(activityId).then((data) => {
      const counts: Record<string, number> = {};
      const mine = new Set<string>();
      data.forEach(({ date, voterIds }) => {
        counts[date] = voterIds.length;
        if (voterId && voterIds.includes(voterId)) mine.add(date);
      });
      setVoteCounts(counts);
      setMyVotes(mine);
    });
  }, [open, activityId, voterId]);

  function handleClick(dateStr: string) {
    if (!userName || isPending) return;
    const voted = myVotes.has(dateStr);

    // Optimistic update
    setMyVotes((prev) => {
      const next = new Set(prev);
      voted ? next.delete(dateStr) : next.add(dateStr);
      return next;
    });
    setVoteCounts((prev) => ({
      ...prev,
      [dateStr]: Math.max(0, (prev[dateStr] ?? 0) + (voted ? -1 : 1)),
    }));

    startTransition(async () => {
      await voteOnDate(activityId, voterId, dateStr);
    });
  }

  const totalDateVotes = Object.values(voteCounts).reduce((s, n) => s + n, 0);

  return (
    <div className="mt-3 pt-3 border-t border-white/10">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors w-full"
      >
        <span>📅</span>
        <span>Når kan du?</span>
        {totalDateVotes > 0 && !open && (
          <span className="text-[#c77dff] font-semibold">{totalDateVotes} stemmer</span>
        )}
        <span className="ml-auto">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-3">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAY_HEADERS.map((d) => (
              <div key={d} className="text-center text-[9px] text-white/25 font-medium">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells before first day */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {dates.map((date) => {
              const dateStr = toLocalDateStr(date);
              const count = voteCounts[dateStr] ?? 0;
              const isSelected = myVotes.has(dateStr);
              const isToday = dateStr === todayStr;
              // opacity scales linearly, saturates at ~8 votes (35% of team)
              const bgOpacity = count > 0 ? Math.min(0.12 + count * 0.11, 0.88) : 0;

              return (
                <button
                  key={dateStr}
                  onClick={() => handleClick(dateStr)}
                  disabled={!userName || isPending}
                  className={`relative flex flex-col items-center justify-center py-1.5 rounded-lg transition-all disabled:cursor-not-allowed select-none ${
                    isSelected
                      ? "ring-1 ring-[#c77dff]/80"
                      : "hover:ring-1 hover:ring-white/20"
                  } ${!userName ? "opacity-40" : ""}`}
                  style={{
                    backgroundColor:
                      count > 0
                        ? `rgba(199,125,255,${bgOpacity})`
                        : isSelected
                        ? "rgba(199,125,255,0.12)"
                        : "rgba(255,255,255,0.04)",
                  }}
                >
                  <span className={`text-[10px] leading-none font-bold ${isToday ? "text-[#c77dff]" : "text-white/70"}`}>
                    {date.getDate()}
                  </span>
                  <span className="text-[8px] text-white/30 leading-none mt-0.5">
                    {MONTHS[date.getMonth()]}
                  </span>
                  {count > 0 && (
                    <span className="text-[8px] font-bold text-white/60 leading-none mt-0.5">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {!userName && (
            <p className="text-[10px] text-white/30 mt-2 text-center">
              Logg inn for å stemme på dato
            </p>
          )}
        </div>
      )}
    </div>
  );
}
