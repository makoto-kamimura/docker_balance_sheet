<?php

namespace App\Http\Requests\Cashflow;

use App\Models\CashflowItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCashflowItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name'           => ['sometimes', 'required', 'string', 'max:120'],
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
}
