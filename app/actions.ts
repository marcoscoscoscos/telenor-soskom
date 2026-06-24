"use server";

import { revalidatePath } from "next/cache";
import {
  listActivities,
  createActivity,
  setRating,
  getUserRatings,
  deleteActivity,
  getDateVotesForActivity,
  toggleDateVote,
} from "@/lib/db";

export async function getActivities() {
  return listActivities();
}

export { getUserRatings };

export async function addActivity(
  formData: FormData
): Promise<{ error: string | null }> {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const emoji = formData.get("emoji") as string;
  const addedBy = formData.get("added_by") as string;
  const voterId = formData.get("voter_id") as string;

  if (!title?.trim()) return { error: "Aktiviteten trenger et navn." };
  if (!addedBy?.trim()) return { error: "Du må skrive inn navnet ditt." };

  try {
    await createActivity({
      title: title.trim(),
      description: description?.trim() ?? "",
      emoji: emoji || "🎉",
      added_by: addedBy.trim(),
      voter_id: voterId || null,
    });
  } catch {
    return { error: "Klarte ikke å lagre. Sjekk at Supabase er koblet til." };
  }

  revalidatePath("/");
  return { error: null };
}

export async function rateActivity(
  activityId: string,
  voterId: string,
  stars: number
): Promise<{ error: string | null }> {
  try {
    await setRating(activityId, voterId, stars);
  } catch {
    return { error: "Klarte ikke å gi stjerner. Prøv igjen." };
  }
  revalidatePath("/");
  return { error: null };
}

export async function removeActivity(
  activityId: string
): Promise<{ error: string | null }> {
  try {
    await deleteActivity(activityId);
  } catch {
    return { error: "Klarte ikke å slette aktiviteten." };
  }
  revalidatePath("/");
  return { error: null };
}

export async function getDateVotes(activityId: string) {
  return getDateVotesForActivity(activityId);
}

export async function voteOnDate(
  activityId: string,
  voterId: string,
  date: string
): Promise<{ error: string | null }> {
  try {
    await toggleDateVote(activityId, voterId, date);
  } catch {
    return { error: "Klarte ikke å stemme på dato." };
  }
  revalidatePath("/");
  return { error: null };
}
