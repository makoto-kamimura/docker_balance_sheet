#!/usr/bin/env bash
# ─────────────────────────────────────────────────────
# MySQL 論理バックアップスクリプト
#
# 使い方:
#   ./platform/scripts/backup-mysql.sh                       # 既定のバックアップ先 (./backups/)
#   ./platform/scripts/backup-mysql.sh /path/to/backup-dir   # 任意のディレクトリ
#
# cron 例 (毎日 03:00 に取得 + 7 世代を超えた古いものは自動削除):
#   0 3 * * * /opt/balance-sheet/platform/scripts/backup-mysql.sh /var/backups/balance-sheet >> /var/log/bs-backup.log 2>&1
#
# 必要な .env キー (platform/.env から自動読込):
#   DB_DATABASE
#   DB_USERNAME
#   DB_PASSWORD
# ─────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLATFORM_DIR="$(dirname "$SCRIPT_DIR")"

# .env を読み込む（コメント・空行を除く）
if [[ -f "$PLATFORM_DIR/.env" ]]; then
    set -a
    # shellcheck disable=SC1090
    source <(grep -v '^[[:space:]]*#' "$PLATFORM_DIR/.env" | grep -v '^[[:space:]]*$')
    set +a
fi

DB_DATABASE="${DB_DATABASE:-balance_sheet}"
DB_USERNAME="${DB_USERNAME:-root}"
DB_PASSWORD="${DB_PASSWORD:-root}"

BACKUP_DIR="${1:-${PLATFORM_DIR}/backups}"
RETENTION="${BACKUP_RETENTION:-7}"   # 何世代残すか（既定 7）
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUT_FILE="${BACKUP_DIR}/${DB_DATABASE}-${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date -Is)] backing up '${DB_DATABASE}' → ${OUT_FILE}"

# Docker 起動中の MySQL コンテナへ exec で mysqldump を実行
# --single-transaction: InnoDB のロックなしダンプ
# --routines / --triggers: ルーティンとトリガーも含める
# --no-tablespaces: バックアップユーザーの権限を最小化
docker compose -f "$PLATFORM_DIR/docker-compose.yml" exec -T mysql \
    mysqldump \
        --user="$DB_USERNAME" \
        --password="$DB_PASSWORD" \
        --single-transaction \
        --routines \
        --triggers \
        --no-tablespaces \
        --default-character-set=utf8mb4 \
        "$DB_DATABASE" \
    | gzip -9 > "$OUT_FILE"

SIZE="$(du -h "$OUT_FILE" | cut -f1)"
echo "[$(date -Is)] done (${SIZE})"

# 世代管理: 古いバックアップを削除
KEEP="$(ls -1t "${BACKUP_DIR}"/${DB_DATABASE}-*.sql.gz 2>/dev/null | head -n "$RETENTION" | wc -l)"
TOTAL="$(ls -1 "${BACKUP_DIR}"/${DB_DATABASE}-*.sql.gz 2>/dev/null | wc -l)"
if (( TOTAL > KEEP )); then
    OLD="$(ls -1t "${BACKUP_DIR}"/${DB_DATABASE}-*.sql.gz | tail -n +$((RETENTION + 1)))"
    echo "[$(date -Is)] removing $((TOTAL - KEEP)) old backup(s):"
    echo "$OLD" | while read -r f; do
        echo "  - $f"
        rm -f "$f"
    done
fi
