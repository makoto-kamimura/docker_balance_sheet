<?php

namespace App\Http\Requests\Liability;

use App\Models\Liability;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLiabilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name'     => ['sometimes', 'required', 'string', 'max:100'],
            'category' => ['sometimes', 'required', 'string', Rule::in(Liability::CATEGORIES)],
            'amount'   => ['sometimes', 'required', 'numeric', 'min:0', 'max:9999999999999.99'],
            'note'     => ['nullable', 'string', 'max:255'],
        ];
    }
}
