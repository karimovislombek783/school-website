-- Close direct-database authorization gaps while preserving the current CMS roles.

drop policy if exists "Public reads published content" on public.content_items;
create policy "Public reads published content"
on public.content_items for select
using (case
  when status = 'published' then true
  when auth.role() = 'authenticated' then (
    public.has_school_mfa() and
    (
      public.school_role() in ('owner', 'administrator', 'editor') or
      (public.school_role() = 'writer' and created_by = auth.uid())
    )
  )
  else false
end);

drop policy if exists "Authorized staff read audit log" on public.audit_log;
create policy "Authorized staff read audit log"
on public.audit_log for select to authenticated
using (
  public.has_school_mfa() and
  public.school_role() in ('owner', 'administrator')
);

drop policy if exists "Published media is readable" on storage.objects;
create policy "Published media is readable"
on storage.objects for select
using (case
  when bucket_id <> 'school-media' then false
  when exists (
      select 1 from public.content_items
      where status = 'published' and
        (image_path = storage.objects.name or storage.objects.name = any(gallery_paths))
    ) then true
  when auth.role() = 'authenticated' then (
      public.has_school_mfa() and
      (
        public.school_role() in ('owner', 'administrator', 'editor') or
        (public.school_role() = 'writer' and (storage.foldername(name))[1] = auth.uid()::text)
      )
    )
  else false
end);

drop policy if exists "Public reads active publication authors" on public.publication_authors;
create policy "Public reads active publication authors"
on public.publication_authors for select
using (case
  when active and profile_published then true
  when auth.role() = 'authenticated' then
    public.has_school_mfa() and public.school_role() in ('owner', 'administrator', 'editor')
  else false
end);

revoke execute on function public.track_content_change() from public;
revoke execute on function public.protect_last_owner() from public;
revoke execute on function public.capture_content_revision() from public;

-- Prevent unbounded operational tables from growing forever.
create index if not exists newsletter_rate_limits_created_idx
  on public.newsletter_rate_limits(created_at);
