export type UserRole = "student" | "organiser" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole | string;
  is_approved: boolean;
  organization_name?: string | null;
  department?: string | null;
  phone?: string | null;
  usn?: string | null;
  created_at?: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: "student" | "organiser";
  organization_name?: string | null;
  department?: string | null;
  phone?: string | null;
  usn?: string | null;
}

export interface UserUpdateRequest {
  name?: string;
  organization_name?: string | null;
  department?: string | null;
  phone?: string | null;
  usn?: string | null;
  current_password?: string;
  new_password?: string;
}
