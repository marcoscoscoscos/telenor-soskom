"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function getActivities() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("activities_with_votes")
    .select("*")
    .order("vote_count", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getVotesForVoter(voterId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("votes")
    .select("activity_id")
    .eq("voter_id", voterId);

  if (error) return [];
  return (data ?? []).map((v) => v.activity_id as string);
}

export async function addActivity(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const emoji = formData.get("emoji") as string;
  const addedBy = formData.get("added_by") as string;

  if (!title?.trim() || !addedBy?.trim()) return;

  const supabase = getSupabase();
  const { error } = await supabase.from("activities").insert({
    title: title.trim(),
    description: description?.trim() ?? "",
    emoji: emoji || "🎉",
    added_by: addedBy.trim(),
  });

  if (error) throw error;
  revalidatePath("/");
}

export async function toggleVote(activityId: string, voterId: string, hasVoted: boolean) {
  const supabase = getSupabase();

  if (hasVoted) {
    await supabase
      .from("votes")
      .delete()
      .eq("activity_id", activityId)
      .eq("voter_id", voterId);
  } else {
    await supabase.from("votes").insert({ activity_id: activityId, voter_id: voterId });
  }

  revalidatePath("/");
}
