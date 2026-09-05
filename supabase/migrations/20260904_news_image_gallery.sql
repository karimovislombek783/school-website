-- Add an ordered, optional gallery of up to eight images to content records.
alter table public.content_items
  add column if not exists gallery_paths text[] not null default '{}';

do $$ begin
  alter table public.content_items add constraint content_items_gallery_paths_limit
    check (cardinality(gallery_paths) <= 8);
exception when duplicate_object then null; end $$;

drop policy if exists "Published media is readable" on storage.objects;
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
