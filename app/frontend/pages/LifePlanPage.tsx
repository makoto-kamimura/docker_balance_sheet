import { useMemo, useState } from 'react';
import { useBudgetProjection, useBudgetSummary, useCashflowItems } from '../hooks';
import { cashflowApi, exportApi } from '../api';
import { formatJPY } from '../utils/format';
import { toast } from '../stores/toastStore';
import { useDragReorder } from '../hooks/useDragReorder';
import AgeProjectionChart from '../components/AgeProjectionChart';
import CategoryBreakdownChart, {
  type CategoryBreakdownMode,
} from '../components/CategoryBreakdownChart';
import {
  CASHFLOW_DIRECTION_LABELS,
  CASHFLOW_FREQUENCY_LABELS,
  type CashflowDirection,
  type CashflowFrequency,
  type CashflowItem,
} from '../types';

const DIRECTIONS = Object.entries(CASHFLOW_DIRECTION_LABELS) as [CashflowDirection, string][];
const FREQUENCIES = Object.entries(CASHFLOW_FREQUENCY_LABELS) as [CashflowFrequency, string][];

export default function LifePlanPage() {
  const { items, loading, refetch } = useCashflowItems();
  const { projection } = useBudgetProjection(23, 99);
  const { budget }     = useBudgetSummary();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<CashflowItem | null>(null);
  const [filter, setFilter]     = useState<'all' | CashflowDirection>('all');
  const [chartMode, setChartMode] = useState<CategoryBreakdownMode>('monthly');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const { items: orderedItems, dragHandlers, isDragging } = useDragReorder(items, (ids) =>
    cashflowApi.reorder(ids),
  );

  const filtered = useMemo(() => {
    let result = orderedItems;
    if (filter !== 'all') {
      result = result.filter((i: CashflowItem) => i.direction === filter);
    }
    if (categoryFilter !== null) {
      result = result.filter(
        (i: CashflowItem) => (i.category ?? 'uncategorized') === categoryFilter,
      );
    }
    return result;
  }, [orderedItems, filter, categoryFilter]);

  const totalIncome  = items
    .filter(i => i.direction === 'income')
    .reduce((s, i) => s + Number(i.annual_amount || 0), 0);
  const totalExpense = items
    .filter(i => i.direction === 'expense')
    .reduce((s, i) => s + Number(i.annual_amount || 0), 0);
  const netAnnual = totalIncome - totalExpense;

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return;
    try {
      await cashflowApi.delete(id);
      toast.success('項目を削除しました');
      refetch();
    } catch (e: any) {
      toast.error(e.message ?? '削除に失敗しました');
    }
  };

  const handleExport = async () => {
    try {
      await exportApi.cashflowItems();
      toast.success('CSV をダウンロードしました');
    } catch (e: any) {
      toast.error(e.message ?? 'CSV ダウンロードに失敗しました');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">ライフプラン</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={handleExport}>CSV ダウンロード</button>
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            + 項目を追加
          </button>
        </div>
      </div>

      <div className="total-banner">
        <div>
          <span>年間収入</span>
          <span className="total-amount" style={{ color: '#4ade80' }}>{formatJPY(totalIncome)}</span>
        </div>
        <div>
          <span>年間支出</span>
          <span className="total-amount" style={{ color: '#f87171' }}>{formatJPY(totalExpense)}</span>
        </div>
        <div>
          <span>年間収支</span>
          <span className="total-amount">{formatJPY(netAnnual)}</span>
        </div>
      </div>

      {projection && projection.rows.length > 0 && (
        <div className="chart-section">
          <h2 className="section-title">
            年齢別キャッシュフロー推移（{projection.from} 〜 {projection.to} 歳）
          </h2>
          <AgeProjectionChart rows={projection.rows} />
        </div>
      )}

      {budget && budget.by_category.length > 0 && (
        <div className="chart-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              カテゴリ別支出（{chartMode === 'monthly' ? '月額' : '年額'}）
            </h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className={chartMode === 'monthly' ? 'btn-primary' : 'btn-secondary'}
                onClick={() => setChartMode('monthly')}
              >
                月額
              </button>
              <button
                className={chartMode === 'annual' ? 'btn-primary' : 'btn-secondary'}
                onClick={() => setChartMode('annual')}
              >
                年額
              </button>
            </div>
          </div>
          <p className="hint" style={{ fontSize: 12, opacity: 0.7, margin: '4px 0 8px' }}>
            ※ バーをクリックすると該当カテゴリの項目だけに絞り込みます。
          </p>
          <CategoryBreakdownChart
            byCategory={budget.by_category}
            mode={chartMode}
            selectedCategory={categoryFilter}
            onCategoryClick={(cat) => {
              setCategoryFilter((current: string | null) => (current === cat ? null : cat));
              setFilter('expense');
            }}
          />
        </div>
      )}

      <div className="filter-row" style={{ display: 'flex', gap: 8, margin: '12px 0', flexWrap: 'wrap', alignItems: 'center' }}>
        <button className={filter === 'all' ? 'btn-primary' : 'btn-secondary'} onClick={() => setFilter('all')}>すべて</button>
        {DIRECTIONS.map(([dir, label]) => (
          <button
            key={dir}
            className={filter === dir ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setFilter(dir)}
          >
            {label}
          </button>
        ))}
        {categoryFilter && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: 'rgba(96,165,250,0.18)',
            border: '1px solid rgba(96,165,250,0.4)',
            borderRadius: 999,
            fontSize: 13,
          }}>
            カテゴリ: {categoryFilter === 'uncategorized' ? '未分類' : categoryFilter}
            <button
              onClick={() => setCategoryFilter(null)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, fontSize: 14 }}
              title="カテゴリフィルタを解除"
            >
              ✕
            </button>
          </span>
        )}
      </div>

      {loading ? (
        <div className="page-loading">読み込み中...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-row">項目がありません</div>
      ) : (
        <table className="cashflow-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: 24 }}></th>
              <th>項目名</th>
              <th>区分</th>
              <th>種別</th>
              <th>カテゴリ</th>
              <th>購入先</th>
              <th>月額</th>
              <th>年額</th>
              <th>開始〜終了</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              // filter 適用後でも元配列の index を使ってドラッグ位置を計算
              const idx = orderedItems.findIndex((i: CashflowItem) => i.id === item.id);
              return (
              <tr
                key={item.id}
                {...dragHandlers(idx)}
                style={{
                  cursor: 'grab',
                  background: isDragging(idx) ? 'rgba(96,165,250,0.15)' : undefined,
                  transition: 'background 120ms',
                }}
              >
                <td style={{ color: '#888', userSelect: 'none' }} title="ドラッグして並び替え">⋮⋮</td>
                <td>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer">{item.name} ↗</a>
                  ) : (
                    item.name
                  )}
                  {item.note && <div className="item-note">{item.note}</div>}
                </td>
                <td>{CASHFLOW_DIRECTION_LABELS[item.direction]}</td>
                <td>{CASHFLOW_FREQUENCY_LABELS[item.frequency]}</td>
                <td>{item.category ?? '—'}</td>
                <td>{item.vendor ?? '—'}</td>
                <td>{formatJPY(Number(item.monthly_amount))}</td>
                <td>{formatJPY(Number(item.annual_amount))}</td>
                <td>
                  {item.start_age ?? '—'} 〜 {item.end_age ?? '継続'}
                </td>
                <td>
                  <button className="btn-edit" onClick={() => { setEditing(item); setShowForm(true); }}>編集</button>
                  <button className="btn-delete" onClick={() => handleDelete(item.id)}>削除</button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {showForm && (
        <CashflowFormModal
          item={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); refetch(); }}
        />
      )}
    </div>
  );
}

