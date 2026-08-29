-- Run once after deploying the multi-subject teacher-profile update.
-- Safe for the existing school project and its current empty content table.

alter table public.content_items
  add column if not exists departments text[] not null default '{}',
  add column if not exists subjects_uz text[] not null default '{}',
  add column if not exists subjects_en text[] not null default '{}',
  add column if not exists is_leadership boolean not null default false;

alter table public.content_items
  drop constraint if exists content_items_check,
  drop constraint if exists content_items_publish_requirements,
  drop constraint if exists content_items_departments_allowed;

alter table public.content_items
  add constraint content_items_departments_allowed
    check (departments <@ array['stem', 'languages', 'social-sciences', 'primary', 'arts-pe', 'student-support']::text[]),
  add constraint content_items_publish_requirements
    check (
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
            event_date is not null and
            length(trim(coalesce(recipient_uz, ''))) > 0 and
            length(trim(coalesce(recipient_en, ''))) > 0 and
            source_url is not null
          else false
        end
      )
    );
