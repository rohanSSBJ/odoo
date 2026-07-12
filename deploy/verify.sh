#!/usr/bin/env bash
export PATH=/usr/local/bin:$PATH
echo "===== pm2 list ====="
pm2 list 2>/dev/null | sed 's/[^[:print:]]//g'
echo "===== health :3000 ====="
curl -s http://localhost:3000/api/health; echo ""
echo "===== db tables ====="
sudo -u postgres psql -d transitops -tAc "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"
echo "===== user count ====="
sudo -u postgres psql -d transitops -tAc "SELECT count(*) FROM users;" 2>/dev/null || echo "no users table"
echo "===== vehicle count ====="
sudo -u postgres psql -d transitops -tAc "SELECT count(*) FROM vehicles;" 2>/dev/null || echo "no vehicles table"
