-- Kjør dette i Supabase SQL Editor

CREATE TABLE date_votes (
  id uuid default gen_random_uuid() primary key,
  activity_id uuid references activities(id) on delete cascade not null,
  voter_id text not null,
  date date not null,
  created_at timestamptz default now(),
  unique(activity_id, voter_id, date)
);

ALTER TABLE date_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open read date_votes"   ON date_votes FOR SELECT USING (true);
CREATE POLICY "open insert date_votes" ON date_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "open delete date_votes" ON date_votes FOR DELETE USING (true);
