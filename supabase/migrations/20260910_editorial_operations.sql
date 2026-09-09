-- Editorial scheduling, recoverable revision history, and campaign-safe deletion.

alter table public.content_items add column if not exists scheduled_publish_at timestamptz;
alter table public.content_items add column if not exists newsletter_scheduled_at timestamptz;

alter table public.content_items drop constraint if exists content_items_status_check;
alter table public.content_items add constraint content_items_status_check
  check (status in ('draft', 'scheduled', 'published'));

alter table public.content_items drop constraint if exists content_items_schedule_valid;
alter table public.content_items add constraint content_items_schedule_valid check (
  (status <> 'scheduled' or scheduled_publish_at is not null) and
  (newsletter_scheduled_at is null or type = 'news')
);

-- Preserve newsletter history when its source article is deliberately deleted.
alter table public.newsletter_campaigns alter column news_id drop not null;
alter table public.newsletter_campaigns alter column initiated_by drop not null;
alter table public.newsletter_campaigns drop constraint if exists newsletter_campaigns_news_id_fkey;
alter table public.newsletter_campaigns add constraint newsletter_campaigns_news_id_fkey
  foreign key (news_id) references public.content_items(id) on delete set null;

create table if not exists public.content_revisions (
  id bigint generated always as identity primary key,
  content_item_id uuid not null,
  version integer not null,
  snapshot jsonb not null,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  unique(content_item_id, version)
);

create index if not exists content_revisions_item_time_idx
  on public.content_revisions(content_item_id, changed_at desc);

create or replace function public.capture_content_revision()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.content_revisions(content_item_id, version, snapshot, changed_by)
  values (
    old.id,
    coalesce((select max(version) + 1 from public.content_revisions where content_item_id = old.id), 1),
    to_jsonb(old),
    auth.uid()
  );
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists capture_content_revision on public.content_items;
create trigger capture_content_revision
before update or delete on public.content_items
for each row execute function public.capture_content_revision();

-- Keep automated scheduling compatible with the existing non-null audit columns.
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
  new.updated_by = coalesce(auth.uid(), old.updated_by);
  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
    new.published_at = now();
  elsif new.status in ('draft', 'scheduled') then
    new.published_at = null;
  end if;
  insert into public.audit_log(actor_id, action, record_id, record_type)
  values(auth.uid(), lower(tg_op), new.id, new.type);
  return new;
end;
$$;

alter table public.content_revisions enable row level security;
revoke all on public.content_revisions from anon, authenticated;
grant select on public.content_revisions to authenticated;

drop policy if exists "Editorial staff read revisions" on public.content_revisions;
create policy "Editorial staff read revisions"
on public.content_revisions for select to authenticated
using (
  public.has_school_mfa() and
  public.school_role() in ('owner', 'administrator', 'editor')
);

grant select, insert on public.content_revisions to service_role;
grant usage, select on sequence public.content_revisions_id_seq to service_role;

