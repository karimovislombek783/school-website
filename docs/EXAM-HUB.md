# Exam hub

Public routes: `/uz/exams` and `/en/exams`. The existing header, footer, breadcrumbs, sitemap and language switch link to them.

## Maintaining information

`lib/exams/data.ts` contains bilingual guides and reviewed sessions. Each guide has its own `checked` date and official source links. Update that date only after reviewing its sources. Do not infer a registration window from last year's dates.

The first release is manually reviewed. No scheduled scraper, automatic publication, notifications or student registrations are enabled. A future source monitor should prepare changes for editorial review, retain source URLs and post IDs, revisit edited announcements and flag image-only or conflicting information.

`lib/exams/status.ts` calculates calendar-day status in Asia/Tashkent. Date-only national deadlines do not imply a published closing hour. Exact SAT cutoffs retain the source's Eastern-time offset and show the converted Tashkent date/time. Regional seats may fill earlier than the deadline.

After seven days without review, an unclosed session displays a recheck badge rather than an apparently current registration status. IELTS uses provider-selected booking dates and has no invented shared deadline.

## Initial source decisions (24 October 2026)

- Subject schedule: https://gov.uz/oz/uzbmb/news/view/210873
- Newer November notice: https://gov.uz/oz/uzbmb/news/view/235092 — use **28–29 November** for mathematics and payment **within 24 hours after registration**, superseding the original image's mathematics dates and generic payment date.
- Foreign-language schedule image: https://gov.uz/oz/uzbmb/news/view/210856 — November registration 10–24 October, payment by 25 October, exam window 8–10 November; December registration 13–27 November, payment by 28 November, exam window 12–14 December. Personal speaking appointments can differ.
- SAT dates: https://satsuite.collegeboard.org/sat/dates-deadlines
- IELTS: https://www.britishcouncil.uz/en/exam/ielts/book-test

## Checks

- `npm run build:vercel` builds the production Next.js deployment.
- `node --test tests/exam-status.test.mjs` verifies deadline boundaries, daylight-saving offsets, date-only cutoffs, stale reviews and the corrected mathematics dates.
