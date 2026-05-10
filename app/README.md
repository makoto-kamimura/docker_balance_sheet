# アプリケーション一覧

このフォルダには、家計バランスシートを構成する3つのアプリケーションが含まれています。

---

## 🔧 Backend（Laravel API）

**フォルダ:** [backend/](backend/)  
**README:** [backend/README.md](backend/README.md)

REST API サーバー。認証、資産・負債管理、バランスシート計算を提供。

- **技術スタック:** PHP 8.3、Laravel 11、MySQL 8.0
- **認証:** Laravel Sanctum（Bearer Token）
- **主な機能:**
  - ユーザー認証（register/login/logout）
  - 資産 CRUD（流動資産・固定資産・投資）
  - 負債 CRUD（流動負債・固定負債）
  - バランスシート集計
  - 月次スナップショット管理

🔗 [Backend 詳細へ](backend/README.md)

---

## 🎨 Frontend（React Webアプリ）

**フォルダ:** [frontend/](frontend/)  
**README:** [frontend/README.md](frontend/README.md)

SPA（Single Page Application）。ユーザーがブラウザで家計管理を行うインターフェース。

- **技術スタック:** React 18、TypeScript、Vite、Zustand
- **主な機能:**
  - ログイン / 新規登録（認証ガード）
  - ダッシュボード（サマリー + 月次推移グラフ）
  - 資産/負債管理（モーダルフォーム）
  - バランスシート表示（会計様式）
  - Recharts による可視化

🔗 [Frontend 詳細へ](frontend/README.md)

---

## 📱 Mobile（Expo / React Native）

**フォルダ:** [mobile/](mobile/)  
**README:** [mobile/README.md](mobile/README.md)

iOS / Android ネイティブアプリ。Dev Client + Expo Managed Workflow で実装。

- **技術スタック:** React Native、Expo、TypeScript、ML Kit（OCR）
- **主な機能:**
  - アカウント認証（Web同様）
  - 資産/負債/支出管理
  - **OCR機能**：レシート撮影 → 自動金額抽出
  - ホットリロード開発（Dev Client）
  - リアルタイム同期

🔗 [Mobile 詳細へ](mobile/README.md)

---

## 🚀 クイックスタート

### すべてのアプリを起動（Docker経由）

```bash
# プロジェクトルートへ
cd ../platform
make setup

# または
docker compose up -d
```

- **Frontend:** http://localhost
- **Backend:** http://localhost/api
- **phpMyAdmin:** http://localhost:8080
- **Vite (HMR):** http://localhost:5173

### 個別に開発する場合

```bash
# Backend
cd backend
composer install
php artisan serve

# Frontend  
cd frontend
npm install
npm run dev

# Mobile
cd mobile
npm install
npm run start      # Expo Dev Client
npm run ios        # iOS Simulator
npm run android    # Android Emulator
```

---

## 📐 アーキテクチャ

```
┌─────────────────────────────────────────┐
│         React Frontend                  │
│  (http://localhost, Port 5173 dev)      │
└────────────┬────────────────────────────┘
             │ HTTP + Bearer Token
             ↓
┌─────────────────────────────────────────┐
│      Nginx (Reverse Proxy)              │
│         Port 80 / 443                   │
└────────────┬────────────────────────────┘
             │
      ┌──────┴──────┐
      ↓             ↓
┌──────────┐   ┌────────────┐
│ React    │   │ Laravel    │
│Static    │   │ API        │
│Files     │   │(/api/*)    │
└──────────┘   └────────────┘
               (PHP-FPM)
                    ↓
              ┌──────────┐
              │  MySQL   │
              │ Database │
              └──────────┘

┌─────────────────────────────────────────┐
│   Mobile (iOS/Android)                  │
│   Backend APIと同じエンドポイント使用  │
└─────────────────────────────────────────┘
```

---

## 🔄 API連携フロー

全クライアント（Web・Mobile）は Backend の同じ API を使用します。

```
┌────────────────────────────────────────┐
│  1. ログイン                            │
│     POST /api/auth/login                │
│     → Bearer Token 取得                 │
└────────────────────────────────────────┘
                  ↓
┌────────────────────────────────────────┐
│  2. データ取得 / 更新                   │
│     GET /api/balance-sheet              │
│     POST /api/assets (with Token)       │
│     PUT /api/liabilities/{id}           │
└────────────────────────────────────────┘
                  ↓
┌────────────────────────────────────────┐
│  3. 月次スナップショット保存           │
│     POST /api/snapshots                 │
│     → グラフ用の推移データ              │
└────────────────────────────────────────┘
```

---

## 📦 共通されるコード

複数のアプリケーション間で以下を共有します：

| 項目 | 場所 | 対象 |
|---|---|---|
| TypeScript 型定義 | `frontend/src/types/` | Frontend, Mobile |
| API クライアント実装パターン | `frontend/src/api/` | Mobile でも参考 |
| 金額フォーマット | `frontend/src/utils/format.ts` | Frontend, Mobile |
| レシート解析ロジック | `mobile/src/utils/receipt.ts` | Mobile のみ（OCR） |

---

## 🧪 テスト

各アプリケーションでテストをサポート：

| アプリ | テストランナー | コマンド |
|---|---|---|
| Backend | PHPUnit | `php artisan test` |
| Frontend | Vitest | `npm run test` |
| Mobile | React Native Testing Library | `npm run test` |

---

## 🌍 環境別ドキュメント

| 環境 | README |
|---|---|
| **ローカル開発** | [../platform/README.md](../platform/README.md) |
| **本番デプロイ** | [../platform/README.md](../platform/README.md) |
| **CI/CD** | TBD |
| **デザイン・仕様書** | [../doc/design.md](../doc/design.md) |

---

## 📞 ナビゲーション

- [プロジェクト全体へ](../README.md)
- [Backend詳細](backend/README.md)
- [Frontend詳細](frontend/README.md)
- [Mobile詳細](mobile/README.md)
- [Docker構成](../platform/README.md)
- [ドキュメント](../doc/)
