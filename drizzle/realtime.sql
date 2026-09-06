-- Enable after pushing the schema to Supabase.
-- Required for the OBS /reveal overlay Realtime subscription.

alter table draws replica identity full;

alter publication supabase_realtime add table draws;

alter table draws enable row level security;

create policy "overlay can read draws"
  on draws
  for select
  to anon, authenticated
  using (true);
