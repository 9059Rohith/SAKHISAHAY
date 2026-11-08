#!/usr/bin/env sh
set -eu
: "${MONGODB_URI:?Set MONGODB_URI privately}"
: "${MONGODB_DB_NAME:?Set MONGODB_DB_NAME}"
mkdir -p private/backups
chmod 700 private/backups
mongodump --uri="$MONGODB_URI" --db="$MONGODB_DB_NAME" --archive="private/backups/$(date -u +%Y%m%dT%H%M%SZ).archive.gz" --gzip
