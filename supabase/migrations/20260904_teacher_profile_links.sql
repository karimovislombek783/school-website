-- Add optional, consent-aware teacher contact and profile links.
alter table public.content_items add column if not exists teacher_email text;
alter table public.content_items add column if not exists show_teacher_email boolean not null default false;
alter table public.content_items add column if not exists cv_url text;
alter table public.content_items add column if not exists related_links jsonb not null default '[]'::jsonb;

do $$ begin
  alter table public.content_items add constraint content_items_teacher_email_valid
    check (teacher_email is null or teacher_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$');
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.content_items add constraint content_items_cv_url_valid
    check (cv_url is null or cv_url ~ '^https://');
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.content_items add constraint content_items_related_links_shape
    check (jsonb_typeof(related_links) = 'array' and jsonb_array_length(related_links) <= 8);
exception when duplicate_object then null; end $$;
