# 家計バランスシートアプリ — 設計資料

> 個人・家計管理向け バランスシート算出システム
> Stack: React + TypeScript / Laravel 10+ / MySQL 8 / Docker

---

## 1. システムアーキテクチャ全体図

```mermaid
graph TB
    User["👤 ユーザー"]

    subgraph Docker["Docker Network (bs_net)"]
        subgraph FE["フロントエンド"]
            Nginx["Nginx :80<br/>リバースプロキシ"]
            React["React SPA<br/>dist/ 静的配信"]
        end

        subgraph BE["バックエンド (Laravel)"]
            PHP["PHP-FPM :9000<br/>Laravel 10+"]
            Sanctum["Laravel Sanctum<br/>トークン認証"]
        end

        subgraph DB["データ層"]
            MySQL["MySQL 8.0 :3306"]
        end

        subgraph Dev["開発専用"]
            Vite["Vite Dev Server :5173<br/>HMR対応"]
            PMA["phpMyAdmin :8080"]
        end
    end

    User -->|"HTTP :80"| Nginx
    Nginx -->|"/api/*  → FastCGI"| PHP
    Nginx -->|"/* → index.html"| React
    PHP --> Sanctum
    PHP --> MySQL
    User -.->|"開発時 :5173"| Vite
    PMA -.-> MySQL
```

---

## 2. ER図（データベース設計）

```mermaid
erDiagram
    users {
        bigint id PK
        string name
        string email UK
        string password
        timestamp email_verified_at
        timestamp created_at
        timestamp updated_at
    }

    assets {
        bigint id PK
        bigint user_id FK
        string name
        enum category "current|fixed|investment"
        decimal amount
        string note
        timestamp created_at
        timestamp updated_at
    }

    liabilities {
        bigint id PK
        bigint user_id FK
        string name
        enum category "current|longterm"
        decimal amount
        string note
        timestamp created_at
        timestamp updated_at
    }

    balance_snapshots {
        bigint id PK
        bigint user_id FK
        string year_month UK "例: 2025-05"
        decimal total_assets
        decimal total_liabilities
        decimal net_worth
        timestamp recorded_at
        timestamp created_at
        timestamp updated_at
    }

    personal_access_tokens {
        bigint id PK
        string tokenable_type
        bigint tokenable_id FK
        string name
        string token UK
        timestamp last_used_at
        timestamp expires_at
    }

    users ||--o{ assets : "保有"
    users ||--o{ liabilities : "負担"
    users ||--o{ balance_snapshots : "記録"
    users ||--o{ personal_access_tokens : "発行"
```

---

## 3. API エンドポイント一覧

```mermaid
mindmap
  root((Laravel API<br/>/api))
    認証
      POST /auth/register
      POST /auth/login
      POST /auth/logout
      GET /auth/me
    資産
      GET /assets
      POST /assets
      GET /assets/{id}
      PUT /assets/{id}
      DELETE /assets/{id}
    負債
      GET /liabilities
      POST /liabilities
      GET /liabilities/{id}
      PUT /liabilities/{id}
      DELETE /liabilities/{id}
    バランスシート
      GET /balance-sheet
      GET /balance-sheet/summary
    スナップショット
      GET /snapshots
      POST /snapshots
      DELETE /snapshots/{id}
    実績（§O）
      GET /expenses
      POST /expenses
      PUT /expenses/{id}
      DELETE /expenses/{id}
      GET /budget/auto
```

---

## 4. 認証フロー

```mermaid
sequenceDiagram
    actor U as ユーザー
    participant R as React SPA
    participant N as Nginx
    participant L as Laravel (Sanctum)
    participant DB as MySQL

    U->>R: メール・パスワード入力
    R->>N: POST /api/auth/login
    N->>L: FastCGI 転送
    L->>DB: users テーブル照合
    DB-->>L: ユーザー情報
    L->>DB: personal_access_tokens 発行
    DB-->>L: トークン
    L-->>N: { user, token }
    N-->>R: 200 OK
    R->>R: Zustand Store + localStorage に保存

    Note over R,L: 以降のリクエスト

    R->>N: GET /api/assets<br/>Authorization: Bearer {token}
    N->>L: FastCGI 転送
    L->>DB: トークン検証
    DB-->>L: OK
    L-->>R: 資産データ
```

