import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, RefreshCw, Ticket } from "lucide-react";

import { getAllEvents, getMyRegistrations, registerForEvent } from "../api/events";
import { useAuth } from "../context/AuthContext";
import type { Event } from "../types/event";
import AppShell from "../components/AppShell";
import EventCard from "../components/EventCard";
import { Alert, EmptyState, EventSkeletons } from "../components/ui";
import { firstName, registrationStatus } from "../lib/format";

export default function StudentDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<number>>(new Set());

  const { user } = useAuth();
  const navigate = useNavigate();

  const registeredEvents = events.filter((event) => registeredEventIds.has(event.id));
  const availableEvents = events.filter((event) => !registeredEventIds.has(event.id));

  async function fetchEvents() {
    try {
      setLoading(true);
      setError("");

      const [eventsData, registrationsData] = await Promise.all([
        getAllEvents(),
        getMyRegistrations(),
      ]);

      setEvents(eventsData);
      setRegisteredEventIds(new Set(registrationsData.map((r) => r.event_id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load events.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  async function handleRegister(eventId: number) {
    try {
      setRegistering(eventId);
      setMessage("");
      setError("");

      await registerForEvent(eventId);

      setRegisteredEventIds((previous) => {
        const updated = new Set(previous);
        updated.add(eventId);
        return updated;
      });

      setMessage("Successfully registered for the event!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setRegistering(null);
    }
  }

  return (
    <AppShell subtitle="Events & Hackathons">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Hi {firstName(user?.name)}, find your next event</h1>
          <p className="mt-2 max-w-xl text-muted">
            Browse what is happening on campus and register before the deadline closes.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="panel px-5 py-3">
            <p className="font-display text-2xl font-bold text-white">{availableEvents.length}</p>
            <p className="text-xs text-muted">Available</p>
          </div>
          <div className="panel px-5 py-3">
            <p className="font-display text-2xl font-bold text-ok">{registeredEvents.length}</p>
            <p className="text-xs text-muted">Registered</p>
          </div>
        </div>
      </section>

      <div className="mt-8 space-y-3">
        {message && <Alert kind="success">{message}</Alert>}
        {error && <Alert kind="error">{error}</Alert>}
      </div>

      {/* Available events */}
      <section className="mt-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Available events</h2>
          <button onClick={fetchEvents} disabled={loading} className="btn btn-outline">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {loading && <EventSkeletons />}

        {!loading && !error && availableEvents.length === 0 && (
          <EmptyState icon={<CalendarDays size={22} />} title="You're all caught up">
            {events.length === 0
              ? "No events have been published yet. Check back soon."
              : "You have registered for every available event."}
          </EmptyState>
        )}

        {!loading && availableEvents.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {availableEvents.map((event) => {
              const closed = registrationStatus(event) === "closed";
              return (
                <EventCard
                  key={event.id}
                  event={event}
                  footer={
                    <div className="grid grid-cols-2 gap-2.5">
                      <button onClick={() => navigate(`/events/${event.id}`)} className="btn btn-outline">
                        View details
                      </button>
                      <button
                        onClick={() => handleRegister(event.id)}
                        disabled={registering === event.id || closed}
                        className="btn btn-primary"
                      >
                        {registering === event.id ? "Registering…" : closed ? "Closed" : "Register"}
                      </button>
                    </div>
                  }
                />
              );
            })}
          </div>
        )}
      </section>

      {/* My registrations */}
      <section className="mt-14">
        <div className="mb-5">
          <h2 className="text-xl font-semibold">My registrations</h2>
          <p className="mt-1 text-sm text-muted">Events you have successfully registered for.</p>
        </div>

        {loading ? (
          <EventSkeletons count={1} />
        ) : registeredEvents.length === 0 ? (
          <EmptyState icon={<Ticket size={22} />} title="No registrations yet">
            Register for an event above and it will show up here.
          </EmptyState>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {registeredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                registered
                footer={
                  <button onClick={() => navigate(`/events/${event.id}`)} className="btn btn-outline w-full">
                    View event
                  </button>
                }
              />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}