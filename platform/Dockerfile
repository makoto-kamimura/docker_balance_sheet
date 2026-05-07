# ─────────────────────────────────────────────────────
# Build context: プロジェクトルート（platform/docker-compose.yml で context: ..）
# 現リポジトリは Laravel プロジェクト本体を含まないため、
# Composer Stage で Laravel スケルトンを生成し、
# app/backend/（Laravel PSR-4 構成）をオーバーレイする。
# ─────────────────────────────────────────────────────

# ─────────────────────────────────────────────────────
# Stage 1: Laravel スケルトン生成 + app/backend/ オーバーレイ
# ─────────────────────────────────────────────────────
FROM composer:2.7 AS vendor

WORKDIR /app

# Laravel 10 スケルトン作成 + Sanctum 追加
RUN composer create-project --prefer-dist laravel/laravel . "10.*" \
        --no-interaction --no-scripts \
    && composer require laravel/sanctum --no-scripts --no-interaction \
    && composer install --no-dev --no-interaction --no-scripts \
        --prefer-dist --optimize-autoloader

# app/backend/ は Laravel と同じ階層構造（app/, database/, routes/）でソースを保持
# COPY だけで PSR-4 オートロードに乗る
COPY app/backend/app                 /app/app
COPY app/backend/database/migrations /app/database/migrations
COPY app/backend/database/seeders    /app/database/seeders
COPY app/backend/routes/api.php      /app/routes/api.php

# ─────────────────────────────────────────────────────
# Stage 2: PHP-FPM 本体
# ─────────────────────────────────────────────────────
FROM php:8.3-fpm-alpine AS app

LABEL maintainer="balance-sheet-app"

RUN apk add --no-cache \
    bash \
    git \
    curl \
    libpng-dev \
    libjpeg-turbo-dev \
    libwebp-dev \
    freetype-dev \
    libzip-dev \
    oniguruma-dev \
    icu-dev \
    && docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
        --with-webp \
    && docker-php-ext-install \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        zip \
        intl \
        opcache

WORKDIR /var/www/html

COPY --from=vendor /app /var/www/html

RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 storage bootstrap/cache

COPY --chmod=644 platform/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

USER www-data

EXPOSE 9000

CMD ["php-fpm"]
