import type { Session } from "./data";
export type SessionStatus = "closed" | "late" | "today" | "soon" | "open" | "upcoming";
export function tashkentDay(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export function sessionStatus(session: Session, now: Date): SessionStatus {
  const today = tashkentDay(now);
  const regularClosed = session.closesAt ? now.getTime() > Date.parse(session.closesAt) : today > session.deadline;
  if (regularClosed) {
    if (session.lateClosesAt && now.getTime() <= Date.parse(session.lateClosesAt)) return "late";
    return "closed";
  }
  if (today < session.opens) return "upcoming";
  const endDay = session.closesAt ? tashkentDay(new Date(session.closesAt)) : session.deadline;
  if (today === endDay) return "today";
  if ((Date.parse(endDay) - Date.parse(today)) / 86400000 <= 7) return "soon";
  return "open";
}
export function reviewDue(checked: string, now: Date): boolean {
  return (Date.parse(tashkentDay(now)) - Date.parse(checked)) / 86400000 > 7;
}
