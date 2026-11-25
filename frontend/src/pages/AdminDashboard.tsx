import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarX,
  CheckCircle2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";

import { approveOrganiser, listOrganisers } from "../api/auth";
import { createEvent, getEventRegistrations, getManagedEvents } from "../api/events";
import { useAuth } from "../context/AuthContext";
import type { User } from "../types/auth";
import type { CustomField, CustomFieldType, Event, EventCreate, EventParticipant } from "../types/event";
import AppShell from "../components/AppShell";
import EventCard from "../components/EventCard";
import { Alert, EmptyState, EventSkeletons } from "../components/ui";

type Filter = "all" | "upcoming" | "past";
type Sort = "newest" | "oldest" | "date-asc" | "date-desc";
type PortalTab = "events" | "organisers";

const emptyForm: EventCreate = {
  title: "",
  description: "",
  event_type: "Hackathon",
  venue: "",
  event_date: "",
  registration_deadline: "",
  max_participants: 100,
  custom_fields: [],
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
  const { user } = useAuth();
  const isAdmin = user?.role.toLowerCase() === "admin";

  const [activeTab, setActiveTab] = useState<PortalTab>("events");
  const [events, setEvents] = useState<Event[]>([]);
  const [organisers, setOrganisers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [eventFilter, setEventFilter] = useState<Filter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<Sort>("newest");
  const [formData, setFormData] = useState<EventCreate>(emptyForm);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const now = new Date();
  const upcomingEvents = events.filter((event) => new Date(event.event_date) >= now);
  const pastEvents = events.filter((event) => new Date(event.event_date) < now);
  const pendingOrganisers = organisers.filter((o) => !o.is_approved);

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

  async function fetchData() {
    try {
      setLoading(true);
      setError("");
      const eventsData = await getManagedEvents();
      setEvents(eventsData);

      if (isAdmin) {
        const orgsData = await listOrganisers(false);
        setOrganisers(orgsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((previous) => ({
      ...previous,
      [name]: name === "max_participants" ? Number(value) : value,
    }));
  }

  function addCustomField() {
    setCustomFields((prev) => [
      ...prev,
      { name: `field_${prev.length + 1}`, label: "", field_type: "text", required: false, options: [] },
    ]);
  }

  function updateCustomField(index: number, patch: Partial<CustomField>) {
    setCustomFields((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, ...patch };
        if (patch.label !== undefined) {
          updated.name =
            patch.label
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "_")
              .replace(/^_|_$/g, "") || `field_${i + 1}`;
        }
        return updated;
      })
    );
  }

  function removeCustomField(index: number) {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreateEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSubmitting(true);
      setMessage("");
      setError("");

      const validFields = customFields.filter((f) => f.label.trim().length > 0);

      await createEvent({
        ...formData,
        description: formData.description || null,
        event_date: new Date(formData.event_date).toISOString(),
        registration_deadline: new Date(formData.registration_deadline).toISOString(),
        custom_fields: validFields,
      });

      setMessage("Event created successfully!");
      setFormData(emptyForm);
      setCustomFields([]);
      setShowForm(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create event.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleViewParticipants(event: Event) {
    setSelectedEvent(event);
    setLoadingParticipants(true);
    try {
      const list = await getEventRegistrations(event.id);
      setParticipants(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load participants.");
      setSelectedEvent(null);
    } finally {
      setLoadingParticipants(false);
    }
  }

  async function handleApprovalToggle(organiserId: number, approve: boolean) {
    try {
      setMessage("");
      setError("");
      await approveOrganiser(organiserId, approve);
      setMessage(approve ? "Organiser account approved." : "Organiser access revoked.");
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update organiser status.");
    }
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
  ];

  const listTitle = eventFilter === "all" ? "Managed events" : eventFilter === "upcoming" ? "Upcoming events" : "Past events";

  return (
    <AppShell subtitle={isAdmin ? "Admin Portal" : "Organiser Portal"}>
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">
            {isAdmin ? "Admin dashboard" : "Organiser dashboard"}
          </h1>
          <p className="mt-2 text-muted">
            {isAdmin
              ? "Manage campus events, inspect participant rosters, and approve event organisers."
              : "Create events, customize registration questions, and track student participants."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {isAdmin && (
            <div className="flex rounded-xl border border-line bg-panel p-1">
              <button
                type="button"
                onClick={() => setActiveTab("events")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === "events" ? "bg-accent text-ink" : "text-muted hover:text-white"
                }`}
              >
                Events ({events.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("organisers")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === "organisers" ? "bg-accent text-ink" : "text-muted hover:text-white"
                }`}
              >
                <ShieldCheck size={15} />
                Organisers
                {pendingOrganisers.length > 0 && (
                  <span className="rounded-full bg-warn px-2 py-0.5 text-xs font-bold text-ink">
                    {pendingOrganisers.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {activeTab === "events" && (
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
          )}
        </div>
      </section>

      <div className="mt-6 space-y-3">
        {message && <Alert kind="success">{message}</Alert>}
        {error && <Alert kind="error">{error}</Alert>}
      </div>

      {activeTab === "organisers" && isAdmin ? (
        <section className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Organiser accounts & approval requests</h2>
            <button onClick={fetchData} disabled={loading} className="btn btn-outline">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {organisers.length === 0 ? (
            <EmptyState icon={<ShieldCheck size={22} />} title="No organiser accounts yet">
              When clubs or coordinators sign up as Event Organisers, they will appear here for approval.
            </EmptyState>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {organisers.map((org) => (
                <div key={org.id} className="panel flex flex-col justify-between gap-4 p-5">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-semibold text-white">{org.name}</h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          org.is_approved ? "bg-ok/10 text-ok" : "bg-warn/10 text-warn"
                        }`}
                      >
                        {org.is_approved ? "Approved" : "Pending approval"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-accent">{org.organization_name || "Campus Organiser"}</p>
                    <p className="mt-1 text-xs text-muted">
                      {org.email} {org.department ? `• ${org.department}` : ""} {org.phone ? `• ${org.phone}` : ""}
                    </p>
                  </div>

                  <div className="flex gap-2 border-t border-line pt-4">
                    {!org.is_approved ? (
                      <button
                        type="button"
                        onClick={() => handleApprovalToggle(org.id, true)}
                        className="btn btn-primary flex-1"
                      >
                        <CheckCircle2 size={15} />
                        Approve Organiser
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApprovalToggle(org.id, false)}
                        className="btn btn-outline flex-1 text-danger hover:border-danger"
                      >
                        <XCircle size={15} />
                        Revoke Approval
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Event statistics">
            <StatCard label="Managed events" value={events.length} icon={<CalendarDays size={22} />} tone="text-accent" />
            <StatCard label="Upcoming" value={upcomingEvents.length} icon={<CalendarClock size={22} />} tone="text-ok" />
            <StatCard label="Past" value={pastEvents.length} icon={<CalendarX size={22} />} tone="text-muted" />
            <StatCard
              label="Total registrations"
              value={events.reduce((sum, ev) => sum + (ev.registered_count ?? 0), 0)}
              icon={<UserCheck size={22} />}
              tone="text-accent"
            />
          </section>

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

                {/* Custom Registration Form Builder */}
                <div className="md:col-span-2 rounded-xl border border-line bg-raised/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-white">Custom registration questions (optional)</h3>
                      <p className="text-xs text-muted">Collect team name, GitHub link, T-shirt size, or dietary notes on signup.</p>
                    </div>
                    <button type="button" onClick={addCustomField} className="btn btn-outline text-xs">
                      <Plus size={14} />
                      Add question
                    </button>
                  </div>

                  {customFields.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {customFields.map((field, idx) => (
                        <div key={idx} className="grid gap-3 rounded-lg border border-line bg-panel p-3 sm:grid-cols-[1fr_9rem_auto_auto] sm:items-center">
                          <input
                            type="text"
                            placeholder="Question label (e.g. Team Name)"
                            value={field.label}
                            onChange={(e) => updateCustomField(idx, { label: e.target.value })}
                            className="input"
                          />
                          <select
                            value={field.field_type}
                            onChange={(e) => updateCustomField(idx, { field_type: e.target.value as CustomFieldType })}
                            className="input"
                          >
                            <option value="text">Short text</option>
                            <option value="textarea">Long text</option>
                            <option value="number">Number</option>
                            <option value="select">Dropdown</option>
                          </select>
                          <label className="flex items-center gap-2 text-xs text-soft">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateCustomField(idx, { required: e.target.checked })}
                            />
                            Required
                          </label>
                          <button type="button" onClick={() => removeCustomField(idx)} className="btn btn-outline px-2.5 text-danger">
                            <Trash2 size={14} />
                          </button>

                          {field.field_type === "select" && (
                            <input
                              type="text"
                              placeholder="Comma-separated options (e.g. S, M, L, XL)"
                              value={field.options.join(", ")}
                              onChange={(e) =>
                                updateCustomField(idx, {
                                  options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                                })
                              }
                              className="input sm:col-span-4"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <button type="submit" disabled={submitting} className="btn btn-primary w-full py-3">
                    {submitting ? "Creating event..." : "Create event"}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="mt-10">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{listTitle}</h2>
                <p className="mt-1 text-sm text-muted">{filteredEvents.length} event(s) found</p>
              </div>
              <button onClick={fetchData} disabled={loading} className="btn btn-outline">
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
                      <div className="flex items-center justify-between gap-2 border-t border-line pt-4">
                        <span className="text-xs text-muted">
                          {event.registered_count ?? 0} / {event.max_participants} filled
                        </span>
                        <button
                          type="button"
                          onClick={() => handleViewParticipants(event)}
                          className="btn btn-outline px-3 py-1.5 text-xs"
                        >
                          <Users size={14} />
                          Participants
                        </button>
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Participant Roster Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="panel flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedEvent.title} — Participants</h3>
                <p className="text-xs text-muted">
                  {participants.length} of {selectedEvent.max_participants} seats registered
                </p>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="btn btn-outline px-2.5 py-1.5">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingParticipants ? (
                <p className="text-sm text-muted">Loading registered students...</p>
              ) : participants.length === 0 ? (
                <EmptyState icon={<Users size={22} />} title="No registrations yet">
                  Students who register for this event will appear here.
                </EmptyState>
              ) : (
                <div className="space-y-3">
                  {participants.map((p) => (
                    <div key={p.registration_id} className="rounded-xl border border-line bg-raised/50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-white">{p.student_name}</p>
                          <p className="text-xs text-muted">
                            {p.student_email}
                            {p.usn ? ` • USN: ${p.usn}` : ""}
                            {p.department ? ` • ${p.department}` : ""}
                            {p.phone ? ` • ${p.phone}` : ""}
                          </p>
                        </div>
                        <span className="text-xs text-muted">
                          {new Date(p.registered_at).toLocaleDateString()}
                        </span>
                      </div>

                      {Object.keys(p.custom_responses || {}).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 border-t border-line/60 pt-2.5 text-xs">
                          {Object.entries(p.custom_responses).map(([k, v]) => (
                            <span key={k} className="rounded-md bg-panel px-2.5 py-1 text-soft">
                              <strong className="text-white">{k}:</strong> {String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
