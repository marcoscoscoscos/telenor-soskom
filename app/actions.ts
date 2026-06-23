"use server";

import { revalidatePath } from "next/cache";
import {
  listActivities,
  createActivity,
  castVote,
  removeVote,
  getVotedActivityIds,
} from "@/lib/kv";

export async function getActivities() {
  return listActivities();
}

export { getVotedActivityIds as getVotesForVoter };

export async function addActivity(
  formData: FormData
): Promise<{ error: string | null }> {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const emoji = formData.get("emoji") as string;
  const addedBy = formData.get("added_by") as string;

  if (!title?.trim()) return { error: "Aktiviteten trenger et navn." };
  if (!addedBy?.trim()) return { error: "Du må skrive inn navnet ditt." };

  try {
    await createActivity({
      title: title.trim(),
      description: description?.trim() ?? "",
      emoji: emoji || "🎉",
      added_by: addedBy.trim(),
    });
  } catch {
    return {
      error:
        "Klarte ikke å lagre. Sjekk at Vercel KV er koblet til prosjektet og redeploy.",
    };
  }

  revalidatePath("/");
  return { error: null };
}

export async function toggleVote(
  activityId: string,
  voterId: string,
  hasVoted: boolean
): Promise<{ error: string | null }> {
  try {
    if (hasVoted) {
      await removeVote(activityId, voterId);
    } else {
      await castVote(activityId, voterId);
    }
  } catch {
    return { error: "Klarte ikke å stemme. Prøv igjen." };
  }

  revalidatePath("/");
  return { error: null };
}
