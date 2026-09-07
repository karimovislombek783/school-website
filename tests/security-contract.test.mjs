import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync("supabase/schema.sql", "utf8");
const gateway = readFileSync("components/admin-gateway.tsx", "utf8");
const consoleSource = readFileSync("components/admin-console.tsx", "utf8");
const adminRoute = readFileSync("app/[lang]/admin/page.tsx", "utf8");
const siteContent = readFileSync("lib/site-content.ts", "utf8");
const directory = readFileSync("components/content-directory.tsx", "utf8");
const nextConfig = readFileSync("next.config.ts", "utf8");
const layout = readFileSync("app/layout.tsx", "utf8");
const proxy = readFileSync("proxy.ts", "utf8");
const publicPage = readFileSync("app/[lang]/[[...slug]]/page.tsx", "utf8");
const repository = readFileSync("lib/content-repository.ts", "utf8");
const photoGallery = readFileSync("components/news-photo-gallery.tsx", "utf8");
const newsletterServer = readFileSync("lib/newsletter/server.ts", "utf8");
const newsletterSubscribe = readFileSync("app/api/newsletter/subscribe/route.ts", "utf8");
const newsletterSend = readFileSync("app/api/newsletter/send/route.ts", "utf8");
const newsletterUi = readFileSync("components/newsletter-signup.tsx", "utf8");

test("database defines separated staff roles", () => {
  for (const role of ["owner", "administrator", "editor", "writer"]) {
    assert.match(schema, new RegExp(`'${role}'`));
  }
  assert.match(schema, /writer'[\s\S]*status = 'draft'/);
  assert.match(schema, /protect_last_owner/);
});

test("administrative writes require an MFA-verified session", () => {
  assert.match(schema, /auth\.jwt\(\)[\s\S]*aal2/);
  assert.match(schema, /public\.has_school_mfa\(\)/);
  assert.match(gateway, /currentLevel !== "aal2"/);
  assert.match(gateway, /await connection\(\)/);
  assert.match(adminRoute, /dynamic = "force-dynamic"/);
});

test("school media is private and validates uploads", () => {
  assert.match(schema, /'school-media', 'school-media', false, 5242880/);
  assert.match(schema, /image\/jpeg/);
  assert.match(schema, /image\/png/);
  assert.match(schema, /image\/webp/);
  assert.match(consoleSource, /MAX_IMAGE_BYTES = 5 \* 1024 \* 1024/);
  assert.match(consoleSource, /normalizeImage/);
  assert.match(consoleSource, /createImageBitmap/);
  assert.match(consoleSource, /canvas\.toBlob/);
});

test("deployment defines defensive browser headers", () => {
  for (const header of ["Content-Security-Policy", "X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy", "Strict-Transport-Security"]) {
    assert.match(nextConfig, new RegExp(header));
  }
  assert.match(nextConfig, /poweredByHeader: false/);
});

test("localized pages expose language and structured school identity", () => {
  assert.match(proxy, /x-school-lang/);
  assert.match(layout, /requestHeaders\.get\("x-school-lang"\)/);
  assert.match(layout, /"@type": "School"/);
  assert.match(directory, /Portrait of/);
});

test("browser code does not request a service-role secret", () => {
  for (const source of [gateway, consoleSource]) {
    assert.doesNotMatch(source, /service[_-]?role/i);
  }
});

test("CMS editor is on-demand and fully language-aware", () => {
  assert.match(consoleSource, /const \[editorOpen, setEditorOpen\] = useState\(false\)/);
  assert.match(consoleSource, /editorOpen && <RecordForm/);
  assert.match(consoleSource, /Qoralama/);
  assert.match(consoleSource, /Nashr qilingan/);
  assert.match(gateway, /<LanguageSwitch/);
});

test("teacher identity supports leadership, multiple departments, and multiple subjects", () => {
  assert.match(schema, /departments text\[\]/);
  assert.match(schema, /subjects_uz text\[\]/);
  assert.match(schema, /subjects_en text\[\]/);
  assert.match(schema, /is_leadership boolean/);
  assert.match(consoleSource, /getAll\("departments"\)/);
  assert.match(directory, /item\.isLeadership/);
  assert.match(directory, /item\.departments\.includes/);
});

test("teacher contact details are optional, consent-gated, and safe", () => {
  assert.match(schema, /teacher_email text/);
  assert.match(schema, /show_teacher_email boolean not null default false/);
  assert.match(schema, /cv_url text/);
  assert.match(schema, /related_links jsonb/);
  assert.match(consoleSource, /show_teacher_email/);
  assert.match(consoleSource, /relatedLinks\.length < 8/);
  assert.match(repository, /row\.show_teacher_email \? cleanEmail/);
  assert.match(repository, /url\.protocol === "https:"/);
  assert.match(publicPage, /const hasLinks = Boolean\(teacher\.email \|\| teacher\.cvUrl \|\| teacher\.relatedLinks\.length\)/);
  assert.match(publicPage, /target="_blank" rel="noreferrer"/);
});

test("public content uses a short response cache and longer-lived signed images", () => {
  assert.match(publicPage, /revalidate = 120/);
  assert.doesNotMatch(publicPage, /dynamic = "force-dynamic"/);
  assert.match(repository, /createSignedUrls\(paths, 86400\)/);
});

test("news supports a private, ordered and bounded image gallery", () => {
  assert.match(schema, /gallery_paths text\[\] not null default '\{\}'/);
  assert.match(schema, /cardinality\(gallery_paths\) <= 8/);
  assert.match(schema, /storage\.objects\.name = any\(gallery_paths\)/);
  assert.match(consoleSource, /multiple[^>]*onChange=/);
  assert.match(consoleSource, /existingGalleryPaths\.length \+ selectedGalleryFiles\.length > 8/);
  assert.match(consoleSource, /gallery_paths: type === "news"/);
  assert.match(repository, /galleryUrls: row\.gallery_urls \?\? \[\]/);
  assert.match(publicPage, /item\.galleryUrls\.length > 0/);
  assert.match(photoGallery, /loading="lazy"/);
  assert.match(photoGallery, /role="dialog"/);
  assert.match(repository, /fallbackCoverPath/);
});

test("confirmed legal identity replaces the public-name placeholder", () => {
  assert.match(siteContent, /IZZATBEK-EDU-GROUP/);
  assert.match(siteContent, /license: "531978"/);
  assert.doesNotMatch(siteContent, /publicName:/);
});

test("newsletter is double-opt-in, private and safely rate limited", () => {
  assert.match(schema, /newsletter_subscribers/);
  assert.match(schema, /confirmation_token_hash/);
  assert.match(schema, /unsubscribe_token_hash/);
  assert.match(schema, /revoke all on public\.newsletter_subscribers/);
  assert.match(newsletterServer, /createHash\("sha256"\)/);
  assert.match(newsletterSubscribe, /newsletter_rate_limits/);
  assert.match(newsletterSubscribe, /status: "pending"/);
  assert.match(newsletterUi, /newsletter-honeypot/);
});

test("newsletter campaigns require MFA and prevent duplicate article sends", () => {
  assert.match(schema, /news_id uuid not null unique/);
  assert.match(newsletterSend, /currentLevel !== "aal2"/);
  assert.match(newsletterSend, /\["owner", "administrator"\]/);
  assert.match(newsletterSend, /status", "published"/);
  assert.match(newsletterSend, /campaignError\?\.code === "23505"/);
});
