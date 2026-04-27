create or replace function public.issue_ticket(
  p_event_id uuid,
  p_ticket_id uuid,
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
    email,
    stripe_session_id,
    qr_code_value,
    alphanumeric_code
  )
  values (
    p_ticket_id,
    p_event_id,
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

revoke all on function public.issue_ticket(uuid, uuid, text, text, text, text) from public;
grant execute on function public.issue_ticket(uuid, uuid, text, text, text, text) to service_role;
