#!/bin/bash

# Database Backup Script for Spark
# Usage: ./scripts/db-backup.sh
# Or:    make db-backup

set -e

BACKUP_DIR="$(dirname "$0")/../backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/spark_${TIMESTAMP}.sql"

echo "📦 Creating database backup..."

docker compose exec -T mysql mysqldump \
    -u "${DB_USERNAME:-spark_user}" \
    -p"${DB_PASSWORD:-12345678}" \
    "${DB_DATABASE:-spark_db}" \
    > "$BACKUP_FILE"

# Compress the backup
gzip "$BACKUP_FILE"

echo "✅ Backup created: ${BACKUP_FILE}.gz"

# Clean up old backups (keep last 10)
cd "$BACKUP_DIR"
ls -t spark_*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm --
echo "🧹 Old backups cleaned (keeping last 10)"
