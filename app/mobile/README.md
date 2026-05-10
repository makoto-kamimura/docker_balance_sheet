# 家計バランスシート — Mobile (Expo Managed + Dev Client)

iOS / Android のネイティブアプリ。既存 Laravel API (`/api/*`) を Bearer Token で利用する。

実装方針の詳細は [../../doc/work.md](../../doc/work.md) を参照。

---

## セットアップ

```bash
cd app/mobile
npm install

# Dev Client ビルド (初回のみ・要 EAS CLI)
npm install -g eas-cli
eas login
eas build --profile development --platform ios       # macOS のみ
eas build --profile development --platform android
```

ビルドされた `.ipa` / `.apk` を実機にインストールしたら、以後は JS の変更はホットリロードで反映される。

## 開発実行

```bash
# Dev Client (推奨 — OCR が動く)
npm run start            # = expo start --dev-client
npm run ios              # iOS Simulator + Dev Client
npm run android          # Android Emulator + Dev Client

# Expo Go (OCR は不可、UI 確認用)
npm run start:go
```

## API 接続先の指定

| 環境 | EXPO_PUBLIC_API_URL |
|---|---|
| iOS Simulator (Mac) | `http://localhost/api` |
| Android Emulator | `http://10.0.2.2/api` |
| 実機 (同 LAN) | `http://<host LAN IP>/api` |

`.env.example` を `.env` にコピーして編集する。`app.json` の `extra.apiUrl` がフォールバック。

## ディレクトリ

```
app/mobile/
├── App.tsx
├── app.json / eas.json / package.json / tsconfig.json
└── src/
    ├── api/         API クライアント (Web 版を AsyncStorage 対応で移植)
    ├── stores/      zustand (auth / toast)
    ├── types/       Web 版とほぼ同型
    ├── utils/       format.ts / receipt.ts (OCR 結果パース)
    ├── hooks/       useAssets / useLiabilities / useExpenses ...
    ├── screens/     7 画面 + ReceiptScanner / ExpenseForm
    ├── components/  ChangeBadge など
    └── navigation/  RootNavigator (Auth ↔ BottomTabs)
```

## OCR (レシート読み取り)

- Dev Client 必須 (Expo Go では `@react-native-ml-kit/text-recognition` が動かない)
- カメラ権限を許可 → 撮影 → ML Kit で日本語テキスト抽出 → `parseReceipt` で日付/金額/店舗名抽出 → ExpenseForm の初期値として渡す
- 抽出ロジックは [src/utils/receipt.ts](src/utils/receipt.ts) を参照
