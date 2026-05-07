<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\HandlesReorder;
use App\Http\Controllers\Controller;
use App\Http\Requests\Asset\StoreAssetRequest;
use App\Http\Requests\Asset\UpdateAssetRequest;
use App\Http\Resources\AssetResource;
use App\Models\Asset;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AssetController extends Controller
{
    use HandlesReorder;

    /**
     * 資産一覧取得（sort_order → category → name の優先順）
     * GET /api/assets
     */
    public function index(): AnonymousResourceCollection
    {
        $assets = auth()->user()
            ->assets()
            ->orderBy('sort_order')
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        return AssetResource::collection($assets);
    }

    protected function reorderRelation(): HasMany
    {
        return auth()->user()->assets();
    }

    /**
     * 資産登録（sort_order は末尾に自動採番）
     * POST /api/assets
     */
    public function store(StoreAssetRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['sort_order'] = (int) (auth()->user()->assets()->max('sort_order') ?? -1) + 1;
        $asset = auth()->user()->assets()->create($data);

        return response()->json(new AssetResource($asset), 201);
    }

    /**
     * 資産詳細取得
     * GET /api/assets/{asset}
     */
    public function show(Asset $asset): JsonResponse
    {
        $this->authorizeOwner($asset);

        return response()->json(new AssetResource($asset));
    }

    /**
     * 資産更新
     * PUT/PATCH /api/assets/{asset}
     */
    public function update(UpdateAssetRequest $request, Asset $asset): JsonResponse
    {
        $this->authorizeOwner($asset);

        $asset->update($request->validated());

        return response()->json(new AssetResource($asset));
    }

    /**
     * 資産削除
     * DELETE /api/assets/{asset}
     */
    public function destroy(Asset $asset): JsonResponse
    {
        $this->authorizeOwner($asset);

        $asset->delete();

        return response()->json(null, 204);
    }

    /**
     * 所有者確認（自分のデータのみ操作可能）
     */
    private function authorizeOwner(Asset $asset): void
    {
        abort_if($asset->user_id !== auth()->id(), 403, '操作権限がありません。');
    }
}
