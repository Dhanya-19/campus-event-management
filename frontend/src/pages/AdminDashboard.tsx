import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { CalendarCheck, CalendarClock, CalendarDays, CalendarX, Plus, RefreshCw, Search, UserCheck, X } from "lucide-react";

import { getAllEvents, createEvent } from "../api/events";
import { useAuth } from "../context/AuthContext";
import type { Event, EventCreate } from "../types/event";
import AppShell from "../components/AppShell";
import EventCard from "../components/EventCard";
import { Alert, EmptyState, EventSkeletons } from "../components/ui";

type Filter = "all" | "upcoming" | "past";
type Sort = "newest" | "oldest" | "date-asc" | "date-desc";

const emptyForm: EventCreate = {
  title: "",
  description: "",
  event_type: "Hackathon",
  venue: "",
  event_date: "",
  registration_deadline: "",
  max_participants: 100,
};

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: ReactNode; tone: string }) {
  return (
    <div className="panel flex items-center gap-4 p-5">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-raised ${tone}`}>{icon}</span>
      <div>
        <p className="font-display text-3xl font-bold leading-none text-white">{value}</p>
        <p className="mt-1.5 text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [eventFilter, setEventFilter] = useState<Filter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<Sort>("newest");
  const [formData, setFormData] = useState<EventCreate>(emptyForm);

  const { user } = useAuth();
  const now = new Date();

  const upcomingEvents = events.filter((event) => new Date(event.event_date) >= now);
  const pastEvents = events.filter((event) => new Date(event.event_date) < now);

  const filteredEvents = (
    eventFilter === "upcoming" ? upcomingEvents : eventFilter === "past" ? pastEvents : events
  )
    .filter((event) => {
      const query = searchQuery.toLowerCase();
      return (
        event.title.toLowerCase().includes(query) ||
        event.venue.toLowerCase().includes(query) ||
        event.event_type.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case "newest":
          return b.id - a.id;
        case "oldest":
          return a.id - b.id;
        case "date-asc":
          return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
        case "date-desc":
          return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
        default:
          return 0;
      }
    });

  async function fetchEvents() {
    try {
      setLoading(true);
      setError("");
      const data = await getAllEvents();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load events.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((previous) => ({
      ...previous,
      [name]: name === "max_participants" ? Number(value) : value,
    }));
  }

  async function handleCreateEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSubmitting(true);
      setMessage("");
      setError("");

      await createEvent({
        ...formData,
        description: formData.description || null,
        event_date: new Date(formData.event_date).toISOString(),
        registration_deadline: new Date(formData.registration_deadline).toISOString(),
      });

      setMessage("Event created successfully!");
      setFormData(emptyForm);
      setShowForm(false);
      await fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create event.");
    } finally {
      setSubmitting(false);
    }
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
  ];

  const listTitle = eventFilter === "all" ? "All events" : eventFilter === "upcoming" ? "Upcoming events" : "Past events";

  return (
    <AppShell subtitle="Admin Portal">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Admin dashboard</h1>
          <p className="mt-2 text-muted">Create and manage campus events and hackathons.</p>
        </div>

        <button
          onClick={() => {
            setShowForm(!showForm);
            setMessage("");
            setError("");
          }}
          className="btn btn-primary px-5 py-3"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Close form" : "Create event"}
        </button>
      </section>

      <div className="mt-6 space-y-3">
        {message && <Alert kind="success">{message}</Alert>}
        {error && <Alert kind="error">{error}</Alert>}
      </div>

      {/* Statistics */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Event statistics">
        <StatCard label="Total events" value={events.length} icon={<CalendarDays size={22} />} tone="text-accent" />
        <StatCard label="Upcoming" value={upcomingEvents.length} icon={<CalendarClock size={22} />} tone="text-ok" />
        <StatCard label="Past" value={pastEvents.length} icon={<CalendarX size={22} />} tone="text-muted" />
        <StatCard
          label="Created by you"
          value={events.filter((event) => event.created_by === user?.id).length}
          icon={<UserCheck size={22} />}
          tone="text-accent"
        />
      </section>

      {/* Create event form */}
      {showForm && (
        <section className="panel mt-8 p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Create new event</h2>
          <p className="mt-1 text-sm text-muted">Students will see it as soon as you save.</p>

          <form onSubmit={handleCreateEvent} className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="title" className="label">Event title</label>
              <input id="title" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. AI Hackathon" className="input" />
            </div>

            <div>
              <label htmlFor="event_type" className="label">Event type</label>
              <select id="event_type" name="event_type" value={formData.event_type} onChange={handleChange} className="input">
                <option value="Hackathon">Hackathon</option>
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Competition">Competition</option>
                <option value="Cultural">Cultural</option>
                <option value="Technical">Technical</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="label">Description</label>
              <textarea id="description" name="description" value={formData.description ?? ""} onChange={handleChange} rows={3} placeholder="What is this event about?" className="input" />
            </div>

            <div>
              <label htmlFor="venue" className="label">Venue</label>
              <input id="venue" name="venue" value={formData.venue} onChange={handleChange} required placeholder="e.g. Main Auditorium" className="input" />
            </div>

            <div>
              <label htmlFor="max_participants" className="label">Maximum participants</label>
              <input id="max_participants" type="number" name="max_participants" value={formData.max_participants} onChange={handleChange} min={1} required className="input" />
            </div>

            <div>
              <label htmlFor="event_date" className="label">Event date and time</label>
              <input id="event_date" type="datetime-local" name="event_date" value={formData.event_date} onChange={handleChange} required className="input" />
            </div>

            <div>
              <label htmlFor="registration_deadline" className="label">Registration deadline</label>
              <input id="registration_deadline" type="datetime-local" name="registration_deadline" value={formData.registration_deadline} onChange={handleChange} required className="input" />
            </div>

            <div className="md:col-span-2">
              <button type="submit" disabled={submitting} className="btn btn-primary w-full py-3">
                {submitting ? "Creating event…" : "Create event"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Event list */}
      <section className="mt-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{listTitle}</h2>
            <p className="mt-1 text-sm text-muted">{filteredEvents.length} event(s) found</p>
          </div>
          <button onClick={fetchEvents} disabled={loading} className="btn btn-outline">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[14rem] flex-1">
            <label htmlFor="search" className="sr-only">Search events</label>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input
              id="search"
              type="text"
              placeholder="Search by title, venue or type"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-icon"
            />
          </div>

          <div role="group" aria-label="Filter events" className="flex rounded-lg border border-line bg-panel p-1">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setEventFilter(f.key)}
                aria-pressed={eventFilter === f.key}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  eventFilter === f.key ? "bg-accent text-ink" : "text-muted hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <label htmlFor="sort" className="sr-only">Sort events</label>
          <select id="sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as Sort)} className="input w-auto">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="date-asc">Event date: earliest</option>
            <option value="date-desc">Event date: latest</option>
          </select>
        </div>

        {loading && <EventSkeletons />}

        {!loading && events.length === 0 && (
          <EmptyState icon={<CalendarDays size={22} />} title="No events yet">
            Create your first campus event to get started.
          </EmptyState>
        )}

        {!loading && !error && events.length > 0 && filteredEvents.length === 0 && (
          <EmptyState icon={<CalendarCheck size={22} />} title="No events match">
            Try a different search or filter.
          </EmptyState>
        )}

        {!loading && filteredEvents.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                footer={
                  <div className="flex items-center justify-between border-t border-line pt-4 text-xs text-muted">
                    <span>Event #{event.id}</span>
                    {event.created_by === user?.id && <span className="font-medium text-ok">Created by you</span>}
                  </div>
                }
              />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}