-- Public visitors go through the Edge Function. Only the server can call these RPCs.
create schema nolto_trial;
revoke all on schema nolto_trial from public, anon, authenticated;
grant usage on schema nolto_trial to service_role;

create table nolto_trial.applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  visit_date date not null,
  visit_time time not null,
  consent_at timestamptz not null default now(),
  ip_hash text not null,
  unique (phone, visit_date, visit_time)
);
create index trial_received_idx on nolto_trial.applications(consent_at);
create table nolto_trial.notifications (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references nolto_trial.applications on delete cascade,
  recipient text not null check (recipient in ('member','owner')),
  status text not null default 'pending' check (status in ('pending','sending','accepted','review','expired')),
  attempts int not null default 0,
  next_attempt timestamptz not null default now(),
  provider_group text,
  reason text,
  unique (application_id,recipient)
);
create table nolto_trial.dispatch_tickets (
  ticket uuid primary key default gen_random_uuid(),
  issued_at timestamptz not null default now()
);
alter table nolto_trial.applications enable row level security;
alter table nolto_trial.notifications enable row level security;
alter table nolto_trial.dispatch_tickets enable row level security;
revoke all on all tables in schema nolto_trial from public, anon, authenticated;
grant select,insert,update,delete on all tables in schema nolto_trial to service_role;

-- Published weeks follow their actual classes; later weeks use the studio timetable
-- as requested times. Neither path reserves a seat in the member booking system.
create function public.nolto_trial_slots()
returns table(day text, "time" text, label text)
language sql stable security invoker set search_path = '' as $$
  with dates as (
    select (now() at time zone 'Asia/Seoul')::date + n as d from generate_series(0,27) n
  ), schedule as (
    select d, (c.starts_at at time zone 'Asia/Seoul')::time as t, coalesce(ct.name,c.title) as title
    from dates join public.group_classes c on (c.starts_at at time zone 'Asia/Seoul')::date = d
    join public.group_weeks w on w.id = c.week_id and w.status = 'published'
    left join public.group_class_types ct on ct.id = c.class_type_id
    where c.status = 'published' and c.archived_at is null
    union all
    select d,(s->>'time')::time,ct.name
    from dates cross join public.group_timetable tt
    cross join lateral jsonb_array_elements(tt.slots::jsonb) s
    left join public.group_class_types ct on ct.id = s->>'class_type_id'
    where (s->>'dow')::int = extract(isodow from d)
      and not exists (select 1 from public.group_weeks w
        where w.week_start = date_trunc('week',d)::date and w.status = 'published')
  )
  select to_char(d,'YYYY-MM-DD'), to_char(t,'HH24:MI'), min(title)
  from schedule where (d + t) at time zone 'Asia/Seoul' > now()
  group by d,t order by d,t
$$;

create function public.nolto_trial_submit(p_name text,p_phone text,p_day text,p_time text,p_consent boolean,p_ip_hash text)
returns text language plpgsql security invoker set search_path = '' as $$
declare application_id uuid;
begin
  if not coalesce(p_consent,false) or coalesce(length(btrim(p_name)),0) not between 1 and 40
    or p_name ~ '[[:cntrl:]]' or coalesce(p_phone,'') !~ '^010[0-9]{8}$'
    or coalesce(p_day,'') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or coalesce(p_time,'') !~ '^[0-9]{2}:[0-9]{2}$'
    or coalesce(p_ip_hash,'') !~ '^[a-f0-9]{64}$' then return 'invalid'; end if;
  -- Serialize this low-volume funnel's insert and notification budget checks.
  perform pg_advisory_xact_lock(864021599);
  if exists(select 1 from nolto_trial.applications a where a.phone=p_phone
    and to_char(a.visit_date,'YYYY-MM-DD')=p_day and to_char(a.visit_time,'HH24:MI')=p_time)
    then return 'accepted'; end if;
  if not exists(select 1 from public.nolto_trial_slots() s where s.day=p_day and s.time=p_time)
    then return 'slot_changed'; end if;
  if (select count(*) from nolto_trial.applications where consent_at > now()-interval '1 hour') >= 45
    or (select count(*) from nolto_trial.applications where ip_hash=p_ip_hash and consent_at > now()-interval '1 hour') >= 8
    or (select count(*) from nolto_trial.applications where phone=p_phone and consent_at > now()-interval '1 day') >= 2
    then return 'limited'; end if;
  insert into nolto_trial.applications(name,phone,visit_date,visit_time,ip_hash)
    values(btrim(p_name),p_phone,p_day::date,p_time::time,p_ip_hash) returning id into application_id;
  insert into nolto_trial.notifications(application_id,recipient) values(application_id,'member'),(application_id,'owner');
  return 'accepted';
