const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class APIError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "APIError";
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { auth = false, headers, ...rest } = options;

  const token = sessionStorage.getItem("access_token");
  const requestHeaders = new Headers(headers);

  if (
    rest.body &&
    !(rest.body instanceof URLSearchParams) &&
    !(rest.body instanceof FormData)
  ) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth && token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers: requestHeaders,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && auth) {
      sessionStorage.removeItem("access_token");
    }

    let message = "Something went wrong. Please try again.";
    if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data?.detail)) {
      message = data.detail
        .map((item: { loc?: unknown[]; msg?: string }) => {
          const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : "";
          return field ? `${String(field)}: ${item.msg ?? "Invalid value"}` : item.msg ?? "Invalid input";
        })
        .join(", ");
    }

    throw new APIError(message, response.status);
  }

  return data as T;
}
