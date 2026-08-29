import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync("supabase/schema.sql", "utf8");
const gateway = readFileSync("components/admin-gateway.tsx", "utf8");
const consoleSource = readFileSync("components/admin-console.tsx", "utf8");
const adminRoute = readFileSync("app/[lang]/admin/page.tsx", "utf8");

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
