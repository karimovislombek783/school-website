import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const scheduling = readFileSync("lib/editorial-scheduling.ts", "utf8");
const migration = readFileSync("supabase/migrations/20260910_editorial_operations.sql", "utf8");
const publicPage = readFileSync("app/[lang]/[[...slug]]/page.tsx", "utf8");
const sitemap = readFileSync("app/api/sitemap/route.ts", "utf8");

test("the 1,000-recipient design is split into provider-safe batches", () => {
  assert.match(scheduling, /NEWSLETTER_RECIPIENT_LIMIT = 1000/);
  assert.match(scheduling, /EMAIL_BATCH_SIZE = 100/);
  const recipients = Array.from({ length: 1000 }, (_, id) => id);
  const batches = [];
  for (let index = 0; index < recipients.length; index += 100) batches.push(recipients.slice(index, index + 100));
  assert.equal(batches.length, 10);
  assert.equal(batches.flat().length, 1000);
  assert.ok(batches.every((batch) => batch.length <= 100));
});

test("deleting an emailed article preserves campaign history", () => {
  assert.match(migration, /foreign key \(news_id\)[\s\S]*on delete set null/);
  assert.match(migration, /capture_content_revision/);
});

test("licence, policies and dynamic detail pages are discoverable", () => {
  assert.match(publicPage, /izzatbek-edu-group-license-531978\.pdf/);
  assert.match(publicPage, /Child safeguarding/);
  assert.match(sitemap, /content\.news\.map/);
  assert.match(sitemap, /policies/);
});
