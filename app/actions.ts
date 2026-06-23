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

export async function addActivity(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const emoji = formData.get("emoji") as string;
  const addedBy = formData.get("added_by") as string;

  if (!title?.trim() || !addedBy?.trim()) return;

  await createActivity({
    title: title.trim(),
    description: description?.trim() ?? "",
    emoji: emoji || "🎉",
    added_by: addedBy.trim(),
  });

  revalidatePath("/");
}

export async function toggleVote(
  activityId: string,
  voterId: string,
  hasVoted: boolean
) {
  if (hasVoted) {
    await removeVote(activityId, voterId);
  } else {
    await castVote(activityId, voterId);
  }
  revalidatePath("/");
}
