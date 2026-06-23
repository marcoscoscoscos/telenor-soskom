import { createClient } from "@supabase/supabase-js";

export type Activity = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  added_by: string;
  created_at: string;
  vote_count: number;
};

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function listActivities(): Promise<Activity[]> {
  const { data, error } = await getClient()
    .from("activities_with_votes")
    .select("*")
    .order("vote_count", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Activity[];
}

export async function createActivity(
  activity: Omit<Activity, "id" | "vote_count" | "created_at">
): Promise<void> {
  const { error } = await getClient().from("activities").insert({
    title: activity.title,
    description: activity.description,
    emoji: activity.emoji,
    added_by: activity.added_by,
  });
  if (error) throw error;
}

export async function castVote(activityId: string, voterId: string): Promise<void> {
  const { error } = await getClient()
    .from("votes")
    .insert({ activity_id: activityId, voter_id: voterId });
  // Ignore unique-constraint error (already voted)
  if (error && error.code !== "23505") throw error;
}

export async function removeVote(activityId: string, voterId: string): Promise<void> {
  const { error } = await getClient()
    .from("votes")
    .delete()
    .eq("activity_id", activityId)
    .eq("voter_id", voterId);
  if (error) throw error;
}

export async function getVotedActivityIds(voterId: string): Promise<string[]> {
  const { data, error } = await getClient()
    .from("votes")
    .select("activity_id")
    .eq("voter_id", voterId);

  if (error) return [];
  return (data ?? []).map((v) => v.activity_id as string);
}
