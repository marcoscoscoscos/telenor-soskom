-- Kjør dette i Supabase SQL Editor for å oppdatere skjemaet

-- Legg til voter_id på aktiviteter (for å vite hvem som kan slette)
ALTER TABLE activities ADD COLUMN IF NOT EXISTS voter_id text;

-- Legg til stjerner på stemmer (1–5)
ALTER TABLE votes ADD COLUMN IF NOT EXISTS stars integer NOT NULL DEFAULT 1;

-- Oppdater visning: summer stjerner i stedet for å telle stemmer
DROP VIEW IF EXISTS activities_with_votes;
CREATE VIEW activities_with_votes AS
SELECT
  a.id, a.title, a.description, a.emoji, a.added_by, a.voter_id, a.created_at,
  COALESCE(SUM(v.stars), 0)::int  AS vote_count,
  COUNT(v.id)::int                AS rating_count
FROM activities a
LEFT JOIN votes v ON a.id = v.activity_id
GROUP BY a.id;

-- Tillat sletting av aktiviteter
DROP POLICY IF EXISTS "open delete activities" ON activities;
CREATE POLICY "open delete activities" ON activities FOR DELETE USING (true);
