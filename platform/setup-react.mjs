#!/usr/bin/env node
// ─────────────────────────────────────────────────────
// 外部 React プロジェクトへ app/frontend/ ファイルを配置するスクリプト（OS非依存）
// 実行: node setup-react.mjs <path-to-react-project>
// ─────────────────────────────────────────────────────

import { cpSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const frontendSrc = resolve(repoRoot, 'app/frontend');

const target = process.argv[2];
if (!target) {
  console.error('使用法: node setup-react.mjs <path-to-react-project>');
  console.error('例:    node setup-react.mjs ../../react-balance-sheet');
  process.exit(1);
}

const reactDir = resolve(target);
if (!existsSync(reactDir)) {
  console.error(`✗ ${reactDir} は存在しません`);
  process.exit(1);
}

console.log(`React ファイル配置を開始`);
console.log(`  ソース: ${frontendSrc}`);
console.log(`  先:    ${reactDir}\n`);

const dirs = ['api', 'stores', 'types', 'utils', 'hooks', 'pages', 'components'];
for (const d of dirs) {
  const src = resolve(frontendSrc, d);
  if (existsSync(src)) {
    cpSync(src, resolve(reactDir, d), { recursive: true, force: true });
    console.log(`  ✓ ${d}/`);
  }
}

const files = [
  'App.tsx',
  'main.tsx',
  'index.html',
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  'styles.css',
];
for (const f of files) {
  const src = resolve(frontendSrc, f);
  if (existsSync(src)) {
    cpSync(src, resolve(reactDir, f), { force: true });
    console.log(`  ✓ ${f}`);
  }
}

console.log('\n✅ 配置完了');
console.log('\n次のステップ:');
console.log(`  1. cd ${reactDir}`);
console.log('  2. npm install');
console.log('  3. npm run dev');
