-- Partnerfahrzeuge von Autohaus Kaufmann (renault-kaufmann.de)
-- Die Edge Function "kaufmann-sync" liest die Fahrzeugliste taeglich aus und
-- schreibt sie in sale_vehicles. Herkunft und Einkaufspreis liegen getrennt in
-- partner_vehicles, die nur Admins lesen koennen. Preis mit Aufschlag und
-- Sichtbarkeit berechnet apply_partner_feed() aus den Einstellungen.

-- Oeffentlich lesbare Zusatzspalten, ohne Hinweis auf den Partner
alter table public.sale_vehicles
  add column if not exists is_partner boolean not null default false,
  add column if not exists body_type text,
  add column if not exists source_status text,                     -- z. B. Tageszulassung
  add column if not exists listed boolean not null default true,   -- beim letzten Abgleich noch gelistet
  add column if not exists hidden boolean not null default false,  -- vom Admin ausgeblendet
  add column if not exists details_fetched_at timestamptz,
  add column if not exists synced_at timestamptz;

create table if not exists public.partner_feeds (
  id text primary key,
  name text not null,
  enabled boolean not null default false,       -- auf der Website sichtbar
  markup_net numeric not null default 500,      -- Aufschlag netto je Fahrzeug
  vat_rate numeric not null default 0.19,
  only_commercial boolean not null default false,
  last_run_at timestamptz,
  last_status text,
  last_count integer,
  last_error text
);

-- Nur fuer Admins: Herkunft und Einkaufspreis
create table if not exists public.partner_vehicles (
  sale_vehicle_id uuid primary key references public.sale_vehicles(id) on delete cascade,
  feed text not null references public.partner_feeds(id),
  external_id text not null,
  source_url text,
  source_price numeric,      -- Partnerpreis brutto
  source_location text,
  unique (feed, external_id)
);

alter table public.partner_feeds enable row level security;
alter table public.partner_vehicles enable row level security;

drop policy if exists partner_feeds_admin_all on public.partner_feeds;
create policy partner_feeds_admin_all on public.partner_feeds
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists partner_vehicles_admin_all on public.partner_vehicles;
create policy partner_vehicles_admin_all on public.partner_vehicles
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.partner_feeds (id, name)
values ('kaufmann', 'Autohaus Kaufmann')
on conflict (id) do nothing;

-- Nutzfahrzeug-Karosserien laut Kaufmann-Filter
create or replace function public.is_commercial_body(body text)
returns boolean language sql immutable set search_path = public as $$
  select coalesce(body in (
    'Kasten', 'Van/Kleinbus', 'Doppelkabine', 'Pritsche und Plane',
    'Kastenwagen lang', 'Kastenwagen hoch und lang', 'Lieferwagen', 'Koffer',
    'Sattelzugmaschine', 'Kombi/Kleinbus bis 9 Sitze'
  ), false)
$$;

-- Preis = Partnerpreis + Aufschlag netto inkl. MwSt.; so bleibt der volle
-- Nettoaufschlag sowohl bei ausweisbarer MwSt. als auch bei § 25a.
create or replace function public.apply_partner_feed(feed text)
returns void language sql security invoker set search_path = public as $$
  update sale_vehicles v set
    price = case when p.source_price is null then null
                 else round(p.source_price + f.markup_net * (1 + f.vat_rate)) end,
    price_on_request = p.source_price is null,
    active = f.enabled and v.listed and not v.hidden
             and (not f.only_commercial or is_commercial_body(v.body_type))
  from partner_vehicles p
  join partner_feeds f on f.id = p.feed
  where p.feed = apply_partner_feed.feed and v.id = p.sale_vehicle_id;
$$;

revoke execute on function public.apply_partner_feed(text) from anon;

-- Einstellungen geaendert -> Preise und Sichtbarkeit sofort nachziehen
create or replace function public.partner_feeds_after_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if (new.enabled, new.markup_net, new.vat_rate, new.only_commercial)
     is distinct from (old.enabled, old.markup_net, old.vat_rate, old.only_commercial) then
    perform apply_partner_feed(new.id);
  end if;
  return new;
end $$;

drop trigger if exists partner_feeds_apply on public.partner_feeds;
create trigger partner_feeds_apply after update on public.partner_feeds
  for each row execute function public.partner_feeds_after_update();

-- Taeglicher Abgleich um 3 Uhr (UTC)
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('kaufmann-sync')
where exists (select 1 from cron.job where jobname = 'kaufmann-sync');

select cron.schedule(
  'kaufmann-sync',
  '0 3 * * *',
  $$ select net.http_post(
       url := 'https://riqrpvmmesqnrjcntmtt.supabase.co/functions/v1/kaufmann-sync',
       -- oeffentlicher Legacy-Anon-Key, nur damit das Gateway den Aufruf annimmt
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpcXJwdm1tZXNxbnJqY250bXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjg3NTcsImV4cCI6MjEwMTcwNDc1N30.gT_F3Ecf2dY3i4DFgILj2Ievmxh0gNDytczDh6FGcc4'
       ),
       body := '{}'::jsonb,
       timeout_milliseconds := 120000
     ) $$
);
