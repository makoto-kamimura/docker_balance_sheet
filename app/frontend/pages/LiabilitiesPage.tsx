import { useState } from 'react';
import { useLiabilities } from '../hooks';
import { exportApi, liabilityApi } from '../api';
import { formatJPY } from '../utils/format';
import { toast } from '../stores/toastStore';
import { useDragReorder } from '../hooks/useDragReorder';
import { LIABILITY_CATEGORY_LABELS, type LiabilityCategory, type Liability } from '../types';

const CATEGORIES = Object.entries(LIABILITY_CATEGORY_LABELS) as [LiabilityCategory, string][];

export default function LiabilitiesPage() {
  const { liabilities, loading, refetch } = useLiabilities();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Liability | null>(null);

  const { items: ordered, dragHandlers, isDragging } = useDragReorder(liabilities, (ids) =>
    liabilityApi.reorder(ids),
  );

  const grouped = CATEGORIES.map(([cat, label]) => ({
    cat, label,
    items: ordered.filter(l => l.category === cat),
    subtotal: ordered.filter(l => l.category === cat).reduce((s, l) => s + l.amount, 0),
  }));

  const total = ordered.reduce((s, l) => s + l.amount, 0);

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return;
    try {
      await liabilityApi.delete(id);
      toast.success('負債を削除しました');
      refetch();
    } catch (e: any) {
      toast.error(e.message ?? '削除に失敗しました');
    }
  };

  const handleExport = async () => {
    try {
      await exportApi.liabilities();
      toast.success('CSV をダウンロードしました');
    } catch (e: any) {
      toast.error(e.message ?? 'CSV ダウンロードに失敗しました');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">負債管理</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={handleExport}>CSV ダウンロード</button>
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            + 負債を追加
          </button>
        </div>
      </div>

      <div className="total-banner liabilities">
        <span>総負債</span>
        <span className="total-amount">{formatJPY(total)}</span>
      </div>

      {loading ? (
        <div className="page-loading">読み込み中...</div>
      ) : (
        grouped.map(({ cat, label, items, subtotal }) => (
          <div key={cat} className="item-group">
            <div className="group-header">
              <span className="group-label">{label}</span>
              <span className="group-subtotal">{formatJPY(subtotal)}</span>
            </div>
            {items.length === 0 ? (
              <div className="empty-row">データがありません</div>
            ) : (
              items.map(liability => {
                const idx = ordered.findIndex(o => o.id === liability.id);
                return (
                <div
                  key={liability.id}
                  className="item-row"
                  {...dragHandlers(idx)}
                  style={{
                    cursor: 'grab',
                    background: isDragging(idx) ? 'rgba(96,165,250,0.15)' : undefined,
                    transition: 'background 120ms',
                  }}
                >
                  <span style={{ color: '#888', userSelect: 'none', marginRight: 8 }} title="ドラッグして並び替え">⋮⋮</span>
                  <div className="item-info">
                    <span className="item-name">{liability.name}</span>
                    {liability.note && <span className="item-note">{liability.note}</span>}
                  </div>
                  <span className="item-amount negative">{formatJPY(liability.amount)}</span>
                  <div className="item-actions">
                    <button className="btn-edit" onClick={() => { setEditing(liability); setShowForm(true); }}>編集</button>
                    <button className="btn-delete" onClick={() => handleDelete(liability.id)}>削除</button>
                  </div>
                </div>
                );
              })
            )}
          </div>
        ))
      )}

      {showForm && (
        <LiabilityFormModal
          liability={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); refetch(); }}
        />
      )}
    </div>
  );
}

function LiabilityFormModal({
  liability, onClose, onSaved,
}: {
  liability: Liability | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName]         = useState(liability?.name ?? '');
  const [category, setCategory] = useState<LiabilityCategory>(liability?.category ?? 'current');
  const [amount, setAmount]     = useState(liability?.amount?.toString() ?? '');
  const [note, setNote]         = useState(liability?.note ?? '');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { name, category, amount: Number(amount), note: note || undefined };
      if (liability) {
        await liabilityApi.update(liability.id, payload);
        toast.success('負債を更新しました');
      } else {
        await liabilityApi.create(payload);
        toast.success('負債を追加しました');
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
          <h2>{liability ? '負債を編集' : '負債を追加'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <p className="form-error">{error}</p>}
        <form onSubmit={handleSubmit} className="modal-form">
          <label className="field">
            <span>負債名</span>
            <input type="text" value={name} required onChange={e => setName(e.target.value)} placeholder="住宅ローン（〇〇銀行）" />
          </label>
          <label className="field">
            <span>カテゴリ</span>
            <select value={category} onChange={e => setCategory(e.target.value as LiabilityCategory)}>
              {CATEGORIES.map(([cat, label]) => (
                <option key={cat} value={cat}>{label}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>金額（円）</span>
            <input type="number" value={amount} required min={0} onChange={e => setAmount(e.target.value)} placeholder="25000000" />
          </label>
          <label className="field">
            <span>メモ（任意）</span>
            <input type="text" value={note ?? ''} onChange={e => setNote(e.target.value)} placeholder="残期間: 25年" />
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
