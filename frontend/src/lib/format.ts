import type { Event } from "../types/event";

export function formatDateTime(date: string) {
  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function dateParts(date: string) {
  const d = new Date(date);
  return {
    day: d.getDate(),
    month: d.toLocaleString("en-IN", { month: "short" }),
    time: d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }),
  };
}

export type RegistrationStatus = "open" | "closing" | "closed";

// UI hint only. The backend decides whether a registration is accepted.
export function registrationStatus(event: Event): RegistrationStatus {
  const deadline = new Date(event.registration_deadline).getTime();
  const now = Date.now();
  if (deadline < now) return "closed";
  if (deadline - now < 48 * 60 * 60 * 1000) return "closing";
  return "open";
}

export function firstName(name?: string) {
  return name ? name.trim().split(/\s+/)[0] : "";
}

export function initials(name?: string) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}