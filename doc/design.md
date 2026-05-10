# 家計バランスシートアプリ — 設計資料

> 個人・家計管理向け B/S + ライフプラン + 実績家計簿 + モバイル対応システム
> Stack: React 18 + TypeScript / Laravel 11+ / MySQL 8 / Docker / Expo Managed (RN 0.74)

最終更新: 2026-05-10

---

## 1. システムアーキテクチャ全体図

```mermaid
graph TB
    User["👤 ユーザー"]

    subgraph Web["🌐 Web"]
        Browser["Browser"]
    end

    subgraph Mobile["📱 Mobile (Expo Managed + Dev Client)"]
        iOS["iOS App"]
        AOS["Android App"]
    end

    subgraph Server["Server (Docker / platform/)"]
        Nginx["Nginx :80/:443<br/>リバースプロキシ + SSL 終端"]
        React["React SPA<br/>dist/ 静的配信"]
        PHP["PHP-FPM 8.3<br/>Laravel 11+ + Sanctum"]
        MySQL["MySQL 8.0"]
    end

    subgraph Dev["開発専用"]
        Vite["Vite Dev :5173<br/>HMR"]
        PMA["phpMyAdmin :8080"]
    end

    User --> Browser --> Nginx
    User --> iOS --> Nginx
    User --> AOS --> Nginx

    Nginx -->|"/api/* → FastCGI"| PHP
    Nginx -->|"/* → index.html"| React
    PHP --> MySQL
    PMA -.-> MySQL
    Browser -.->|"開発時"| Vite
```

**通信プロトコル**:
- Web: Cookie + Bearer Token (Sanctum SPA)
- Mobile: Bearer Token のみ（`AsyncStorage` 永続化）
- 全クライアント共通の `/api/*` を利用

---

## 2. ER図（データベース設計）

```mermaid
erDiagram
    users ||--o{ assets : "保有"
    users ||--o{ liabilities : "負担"
    users ||--o{ balance_snapshots : "記録"
    users ||--o{ cashflow_items : "計画"
    users ||--o{ expenses : "実績"
    users ||--o{ personal_access_tokens : "発行"

    users {
        bigint id PK
        string name
        string email UK
        string password
        timestamp email_verified_at
        timestamps
    }

    assets {
        bigint id PK
        bigint user_id FK
        string name
        enum category "current|fixed|investment"
        decimal amount "13,2"
        string note
        unsignedInt sort_order "default 0"
        timestamps
    }

    liabilities {
        bigint id PK
        bigint user_id FK
        string name
        enum category "current|longterm"
        decimal amount "13,2"
        string note
        unsignedInt sort_order "default 0"
        timestamps
    }

    cashflow_items {
        bigint id PK
        bigint user_id FK
        string name
        enum direction "income|expense"
        enum frequency "fixed|variable"
        string category "60 chars"
        string vendor "120 chars"
        decimal monthly_amount "12,2"
        decimal annual_amount "12,2"
        unsignedTinyInt start_age
        unsignedTinyInt end_age
        string note
        string url "500 chars"
        unsignedInt sort_order
        timestamps
    }

    expenses {
        bigint id PK
        bigint user_id FK
        string category "60 chars"
        decimal amount "12,2"
        date occurred_at
        string note
        timestamps
    }

    balance_snapshots {
        bigint id PK
        bigint user_id FK
        string year_month UK "YYYY-MM"
        decimal total_assets
        decimal total_liabilities
        decimal net_worth
        timestamp recorded_at
        timestamps
    }

    password_reset_tokens {
        string email PK
        string token
        timestamp created_at
    }
```

**インデックス**:
- `assets`/`liabilities`/`cashflow_items`: `(user_id, sort_order)` で並び順表示
- `expenses`: `(user_id, occurred_at)` + `(user_id, category, occurred_at)`（自動予算の月次集計）
- `balance_snapshots`: `(user_id, year_month) UNIQUE`（前月比 / 推移グラフ）

**制約 (アプリケーションレベル)**:
- 同ユーザー × 同カテゴリ内で `name` の重複禁止 (`Concerns\EnforcesUserScope`)
- 1 ユーザーあたり assets / liabilities / cashflow_items それぞれ 200 件まで

---

## 3. API エンドポイント一覧

