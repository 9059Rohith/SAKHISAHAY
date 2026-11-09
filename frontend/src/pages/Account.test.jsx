import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RecoveryPage, VerifyPage } from "./Account";

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  setUser: vi.fn(),
  user: { email: "person@example.com", is_verified: false },
}));
vi.mock("../lib/api", () => ({ api: mocks, errorText: (e) => e.message }));
vi.mock("../lib/auth", () => ({ useAuth: () => mocks }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("updates the current account after following and confirming an email link", async () => {
  mocks.post.mockResolvedValue({ message: "Email verified" });
  mocks.get.mockResolvedValue({
    email: "person@example.com",
    is_verified: true,
  });
  render(
    <MemoryRouter
      initialEntries={["/verify-email?token=verification-test-token"]}
    >
      <VerifyPage />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Verify email" }));
  await waitFor(() =>
    expect(mocks.setUser).toHaveBeenCalledWith({
      email: "person@example.com",
      is_verified: true,
    }),
  );
  expect(screen.getByRole("status").textContent).toBe("Email verified");
});

it("explains a missing verification link without submitting an empty token", () => {
  render(
    <MemoryRouter>
      <VerifyPage />
    </MemoryRouter>,
  );
  expect(screen.getByRole("alert").textContent).toContain("missing");
  expect(screen.getByRole("button", { name: "Verify email" }).disabled).toBe(
    true,
  );
  expect(mocks.post).not.toHaveBeenCalled();
});

it("uses the emailed token privately and prevents mismatched password confirmation", async () => {
  render(
    <MemoryRouter
      initialEntries={[
        "/reset-password?email=person%40example.com&token=private-email-reset-token",
      ]}
    >
      <RecoveryPage reset />
    </MemoryRouter>,
  );
  expect(screen.queryByLabelText("Recovery code or token")).toBeNull();
  expect(document.body.textContent).not.toContain("private-email-reset-token");
  fireEvent.change(screen.getByLabelText(/^New password/), {
    target: { value: "NewSecurePass912!" },
  });
  fireEvent.change(screen.getByLabelText("Confirm new password"), {
    target: { value: "DifferentPass912!" },
  });
  fireEvent.submit(document.querySelector("form"));
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain("match"),
  );
  expect(mocks.post).not.toHaveBeenCalled();
});
