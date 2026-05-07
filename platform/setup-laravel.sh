#!/bin/bash

# ─────────────────────────────────────────────────────
# Laravel プロジェクトへ app/backend/ ソースを配置するスクリプト（macOS / Linux 用）
# 実行方法: bash setup-laravel.sh /path/to/laravel-project
#
# Windows ネイティブの場合は OS 非依存版を使用:
#   node setup-laravel.mjs <path-to-laravel-project>
#
# app/backend/ は Laravel PSR-4 構成（app/, database/, routes/）で
# 保持されているため、ディレクトリ単位でコピーするだけで配置完了。
# ─────────────────────────────────────────────────────

set -e

DOCKER_BALANCE_SHEET_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$DOCKER_BALANCE_SHEET_DIR/app/backend"

if [ -z "$1" ]; then
  echo "❌ 使用法: bash setup-laravel.sh /path/to/laravel-balance-sheet"
  echo ""
  echo "例:"
  echo "  bash setup-laravel.sh ../laravel-balance-sheet"
  exit 1
fi

LARAVEL_DIR="$1"

if [ ! -d "$LARAVEL_DIR" ]; then
  echo "❌ エラー: $LARAVEL_DIR は存在しません"
  exit 1
fi

echo "🚀 Laravel ファイル配置を開始します..."
echo "   ソース: $BACKEND_DIR"
echo "   先:    $LARAVEL_DIR"
echo ""

# ─── app/, database/migrations/, routes/api.php を上書きコピー ──
echo "📦 app/ をコピー..."
cp -R "$BACKEND_DIR/app/." "$LARAVEL_DIR/app/"

echo "📦 database/migrations/ をコピー..."
mkdir -p "$LARAVEL_DIR/database/migrations"
cp "$BACKEND_DIR"/database/migrations/*.php "$LARAVEL_DIR/database/migrations/"

echo "📦 routes/api.php をコピー..."
cp "$BACKEND_DIR/routes/api.php" "$LARAVEL_DIR/routes/api.php"

echo ""
echo "✅ 配置完了！"
echo ""
echo "次のステップ:"
echo "  1. cd $LARAVEL_DIR"
echo "  2. composer install"
echo "  3. php artisan migrate"
