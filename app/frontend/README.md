# 家計バランスシート — React フロントエンド

## セットアップ

```bash
npm install
npm run dev
# → http://localhost:5173
```

## 環境変数（オプション）

`.env.local` を作成:
```env
VITE_API_URL=http://localhost:8000/api
```

指定しない場合は `vite.config.ts` のプロキシ設定でLaravelへ転送されます。

---

## ファイル構成

```
src/
├── api/
│   └── index.ts          # Laravel API クライアント（全エンドポイント）
├── components/
│   ├── layout/
│   │   └── AppLayout.tsx # サイドバー + ルーティング
│   └── NetWorthChart.tsx # Recharts 純資産推移グラフ
├── hooks/
│   └── index.ts          # データ取得カスタムフック
├── pages/
│   ├── AuthPage.tsx      # ログイン / 新規登録
│   ├── DashboardPage.tsx # 純資産サマリー + グラフ
│   ├── AssetsPage.tsx    # 資産 CRUD
│   ├── LiabilitiesPage.tsx # 負債 CRUD
│   └── BalanceSheetPage.tsx # B/S レポート表示
├── stores/
│   └── authStore.ts      # Zustand 認証ストア（永続化）
├── types/
│   └── index.ts          # TypeScript 型定義
├── utils/
│   └── format.ts         # 金額フォーマット（円・万円・億円）
├── App.tsx               # 認証ガード
├── main.tsx              # エントリポイント
└── styles.css            # グローバルスタイル（和モダン×ダーク）
```

---

## 主な機能

| 画面 | 内容 |
|---|---|
| ログイン / 新規登録 | Sanctum トークン認証、ローカルストレージ永続化 |
| ダッシュボード | 純資産・総資産・総負債の要約 + 月次推移グラフ |
| 資産管理 | 流動資産・固定資産・投資の CRUD（モーダルフォーム） |
| 負債管理 | 流動負債・固定負債の CRUD |
| B/S レポート | 左右2カラムの正式バランスシート形式 |

---

## 依存ライブラリ

| ライブラリ | 用途 |
|---|---|
| React 18 | UIフレームワーク |
| Zustand | 認証状態管理（persist ミドルウェア） |
| Recharts | 純資産推移グラフ |
| Vite | ビルドツール |
| TypeScript | 型安全 |
