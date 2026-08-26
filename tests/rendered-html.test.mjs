import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  return response;
}

test("renders both language routes", async () => {
  for (const [pathname, expected] of [
    ["/uz", "Maktab hayoti"],
    ["/en/teachers", "Professionals who support every learner"],
  ]) {
    const response = await render(pathname);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
    assert.match(await response.text(), new RegExp(expected, "i"));
  }
});

test("defaults the root route to Uzbek", async () => {
  const response = await render("/");
  assert.ok([307, 308].includes(response.status));
  assert.equal(new URL(response.headers.get("location"), "http://localhost").pathname, "/uz");
});

test("does not expose unpublished detail pages", async () => {
  for (const pathname of ["/uz/teachers/not-published", "/en/news/not-published", "/uz/achievements/not-published"]) {
    const response = await render(pathname);
    assert.equal(response.status, 404);
    const html = await response.text();
    if (pathname.startsWith("/en/")) {
      assert.match(html, /Return to homepage/);
      assert.doesNotMatch(html, /Bosh sahifaga qaytish/);
    } else {
      assert.match(html, /Bosh sahifaga qaytish/);
      assert.doesNotMatch(html, /Return to homepage/);
    }
  }
});

test("shows a truthful localized CMS setup state without credentials", async () => {
  for (const [pathname, expected] of [["/uz/admin", "Xavfsiz CMS ulanishga tayyor"], ["/en/admin", "Secure CMS ready to connect"]]) {
    const response = await render(pathname);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, new RegExp(expected));
    assert.doesNotMatch(html, /3 samples|3 namuna/);
  }
});
