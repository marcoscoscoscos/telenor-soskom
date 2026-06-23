"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import ActivityCard from "./ActivityCard";
import AddActivityModal from "./AddActivityModal";
import type { Activity } from "@/lib/supabase";
import { getVotesForVoter } from "@/app/actions";

type Props = {
  activities: Activity[];
};

export default function ActivitiesClient({ activities }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [voterId, setVoterId] = useState("");
  const [userName, setUserName] = useState("");
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    // Get or create voter ID
    let id = localStorage.getItem("soskom_voter_id");
    if (!id) {
      id = uuidv4();
      localStorage.setItem("soskom_voter_id", id);
    }
    setVoterId(id);

    // Get saved name
    const savedName = localStorage.getItem("soskom_name") ?? "";
    setUserName(savedName);
    setNameInput(savedName);

    // Load which activities this voter has voted on
    getVotesForVoter(id).then(setVotedIds);
  }, []);

  // Refresh voted IDs when activities change (after voting)
  useEffect(() => {
    if (!voterId) return;
    getVotesForVoter(voterId).then(setVotedIds);
  }, [activities, voterId]);

  function saveName() {
    const name = nameInput.trim();
    if (name) {
      setUserName(name);
      localStorage.setItem("soskom_name", name);
    }
    setEditingName(false);
  }

  return (
    <>
      {/* Background blobs */}
      <div className="blob blob-1 w-[600px] h-[600px] bg-[#c77dff] top-[-200px] left-[-200px]" />
      <div className="blob blob-2 w-[500px] h-[500px] bg-[#ff6b9d] top-[30%] right-[-150px]" />
      <div className="blob blob-3 w-[400px] h-[400px] bg-[#ff9a3c] bottom-[-100px] left-[20%]" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="pt-12 pb-8 px-4 text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-white/50 mb-6 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-[#06d6a0] animate-pulse" />
            Telenor Sommerjobb 2025
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold mb-3 leading-none">
            <span className="gradient-text">Soskom</span>
          </h1>
          <p className="text-white/50 text-base sm:text-lg max-w-sm mx-auto leading-relaxed">
            Stem på aktiviteter du vil gjøre, eller legg til ditt eget forslag!
          </p>

          {/* Name bar */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
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
                className="glass rounded-full px-4 py-1.5 text-sm text-white/60 hover:text-white transition-colors hover:border-white/20"
              >
                {userName ? `Hei, ${userName} 👋` : "Sett navn →"}
              </button>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-4 pb-24 max-w-xl mx-auto w-full">
          {/* Stats bar */}
          <div className="flex items-center justify-between mb-5">
            <div className="text-sm text-white/40">
              <span className="text-white font-bold">{activities.length}</span>{" "}
              {activities.length === 1 ? "forslag" : "forslag"} •{" "}
              <span className="text-white font-bold">
                {activities.reduce((s, a) => s + a.vote_count, 0)}
              </span>{" "}
              stemmer
            </div>
            <div className="text-xs text-white/30">Sortert etter stemmer</div>
          </div>

          {/* Activity list */}
          {activities.length === 0 ? (
            <div className="text-center py-20 text-white/30">
              <div className="text-5xl mb-4">🌴</div>
              <p className="font-medium">Ingen forslag ennå!</p>
              <p className="text-sm mt-1">Vær den første til å legge til noe.</p>
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
                  voteCount={activity.vote_count}
                  hasVoted={votedIds.includes(activity.id)}
                  voterId={voterId}
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
            <span className="text-xl">+</span>
            Foreslå aktivitet
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <AddActivityModal
          onClose={() => setShowModal(false)}
          userName={userName}
        />
      )}
    </>
  );
}
