import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("secure API client", () => {
  beforeEach(() => {
    vi.resetModules();
    document.cookie = "csrf_token=unit-csrf; path=/";
  });
  afterEach(() => vi.unstubAllGlobals());

  it("adds credentials and CSRF only to mutations", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ ok: true })));
    vi.stubGlobal("fetch", fetch);
    const { api } = await import("./api");
    await api.post("/contacts", { name: "Person" });
    expect(fetch.mock.calls[0][1].credentials).toBe("include");
    expect(fetch.mock.calls[0][1].headers["X-CSRF-Token"]).toBe("unit-csrf");
    expect(fetch.mock.calls[0][1].body).toBe('{"name":"Person"}');
  });

  it("shares one refresh across concurrent expired requests and retries once", async () => {
    const seen = {};
    const fetch = vi.fn(async (url) => {
      seen[url] = (seen[url] || 0) + 1;
      if (url.endsWith("/auth/refresh")) {
        await new Promise((r) => setTimeout(r, 5));
        return new Response(JSON.stringify({ user: { id: "1" } }));
      }
      if (seen[url] === 1)
        return new Response(
          JSON.stringify({
            error: { code: "SESSION_EXPIRED", message: "Expired" },
          }),
          { status: 401 },
        );
      return new Response(JSON.stringify({ items: [] }));
    });
    vi.stubGlobal("fetch", fetch);
    const { api } = await import("./api");
    await Promise.all([api.get("/contacts"), api.get("/reports")]);
    expect(seen["/api/v1/auth/refresh"]).toBe(1);
    expect(seen["/api/v1/contacts"]).toBe(2);
    expect(seen["/api/v1/reports"]).toBe(2);
  });

  it("does not retry invalid sign-in credentials", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Incorrect credentials",
          },
        }),
        { status: 401 },
      ),
    );
    vi.stubGlobal("fetch", fetch);
    const { api } = await import("./api");
    await expect(api.post("/auth/login", {})).rejects.toMatchObject({
      status: 401,
      code: "INVALID_CREDENTIALS",
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("renders field-level errors without exposing rejected input", async () => {
    const { ApiError, errorText } = await import("./api");
    const error = new ApiError(422, {
      message: "Invalid",
      details: [{ field: "body.phone", message: "Invalid number" }],
    });
    expect(errorText(error)).toBe("phone: Invalid number");
  });

  it("reports network failures clearly", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("network failed")),
    );
    const { api } = await import("./api");
    await expect(api.get("/contacts")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      status: 0,
    });
  });

  it("rejects a successful HTML fallback instead of reporting signup success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<!doctype html><html>Unavailable</html>", {
          status: 200,
        }),
      ),
    );
    const { api } = await import("./api");
    await expect(api.post("/auth/signup", {})).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
  });
});
