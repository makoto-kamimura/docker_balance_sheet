/**
 * 金額を日本円表記でフォーマット。例: 1500000 → "¥1,500,000"
 */
export function formatJPY(amount: number): string {
  if (!Number.isFinite(amount)) return '¥0';
  const sign = amount < 0 ? '-' : '';
  const abs  = Math.abs(Math.round(amount));
  return `${sign}¥${abs.toLocaleString('ja-JP')}`;
}

/**
 * コンパクト表記。例: 1500000 → "150万円", 123456789 → "1.23億円"
 */
export function formatCompact(amount: number): string {
  if (!Number.isFinite(amount)) return '0円';
  const sign = amount < 0 ? '-' : '';
  const abs  = Math.abs(amount);

  if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(2)}億円`;
  if (abs >= 10_000)      return `${sign}${Math.floor(abs / 10_000).toLocaleString('ja-JP')}万円`;
  return `${sign}${abs.toLocaleString('ja-JP')}円`;
}

/**
 * Date → YYYY-MM-DD。Web 版とは違いタイムゾーン安全のため手組み。
 */
export function todayYmd(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
