<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\HandlesReorder;
use App\Http\Controllers\Controller;
use App\Http\Requests\Cashflow\StoreCashflowItemRequest;
use App\Http\Requests\Cashflow\UpdateCashflowItemRequest;
use App\Http\Resources\CashflowItemResource;
use App\Models\CashflowItem;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CashflowItemController extends Controller
{
    use HandlesReorder;

    /**
     * GET /api/cashflow-items（sort_order → direction → category → name の優先順）
     */
    public function index(): AnonymousResourceCollection
    {
        $items = auth()->user()
            ->cashflowItems()
            ->orderBy('sort_order')
            ->orderBy('direction')
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        return CashflowItemResource::collection($items);
    }

    protected function reorderRelation(): HasMany
    {
        return auth()->user()->cashflowItems();
    }

    /**
     * POST /api/cashflow-items
     */
    public function store(StoreCashflowItemRequest $request): JsonResponse
    {
        $data = $this->normalizeAmounts($request->validated());
        $data['sort_order'] = (int) (auth()->user()->cashflowItems()->max('sort_order') ?? -1) + 1;

        $item = auth()->user()->cashflowItems()->create($data);

        return response()->json(new CashflowItemResource($item), 201);
    }

    /**
     * GET /api/cashflow-items/{cashflow_item}
     */
    public function show(CashflowItem $cashflowItem): JsonResponse
    {
        $this->authorizeOwner($cashflowItem);

        return response()->json(new CashflowItemResource($cashflowItem));
    }

    /**
     * PUT/PATCH /api/cashflow-items/{cashflow_item}
     */
    public function update(UpdateCashflowItemRequest $request, CashflowItem $cashflowItem): JsonResponse
    {
        $this->authorizeOwner($cashflowItem);

        $data = $this->normalizeAmounts(
            $request->validated(),
            $cashflowItem->monthly_amount,
            $cashflowItem->annual_amount,
        );

        $cashflowItem->update($data);

        return response()->json(new CashflowItemResource($cashflowItem));
    }

    /**
     * DELETE /api/cashflow-items/{cashflow_item}
     */
    public function destroy(CashflowItem $cashflowItem): JsonResponse
    {
        $this->authorizeOwner($cashflowItem);

        $cashflowItem->delete();

        return response()->json(null, 204);
    }

    private function authorizeOwner(CashflowItem $item): void
    {
        abort_if($item->user_id !== auth()->id(), 403, '操作権限がありません。');
    }

    /**
     * monthly_amount / annual_amount のいずれかしか入っていない場合に補完する。
     */
    private function normalizeAmounts(array $data, $existingMonthly = null, $existingAnnual = null): array
    {
        $monthly = $data['monthly_amount'] ?? $existingMonthly;
        $annual  = $data['annual_amount']  ?? $existingAnnual;

        if (($monthly === null || (float) $monthly === 0.0) && $annual !== null) {
            $data['monthly_amount'] = round((float) $annual / 12, 2);
        } elseif (($annual === null || (float) $annual === 0.0) && $monthly !== null) {
            $data['annual_amount'] = round((float) $monthly * 12, 2);
        }

        return $data;
    }
}
