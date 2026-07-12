#!/usr/bin/env bash
set -e
export PATH=/usr/local/bin:$PATH
cd /opt/transitops

echo "===== set pg_hba host auth to scram-sha-256 ====="
HBA=/var/lib/pgsql/data/pg_hba.conf
sudo sed -i -E 's/^(host\s+all\s+all\s+(127\.0\.0\.1\/32|::1\/128)\s+)ident/\1scram-sha-256/' "$HBA"
sudo grep -E '^host\s+all' "$HBA"
sudo systemctl reload postgresql
sleep 2

echo "===== raw connect test ====="
PGPASSWORD=transitops_local_pw psql -h localhost -U transitops -d transitops -c "SELECT current_user;" 2>&1

set -a; . ./.env; set +a

echo "===== prisma db push ====="
npx prisma db push --skip-generate

echo "===== seed ====="
npm run seed

echo "===== counts ====="
sudo -u postgres psql -d transitops -tAc "SELECT 'users='||count(*) FROM users;"
sudo -u postgres psql -d transitops -tAc "SELECT 'vehicles='||count(*) FROM vehicles;"
sudo -u postgres psql -d transitops -tAc "SELECT 'drivers='||count(*) FROM drivers;"

echo "===== restart api ====="
pm2 restart transitops-api --update-env
sleep 3
echo "===== health :3000 ====="
curl -s http://localhost:3000/api/health; echo ""
