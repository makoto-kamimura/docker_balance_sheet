# バランスシートアプリ — Laravel API

## セットアップ

```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

`config/cors.php` で React 開発サーバーを許可:
```php
'allowed_origins' => ['http://localhost:5173'],
'supports_credentials' => true,
```

---

## API エンドポイント一覧

### 認証
| メソッド | パス | 説明 |
|---|---|---|
| POST | `/api/auth/register` | 新規登録 |
| POST | `/api/auth/login` | ログイン → トークン返却 |
| POST | `/api/auth/logout` | ログアウト（要認証） |
| GET  | `/api/auth/me` | 認証ユーザー情報（要認証） |

### 資産
| メソッド | パス | 説明 |
|---|---|---|
| GET    | `/api/assets` | 資産一覧 |
| POST   | `/api/assets` | 資産登録 |
| GET    | `/api/assets/{id}` | 資産詳細 |
| PUT    | `/api/assets/{id}` | 資産更新 |
| DELETE | `/api/assets/{id}` | 資産削除 |

**category の値**: `current`（流動資産）/ `fixed`（固定資産）/ `investment`（投資）

### 負債
| メソッド | パス | 説明 |
|---|---|---|
| GET    | `/api/liabilities` | 負債一覧 |
| POST   | `/api/liabilities` | 負債登録 |
| GET    | `/api/liabilities/{id}` | 負債詳細 |
| PUT    | `/api/liabilities/{id}` | 負債更新 |
| DELETE | `/api/liabilities/{id}` | 負債削除 |

**category の値**: `current`（流動負債）/ `longterm`（固定負債）

### バランスシート
| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/balance-sheet` | 現在の B/S 全体 |
| GET | `/api/balance-sheet/summary` | 純資産サマリー（ダッシュボード用） |

### スナップショット（推移グラフ用）
| メソッド | パス | 説明 |
|---|---|---|
| GET    | `/api/snapshots?months=12` | 直近 N ヶ月の一覧 |
| POST   | `/api/snapshots` | 現在値を保存（同月は上書き） |
| DELETE | `/api/snapshots/{id}` | 削除 |

---

## リクエスト例

### ログイン
```json
POST /api/auth/login
{
  "email": "taro@example.com",
  "password": "password123"
}
```

### 資産登録
```json
POST /api/assets
Authorization: Bearer {token}

{
  "name": "普通預金（三菱UFJ）",
  "category": "current",
  "amount": 1500000,
  "note": "生活費口座"
}
```

### バランスシート取得レスポンス例
```json
GET /api/balance-sheet
{
  "assets": {
    "current":    { "label": "流動資産",    "items": [...], "subtotal": 2000000 },
    "fixed":      { "label": "固定資産",    "items": [...], "subtotal": 30000000 },
    "investment": { "label": "投資・その他", "items": [...], "subtotal": 5000000 },
    "total": 37000000
  },
  "liabilities": {
    "current":  { "label": "流動負債", "items": [...], "subtotal": 300000 },
    "longterm": { "label": "固定負債", "items": [...], "subtotal": 25000000 },
    "total": 25300000
  },
  "net_worth": 11700000,
  "recorded_at": "2025-05-01T12:00:00+09:00"
}
```

---

## ファイル構成

```
app/
├── Http/
│   ├── Controllers/Api/
│   │   ├── AuthController.php
│   │   ├── AssetController.php
│   │   ├── LiabilityController.php
│   │   ├── BalanceSheetController.php
│   │   └── SnapshotController.php
│   ├── Requests/
│   │   ├── Auth/{Register,Login}Request.php
│   │   ├── Asset/{Store,Update}AssetRequest.php
│   │   └── Liability/{Store,Update}LiabilityRequest.php
│   └── Resources/
│       ├── AssetResource.php
│       └── LiabilityResource.php
├── Models/
│   ├── User.php
│   ├── Asset.php
│   ├── Liability.php
│   └── BalanceSnapshot.php
└── Services/
    └── BalanceSheetService.php
routes/
└── api.php
database/migrations/
├── ..._create_assets_table.php
├── ..._create_liabilities_table.php
└── ..._create_balance_snapshots_table.php
```
