create table if not exists public.realtime_updates (
  id bigint generated always as identity primary key,
  topic text not null,
  resource_id text,
  created_at timestamptz not null default timezone('utc', now())
);

grant select on public.realtime_updates to anon, authenticated, service_role;
grant insert on public.realtime_updates to service_role;

do $$
begin
  begin
    alter publication supabase_realtime add table public.realtime_updates;
  exception
    when duplicate_object then null;
  end;
end;
$$;
