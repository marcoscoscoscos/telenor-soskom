"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import ActivityCard from "./ActivityCard";
import AddActivityModal from "./AddActivityModal";
import type { Activity } from "@/lib/db";
import { getUserRatings } from "@/app/actions";

type Props = {
  activities: Activity[];
};

export default function ActivitiesClient({ activities }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [voterId, setVoterId] = useState("");
  const [userName, setUserName] = useState("");
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    let id = localStorage.getItem("voter_id");
    if (!id) {
      id = uuidv4();
      localStorage.setItem("voter_id", id);
    }
    setVoterId(id);

    const savedName = localStorage.getItem("voter_name") ?? "";
    setUserName(savedName);
    setNameInput(savedName);

    getUserRatings(id).then(setUserRatings);
  }, []);

  useEffect(() => {
    if (!voterId) return;
    getUserRatings(voterId).then(setUserRatings);
  }, [activities, voterId]);

  function saveName() {
    const name = nameInput.trim();
    if (name) {
      setUserName(name);
      localStorage.setItem("voter_name", name);
    }
    setEditingName(false);
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

          {/* Name pill */}
          <div className="mt-6 flex items-center justify-center">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  placeholder="Skriv inn navnet ditt"
                  className="input-dark rounded-xl px-4 py-2 text-sm w-48"
                  maxLength={30}
                />
                <button
                  onClick={saveName}
                  className="btn-gradient rounded-xl px-4 py-2 text-white text-sm font-semibold"
                >
                  Lagre
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="glass rounded-full px-4 py-2 text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1.5"
              >
                {userName ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#06d6a0]" />
                    {userName}
                  </>
                ) : (
                  "Sett navn for å foreslå →"
                )}
              </button>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-4 pb-28 max-w-xl mx-auto w-full">
          {/* Stats */}
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
                  index={i}
                />
              ))}
            </div>
          )}
        </main>

        {/* Floating add button */}
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-20 px-4">
          <button
            onClick={() => setShowModal(true)}
            className="btn-gradient rounded-2xl px-8 py-4 text-white font-bold text-base shadow-[0_8px_32px_rgba(199,125,255,0.35)] flex items-center gap-2"
          >
            <span className="text-xl leading-none">+</span>
            Legg til forslag
          </button>
        </div>
      </div>

      {showModal && (
        <AddActivityModal
          onClose={() => setShowModal(false)}
          userName={userName}
          voterId={voterId}
          onSaveName={(name) => {
            setUserName(name);
            localStorage.setItem("voter_name", name);
            setNameInput(name);
          }}
        />
      )}
    </>
  );
}
