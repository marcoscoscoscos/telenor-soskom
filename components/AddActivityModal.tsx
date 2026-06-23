"use client";

import { useRef, useState, useTransition } from "react";
import { addActivity } from "@/app/actions";

const EMOJIS = ["🎉", "🍕", "🎮", "🏖️", "🎯", "🪩", "🍻", "🎸", "🧗", "🎳", "🏓", "🍔", "🎤", "🎲", "🏄", "🚴", "🍜", "🎨", "🪄", "⛺"];

type Props = {
  onClose: () => void;
  userName: string;
};

export default function AddActivityModal({ onClose, userName }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedEmoji, setSelectedEmoji] = useState("🎉");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = fd.get("title") as string;

    if (!title?.trim()) {
      setError("Gi aktiviteten et navn!");
      return;
    }
    if (!userName?.trim()) {
      setError("Sett navnet ditt øverst på siden først!");
      return;
    }

    fd.set("emoji", selectedEmoji);
    fd.set("added_by", userName);
    setError("");

    startTransition(async () => {
      await addActivity(fd);
      onClose();
    });
  }

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="pop-in glass rounded-3xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Nytt forslag ✨</h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* Emoji picker */}
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
              Velg emoji
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`text-xl w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    selectedEmoji === emoji
                      ? "bg-gradient-to-br from-[#ff6b9d] to-[#c77dff] shadow-[0_0_15px_rgba(199,125,255,0.4)]"
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
              Aktivitet *
            </label>
            <input
              name="title"
              type="text"
              placeholder="f.eks. Bowling på fredag!"
              className="input-dark w-full rounded-xl px-4 py-3 text-sm"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
              Beskrivelse (valgfritt)
            </label>
            <textarea
              name="description"
              placeholder="Litt mer info om aktiviteten..."
              rows={2}
              className="input-dark w-full rounded-xl px-4 py-3 text-sm resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-[#ff6b9d] bg-[#ff6b9d]/10 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="btn-gradient w-full rounded-xl py-3 text-white font-bold text-sm disabled:opacity-50"
          >
            {isPending ? "Legger til..." : "Legg til forslag 🎉"}
          </button>
        </form>
      </div>
    </div>
  );
}
