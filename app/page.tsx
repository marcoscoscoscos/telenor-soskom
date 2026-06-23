import { getActivities } from "./actions";
import ActivitiesClient from "@/components/ActivitiesClient";

export const revalidate = 0;

export default async function Home() {
  let activities: Awaited<ReturnType<typeof getActivities>> = [];

  try {
    activities = await getActivities();
  } catch {
    // Supabase not configured yet — show empty state
  }

  return (
    <div className="noise">
      <ActivitiesClient activities={activities} />
    </div>
  );
}