```mermaid
mindmap
  root((Laravel API<br/>/api))
    認証 (5 req/min/IP)
      POST /auth/register
      POST /auth/login
      POST /auth/logout (要auth)
      GET  /auth/me (要auth)
      POST /auth/password/forgot
      POST /auth/password/reset
    資産 / 負債 (60 req/min/user)
      GET    /assets (一覧)
      POST   /assets
      PUT    /assets/{id}
      DELETE /assets/{id}
      POST   /assets/reorder
      GET    /assets/export (CSV)
      ...同型 /liabilities
    ライフプラン
      GET    /cashflow-items
      POST   /cashflow-items
      PUT    /cashflow-items/{id}
      DELETE /cashflow-items/{id}
      POST   /cashflow-items/reorder
      GET    /cashflow-items/export (CSV)
    バランスシート
      GET /balance-sheet (現在のB/S)
      GET /balance-sheet/summary (Dashboard 用)
      GET /balance-sheet/comparison (前月比)
      GET /balance-sheet/export (PDF)
    スナップショット
      GET    /snapshots
      POST   /snapshots
      DELETE /snapshots/{id}
    予算
      GET /budget/summary (計画値ベース)
      GET /budget/projection (年齢別推移)
      GET /budget/auto (実績ベース自動予算)
    実績家計簿 (§O)
      GET    /expenses
      POST   /expenses
      PUT    /expenses/{id}
      DELETE /expenses/{id}
```

**認証**: Laravel Sanctum (`HasApiTokens`)、`Authorization: Bearer {token}` ヘッダ。
**Rate Limit**: `auth/*` は IP ベース 5 req/min、認証付ルートは Sanctum トークンの user 単位で 60 req/min。

---

## 4. 認証フロー

```mermaid
sequenceDiagram
    actor U as ユーザー
    participant C as Client (Web/Mobile)
    participant N as Nginx
    participant L as Laravel + Sanctum
    participant DB as MySQL
    participant M as Mailer

    rect rgba(64,128,192,0.1)
    Note over U,DB: 通常ログイン
    U->>C: メール・パスワード入力
    C->>N: POST /api/auth/login
    N->>L: FastCGI 転送
    L->>L: throttle:5,1 チェック
    L->>DB: users 照合 + Hash::check
    DB-->>L: ユーザー
    L->>DB: personal_access_tokens INSERT
    L-->>C: { user, token }
    C->>C: localStorage / AsyncStorage 保存
    end

    rect rgba(192,128,64,0.1)
    Note over U,M: パスワード忘れ → リセット
    U->>C: メールアドレス入力
    C->>L: POST /api/auth/password/forgot
    L->>DB: password_reset_tokens UPSERT
    L->>M: リセットリンク送信
    L-->>C: 200 (存在不明でも常に同じメッセージ)
    M-->>U: メール (token 付きリンク)
    U->>C: リンクをクリック
    Note right of C: ?reset_token=xxx&email=yyy
    C->>L: POST /api/auth/password/reset
    L->>DB: token 検証 + password 更新
    L->>DB: 既存 personal_access_tokens 全削除
    L-->>C: 200 → ログイン画面へ
    end
```

---

## 5. バランスシート計算フロー

```mermaid
flowchart TD
    A([GET /api/balance-sheet]) --> B[BalanceSheetController]
    B --> C[BalanceSheetService::calculate]

    C --> D[user.assets 取得]
    C --> E[user.liabilities 取得]

    D --> F{カテゴリで分類}
    F --> F1["流動資産 current"]
    F --> F2["固定資産 fixed"]
    F --> F3["投資 investment"]

    E --> G{カテゴリで分類}
    G --> G1["流動負債 current"]
    G --> G2["固定負債 longterm"]

    F1 & F2 & F3 --> H["総資産"]
    G1 & G2     --> I["総負債"]

    H --> J["純資産 = 総資産 − 総負債"]
    I --> J

    J --> K[JSON or PDF レスポンス]
    K --> L([UI: カード/レポート表示])
    K --> M([PDF: dompdf で A4 縦出力])
```

**派生 API**:
- `summary` — Dashboard 用に `asset_ratio` を追加
- `comparison` — 最新 2 スナップショットの差分 (`{ amount, percent }`、件数別 graceful fallback)
- `export` — `Pdf::loadView('pdf.balance-sheet')->setPaper('a4', 'portrait')->download()`

---

