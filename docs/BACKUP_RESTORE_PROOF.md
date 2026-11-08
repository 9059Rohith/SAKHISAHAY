# Logical backup and restore proof

A BSON-preserving gzip backup of the isolated synthetic E2E database was restored with scripts.backup into a newly created empty verification database. Every collection count matched. The temporary restore database was then removed. This verifies the supplied logical tools; it does not claim Atlas PITR or scheduled production backups.

```json
{
  "source": "isolated E2E database",
  "collections": {
    "reports": 4,
    "alerts": 3,
    "refresh_tokens": 6,
    "session_families": 4,
    "password_resets": 0,
    "contacts": 2,
    "location_shares": 3,
    "rate_limits": 0,
    "chat_messages": 8,
    "audit_logs": 32,
    "users": 4
  },
  "counts_match": true
}
```
