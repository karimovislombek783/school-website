export const NEWSLETTER_RECIPIENT_LIMIT = 1000;
export const EMAIL_BATCH_SIZE = 100;

export function publicationIsVisible(status: string, scheduledAt: string | null, now = new Date()) {
  if (status === "published") return true;
  if (status !== "scheduled" || !scheduledAt) return false;
  const timestamp = Date.parse(scheduledAt);
  return Number.isFinite(timestamp) && timestamp <= now.getTime();
}

export function scheduledIso(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function batchesOf<T>(items: T[], size = EMAIL_BATCH_SIZE): T[][] {
  if (!Number.isInteger(size) || size < 1) throw new Error("Batch size must be a positive integer.");
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) batches.push(items.slice(index, index + size));
  return batches;
}

