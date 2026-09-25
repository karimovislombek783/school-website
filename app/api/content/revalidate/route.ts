import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Called only after an authenticated editor has saved a content item.
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const client = await createServerSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: assurance } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") {
    return NextResponse.json({ error: "mfa-required" }, { status: 403 });
  }

  const { data: membership } = await client.from("admin_users")
    .select("active").eq("user_id", user.id).maybeSingle();
  if (!membership?.active) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  revalidateTag("published-school-content", { expire: 0 });
  revalidatePath("/[lang]/[[...slug]]", "page");
  return NextResponse.json({ ok: true });
}
