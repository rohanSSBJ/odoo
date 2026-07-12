#!/usr/bin/env bash
sudo -u postgres psql -d transitops -c "DELETE FROM trips WHERE source='A' AND destination='B';"
echo "remaining trips:"
sudo -u postgres psql -d transitops -tAc "SELECT source||' -> '||destination||' ['||status||']' FROM trips ORDER BY created_at;"
