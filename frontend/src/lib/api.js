const BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";
let refreshPromise = null;

export class ApiError extends Error {
  constructor(status, error = {}) {
    super(error.message || "The request could not be completed.");
    this.name = "ApiError";
    this.status = status;
    this.code = error.code || "REQUEST_FAILED";
    this.details = error.details || [];
  }
}

export function csrfToken() {
  return (
    document.cookie
      .split("; ")
      .find((c) => c.startsWith("csrf_token="))
      ?.split("=")
      .slice(1)
      .join("=") || ""
  );
}

async function request(path, options = {}, retry = true) {
  const { method = "GET", body, signal } = options;
  let response;
  const requestCsrf = csrfToken();
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      credentials: "include",
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(method === "GET" ? {} : { "X-CSRF-Token": requestCsrf }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: signal || AbortSignal.timeout(45000),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError(0, {
      code: "NETWORK_ERROR",
      message:
        "Unable to connect. Check your internet connection and try again.",
    });
  }
  const data = await response.json().catch(() => ({}));
  if (
    response.status === 401 &&
    retry &&
    ![
      "/auth/login",
      "/auth/signup",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/verify-email",
      "/auth/refresh",
      "/auth/logout",
    ].includes(path) &&
    !path.startsWith("/location-shares/public/")
  ) {
    if (!refreshPromise) {
      const rotate = () =>
        csrfToken() !== requestCsrf
          ? Promise.resolve()
          : request("/auth/refresh", { method: "POST" }, false);
      const operation = navigator.locks
        ? navigator.locks.request("sakhi-session-refresh", rotate)
        : rotate();
      refreshPromise = operation.finally(() => {
        refreshPromise = null;
      });
    }
    try {
      await refreshPromise;
    } catch (error) {
      if (error.status === 401)
        window.dispatchEvent(new Event("session-expired"));
      throw error;
    }
    try {
      return await request(path, options, false);
    } catch (error) {
      if (error.status === 401)
        window.dispatchEvent(new Event("session-expired"));
      throw error;
    }
  }
  if (!response.ok) throw new ApiError(response.status, data.error);
  return data;
}

export const api = {
  get: (path, options) => request(path, options),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" }),
};

export function errorText(error) {
  const detail = error.details?.[0];
  return detail
    ? `${detail.field.replace("body.", "")}: ${detail.message}`
    : error.message || "Something went wrong. Please try again.";
}