function CashflowFormModal({
  item, onClose, onSaved,
}: {
  item: CashflowItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName]         = useState(item?.name ?? '');
  const [direction, setDir]     = useState<CashflowDirection>(item?.direction ?? 'expense');
  const [frequency, setFreq]    = useState<CashflowFrequency>(item?.frequency ?? 'fixed');
  const [category, setCategory] = useState(item?.category ?? '');
  const [vendor, setVendor]     = useState(item?.vendor ?? '');
  const [monthly, setMonthly]   = useState(item?.monthly_amount?.toString() ?? '');
  const [annual,  setAnnual]    = useState(item?.annual_amount?.toString() ?? '');
  const [startAge, setStartAge] = useState(item?.start_age?.toString() ?? '');
  const [endAge,   setEndAge]   = useState(item?.end_age?.toString() ?? '');
  const [note, setNote]         = useState(item?.note ?? '');
  const [url, setUrl]           = useState(item?.url ?? '');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        name,
        direction,
        frequency,
        category: category || null,
        vendor:   vendor   || null,
        monthly_amount: monthly ? Number(monthly) : 0,
        annual_amount:  annual  ? Number(annual)  : 0,
        start_age: startAge ? Number(startAge) : null,
        end_age:   endAge   ? Number(endAge)   : null,
        note: note || null,
        url:  url  || null,
      };
      if (item) {
        await cashflowApi.update(item.id, payload);
        toast.success('項目を更新しました');
      } else {
        await cashflowApi.create(payload);
        toast.success('項目を追加しました');
      }
      onSaved();
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message ?? '保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{item ? '項目を編集' : '項目を追加'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <p className="form-error">{error}</p>}
        <form onSubmit={handleSubmit} className="modal-form">
          <label className="field">
            <span>項目名</span>
            <input type="text" value={name} required onChange={e => setName(e.target.value)} placeholder="家賃 / 年収（JAL）など" />
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <label className="field" style={{ flex: 1 }}>
              <span>区分</span>
              <select value={direction} onChange={e => setDir(e.target.value as CashflowDirection)}>
                {DIRECTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="field" style={{ flex: 1 }}>
              <span>種別</span>
              <select value={frequency} onChange={e => setFreq(e.target.value as CashflowFrequency)}>
                {FREQUENCIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <label className="field" style={{ flex: 1 }}>
              <span>カテゴリ（任意）</span>
              <input type="text" value={category ?? ''} onChange={e => setCategory(e.target.value)} placeholder="housing / utilities / food / ..." />
            </label>
            <label className="field" style={{ flex: 1 }}>
              <span>購入先（任意）</span>
              <input type="text" value={vendor ?? ''} onChange={e => setVendor(e.target.value)} placeholder="Netflix Inc. / Amazon ..." />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <label className="field" style={{ flex: 1 }}>
              <span>月額（円）</span>
              <input type="number" min={0} value={monthly} onChange={e => setMonthly(e.target.value)} placeholder="50000" />
            </label>
            <label className="field" style={{ flex: 1 }}>
              <span>年額（円）</span>
              <input type="number" min={0} value={annual} onChange={e => setAnnual(e.target.value)} placeholder="600000" />
            </label>
          </div>
          <p className="hint" style={{ fontSize: 12, opacity: 0.7 }}>
            ※ 月額・年額のいずれか片方のみ入力された場合、もう一方はサーバ側で自動補完されます。
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <label className="field" style={{ flex: 1 }}>
              <span>開始年齢</span>
              <input type="number" min={0} max={120} value={startAge} onChange={e => setStartAge(e.target.value)} placeholder="23" />
            </label>
            <label className="field" style={{ flex: 1 }}>
              <span>終了年齢（空欄=継続）</span>
              <input type="number" min={0} max={120} value={endAge} onChange={e => setEndAge(e.target.value)} placeholder="65" />
            </label>
          </div>
          <label className="field">
            <span>メモ（任意）</span>
            <input type="text" value={note ?? ''} onChange={e => setNote(e.target.value)} placeholder="ボーナス込み / 〇〇銀行 など" />
          </label>
          <label className="field">
            <span>備考 URL（任意）</span>
            <input type="url" value={url ?? ''} onChange={e => setUrl(e.target.value)} placeholder="https://www.netflix.com/account など" />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>キャンセル</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '保存中...' : '保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
