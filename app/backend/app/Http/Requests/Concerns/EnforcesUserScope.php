<?php

namespace App\Http\Requests\Concerns;

use Closure;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;

/**
 * 認証ユーザー単位の重複チェックと登録上限チェックを FormRequest 共通化する Trait。
 */
trait EnforcesUserScope
{
    /**
     * 同ユーザー × 同カテゴリ内で name の重複を禁止する Rule。
     * Update 時は $ignoreId を渡して当該レコードを除外する。
     */
    protected function uniqueNameWithinCategory(
        string $table,
        ?string $categoryColumn = 'category',
        ?int $ignoreId = null,
    ): Unique {
        $userId   = $this->user()->id;
        $category = $categoryColumn !== null ? $this->input($categoryColumn) : null;

        $rule = Rule::unique($table, 'name')
            ->where(fn (Builder $q) => $q
                ->where('user_id', $userId)
                ->when(
                    $categoryColumn !== null && $category !== null,
                    fn (Builder $q2) => $q2->where($categoryColumn, $category),
                ));

        if ($ignoreId !== null) {
            $rule = $rule->ignore($ignoreId);
        }
        return $rule;
    }

    /**
     * 同ユーザーの登録件数が $max を超えないかチェックするクロージャルール。
     * Store 時に呼ぶ（Update では新規追加にならないので不要）。
     */
    protected function userCountLimit(string $table, int $max): Closure
    {
        return function (string $attribute, $value, Closure $fail) use ($table, $max) {
            $count = DB::table($table)->where('user_id', $this->user()->id)->count();
            if ($count >= $max) {
                $fail("登録可能な件数の上限（{$max}件）に達しています。");
            }
        };
    }
}
