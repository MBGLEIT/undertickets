alter table public.tickets
  add column if not exists birth_date date;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tickets'
      and column_name = 'age'
  ) then
    execute $sql$
      update public.tickets
      set birth_date = coalesce(
        birth_date,
        make_date(greatest(extract(year from current_date)::int - age, 1900), 1, 1)
      )
      where birth_date is null
        and age is not null
    $sql$;
  end if;
end $$;

update public.tickets
set birth_date = coalesce(birth_date, date '2008-01-01')
where birth_date is null;

alter table public.tickets
  alter column birth_date set not null;

alter table public.tickets
  drop constraint if exists tickets_birth_date_check,
  add constraint tickets_birth_date_check check (
    birth_date >= date '1900-01-01'
    and birth_date <= current_date
  );

alter table public.tickets
  drop constraint if exists tickets_age_check;

alter table public.tickets
  drop column if exists age;

drop function if exists public.issue_ticket(uuid, uuid, text, integer, text, text, text, text, text, text);

create or replace function public.issue_ticket(
  p_event_id uuid,
  p_ticket_id uuid,
  p_full_name text,
  p_birth_date date,
  p_dni text,
  p_phone text,
  p_email text,
  p_stripe_session_id text,
  p_qr_code_value text,
  p_alphanumeric_code text
)
returns public.tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  target_event public.events;
  existing_ticket public.tickets;
  sold_count integer;
  created_ticket public.tickets;
begin
  select *
  into existing_ticket
  from public.tickets
  where stripe_session_id = p_stripe_session_id;

  if found then
    return existing_ticket;
  end if;

  select *
  into target_event
  from public.events
  where id = p_event_id
  for update;

  if not found then
    raise exception 'EVENT_NOT_FOUND';
  end if;

  if target_event.status <> 'published' then
    raise exception 'EVENT_NOT_AVAILABLE';
  end if;

  select count(*)
  into sold_count
  from public.tickets
  where event_id = p_event_id;

  if sold_count >= target_event.capacity then
    raise exception 'EVENT_SOLD_OUT';
  end if;

  insert into public.tickets (
    id,
    event_id,
    full_name,
    birth_date,
    dni,
    phone,
    email,
    stripe_session_id,
    qr_code_value,
    alphanumeric_code
  )
  values (
    p_ticket_id,
    p_event_id,
    p_full_name,
    p_birth_date,
    p_dni,
    p_phone,
    p_email,
    p_stripe_session_id,
    p_qr_code_value,
    p_alphanumeric_code
  )
  returning *
  into created_ticket;

  return created_ticket;
end;
$$;

revoke all on function public.issue_ticket(uuid, uuid, text, date, text, text, text, text, text, text) from public;
grant execute on function public.issue_ticket(uuid, uuid, text, date, text, text, text, text, text, text) to service_role;
