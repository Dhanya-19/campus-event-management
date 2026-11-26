import { apiRequest } from "./client";
import type {
  User,
  LoginResponse,
  RegisterRequest,
  UserUpdateRequest,
} from "../types/auth";

export function registerUser(data: RegisterRequest) {
  return apiRequest<User>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function loginUser(email: string, password: string) {
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);

  const response = await apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body,
  });

  sessionStorage.setItem("access_token", response.access_token);
  return response;
}

export function getCurrentUser() {
  return apiRequest<User>("/api/auth/me", {
    method: "GET",
    auth: true,
  });
}

export function updateMyProfile(data: UserUpdateRequest) {
  return apiRequest<User>("/api/auth/me", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(data),
  });
}

export function listOrganisers(pendingOnly = false) {
  const query = pendingOnly ? "?pending_only=true" : "";
  return apiRequest<User[]>(`/api/auth/organisers${query}`, {
    method: "GET",
    auth: true,
  });
}

export function approveOrganiser(userId: number, approved = true) {
  return apiRequest<User>(
    `/api/auth/organisers/${userId}/approve?approved=${approved}`,
    {
      method: "PATCH",
      auth: true,
    }
  );
}

export function logoutUser() {
  sessionStorage.removeItem("access_token");
}

export async function loginWithGoogleToken(idToken: string): Promise<void> {
  const data = await apiRequest<{
    access_token: string;
    token_type: string;
    role: string;
  }>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ id_token: idToken }),
  });

  sessionStorage.setItem("access_token", data.access_token);
}
