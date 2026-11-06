#!/usr/bin/env bash
# ==============================================================================
# HEPCO IT COMMAND CENTER (HICC V1.0) - Automated PostgreSQL Backup Script
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/hicc}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/hicc_db_${TIMESTAMP}.dump"

mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

echo "[$(date -Iseconds)] Starting HICC PostgreSQL backup to ${BACKUP_FILE}..."

docker exec hicc-postgres pg_dump \
  -U "${POSTGRES_USER:-hicc_user}" \
  -d "${POSTGRES_DB:-hicc_db}" \
  -Fc \
  --no-owner \
  --no-acl > "${BACKUP_FILE}"

chmod 600 "${BACKUP_FILE}"

# Prune backups older than RETENTION_DAYS
find "${BACKUP_DIR}" -name "hicc_db_*.dump" -type f -mtime +"${RETENTION_DAYS}" -delete

echo "[$(date -Iseconds)] Backup completed successfully: $(du -h "${BACKUP_FILE}" | cut -f1)"
