# 画面スクリーンショット / GIF 配置先

トップレベルの [README.md](../../readme.md) から参照される画像置き場。

## 推奨ファイル

| ファイル名 | 推奨形式 | 内容 |
|---|---|---|
| `hero.png` | PNG (1200×630) | OGP / README ヘッダ用のキービジュアル |
| `dashboard.png` | PNG | Dashboard 全景（純資産 hero + 総資産・総負債カード + 前月比バッジ） |
| `lifeplan.png` | PNG | LifePlan ページ（カテゴリ別グラフ + 年齢別キャッシュフロー推移） |
| `balance-sheet.png` | PNG | B/S レポートの 2 カラム表示 |
| `expenses-realtime.gif` | GIF | 支出入力 → カテゴリ別残予算がリアルタイムに更新される様子 |
| `pdf-export.gif` | GIF | B/S → 「PDF 出力」ボタン → PDF プレビュー |
| `drag-reorder.gif` | GIF | 資産項目を並び替えするドラッグ&ドロップ操作 |
| `mobile-dashboard.png` | PNG (縦長) | モバイル版 Dashboard |
| `mobile-ocr.gif` | GIF (縦長) | レシート撮影 → OCR → ExpenseForm に自動入力されるフロー |

## 撮影のコツ

- **GIF**: macOS なら [Kap](https://getkap.co/) や [Gifski](https://gif.ski/) が手軽。サイズは 1MB 以下に圧縮推奨（GitHub のページロードが重くなる）
- **モバイル GIF**: iOS Simulator → File → New Screen Recording → `.mov` を `ffmpeg` で GIF 化
  ```bash
  ffmpeg -i input.mov -vf "fps=12,scale=480:-1:flags=lanczos" -loop 0 mobile-ocr.gif
  ```
- **スクリーンショット**: Cmd+Shift+4 → ウィンドウ選択。Retina の場合は半分サイズに縮小すると README 表示が綺麗

## 配置方法

1. ファイルをこのディレクトリに保存
2. README.md の参照は `<img src="doc/images/xxx.png" />` のままで OK
3. push すると GitHub 上で表示される