---

## 5. バランスシート計算フロー

```mermaid
flowchart TD
    A([GET /api/balance-sheet]) --> B[BalanceSheetController]
    B --> C[BalanceSheetService::calculate]

    C --> D[assets テーブル取得]
    C --> E[liabilities テーブル取得]

    D --> F{カテゴリで分類}
    F --> F1["流動資産<br/>current"]
    F --> F2["固定資産<br/>fixed"]
    F --> F3["投資・その他<br/>investment"]

    E --> G{カテゴリで分類}
    G --> G1["流動負債<br/>current"]
    G --> G2["固定負債<br/>longterm"]

    F1 & F2 & F3 --> H["総資産<br/>Σ assets.amount"]
    G1 & G2       --> I["総負債<br/>Σ liabilities.amount"]

    H --> J["純資産 = 総資産 − 総負債"]
    I --> J

    J --> K[JSON レスポンス返却]
    K --> L([React で B/S 表示])
```

---

## 6. Reactコンポーネントツリー

```mermaid
graph TD
    App["App.tsx<br/>認証ガード"]

    App -->|未ログイン| Auth["AuthPage<br/>ログイン / 新規登録"]
    App -->|ログイン済| Layout["AppLayout<br/>サイドバー + ルーティング"]

    Layout --> D["DashboardPage<br/>純資産サマリー"]
    Layout --> A["AssetsPage<br/>資産 CRUD"]
    Layout --> L["LiabilitiesPage<br/>負債 CRUD"]
    Layout --> B["BalanceSheetPage<br/>B/S レポート"]

    D --> Chart["NetWorthChart<br/>Recharts 推移グラフ"]

    A --> AF["AssetFormModal<br/>追加・編集フォーム"]
    L --> LF["LiabilityFormModal<br/>追加・編集フォーム"]

    subgraph Hooks["カスタムフック (src/hooks)"]
        H1["useBalanceSummary()"]
        H2["useAssets()"]
        H3["useLiabilities()"]
        H4["useBalanceSheet()"]
        H5["useSnapshots()"]
    end

    subgraph Store["Zustand Store"]
        S1["useAuthStore<br/>user / token / login / logout"]
    end

    D --> H1
    D --> H5
    A --> H2
    L --> H3
    B --> H4
    Layout --> S1
```

---

## 7. Dockerコンテナ構成

```mermaid
graph LR
    subgraph Host["ホストマシン"]
        P80["Port 80"]
        P3306["Port 3306"]
        P5173["Port 5173 (開発)"]
        P8080["Port 8080 (開発)"]
    end

    subgraph Net["Docker Network: bs_net"]
        Nginx["bs_nginx<br/>nginx:1.25-alpine"]
        PHP["bs_php<br/>php:8.3-fpm-alpine"]
        MySQL["bs_mysql<br/>mysql:8.0"]
        Vite["bs_vite<br/>node:20-alpine<br/>※開発時のみ"]
        PMA["bs_phpmyadmin<br/>※開発時のみ"]
    end

    subgraph Volumes["Docker Volumes"]
        V1["laravel_app"]
        V2["frontend_dist"]
        V3["mysql_data"]
    end

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
```

---

## 7.5 実績ベース自動予算（§O）

> `cashflow_items`（計画値）と独立した **実績** テーブル `expenses` を追加。過去実績から月次・年次予算を自動算出し、当月の残予算をリアルタイムに表示する。

### 7.5.1 ER 拡張

