"use client";

import { useEffect, useMemo, useState } from "react";
import ActivityCard from "./ActivityCard";
import AddActivityModal from "./AddActivityModal";
import CursorTooltip from "./CursorTooltip";
import type { Activity } from "@/lib/db";
import { getUserRatings } from "@/app/actions";

type RGB = [number, number, number];

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * Math.min(Math.max(t, 0), 1));
}
function lerpColor(from: RGB, to: RGB, t: number) {
  return `rgb(${lerp(from[0],to[0],t)},${lerp(from[1],to[1],t)},${lerp(from[2],to[2],t)})`;
}

// low-energy → high-energy colours for each blob
const BLOB_PALETTES: [RGB, RGB][] = [
  [[90, 40, 140],  [224, 64, 251]],   // purple
  [[150, 40, 80],  [255, 26, 110]],   // pink
  [[150, 90, 20],  [255, 160, 0]],    // orange
  [[15, 90, 90],   [6, 214, 160]],    // teal
];

type Props = {
  activities: Activity[];
};

export default function ActivitiesClient({ activities }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [userName, setUserName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});

  // voter_id is derived directly from the name — same name = same identity everywhere
  const voterId = userName.toLowerCase().trim();
  const hasName = !!userName;

  // Stable display order: set once on first load, never re-sorted while the user is on the page.
  // New activities are appended at the bottom; deleted ones are removed.
  const [stableIds, setStableIds] = useState<string[]>(() => activities.map(a => a.id));

  useEffect(() => {
    setStableIds(prev => {
      const currentIds = new Set(activities.map(a => a.id));
      const kept = prev.filter(id => currentIds.has(id));
      const keptSet = new Set(kept);
      const added = activities.map(a => a.id).filter(id => !keptSet.has(id));
      return [...kept, ...added];
    });
  }, [activities]);

  const activityMap = useMemo(
    () => Object.fromEntries(activities.map(a => [a.id, a])),
    [activities]
  );

  const displayActivities = stableIds.map(id => activityMap[id]).filter(Boolean) as typeof activities;

  useEffect(() => {
    const savedName = localStorage.getItem("voter_name") ?? "";
    const id = savedName.toLowerCase().trim();
    setUserName(savedName);
    setNameInput(savedName);
    if (!id) return;
    // Show cached stars immediately, fetch fresh in background
    try {
      const cached = localStorage.getItem(`ratings_${id}`);
      if (cached) setUserRatings(JSON.parse(cached));
    } catch {}
    getUserRatings(id).then((ratings) => {
      setUserRatings(ratings);
      try { localStorage.setItem(`ratings_${id}`, JSON.stringify(ratings)); } catch {}
    });
  }, []);

  function saveName() {
    const name = nameInput.trim();
    if (!name) return;
    setUserName(name);
    localStorage.setItem("voter_name", name);
    setIsEditing(false);
    const id = name.toLowerCase().trim();
    try {
      const cached = localStorage.getItem(`ratings_${id}`);
      if (cached) setUserRatings(JSON.parse(cached));
    } catch {}
    getUserRatings(id).then((ratings) => {
      setUserRatings(ratings);
      try { localStorage.setItem(`ratings_${id}`, JSON.stringify(ratings)); } catch {}
    });
  }

  function startEditing() {
    setNameInput(userName);
    setIsEditing(true);
  }

  function logout() {
    localStorage.removeItem("voter_name");
    setUserName("");
    setNameInput("");
    setUserRatings({});
    setIsEditing(false);
  }

  const totalStars = activities.reduce((s, a) => s + a.vote_count, 0);

  const vibe = useMemo(() => {
    // energy: 0→1 as total stars grow (saturates around 200 stars for a team of 23)
    const energy = Math.min(totalStars / 200, 1);
    // dominance: 0→1 based on how far ahead the leader is from 2nd place
    const gap = activities.length >= 2
      ? activities[0].vote_count - activities[1].vote_count
      : activities.length === 1 ? activities[0].vote_count : 0;
    const dominance = Math.min(gap / 35, 1);
    return energy * 0.65 + dominance * 0.35;
  }, [totalStars, activities]);

  const blobOpacity = 0.10 + vibe * 0.16;
  const blobColors = BLOB_PALETTES.map(([from, to]) => lerpColor(from, to, vibe));

  return (
    <>
      {/* Background blobs — colour and opacity react to total votes and leading gap */}
      <div className="blob blob-1 w-[700px] h-[700px] top-[-250px] left-[-250px]"
           style={{ backgroundColor: blobColors[0], opacity: blobOpacity }} />
      <div className="blob blob-2 w-[600px] h-[600px] top-[30%] right-[-200px]"
           style={{ backgroundColor: blobColors[1], opacity: blobOpacity * 0.9 }} />
      <div className="blob blob-3 w-[500px] h-[500px] bottom-[-120px] left-[15%]"
           style={{ backgroundColor: blobColors[2], opacity: blobOpacity * 0.8 }} />
      <div className="blob blob-4 w-[400px] h-[400px] top-[55%] left-[-120px]"
           style={{ backgroundColor: blobColors[3], opacity: blobOpacity * 0.7 }} />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="pt-14 pb-8 px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3 leading-tight tracking-tight">
            {hasName ? (
              <span className="gradient-text">
                Hvilke aktiviteter vil{" "}
                <em className="not-italic gradient-text-2">DU</em>{" "}
                gjøre i sommer?
              </span>
            ) : (
              <span className="gradient-text">Skriv inn navnet ditt</span>
            )}
          </h1>
          <p className="text-white/65 text-base max-w-sm sm:max-w-none mx-auto leading-relaxed">
            Gi stjerner til aktivitetene du liker, eller legg til ditt eget forslag
          </p>

          {/* Name section */}
          <div className="mt-6 flex items-center justify-center">
            {hasName && !isEditing ? (
              /* Logged in — show pill + separate edit button */
              <div className="flex items-center gap-2">
                <div className="glass rounded-full px-4 py-2 text-sm text-white/85 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#06d6a0]" />
                  {userName}
                </div>
                <button
                  onClick={startEditing}
                  className="glass rounded-full px-3 py-2 text-xs text-white/65 hover:text-white hover:bg-white/10 transition-colors"
                >
                  ✏️
                </button>
              </div>
            ) : (
              /* No name or editing — show input */
              <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                {!hasName && (
                  <p className="text-sm font-semibold text-white/80 sm:whitespace-nowrap">
                    👇 Skriv inn navnet ditt for å stemme og legge til forslag
                  </p>
                )}
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveName();
                      if (e.key === "Escape" && hasName) setIsEditing(false);
                    }}
                    placeholder="Navn..."
                    className={`input-dark rounded-xl px-4 py-2.5 text-sm flex-1 ${!hasName ? "ring-2 ring-[#c77dff]/60 focus:ring-[#c77dff]" : ""}`}
                    maxLength={30}
                    autoFocus
                  />
                  <button
                    onClick={saveName}
                    disabled={!nameInput.trim()}
                    className="btn-gradient rounded-xl px-4 py-2.5 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    Lagre
                  </button>
                  {hasName && (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="text-white/60 hover:text-white text-sm transition-colors shrink-0"
                      >
                        Avbryt
                      </button>
                      <button
                        onClick={logout}
                        className="text-red-400/70 hover:text-red-400 text-sm transition-colors shrink-0"
                      >
                        Logg ut
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-4 pb-16 max-w-xl mx-auto w-full">
          <div className="flex items-center justify-between mb-5 text-sm">
            <span className="text-white/60">
              <span className="text-white font-bold">{displayActivities.length}</span>{" "}
              forslag &middot;{" "}
              <span className="text-yellow-400 font-bold">{totalStars} ⭐</span>{" "}
              totalt
            </span>
            <span className="text-white/45 text-xs">Sortert etter stjerner</span>
          </div>

          <div className="space-y-3">
            {/* Add proposal card */}
            <CursorTooltip text="Skriv inn navnet ditt først" enabled={!hasName}>
              <button
                onClick={() => hasName && setShowModal(true)}
                disabled={!hasName}
                className={`w-full rounded-2xl p-5 border-2 border-dashed flex items-center gap-4 transition-all group ${
                  hasName
                    ? "border-white/20 hover:border-[#c77dff]/60 hover:bg-white/5 cursor-pointer"
                    : "border-white/10 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-colors ${
                  hasName ? "bg-white/5 group-hover:bg-[#c77dff]/20" : "bg-white/5"
                }`}>
                  +
                </div>
                <div className="text-left">
                  <p className={`font-semibold text-sm transition-colors ${hasName ? "text-white/75 group-hover:text-white" : "text-white/50"}`}>
                    Legg til forslag
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">
                    {hasName ? "Klikk for å legge til din aktivitet" : "Logg inn for å legge til"}
                  </p>
                </div>
              </button>
            </CursorTooltip>

            {displayActivities.length === 0 ? (
              <div className="text-center py-20 text-white/50">
                <div className="text-5xl mb-4">🌴</div>
                <p className="font-semibold text-white/65">Ingen forslag ennå</p>
                <p className="text-sm mt-1">Vær den første til å legge til noe!</p>
              </div>
            ) : (
              displayActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  id={activity.id}
                  title={activity.title}
                  description={activity.description}
                  emoji={activity.emoji}
                  addedBy={activity.added_by}
                  activityVoterId={activity.voter_id}
                  createdAt={activity.created_at}
                  voteCount={activity.vote_count}
                  ratingCount={activity.rating_count}
                  userRating={userRatings[activity.id] ?? 0}
                  voterId={voterId}
                  userName={userName}
                />
              ))
            )}
          </div>
        </main>
      </div>

      {showModal && (
        <AddActivityModal
          onClose={() => setShowModal(false)}
          userName={userName}
          voterId={voterId}
        />
      )}
    </>
  );
}
