<?php

namespace Database\Seeders;

use App\Models\CashflowItem;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * 添付ライフプラン CSV を元にしたサンプルテンプレート（約50項目 × 13カテゴリ）。
 * - amounts は円単位（CSV の per-age 列は万円単位だったので 10,000 倍して取り込み）
 * - test@example.com ユーザーに紐付け（存在しなければ作成）
 * - name で firstOrCreate するため再実行しても重複しない
 *
 * 実行: docker compose exec php php artisan db:seed --class=Database\\Seeders\\CashflowItemSeeder
 */
class CashflowItemSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'test@example.com'],
            ['name' => 'テストユーザー', 'password' => bcrypt('password')],
        );

        // [name, direction, frequency, category, monthly_amount(円), start_age, end_age, note, vendor, url]
        $templates = [
            // ─── 収入 ────────────────────────────────────
            ['給与（本人）',        'income', 'fixed',    'salary',     275000, 23, 65, '基本給（賞与別）'],
            ['給与（配偶者）',      'income', 'fixed',    'salary',     130000, 33, 65, '基本給（賞与別）'],
            ['事業所得',            'income', 'variable', 'business',        0, null, null, '副業・受託案件'],
            ['不動産所得',          'income', 'fixed',    'real_estate',     0, null, null, '将来の不動産収入想定'],
            ['株式配当',            'income', 'fixed',    'dividend',      625, 23, null, '保有銘柄の年間配当'],
            ['生命保険配当金',      'income', 'fixed',    'insurance',    1000, 23, null, '住民生命 分損金'],
            ['年金',                'income', 'fixed',    'pension',    117723, 65, null, '老齢厚生年金'],

            // ─── 住居費 ──────────────────────────────────
            ['家賃',                'expense', 'fixed', 'housing',     50000, 23, 34, '賃貸（持ち家移行まで）'],
            ['駐車場',              'expense', 'fixed', 'housing',     12000, 23, 26, '月極駐車場'],
            ['管理費',              'expense', 'fixed', 'housing',      6000, 23, 26, 'マンション管理費'],

            // ─── 光熱・通信 ──────────────────────────────
            ['電気',                'expense', 'fixed', 'utilities',   22000, 23, null, ''],
            ['ガス',                'expense', 'fixed', 'utilities',    7000, 23, null, ''],
            ['水道',                'expense', 'fixed', 'utilities',    3000, 23, null, ''],
            ['インターネット',      'expense', 'fixed', 'utilities',    6000, 23, null, '光回線'],
            ['スマートフォン',      'expense', 'fixed', 'utilities',    2500, 23, null, 'JAL / iijmio'],
            ['StarLink',            'expense', 'fixed', 'utilities',    6000, null, null, '将来導入想定'],

            // ─── 食費 ────────────────────────────────────
            ['食費（自炊）',        'expense', 'variable', 'food', 20000, 23, null, '夕食・週末'],
            ['食費（ランチ）',      'expense', 'variable', 'food',  8400, 23, null, '700円 × 12営業日'],
            ['飲料',                'expense', 'variable', 'food',  5000, 23, null, '麦芽コーヒー等'],
            ['外食（飲み会）',      'expense', 'variable', 'food',  6000, 23, null, '月2回程度'],
            ['軽食（怠惰）',        'expense', 'variable', 'food',  2800, 23, null, ''],

            // ─── 健康・医療 ──────────────────────────────
            ['健康食（プロテイン）',  'expense', 'variable', 'health',  4000, 23, null, ''],
            ['ジム',                  'expense', 'fixed',    'health',  9350, 23, null, ''],
            ['銭湯',                  'expense', 'fixed',    'health', 15000, 23, null, ''],
            ['薬',                    'expense', 'variable', 'health',  2500, 23, null, '常備薬'],
            ['歯科治療',              'expense', 'variable', 'health',  2500, 23, null, '半年に1回'],
            ['医療保険',              'expense', 'fixed',    'insurance', 3000, 23, null, ''],

            // ─── 交通 ────────────────────────────────────
            ['ガソリン',            'expense', 'variable', 'transport',  3000, 23, null, ''],
            ['高速道路',            'expense', 'variable', 'transport',  5000, 23, null, ''],
            ['自動車保険（四輪）',  'expense', 'fixed',    'transport',  2231, 33, null, ''],
            ['自動車保険（二輪）',  'expense', 'fixed',    'transport',  2200, 23, null, ''],
            ['車検費（四輪）',      'expense', 'fixed',    'transport',  5000, 33, null, '隔年'],
            ['車検費（二輪）',      'expense', 'fixed',    'transport',  2263, 23, null, '隔年'],
            ['交通（旅行・帰省）',  'expense', 'variable', 'transport', 20000, 23, null, ''],
            ['交通（遊び）',        'expense', 'variable', 'transport',  5000, 23, null, ''],
            ['レンタカー / カーシェア', 'expense', 'variable', 'transport', 10000, null, null, ''],

            // ─── サブスク ────────────────────────────────
            ['Netflix',             'expense', 'fixed', 'subscription',  790, 23, null, ''],
            ['Amazon Prime',        'expense', 'fixed', 'subscription',  492, 23, null, ''],
            ['Amazon Music',        'expense', 'fixed', 'subscription',  817, 23, null, ''],
            ['YouTube Premium',     'expense', 'fixed', 'subscription', 1067, 23, null, ''],
            ['Oura Ring',           'expense', 'fixed', 'subscription', 1000, 33, null, '月額会費'],
            ['ドメイン',            'expense', 'fixed', 'subscription',  100, 23, null, ''],
            ['クラウドサーバ',      'expense', 'fixed', 'subscription', 1417, 23, null, ''],

            // ─── 日用・雑費 ──────────────────────────────
            ['日用品',              'expense', 'variable', 'misc', 10000, 23, null, ''],
            ['雑費',                'expense', 'variable', 'misc',  3000, 23, null, ''],
            ['美容（髪・服装）',    'expense', 'variable', 'misc',  3000, 23, null, ''],
            ['家具・家電',          'expense', 'variable', 'misc',  7500, 23, null, '更新費'],

            // ─── 貯蓄 ────────────────────────────────────
            ['貯金（現金）',        'expense', 'variable', 'savings', 50000, 33, null, ''],
            ['貯金（預金）',        'expense', 'variable', 'savings', 30000, 33, null, ''],

            // ─── 税・社会保険 ────────────────────────────
            ['所得税',              'expense', 'fixed', 'tax',    5680, 33, 65, ''],
            ['住民税',              'expense', 'fixed', 'tax',    5200, 33, 65, ''],
            ['健康保険',            'expense', 'fixed', 'tax',   14406, 33, 65, ''],
            ['厚生年金',            'expense', 'fixed', 'tax',   25620, 33, 65, ''],
            ['雇用保険',            'expense', 'fixed', 'tax',    1705, 33, 65, ''],
            ['自動車税（四輪）',    'expense', 'fixed', 'tax',    2541, 33, null, ''],
            ['自動車税（二輪）',    'expense', 'fixed', 'tax',     500, 23, null, ''],

            // ─── ローン ──────────────────────────────────
            ['住宅ローン',          'expense', 'fixed', 'loan', 108769, 35, 70, '元利均等返済（35年）'],
            ['自動車ローン（車）',  'expense', 'fixed', 'loan',  55555, 33, 36, '36回払い'],
            ['トラックキャンパー',  'expense', 'fixed', 'loan',  25000, 39, 49, '120回払い'],
            ['奨学金',              'expense', 'fixed', 'loan',  50000, 23, 26, '日本学生支援機構'],
        ];

        // 主要なサブスク項目には購入先 / 解約 URL を付与
        $subscriptionExtras = [
            'Netflix'         => ['Netflix Inc.',     'https://www.netflix.com/youraccount'],
            'Amazon Prime'    => ['Amazon.com Inc.',  'https://www.amazon.co.jp/gp/primecentral'],
            'Amazon Music'    => ['Amazon.com Inc.',  'https://www.amazon.co.jp/gp/dmusic/mp3/player'],
            'YouTube Premium' => ['Google LLC',       'https://www.youtube.com/paid_memberships'],
            'Oura Ring'       => ['Oura Health Oy',   'https://cloud.ouraring.com/account'],
            'ドメイン'        => ['お名前.com',       'https://navi.onamae.com/top'],
            'クラウドサーバ'  => ['さくらのVPS',      'https://secure.sakura.ad.jp/menu/'],
            'スマートフォン'  => ['IIJmio',           'https://www.iijmio.jp/'],
            'インターネット'  => ['NTT東日本',        'https://flets.com/'],
        ];

        foreach ($templates as $position => $t) {
            [$name, $direction, $frequency, $category, $monthly, $startAge, $endAge, $note] = $t;
            [$vendor, $url] = $subscriptionExtras[$name] ?? [null, null];

            CashflowItem::firstOrCreate(
                ['user_id' => $user->id, 'name' => $name],
                [
                    'direction'      => $direction,
                    'frequency'      => $frequency,
                    'category'       => $category,
                    'vendor'         => $vendor,
                    'monthly_amount' => $monthly,
                    'annual_amount'  => round($monthly * 12, 2),
                    'start_age'      => $startAge,
                    'end_age'        => $endAge,
                    'note'           => $note !== '' ? $note : null,
                    'url'            => $url,
                    'sort_order'     => $position,
                ],
            );
        }

        $this->command->info(sprintf(
            '✅ %d 件のキャッシュフロー項目テンプレートを %s に投入しました。',
            count($templates),
            $user->email,
        ));
    }
}
