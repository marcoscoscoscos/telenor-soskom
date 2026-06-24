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

// Interpolate between two colours based on t (0–1)
function lerpColor(
  from: [number, number, number, number],
  to: [number, number, number, number],
  t: number
) {
  const r = Math.round(from[0] + (to[0] - from[0]) * t);
  const g = Math.round(from[1] + (to[1] - from[1]) * t);
  const b = Math.round(from[2] + (to[2] - from[2]) * t);
  const a = +(from[3] + (to[3] - from[3]) * t).toFixed(2);
  return `rgba(${r},${g},${b},${a})`;
}

// when2meet-style scale: near-transparent lavender → solid bright purple
const COLOR_EMPTY: [number, number, number, number] = [199, 125, 255, 0.05];
const COLOR_FULL:  [number, number, number, number] = [220, 160, 255, 0.92];

type Props = {
  activityId: string;
  voterId: string;
  userName: string;
};

export default function DateCalendar({ activityId, voterId, userName }: Props) {
  const [open, setOpen] = useState(false);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());
  const [uniquePersonCount, setUniquePersonCount] = useState(0);
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
  const startOffset = (dates[0].getDay() + 6) % 7; // Monday = 0

  // Fetch full data on mount — populates badge and calendar in one go
  useEffect(() => {
    getDateVotes(activityId).then((data) => {
      const counts: Record<string, number> = {};
      const mine = new Set<string>();
      const allVoters = new Set<string>();
      data.forEach(({ date, voterIds }) => {
        counts[date] = voterIds.length;
        if (voterId && voterIds.includes(voterId)) mine.add(date);
        voterIds.forEach((id) => allVoters.add(id));
      });
      setVoteCounts(counts);
      setMyVotes(mine);
      setUniquePersonCount(allVoters.size);
    });
  }, [activityId, voterId]);

  function handleClick(dateStr: string) {
    if (!userName) return;
    const voted = myVotes.has(dateStr);

    // Optimistically track unique person count:
    // first vote added → +1, last vote removed → -1
    if (!voted && myVotes.size === 0) setUniquePersonCount((c) => c + 1);
    if (voted && myVotes.size === 1) setUniquePersonCount((c) => Math.max(0, c - 1));

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

  const maxDateVotes = Math.max(...Object.values(voteCounts), 1);
  const topDate = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="mt-3 pt-3 border-t border-white/10">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm text-white hover:bg-white/8 transition-all w-full rounded-lg px-2 py-1.5 -mx-2 group"
      >
        <span className="group-hover:scale-110 transition-transform">📅</span>
        <span className="font-medium">Når kan du?</span>
        {uniquePersonCount > 0 && (
          <span className="text-[#c77dff]/60 group-hover:text-[#c77dff] font-semibold ml-1 transition-colors">{uniquePersonCount} svar</span>
        )}
        <span className="ml-auto text-white/45 group-hover:text-white/80 transition-colors">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-3">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-1.5">
            {WEEKDAY_HEADERS.map((d) => (
              <div key={d} className="text-center text-[11px] text-white/55 font-semibold tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {dates.map((date) => {
              const dateStr = toLocalDateStr(date);
              const count = voteCounts[dateStr] ?? 0;
              const isSelected = myVotes.has(dateStr);
              const isToday = dateStr === todayStr;
              const isTop = dateStr === topDate && count > 0;
              const ratio = count / maxDateVotes;
              const bgColor = count > 0
                ? lerpColor(COLOR_EMPTY, COLOR_FULL, ratio)
                : "rgba(255,255,255,0.04)";

              // Switch to dark text when background is bright (ratio > 0.4)
              const useDarkText = ratio > 0.4;
              const textColor = useDarkText ? "rgb(15,2,35)" : "rgb(255,255,255)";
              const textOpacity = count > 0 ? 1 : 0.55;

              return (
                <button
                  key={dateStr}
                  onClick={() => handleClick(dateStr)}
                  disabled={!userName}
                  title={count > 0 ? `${count} ${count === 1 ? "person" : "personer"}` : ""}
                  className={`relative flex flex-col items-center justify-center py-2 rounded-lg transition-all duration-150 disabled:cursor-not-allowed select-none ${
                    isSelected ? "shadow-[inset_0_0_0_2px_rgba(255,255,255,0.9)]" : "hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]"
                  } ${!userName ? "opacity-40" : ""}`}
                  style={{ backgroundColor: bgColor }}
                >
                  {isTop && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white" />
                  )}
                  <span
                    className={`text-[13px] font-bold leading-none ${isToday && !useDarkText ? "text-[#c77dff]" : ""}`}
                    style={{ opacity: textOpacity, color: textColor }}
                  >
                    {date.getDate()}
                  </span>
                  <span className="text-[10px] leading-none mt-0.5" style={{ opacity: textOpacity * 0.8, color: textColor }}>
                    {MONTHS[date.getMonth()]}
                  </span>
                  <span
                    className="text-[11px] font-bold leading-none mt-1"
                    style={{ opacity: count > 0 ? 0.5 : 0, color: textColor }}
                  >
                    {count || 0}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-0.5">
              {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                <div
                  key={t}
                  className="w-4 h-3 rounded-sm"
                  style={{ backgroundColor: lerpColor(COLOR_EMPTY, COLOR_FULL, t) }}
                />
              ))}
            </div>
            <span className="text-[11px] text-white/50">Færre → Flest</span>
            {!userName && (
              <span className="text-[11px] text-white/50 ml-auto">Logg inn for å stemme</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