end $$;

-- Each wake-up receives one short-lived ticket. Only the server may redeem it.
create table nolto_trial.dispatch_health (
  singleton boolean primary key default true check(singleton),
  checked_at timestamptz not null,
  configured boolean not null
);
alter table nolto_trial.dispatch_health enable row level security;
revoke all on nolto_trial.dispatch_health from public,anon,authenticated;
grant select,insert,update on nolto_trial.dispatch_health to service_role;

create function public.nolto_trial_claim(p_ticket uuid,p_configured boolean)
returns table(id uuid,recipient text,name text,phone text,day text,"time" text,attempts int)
language plpgsql security invoker set search_path = '' as $$
begin
  delete from nolto_trial.dispatch_tickets t where t.ticket=p_ticket and t.issued_at>now()-interval '2 minutes';
  if not found then return; end if;
  insert into nolto_trial.dispatch_health(singleton,checked_at,configured) values(true,now(),p_configured)
    on conflict(singleton) do update set checked_at=excluded.checked_at,configured=excluded.configured;
  if not p_configured then
    update nolto_trial.notifications j set next_attempt=now()+interval '5 minutes', reason='configuration'
    where j.status='pending' and j.next_attempt<=now();
    return;
  end if;
  return query with picked as (
    select j.id from nolto_trial.notifications j where j.status='pending' and j.next_attempt<=now()
    order by j.next_attempt,j.id limit 4 for update skip locked
  ), leased as (
    update nolto_trial.notifications j set status='sending', attempts=j.attempts+1,
      next_attempt=now()+interval '5 minutes', reason=null from picked where j.id=picked.id returning j.*
  ) select j.id,j.recipient,a.name,a.phone,to_char(a.visit_date,'YYYY-MM-DD'),to_char(a.visit_time,'HH24:MI'),j.attempts
    from leased j join nolto_trial.applications a on a.id=j.application_id;
end $$;

create function public.nolto_trial_finish(p_id uuid,p_status text,p_reason text,p_group text)
returns void language sql security invoker set search_path = '' as $$
  update nolto_trial.notifications set status=case when p_status='pending' and attempts>=6 then 'review' else p_status end,
    reason=left(p_reason,80), provider_group=left(p_group,100),
    next_attempt=now()+ make_interval(mins => least(60, (2^attempts)::int))
  where id=p_id and status='sending' and p_status in ('accepted','pending','review')
$$;

revoke all on function public.nolto_trial_slots(),public.nolto_trial_submit(text,text,text,text,boolean,text),
  public.nolto_trial_claim(uuid,boolean),public.nolto_trial_finish(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.nolto_trial_slots(),public.nolto_trial_submit(text,text,text,text,boolean,text),
  public.nolto_trial_claim(uuid,boolean),public.nolto_trial_finish(uuid,text,text,text) to service_role;

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
create function nolto_trial.dispatch()
returns void language plpgsql security invoker set search_path = '' as $$
declare wake_ticket uuid;
begin
  -- An interrupted external call may already have reached the carrier.
  update nolto_trial.notifications set status='review',reason='unknown_delivery'
    where status='sending' and next_attempt<now();
  update nolto_trial.notifications j set status='expired',reason='visit_passed'
    from nolto_trial.applications a where a.id=j.application_id and j.status='pending'
    and (a.visit_date+a.visit_time) at time zone 'Asia/Seoul' <= now();
  delete from nolto_trial.dispatch_tickets where issued_at < now()-interval '2 minutes';
  if not exists (select 1 from nolto_trial.notifications where status='pending' and next_attempt<=now()) then return; end if;
  insert into nolto_trial.dispatch_tickets default values returning ticket into wake_ticket;
  perform net.http_post(url:='https://tdhdmlhwahxcadoeywxi.supabase.co/functions/v1/nolto-trial/dispatch',
    headers:='{"Content-Type":"application/json"}'::jsonb,
    body:=jsonb_build_object('ticket',wake_ticket),timeout_milliseconds:=30000);
end $$;
revoke all on function nolto_trial.dispatch() from public,anon,authenticated;
select cron.schedule('nolto-trial-notifications','* * * * *','select nolto_trial.dispatch()');
select cron.schedule('nolto-trial-retention','5 15 * * *',
  $job$delete from nolto_trial.applications where visit_date+30 <= (now() at time zone 'Asia/Seoul')::date$job$);
grant select (starts_at, class_type_id, title, week_id, status, archived_at) on public.group_classes to service_role;
grant select (id, status, week_start) on public.group_weeks to service_role;
grant select (id, name) on public.group_class_types to service_role;
grant select (slots) on public.group_timetable to service_role;
