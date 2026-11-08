import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login";

const auth = vi.hoisted(() => ({ login: vi.fn() }));
vi.mock("../lib/auth", () => ({ useAuth: () => auth }));
afterEach(() => {
  cleanup();
  auth.login.mockReset();
});

describe("sign-in form", () => {
  it("validates empty fields and focuses the first field", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    fireEvent.submit(document.querySelector("form"));
    expect(screen.getByText("Please enter your email address.")).toBeTruthy();
    expect(document.activeElement.id).toBe("login-email");
    expect(auth.login).not.toHaveBeenCalled();
  });

  it("shows server failures while preserving the email", async () => {
    auth.login.mockRejectedValue(new Error("Email or password is incorrect"));
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    fireEvent.change(document.getElementById("login-email"), {
      target: { value: "person@example.com" },
    });
    fireEvent.change(document.getElementById("login-password"), {
      target: { value: "SecurePass912!" },
    });
    fireEvent.submit(document.querySelector("form"));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "Email or password is incorrect",
      ),
    );
    expect(document.getElementById("login-email").value).toBe(
      "person@example.com",
    );
  });
});