```mermaid
erDiagram
    users ||--o{ expenses : "記録"

    expenses {
        bigint id PK
        bigint user_id FK
        string category "60 chars"
        decimal amount "12,2"
        date occurred_at "実績発生日"
        string note "255 chars nullable"
        timestamp created_at
        timestamp updated_at
    }
```

インデックス:
- `(user_id, occurred_at)` — 月次集計
- `(user_id, category, occurred_at)` — カテゴリ別月次集計

### 7.5.2 自動予算アルゴリズム

```mermaid
flowchart TD
    A([GET /api/budget/auto]) --> B[直近6ヶ月の月別合計をカテゴリ別に集計]
    B --> C{月別実績ありの<br/>月数 m}

    C -->|m < 3| C1[monthly_budget = null<br/>annual_budget = null<br/>未解禁メッセージ]
    C -->|3 ≤ m < 6| C2[monthly_budget =<br/>avg of m months<br/>annual_budget = null]
    C -->|m ≥ 6| C3[monthly_budget = avg of<br/>last 6 months<br/>annual_budget = monthly × 12]

    C1 & C2 & C3 --> D[当月実績合計を取得]
    D --> E[remaining = monthly_budget − this_month_actual]
    E --> F[JSON レスポンス]
```

- **月の判定**: `occurred_at` の YYYY-MM 単位でグループ化、当月を除く直近 6 ヶ月。
- **平均**: 単純平均。当月以前で 1 円以上の実績がある月のみカウント。
- **3 ヶ月**: 当月以外の直近 6 ヶ月のうち実績があった月が 3 ヶ月以上 → 月予算解禁。
- **6 ヶ月**: 直近 6 ヶ月**すべて**で実績があれば年予算解禁。
- **後でユーザが上書き可能**（将来拡張: `budget_overrides` テーブル）。

### 7.5.3 レスポンス例

```json
{
  "as_of": "2026-05-07",
  "by_category": [
    {
      "category": "food",
      "months_with_data": 6,
      "monthly_budget": 42000,
      "annual_budget": 504000,
      "this_month_actual": 18500,
      "remaining": 23500
    },
    {
      "category": "entertainment",
      "months_with_data": 2,
      "monthly_budget": null,
      "annual_budget": null,
      "this_month_actual": 8200,
      "remaining": null
    }
  ],
  "totals": {
    "monthly_budget": 152000,
    "annual_budget": 1224000,
    "this_month_actual": 35200,
    "remaining": 116800
  }
}
```

### 7.5.4 UI フロー

```mermaid
sequenceDiagram
    actor U as ユーザー
    participant E as ExpensesPage
    participant API as /api/expenses
    participant B as /api/budget/auto

    U->>E: 食費 ¥1,500 を入力
    E->>API: POST /expenses
    API-->>E: 201 + 作成済み
    E->>B: GET /budget/auto（再フェッチ）
    B-->>E: by_category[food].remaining: ¥22,000
    E->>U: トースト「食費の残予算: ¥22,000」+ パネル更新
```

- **入力後 700ms 以内に残予算を更新**（POST 完了 → fetch /budget/auto → setState）
- **未解禁カテゴリ**には「あと N ヶ月分のデータで月予算が解禁されます」を表示
- **超過時**: `remaining < 0` で赤バッジ + トーストで警告

---

## 8. デプロイフロー

```mermaid
flowchart LR
    subgraph Dev["ローカル開発"]
        Code["コード編集"]
        DC["docker compose up<br/>override あり"]
        HMR["Vite HMR<br/>:5173"]
    end

    subgraph Build["本番ビルド"]
        RB["React<br/>npm run build"]
        PB["PHP<br/>composer install --no-dev"]
        IMG["Docker Image<br/>マルチステージ"]
    end

    subgraph Prod["本番環境"]
        DC2["docker compose<br/>-f docker-compose.yml up -d"]
        Init["make init<br/>migrate + seed"]
        Live["http://your-domain.com"]
    end

    Code --> DC --> HMR
    Code --> RB & PB --> IMG --> DC2 --> Init --> Live
```
