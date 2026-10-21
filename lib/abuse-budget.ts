import "server-only";
import { createHash } from "node:crypto";
import { newsletterDatabase } from "@/lib/newsletter/server";

// Counts and expiry are updated atomically in Postgres, across all instances.
export async function consumeBudget(scope: string, identity: string, limit: number, seconds: number, amount = 1) {
  const identityHash = createHash("sha256").update(identity).digest("hex");
  const { data, error } = await newsletterDatabase().rpc("school_consume_budget", {
    p_scope: scope, p_identity: identityHash, p_limit: limit, p_seconds: seconds, p_amount: amount,
  });
  if (error || typeof data !== "boolean") throw new Error("Request protection is unavailable.");
  return data;
}

export function requestAddress(request: Request) {
  // Vercel replaces this trusted forwarding header; user-agent is not an identity.
  return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function readBoundedJson(request: Request, maxBytes = 16_384): Promise<unknown> {
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > maxBytes)) throw new Error("payload-too-large");
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = []; let bytes = 0;
  try {
    while (true) {
      const part = await reader.read(); if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > maxBytes) { await reader.cancel(); throw new Error("payload-too-large"); }
      chunks.push(part.value);
    }
    const buffer = new Uint8Array(bytes); let offset = 0;
    for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder().decode(buffer));
  } catch (error) {
    if (error instanceof Error && error.message === "payload-too-large") throw error;
    return null;
  } finally { reader.releaseLock(); }
}
