-- Secure, double-opt-in school newsletter.
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (length(email) between 3 and 254 and email = lower(email)),
  preferred_language text not null default 'uz' check (preferred_language in ('uz', 'en')),
  status text not null default 'pending' check (status in ('pending', 'active', 'unsubscribed')),
  confirmation_token_hash text unique check (confirmation_token_hash is null or confirmation_token_hash ~ '^[0-9a-f]{64}$'),
  unsubscribe_token_hash text not null unique check (unsubscribe_token_hash ~ '^[0-9a-f]{64}$'),
  confirmation_sent_at timestamptz,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  news_id uuid not null unique references public.content_items(id) on delete restrict,
  initiated_by uuid not null references auth.users(id),
  status text not null check (status in ('sending', 'completed', 'completed_with_errors', 'failed')),
  sent_count integer not null default 0 check (sent_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.newsletter_deliveries (
  id bigint generated always as identity primary key,
  campaign_id uuid not null references public.newsletter_campaigns(id) on delete cascade,
  subscriber_id uuid not null references public.newsletter_subscribers(id) on delete restrict,
  status text not null check (status in ('sent', 'failed')),
  provider_message_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique(campaign_id, subscriber_id)
);

create table if not exists public.newsletter_rate_limits (
  id bigint generated always as identity primary key,
  fingerprint text not null check (fingerprint ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);

create index if not exists newsletter_subscribers_status_idx on public.newsletter_subscribers(status);
create index if not exists newsletter_rate_limits_lookup_idx on public.newsletter_rate_limits(fingerprint, created_at desc);

alter table public.newsletter_subscribers enable row level security;
alter table public.newsletter_campaigns enable row level security;
alter table public.newsletter_deliveries enable row level security;
alter table public.newsletter_rate_limits enable row level security;

-- No browser role receives access. Newsletter routes use the server-only service role.
revoke all on public.newsletter_subscribers, public.newsletter_campaigns, public.newsletter_deliveries, public.newsletter_rate_limits from anon, authenticated;
revoke all on sequence public.newsletter_deliveries_id_seq, public.newsletter_rate_limits_id_seq from anon, authenticated;

