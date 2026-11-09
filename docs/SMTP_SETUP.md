# SMTP activation and verification

The application implements SMTP-backed signup verification, resend and password recovery. Live sending requires provider credentials and an authorized sender. None were available in the project or deployment at the time of this update. Do not treat a successful local capture test as public inbox delivery.

## Hosting settings

Configure these as server-only production variables, using encrypted/sensitive values for secrets:

| Variable | Required value |
| --- | --- |
| `SMTP_HOST` | Provider's SMTP hostname |
| `SMTP_PORT` | Provider's submission port, commonly 587 or 465 |
| `SMTP_SECURITY` | `auto`, or explicit `starttls`/`tls` as specified by the provider |
| `SMTP_USER` | Provider's SMTP username |
| `SMTP_PASSWORD` | Provider-issued SMTP credential/app password |
| `EMAIL_FROM` | Authorized address, optionally `SakhiSahay <address@your-domain>` |
| `FRONTEND_URL` | `https://sakhisahay-9059.vercel.app` for this production deployment |

Use the provider's documented authentication method; the application login password is not an SMTP credential. Configure any required sender/domain authorization and SPF/DKIM/DMARC with the provider. Never commit real values or put them in VITE variables. Redeploy after changing hosting settings.

`auto` enforces implicit TLS on 465 and STARTTLS on other ports. Certificate validation stays enabled. `none` supports loopback capture during development only; production rejects it. The adapter retries transient failures, reports safe errors and avoids repeated authentication attempts after a permanent authentication failure. Logs include the failure type, not recipients, passwords or token links.

Delivery has a twelve-second total deadline. Optional signup verification has a shorter six-second deadline: a slow mail provider must not lose the newly created account, session or one-time recovery code. Failed/cancelled deliveries invalidate their issued token and allow the user to request another verification email later.

## Provider activation check

1. Sign in as administrator and request `/api/v1/admin/email-status`. Configuration flags should be true for the selected provider. This checks settings, not SMTP connectivity or inbox acceptance.
2. Register an account using an inbox you control. Confirm the UI reports the verification email was sent and inspect inbox/spam for the message. Check the link host matches the production application.
3. Open the link and select **Verify email**. The profile should show **Email verified**, and resend should be disabled. Reusing the same link should be rejected.
4. Sign out, open **Forgot password?**, and request a link for that address. The public result intentionally does not confirm whether an account exists.
5. Receive/open the reset email, enter the same new password twice, and submit. Sign in with the new password; the old password, old sessions and pending reset links must fail.
6. Repeat with an expired link and an unknown address. Confirm safe errors/no account disclosure. Inspect provider delivery logs if a message is accepted but not visible in the inbox.

## Verified local integration

The 2026-11-09 checks used a loopback SMTP capture and an isolated Atlas QA database. The browser registered a synthetic account, received the actual SMTP message, followed and confirmed verification, checked the refreshed profile, requested/received recovery mail, reset the password and signed in with it. Backend tests cover failed delivery, expiry, reuse, old-session invalidation, pending-link invalidation, plaintext-production rejection, safe authentication-failure logs and admin-only configuration status. Frontend tests cover missing links, profile refresh and confirmation mismatch.

The capture server is test code. Its temporary browser harness is private, loopback-bound and excluded from Git; no mailbox/capture endpoint is deployed.
