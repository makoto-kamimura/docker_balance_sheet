import { useBalanceSheet } from '../hooks';
import { formatJPY } from '../utils/format';

const ASSET_SECTION_KEYS = ['current', 'fixed', 'investment'] as const;
const LIABILITY_SECTION_KEYS = ['current', 'longterm'] as const;

export default function BalanceSheetPage() {
  const { balanceSheet, loading } = useBalanceSheet();

  if (loading) return <div className="page-loading">読み込み中...</div>;
  if (!balanceSheet) return null;

  const { assets, liabilities, net_worth, recorded_at } = balanceSheet;
  const netPositive = net_worth >= 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">バランスシート</h1>
      </div>

      <div className="bs-grid">
        {/* ─── 資産 ───────────────────────────────── */}
        <div className="bs-side">
          <div className="bs-side-header assets-header">資産の部</div>

          {ASSET_SECTION_KEYS.map(key => {
            const section = assets[key];
            return (
              <div key={key} className={`bs-section bs-section--${key}`}>
                <div className="bs-section-title">{section.label}</div>
                {section.items.length === 0 ? (
                  <div className="bs-empty">データがありません</div>
                ) : (
                  section.items.map(item => (
                    <div key={item.id} className="bs-row">
                      <span className="bs-row-name">{item.name}</span>
                      <span className="bs-row-amount">{formatJPY(item.amount)}</span>
                    </div>
                  ))
                )}
                <div className="bs-subtotal">
                  <span>小計</span>
                  <span>{formatJPY(section.subtotal)}</span>
                </div>
              </div>
            );
          })}

          <div className="bs-total assets-total">
            <span>資産合計</span>
            <span>{formatJPY(assets.total)}</span>
          </div>
        </div>

        {/* ─── 負債・純資産 ────────────────────────── */}
        <div className="bs-side">
          <div className="bs-side-header liabilities-header">負債・純資産の部</div>

          {LIABILITY_SECTION_KEYS.map(key => {
            const section = liabilities[key];
            const cssKey  = key === 'current' ? 'liab-current' : 'liab-longterm';
            return (
              <div key={key} className={`bs-section bs-section--${cssKey}`}>
                <div className="bs-section-title">{section.label}</div>
                {section.items.length === 0 ? (
                  <div className="bs-empty">データがありません</div>
                ) : (
                  section.items.map(item => (
                    <div key={item.id} className="bs-row">
                      <span className="bs-row-name">{item.name}</span>
                      <span className="bs-row-amount">{formatJPY(item.amount)}</span>
                    </div>
                  ))
                )}
                <div className="bs-subtotal">
                  <span>小計</span>
                  <span>{formatJPY(section.subtotal)}</span>
                </div>
              </div>
            );
          })}

          <div className="bs-total liabilities-total">
            <span>負債合計</span>
            <span>{formatJPY(liabilities.total)}</span>
          </div>

          <div className="bs-net-worth">
            <span>純資産</span>
            <span className={netPositive ? 'positive' : 'negative'}>
              {formatJPY(net_worth)}
            </span>
          </div>
        </div>
      </div>

      <div className="bs-date">
        記録時刻: {new Date(recorded_at).toLocaleString('ja-JP')}
      </div>
    </div>
  );
}
