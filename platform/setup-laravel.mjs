#!/usr/bin/env node
// ─────────────────────────────────────────────────────
// 外部 Laravel プロジェクトへ app/backend/ ソースを配置するスクリプト（OS非依存）
// 実行: node setup-laravel.mjs <path-to-laravel-project>
// ─────────────────────────────────────────────────────

import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const backendSrc = resolve(repoRoot, 'app/backend');

const target = process.argv[2];
if (!target) {
  console.error('使用法: node setup-laravel.mjs <path-to-laravel-project>');
  console.error('例:    node setup-laravel.mjs ../../laravel-balance-sheet');
  process.exit(1);
}

const laravelDir = resolve(target);
if (!existsSync(laravelDir)) {
  console.error(`✗ ${laravelDir} は存在しません`);
  process.exit(1);
}

console.log(`Laravel ファイル配置を開始`);
console.log(`  ソース: ${backendSrc}`);
console.log(`  先:    ${laravelDir}\n`);

// app/ をコピー（再帰的にマージ）
console.log('  app/ をコピー');
cpSync(resolve(backendSrc, 'app'), resolve(laravelDir, 'app'), { recursive: true, force: true });

// database/migrations/ をコピー
console.log('  database/migrations/ をコピー');
mkdirSync(resolve(laravelDir, 'database/migrations'), { recursive: true });
cpSync(
  resolve(backendSrc, 'database/migrations'),
  resolve(laravelDir, 'database/migrations'),
  { recursive: true, force: true },
);

// database/seeders/ をコピー
if (existsSync(resolve(backendSrc, 'database/seeders'))) {
  console.log('  database/seeders/ をコピー');
  mkdirSync(resolve(laravelDir, 'database/seeders'), { recursive: true });
  cpSync(
    resolve(backendSrc, 'database/seeders'),
    resolve(laravelDir, 'database/seeders'),
    { recursive: true, force: true },
  );
}

// database/factories/ をコピー（テスト用）
if (existsSync(resolve(backendSrc, 'database/factories'))) {
  console.log('  database/factories/ をコピー');
  mkdirSync(resolve(laravelDir, 'database/factories'), { recursive: true });
  cpSync(
    resolve(backendSrc, 'database/factories'),
    resolve(laravelDir, 'database/factories'),
    { recursive: true, force: true },
  );
}

// tests/ をコピー（PHPUnit）
if (existsSync(resolve(backendSrc, 'tests'))) {
  console.log('  tests/ をコピー');
  mkdirSync(resolve(laravelDir, 'tests'), { recursive: true });
  cpSync(
    resolve(backendSrc, 'tests'),
    resolve(laravelDir, 'tests'),
    { recursive: true, force: true },
  );
}

// resources/views/ をコピー（PDF Blade テンプレート用）
if (existsSync(resolve(backendSrc, 'resources/views'))) {
  console.log('  resources/views/ をコピー');
  mkdirSync(resolve(laravelDir, 'resources/views'), { recursive: true });
  cpSync(
    resolve(backendSrc, 'resources/views'),
    resolve(laravelDir, 'resources/views'),
    { recursive: true, force: true },
  );
}

// routes/api.php
console.log('  routes/api.php をコピー');
mkdirSync(resolve(laravelDir, 'routes'), { recursive: true });
cpSync(
  resolve(backendSrc, 'routes/api.php'),
  resolve(laravelDir, 'routes/api.php'),
  { force: true },
);

console.log('\n✅ 配置完了');
console.log('\n次のステップ:');
console.log(`  1. cd ${laravelDir}`);
console.log('  2. composer require barryvdh/laravel-dompdf:^3.0   # PDF エクスポート用');
console.log('  3. composer install');
console.log('  4. php artisan migrate');
console.log('  5. php artisan test                                  # テスト実行');
