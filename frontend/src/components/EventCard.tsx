import type { ReactNode } from "react";
import { Clock, MapPin, Users } from "lucide-react";
import type { Event } from "../types/event";
import { dateParts, formatDateTime, registrationStatus } from "../lib/format";

const statusChip = {
  open: { label: "Registration open", cls: "bg-accent/10 text-accent" },
  closing: { label: "Closing soon", cls: "bg-warn/10 text-warn" },
  closed: { label: "Registration closed", cls: "bg-danger/10 text-danger" },
} as const;

export default function EventCard({
  event,
  registered = false,
  onClick,
  footer,
}: {
  event: Event;
  registered?: boolean;
  onClick?: () => void;
  footer?: ReactNode;
}) {
  const { day, month, time } = dateParts(event.event_date);
  const status = statusChip[registrationStatus(event)];
  const count = event.registered_count ?? 0;

  return (
    <article
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`group relative flex overflow-hidden rounded-2xl border border-line bg-panel transition-colors hover:border-accent/50 ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex w-20 shrink-0 flex-col items-center justify-center border-r border-dashed border-line bg-raised px-2 py-5 text-center">
        <span className="font-display text-3xl font-bold leading-none text-white">{day}</span>
        <span className="mt-1 text-xs font-medium text-accent">{month}</span>
        <span className="mt-2 text-[11px] leading-tight text-muted">{time}</span>
      </div>
      <span aria-hidden="true" className="absolute -top-2 left-[calc(5rem-0.5rem)] h-4 w-4 rounded-full border border-line bg-ink" />
      <span aria-hidden="true" className="absolute -bottom-2 left-[calc(5rem-0.5rem)] h-4 w-4 rounded-full border border-line bg-ink" />

      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-accent">{event.event_type}</span>
          {registered ? (
            <span className="rounded-full bg-ok/10 px-2.5 py-0.5 text-xs font-medium text-ok">Registered</span>
          ) : (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.cls}`}>{status.label}</span>
          )}
        </div>

        <h3 className="mt-2 text-lg font-semibold leading-snug group-hover:text-accent">{event.title}</h3>
        <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-muted">
          {event.description || "No description available."}
        </p>

        <ul className="mt-4 space-y-2 text-sm text-soft">
          <li className="flex items-center gap-2.5">
            <MapPin size={15} className="shrink-0 text-muted" />
            <span className="truncate">{event.venue}</span>
          </li>
          <li className="flex items-center gap-2.5">
            <Users size={15} className="shrink-0 text-muted" />
            {count} / {event.max_participants} registered
          </li>
          <li className="flex items-center gap-2.5">
            <Clock size={15} className="shrink-0 text-muted" />
            Register by {formatDateTime(event.registration_deadline)}
          </li>
        </ul>

        {footer && (
          <div className="mt-auto pt-5" onClick={(e) => e.stopPropagation()}>
            {footer}
          </div>
        )}
      </div>
    </article>
  );
}
