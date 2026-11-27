import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Check, Clock, MapPin, Trash2, Users } from "lucide-react";

import {
  getEventById,
  getMyRegistrations,
  registerForEvent,
  unregisterFromEvent,
} from "../api/events";
import { useAuth } from "../context/AuthContext";
import type { Event, MyRegistrationDetail } from "../types/event";
import AppShell from "../components/AppShell";
import { Alert } from "../components/ui";
import { formatDateTime, registrationStatus } from "../lib/format";

export default function EventDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [registration, setRegistration] = useState<MyRegistrationDetail | null>(null);
  const [customResponses, setCustomResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadEvent() {
    try {
      setLoading(true);
      setError("");

      if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
        throw new Error("Invalid event ID.");
      }

      const eventData = await getEventById(Number(id));
      setEvent(eventData);

      const initialResponses: Record<string, string> = {};
      for (const field of eventData.custom_fields || []) {
        initialResponses[field.name] =
          field.field_type === "select" && field.options?.length > 0 ? field.options[0] : "";
      }
      setCustomResponses(initialResponses);

      if (user) {
        const registrations = await getMyRegistrations();
        const found = registrations.find((r) => r.event_id === eventData.id) || null;
        setRegistration(found);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load event details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvent();
  }, [id, user]);

  async function handleRegister(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!event) return;

    const confirmed = window.confirm(
      `Confirm your registration for "${event.title}" at ${event.venue}?`,
    );
    if (!confirmed) return;

    try {
      setSubmitting(true);
      setMessage("");
      setError("");

      await registerForEvent(event.id, customResponses);
      await loadEvent();
      setMessage("Successfully registered for this event!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUnregister() {
    if (!event) return;

    const confirmed = window.confirm(
      `Are you sure you want to cancel your registration for "${event.title}"?`,
    );
    if (!confirmed) return;

    try {
      setSubmitting(true);
      setMessage("");
      setError("");

      await unregisterFromEvent(event.id);
      setRegistration(null);
      await loadEvent();
      setMessage("You have unregistered from this event.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to unregister.");
    } finally {
      setSubmitting(false);
    }
  }

  const closed = event
    ? Boolean(event.is_closed) || registrationStatus(event) === "closed"
    : false;
  const isFull = event ? (event.registered_count ?? 0) >= event.max_participants : false;

  const details = event
    ? [
        { icon: CalendarDays, label: "Event date", value: formatDateTime(event.event_date) },
        { icon: MapPin, label: "Venue", value: event.venue },
        { icon: Clock, label: "Register by", value: formatDateTime(event.registration_deadline) },
        {
          icon: Users,
          label: "Capacity",
          value: `${event.registered_count ?? 0} / ${event.max_participants} participants`,
        },
      ]
    : [];

  return (
    <AppShell subtitle="Events & Hackathons" maxWidth="max-w-5xl">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-white"
      >
        <ArrowLeft size={17} />
        Back to events
      </button>

      {loading ? (
        <div className="grid animate-pulse gap-6 lg:grid-cols-[1fr_22rem]" aria-busy="true">
          <div className="space-y-4">
            <div className="h-4 w-24 rounded bg-raised" />
            <div className="h-10 w-3/4 rounded bg-raised" />
            <div className="h-24 w-full rounded bg-raised" />
          </div>
          <div className="h-72 rounded-2xl bg-raised" />
        </div>
      ) : error && !event ? (
        <Alert kind="error">{error}</Alert>
      ) : event ? (
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_23rem]">
          <section>
            <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
              {event.event_type}
            </span>
            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">{event.title}</h1>
            <p className="mt-5 max-w-2xl whitespace-pre-line leading-relaxed text-soft">
              {event.description || "No description available for this event."}
            </p>

            {registration && Object.keys(registration.custom_responses || {}).length > 0 && (
              <div className="panel mt-8 p-5">
                <h2 className="text-sm font-semibold text-white">Your submitted registration responses</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  {Object.entries(registration.custom_responses || {}).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-line/60 pb-2 last:border-none">
                      <dt className="text-muted">{k}</dt>
                      <dd className="font-medium text-white">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </section>

          <aside className="panel overflow-hidden lg:sticky lg:top-24">
            <dl className="space-y-5 p-6">
              {details.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-raised text-accent">
                    <Icon size={16} />
                  </span>
                  <div>
                    <dt className="text-xs text-muted">{label}</dt>
                    <dd className="mt-0.5 text-sm font-medium text-white">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>

            <div className="space-y-4 border-t border-dashed border-line bg-raised/50 p-6">
              {message && <Alert kind="success">{message}</Alert>}
              {error && <Alert kind="error">{error}</Alert>}

              {registration ? (
                <div className="space-y-3">
                  <button disabled className="btn btn-done w-full py-3">
                    <Check size={17} />
                    You're registered
                  </button>
                  {!closed && (
                    <button
                      type="button"
                      onClick={handleUnregister}
                      disabled={submitting}
                      className="btn btn-outline w-full py-2.5 text-danger hover:border-danger"
                    >
                      <Trash2 size={15} />
                      {submitting ? "Cancelling..." : "Cancel registration"}
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  {(event.custom_fields || []).map((field) => (
                    <div key={field.name}>
                      <label htmlFor={`cf-${field.name}`} className="label">
                        {field.label} {field.required && <span className="text-danger">*</span>}
                      </label>
                      {field.field_type === "select" ? (
                        <select
                          id={`cf-${field.name}`}
                          required={field.required}
                          value={customResponses[field.name] ?? ""}
                          onChange={(e) =>
                            setCustomResponses((prev) => ({ ...prev, [field.name]: e.target.value }))
                          }
                          className="input"
                        >
                          {(field.options || []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.field_type === "textarea" ? (
                        <textarea
                          id={`cf-${field.name}`}
                          rows={2}
                          required={field.required}
                          value={customResponses[field.name] ?? ""}
                          onChange={(e) =>
                            setCustomResponses((prev) => ({ ...prev, [field.name]: e.target.value }))
                          }
                          className="input"
                        />
                      ) : (
                        <input
                          id={`cf-${field.name}`}
                          type={field.field_type === "number" ? "number" : "text"}
                          required={field.required}
                          value={customResponses[field.name] ?? ""}
                          onChange={(e) =>
                            setCustomResponses((prev) => ({ ...prev, [field.name]: e.target.value }))
                          }
                          className="input"
                        />
                      )}
                    </div>
                  ))}

                  <button
                    type="submit"
                    disabled={submitting || closed || isFull}
                    className="btn btn-primary w-full py-3"
                  >
                    {submitting
                      ? "Registering..."
                      : closed
                        ? "Registration closed"
                        : isFull
                          ? "Event full"
                          : "Register for this event"}
                  </button>
                </form>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </AppShell>
  );
}
