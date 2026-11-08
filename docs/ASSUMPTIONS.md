# Assumptions and decisions

- User explicitly requested no further questions and authorized new GitHub repository under 9059Rohith, credentials integration, testing and production deployment. Retain original frontend and use FastAPI/MongoDB. Record unmet infrastructure requirements rather than invent proof.
- Local Git credentials resolve to 9059Rohith; connector GitHub account differs. Use local Git credentials only for GitHub API/push, never display or save the token.
- Connected Vercel team is AJEYA's projects; use that available deployment account. No purchases or custom domain registration.
- Hosting target is Vercel for same-origin React + Python API; also provide Docker deployment. Serverless deployment uses managed workers rather than Gunicorn.
- Indian phone validation matches existing UI; chat supports English and Kannada.
- SOS opens native SMS/share actions; the user must confirm sending. No automatic dispatch or police integration is represented.
- No SMTP credentials were supplied. Support SMTP configuration, explicit unavailable state and one-time recovery codes at signup. Do not mark an email verified without proof.
- No production sample data or shared default administrator. First administrator must be seeded using private environment values.
- No evidence uploads existed; private text incident records and export are sufficient for the current frontend. Object storage is required before adding uploads.
- Keep sensitive information out of localStorage and shared links; public share links reveal coordinates only and expire after one hour.