## 6. 実績ベース自動予算 (§O)

> `cashflow_items`（計画値）と独立した実績テーブル `expenses` から、過去実績で月次・年次予算を自動算出。

```mermaid
flowchart TD
    A([GET /api/budget/auto]) --> B[直近6ヶ月の月別合計をカテゴリ別に集計]
    B --> C{月別実績ありの<br/>月数 m}

    C -->|m < 3| C1[monthly_budget = null<br/>annual_budget = null<br/>未解禁メッセージ]
    C -->|3 ≤ m < 6| C2[monthly_budget =<br/>avg of m months<br/>annual_budget = null]
    C -->|m == 6| C3[monthly_budget = avg of<br/>last 6 months<br/>annual_budget = monthly × 12]

    C1 & C2 & C3 --> D[当月実績合計を取得]
    D --> E[remaining = monthly_budget − this_month_actual]
    E --> F[JSON レスポンス]
```

**ゲート条件**:
| 月数 m | 月予算 | 年予算 |
|---|---|---|
| m < 3 | `null`（未解禁） | `null` |
| 3 ≤ m < 6 | `avg(過去 m ヶ月)` | `null` |
| m == 6 | `avg(過去 6 ヶ月)` | `monthly × 12` |

**入力後のリアルタイム更新**: `POST /expenses` 完了後にクライアント側で `useAutoBudget.refetch()` を呼び、当該カテゴリの `remaining` を即時反映 + トースト表示。

---

## 7. Reactコンポーネントツリー

```mermaid
graph TD
    App["App.tsx (認証ガード)"]

    App -->|未ログイン| Auth["AuthPage<br/>4 モード: login/register/forgot/reset"]
    App -->|ログイン済| Layout["AppLayout<br/>サイドバー + ルーティング"]

    Layout --> D["DashboardPage"]
    Layout --> A["AssetsPage"]
    Layout --> L["LiabilitiesPage"]
    Layout --> B["BalanceSheetPage"]
    Layout --> LP["LifePlanPage"]
    Layout --> E["ExpensesPage<br/>家計簿（実績）"]

    D --> NW["NetWorthChart (Recharts LineChart)"]
    D --> AA["AssetAllocationChart (PieChart)"]
    D --> CB["ChangeBadge × 3 (前月比)"]

    LP --> CBC["CategoryBreakdownChart (BarChart)"]
    LP --> APC["AgeProjectionChart (ComposedChart)"]
    LP --> Drag1["useDragReorder"]

    A --> AF["AssetFormModal"]
    A --> Drag2["useDragReorder"]
    L --> LF["LiabilityFormModal"]
    L --> Drag3["useDragReorder"]

    B --> PDF["「PDF出力」ボタン"]
    B --> CSV1["「CSV ダウンロード」ボタン"]

    E --> EF["支出記録フォーム"]
    E --> EB["カテゴリ別予算プログレス"]

    subgraph Hooks["カスタムフック"]
        H1["useBalanceSummary / useBalanceSheet / useBalanceComparison"]
        H2["useAssets / useLiabilities / useCashflowItems"]
        H3["useExpenses / useAutoBudget"]
        H4["useBudgetSummary / useBudgetProjection"]
        H5["useSnapshots"]
        H6["useDragReorder<T>"]
    end

    subgraph Stores["Zustand Store"]
        S1["useAuthStore (persist: token)"]
        S2["useToastStore"]
    end

    Layout --> Hooks
    App --> Stores
    Layout --> Toaster["Toaster コンポーネント (App ルート)"]
```

---

## 8. モバイルアーキテクチャ (§L / §N)

> Expo Managed + Dev Client (`expo-dev-client`) 構成。Web 版と同じ Laravel API を Bearer Token のみで利用。

```mermaid
graph TD
    M["App.tsx<br/>useAuthStore.hydrate() で AsyncStorage から復元"]
    M --> RN["RootNavigator (NavigationContainer)"]

    RN -->|token == null| Auth["AuthScreen"]
    RN -->|token あり| Tabs["BottomTabs ×6"]

    Tabs --> T1["DashboardScreen"]
    Tabs --> T2["AssetsScreen"]
    Tabs --> T3["LiabilitiesScreen"]
    Tabs --> T4["BalanceSheetScreen"]
    Tabs --> T5["LifePlanScreen"]
    Tabs --> T6["ExpensesScreen"]

    T6 --> EF["ExpenseFormScreen<br/>(Stack Modal)"]
    T6 --> RS["ReceiptScannerScreen<br/>(Stack)"]

    RS -->|expo-camera| Cam["撮影 (back facing)"]
    Cam -->|expo-image-manipulator| Img["1500px / JPEG 80%"]
    Img -->|@react-native-ml-kit/text-recognition| OCR["端末内 OCR"]
    OCR -->|parseReceipt| EF
    EF -->|POST /api/expenses + useAutoBudget.refetch| Live["残予算リアルタイム更新"]
```

