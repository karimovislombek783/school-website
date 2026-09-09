-- Delivery analytics populated by the signed Resend webhook.
alter table public.newsletter_deliveries add column if not exists delivered_at timestamptz;
alter table public.newsletter_deliveries add column if not exists first_opened_at timestamptz;
alter table public.newsletter_deliveries add column if not exists first_clicked_at timestamptz;
alter table public.newsletter_deliveries add column if not exists bounced_at timestamptz;
alter table public.newsletter_deliveries add column if not exists complained_at timestamptz;
alter table public.newsletter_deliveries add column if not exists last_event_at timestamptz;
create table if not exists public.newsletter_events (
  id bigint generated always as identity primary key,
  provider_event_id text not null unique,
  provider_message_id text not null,
  event_type text not null,
  occurred_at timestamptz not null,
  clicked_url text,
  created_at timestamptz not null default now()
);
create index if not exists newsletter_deliveries_provider_message_idx on public.newsletter_deliveries(provider_message_id);
create index if not exists newsletter_events_message_idx on public.newsletter_events(provider_message_id);
create index if not exists newsletter_events_type_time_idx on public.newsletter_events(event_type, occurred_at desc);
alter table public.newsletter_events enable row level security;
revoke all on public.newsletter_events from anon, authenticated;
revoke all on sequence public.newsletter_events_id_seq from anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.newsletter_subscribers, public.newsletter_campaigns, public.newsletter_deliveries, public.newsletter_rate_limits, public.newsletter_events to service_role;
grant select on table public.content_items to service_role;
grant insert on table public.audit_log to service_role;
grant usage, select on sequence public.newsletter_deliveries_id_seq, public.newsletter_rate_limits_id_seq, public.newsletter_events_id_seq to service_role;
