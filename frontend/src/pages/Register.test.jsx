import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Register from "./Register";

const auth = vi.hoisted(() => ({ register: vi.fn() }));
vi.mock("../lib/auth", () => ({ useAuth: () => auth }));
afterEach(() => {
  cleanup();
  auth.register.mockReset();
});
function fill({ name = "Test Person", password = "SecurePass912!" } = {}) {
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>,
  );
  for (const [id, value] of [
    ["fullName", name],
    ["email", "person@example.com"],
    ["password", password],
    ["confirmPassword", password],
  ])
    fireEvent.change(document.getElementById(`register-${id}`), {
      target: { value },
    });
}

it("rejects a one-character name before submitting to the server", () => {
  fill({ name: "A" });
  fireEvent.submit(document.querySelector("form"));
  expect(auth.register).not.toHaveBeenCalled();
  expect(screen.getByRole("alert").textContent).toContain("2");
});

it.each(["Password123", " Password123 "])(
  "explains the common-password rule before submitting: %s",
  (password) => {
    fill({ password });
    fireEvent.submit(document.querySelector("form"));
    expect(auth.register).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toMatch(/common/i);
  },
);

it("accepts a valid password containing local-language letters", async () => {
  auth.register.mockResolvedValue({});
  fill({ password: "ಸುರಕ್ಷತೆ2026!" });
  fireEvent.submit(document.querySelector("form"));
  await waitFor(() => expect(auth.register).toHaveBeenCalled());
  expect(screen.queryByRole("alert")).toBeNull();
});

it("turns an existing account into an actionable sign-in link", async () => {
  auth.register.mockRejectedValue(
    Object.assign(
      new Error("This email, phone number or request already exists"),
      { status: 409, code: "DUPLICATE" },
    ),
  );
  fill();
  fireEvent.submit(document.querySelector("form"));
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toMatch(
      /already.*account|account.*already/i,
    ),
  );
  expect(
    screen
      .getByRole("link", { name: "Sign in to this account" })
      .getAttribute("href"),
  ).toContain("email=person%40example.com");
});

it("preserves fields after a temporary registration failure", async () => {
  auth.register.mockRejectedValue(
    new Error("The service is temporarily unavailable"),
  );
  fill();
  fireEvent.submit(document.querySelector("form"));
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain(
      "temporarily unavailable",
    ),
  );
  expect(document.getElementById("register-email").value).toBe(
    "person@example.com",
  );
  expect(
    screen.getByRole("button", { name: "Register", exact: true }).disabled,
  ).toBe(false);
});
