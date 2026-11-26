import { apiRequest } from "./client";
import type {
  Event,
  EventCreate,
  EventParticipant,
  MyRegistrationDetail,
  Registration,
} from "../types/event";

export interface EventQueryParams {
  q?: string;
  event_type?: string;
  date?: string;
  include_closed?: boolean;
}

export function getAllEvents(params?: EventQueryParams) {
  const search = new URLSearchParams();
  if (params?.q?.trim()) search.set("q", params.q.trim());
  if (params?.event_type && params.event_type !== "All") {
    search.set("event_type", params.event_type);
  }
  if (params?.date) search.set("date", params.date);
  if (params?.include_closed) search.set("include_closed", "true");

  const qs = search.toString();
  return apiRequest<Event[]>(`/api/events${qs ? `?${qs}` : ""}`);
}

export function getManagedEvents() {
  return apiRequest<Event[]>("/api/events/managed", {
    method: "GET",
    auth: true,
  });
}

export function getEventById(id: number) {
  return apiRequest<Event>(`/api/events/${id}`);
}

export function createEvent(data: EventCreate) {
  return apiRequest<Event>("/api/events", {
    method: "POST",
    auth: true,
    body: JSON.stringify(data),
  });
}

export function updateEvent(id: number, data: Partial<EventCreate>) {
  return apiRequest<Event>(`/api/events/${id}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(data),
  });
}

export function getEventRegistrations(eventId: number) {
  return apiRequest<EventParticipant[]>(`/api/events/${eventId}/registrations`, {
    method: "GET",
    auth: true,
  });
}

export function registerForEvent(
  eventId: number,
  customResponses: Record<string, string | number> = {}
) {
  return apiRequest<Registration>(`/api/events/${eventId}/register`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ custom_responses: customResponses }),
  });
}

export function unregisterFromEvent(eventId: number) {
  return apiRequest<{ message: string }>(`/api/events/${eventId}/register`, {
    method: "DELETE",
    auth: true,
  });
}

export function getMyRegistrations() {
  return apiRequest<MyRegistrationDetail[]>("/api/events/my-registrations", {
    method: "GET",
    auth: true,
  });
}
