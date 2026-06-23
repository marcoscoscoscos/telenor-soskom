-- Kjør dette i Supabase SQL Editor

-- Mangler UPDATE-policy på votes (upsert trenger den)
DROP POLICY IF EXISTS "open update votes" ON votes;
CREATE POLICY "open update votes" ON votes FOR UPDATE USING (true) WITH CHECK (true);

-- Sørg for at delete-policy på activities eksisterer
DROP POLICY IF EXISTS "open delete activities" ON activities;
CREATE POLICY "open delete activities" ON activities FOR DELETE USING (true);
