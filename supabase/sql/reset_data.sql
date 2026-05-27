begin;

truncate table public.tickets restart identity cascade;
truncate table public.events restart identity cascade;

commit;
