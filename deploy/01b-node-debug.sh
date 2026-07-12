#!/usr/bin/env bash
echo "curl: $(command -v curl || echo MISSING)"
echo "which bash: $(command -v bash)"
export NVM_DIR=/root/.nvm
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  echo "installing nvm..."
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh -o /tmp/nvm-install.sh
  echo "curl exit: $?"
  bash /tmp/nvm-install.sh 2>&1 | tail -5
fi
echo "nvm.sh present: $([ -s "$NVM_DIR/nvm.sh" ] && echo yes || echo no)"
. "$NVM_DIR/nvm.sh"
echo "nvm loaded: $(command -v nvm || echo MISSING)"
nvm install 20 2>&1 | tail -8
echo "install exit: $?"
