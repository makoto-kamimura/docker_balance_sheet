import { useState } from 'react';
import { useAssets } from '../hooks';
import { assetApi, exportApi } from '../api';
import { formatJPY } from '../utils/format';
import { toast } from '../stores/toastStore';
import { useDragReorder } from '../hooks/useDragReorder';
import { ASSET_CATEGORY_LABELS, type AssetCategory, type Asset } from '../types';

const CATEGORIES = Object.entries(ASSET_CATEGORY_LABELS) as [AssetCategory, string][];

export default function AssetsPage() {
  const { assets, loading, refetch } = useAssets();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);

  // sort_order ベースのフラット並び順を維持しつつ、表示はカテゴリ別グループ。
  // ドラッグはフラット index で操作（同カテゴリ内の並び替えで自然に機能）。
  const { items: ordered, dragHandlers, isDragging } = useDragReorder(assets, (ids) =>
    assetApi.reorder(ids),
  );

  const grouped = CATEGORIES.map(([cat, label]) => ({
    cat, label,
    items: ordered.filter(a => a.category === cat),
    subtotal: ordered.filter(a => a.category === cat).reduce((s, a) => s + a.amount, 0),
  }));

  const total = ordered.reduce((s, a) => s + a.amount, 0);

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return;
    try {
      await assetApi.delete(id);
      toast.success('資産を削除しました');
      refetch();
    } catch (e: any) {
      toast.error(e.message ?? '削除に失敗しました');
    }
  };

  const handleExport = async () => {
    try {
      await exportApi.assets();
      toast.success('CSV をダウンロードしました');
    } catch (e: any) {
      toast.error(e.message ?? 'CSV ダウンロードに失敗しました');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">資産管理</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={handleExport}>CSV ダウンロード</button>
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            + 資産を追加
          </button>
        </div>
      </div>

      <div className="total-banner">
        <span>総資産</span>
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
              items.map(asset => {
                const idx = ordered.findIndex(o => o.id === asset.id);
                return (
                <div
                  key={asset.id}
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
                    <span className="item-name">{asset.name}</span>
                    {asset.note && <span className="item-note">{asset.note}</span>}
                  </div>
                  <span className="item-amount">{formatJPY(asset.amount)}</span>
                  <div className="item-actions">
                    <button className="btn-edit" onClick={() => { setEditing(asset); setShowForm(true); }}>編集</button>
                    <button className="btn-delete" onClick={() => handleDelete(asset.id)}>削除</button>
                  </div>
                </div>
                );
              })
            )}
          </div>
        ))
      )}

      {showForm && (
        <AssetFormModal
          asset={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); refetch(); }}
        />
      )}
    </div>
  );
}

function AssetFormModal({
  asset, onClose, onSaved,
}: {
  asset: Asset | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName]         = useState(asset?.name ?? '');
  const [category, setCategory] = useState<AssetCategory>(asset?.category ?? 'current');
  const [amount, setAmount]     = useState(asset?.amount?.toString() ?? '');
  const [note, setNote]         = useState(asset?.note ?? '');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { name, category, amount: Number(amount), note: note || undefined };
      if (asset) {
        await assetApi.update(asset.id, payload);
        toast.success('資産を更新しました');
      } else {
        await assetApi.create(payload);
        toast.success('資産を追加しました');
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
          <h2>{asset ? '資産を編集' : '資産を追加'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <p className="form-error">{error}</p>}
        <form onSubmit={handleSubmit} className="modal-form">
          <label className="field">
            <span>資産名</span>
            <input type="text" value={name} required onChange={e => setName(e.target.value)} placeholder="普通預金（〇〇銀行）" />
          </label>
          <label className="field">
            <span>カテゴリ</span>
            <select value={category} onChange={e => setCategory(e.target.value as AssetCategory)}>
              {CATEGORIES.map(([cat, label]) => (
                <option key={cat} value={cat}>{label}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>金額（円）</span>
            <input type="number" value={amount} required min={0} onChange={e => setAmount(e.target.value)} placeholder="1500000" />
          </label>
          <label className="field">
            <span>メモ（任意）</span>
            <input type="text" value={note ?? ''} onChange={e => setNote(e.target.value)} placeholder="生活費口座" />
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
