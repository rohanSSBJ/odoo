param(
  [string]$PublicIp = "3.110.169.152",
  [int]$TimeoutSec = 900
)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Split-Path -Parent $root

# Build fresh source tarball (no node_modules/dist/lock/env)
Push-Location "$repo\server"
tar --exclude=node_modules --exclude=dist --exclude=coverage --exclude=.env --exclude=package-lock.json -czf "$repo\server-src.tar.gz" .
Pop-Location

$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("$repo\server-src.tar.gz"))

$remote = @"
set -e
export PATH=/usr/local/bin:`$PATH
mkdir -p /opt/transitops
cat > /tmp/app.b64 <<'B64EOF'
$b64
B64EOF
base64 -d /tmp/app.b64 > /tmp/app.tar.gz && rm -f /tmp/app.b64
rm -rf /opt/transitops/src
tar xzf /tmp/app.tar.gz -C /opt/transitops
echo '--- contents ---'; ls /opt/transitops
if [ ! -f /opt/transitops/.env ]; then
  JWT=`$(openssl rand -hex 32 2>/dev/null || head -c32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9')
  cat > /opt/transitops/.env <<ENVEOF
DATABASE_URL="postgresql://transitops:transitops_local_pw@localhost:5432/transitops?schema=public"
JWT_SECRET="`$JWT"
JWT_EXPIRES_IN="12h"
PORT=3000
CORS_ORIGIN="http://$PublicIp"
ENVEOF
  chmod 600 /opt/transitops/.env
  echo '.env created (chmod 600)'
else
  echo '.env already present, keeping'
fi
ls -l /opt/transitops/.env
cd /opt/transitops
echo '--- npm install ---'
npm install --no-audit --no-fund 2>&1 | tail -6
echo '--- prisma generate ---'
npx prisma generate 2>&1 | tail -4
echo '--- build ---'
npm run build 2>&1 | tail -6
echo 'BUILD_DONE'
ls dist | head
"@

$tmp = [IO.Path]::GetTempFileName() + ".sh"
[IO.File]::WriteAllText($tmp, ($remote -replace "`r",""), (New-Object Text.UTF8Encoding($false)))
& "$repo\ssm.ps1" -File $tmp -TimeoutSec $TimeoutSec
Remove-Item $tmp -ErrorAction SilentlyContinue
