<?php

namespace App\Http\Requests\Expense;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'category'    => ['sometimes', 'required', 'string', 'max:60'],
            'amount'      => ['sometimes', 'required', 'numeric', 'min:0'],
            'occurred_at' => ['sometimes', 'required', 'date', 'before_or_equal:today'],
            'note'        => ['nullable', 'string', 'max:255'],
        ];
    }
}
