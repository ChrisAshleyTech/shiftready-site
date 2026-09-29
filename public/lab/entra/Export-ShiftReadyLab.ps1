<#
.SYNOPSIS
  Read-only export of the ShiftReady lab users, for grading in the browser.

.DESCRIPTION
  Reads the 7 seeded users listed in shiftready-lab-state.json: enabled state, department, job title,
  employee ID, session and password timestamps, and membership of the 9 lab groups. It signs in with
  read-only permissions (User.Read.All, Group.Read.All) and changes nothing.

  The export contains only the lab users. It doesn't include your tenant ID, domain or any other
  directory objects. Upload shiftready-lab-export.json on the ShiftReady "Connect your lab" page;
  grading happens in your browser and the file isn't sent anywhere.

.EXAMPLE
  .\Export-ShiftReadyLab.ps1
#>
[CmdletBinding()]
param(
  [string]$StatePath = (Join-Path $PSScriptRoot "shiftready-lab-state.json"),
  [string]$OutPath = (Join-Path $PSScriptRoot "shiftready-lab-export.json")
)
$ErrorActionPreference = "Stop"

function Iso($d) { if ($d) { ([datetime]$d).ToUniversalTime().ToString("o") } else { $null } }

if (-not (Test-Path $StatePath)) { throw "No lab state found at $StatePath. Run this from the folder where you ran Seed-ShiftReadyLab.ps1." }
$state = Get-Content -Path $StatePath -Raw | ConvertFrom-Json
if ($state.schema -ne "shiftready-entra-lab/1" -or -not $state.seededAt) { throw "$StatePath isn't a complete ShiftReady lab state file. Remove the lab and seed it again." }

Connect-MgGraph -Scopes "User.Read.All", "Group.Read.All" -NoWelcome

$groupName = @{}
foreach ($p in $state.groups.PSObject.Properties) { $groupName[$p.Value] = $p.Name }

$users = foreach ($p in $state.users.PSObject.Properties) {
  try {
    $u = Get-MgUser -UserId $p.Value -Property "id,displayName,accountEnabled,department,jobTitle,employeeId,signInSessionsValidFromDateTime,lastPasswordChangeDateTime"
  } catch {
    Write-Warning "$($p.Name) was not found (deleted?)."
    [ordered]@{ key = $p.Name; deleted = $true }
    continue
  }
  $groups = @(Get-MgUserMemberOf -UserId $p.Value -All | Where-Object { $groupName.ContainsKey($_.Id) } | ForEach-Object { $groupName[$_.Id] } | Sort-Object)
  [ordered]@{
    key = $p.Name; name = $u.DisplayName; employeeId = $u.EmployeeId; accountEnabled = [bool]$u.AccountEnabled
    department = $u.Department; jobTitle = $u.JobTitle
    sessionsValidFrom = Iso $u.SignInSessionsValidFromDateTime; passwordChanged = Iso $u.LastPasswordChangeDateTime
    groups = $groups
  }
  Write-Host "  read  $($u.DisplayName)"
}

$out = [ordered]@{
  schema = "shiftready-entra-export/1"
  exportedAt = (Get-Date).ToUniversalTime().ToString("o")
  seededAt = $state.seededAt
  baseline = $state.baseline
  users = @($users)
}
$out | ConvertTo-Json -Depth 6 | Set-Content -Path $OutPath -Encoding utf8

Write-Host ""
Write-Host "Exported to $OutPath"
Write-Host "Upload it on the ShiftReady 'Connect your lab' page, Upload results tab."
