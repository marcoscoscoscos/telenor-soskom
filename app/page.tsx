import { getActivities } from "./actions";
import ActivitiesClient from "@/components/ActivitiesClient";
import type { Activity } from "@/lib/db";

export const revalidate = 0;

export default async function Home() {
  let activities: Activity[] = [];

  try {
    activities = await getActivities();
  } catch {
    // KV not configured yet — show empty state
  }

  return (
    <div className="noise">
      <ActivitiesClient activities={activities} />
    </div>
  );
}
