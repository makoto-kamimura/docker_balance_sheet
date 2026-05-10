#!/usr/bin/env bash
# ─────────────────────────────────────────────────────
# Let's Encrypt (Certbot) で SSL 証明書を取得し、Nginx に組み込むセットアップ
#
# 前提:
# - 本番サーバ (Linux) で Docker Compose が稼働中
# - ドメインの A レコードが当該サーバに向いている
# - 80/443 ポートが外部から疎通可能
# - Certbot がホスト側にインストール済み (apt install certbot など)
#
# 使い方:
#   sudo ./platform/scripts/install-ssl.sh example.com admin@example.com
# ─────────────────────────────────────────────────────
set -euo pipefail

if [[ $# -lt 2 ]]; then
    echo "使用法: $0 <ドメイン> <連絡用メール>" >&2
    echo "例:    $0 balance.example.com admin@example.com" >&2
    exit 1
fi

DOMAIN="$1"
EMAIL="$2"

# 1. Nginx を一時停止して webroot 認証用に 80 を開放
docker compose stop nginx

# 2. Certbot 取得 (standalone モード)
certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --domain "$DOMAIN"

# 3. Nginx 設定の HTTPS ブロックを有効化（要: default.conf に server { listen 443 ssl; ... } を追記）
echo ""
echo "✅ 証明書取得完了: /etc/letsencrypt/live/${DOMAIN}/"
echo ""
echo "次に platform/default.conf に以下を追加してください:"
cat <<EOF

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # ... 既存の location 群を流用 ...
}

# HTTP → HTTPS リダイレクト
server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://\$host\$request_uri;
}
EOF

echo ""
echo "そして docker-compose.yml の nginx サービスに以下のボリュームを追加:"
cat <<'EOF'
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
EOF

echo ""
echo "最後に Nginx を再起動:"
echo "  docker compose up -d nginx"

echo ""
echo "自動更新用 cron 設定 (既に Certbot が systemd timer で持つことが多い):"
echo "  0 3 * * 0  certbot renew --quiet --post-hook 'docker compose restart nginx'"
