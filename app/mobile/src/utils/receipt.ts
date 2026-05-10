import type { ParsedReceipt } from '../types';

const DATE_RE = [
  /(\d{4})[\/\-年\.](\d{1,2})[\/\-月\.](\d{1,2})/,
  /(\d{2})[\/\-年\.](\d{1,2})[\/\-月\.](\d{1,2})/,
];

// 合計優先で順番にスキャン。`合計` を先に検査して `小計` を後回しにすることで合計行を優先する。
const TOTAL_KEYWORDS = ['合計', '総額', 'お会計', '合 計', '小計', '計'];

/**
 * ML Kit Text Recognition の生テキストから日付/金額/店舗名を抽出する。
 * パース精度はレシートのレイアウト次第なので、テストデータを集めながら辞書を調整すること。
 */
export function parseReceipt(rawText: string): ParsedReceipt {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const result: ParsedReceipt = {};

  // 1. 日付
  for (const line of lines) {
    for (const re of DATE_RE) {
      const m = line.match(re);
      if (!m) continue;
      const y = m[1].length === 2 ? `20${m[1]}` : m[1];
      result.occurredAt = `${y}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
      break;
    }
    if (result.occurredAt) break;
  }

  // 2. 金額（合計キーワード優先 → 最大金額フォールバック）
  for (const keyword of TOTAL_KEYWORDS) {
    const line = lines.find((l) => l.includes(keyword));
    if (!line) continue;
    const m = line.match(/[¥￥]?\s*([\d,]+)\s*円?/);
    if (m) {
      result.amount = Number(m[1].replace(/,/g, ''));
      break;
    }
  }
  if (!result.amount) {
    const candidates = lines
      .flatMap((l) => [...l.matchAll(/[¥￥]\s*([\d,]+)/g)])
      .map((m) => Number(m[1].replace(/,/g, '')))
      .filter((n) => n >= 10 && n <= 1_000_000);
    if (candidates.length) result.amount = Math.max(...candidates);
  }

  // 3. 店舗名（先頭 3 行のうち、日本語を含む最初の行）
  result.storeName = lines.slice(0, 3).find((l) => /[ぁ-んァ-ヶ一-龯]/.test(l));

  return result;
}
