#!/usr/bin/env sh
set -eu
: "${MONGODB_URI:?Set MONGODB_URI privately}"
: "${RESTORE_DATABASE:?Use a NEW EMPTY restore database}"
: "${SOURCE_DATABASE:?Set the source database name}"
: "${1:?Pass an archive path}"
mongorestore --uri="$MONGODB_URI" --archive="$1" --gzip --nsFrom="$SOURCE_DATABASE.*" --nsTo="$RESTORE_DATABASE.*" --stopOnError
