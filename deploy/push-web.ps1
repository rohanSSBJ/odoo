param(
  [int]$ChunkSize = 60000,
  [int]$TimeoutSec = 180
)
$ErrorActionPreference = "Stop"
$instance = "i-0437b62f0ffd5ddb0"
$repo = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

# Build fresh dist tarball
Push-Location "$repo\dist"
tar -czf "$repo\web-dist.tar.gz" .
Pop-Location
$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("$repo\web-dist.tar.gz"))

function Invoke-Remote([string]$Script) {
  $script2 = $Script -replace "`r", ""
  $bytes = [Text.Encoding]::UTF8.GetBytes($script2)
  $wrapped = "echo " + [Convert]::ToBase64String($bytes) + " | base64 -d | bash"
  $params = @{ commands = @($wrapped) } | ConvertTo-Json -Compress
  $tmp = [IO.Path]::GetTempFileName()
  [IO.File]::WriteAllText($tmp, $params, (New-Object Text.UTF8Encoding($false)))
  $cmdId = aws ssm send-command --instance-ids $instance --document-name "AWS-RunShellScript" --parameters "file://$tmp" --query "Command.CommandId" --output text
  Remove-Item $tmp -ErrorAction SilentlyContinue
  if (-not $cmdId) { throw "send-command failed" }
  $elapsed = 0
  do {
    Start-Sleep -Seconds 3; $elapsed += 3
    $status = aws ssm get-command-invocation --command-id $cmdId --instance-id $instance --query "Status" --output text 2>$null
  } while ($status -notin @("Success","Failed","Cancelled","TimedOut") -and $elapsed -lt $TimeoutSec)
  $out = aws ssm get-command-invocation --command-id $cmdId --instance-id $instance --query "StandardOutputContent" --output text
  $err = aws ssm get-command-invocation --command-id $cmdId --instance-id $instance --query "StandardErrorContent" --output text
  return "STATUS=$status`n$out`n$err"
}

# 1. Upload base64 in chunks
$total = [Math]::Ceiling($b64.Length / $ChunkSize)
Write-Output "Uploading $($b64.Length) b64 chars in $total chunk(s)..."
for ($i = 0; $i -lt $total; $i++) {
  $chunk = $b64.Substring($i * $ChunkSize, [Math]::Min($ChunkSize, $b64.Length - $i * $ChunkSize))
  $redir = if ($i -eq 0) { ">" } else { ">>" }
  $r = Invoke-Remote "printf '%s' '$chunk' $redir /tmp/web.b64"
  if ($r -notmatch "STATUS=Success") { Write-Output "chunk $i FAILED:`n$r"; exit 1 }
  Write-Output "  chunk $($i+1)/$total ok"
}

# 2. Decode + extract into nginx html root
$deploy = @'
set -e
base64 -d /tmp/web.b64 > /tmp/web.tar.gz
rm -f /tmp/web.b64
b64sz=$(wc -c < /tmp/web.tar.gz)
echo "tar bytes on box: $b64sz"
mkdir -p /usr/share/nginx/html
rm -rf /usr/share/nginx/html/*
tar xzf /tmp/web.tar.gz -C /usr/share/nginx/html
echo "--- deployed files ---"
ls -la /usr/share/nginx/html
nginx -t 2>&1 | tail -1
systemctl reload nginx
echo "DEPLOY_OK"
'@
Write-Output "Extracting + reloading nginx..."
$r = Invoke-Remote $deploy
Write-Output $r
