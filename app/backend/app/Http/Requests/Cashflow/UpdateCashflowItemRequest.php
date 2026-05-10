<?php

namespace App\Http\Requests\Cashflow;

use App\Http\Requests\Concerns\EnforcesUserScope;
use App\Models\CashflowItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCashflowItemRequest extends FormRequest
{
    use EnforcesUserScope;

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $id = $this->route('cashflow_item')?->id;

        return [
            'name'           => ['sometimes', 'required', 'string', 'max:120', $this->uniqueNameWithinCategory('cashflow_items', 'category', $id)],
            'direction'      => ['sometimes', 'required', Rule::in(CashflowItem::DIRECTIONS)],
            'frequency'      => ['sometimes', 'required', Rule::in(CashflowItem::FREQUENCIES)],
            'category'       => ['nullable', 'string', 'max:60'],
            'vendor'         => ['nullable', 'string', 'max:120'],
            'monthly_amount' => ['nullable', 'numeric', 'min:0'],
            'annual_amount'  => ['nullable', 'numeric', 'min:0'],
            'start_age'      => ['nullable', 'integer', 'min:0', 'max:120'],
            'end_age'        => ['nullable', 'integer', 'min:0', 'max:120', 'gte:start_age'],
            'note'           => ['nullable', 'string', 'max:255'],
            'url'            => ['nullable', 'url', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => '同じカテゴリ内に同名の項目が既に存在します。',
        ];
    }
}
