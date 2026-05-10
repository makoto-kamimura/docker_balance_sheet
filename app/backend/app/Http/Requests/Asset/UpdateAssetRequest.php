<?php

namespace App\Http\Requests\Asset;

use App\Http\Requests\Concerns\EnforcesUserScope;
use App\Models\Asset;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAssetRequest extends FormRequest
{
    use EnforcesUserScope;

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $id = $this->route('asset')?->id;

        return [
            'name'     => ['sometimes', 'required', 'string', 'max:100', $this->uniqueNameWithinCategory('assets', 'category', $id)],
            'category' => ['sometimes', 'required', 'string', Rule::in(Asset::CATEGORIES)],
            'amount'   => ['sometimes', 'required', 'numeric', 'min:0', 'max:9999999999999.99'],
            'note'     => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => '同じカテゴリ内に同名の資産が既に存在します。',
        ];
    }
}
