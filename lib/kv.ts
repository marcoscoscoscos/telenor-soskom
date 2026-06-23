import { Redis } from "@upstash/redis";

const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export type Activity = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  added_by: string;
  created_at: string;
  vote_count: number;
};

// Sorted set key: activity IDs scored by vote count
const ACTIVITY_IDS_KEY = "activity_ids";

export async function listActivities(): Promise<Activity[]> {
  // Get all IDs sorted by score (votes) descending
  const results = await kv.zrange<string[]>(ACTIVITY_IDS_KEY, 0, -1, {
    rev: true,
    withScores: true,
  });

  if (!results || results.length === 0) return [];

  // results alternates: [id, score, id, score, ...]
  const pairs: { id: string; score: number }[] = [];
  for (let i = 0; i < results.length; i += 2) {
    pairs.push({ id: results[i] as string, score: Number(results[i + 1]) });
  }

  // Fetch each activity's data in parallel
  const activities = await Promise.all(
    pairs.map(async ({ id, score }) => {
      const data = await kv.hgetall<Omit<Activity, "id" | "vote_count">>(
        `activity:${id}`
      );
      if (!data) return null;
      return { ...data, id, vote_count: score } as Activity;
    })
  );

  return activities.filter(Boolean) as Activity[];
}

export async function createActivity(
  activity: Omit<Activity, "id" | "vote_count" | "created_at">
): Promise<void> {
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();

  await kv.hset(`activity:${id}`, {
    title: activity.title,
    description: activity.description,
    emoji: activity.emoji,
    added_by: activity.added_by,
    created_at,
  });

  // Start with score 0 (0 votes)
  await kv.zadd(ACTIVITY_IDS_KEY, { score: 0, member: id });
}

export async function castVote(
  activityId: string,
  voterId: string
): Promise<void> {
  const added = await kv.sadd(`votes:${activityId}`, voterId);
  if (added === 1) {
    await kv.zincrby(ACTIVITY_IDS_KEY, 1, activityId);
  }
}

export async function removeVote(
  activityId: string,
  voterId: string
): Promise<void> {
  const removed = await kv.srem(`votes:${activityId}`, voterId);
  if (removed === 1) {
    await kv.zincrby(ACTIVITY_IDS_KEY, -1, activityId);
  }
}

export async function getVotedActivityIds(voterId: string): Promise<string[]> {
  const allIds = await kv.zrange<string[]>(ACTIVITY_IDS_KEY, 0, -1);
  if (!allIds || allIds.length === 0) return [];

  const checks = await Promise.all(
    allIds.map((id) => kv.sismember(`votes:${id}`, voterId))
  );

  return allIds.filter((_, i) => checks[i] === 1);
}
