"use client";

import { useEffect, useState } from "react";
import ActivityCard from "./ActivityCard";
import AddActivityModal from "./AddActivityModal";
import CursorTooltip from "./CursorTooltip";
import type { Activity } from "@/lib/db";
import { getUserRatings } from "@/app/actions";

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

  useEffect(() => {
    const savedName = localStorage.getItem("voter_name") ?? "";
    setUserName(savedName);
    setNameInput(savedName);
  }, []);

  useEffect(() => {
    if (!voterId) return;
    getUserRatings(voterId).then(setUserRatings);
  }, [voterId]);

  function saveName() {
    const name = nameInput.trim();
    if (!name) return;
    setUserName(name);
    localStorage.setItem("voter_name", name);
    setIsEditing(false);
    getUserRatings(name.toLowerCase().trim()).then(setUserRatings);
  }

  function startEditing() {
    setNameInput(userName);
    setIsEditing(true);
  }

  const totalStars = activities.reduce((s, a) => s + a.vote_count, 0);

  return (
    <>
      {/* Background blobs */}
      <div className="blob blob-1 w-[600px] h-[600px] bg-[#c77dff] top-[-200px] left-[-200px]" />
      <div className="blob blob-2 w-[500px] h-[500px] bg-[#ff6b9d] top-[30%] right-[-150px]" />
      <div className="blob blob-3 w-[400px] h-[400px] bg-[#ff9a3c] bottom-[-100px] left-[20%]" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="pt-14 pb-8 px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3 leading-tight tracking-tight">
            <span className="gradient-text">
              Hvilke aktiviteter vil{" "}
              <em className="not-italic gradient-text-2">DU</em>{" "}
              gjøre i sommer?
            </span>
          </h1>
          <p className="text-white/50 text-base max-w-sm mx-auto leading-relaxed">
            Gi stjerner til aktivitetene du liker, eller legg til ditt eget forslag
          </p>

          {/* Name section */}
          <div className="mt-6 flex items-center justify-center">
            {hasName && !isEditing ? (
              /* Logged in — show pill + separate edit button */
              <div className="flex items-center gap-2">
                <div className="glass rounded-full px-4 py-2 text-sm text-white/70 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#06d6a0]" />
                  {userName}
                </div>
                <button
                  onClick={startEditing}
                  className="glass rounded-full px-3 py-2 text-xs text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  ✏️
                </button>
              </div>
            ) : (
              /* No name or editing — show input */
              <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                {!hasName && (
                  <p className="text-sm font-semibold text-white/80">
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
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-white/40 hover:text-white/70 text-sm transition-colors"
                    >
                      Avbryt
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-4 pb-28 max-w-xl mx-auto w-full">
          <div className="flex items-center justify-between mb-5 text-sm">
            <span className="text-white/40">
              <span className="text-white font-bold">{activities.length}</span>{" "}
              forslag &middot;{" "}
              <span className="text-yellow-400 font-bold">{totalStars} ⭐</span>{" "}
              totalt
            </span>
            <span className="text-white/25 text-xs">Sortert etter stjerner</span>
          </div>

          {activities.length === 0 ? (
            <div className="text-center py-24 text-white/30">
              <div className="text-5xl mb-4">🌴</div>
              <p className="font-semibold text-white/50">Ingen forslag ennå</p>
              <p className="text-sm mt-1">Vær den første til å legge til noe!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity, i) => (
                <ActivityCard
                  key={activity.id}
                  id={activity.id}
                  title={activity.title}
                  description={activity.description}
                  emoji={activity.emoji}
                  addedBy={activity.added_by}
                  activityVoterId={activity.voter_id}
                  voteCount={activity.vote_count}
                  ratingCount={activity.rating_count}
                  userRating={userRatings[activity.id] ?? 0}
                  voterId={voterId}
                  userName={userName}
                />
              ))}
            </div>
          )}
        </main>

        {/* Floating add button */}
        <div className="fixed bottom-6 left-0 right-0 flex flex-col items-center z-20 px-4 gap-2">
          {!hasName && (
            <p className="text-xs text-white/40">Skriv inn og lagre navnet ditt for å legge til forslag</p>
          )}
          <CursorTooltip text="Skriv inn navnet ditt først" enabled={!hasName}>
            <button
              onClick={() => hasName && setShowModal(true)}
              disabled={!hasName}
              className={`rounded-2xl px-8 py-4 text-white font-bold text-base flex items-center gap-2 transition-all ${
                hasName
                  ? "btn-gradient shadow-[0_8px_32px_rgba(199,125,255,0.35)]"
                  : "bg-white/10 cursor-not-allowed opacity-50"
              }`}
            >
              <span className="text-xl leading-none">+</span>
              Legg til forslag
            </button>
          </CursorTooltip>
        </div>
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
