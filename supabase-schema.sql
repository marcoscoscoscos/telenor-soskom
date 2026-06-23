-- Kjør dette i Supabase: SQL Editor → New query → lim inn → Run

create table activities (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text default '',
  emoji text default '🎉',
  added_by text not null,
  created_at timestamptz default now()
);

create table votes (
  id uuid default gen_random_uuid() primary key,
  activity_id uuid references activities(id) on delete cascade not null,
  voter_id text not null,
  created_at timestamptz default now(),
  unique(activity_id, voter_id)
);

create view activities_with_votes as
select
  a.id, a.title, a.description, a.emoji, a.added_by, a.created_at,
  coalesce(count(v.id), 0)::int as vote_count
from activities a
left join votes v on a.id = v.activity_id
group by a.id;

-- Tillat lese- og skrivetilgang uten innlogging (internt verktøy)
alter table activities enable row level security;
alter table votes enable row level security;

create policy "open read activities"   on activities for select using (true);
create policy "open insert activities" on activities for insert with check (true);
create policy "open read votes"        on votes     for select using (true);
create policy "open insert votes"      on votes     for insert with check (true);
create policy "open delete votes"      on votes     for delete using (true);
