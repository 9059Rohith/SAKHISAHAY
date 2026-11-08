import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Location from "./Location";

const mocked = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("../lib/api", () => ({ api: mocked, errorText: (e) => e.message }));
const position = { coords: { latitude: 12, longitude: 77, accuracy: 10 } };
let callback;
const watch = vi.fn();
beforeEach(() => {
  mocked.get.mockResolvedValue({ items: [] });
  mocked.delete.mockResolvedValue({});
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition: (success) => {
        callback = success;
      },
      watchPosition: watch,
      clearWatch: vi.fn(),
    },
  });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("does not create a share when geolocation resolves after navigation", async () => {
  const view = render(
    <MemoryRouter>
      <Location />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Start live sharing" }));
  view.unmount();
  await act(async () => {
    callback(position);
  });
  expect(mocked.post).not.toHaveBeenCalled();
  expect(watch).not.toHaveBeenCalled();
});

it("revokes a newly created orphan share without starting a watcher", async () => {
  let complete;
  mocked.post.mockImplementation(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  const view = render(
    <MemoryRouter>
      <Location />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Start live sharing" }));
  await act(async () => {
    callback(position);
  });
  await waitFor(() => expect(mocked.post).toHaveBeenCalledOnce());
  view.unmount();
  await act(async () => {
    complete({ id: "orphan-share", token: "never-published" });
  });
  expect(mocked.delete).toHaveBeenCalledWith("/location-shares/orphan-share");
  expect(watch).not.toHaveBeenCalled();
});