**共有戦略**: `app/mobile/src/types/` `utils/format.ts` `utils/receipt.ts` `api/index.ts` `stores/*` `hooks/index.ts` は Web 版と同型をコピー運用（将来 npm workspaces 化検討）。

**主な差分**:
- `localStorage.getItem` → `AsyncStorage.getItem` で全体 async 化
- `BASE_URL`: `process.env.EXPO_PUBLIC_API_URL ?? Constants.expoConfig.extra.apiUrl ?? 'http://localhost/api'` の三段フォールバック
- CSV エクスポート: `<a download>` → `expo-file-system + expo-sharing` で iOS Files / Android ダウンロード
- Recharts → victory-native（Skia ベース、現状はプレースホルダのみ）

---

## 9. セキュリティ設計 (§I)

| 観点 | 対策 |
|---|---|
| 認証 | Sanctum Bearer Token、`HasApiTokens` |
| パスワード保管 | `Hash::make()` (bcrypt) |
| パスワードリセット | `Password::broker()->sendResetLink()` + 列挙攻撃対策（forgot は常に同じレスポンス）+ リセット成功時に `tokens()->delete()` で全セッション失効 |
| Rate Limit | `auth/*`: 5 req/min/IP / 認証付き: 60 req/min/user |
| 認可 | 各 Controller で `$resource->user_id !== auth()->id()` チェック (`abort_if(..., 403)`) |
| 入力検証 | FormRequest で `EnforcesUserScope` Trait による重複・上限チェック |
| CORS | `config/cors.php` で `allowed_origins` を指定（モバイル含む） |
| HTTPS | 本番は `platform/scripts/install-ssl.sh` で Let's Encrypt 自動取得 |
| トークン保管 (Mobile) | `AsyncStorage` (将来 `expo-secure-store` に移行可能) |

---

## 10. テスト戦略 (§E)

```mermaid
graph LR
    subgraph Backend["Backend (PHPUnit)"]
        BU["Unit: BalanceSheetServiceTest<br/>(5 ケース)"]
        BF["Feature:<br/>AuthControllerTest (7)<br/>AssetControllerTest (9)<br/>CashflowItemControllerTest (6)<br/>AutoBudgetTest (2)"]
        BFa["Factories ×5"]
    end

    subgraph Frontend["Frontend (Vitest + RTL)"]
        FU["Unit:<br/>format.test.ts (13)<br/>useBalanceSummary.test.tsx (3)<br/>AuthPage.test.tsx (4)"]
    end

    subgraph Mobile["Mobile"]
        MT["tsc only (CI)"]
    end

    BU & BF & BFa --> CI[GitHub Actions ci.yml]
    FU --> CI
    MT --> CI
```

**実行**:
- Backend: `php artisan test` (CI で `composer create-project laravel/laravel skeleton` → `setup-laravel.mjs` で上書き → migrate → test)
- Frontend: `npm test` (Vitest + jsdom)
- Mobile: `npm run tsc` のみ（実機ビルドは EAS で別途）

---

## 11. Dockerコンテナ構成

```mermaid
graph LR
    subgraph Host["ホスト (本番 / 開発)"]
        P443["Port 443 (本番)"]
        P80["Port 80"]
        P3306["Port 3306"]
        P5173["Port 5173 (開発)"]
        P8080["Port 8080 (開発)"]
    end

    subgraph Net["Docker Network"]
        Nginx["nginx:1.25-alpine<br/>+ certbot 証明書"]
        PHP["php:8.3-fpm-alpine<br/>+ Laravel スケルトン"]
        MySQL["mysql:8.0"]
        Vite["node:20-alpine (vite, 開発のみ)"]
        PMA["phpMyAdmin (開発のみ)"]
    end

    subgraph Volumes
        V1["laravel_app"]
        V2["frontend_dist"]
        V3["mysql_data"]
        V4["/etc/letsencrypt (本番のみ ro)"]
    end

    P443 --> Nginx
    P80 --> Nginx
    P3306 --> MySQL
    P5173 --> Vite
    P8080 --> PMA

    Nginx -->|"FastCGI :9000"| PHP
    PHP -->|"TCP :3306"| MySQL
    PMA --> MySQL

    PHP --- V1
    Nginx --- V2
    MySQL --- V3
    Nginx --- V4
```

