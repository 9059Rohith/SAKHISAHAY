# Changelog

## Registration reliability — 2026-11-10

Separated authentication retry budgets by action so failed login attempts do not block a fresh registration; retained per-action limits and added Retry-After. Aligned signup name/password validation with server bounds and normalization, supported local-language letters, clarified existing-account errors with prefilled sign-in navigation, and rejected malformed successful authentication responses. Increased error-text contrast. Expanded browser coverage to mobile registration, duplicate-account login, report download/deletion and profile/password changes.

## Transactional email — 2026-11-09

Added automatic signup verification when SMTP is configured, actual send-status reporting, branded HTML/plaintext mail, explicit TLS transport configuration, safe delivery diagnostics and an admin-only configuration endpoint. Fixed verification-profile refresh, missing-link feedback, password confirmation and emailed-token presentation. Password resets now clear cookies and invalidate other pending reset links. Added actual SMTP-socket and frontend regression tests, plus an isolated Atlas/browser email-link flow. Public delivery still requires SMTP provider credentials.

## Inner-page motion update — 2026-11-08

Added distinct illustrated backgrounds and parallax banners throughout the application, including shared-location and admin views. Added scroll/pointer depth, drifting petals, floating title words, text tickers and animated headings on account/forms/resources pages. Preserved readable forms, login, real OpenAI chat, OpenStreetMap controls and all existing data flows. Added inner-motion/reduced-motion browser coverage and updated screenshots.

## 1.1.0 — 2026-11-08

Preserved the approved animated homepage and redesigned the inner application with a shared responsive workspace, accessible mobile drawer, clearer plum text on light surfaces, illustrated account screens and a real-data dashboard. Added dynamically loaded Leaflet/OpenStreetMap maps to location detection and shared viewers, with marker/accuracy circle, zoom, recenter, attribution and tile failure fallback. Fixed obsolete disabled recovery copy on sign-in. Added map and mobile keyboard/long-name browser regression coverage and updated documentation/screenshots. SMTP remains configurable pending provider credentials.

## 1.0.0 — 2026-11-08

Completed the frontend-only application with FastAPI, MongoDB Atlas and server-side OpenAI. Added cookie authentication/recovery, persistent contacts/incidents/chat, private live-share capabilities, idempotent SOS, account/admin screens and operational tooling. Recreated the supplied hero and expanded the homepage to six image-led sections, fourteen WebP images, parallax, animated typography and scrolling text. Added automated tests, security checks, deployment configuration and operating documentation.
