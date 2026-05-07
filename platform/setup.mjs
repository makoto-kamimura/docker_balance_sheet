#!/usr/bin/env node
// ─────────────────────────────────────────────────────
// クロスプラットフォーム初回セットアップ
//   `make setup` の OS 非依存版。Windows / macOS / Linux で動作。
//   前提: Node.js 18+ と Docker Desktop が起動していること。
//
// 実行:
//   node platform/setup.mjs           （リポジトリルートから）
//   node setup.mjs                    （platform/ から）
// ─────────────────────────────────────────────────────

import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const here = dirname(fileURLToPath(import.meta.url));
process.chdir(here);

const step = (n, msg) => console.log(`\n[${n}] ${msg}`);
const run = (cmd) => {
  console.log(`    $ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
};

function ensureDocker() {
  try {
    execSync('docker --version', { stdio: 'ignore' });
    execSync('docker compose version', { stdio: 'ignore' });
  } catch {
    console.error('✗ Docker / Docker Compose が見つかりません。Docker Desktop を起動してください。');
    process.exit(1);
  }
}

function ensureEnv() {
  if (!existsSync('.env')) {
    if (!existsSync('.env.example')) {
      console.error('✗ .env.example が見つかりません。platform/ ディレクトリで実行してください。');
      process.exit(1);
    }
    copyFileSync('.env.example', '.env');
    console.log('    .env を .env.example から作成しました');
  } else {
    console.log('    .env はすでに存在します');
  }
}

function setAppKey() {
  const key = 'base64:' + randomBytes(32).toString('base64');
  const env = readFileSync('.env', 'utf8');
  const next = /^APP_KEY=/m.test(env)
    ? env.replace(/^APP_KEY=.*/m, `APP_KEY=${key}`)
    : env.replace(/\s*$/, '') + `\nAPP_KEY=${key}\n`;
  writeFileSync('.env', next);
  console.log('    APP_KEY を生成して .env に書き込みました');
}

(async () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  家計バランスシート  セットアップ');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  step(1, 'Docker の確認');
  ensureDocker();

  step(2, '.env の準備');
  ensureEnv();

  step(3, 'APP_KEY の生成');
  setAppKey();

  step(4, 'Docker イメージのビルド');
  run('docker compose build');

  step(5, 'コンテナの起動');
  run('docker compose up -d');

  step(6, 'MySQL 起動待機 (8 秒)');
  await sleep(8000);

  step(7, 'マイグレーション + シーダー実行');
  run('docker compose --profile init up artisan');

  console.log('\n✅ セットアップ完了！');
  console.log('   → http://localhost');
})().catch((err) => {
  console.error('\n✗ セットアップに失敗しました:', err.message);
  process.exit(1);
});
