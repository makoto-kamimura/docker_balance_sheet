<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * 新規ユーザー登録
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('balance-sheet-app')->plainTextToken;

        return response()->json([
            'user'  => $user->only(['id', 'name', 'email']),
            'token' => $token,
        ], 201);
    }

    /**
     * ログイン
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'メールアドレスまたはパスワードが正しくありません。',
            ], 401);
        }

        // 既存トークンを削除してから新規発行（セキュリティ対策）
        $user->tokens()->delete();
        $token = $user->createToken('balance-sheet-app')->plainTextToken;

        return response()->json([
            'user'  => $user->only(['id', 'name', 'email']),
            'token' => $token,
        ]);
    }

    /**
     * ログアウト
     */
    public function logout(): JsonResponse
    {
        auth()->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'ログアウトしました。']);
    }

    /**
     * 認証ユーザー情報取得
     */
    public function me(): JsonResponse
    {
        return response()->json(auth()->user()->only(['id', 'name', 'email']));
    }
}
