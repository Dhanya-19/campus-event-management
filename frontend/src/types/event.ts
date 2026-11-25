export type CustomFieldType = "text" | "number" | "select" | "textarea";

export interface CustomField {
  name: string;
  label: string;
  field_type: CustomFieldType;
  required: boolean;
  options: string[];
}

export interface Event {
  id: number;
  title: string;
  description: string | null;
  event_type: string;
  venue: string;
  event_date: string;
  registration_deadline: string;
  max_participants: number;
  custom_fields: CustomField[];
  created_by: number;
  registered_count?: number;
  is_closed?: boolean;
}

export interface EventCreate {
  title: string;
  description: string | null;
  event_type: string;
  venue: string;
  event_date: string;
  registration_deadline: string;
  max_participants: number;
  custom_fields?: CustomField[];
}

export interface Registration {
  id: number;
  user_id: number;
  event_id: number;
  custom_responses?: Record<string, string | number>;
  registered_at: string;
}

export interface MyRegistrationDetail extends Registration {
  event_title: string;
  event_type: string;
  venue: string;
  event_date: string;
  registration_deadline: string;
  is_closed: boolean;
}

export interface EventParticipant {
  registration_id: number;
  user_id: number;
  student_name: string;
  student_email: string;
  usn?: string | null;
  department?: string | null;
  phone?: string | null;
  custom_responses: Record<string, string | number>;
  registered_at: string;
}
