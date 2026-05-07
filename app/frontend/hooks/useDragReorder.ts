import { useState } from 'react';
import { toast } from '../stores/toastStore';

/**
 * HTML5 ドラッグ&ドロップで配列を並び替える共通フック。
 * - 元配列の順を表示用に保持し、ドラッグ操作で楽観的に更新
 * - drop 時に reorderApi(ids[]) を呼び、失敗時は元配列に巻き戻し toast.error
 *
 * 使い方:
 *   const { items, dragHandlers } = useDragReorder(assets, (ids) => assetApi.reorder(ids));
 *   <div {...dragHandlers(idx)}>...</div>
 */
export function useDragReorder<T extends { id: number }>(
  source: T[],
  reorderApi: (ids: number[]) => Promise<unknown>,
) {
  const [items, setItems]   = useState<T[]>(source);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // source が更新されたら同期（refetch 後など）
  if (items.length !== source.length || items.some((it, i) => it.id !== source[i]?.id)) {
    // 順序未変更なら同期、ドラッグ中ならスキップ
    if (dragIdx === null) {
      setItems(source);
    }
  }

  const dragHandlers = (idx: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      setDragIdx(idx);
      e.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    },
    onDrop: async (e: React.DragEvent) => {
      e.preventDefault();
      if (dragIdx === null || dragIdx === idx) {
        setDragIdx(null);
        return;
      }
      const next = [...items];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      const previous = items;
      setItems(next);
      setDragIdx(null);
      try {
        await reorderApi(next.map((it) => it.id));
      } catch (err: any) {
        setItems(previous);
        toast.error(err?.message ?? '並び順の更新に失敗しました');
      }
    },
    onDragEnd: () => setDragIdx(null),
  });

  return { items, dragHandlers, isDragging: (idx: number) => idx === dragIdx };
}
