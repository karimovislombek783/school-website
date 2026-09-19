import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const needsSessionRefresh =
    /^\/(?:uz|en)\/admin(?:\/|$)/.test(pathname) ||
    /^\/api\/newsletter\/(?:admin|send)(?:\/|$)/.test(pathname);
  // Public pages do not need a session. Avoid making every visitor wait for a
  // remote Supabase auth lookup before Next.js can render cached content.
  if (!needsSessionRefresh) {
    return NextResponse.next();
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();
  let response = NextResponse.next();
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next();
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await client.auth.getUser();
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.svg|robots.txt).*)"] };
