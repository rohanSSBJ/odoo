param(
  [string]$Command,
  [string]$File,
  [int]$TimeoutSec = 300
)
$instance = "i-0437b62f0ffd5ddb0"
if ($File) { $Command = [IO.File]::ReadAllText($File) }
$Command = $Command -replace "`r",""  # ensure LF-only for bash
# Encode command as base64 to avoid quoting/escaping issues through SSM
$bytes = [Text.Encoding]::UTF8.GetBytes($Command)
$b64 = [Convert]::ToBase64String($bytes)
$wrapped = "echo $b64 | base64 -d | bash"

$params = @{ commands = @($wrapped) } | ConvertTo-Json -Compress
# Write params to a temp file and reference via file:// to avoid PowerShell->aws.exe quote mangling
$tmp = [IO.Path]::GetTempFileName()
[IO.File]::WriteAllText($tmp, $params, (New-Object Text.UTF8Encoding($false)))
$cmdId = aws ssm send-command --instance-ids $instance --document-name "AWS-RunShellScript" --parameters "file://$tmp" --query "Command.CommandId" --output text
Remove-Item $tmp -ErrorAction SilentlyContinue
if (-not $cmdId) { Write-Error "send-command failed"; exit 1 }

$elapsed = 0
while ($true) {
  Start-Sleep -Seconds 3
  $elapsed += 3
  $status = aws ssm get-command-invocation --command-id $cmdId --instance-id $instance --query "Status" --output text 2>$null
  if ($status -in @("Success","Failed","Cancelled","TimedOut")) { break }
  if ($elapsed -ge $TimeoutSec) { Write-Output "=== POLL TIMEOUT after ${TimeoutSec}s (status=$status) ==="; break }
}
$out = aws ssm get-command-invocation --command-id $cmdId --instance-id $instance --query "StandardOutputContent" --output text
$err = aws ssm get-command-invocation --command-id $cmdId --instance-id $instance --query "StandardErrorContent" --output text
Write-Output "=== STATUS: $status ==="
Write-Output "=== STDOUT ==="
Write-Output $out
if ($err -and $err -ne "None") {
  Write-Output "=== STDERR ==="
  Write-Output $err
}
