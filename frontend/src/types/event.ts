export interface Event {
  id: number;
  title: string;
  description: string | null;
  event_type: string;
  venue: string;
  event_date: string;
  registration_deadline: string;
  max_participants: number;
  created_by: number;
}

export interface EventCreate {
  title: string;
  description: string | null;
  event_type: string;
  venue: string;
  event_date: string;
  registration_deadline: string;
  max_participants: number;
}

export interface Registration {
  id: number;
  user_id: number;
  event_id: number;
  registered_at: string;
}