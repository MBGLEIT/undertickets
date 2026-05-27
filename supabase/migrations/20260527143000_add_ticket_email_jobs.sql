create table if not exists public.ticket_email_jobs (
  ticket_id uuid primary key references public.tickets(id) on delete cascade,
  status text not null check (status in ('pending', 'sent', 'failed')),
  error_message text,
  attempt_count integer not null default 0,
  last_attempt_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_ticket_email_jobs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_ticket_email_jobs_updated_at on public.ticket_email_jobs;

create trigger set_ticket_email_jobs_updated_at
before update on public.ticket_email_jobs
for each row
execute function public.set_ticket_email_jobs_updated_at();

grant select, insert, update, delete on public.ticket_email_jobs to service_role;
