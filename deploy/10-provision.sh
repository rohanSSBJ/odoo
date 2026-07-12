#!/usr/bin/env bash
set -euo pipefail

echo "===== [1/4] swap ====="
if [ ! -f /swapfile ]; then
  dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q swapfile /etc/fstab || echo "/swapfile none swap sw 0 0" >> /etc/fstab
  echo "swap added"
else
  echo "swap already present"
fi

echo "===== [2/4] node 20 + pm2 (official binary tarball) ====="
NODE_VER=v20.18.1
NODE_PKG=node-${NODE_VER}-linux-x64
if [ ! -x /opt/${NODE_PKG}/bin/node ]; then
  curl -fsSL "https://nodejs.org/dist/${NODE_VER}/${NODE_PKG}.tar.xz" -o /tmp/node.tar.xz
  tar -xf /tmp/node.tar.xz -C /opt
  rm -f /tmp/node.tar.xz
fi
ln -sf /opt/${NODE_PKG}/bin/node /usr/local/bin/node
ln -sf /opt/${NODE_PKG}/bin/npm /usr/local/bin/npm
ln -sf /opt/${NODE_PKG}/bin/npx /usr/local/bin/npx
export PATH=/usr/local/bin:$PATH
if [ ! -x /opt/${NODE_PKG}/bin/pm2 ]; then
  /usr/local/bin/npm install -g pm2 >/dev/null 2>&1
fi
ln -sf /opt/${NODE_PKG}/bin/pm2 /usr/local/bin/pm2 2>/dev/null || true
echo "node: $(/usr/local/bin/node --version)"
echo "npm:  $(/usr/local/bin/npm --version)"
echo "pm2:  $(/usr/local/bin/pm2 --version 2>/dev/null || echo missing)"

echo "===== [3/4] PostgreSQL 15 (localhost only) ====="
if ! rpm -q postgresql15-server >/dev/null 2>&1; then
  dnf install -y postgresql15-server postgresql15 >/dev/null 2>&1
  echo "postgresql15 installed"
else
  echo "postgresql15 already installed"
fi
if [ ! -f /var/lib/pgsql/data/PG_VERSION ]; then
  /usr/bin/postgresql-setup --initdb >/dev/null 2>&1
  echo "initdb done"
else
  echo "data dir already initialized"
fi
# ensure listen on localhost only (default is localhost; make explicit)
PGCONF=/var/lib/pgsql/data/postgresql.conf
if [ -f "$PGCONF" ]; then
  grep -q "^listen_addresses" "$PGCONF" || echo "listen_addresses = 'localhost'" >> "$PGCONF"
fi
systemctl enable postgresql >/dev/null 2>&1
systemctl restart postgresql
sleep 2
echo "postgres active: $(systemctl is-active postgresql)"

echo "===== [4/4] create role + database ====="
# idempotent role + db creation
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='transitops'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE ROLE transitops LOGIN PASSWORD 'transitops_local_pw';"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='transitops'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE transitops OWNER transitops;"
# ensure schema privileges for prisma migrations
sudo -u postgres psql -d transitops -c "GRANT ALL ON SCHEMA public TO transitops;" >/dev/null 2>&1 || true
echo "db ready: $(sudo -u postgres psql -tAc "SELECT datname FROM pg_database WHERE datname='transitops'")"
echo "===== provision complete ====="
