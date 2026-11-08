# Frontend audit — 8 November 2026

Source: Bhavanakn-06/SAKHISAHAY, original main branch. React JSX, Vite, React Router, npm; Node 24 and Python 3.12 available. Declared package versions must be checked against the registry before installing. No existing backend, environment variables, API client, authentication provider, persistent storage, uploads, payments, analytics, or real-time transport.

| Route | Existing implementation | Required integration |
| --- | --- | --- |
| / | Marketing sections; inline SVG icons, Button, Navbar, Footer, feature cards | Fix safety information link and inaccurate automatic alert claims |
| /login | Email/password, validation, visibility toggle; informational submit only | Cookie authentication, error/loading, recovery link |
| /register | Name/email/password/confirmation, minimum 8 characters | Signup, duplicate validation, stronger password matching, recovery code |
| /dashboard | Hardcoded User; empty contacts; logout only navigates | Session user, persisted contact summary, real logout |
| /emergency-contacts | Name, Indian mobile, relationship; local add/edit/delete | Owner-scoped CRUD, unique phone, server pagination/search, loading/error |
| /location | Consent-based getCurrentPosition, map link, coordinate copy | Expiring, revocable live share; watchPosition; viewer route |
| /chatbot | English/Kannada; 500-character question; keyword canned replies and timer | Server OpenAI call, persisted conversation, errors and clear history |
| /reporting | Educational accordions and external support links; no form | Private incident CRUD, date/category/location/description, export |
| /safety-information | Educational static content, accordions, links | Retain editorial information; public access |
| /sos | Confirmation dialog; fake activation; local geolocation; empty contacts | Persist alert, fetch contacts, explicit SMS/share actions, resolve/history |

State is local React useState/useRef/useEffect only. Every page includes its own header/icons/styles. No shared route guard; unknown routes redirect home. Existing accessibility work includes labels, focus handling, aria-live, reduced-motion styles. Reuse existing components and visual design. No uploaded evidence UI exists; do not collect sensitive files without private object storage.

Lists have no existing server filters or pagination. Contacts need bounded pagination; new report/history lists need pagination. Live location needs periodic updates and viewer polling; chat can use request/response. External integrations: browser geolocation, clipboard, OpenStreetMap, Indian government resources; no configured SMS/email provider.
