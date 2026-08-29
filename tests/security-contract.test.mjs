import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync("supabase/schema.sql", "utf8");
const gateway = readFileSync("components/admin-gateway.tsx", "utf8");
const consoleSource = readFileSync("components/admin-console.tsx", "utf8");
const adminRoute = readFileSync("app/[lang]/admin/page.tsx", "utf8");
const siteContent = readFileSync("lib/site-content.ts", "utf8");
const directory = readFileSync("components/content-directory.tsx", "utf8");

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

test("confirmed legal identity replaces the public-name placeholder", () => {
  assert.match(siteContent, /IZZATBEK-EDU-GROUP/);
  assert.match(siteContent, /license: "531978"/);
  assert.doesNotMatch(siteContent, /publicName:/);
});
