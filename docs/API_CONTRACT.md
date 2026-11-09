# API contract

Base `/api/v1`. Cookie-authenticated endpoints require a session; mutations additionally require `X-CSRF-Token` matching the readable CSRF cookie and an allowed Origin. Unknown JSON fields are rejected. Lists return `{items,total,page,page_size,pages}`; page starts at 1 and page_size is 1–100. Dates are UTC ISO 8601. Public user objects exclude password hashes and tokens. Errors use `{error:{code,message,details,request_id}}`.

Authentication retry limits are independent per action and client IP (five attempts per minute for signup, login, recovery/reset and resend). HTTP 429 responses include `Retry-After`; account lockout guidance remains 15 minutes. Signup duplicate-email responses direct the user to sign in, without overwriting the existing account.

| Method/path | Authentication | Input | Success | Consumer |
| --- | --- | --- | --- | --- |
| POST /auth/signup | Public | full_name,email,password | 201 user + one-time recovery_code + verification_email_sent; session cookies | Register |
| POST /auth/login | Public | email,password | user; session cookies | Login |
| GET /auth/me | Session | — | user | Provider/dashboard/profile |
| POST /auth/refresh | Refresh cookie + CSRF | — | rotated session cookies, user | API client |
| POST /auth/logout | CSRF | — | message; clear/revoke cookies | Dashboard |
| POST /auth/forgot-password | Public | email | generic message; 503 if mail globally unconfigured, without account disclosure | Recovery |
| POST /auth/reset-password | Public | email,token,new_password | message; cookies cleared, all sessions and pending reset links revoked | Recovery |
| POST /auth/change-password | Session | current_password,new_password | message; other sessions revoked | Profile |
| POST /auth/resend-verification | Session | — | message, or 503 if SMTP unavailable | Profile |
| POST /auth/verify-email | Public | token | message | Verification page |
| PATCH /users/me | Session | full_name | user | Profile |
| GET /contacts | Session | page,page_size,q | page of contacts | Contacts/dashboard/SOS |
| POST /contacts | Session | name,phone,relationship | 201 contact | Contacts |
| PATCH /contacts/{id} | Owner | name,phone,relationship | contact | Contacts |
| DELETE /contacts/{id} | Owner | — | message | Contacts |
| GET /reports | Session | page,page_size,q,status | page of reports | Reporting |
| POST /reports | Session | title,category,description,incident_at,location | 201 report | Reporting |
| PATCH /reports/{id} | Owner | title,category,description,incident_at,location,status,version | report | Reporting |
| DELETE /reports/{id} | Owner | — | message | Reporting |
| GET /chat/messages | Session | page,page_size | page of messages | Chatbot |
| POST /chat/messages | Session | message,language(en/kn) | user and assistant message | Chatbot |
| DELETE /chat/messages | Session | — | message | Chatbot |
| POST /location-shares | Session | latitude,longitude,accuracy | 201 share, one-time share token | Location |
| PATCH /location-shares/{id} | Owner | latitude,longitude,accuracy | share | Location watcher |
| DELETE /location-shares/{id} | Owner | — | message; revoke | Location |
| GET /location-shares/public/{token} | Capability token | — | coordinates,last_update,expires_at | Share viewer |
| GET /alerts | Session | page,page_size | page of alerts | SOS |
| POST /alerts | Session | message, optional coordinates, idempotency_key | 201 alert, contacts | SOS |
| PATCH /alerts/{id}/resolve | Owner | — | resolved alert | SOS |
| GET /admin/summary | Admin | — | aggregate counts only | Admin |
| GET /health; /ready; /version | Public | — | liveness, Mongo readiness, build version | Operations |

Shared failures: 401 absent/expired credentials; 403 CSRF/role; 404 unknown or unowned id; 409 duplicate contact/email or stale report version; 422 malformed input; 429 rate limit/account lock; 503 Mongo/AI/mail unavailable. Invalid ObjectId becomes 404. All owned queries include user_id. No endpoint submits a police complaint or dispatches emergency services. SMS links open the device composer and require the user to send.

The exported `docs/openapi.json` is the field-level request/response contract, including validation bounds and examples. See `docs/postman.json` for executable requests.

`GET /admin/email-status` requires administrator authorization and reports `configured`, `transport`, `sender_configured` and `authentication_configured`. It returns no SMTP credentials and does not imply verified inbox delivery.
