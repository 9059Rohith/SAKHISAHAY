import { test, expect } from "@playwright/test";

test("reference UI, walkthrough, mobile layout and reduced motion", async ({ page }) => {
  const errors = []; page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/SakhiSahay/);
  await expect(page.getByRole("heading", { name: "SakhiSahay", exact: true })).toBeVisible();
  await expect(page.locator(".glass-tool")).toHaveCount(6);
  await page.getByRole("button", { name: "Watch Demo" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Share the journey" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".night-home > section")).toHaveCount(6);
  const images = page.locator(".scene-background");
  expect(new Set(await images.evaluateAll((nodes) => nodes.map((e) => e.getAttribute("src")))).size).toBe(5);
  for (const section of await page.locator(".story-scene").all()) {
    await section.scrollIntoViewIfNeeded();
    await expect(section.locator(".animated-heading")).toHaveClass(/is-visible/);
    await expect.poll(() => section.locator(".scene-background").evaluate((e) => e.complete && e.naturalWidth > 0)).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await page.locator(".home-title span").first().evaluate((e) => getComputedStyle(e).animationName)).toBe("none");
  expect(errors).toEqual([]);
});

test("mobile drawer keyboard focus and long contact names stay usable", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "csrf_token", value: "ui-only-test", url: baseURL }]);
  await page.route("**/api/v1/auth/me", (route) => route.fulfill({ json: { id: "ui-test", full_name: "Sakhi UI Test", email: "ui@example.com", role: "user" } }));
  await page.route("**/api/v1/contacts?*", (route) => route.fulfill({ json: { items: [{ id: "contact-test", name: "A".repeat(100), phone: "9876543210", relationship: "Friend" }], total: 1, page: 1, page_size: 3 } }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await expect(page.getByText("Hello, Sakhi UI Test.")).toBeVisible();
  await expect(page.locator(".portal-sidebar")).toHaveAttribute("inert", "");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Open application menu" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Close application menu" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Shift+Tab");
  expect(await page.evaluate(() => document.activeElement.closest(".portal-sidebar") !== null)).toBe(true);
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement.closest(".portal-sidebar") !== null)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open application menu" })).toBeFocused();
  const telephone = page.locator('.modern-contact-list a[href="tel:+919876543210"]');
  await telephone.scrollIntoViewIfNeeded();
  const box = await telephone.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("real account, persisted contacts, incidents, AI, live share, SOS, logout and recovery", async ({ page, context }) => {
  const email = `sakhi-e2e-${Date.now()}@example.com`;
  const password = "SecurePass912!";
  const errors = []; page.on("pageerror", (e) => errors.push(e.message));
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 12.9716, longitude: 77.5946, accuracy: 20 });
  await page.goto("/dashboard"); await expect(page).toHaveURL(/\/login/);
  await page.goto("/register");
  await page.locator("#register-fullName").fill("Sakhi Test Person");
  await page.locator("#register-email").fill(email);
  await page.locator("#register-password").fill(password);
  await page.locator("#register-confirmPassword").fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/recovery-code/);
  const recovery = await page.locator(".recovery-code").innerText();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue to Dashboard" }).click();
  await expect(page.getByText("Hello, Sakhi Test Person.")).toBeVisible();

  await page.goto("/emergency-contacts");
  await page.locator("#ec-name").fill("Trusted Test Contact");
  await page.locator("#ec-phone").fill("9876543210");
  await page.locator("#ec-relationship").selectOption("Friend");
  await page.getByRole("button", { name: "Add Contact", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Trusted Test Contact" })).toBeVisible();
  await page.reload(); await expect(page.getByRole("heading", { name: "Trusted Test Contact" })).toBeVisible();
  await page.getByRole("button", { name: "Edit Trusted Test Contact" }).click();
  await page.locator("#ec-name").fill("Updated Test Contact");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("heading", { name: "Updated Test Contact" })).toBeVisible();

  await page.goto("/reporting");
  await page.getByLabel("Incident title").fill("Test travel incident");
  await page.getByLabel("Date and time").fill("2026-01-01T12:00");
  await page.getByLabel("What happened?").fill("This is a synthetic incident for automated application testing.");
  await page.getByRole("button", { name: "Save private record" }).click();
  await expect(page.getByRole("heading", { name: "Test travel incident", exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByRole("heading", { name: "Test travel incident", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Record status").selectOption("closed");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.locator(".record-item small").first()).toContainText("closed");

  await page.goto("/chatbot");
  await page.getByLabel("Type your message").fill("Give me two concise tips for staying safe on a daytime train journey.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.locator(".chatbot-row-bot .chatbot-text")).toHaveCount(2, { timeout: 60000 });
  const reply = await page.locator(".chatbot-row-bot .chatbot-text").last().innerText(); expect(reply.length).toBeGreaterThan(40);
  await page.reload(); await expect(page.locator(".chatbot-row-bot .chatbot-text")).toHaveCount(2);

  await page.goto("/location");
  await page.getByRole("button", { name: "Start live sharing" }).click();
  await expect(page.getByRole("heading", { name: "Live sharing is active" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Interactive OpenStreetMap" })).toBeVisible();
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(page.locator(".leaflet-control-attribution")).toContainText("OpenStreetMap");
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await page.getByRole("button", { name: "Recenter map", exact: true }).click();
  const shareLink = await page.locator(".share-link").getAttribute("href");
  const viewer = await context.newPage(); await viewer.goto(shareLink);
  await expect(viewer.locator(".share-value")).toContainText("12.971600");
  await expect(viewer.getByRole("region", { name: "Interactive OpenStreetMap" })).toBeVisible();
  await page.getByRole("button", { name: "Stop sharing" }).click();
  await viewer.reload(); await expect(viewer.getByRole("alert")).toContainText(/stopped|expired/); await viewer.close();

  await page.goto("/sos");
  await page.getByRole("button", { name: "Create SOS alert" }).click();
  await page.getByRole("button", { name: "Create alert", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Alert ready to share" })).toBeVisible();
  expect(await page.getByRole("link", { name: "Open SMS" }).getAttribute("href")).toContain("sms:+919876543210");
  await page.getByRole("button", { name: "Mark resolved", exact: true }).first().click();
  await expect(page.getByText("Resolved alert", { exact: true })).toBeVisible();

  await page.goto("/safety-information"); await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto("/profile"); await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.goto("/reset-password"); await page.getByLabel("Email address").fill(email); await page.getByLabel("Recovery code or token").fill(recovery); await page.getByLabel(/^New password/).fill("NewSecurePass945!"); await page.getByRole("button", { name: "Reset password", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Password reset");
  await page.goto("/login"); await page.locator("#login-email").fill(email); await page.locator("#login-password").fill("NewSecurePass945!"); await page.locator('button[type="submit"]').click(); await expect(page).toHaveURL(/\/dashboard/);
  await page.goto("/emergency-contacts"); await page.getByRole("button", { name: "Delete Updated Test Contact" }).click(); await page.getByRole("button", { name: "Yes, delete" }).click(); await expect(page.getByRole("heading", { name: "No emergency contacts yet" })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open application menu" }).click();
  await page.getByRole("navigation", { name: "Application navigation" }).getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("button", { name: "Open application menu" })).toHaveAttribute("aria-expanded", "false");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
