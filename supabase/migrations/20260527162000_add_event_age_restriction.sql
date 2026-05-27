alter table public.events
add column if not exists age_restriction text
check (age_restriction in ('+16', '+18', '+21'));
