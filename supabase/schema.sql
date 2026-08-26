-- Run once in a new, separate school Supabase project.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'editor')),
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
  category text,
  department text,
  event_date date,
  recipient_uz text,
  recipient_en text,
  source_url text,
  image_path text,
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  unique(type, slug),
  check (status = 'draft' or (length(trim(title_uz)) > 0 and length(trim(title_en)) > 0 and length(trim(summary_uz)) > 0 and length(trim(summary_en)) > 0))
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  action text not null,
  record_id uuid,
  record_type text,
  occurred_at timestamptz not null default now()
);

create or replace function public.is_school_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.admin_users where user_id = auth.uid() and active); $$;

create or replace function public.is_school_owner()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.admin_users where user_id = auth.uid() and role = 'owner' and active); $$;

create or replace function public.track_content_change()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    insert into public.audit_log(actor_id, action, record_id, record_type) values(auth.uid(), 'delete', old.id, old.type);
    return old;
  end if;
  new.updated_at = now();
  new.updated_by = auth.uid();
  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then new.published_at = now(); end if;
  insert into public.audit_log(actor_id, action, record_id, record_type) values(auth.uid(), lower(tg_op), new.id, new.type);
  return new;
end; $$;

drop trigger if exists content_change_audit on public.content_items;
create trigger content_change_audit before insert or update or delete on public.content_items for each row execute function public.track_content_change();

alter table public.admin_users enable row level security;
alter table public.content_items enable row level security;
alter table public.audit_log enable row level security;

create policy "Public reads published content" on public.content_items for select using (status = 'published' or public.is_school_admin());
create policy "Admins create content" on public.content_items for insert with check (public.is_school_admin() and created_by = auth.uid());
create policy "Admins update content" on public.content_items for update using (public.is_school_admin()) with check (public.is_school_admin());
create policy "Admins delete content" on public.content_items for delete using (public.is_school_admin());
create policy "Admins see own membership" on public.admin_users for select using (user_id = auth.uid());
create policy "Owners manage administrators" on public.admin_users for all using (public.is_school_owner()) with check (public.is_school_owner());
create policy "Admins read audit log" on public.audit_log for select using (public.is_school_admin());

revoke insert, update, delete on public.audit_log from anon, authenticated;
