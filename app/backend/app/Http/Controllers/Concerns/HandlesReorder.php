<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * resource の並び順を一括更新する共通ロジック。
 * Controller 側で reorderRelation(): HasMany と reorder(Request) を実装する場合に使用。
 */
trait HandlesReorder
{
    /**
     * POST /api/{resource}/reorder
     * body: { "ids": [3, 1, 5, ...] } — 並び順は配列の先頭から sort_order = 0..n-1
     */
    public function reorder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids'   => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'min:1'],
        ]);

        /** @var HasMany $relation */
        $relation = $this->reorderRelation();
        $userIds  = $relation->pluck('id')->all();
        $unknown  = array_diff($data['ids'], $userIds);
        if (!empty($unknown)) {
            return response()->json([
                'message' => '他ユーザーの ID もしくは存在しない ID が含まれています。',
                'invalid' => array_values($unknown),
            ], 422);
        }

        DB::transaction(function () use ($relation, $data) {
            foreach ($data['ids'] as $position => $id) {
                $relation->getRelated()->newQuery()
                    ->whereKey($id)
                    ->update(['sort_order' => $position]);
            }
        });

        return response()->json(['updated' => count($data['ids'])]);
    }

    abstract protected function reorderRelation(): HasMany;
}
