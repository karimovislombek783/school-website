-- Run once in a new, separate school Supabase project.
-- This schema deliberately uses only the public anon key in the application.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'administrator', 'editor', 'writer')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('teacher', 'news', 'achievement')),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null default 'draft' check (status in ('draft', 'published')),
  title_uz text not null,
  title_en text not null,
  summary_uz text not null default '',
  summary_en text not null default '',
  body_uz text,
  body_en text,
  category text check (category is null or category in ('news', 'announcement')),
  departments text[] not null default '{}',
  subjects_uz text[] not null default '{}',
  subjects_en text[] not null default '{}',
  is_leadership boolean not null default false,
  event_date date,
  recipient_uz text,
  recipient_en text,
  source_url text check (source_url is null or source_url ~ '^https://'),
  teacher_email text check (teacher_email is null or teacher_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  show_teacher_email boolean not null default false,
  cv_url text check (cv_url is null or cv_url ~ '^https://'),
  related_links jsonb not null default '[]'::jsonb,
  image_path text check (image_path is null or image_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'),
  gallery_paths text[] not null default '{}',
  achievement_category text check (achievement_category is null or achievement_category in ('international', 'national', 'olympiad')),
  achievement_type text,
  achievement_result text,
  achievement_subject_uz text,
  achievement_subject_en text,
  academic_year text check (academic_year is null or academic_year ~ '^[0-9]{4}(–|-)[0-9]{4}$'),
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  unique(type, slug),
  constraint content_items_departments_allowed check (departments <@ array['stem', 'languages', 'social-sciences', 'primary', 'arts-pe', 'student-support']::text[]),
  constraint content_items_related_links_valid check (jsonb_typeof(related_links) = 'array' and jsonb_array_length(related_links) <= 8),
  constraint content_items_gallery_limit check (cardinality(gallery_paths) <= 8),
  constraint content_items_publish_requirements check (
    status = 'draft' or (
      length(trim(title_uz)) > 0 and length(trim(title_en)) > 0 and
      length(trim(summary_uz)) > 0 and length(trim(summary_en)) > 0 and
      case type
        when 'teacher' then
          length(trim(coalesce(recipient_uz, ''))) > 0 and
          length(trim(coalesce(recipient_en, ''))) > 0 and
          (is_leadership or (
            cardinality(departments) > 0 and
            cardinality(subjects_uz) > 0 and cardinality(subjects_en) > 0
          ))
        when 'news' then
          length(trim(coalesce(body_uz, ''))) > 0 and
          length(trim(coalesce(body_en, ''))) > 0 and
          event_date is not null and category is not null
        when 'achievement' then
          achievement_category is not null and
          length(trim(coalesce(achievement_type, ''))) > 0 and
          length(trim(coalesce(achievement_result, ''))) > 0 and
          length(trim(coalesce(academic_year, ''))) > 0
        else false
      end
    )
  )
);

-- Safe to run on projects created with an earlier version of this schema.
alter table public.content_items add column if not exists teacher_email text;
alter table public.content_items add column if not exists show_teacher_email boolean not null default false;
alter table public.content_items add column if not exists cv_url text;
alter table public.content_items add column if not exists related_links jsonb not null default '[]'::jsonb;
alter table public.content_items add column if not exists gallery_paths text[] not null default '{}';
alter table public.content_items add column if not exists achievement_category text;
alter table public.content_items add column if not exists achievement_type text;
alter table public.content_items add column if not exists achievement_result text;
alter table public.content_items add column if not exists achievement_subject_uz text;
alter table public.content_items add column if not exists achievement_subject_en text;
alter table public.content_items add column if not exists academic_year text;

do $$ begin
  alter table public.content_items add constraint content_items_teacher_email_valid
    check (teacher_email is null or teacher_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$');
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.content_items add constraint content_items_gallery_paths_limit
    check (cardinality(gallery_paths) <= 8);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.content_items add constraint content_items_cv_url_valid
    check (cv_url is null or cv_url ~ '^https://');
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.content_items add constraint content_items_related_links_shape
    check (jsonb_typeof(related_links) = 'array' and jsonb_array_length(related_links) <= 8);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.content_items add constraint content_items_achievement_category_valid
    check (achievement_category is null or achievement_category in ('international', 'national', 'olympiad'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.content_items add constraint content_items_academic_year_valid
    check (academic_year is null or academic_year ~ '^[0-9]{4}(–|-)[0-9]{4}$');
exception when duplicate_object then null; end $$;

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  action text not null,
  record_id uuid,
  record_type text,
  occurred_at timestamptz not null default now()
);

create or replace function public.school_role()
returns text language sql stable security definer set search_path = public
as $$
  select role from public.admin_users
  where user_id = auth.uid() and active
  limit 1;
$$;

create or replace function public.is_school_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select public.school_role() is not null; $$;

create or replace function public.is_school_owner()
returns boolean language sql stable security definer set search_path = public
as $$ select public.school_role() = 'owner'; $$;

create or replace function public.has_school_mfa()
returns boolean language sql stable set search_path = public
as $$ select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'; $$;

create or replace function public.track_content_change()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    insert into public.audit_log(actor_id, action, record_id, record_type)
    values(auth.uid(), 'delete', old.id, old.type);
    return old;
  end if;
  if tg_op = 'UPDATE' then
    new.created_by = old.created_by;
    new.created_at = old.created_at;
    new.type = old.type;
  end if;
  new.updated_at = now();
  new.updated_by = auth.uid();
  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
    new.published_at = now();
  elsif new.status = 'draft' then
    new.published_at = null;
  end if;
  insert into public.audit_log(actor_id, action, record_id, record_type)
  values(auth.uid(), lower(tg_op), new.id, new.type);
  return new;
end;
$$;

create or replace function public.protect_last_owner()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.role = 'owner' and old.active and
       (select count(*) from public.admin_users where role = 'owner' and active) <= 1 then
      raise exception 'The last active owner cannot be removed.';
    end if;
    return old;
  end if;
  if old.role = 'owner' and old.active and (new.role <> 'owner' or not new.active) and
     (select count(*) from public.admin_users where role = 'owner' and active) <= 1 then
    raise exception 'The last active owner cannot be deactivated.';
  end if;
  return new;
end;
$$;

drop trigger if exists content_change_audit on public.content_items;
create trigger content_change_audit
before insert or update or delete on public.content_items
for each row execute function public.track_content_change();

drop trigger if exists protect_last_school_owner on public.admin_users;
create trigger protect_last_school_owner
before update or delete on public.admin_users
for each row execute function public.protect_last_owner();

alter table public.admin_users enable row level security;
alter table public.content_items enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "Public reads published content" on public.content_items;
drop policy if exists "Authorized staff create content" on public.content_items;
drop policy if exists "Authorized staff update content" on public.content_items;
drop policy if exists "Authorized staff delete content" on public.content_items;
drop policy if exists "Staff read memberships" on public.admin_users;
drop policy if exists "Owners manage administrators" on public.admin_users;
drop policy if exists "Authorized staff read audit log" on public.audit_log;

create policy "Public reads published content"
on public.content_items for select
using (
  status = 'published' or
  public.school_role() in ('owner', 'administrator', 'editor') or
  (public.school_role() = 'writer' and created_by = auth.uid())
);

create policy "Authorized staff create content"
on public.content_items for insert to authenticated
with check (
  public.has_school_mfa() and created_by = auth.uid() and
  (public.school_role() in ('owner', 'administrator', 'editor') or
   (public.school_role() = 'writer' and status = 'draft'))
);

create policy "Authorized staff update content"
on public.content_items for update to authenticated
using (
  public.has_school_mfa() and
  (public.school_role() in ('owner', 'administrator', 'editor') or
   (public.school_role() = 'writer' and created_by = auth.uid() and status = 'draft'))
)
with check (
  public.has_school_mfa() and
  (public.school_role() in ('owner', 'administrator', 'editor') or
   (public.school_role() = 'writer' and created_by = auth.uid() and status = 'draft'))
);

create policy "Authorized staff delete content"
on public.content_items for delete to authenticated
using (
  public.has_school_mfa() and
  (public.school_role() in ('owner', 'administrator') or
   (public.school_role() = 'writer' and created_by = auth.uid() and status = 'draft'))
);

create policy "Staff read memberships"
on public.admin_users for select to authenticated
using (user_id = auth.uid() or public.is_school_owner());

create policy "Owners manage administrators"
on public.admin_users for all to authenticated
using (public.is_school_owner() and public.has_school_mfa())
with check (public.is_school_owner() and public.has_school_mfa());

create policy "Authorized staff read audit log"
on public.audit_log for select to authenticated
using (public.school_role() in ('owner', 'administrator'));

revoke all on public.admin_users, public.content_items, public.audit_log from anon, authenticated;
grant select on public.content_items to anon, authenticated;
grant insert, update, delete on public.content_items to authenticated;
grant select, insert, update, delete on public.admin_users to authenticated;
grant select on public.audit_log to authenticated;
grant usage, select on sequence public.audit_log_id_seq to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('school-media', 'school-media', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Published media is readable" on storage.objects;
drop policy if exists "Staff upload media" on storage.objects;
drop policy if exists "Staff remove media" on storage.objects;

create policy "Published media is readable"
on storage.objects for select
using (
  bucket_id = 'school-media' and
  (public.school_role() in ('owner', 'administrator', 'editor') or
   (public.school_role() = 'writer' and (storage.foldername(name))[1] = auth.uid()::text) or exists (
    select 1 from public.content_items
    where status = 'published' and
      (image_path = storage.objects.name or storage.objects.name = any(gallery_paths))
  ))
);

create policy "Staff upload media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'school-media' and public.has_school_mfa() and public.is_school_admin() and
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Staff remove media"
on storage.objects for delete to authenticated
using (
  bucket_id = 'school-media' and public.has_school_mfa() and
  (public.school_role() in ('owner', 'administrator') or (storage.foldername(name))[1] = auth.uid()::text)
);

revoke execute on function public.school_role() from public;
revoke execute on function public.is_school_admin() from public;
revoke execute on function public.is_school_owner() from public;
revoke execute on function public.has_school_mfa() from public;
grant execute on function public.school_role() to anon, authenticated;
grant execute on function public.is_school_admin() to anon, authenticated;
grant execute on function public.is_school_owner() to authenticated;
grant execute on function public.has_school_mfa() to authenticated;

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
