# 家計バランスシート

個人の資産・負債を一元管理し、バランスシート形式で可視化する家計管理アプリケーション。Laravel API、React Webアプリ、ネイティブモバイルアプリで構成されています。

---

## 🏗️ プロジェクト構成

このプロジェクトはモノレポ構造になっており、以下の3つの主要コンポーネントから成り立っています。

### フォルダ構成

```
docker_balance_sheet/
├── app/                          # 全アプリケーション
│   ├── backend/                  # Laravel API
│   ├── frontend/                 # React Webアプリ
│   └── mobile/                   # Expo（iOS/Android）
├── platform/                     # Docker & 開発環境設定
├── doc/                          # プロジェクトドキュメント
└── README.md                     # このファイル
```

---

## 🚀 クイックスタート

### 環境要件
- **Docker** & **Docker Compose**
- **Node.js** 18+
- **macOS / Linux / WSL2**（Windows ネイティブは[特別な手順](platform/README.md)が必要）

### ローカル開発環境の起動

```bash
cd platform
make setup

# 完了後、ブラウザで http://localhost を開く
```

詳細は [platform/README.md](platform/README.md) を参照してください。

---

## 📚 各モジュールのREADME

### 🔧 Backend（Laravel API）
**場所:** [app/backend/README.md](app/backend/README.md)

- REST APIエンドポイント一覧
- 認証（Sanctum）、資産・負債・バランスシート管理
- データベース設定、マイグレーション、シード情報

### 🎨 Frontend（React Webアプリ）
**場所:** [app/frontend/README.md](app/frontend/README.md)

- Vite + React 18 によるSPA
- ログイン、ダッシュボード、資産/負債管理、B/S表示
- 依存ライブラリ（Zustand、Recharts など）

### 📱 Mobile（Expo + React Native）
**場所:** [app/mobile/README.md](app/mobile/README.md)

- iOS / Android ネイティブアプリ
- OCR機能（レシート読み取り）
- Dev Client による開発・実機テスト

### 🐳 Docker & 開発環境
**場所:** [platform/README.md](platform/README.md)

- Docker Compose 設定（本番・開発）
- サービス構成（Nginx、PHP-FPM、MySQL、Vite）
- クロスプラットフォーム対応
- ローカル開発コマンド集

---

## 📖 ドキュメント

[doc/](doc/) フォルダに詳細ドキュメントがあります。

| ファイル | 内容 |
|---|---|
| [design.md](doc/design.md) | UI/UX設計、画面レイアウト |
| [work.md](doc/work.md) | 実装方針、技術スタック、Mobile実装詳細 |
| [operations.md](doc/operations.md) | 運用・保守ガイド |
| [history.md](doc/history.md) | 変更履歴、マイルストーン |
| [task.md](doc/task.md) | TODO・開発タスク管理 |

---

## 🔑 主な機能

### ダッシュボード
- 純資産・総資産・総負債のサマリー表示
- 月次推移グラフ（Recharts）
- リアルタイム更新

### 資産管理
- **流動資産**（普通預金、貯金など）
- **固定資産**（不動産、車など）
- **投資**（株式、投資信託など）

### 負債管理
- **流動負債**（クレジットカード、短期ローン）
- **固定負債**（住宅ローン、長期ローン）

### バランスシート
- 正式な会計様式での左右2カラム表示
- 資産 ÷ 負債 + 純資産 の構造確認

### Mobile（Expo）
- カメラでレシート撮影 → OCR（ML Kit）で金額・日付・店舗名を自動抽出
- 支出カテゴリ管理
- 同期型API連携

---

## 🔐 認証・API仕様

### 認証フロー
1. ユーザー新規登録 / ログイン
2. Laravel Sanctum トークン取得
3. 全リクエストに Bearer Token を付加

### 主要エンドポイント

| リソース | メソッド | パス | 説明 |
|---|---|---|---|
| 認証 | POST | `/api/auth/login` | ログイン |
| 認証 | POST | `/api/auth/register` | 新規登録 |
| 資産 | GET/POST/PUT/DELETE | `/api/assets` | 資産CRUD |
| 負債 | GET/POST/PUT/DELETE | `/api/liabilities` | 負債CRUD |
| B/S | GET | `/api/balance-sheet` | バランスシート全体 |
| スナップショット | GET/POST/DELETE | `/api/snapshots` | 月次推移データ |

詳細は [app/backend/README.md](app/backend/README.md#-apiエンドポイント一覧) を参照。

---

## 🛠️ 開発の流れ

### セットアップ（初回）
```bash
cd platform
make setup
```

### 開発モードの起動
```bash
cd platform
docker compose up -d
```

### よく使うコマンド
```bash
# コンテナ確認
docker compose ps

# Laravelマイグレーション
docker compose exec php php artisan migrate

# Node パッケージインストール
docker compose exec vite npm install

# コンテナログ表示
docker compose logs -f php      # Laravel
docker compose logs -f vite     # React開発サーバー
```

### ストップ
```bash
docker compose down
```

詳細は [platform/README.md](platform/README.md#よく使うコマンド) を参照。

---

## 🌍 本番デプロイ

本番環境では以下の対応を実施します：

1. **フロントエンド**：Vite でビルド → Nginx で配信
2. **バックエンド**：Laravel を PHP-FPM で実行
3. **データベース**：MySQL 8.0 で永続化
4. **環境変数**：`.env` で本番設定

```bash
docker compose -f docker-compose.yml up -d
```

---

## 📋 システム要件

| コンポーネント | バージョン |
|---|---|
| PHP | 8.3+ (FPM) |
| Laravel | 11.x |
| Node.js | 18+（フロント・モバイル） |
| React | 18.x |
| MySQL | 8.0+ |
| Docker | 20.10+（Compose 2.0+） |

---

## 📝 ライセンス

MIT License

---

## 🤝 貢献

プルリクエスト・イシュー報告は大歓迎です。

1. フィーチャーブランチを作成: `git checkout -b feature/your-feature`
2. コミット: `git commit -m 'Add your feature'`
3. プッシュ: `git push origin feature/your-feature`
4. Pull Request を作成

---

## 📞 サポート

質問や問題がある場合は、[Issues](../../issues) を作成してください。

---

## 🗺️ ナビゲーション

- **[プロジェクト全体](#家計バランスシート)** ← 今ここ
- [Backend API 詳細](app/backend/README.md)
- [Frontend UI 詳細](app/frontend/README.md)
- [Mobile アプリ詳細](app/mobile/README.md)
- [Docker 構成詳細](platform/README.md)
- [ドキュメント](doc/)
