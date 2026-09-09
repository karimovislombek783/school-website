-- Expand News into a school publication system with reusable contributor bylines.
create table if not exists public.publication_authors (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 100),
  role_uz text not null default 'Muallif',
  role_en text not null default 'Writer',
  bio_uz text,
  bio_en text,
  profile_published boolean not null default false,
  active boolean not null default true,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.content_items add column if not exists publication_format text;
alter table public.content_items add column if not exists author_id uuid references public.publication_authors(id) on delete set null;

update public.content_items set category = case category when 'announcement' then 'announcements' else 'school-news' end where type = 'news' and category in ('news', 'announcement');
update public.content_items set publication_format = case when category = 'announcements' then 'announcement' else 'news-report' end where type = 'news' and publication_format is null;

alter table public.content_items drop constraint if exists content_items_category_check;
alter table public.content_items add constraint content_items_category_check check (
  category is null or category in ('school-news','announcements','student-life','student-voices','academic-corner','achievements','community','arts-culture','sports','editorial')
);
alter table public.content_items add constraint content_items_publication_format_check check (
  publication_format is null or publication_format in ('news-report','feature','interview','opinion','photo-essay','announcement')
);

alter table public.publication_authors enable row level security;
create policy "Public reads active publication authors" on public.publication_authors for select using (active or public.is_school_admin());
create policy "Administrators manage publication authors" on public.publication_authors for all using (public.has_school_mfa() and public.school_role() in ('owner','administrator','editor')) with check (public.has_school_mfa() and public.school_role() in ('owner','administrator','editor'));
grant select on public.publication_authors to anon, authenticated;
grant insert, update, delete on public.publication_authors to authenticated;
grant select on public.publication_authors to service_role;

create index if not exists publication_authors_active_idx on public.publication_authors(active, name);
create index if not exists content_items_publication_category_idx on public.content_items(category, published_at desc) where type = 'news';
