# Operations and fifteen-minute handover

Minutes 0–3: open the live homepage, register, save recovery code, add/edit a contact and refresh. Minutes 3–6: ask a safety question, save a synthetic private incident, export it and delete it. Minutes 6–9: allow location access, open the private link in a second window, stop sharing and confirm it becomes unavailable. Create/resolve an SOS without actually sending an SMS. Minutes 9–12: review deployment environment, /health, /ready, /version and structured logs. Minutes 12–15: rehearse promoting a prior verified deployment and restoring a logical backup into a new empty database.

Health is process liveness; readiness pings Mongo. On a database outage, API requests return a generic 503; correct the Atlas/network problem and verify recovery. The process need not restart for Mongo reconnection. Find the response X-Request-ID in JSON logs. Never log environment values, request bodies, passwords, tokens or incident content. Restrict access to platform logs, which may contain request URLs.

Admin provisioning: set FIRST_ADMIN_EMAIL and FIRST_ADMIN_PASSWORD privately, then run `python -m scripts.seed` (production additionally needs --force). The script refuses implicit elevation of an existing normal account and never seeds fake safety records. Save its recovery code securely.

Backup: `python -m scripts.backup backup --file private/backups/latest.json.gz`. Backups include sensitive account/incident data: encrypt them and keep them off GitHub. Restore only into a new empty database: `python -m scripts.backup restore --file private/backups/latest.json.gz --database NEW_EMPTY_DATABASE --confirm-restore`, then point migration tooling at that database and create indexes. mongodump/mongorestore shell alternatives are included. Do not overwrite production during a drill.

Operational target proposal: RPO 24 hours and RTO 60 minutes after configuring automated daily encrypted backups and conducting a timed restore. These are targets, not achieved service guarantees. Independent monitoring/alerting and scheduled backups require provider setup. No monitoring subscription or paid infrastructure was created.