---

## 12. CI/CD + 運用 (§J)

```mermaid
flowchart LR
    subgraph Dev["開発"]
        Code["コード編集"]
        Push["git push (main/develop)"]
    end

    subgraph CI["GitHub Actions ci.yml"]
        Backend["backend ジョブ:<br/>create-project → setup-laravel.mjs<br/>→ composer require dompdf<br/>→ migrate → php artisan test"]
        Frontend["frontend ジョブ:<br/>npm install → tsc → vitest → vite build"]
        Mobile["mobile ジョブ:<br/>npm install → tsc"]
    end

    subgraph Prod["本番"]
        SSL["install-ssl.sh<br/>(Certbot 自動更新)"]
        Backup["backup-mysql.sh<br/>(cron 03:00、7 世代)"]
        Restore["restore-mysql.sh<br/>(yes 確認プロンプト)"]
        Deploy["docker compose -f docker-compose.yml up -d --build"]
    end

    Code --> Push --> CI
    Backend --> Deploy
    Frontend --> Deploy
    Mobile -.-> EAS["EAS Build<br/>(手動)"]
    Deploy --> SSL
    Deploy --> Backup
```

---

## 13. ディレクトリ構成

```
docker-balance-sheet/
├── app/
│   ├── backend/                  Laravel ソース (user 作成ファイルのみ)
│   │   ├── app/
│   │   │   ├── Http/Controllers/{Api,Concerns}/
│   │   │   ├── Http/Requests/{Asset,Auth,Cashflow,Concerns,Expense,Liability}/
│   │   │   ├── Http/Resources/
│   │   │   ├── Models/
│   │   │   └── Services/
│   │   ├── database/{migrations,seeders,factories}/
│   │   ├── resources/views/pdf/
│   │   ├── tests/{Feature,Unit}/
│   │   └── routes/api.php
│   ├── frontend/                 React Web (Vite)
│   │   ├── api/ components/ hooks/ pages/ stores/ tests/ types/ utils/
│   │   ├── App.tsx main.tsx index.html
│   │   ├── styles.css
│   │   ├── package.json tsconfig.json vite.config.ts vite-env.d.ts
│   └── mobile/                   Expo Managed + Dev Client
│       ├── App.tsx
│       ├── app.json eas.json package.json tsconfig.json babel.config.js
│       └── src/
│           ├── api/ stores/ types/ utils/ hooks/
│           ├── screens/ (Auth/Dashboard/Assets/Liabilities/BalanceSheet/LifePlan/Expenses + ExpenseForm/ReceiptScanner)
│           ├── components/ (theme, Card, ChangeBadge)
│           └── navigation/RootNavigator.tsx
├── platform/                    Docker + 運用スクリプト
│   ├── docker-compose.yml docker-compose.override.yml
│   ├── Dockerfile Dockerfile.frontend Dockerfile.frontend.dev
│   ├── default.conf my.cnf opcache.ini php.ini
│   ├── Makefile
│   ├── setup-laravel.mjs setup-laravel.sh
│   ├── setup-react.mjs setup-react.sh
│   ├── setup.mjs
│   └── scripts/
│       ├── install-ssl.sh
│       ├── backup-mysql.sh
│       └── restore-mysql.sh
├── doc/
│   ├── design.md      (この文書)
│   ├── operations.md  (運用手順)
│   ├── task.md        (タスクリスト)
│   ├── history.md     (実装履歴)
│   └── work.md        (モバイル詳細手順)
└── .github/workflows/ci.yml
```

> **Laravel スケルトン位置**: `app/backend/` には user 作成ファイルしか入っていない。`composer.json` / `vendor/` / `bootstrap/` 等は別途 `composer create-project laravel/laravel` で生成し、`platform/setup-laravel.mjs` でソースを上書きする運用。
