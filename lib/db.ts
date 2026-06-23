import { createClient } from "@supabase/supabase-js";

export type Activity = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  added_by: string;
  voter_id: string | null;
  created_at: string;
  vote_count: number;   // sum of all stars
  rating_count: number; // number of people who rated
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
  activity: Omit<Activity, "id" | "vote_count" | "rating_count" | "created_at">
): Promise<void> {
  const { error } = await getClient().from("activities").insert({
    title: activity.title,
    description: activity.description,
    emoji: activity.emoji,
    added_by: activity.added_by,
    voter_id: activity.voter_id,
  });
  if (error) throw error;
}

export async function setRating(
  activityId: string,
  voterId: string,
  stars: number // 0 = remove rating
): Promise<void> {
  const db = getClient();

  // Check if this voter already rated this activity
  const { data: existing } = await db
    .from("votes")
    .select("id")
    .eq("activity_id", activityId)
    .eq("voter_id", voterId)
    .maybeSingle();

  if (stars === 0 || existing) {
    // Delete (stars=0) or overwrite existing rating
    const { error: delErr } = await db
      .from("votes")
      .delete()
      .eq("activity_id", activityId)
      .eq("voter_id", voterId);
    if (delErr) throw delErr;
  }

  if (stars > 0) {
    const { error: insErr } = await db
      .from("votes")
      .insert({ activity_id: activityId, voter_id: voterId, stars });
    if (insErr) throw insErr;
  }
}

export async function getUserRatings(
  voterId: string
): Promise<Record<string, number>> {
  const { data, error } = await getClient()
    .from("votes")
    .select("activity_id, stars")
    .eq("voter_id", voterId);

  if (error) return {};
  return Object.fromEntries(
    (data ?? []).map((v) => [v.activity_id as string, v.stars as number])
  );
}

export async function deleteActivity(activityId: string): Promise<void> {
  const { error } = await getClient()
    .from("activities")
    .delete()
    .eq("id", activityId);
  if (error) throw error;
}
