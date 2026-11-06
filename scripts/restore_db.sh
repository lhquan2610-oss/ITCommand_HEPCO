#!/usr/bin/env bash
# ==============================================================================
# HEPCO IT COMMAND CENTER (HICC V1.0) - PostgreSQL Restore Script
# ==============================================================================
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <path-to-backup.dump>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file '${BACKUP_FILE}' does not exist."
  exit 1
fi

echo "[$(date -Iseconds)] Restoring HICC PostgreSQL database from ${BACKUP_FILE}..."

cat "${BACKUP_FILE}" | docker exec -i hicc-postgres pg_restore \
  -U "${POSTGRES_USER:-hicc_user}" \
  -d "${POSTGRES_DB:-hicc_db}" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl

echo "[$(date -Iseconds)] Database restore completed successfully."
