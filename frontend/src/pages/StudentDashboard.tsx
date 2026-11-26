import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Lock, RefreshCw, Search, Ticket, Trash2 } from "lucide-react";

import {
  getAllEvents,
  getMyRegistrations,
  registerForEvent,
  unregisterFromEvent,
} from "../api/events";
import { useAuth } from "../context/AuthContext";
import type { Event, MyRegistrationDetail } from "../types/event";
import AppShell from "../components/AppShell";
import EventCard from "../components/EventCard";
import { Alert, EmptyState, EventSkeletons } from "../components/ui";
import { firstName, registrationStatus } from "../lib/format";

const CATEGORIES = ["All", "Hackathon", "Workshop", "Seminar", "Competition", "Cultural", "Technical"];

export default function StudentDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<MyRegistrationDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { user } = useAuth();
  const navigate = useNavigate();

  const registeredEventIds = new Set(myRegistrations.map((r) => r.event_id));
  const isEventClosed = (event: Event) =>
    Boolean(event.is_closed) || registrationStatus(event) === "closed";

  const registeredEvents = events.filter((event) => registeredEventIds.has(event.id));
  const availableEvents = events.filter(
    (event) => !registeredEventIds.has(event.id) && !isEventClosed(event),
  );
  const closedEvents = events.filter(
    (event) => !registeredEventIds.has(event.id) && isEventClosed(event),
  );

  async function fetchEvents(q = searchQuery, cat = category) {
    try {
      setLoading(true);
      setError("");

      const [eventsData, registrationsData] = await Promise.all([
        getAllEvents({ q, event_type: cat, include_closed: true }),
        getMyRegistrations(),
      ]);

      setEvents(eventsData);
      setMyRegistrations(registrationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load events.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, [category]);

  async function handleRegister(event: Event) {
    if (isEventClosed(event)) {
      setError("Registration for this event is closed.");
      return;
    }

    if ((event.custom_fields || []).length > 0) {
      navigate(`/events/${event.id}`);
      return;
    }

    const confirmed = window.confirm(
      `Confirm your registration for "${event.title}" at ${event.venue}?`,
    );
    if (!confirmed) return;

    try {
      setActionId(event.id);
      setMessage("");
      setError("");

      await registerForEvent(event.id);
      await fetchEvents();
      setMessage("Successfully registered for the event!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setActionId(null);
    }
  }

  async function handleUnregister(event: Event) {
    const confirmed = window.confirm(
      `Are you sure you want to unregister from "${event.title}"?`,
    );
    if (!confirmed) return;

    try {
      setActionId(event.id);
      setMessage("");
      setError("");

      await unregisterFromEvent(event.id);
      await fetchEvents();
      setMessage("Unregistered from the event.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to unregister.");
    } finally {
      setActionId(null);
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
            <p className="font-display text-2xl font-bold text-ok">{myRegistrations.length}</p>
            <p className="text-xs text-muted">Registered</p>
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchEvents();
          }}
          className="relative min-w-[15rem] flex-1"
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by title, venue, or keyword..."
            className="input input-icon"
          />
        </form>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                category === cat
                  ? "bg-accent text-ink"
                  : "border border-line bg-panel text-muted hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button onClick={() => fetchEvents()} disabled={loading} className="btn btn-outline">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {message && <Alert kind="success">{message}</Alert>}
        {error && <Alert kind="error">{error}</Alert>}
      </div>

      <section className="mt-8">
        <div className="mb-5">
          <h2 className="text-xl font-semibold">Available events</h2>
        </div>

        {loading && <EventSkeletons />}

        {!loading && !error && availableEvents.length === 0 && (
          <EmptyState icon={<CalendarDays size={22} />} title="No matching available events">
            {events.length === 0
              ? "No open events match your current search or filter."
              : "There are no open unregistered events matching your current filter."}
          </EmptyState>
        )}

        {!loading && availableEvents.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {availableEvents.map((event) => {
              const isFull = (event.registered_count ?? 0) >= event.max_participants;
              const hasQuestions = (event.custom_fields || []).length > 0;
              return (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => navigate(`/events/${event.id}`)}
                  footer={
                    <div className="grid grid-cols-2 gap-2.5">
                      <button onClick={() => navigate(`/events/${event.id}`)} className="btn btn-outline">
                        View details
                      </button>
                      <button
                        onClick={() => handleRegister(event)}
                        disabled={actionId === event.id || isFull}
                        className="btn btn-primary"
                      >
                        {actionId === event.id
                          ? "Registering..."
                          : isFull
                            ? "Full"
                            : hasQuestions
                              ? "Fill & Register"
                              : "Register"}
                      </button>
                    </div>
                  }
                />
              );
            })}
          </div>
        )}
      </section>

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
            {registeredEvents.map((event) => {
              const closed = isEventClosed(event);
              return (
                <EventCard
                  key={event.id}
                  event={event}
                  registered
                  onClick={() => navigate(`/events/${event.id}`)}
                  footer={
                    <div className="grid grid-cols-2 gap-2.5">
                      <button onClick={() => navigate(`/events/${event.id}`)} className="btn btn-outline">
                        View ticket
                      </button>
                      <button
                        onClick={() => handleUnregister(event)}
                        disabled={actionId === event.id || closed}
                        className="btn btn-outline text-danger hover:border-danger"
                      >
                        <Trash2 size={14} />
                        {closed ? "Locked" : "Unregister"}
                      </button>
                    </div>
                  }
                />
              );
            })}
          </div>
        )}
      </section>

      {!loading && closedEvents.length > 0 && (
        <section className="mt-14">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">Closed events</h2>
            <p className="mt-1 text-sm text-muted">Registration deadlines have passed for these events.</p>
          </div>

          <div className="grid gap-5 opacity-80 md:grid-cols-2 lg:grid-cols-3">
            {closedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => navigate(`/events/${event.id}`)}
                footer={
                  <div className="grid grid-cols-2 gap-2.5">
                    <button onClick={() => navigate(`/events/${event.id}`)} className="btn btn-outline">
                      View details
                    </button>
                    <button disabled className="btn btn-outline cursor-not-allowed opacity-60">
                      <Lock size={14} />
                      Closed
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
