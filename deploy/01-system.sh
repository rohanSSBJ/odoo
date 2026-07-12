#!/usr/bin/env bash
set -e

# --- swap (guard against OOM on 912MB box) ---
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
free -m | head -2

# --- nvm + node 20 (installed under /root/.nvm) ---
export NVM_DIR=/root/.nvm
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash >/dev/null 2>&1
fi
. "$NVM_DIR/nvm.sh"
nvm install 20 >/dev/null 2>&1
nvm alias default 20 >/dev/null 2>&1
NODE_BIN="$(nvm which 20)"
NODE_DIR="$(dirname "$NODE_BIN")"
ln -sf "$NODE_DIR/node" /usr/local/bin/node
ln -sf "$NODE_DIR/npm" /usr/local/bin/npm
ln -sf "$NODE_DIR/npx" /usr/local/bin/npx
/usr/local/bin/npm install -g pm2 >/dev/null 2>&1
ln -sf "$NODE_DIR/pm2" /usr/local/bin/pm2 2>/dev/null || true
echo "node: $(/usr/local/bin/node --version)"
echo "npm: $(/usr/local/bin/npm --version)"
echo "pm2: $(/usr/local/bin/pm2 --version 2>/dev/null || echo missing)"
