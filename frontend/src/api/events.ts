
import { apiRequest } from "./client";

import type {
  Event,
  EventCreate,
  Registration,
} from "../types/event";

// Fetch all events
export function getAllEvents() {
  return apiRequest<Event[]>("/api/events/");
}

// Fetch a particular event
export function getEventById(id: number) {
  return apiRequest<Event>(`/api/events/${id}`);
}

// Create an event (Admin only)
export function createEvent(data: EventCreate) {
  return apiRequest<Event>("/api/events/", {
    method: "POST",
    auth: true,
    body: JSON.stringify(data),
  });
}

// Register for an event
export function registerForEvent(eventId: number) {
  return apiRequest<Registration>(
    `/api/events/${eventId}/register`,
    {
      method: "POST",
      auth: true,
    }
  );
}

export function getMyRegistrations() {
  return apiRequest<Registration[]>("/api/events/my-registrations", {
    method: "GET",
    auth: true,
  });
}
