#!/usr/bin/env bash
set -e
export PATH=/usr/local/bin:$PATH
cd /opt/transitops

# Load env into shell so pm2 --update-env captures secrets before Nest bootstraps
set -a
. ./.env
set +a

echo "===== migrate ====="
# transitops role needs CREATEDB for prisma migrate dev's shadow database
sudo -u postgres psql -c "ALTER ROLE transitops CREATEDB;" 2>/dev/null || true
if [ -d prisma/migrations ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  npx prisma migrate deploy 2>&1 | tail -10
else
  npx prisma migrate dev --name init --skip-seed 2>&1 | tail -15 \
    || { echo "migrate dev failed -> db push"; npx prisma db push --accept-data-loss 2>&1 | tail -10; }
fi

echo "===== seed ====="
npm run seed 2>&1 | tail -12

echo "===== pm2 ====="
MAIN=dist/main.js
[ -f "$MAIN" ] || MAIN=dist/src/main.js
echo "main entry: $MAIN"
pm2 delete transitops-api 2>/dev/null || true
pm2 start "$MAIN" --name transitops-api --cwd /opt/transitops --update-env
pm2 save 2>&1 | tail -2
env PATH=$PATH:/usr/local/bin pm2 startup systemd -u root --hp /root 2>&1 | tail -1 || true

sleep 3
echo "===== health (localhost:3000) ====="
curl -s http://localhost:3000/api/health || echo "HEALTH_FAIL"
echo ""
pm2 list
