import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Check, Clock, MapPin, Users } from "lucide-react";

import { getEventById, getMyRegistrations, registerForEvent } from "../api/events";
import { useAuth } from "../context/AuthContext";
import type { Event, Registration } from "../types/event";
import AppShell from "../components/AppShell";
import { Alert } from "../components/ui";
import { formatDateTime, registrationStatus } from "../lib/format";

export default function EventDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true);
        setError("");

        if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
          throw new Error("Invalid event ID.");
        }

        const eventData = await getEventById(Number(id));
        setEvent(eventData);

        if (user) {
          const registrations: Registration[] = await getMyRegistrations();
          setRegistered(registrations.some((r) => r.event_id === eventData.id));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load event details.");
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [id, user]);

  async function handleRegister() {
    if (!event) return;

    try {
      setRegistering(true);
      setMessage("");
      setError("");

      await registerForEvent(event.id);

      setRegistered(true);
      setMessage("Successfully registered for this event!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setRegistering(false);
    }
  }

  const closed = event ? registrationStatus(event) === "closed" : false;

  const details = event
    ? [
        { icon: CalendarDays, label: "Event date", value: formatDateTime(event.event_date) },
        { icon: MapPin, label: "Venue", value: event.venue },
        { icon: Clock, label: "Register by", value: formatDateTime(event.registration_deadline) },
        { icon: Users, label: "Capacity", value: `${event.max_participants} participants` },
      ]
    : [];

  return (
    <AppShell subtitle="Events & Hackathons" maxWidth="max-w-5xl">
      <button
        onClick={() => navigate("/student-dashboard")}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-white"
      >
        <ArrowLeft size={17} />
        Back to events
      </button>

      {loading ? (
        <div className="grid animate-pulse gap-6 lg:grid-cols-[1fr_20rem]" aria-busy="true">
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
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_21rem]">
          <section>
            <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
              {event.event_type}
            </span>
            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">{event.title}</h1>
            <p className="mt-5 max-w-2xl whitespace-pre-line leading-relaxed text-soft">
              {event.description || "No description available for this event."}
            </p>
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

            <div className="space-y-3 border-t border-dashed border-line bg-raised/50 p-6">
              {message && <Alert kind="success">{message}</Alert>}
              {error && <Alert kind="error">{error}</Alert>}

              {registered ? (
                <button disabled className="btn btn-done w-full py-3">
                  <Check size={17} />
                  You're registered
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={registering || closed}
                  className="btn btn-primary w-full py-3"
                >
                  {registering ? "Registering…" : closed ? "Registration closed" : "Register for this event"}
                </button>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </AppShell>
  );
}