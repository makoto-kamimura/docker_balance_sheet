import { useMemo, useState } from 'react';
import { useAutoBudget, useExpenses } from '../hooks';
import { expenseApi } from '../api';
import { formatJPY } from '../utils/format';
import { toast } from '../stores/toastStore';
import type { AutoBudgetCategory, Expense } from '../types';

function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function thisMonthRange(): { from: string; to: string } {
  const d  = new Date();
  const y  = d.getFullYear();
  const m  = d.getMonth();
  const f  = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const to = new Date(y, m + 1, 0);
  return { from: f, to: `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, '0')}-${String(to.getDate()).padStart(2, '0')}` };
}

export default function ExpensesPage() {
  const range = useMemo(thisMonthRange, []);
  const { expenses, refetch: refetchExpenses } = useExpenses(range);
  const { autoBudget, refetch: refetchBudget } = useAutoBudget();

  const [category, setCategory] = useState('');
  const [amount,   setAmount]   = useState('');
  const [date,     setDate]     = useState(todayYmd());
  const [note,     setNote]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  const knownCategories = useMemo(() => {
    const set = new Set<string>();
    autoBudget?.by_category.forEach((c) => set.add(c.category));
    expenses.forEach((e: Expense) => set.add(e.category));
    return Array.from(set).sort();
  }, [autoBudget, expenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim() || !amount) {
      toast.error('カテゴリと金額を入力してください');
      return;
    }
    setSubmitting(true);
    try {
      await expenseApi.create({
        category: category.trim(),
        amount: Number(amount),
        occurred_at: date,
        note: note.trim() || null,
      });
      const remaining = autoBudget?.by_category.find((c) => c.category === category.trim())?.remaining;
      const after = remaining !== null && remaining !== undefined ? remaining - Number(amount) : null;
      if (after !== null) {
        toast.success(`記録しました — ${category.trim()} の残予算: ${formatJPY(after)}`);
      } else {
        toast.success('記録しました');
      }
      setAmount('');
      setNote('');
      // 残予算をリアルタイム反映
      await Promise.all([refetchExpenses(), refetchBudget()]);
    } catch (err: any) {
      toast.error(err.message ?? '記録に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return;
    try {
      await expenseApi.delete(id);
      toast.success('削除しました');
      await Promise.all([refetchExpenses(), refetchBudget()]);
    } catch (err: any) {
      toast.error(err.message ?? '削除に失敗しました');
    }
  };

  const totals = autoBudget?.totals;
  const overBudget = totals?.remaining !== null && totals?.remaining !== undefined && totals.remaining < 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">家計簿（実績）</h1>
      </div>

      {/* 今月の合計バナー */}
      {autoBudget && (
        <div className="total-banner">
          <div>
            <span>今月の支出合計</span>
            <span className="total-amount" style={{ color: '#f87171' }}>{formatJPY(totals?.this_month_actual ?? 0)}</span>
          </div>
          <div>
            <span>月予算合計（解禁分のみ）</span>
            <span className="total-amount">
              {totals?.monthly_budget !== null ? formatJPY(totals!.monthly_budget!) : '— 3ヶ月分の実績で解禁'}
            </span>
          </div>
          <div>
            <span>残予算</span>
            <span className="total-amount" style={{ color: overBudget ? '#f87171' : '#4ade80' }}>
              {totals?.remaining !== null && totals?.remaining !== undefined ? formatJPY(totals.remaining) : '—'}
            </span>
          </div>
        </div>
      )}

      {/* 入力フォーム */}
      <div className="chart-section">
        <h2 className="section-title" style={{ margin: '0 0 8px' }}>支出を記録</h2>
        <form onSubmit={handleSubmit} className="modal-form" style={{ gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <label className="field" style={{ flex: '2 1 200px' }}>
              <span>カテゴリ</span>
              <input
                type="text"
                list="category-options"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="food / transport / ..."
                required
              />
              <datalist id="category-options">
                {knownCategories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </label>
            <label className="field" style={{ flex: '1 1 140px' }}>
              <span>金額（円）</span>
              <input
                type="number"
                min={0}
                step={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1500"
                required
              />
            </label>
            <label className="field" style={{ flex: '1 1 160px' }}>
              <span>日付</span>
              <input type="date" value={date} max={todayYmd()} onChange={(e) => setDate(e.target.value)} required />
            </label>
            <label className="field" style={{ flex: '2 1 200px' }}>
              <span>メモ（任意）</span>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="ローソン昼食 など" />
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? '記録中…' : '＋ 記録する'}
            </button>
          </div>
        </form>
      </div>

      {/* 自動予算パネル */}
      {autoBudget && autoBudget.by_category.length > 0 && (
        <div className="chart-section">
          <h2 className="section-title">カテゴリ別 月予算 / 残予算</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {autoBudget.by_category.map((c) => (
              <BudgetRow key={c.category} cat={c} />
            ))}
          </div>
        </div>
      )}

      {/* 当月の実績一覧 */}
      <div className="chart-section">
        <h2 className="section-title">今月の実績一覧（{range.from} 〜 {range.to}）</h2>
        {expenses.length === 0 ? (
          <div className="empty-row">記録がありません</div>
        ) : (
          <table className="cashflow-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>日付</th>
                <th>カテゴリ</th>
                <th style={{ textAlign: 'right' }}>金額</th>
                <th>メモ</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e: Expense) => (
                <tr key={e.id}>
                  <td>{e.occurred_at}</td>
                  <td>{e.category}</td>
                  <td style={{ textAlign: 'right' }}>{formatJPY(Number(e.amount))}</td>
                  <td>{e.note ?? '—'}</td>
                  <td>
                    <button className="btn-delete" onClick={() => handleDelete(e.id)}>削除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function BudgetRow({ cat }: { cat: AutoBudgetCategory }) {
  const locked = cat.monthly_budget === null;
  const ratio  = locked || !cat.monthly_budget
    ? 0
    : Math.min(1, cat.this_month_actual / cat.monthly_budget);
  const over   = !locked && cat.remaining !== null && cat.remaining < 0;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      padding: '10px 12px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <strong style={{ fontSize: 15 }}>{cat.category}</strong>
        {locked ? (
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            あと {Math.max(0, 3 - cat.months_with_data)} ヶ月分の実績で月予算が解禁されます（現在 {cat.months_with_data}/3 ヶ月）
          </span>
        ) : (
          <span style={{ fontSize: 13 }}>
            <span style={{ opacity: 0.7 }}>月予算 </span>
            {formatJPY(cat.monthly_budget!)}
            <span style={{ margin: '0 6px', opacity: 0.4 }}>|</span>
            <span style={{ opacity: 0.7 }}>実績 </span>
            {formatJPY(cat.this_month_actual)}
            <span style={{ margin: '0 6px', opacity: 0.4 }}>|</span>
            <span style={{ opacity: 0.7 }}>残り </span>
            <strong style={{ color: over ? '#f87171' : '#4ade80' }}>{formatJPY(cat.remaining!)}</strong>
            {cat.annual_budget !== null && (
              <span style={{ marginLeft: 12, fontSize: 12, opacity: 0.6 }}>
                （年予算 {formatJPY(cat.annual_budget)}）
              </span>
            )}
          </span>
        )}
      </div>
      {!locked && (
        <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.round(ratio * 100)}%`,
            background: over ? '#f87171' : ratio > 0.8 ? '#fbbf24' : '#4ade80',
            transition: 'width 240ms',
          }} />
        </div>
      )}
    </div>
  );
}
