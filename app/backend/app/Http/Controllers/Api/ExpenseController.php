<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Expense\StoreExpenseRequest;
use App\Http\Requests\Expense\UpdateExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ExpenseController extends Controller
{
    /**
     * GET /api/expenses?from=YYYY-MM-DD&to=YYYY-MM-DD&category=xxx
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $data = $request->validate([
            'from'     => ['nullable', 'date'],
            'to'       => ['nullable', 'date', 'after_or_equal:from'],
            'category' => ['nullable', 'string', 'max:60'],
        ]);

        $query = auth()->user()->expenses()
            ->orderByDesc('occurred_at')
            ->orderByDesc('id');

        if (!empty($data['from']))     $query->where('occurred_at', '>=', $data['from']);
        if (!empty($data['to']))       $query->where('occurred_at', '<=', $data['to']);
        if (!empty($data['category'])) $query->where('category', $data['category']);

        return ExpenseResource::collection($query->get());
    }

    /**
     * POST /api/expenses
     */
    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $expense = auth()->user()->expenses()->create($request->validated());

        return response()->json(new ExpenseResource($expense), 201);
    }

    /**
     * GET /api/expenses/{expense}
     */
    public function show(Expense $expense): JsonResponse
    {
        $this->authorizeOwner($expense);

        return response()->json(new ExpenseResource($expense));
    }

    /**
     * PUT/PATCH /api/expenses/{expense}
     */
    public function update(UpdateExpenseRequest $request, Expense $expense): JsonResponse
    {
        $this->authorizeOwner($expense);

        $expense->update($request->validated());

        return response()->json(new ExpenseResource($expense));
    }

    /**
     * DELETE /api/expenses/{expense}
     */
    public function destroy(Expense $expense): JsonResponse
    {
        $this->authorizeOwner($expense);

        $expense->delete();

        return response()->json(null, 204);
    }

    private function authorizeOwner(Expense $expense): void
    {
        abort_if($expense->user_id !== auth()->id(), 403, '操作権限がありません。');
    }
}
