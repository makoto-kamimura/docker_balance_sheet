<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\HandlesReorder;
use App\Http\Controllers\Controller;
use App\Http\Requests\Liability\StoreLiabilityRequest;
use App\Http\Requests\Liability\UpdateLiabilityRequest;
use App\Http\Resources\LiabilityResource;
use App\Models\Liability;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LiabilityController extends Controller
{
    use HandlesReorder;

    /**
     * 負債一覧取得（sort_order → category → name の優先順）
     * GET /api/liabilities
     */
    public function index(): AnonymousResourceCollection
    {
        $liabilities = auth()->user()
            ->liabilities()
            ->orderBy('sort_order')
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        return LiabilityResource::collection($liabilities);
    }

    protected function reorderRelation(): HasMany
    {
        return auth()->user()->liabilities();
    }

    /**
     * 負債登録（sort_order は末尾に自動採番）
     * POST /api/liabilities
     */
    public function store(StoreLiabilityRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['sort_order'] = (int) (auth()->user()->liabilities()->max('sort_order') ?? -1) + 1;
        $liability = auth()->user()->liabilities()->create($data);

        return response()->json(new LiabilityResource($liability), 201);
    }

    /**
     * 負債詳細取得
     * GET /api/liabilities/{liability}
     */
    public function show(Liability $liability): JsonResponse
    {
        $this->authorizeOwner($liability);

        return response()->json(new LiabilityResource($liability));
    }

    /**
     * 負債更新
     * PUT/PATCH /api/liabilities/{liability}
     */
    public function update(UpdateLiabilityRequest $request, Liability $liability): JsonResponse
    {
        $this->authorizeOwner($liability);

        $liability->update($request->validated());

        return response()->json(new LiabilityResource($liability));
    }

    /**
     * 負債削除
     * DELETE /api/liabilities/{liability}
     */
    public function destroy(Liability $liability): JsonResponse
    {
        $this->authorizeOwner($liability);

        $liability->delete();

        return response()->json(null, 204);
    }

    /**
     * 所有者確認（自分のデータのみ操作可能）
     */
    private function authorizeOwner(Liability $liability): void
    {
        abort_if($liability->user_id !== auth()->id(), 403, '操作権限がありません。');
    }
}
