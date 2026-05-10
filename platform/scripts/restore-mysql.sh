#!/usr/bin/env bash
# ─────────────────────────────────────────────────────
# MySQL リストアスクリプト
#
# 使い方:
#   ./platform/scripts/restore-mysql.sh /path/to/backup.sql.gz
#
# 警告: 実行すると **DB_DATABASE の中身を完全に上書き** します。
#       本番環境では必ず事前に確認用バックアップを取得してから実行してください。
# ─────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLATFORM_DIR="$(dirname "$SCRIPT_DIR")"

if [[ $# -lt 1 ]]; then
    echo "使用法: $0 <backup-file.sql.gz>" >&2
    exit 1
fi

BACKUP_FILE="$1"
if [[ ! -f "$BACKUP_FILE" ]]; then
    echo "✗ バックアップファイルが見つかりません: $BACKUP_FILE" >&2
    exit 1
fi

# .env 読み込み
if [[ -f "$PLATFORM_DIR/.env" ]]; then
    set -a
    # shellcheck disable=SC1090
    source <(grep -v '^[[:space:]]*#' "$PLATFORM_DIR/.env" | grep -v '^[[:space:]]*$')
    set +a
fi

DB_DATABASE="${DB_DATABASE:-balance_sheet}"
DB_USERNAME="${DB_USERNAME:-root}"
DB_PASSWORD="${DB_PASSWORD:-root}"

echo "⚠️  以下の内容で '${DB_DATABASE}' を上書きします:"
echo "   バックアップ: ${BACKUP_FILE}"
read -rp "本当に実行しますか? [yes/N]: " ANSWER
if [[ "$ANSWER" != "yes" ]]; then
    echo "中断しました。"
    exit 0
fi

echo "[$(date -Is)] restoring..."
gunzip -c "$BACKUP_FILE" \
    | docker compose -f "$PLATFORM_DIR/docker-compose.yml" exec -T mysql \
        mysql --user="$DB_USERNAME" --password="$DB_PASSWORD" "$DB_DATABASE"

echo "[$(date -Is)] done"
