# 家計バランスシート — Docker 構成

## ディレクトリ構成

```
docker-balance-sheet/          ← この設定フォルダ
├── docker-compose.yml         # 全サービス定義（本番兼用）
├── docker-compose.override.yml # ローカル開発の上書き設定
├── Makefile                   # ショートカットコマンド集
├── .env.example               # 環境変数テンプレート
│
├── nginx/
│   └── conf.d/
│       └── default.conf       # React SPA + Laravel API のルーティング
│
├── php/
│   ├── Dockerfile             # PHP 8.3-FPM（マルチステージ）
│   ├── php.ini                # PHP カスタム設定
│   └── opcache.ini            # OPcache（本番最適化）
│
├── mysql/
│   └── my.cnf                 # MySQL 文字コード・タイムゾーン設定
│
└── frontend/
    ├── Dockerfile             # React 本番ビルド（マルチステージ）
    └── Dockerfile.dev         # Vite 開発サーバー（HMR対応）

laravel-balance-sheet/         ← Laravel プロジェクト（別フォルダ）
react-balance-sheet/           ← React プロジェクト（別フォルダ）
```

---

## サービス構成

| コンテナ | イメージ | ポート | 役割 |
|---|---|---|---|
| `bs_nginx` | nginx:1.25-alpine | 80 | リバースプロキシ・静的配信 |
| `bs_php` | php:8.3-fpm-alpine | 9000 | Laravel API (PHP-FPM) |
| `bs_mysql` | mysql:8.0 | 3306 | データベース |
| `bs_vite` | node:20-alpine | 5173 | React 開発サーバー（開発時のみ） |
| `bs_phpmyadmin` | phpmyadmin | 8080 | DB管理UI（開発時のみ） |

---

## ローカル開発 — 初回セットアップ

### macOS / Linux / WSL2

```bash
cd platform
make setup
```

### Windows ネイティブ（PowerShell / cmd）

`make` 不要。Node.js 18+ さえあれば動く OS 非依存版:

```powershell
cd platform
node setup.mjs
```

完了後にアクセス:
- フロントエンド: http://localhost
- phpMyAdmin:    http://localhost:8080
- Vite HMR:     http://localhost:5173

### 手動でセットアップする場合

```bash
# .env ファイル作成
cp .env.example .env   # Windows: copy .env.example .env

# APP_KEY を生成（OS非依存）
node -e "console.log('base64:'+require('crypto').randomBytes(32).toString('base64'))"
# → 出力を .env の APP_KEY= に貼り付け

# ビルド＆起動
docker compose build
docker compose up -d

# マイグレーション
docker compose --profile init up artisan
```

## クロスプラットフォーム対応

| 観点 | 対応 |
|---|---|
| 改行コード | `.gitattributes` で `.sh` / `Dockerfile` / `.env` を強制 LF |
| `make` 非対応 OS（Windows ネイティブ） | `node setup.mjs` で代替 |
| `sed -i` の BSD/GNU 差異 | `Makefile` は `awk` ベースに変更済み |
| 外部プロジェクトへのコピー | `setup-laravel.mjs` / `setup-react.mjs`（Node 版）を併用 |

---

## よく使うコマンド

```bash
make up            # 起動
make down          # 停止
make logs          # 全ログを表示
make logs-php      # PHPログのみ
make shell         # PHPコンテナに入る
make migrate       # マイグレーション実行
make migrate-fresh # DBリセット（⚠️ 全データ削除）
make artisan CMD="route:list"   # Artisanコマンド
make npm CMD="install axios"    # npmコマンド
make cache-clear   # キャッシュクリア
```

---

## 本番デプロイ

```bash
# override なしで起動（本番モード）
make build-prod
make up-prod

# 初期化
make init
```

本番環境では `.env` の以下を変更してください:

```env
APP_ENV=production
APP_DEBUG=false
APP_KEY=<生成済みのキー>
APP_URL=https://your-domain.com
DB_PASSWORD=<強力なパスワード>
DB_ROOT_PASSWORD=<強力なパスワード>
```

---

## トラブルシューティング

### MySQL が起動しない
```bash
docker compose logs mysql
docker compose down -v   # ボリュームごと削除してリセット
docker compose up -d
```

### PHP コンテナが落ちる
```bash
docker compose logs php
# APP_KEY が空でないか確認
docker compose exec php php artisan key:generate
```

### Nginx が 502 を返す
```bash
# PHP-FPM の起動を確認
docker compose ps
docker compose restart php
```
