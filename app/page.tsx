import { getActivities } from "./actions";
import ActivitiesClient from "@/components/ActivitiesClient";
import type { Activity } from "@/lib/db";

export const revalidate = 0;

const ago = (minutes: number) =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString();

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: "mock-1",
    title: "Bowling",
    description: "La oss se hvem som er best i teamet! Bli med på klassisk bowling-kveld.",
    emoji: "🎳",
    added_by: "Marcus",
    voter_id: "marcus",
    created_at: ago(5),
    vote_count: 24,
    rating_count: 6,
  },
  {
    id: "mock-2",
    title: "Grilling i Frognerparken",
    description: "Ta med noe godt å grille, sett deg ned i graset og nyt sommeren.",
    emoji: "🍔",
    added_by: "Sara",
    voter_id: "sara",
    created_at: ago(20),
    vote_count: 18,
    rating_count: 5,
  },
  {
    id: "mock-3",
    title: "Afterwork på taket",
    description: "Kald drink og god utsikt — perfekt etter en lang arbeidsdag.",
    emoji: "🥂",
    added_by: "Jonas",
    voter_id: "jonas",
    created_at: ago(45),
    vote_count: 15,
    rating_count: 5,
  },
  {
    id: "mock-4",
    title: "Padel-turnering",
    description: "2v2-turnering. Meld deg på med en partner — vinneren bestemmer neste aktivitet.",
    emoji: "🎾",
    added_by: "Lena",
    voter_id: "lena",
    created_at: ago(90),
    vote_count: 12,
    rating_count: 4,
  },
  {
    id: "mock-5",
    title: "Karaoke",
    description: "Alle må synge minst én sang. Ingen unntak.",
    emoji: "🎤",
    added_by: "Erik",
    voter_id: "erik",
    created_at: ago(120),
    vote_count: 9,
    rating_count: 4,
  },
  {
    id: "mock-6",
    title: "Escape room",
    description: "60 minutter på å rømme. Er teamet smarte nok?",
    emoji: "🧩",
    added_by: "Ida",
    voter_id: "ida",
    created_at: ago(180),
    vote_count: 6,
    rating_count: 3,
  },
  {
    id: "mock-7",
    title: "Havbad og is",
    description: "Morgenbad ved Sørenga, deretter is på kaia.",
    emoji: "🏊",
    added_by: "Mads",
    voter_id: "mads",
    created_at: ago(240),
    vote_count: 4,
    rating_count: 2,
  },
];

export default async function Home() {
  let activities: Activity[] = [];

  try {
    activities = await getActivities();
  } catch {
    activities = MOCK_ACTIVITIES;
  }

  if (activities.length === 0) {
    activities = MOCK_ACTIVITIES;
  }

  return (
    <div className="noise">
      <ActivitiesClient activities={activities} />
    </div>
  );
}
