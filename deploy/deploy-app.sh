#!/usr/bin/env bash
set -e
export PATH=/usr/local/bin:$PATH
cd /opt/transitops

# Load env into shell so pm2 --update-env captures secrets before Nest bootstraps
set -a
. ./.env
set +a

echo "===== migrate (deploy + baseline) ====="
MIGRATION=20260712000000_init
HAS_USERS=$(sudo -u postgres psql -d transitops -tAc "SELECT to_regclass('public.users') IS NOT NULL" | tr -d '[:space:]')
HAS_MIG=$(sudo -u postgres psql -d transitops -tAc "SELECT to_regclass('public._prisma_migrations') IS NOT NULL" | tr -d '[:space:]')
if [ "$HAS_USERS" = "t" ] && [ "$HAS_MIG" != "t" ]; then
  # DB was created via `prisma db push` (schema present, no migration history) -> baseline it
  echo "baselining existing schema as $MIGRATION"
  npx prisma migrate resolve --applied "$MIGRATION"
fi
npx prisma migrate deploy

echo "===== seed ====="
npm run seed

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
