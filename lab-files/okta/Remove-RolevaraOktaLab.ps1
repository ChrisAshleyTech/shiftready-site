#Requires -Version 7.0
<#
.SYNOPSIS
  Removes the Rolevara lab users and groups from your Okta org.

.DESCRIPTION
  Deletes only the objects recorded in rolevara-okta-state.json, and only if each one still carries
  the Rolevara lab tag (Organization attribute for users, description for groups). Anything else is
  skipped and reported. Okta deletes are permanent: users are deactivated first (without email), then
  deleted.

  Needs the same Super Administrator API token you seeded with, from OKTA_API_TOKEN or hidden input.

.EXAMPLE
  .\Remove-RolevaraOktaLab.ps1 -WhatIf
  Lists what would be deleted without changing anything.

.EXAMPLE
  .\Remove-RolevaraOktaLab.ps1
#>
[CmdletBinding(SupportsShouldProcess, ConfirmImpact = "High")]
param(
  [string]$StatePath = (Join-Path $PSScriptRoot "rolevara-okta-state.json")
)
$ErrorActionPreference = "Stop"
$GroupTag = "Rolevara lab: Pacific Crest Logistics"

if (-not (Test-Path $StatePath)) { throw "No lab state found at $StatePath. Run this from the folder where you ran Seed-RolevaraOktaLab.ps1." }
$state = Get-Content -Path $StatePath -Raw | ConvertFrom-Json
if ($state.schema -ne "rolevara-okta-lab/1") { throw "$StatePath isn't a Rolevara Okta lab state file." }
$OrgUrl = $state.orgUrl

$Token = $env:OKTA_API_TOKEN
if (-not $Token) { $Token = Read-Host "Paste the Super Administrator API token for $OrgUrl (input is hidden)" -MaskInput }
if (-not $Token) { throw "No API token was given. Nothing was changed." }

function Okta([string]$Method, [string]$Path, [switch]$Allow404) {
  for ($i = 1; ; $i++) {
    $r = Invoke-RestMethod -Method $Method -Uri "$OrgUrl$Path" -Headers @{ Authorization = "SSWS $Token"; Accept = "application/json" } -SkipHttpErrorCheck -StatusCodeVariable code
    if ($code -eq 429 -and $i -lt 5) { Start-Sleep -Seconds (5 * $i); continue }
    if ($code -eq 404 -and $Allow404) { return $null }
    if ($code -ge 400) { throw "Okta returned $code for $Method ${Path}: $($r.errorSummary)" }
    return $r
  }
}

$kept = 0
foreach ($p in $state.users.PSObject.Properties) {
  $u = Okta GET "/api/v1/users/$($p.Value)" -Allow404
  if (-not $u) { Write-Host "  gone   $($p.Name) (already deleted)"; continue }
  if ($u.profile.organization -ne $state.company) { Write-Warning "Skipped $($u.profile.login): it isn't tagged as a Rolevara lab user."; $kept++; continue }
  if ($PSCmdlet.ShouldProcess($u.profile.login, "Deactivate and delete user")) {
    if ($u.status -ne "DEPROVISIONED") { Okta POST "/api/v1/users/$($u.id)/lifecycle/deactivate?sendEmail=false" | Out-Null }
    Okta DELETE "/api/v1/users/$($u.id)?sendEmail=false" | Out-Null
    Write-Host "  delete $($u.profile.login)"
  } else { $kept++ }
}
foreach ($p in $state.groups.PSObject.Properties) {
  $g = Okta GET "/api/v1/groups/$($p.Value)" -Allow404
  if (-not $g) { Write-Host "  gone   $($p.Name) (already deleted)"; continue }
  if ($g.profile.description -ne $GroupTag) { Write-Warning "Skipped group $($g.profile.name): it isn't tagged as a Rolevara lab group."; $kept++; continue }
  if ($PSCmdlet.ShouldProcess($g.profile.name, "Delete group")) {
    Okta DELETE "/api/v1/groups/$($g.id)" | Out-Null; Write-Host "  delete $($g.profile.name)"
  } else { $kept++ }
}

if ($kept -eq 0 -and -not $WhatIfPreference) {
  Remove-Item -Path $StatePath
  Write-Host ""
  Write-Host "The lab is removed. Revoke the API tokens you made for it (Security > API > Tokens)."
} elseif (-not $WhatIfPreference) {
  Write-Host ""
  Write-Host "$kept object(s) were kept, so $StatePath was left in place."
}
