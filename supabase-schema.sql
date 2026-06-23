-- Run this in Supabase SQL Editor (supabase.com → your project → SQL Editor)

CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  emoji TEXT DEFAULT '🎉',
  added_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  voter_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, voter_id)
);

-- View that includes vote counts
CREATE VIEW activities_with_votes AS
SELECT
  a.id,
  a.title,
  a.description,
  a.emoji,
  a.added_by,
  a.created_at,
  COALESCE(COUNT(v.id), 0)::INT AS vote_count
FROM activities a
LEFT JOIN votes v ON a.id = v.activity_id
GROUP BY a.id;

-- Row Level Security (allow public read/write — this is an internal tool)
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read activities"  ON activities FOR SELECT USING (true);
CREATE POLICY "Public insert activities" ON activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read votes"       ON votes     FOR SELECT USING (true);
CREATE POLICY "Public insert votes"     ON votes     FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete votes"     ON votes     FOR DELETE USING (true);
