<#
.SYNOPSIS
  Removes the ShiftReady lab users and groups from your tenant.

.DESCRIPTION
  Deletes only the objects recorded in shiftready-lab-state.json, and only if each one still carries
  the ShiftReady lab tag (company name for users, description for groups). Anything else is skipped
  and reported. Deleted users and groups stay in the Entra recycle bin for 30 days unless you pass
  -Purge, which deletes them permanently.

.PARAMETER Purge
  Also permanently deletes the removed objects from the recycle bin.

.EXAMPLE
  .\Remove-ShiftReadyLab.ps1 -WhatIf
  Lists what would be deleted without changing anything.

.EXAMPLE
  .\Remove-ShiftReadyLab.ps1
#>
[CmdletBinding(SupportsShouldProcess, ConfirmImpact = "High")]
param(
  [switch]$Purge,
  [string]$StatePath = (Join-Path $PSScriptRoot "shiftready-lab-state.json")
)
$ErrorActionPreference = "Stop"
$GroupTag = "ShiftReady lab: Pacific Crest Logistics"
$Company = "Pacific Crest Logistics (ShiftReady lab)"

if (-not (Test-Path $StatePath)) { throw "No lab state found at $StatePath. Run this from the folder where you ran Seed-ShiftReadyLab.ps1." }
$state = Get-Content -Path $StatePath -Raw | ConvertFrom-Json
if ($state.schema -ne "shiftready-entra-lab/1") { throw "$StatePath isn't a ShiftReady lab state file." }

Connect-MgGraph -Scopes "User.ReadWrite.All", "Group.ReadWrite.All" -NoWelcome

$removed = @(); $kept = 0
foreach ($p in $state.users.PSObject.Properties) {
  try { $u = Get-MgUser -UserId $p.Value -Property "id,displayName,userPrincipalName,companyName" }
  catch { Write-Host "  gone   $($p.Name) (already deleted)"; continue }
  if ($u.CompanyName -ne $Company) { Write-Warning "Skipped $($u.UserPrincipalName): it isn't tagged as a ShiftReady lab user."; $kept++; continue }
  if ($PSCmdlet.ShouldProcess($u.UserPrincipalName, "Delete user")) {
    Remove-MgUser -UserId $u.Id; $removed += $u.Id; Write-Host "  delete $($u.UserPrincipalName)"
  } else { $kept++ }
}
foreach ($p in $state.groups.PSObject.Properties) {
  try { $g = Get-MgGroup -GroupId $p.Value -Property "id,displayName,description" }
  catch { Write-Host "  gone   $($p.Name) (already deleted)"; continue }
  if ($g.Description -ne $GroupTag) { Write-Warning "Skipped group $($g.DisplayName): it isn't tagged as a ShiftReady lab group."; $kept++; continue }
  if ($PSCmdlet.ShouldProcess($g.DisplayName, "Delete group")) {
    Remove-MgGroup -GroupId $g.Id; $removed += $g.Id; Write-Host "  delete $($g.DisplayName)"
  } else { $kept++ }
}

if ($Purge -and $removed.Count) {
  if (-not (Get-Module -ListAvailable -Name "Microsoft.Graph.Identity.DirectoryManagement")) { throw "-Purge needs the Microsoft.Graph.Identity.DirectoryManagement module." }
  Start-Sleep -Seconds 5
  foreach ($id in $removed) {
    if ($PSCmdlet.ShouldProcess($id, "Permanently delete from the recycle bin")) {
      try { Remove-MgDirectoryDeletedItem -DirectoryObjectId $id } catch { Write-Warning "Couldn't purge ${id}: $($_.Exception.Message)" }
    }
  }
}

if ($kept -eq 0 -and -not $WhatIfPreference) {
  Remove-Item -Path $StatePath
  Write-Host ""
  Write-Host "The lab is removed. You can seed it again with .\Seed-ShiftReadyLab.ps1."
} elseif (-not $WhatIfPreference) {
  Write-Host ""
  Write-Host "$kept object(s) were kept, so $StatePath was left in place."
}
