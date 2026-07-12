#!/usr/bin/env bash
set -e
export PATH=/usr/local/bin:$PATH

echo "===== write /etc/nginx/nginx.conf ====="
cat > /etc/nginx/nginx.conf <<'NGINX'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log notice;
pid /run/nginx.pid;

events { worker_connections 1024; }

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    sendfile      on;
    keepalive_timeout 65;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    server {
        listen       80 default_server;
        listen       [::]:80 default_server;
        server_name  _;
        root         /usr/share/nginx/html;
        index        index.html;

        # NestJS API (global prefix /api) -> keep the URI intact
        location /api/ {
            proxy_pass http://127.0.0.1:3000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # SPA client-side routing fallback
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
NGINX

nginx -t
systemctl reload nginx
sleep 1

# cosmetic: clear the crash-loop restart counter
pm2 reset transitops-api >/dev/null 2>&1 || true

echo "===== health via nginx (:80) ====="
curl -s http://localhost/api/health; echo ""

echo "===== login (manager) via nginx ====="
LOGIN=$(curl -s -X POST http://localhost/api/auth/login -H 'Content-Type: application/json' -d '{"email":"manager@transitops.io","password":"Passw0rd!"}')
echo "$LOGIN" | head -c 400; echo ""

TOKEN=$(echo "$LOGIN" | sed -E 's/.*"accessToken":"([^"]+)".*/\1/')
echo "===== /api/auth/me with token ====="
curl -s http://localhost/api/auth/me -H "Authorization: Bearer $TOKEN"; echo ""

echo "===== authorized GET /api/vehicles ====="
curl -s "http://localhost/api/vehicles?limit=3" -H "Authorization: Bearer $TOKEN" | head -c 400; echo ""

echo "===== 401 check (no token) ====="
curl -s -o /dev/null -w "vehicles no-token http=%{http_code}\n" http://localhost/api/vehicles
