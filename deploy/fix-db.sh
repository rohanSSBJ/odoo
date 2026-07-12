#!/usr/bin/env bash
set -e
export PATH=/usr/local/bin:$PATH
cd /opt/transitops

echo "===== fix PG15 public schema privileges ====="
sudo -u postgres psql -d transitops -c "ALTER SCHEMA public OWNER TO transitops;"
sudo -u postgres psql -d transitops -c "GRANT ALL ON SCHEMA public TO transitops;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE transitops TO transitops;"

set -a; . ./.env; set +a

echo "===== prisma db push ====="
npx prisma db push --skip-generate
echo "push_exit=$?"

echo "===== seed ====="
npm run seed

echo "===== tables ====="
sudo -u postgres psql -d transitops -tAc "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"
echo "===== counts ====="
sudo -u postgres psql -d transitops -tAc "SELECT 'users='||count(*) FROM users; SELECT 'vehicles='||count(*) FROM vehicles; SELECT 'drivers='||count(*) FROM drivers; SELECT 'trips='||count(*) FROM trips;"

echo "===== restart api ====="
pm2 restart transitops-api --update-env
sleep 3
echo "===== health :3000 ====="
curl -s http://localhost:3000/api/health; echo ""
