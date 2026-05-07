<?php

namespace App\Http\Requests\Asset;

use App\Models\Asset;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:100'],
            'category' => ['required', 'string', Rule::in(Asset::CATEGORIES)],
            'amount'   => ['required', 'numeric', 'min:0', 'max:9999999999999.99'],
            'note'     => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'     => '資産名を入力してください。',
            'category.in'       => 'カテゴリの値が不正です。',
            'amount.required'   => '金額を入力してください。',
            'amount.numeric'    => '金額は数値で入力してください。',
            'amount.min'        => '金額は0以上で入力してください。',
        ];
    }
}
