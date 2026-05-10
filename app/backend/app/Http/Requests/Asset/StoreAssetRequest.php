<?php

namespace App\Http\Requests\Asset;

use App\Http\Requests\Concerns\EnforcesUserScope;
use App\Models\Asset;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssetRequest extends FormRequest
{
    use EnforcesUserScope;

    public const MAX_PER_USER = 200;

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:100', $this->uniqueNameWithinCategory('assets')],
            'category' => ['required', 'string', Rule::in(Asset::CATEGORIES), $this->userCountLimit('assets', self::MAX_PER_USER)],
            'amount'   => ['required', 'numeric', 'min:0', 'max:9999999999999.99'],
            'note'     => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'     => '資産名を入力してください。',
            'name.unique'       => '同じカテゴリ内に同名の資産が既に存在します。',
            'category.in'       => 'カテゴリの値が不正です。',
            'amount.required'   => '金額を入力してください。',
            'amount.numeric'    => '金額は数値で入力してください。',
            'amount.min'        => '金額は0以上で入力してください。',
        ];
    }
}
