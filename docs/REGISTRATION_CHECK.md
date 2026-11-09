# Registration investigation — 2026-11-10

A fresh production signup returned HTTP 201, issued session cookies and displayed the one-time recovery code. Both the canonical site and the previously shared deployment hostname accepted same-origin API requests. No account-specific error text was supplied, so this investigation does not claim to reproduce the user's exact screen.

Confirmed regressions:

- Five failed login attempts exhausted the same IP bucket used by signup, blocking a new account with HTTP 429. A failing backend regression reproduced this; retry budgets are now separate per authentication action and still enforced.
- The form accepted one-character names and common/whitespace-normalized passwords that the server rejects. It also rejected valid local-language passwords. Client bounds and normalization now match the supported server behavior, with Unicode-aware character counting.
- Duplicate-email errors were generic. The form now explains the existing account and provides an email-prefilled sign-in link.
- A successful HTML fallback was interpreted as an empty successful response. The API client now rejects invalid JSON/incomplete authentication responses explicitly.

Tests cover these cases, including mobile registration through a real backend and a Kannada password, duplicate-account sign-in, retained input after service failures and rate-limit guidance. The broader browser suite also covers data persistence, report JSON download/deletion, AI, live-map sharing/revocation, SOS, recovery, profile edits and password changes. See FINAL_REPORT.md for final deployed results.

SMTP delivery remains unconfigured; automatic SMS dispatch is not integrated. Native call/SMS controls require user action. These are independent of registration creating an account.
