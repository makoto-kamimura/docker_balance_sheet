#!/bin/bash

# ─────────────────────────────────────────────────────
# React プロジェクトへ app/frontend/ ファイルを配置するスクリプト（macOS / Linux 用）
# 実行方法: bash setup-react.sh /path/to/react-project
#
# Windows ネイティブの場合は OS 非依存版を使用:
#   node setup-react.mjs <path-to-react-project>
# ─────────────────────────────────────────────────────

set -e

DOCKER_BALANCE_SHEET_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$DOCKER_BALANCE_SHEET_DIR/app/frontend"

if [ -z "$1" ]; then
  echo "❌ 使用法: bash setup-react.sh /path/to/react-balance-sheet"
  echo ""
  echo "例:"
  echo "  bash setup-react.sh ../react-balance-sheet"
  exit 1
fi

REACT_DIR="$1"

if [ ! -d "$REACT_DIR" ]; then
  echo "❌ エラー: $REACT_DIR は存在しません"
  exit 1
fi

echo "🚀 React ファイル配置を開始します..."
echo "   ソース: $FRONTEND_DIR"
echo "   先: $REACT_DIR"
echo ""

# ─── ファイルをコピー ───────────────────────────────
echo "📁 ファイル構造をコピー..."

# ソースディレクトリが存在する場合のみコピー
for dir in api stores types utils hooks pages components; do
  if [ -d "$FRONTEND_DIR/$dir" ]; then
    cp -r "$FRONTEND_DIR/$dir" "$REACT_DIR/"
    echo "   ✅ $dir/"
  fi
done

# ─── ルートファイル ─────────────────────────────────
echo "📄 ルートファイルをコピー..."

for file in App.tsx main.tsx index.html package.json vite.config.ts tsconfig.json styles.css; do
  if [ -f "$FRONTEND_DIR/$file" ]; then
    cp "$FRONTEND_DIR/$file" "$REACT_DIR/"
    echo "   ✅ $file"
  fi
done

echo ""
echo "✅ 配置完了！"
echo ""
echo "次のステップ:"
echo "  1. cd $REACT_DIR"
echo "  2. npm install"
echo "  3. npm run dev"
