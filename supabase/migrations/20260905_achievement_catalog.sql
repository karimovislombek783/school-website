-- Run once before publishing records with the new achievement catalogue.
-- Existing achievement records remain intact and can be updated in the admin panel.

alter table public.content_items
  add column if not exists achievement_category text,
  add column if not exists achievement_type text,
  add column if not exists achievement_result text,
  add column if not exists achievement_subject_uz text,
  add column if not exists achievement_subject_en text,
  add column if not exists academic_year text;

alter table public.content_items
  drop constraint if exists content_items_achievement_category_valid,
  drop constraint if exists content_items_academic_year_valid,
  drop constraint if exists content_items_publish_requirements;

alter table public.content_items
  add constraint content_items_achievement_category_valid
    check (achievement_category is null or achievement_category in ('international', 'national', 'olympiad')),
  add constraint content_items_academic_year_valid
    check (academic_year is null or academic_year ~ '^[0-9]{4}(–|-)[0-9]{4}$'),
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
            (
              achievement_category is not null and
              length(trim(coalesce(achievement_type, ''))) > 0 and
              length(trim(coalesce(achievement_result, ''))) > 0 and
              length(trim(coalesce(academic_year, ''))) > 0
            ) or (
              -- Preserve already-published records from the former model.
              event_date is not null and
              length(trim(coalesce(recipient_uz, ''))) > 0 and
              length(trim(coalesce(recipient_en, ''))) > 0 and
              source_url is not null
            )
          else false
        end
      )
    );
