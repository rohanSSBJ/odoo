#!/usr/bin/env bash
echo "=== _prisma_migrations ==="
sudo -u postgres psql -d transitops -tAc "SELECT migration_name || ' -> ' || CASE WHEN finished_at IS NULL THEN 'PENDING' ELSE 'applied' END FROM _prisma_migrations ORDER BY started_at;"
echo "=== table count ==="
sudo -u postgres psql -d transitops -tAc "SELECT count(*) FROM pg_tables WHERE schemaname='public';"
