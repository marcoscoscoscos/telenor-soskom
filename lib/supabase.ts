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

export type Vote = {
  id: string;
  activity_id: string;
  voter_id: string;
  created_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
