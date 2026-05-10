<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    /**
     * POST /api/auth/password/forgot
     *
     * メールアドレスに対してリセットリンクを送信。
     * 列挙攻撃対策: ユーザーの存在有無に関わらず常に 200 を返す。
     */
    public function forgot(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        // Laravel の Password Broker はメール送信失敗・ユーザー未存在でも例外を投げず
        // ステータス文字列を返す。レスポンスは常に同じにして列挙されないようにする。
        Password::broker()->sendResetLink($request->only('email'));

        return response()->json([
            'message' => '入力されたメールアドレス宛にリセット手順を送信しました（登録済みの場合）。',
        ]);
    }

    /**
     * POST /api/auth/password/reset
     *
     * 受信したトークン + 新パスワードで実際に更新する。
     */
    public function reset(Request $request): JsonResponse
    {
        $request->validate([
            'token'                 => ['required', 'string'],
            'email'                 => ['required', 'email'],
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $status = Password::broker()->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, string $password) {
                $user->forceFill([
                    'password'       => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                // 既存トークンを失効（セキュリティ対策）
                $user->tokens()->delete();
            },
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'パスワードを更新しました。']);
        }

        return response()->json([
            'message' => 'リセットに失敗しました。リンクが期限切れまたは無効です。',
        ], 422);
    }
}
