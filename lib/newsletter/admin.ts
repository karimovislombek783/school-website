import "server-only";

import { createServerSupabase } from "@/lib/supabase/server";

export async function requireNewsletterAdmin() {
  const client = await createServerSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { ok: false as const, error: "unauthorized" as const, status: 401 };
  const { data: assurance } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") return { ok: false as const, error: "mfa-required" as const, status: 403 };
  const { data: membership } = await client.from("admin_users").select("role,active").eq("user_id", user.id).maybeSingle();
  if (!membership?.active || !["owner", "administrator"].includes(membership.role)) return { ok: false as const, error: "forbidden" as const, status: 403 };
  return { ok: true as const, user, client, status: 200 };
}
