
import { apiRequest } from "./client";

import type {
  User,
  LoginResponse,
  RegisterRequest,
} from "../types/auth";

// Register a new user
export function registerUser(data: RegisterRequest) {
  return apiRequest<User>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Login
export async function loginUser(
  email: string,
  password: string
) {
  const body = new URLSearchParams();

  body.append("username", email);
  body.append("password", password);

  const response = await apiRequest<LoginResponse>(
    "/api/auth/login",
    {
      method: "POST",
      body,
    }
  );

  sessionStorage.setItem(
    "access_token",
    response.access_token
  );

  return response;
}

// Get logged-in user
export function getCurrentUser() {
  return apiRequest<User>("/api/auth/me", {
    method: "GET",
    auth: true,
  });
}

// Logout
export function logoutUser() {
  sessionStorage.removeItem("access_token");
}
