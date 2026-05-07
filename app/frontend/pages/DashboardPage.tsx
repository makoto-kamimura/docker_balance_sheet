import { useState } from 'react';
import {
  useAssets,
  useAutoBudget,
  useBalanceComparison,
  useBalanceSummary,
  useBudgetSummary,
  useSnapshots,
} from '../hooks';
import { formatJPY, formatCompact } from '../utils/format';
import NetWorthChart from '../components/NetWorthChart';
import AssetAllocationChart from '../components/AssetAllocationChart';
import ChangeBadge from '../components/ChangeBadge';
import { snapshotApi } from '../api';
import { toast } from '../stores/toastStore';

export default function DashboardPage() {
  const { summary, loading } = useBalanceSummary();
  const { snapshots, refetch: refetchSnapshots } = useSnapshots(12);
  const { budget } = useBudgetSummary();
  const { autoBudget } = useAutoBudget();
  const { assets } = useAssets();
  const { comparison, refetch: refetchComparison } = useBalanceComparison();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const handleSaveSnapshot = async () => {
    setSaving(true);
    try {
      await snapshotApi.save();
      await Promise.all([refetchSnapshots(), refetchComparison()]);
      setSaved(true);
      toast.success('今月のスナップショットを保存しました');
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      toast.error(e.message ?? 'スナップショット保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loading">読み込み中...</div>;
  if (!summary) return null;

  const netWorthPositive = summary.net_worth >= 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">ダッシュボード</h1>
        <button
          className="btn-secondary"
          onClick={handleSaveSnapshot}
          disabled={saving}
        >
          {saved ? '✓ 保存しました' : saving ? '保存中...' : '今月のスナップショットを保存'}
        </button>
      </div>

      <div className="summary-hero">
        <div className="hero-label">純資産（ネットワース）</div>
        <div className={`hero-amount ${netWorthPositive ? 'positive' : 'negative'}`}>
          {formatJPY(summary.net_worth)}
        </div>
        <div className="hero-sub">{formatCompact(summary.net_worth)}</div>
        {comparison?.change && (
          <div style={{ marginTop: 8 }}>
            前月比{' '}
            <ChangeBadge
              amount={comparison.change.net_worth.amount}
              percent={comparison.change.net_worth.percent}
              direction="positive_is_good"
            />
            {comparison.previous && (
              <span style={{ opacity: 0.5, fontSize: 12, marginLeft: 8 }}>
                ({comparison.previous.year_month} → {comparison.current?.year_month})
              </span>
            )}
          </div>
        )}
      </div>

      <div className="summary-cards">
        <div className="summary-card assets">
          <div className="card-label">総資産</div>
          <div className="card-amount">{formatJPY(summary.total_assets)}</div>
          <div className="card-bar">
            <div className="card-bar-fill" style={{ width: `${summary.asset_ratio}%` }} />
          </div>
          <div className="card-ratio">{summary.asset_ratio}%</div>
          {comparison?.change && (
            <div style={{ marginTop: 6 }}>
              <ChangeBadge
                amount={comparison.change.total_assets.amount}
                percent={comparison.change.total_assets.percent}
                direction="positive_is_good"
              />
            </div>
          )}
        </div>

        <div className="summary-card liabilities">
          <div className="card-label">総負債</div>
          <div className="card-amount">{formatJPY(summary.total_liabilities)}</div>
          <div className="card-bar">
            <div className="card-bar-fill" style={{ width: `${100 - summary.asset_ratio}%` }} />
          </div>
          <div className="card-ratio">{(100 - summary.asset_ratio).toFixed(1)}%</div>
          {comparison?.change && (
            <div style={{ marginTop: 6 }}>
              <ChangeBadge
                amount={comparison.change.total_liabilities.amount}
                percent={comparison.change.total_liabilities.percent}
                direction="negative_is_good"
              />
            </div>
          )}
        </div>
      </div>

      {comparison && !comparison.previous && comparison.current && (
        <div style={{ opacity: 0.6, fontSize: 12, margin: '8px 0' }}>
          ※ 前月比を表示するにはスナップショットが 2 件以上必要です（現在 1 件）。
        </div>
      )}
      {comparison && !comparison.current && (
        <div style={{ opacity: 0.6, fontSize: 12, margin: '8px 0' }}>
          ※ スナップショットが未保存です。「今月のスナップショットを保存」ボタンで履歴を蓄積できます。
        </div>
      )}

      {autoBudget && autoBudget.totals.this_month_actual > 0 && (
        <div className="chart-section">
          <h2 className="section-title">今月の家計簿（実績ベース）</h2>
          <div className="summary-cards">
            <div className="summary-card" style={{ borderLeft: '4px solid #f87171' }}>
              <div className="card-label">今月の支出合計</div>
              <div className="card-amount">{formatJPY(autoBudget.totals.this_month_actual)}</div>
              <div className="card-ratio" style={{ opacity: 0.7 }}>
                {autoBudget.by_category.length} カテゴリ記録中
              </div>
            </div>
            <div className="summary-card" style={{ borderLeft: '4px solid #60a5fa' }}>
              <div className="card-label">月予算合計（解禁分）</div>
              <div className="card-amount">
                {autoBudget.totals.monthly_budget !== null
                  ? formatJPY(autoBudget.totals.monthly_budget)
                  : '— 未解禁'}
              </div>
              <div className="card-ratio" style={{ opacity: 0.7 }}>
                {autoBudget.totals.annual_budget !== null
                  ? `年予算 ${formatCompact(autoBudget.totals.annual_budget)}`
                  : '3ヶ月分の実績で解禁'}
              </div>
            </div>
            <div
              className="summary-card"
              style={{
                borderLeft: `4px solid ${
                  autoBudget.totals.remaining === null
                    ? '#94a3b8'
                    : autoBudget.totals.remaining < 0
                      ? '#f87171'
                      : '#4ade80'
                }`,
              }}
            >
              <div className="card-label">今月の残予算</div>
              <div
                className={`card-amount ${
                  autoBudget.totals.remaining === null
                    ? ''
                    : autoBudget.totals.remaining < 0
                      ? 'negative'
                      : 'positive'
                }`}
              >
                {autoBudget.totals.remaining !== null
                  ? formatJPY(autoBudget.totals.remaining)
                  : '—'}
              </div>
              <div className="card-ratio" style={{ opacity: 0.7 }}>
                {autoBudget.totals.remaining !== null && autoBudget.totals.remaining < 0
                  ? '⚠ 予算オーバー'
                  : '家計簿タブで詳細を確認'}
              </div>
            </div>
          </div>
        </div>
      )}

      {budget && (
        <div className="chart-section">
          <h2 className="section-title">月間予算サマリー（ライフプラン項目より集計）</h2>
          <div className="summary-cards">
            <div className="summary-card" style={{ borderLeft: '4px solid #4ade80' }}>
              <div className="card-label">月間収入</div>
              <div className="card-amount">{formatJPY(budget.monthly_income)}</div>
              <div className="card-ratio" style={{ opacity: 0.7 }}>年間 {formatCompact(budget.annual_income)}</div>
            </div>
            <div className="summary-card" style={{ borderLeft: '4px solid #f87171' }}>
              <div className="card-label">月間支出</div>
              <div className="card-amount">{formatJPY(budget.monthly_expense)}</div>
              <div className="card-ratio" style={{ opacity: 0.7 }}>年間 {formatCompact(budget.annual_expense)}</div>
            </div>
            <div
              className="summary-card"
              style={{ borderLeft: `4px solid ${budget.monthly_net >= 0 ? '#60a5fa' : '#fbbf24'}` }}
            >
              <div className="card-label">月間収支</div>
              <div className={`card-amount ${budget.monthly_net >= 0 ? 'positive' : 'negative'}`}>
                {formatJPY(budget.monthly_net)}
              </div>
              <div className="card-ratio" style={{ opacity: 0.7 }}>年間 {formatCompact(budget.annual_net)}</div>
            </div>
          </div>
        </div>
      )}

      {assets.length > 0 && (
        <div className="chart-section">
          <h2 className="section-title">資産配分（カテゴリ別）</h2>
          <AssetAllocationChart assets={assets} />
        </div>
      )}

      {snapshots.length > 0 && (
        <div className="chart-section">
          <h2 className="section-title">純資産推移</h2>
          <NetWorthChart snapshots={snapshots} />
        </div>
      )}
    </div>
  );
}
