#Requires -Version 7.0
<#
.SYNOPSIS
  Read-only check of the Rolevara Okta lab users, for grading in the browser.

.DESCRIPTION
  Reads the 7 seeded users listed in rolevara-okta-state.json: status, department, title, employee
  number, password timestamp, membership of the 9 lab groups, and System Log events about them since
  the lab was seeded (session clears, password resets, activations). It sends only GET requests and
  changes nothing.

  Use an API token created by a Read-Only Administrator of the lab org, not the Super Administrator
  token you seeded with: a token has exactly the permissions of the admin who created it. The token
  is read from the OKTA_API_TOKEN environment variable, or asked for with hidden input, and is never
  written to disk.

  The export contains only the lab users. It doesn't include your org URL or any other users.
  Upload rolevara-okta-export.json on the Rolevara "Connect your lab" page; grading happens in your
  browser and the file isn't sent anywhere.

.EXAMPLE
  .\Check-RolevaraOktaLab.ps1
#>
[CmdletBinding()]
param(
  [string]$StatePath = (Join-Path $PSScriptRoot "rolevara-okta-state.json"),
  [string]$OutPath = (Join-Path $PSScriptRoot "rolevara-okta-export.json")
)
$ErrorActionPreference = "Stop"
$Events = "user.session.clear", "user.account.reset_password", "user.account.expire_password", "user.lifecycle.activate", "user.lifecycle.reactivate"

if (-not (Test-Path $StatePath)) { throw "No lab state found at $StatePath. Run this from the folder where you ran Seed-RolevaraOktaLab.ps1." }
$state = Get-Content -Path $StatePath -Raw | ConvertFrom-Json
if ($state.schema -ne "rolevara-okta-lab/1" -or -not $state.seededAt) { throw "$StatePath isn't a complete Rolevara Okta lab state file. Remove the lab and seed it again." }
$OrgUrl = $state.orgUrl

$Token = $env:OKTA_API_TOKEN
if (-not $Token) { $Token = Read-Host "Paste a Read-Only Administrator API token for $OrgUrl (input is hidden)" -MaskInput }
if (-not $Token) { throw "No API token was given." }
$Headers = @{ Authorization = "SSWS $Token"; Accept = "application/json" }

function Get-Okta([string]$Path, [switch]$Allow404, [switch]$AllPages) {
  for ($i = 1; ; $i++) {
    $r = Invoke-RestMethod -Uri "$OrgUrl$Path" -Headers $Headers -SkipHttpErrorCheck -StatusCodeVariable code -FollowRelLink:$AllPages -MaximumFollowRelLink 50
    if ($code -eq 429 -and $i -lt 5) { Start-Sleep -Seconds (5 * $i); continue }
    if ($code -eq 404 -and $Allow404) { return $null }
    if ($code -ge 400) { throw "Okta returned $code for GET ${Path}: $($r.errorSummary)" }
    return $r
  }
}
function Iso($d) { if ($d) { ([datetime]$d).ToUniversalTime().ToString("o") } else { $null } }

$groupName = @{}
foreach ($p in $state.groups.PSObject.Properties) { $groupName[$p.Value] = $p.Name }
$userKey = @{}
foreach ($p in $state.users.PSObject.Properties) { $userKey[$p.Value] = $p.Name }

# System Log events about the lab users since seeding. A bounded window (since and until) ends paging.
$filter = ($Events | ForEach-Object { "eventType eq `"$_`"" }) -join " or "
$until = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$log = @(Get-Okta "/api/v1/logs?since=$([uri]::EscapeDataString($state.seededAt))&until=$([uri]::EscapeDataString($until))&limit=1000&filter=$([uri]::EscapeDataString($filter))" -AllPages | ForEach-Object { $_ })
$seen = @{}
foreach ($e in $log) {
  foreach ($t in @($e.target)) { if ($t -and $userKey.ContainsKey($t.id)) { $k = $userKey[$t.id]; if (-not $seen[$k]) { $seen[$k] = [System.Collections.Generic.HashSet[string]]::new() }; [void]$seen[$k].Add($e.eventType) } }
}

$users = foreach ($p in $state.users.PSObject.Properties) {
  $u = Get-Okta "/api/v1/users/$($p.Value)" -Allow404
  if (-not $u) {
    Write-Warning "$($p.Name) was not found (deleted?)."
    [ordered]@{ key = $p.Name; deleted = $true }
    continue
  }
  $groups = @(Get-Okta "/api/v1/users/$($p.Value)/groups" -AllPages | ForEach-Object { $_ } | Where-Object { $groupName.ContainsKey($_.id) } | ForEach-Object { $groupName[$_.id] } | Sort-Object)
  [ordered]@{
    key = $p.Name; name = "$($u.profile.firstName) $($u.profile.lastName)"; employeeNumber = $u.profile.employeeNumber; status = $u.status
    department = $u.profile.department; title = $u.profile.title; passwordChanged = Iso $u.passwordChanged
    groups = $groups; events = @(if ($seen[$p.Name]) { $seen[$p.Name] | Sort-Object })
  }
  Write-Host "  read  $($u.profile.login) ($($u.status))"
}

$out = [ordered]@{
  schema = "rolevara-okta-export/1"
  exportedAt = $until
  seededAt = $state.seededAt
  baseline = $state.baseline
  users = @($users)
}
$out | ConvertTo-Json -Depth 6 | Set-Content -Path $OutPath -Encoding utf8

Write-Host ""
Write-Host "Exported to $OutPath"
Write-Host "Upload it on the Rolevara 'Connect your lab' page, Okta lab, Upload results tab."
