create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  date timestamptz not null,
  location text not null,
  description text not null,
  price integer not null check (price >= 0),
  capacity integer not null check (capacity > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'sold_out', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  full_name text not null,
  dni text not null,
  phone text not null,
  email text not null,
  used boolean not null default false,
  used_at timestamptz,
  stripe_session_id text not null unique,
  qr_code_value text not null unique,
  alphanumeric_code text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  constraint tickets_full_name_check check (char_length(trim(full_name)) >= 5),
  constraint tickets_dni_check check (char_length(trim(dni)) between 8 and 16),
  constraint tickets_phone_check check (char_length(trim(phone)) between 7 and 20),
  constraint tickets_email_check check (position('@' in email) > 1),
  constraint tickets_used_consistency_check check (
    (used = false and used_at is null)
    or
    (used = true and used_at is not null)
  )
);

create index if not exists events_date_idx on public.events (date);
create index if not exists events_status_idx on public.events (status);
create index if not exists tickets_event_id_idx on public.tickets (event_id);
create index if not exists tickets_email_idx on public.tickets (email);
create index if not exists tickets_dni_idx on public.tickets (dni);

grant select, insert, update, delete on public.events to service_role;
grant select, insert, update, delete on public.tickets to service_role;

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

create or replace view public.event_ticket_stats as
select
  e.id,
  e.slug,
  e.name,
  e.date,
  e.location,
  e.price,
  e.capacity,
  count(t.id)::int as sold_tickets,
  count(*) filter (where t.used = true)::int as used_tickets,
  greatest(e.capacity - count(t.id), 0)::int as remaining_tickets
from public.events e
left join public.tickets t on t.event_id = e.id
group by e.id;

grant select on public.event_ticket_stats to anon, authenticated, service_role;

alter table public.events enable row level security;
alter table public.tickets enable row level security;

drop policy if exists "Public can read published events" on public.events;
create policy "Public can read published events"
on public.events
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Service role can manage events" on public.events;
create policy "Service role can manage events"
on public.events
for all
to service_role
using (true)
with check (true);

drop policy if exists "Service role can manage tickets" on public.tickets;
create policy "Service role can manage tickets"
on public.tickets
for all
to service_role
using (true)
with check (true);
