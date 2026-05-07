# ─────────────────────────────────────────────────────
# Makefile — よく使うコマンドのショートカット
# ─────────────────────────────────────────────────────

.PHONY: help up down build init logs shell artisan migrate seed fresh

## ヘルプ
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

## ─── 起動・停止 ──────────────────────────────────────

up: ## コンテナ起動（開発モード）
	docker compose up -d

down: ## コンテナ停止
	docker compose down

build: ## イメージをリビルド
	docker compose build --no-cache

restart: ## 再起動
	docker compose restart

## ─── 初期セットアップ ────────────────────────────────

setup: ## 初回セットアップ（.env作成 → ビルド → 起動 → 初期化）
	@test -f .env || cp .env.example .env
	@echo "⚙️  APP_KEY を生成中..."
	@KEY=$$(docker run --rm php:8.3-cli php -r "echo 'base64:'.base64_encode(random_bytes(32));") && \
	  awk -v k="$$KEY" '/^APP_KEY=/{print "APP_KEY="k; f=1; next} {print} END{if(!f) print "APP_KEY="k}' .env > .env.tmp && \
	  mv .env.tmp .env
	docker compose build
	docker compose up -d
	@echo "⏳ MySQL 起動を待機中..."
	@sleep 8
	docker compose --profile init up artisan
	@echo "✅ セットアップ完了！ → http://localhost"

setup-node: ## OS非依存の初回セットアップ（make 不要 / Windows対応）
	node setup.mjs

init: ## マイグレーション + シーダー実行
	docker compose --profile init up artisan

## ─── ログ ────────────────────────────────────────────

logs: ## 全コンテナのログ
	docker compose logs -f

logs-php: ## PHP のログのみ
	docker compose logs -f php

logs-nginx: ## Nginx のログのみ
	docker compose logs -f nginx

## ─── シェル ──────────────────────────────────────────

shell: ## PHP コンテナに入る
	docker compose exec php sh

shell-mysql: ## MySQL コンテナに入る
	docker compose exec mysql mysql -u $${DB_USERNAME:-bs_user} -p$${DB_PASSWORD:-secret} $${DB_DATABASE:-balance_sheet}

## ─── Artisan ─────────────────────────────────────────

artisan: ## php artisan コマンド実行（例: make artisan CMD="migrate:status"）
	docker compose exec php php artisan $(CMD)

migrate: ## マイグレーション実行
	docker compose exec php php artisan migrate

migrate-fresh: ## DBをリセットして再マイグレーション（⚠️ 全データ削除）
	docker compose exec php php artisan migrate:fresh --seed

seed: ## シーダー実行
	docker compose exec php php artisan db:seed

cache-clear: ## キャッシュクリア
	docker compose exec php php artisan optimize:clear

## ─── フロントエンド ──────────────────────────────────

npm: ## npm コマンド実行（例: make npm CMD="install axios"）
	docker compose exec vite npm $(CMD)

## ─── 本番ビルド ──────────────────────────────────────

build-prod: ## 本番用イメージをビルド
	docker compose -f docker-compose.yml build

up-prod: ## 本番モードで起動（override なし）
	docker compose -f docker-compose.yml up -d
