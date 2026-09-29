<#
.SYNOPSIS
  Seeds a Microsoft Entra lab tenant with the ShiftReady Pacific Crest Logistics Monday scenario.

.DESCRIPTION
  Creates 7 users and 9 security groups for six Monday tickets. Every object is tagged
  "ShiftReady lab", and its object ID is recorded in shiftready-lab-state.json next to this script.
  Keep that file: Export-ShiftReadyLab.ps1 and Remove-ShiftReadyLab.ps1 both need it.

  Run this only in a lab or developer tenant, never in an employer's tenant. The script stops if the
  tenant has more than 50 users (unless you pass -LabTenant) and asks you to type the tenant's domain
  before changing anything. Seeded users get long random passwords that are never shown or saved;
  nobody signs in as them.

  Needs: PowerShell 7 (recommended) or Windows PowerShell 5.1, the Microsoft Graph PowerShell modules
  listed below, and an admin who can create users and groups (User Administrator and Groups
  Administrator, or Global Administrator in a lab tenant).

.PARAMETER LabTenant
  Allows seeding a tenant with more than 50 users. Use it only if that tenant is a lab.

.EXAMPLE
  .\Seed-ShiftReadyLab.ps1

.EXAMPLE
  .\Seed-ShiftReadyLab.ps1 -WhatIf
  Shows what would be created without changing anything.
#>
[CmdletBinding(SupportsShouldProcess)]
param(
  [switch]$LabTenant,
  [string]$StatePath = (Join-Path $PSScriptRoot "shiftready-lab-state.json")
)
$ErrorActionPreference = "Stop"
$GroupTag = "ShiftReady lab: Pacific Crest Logistics"

# Lab data, generated from the ShiftReady simulator (src/app/lab/entra.ts). Do not edit by hand.
# BEGIN LAB DATA
$Lab = @'
{"company":"Pacific Crest Logistics (ShiftReady lab)","users":[{"key":"maria.lopez","alias":"maria.lopez","name":"Maria Lopez","empId":"10401","dept":"Finance","title":"AP Clerk","enabled":false,"groups":[]},{"key":"robert.hayes","alias":"robert.hayes","name":"Robert Hayes","empId":"10322","dept":"Operations","title":"Dispatcher","enabled":true,"groups":["GRP-All-Staff","APP-M365-E3","APP-CargoWise-Ops","APP-WMS-User"]},{"key":"tanya.wright","alias":"tanya.wright","name":"Tanya Wright","empId":"10257","dept":"Sales","title":"Account Executive","enabled":true,"groups":["GRP-All-Staff","APP-M365-E3","APP-Salesforce-User"]},{"key":"sofia.ramirez","alias":"sofia.ramirez","name":"Sofia Ramirez","empId":"10218","dept":"Sales","title":"Account Executive","enabled":false,"groups":["GRP-All-Staff","APP-Salesforce-User"]},{"key":"rachel.adams","alias":"rachel.adams","name":"Rachel Adams","empId":"10249","dept":"Sales","title":"Account Executive","enabled":true,"groups":["GRP-All-Staff","APP-M365-E3","APP-Salesforce-User"]},{"key":"ethan.moore","alias":"ethan.moore","name":"Ethan Moore","empId":"10402","dept":"Operations","title":"Dispatcher","enabled":false,"groups":[]},{"key":"bob.turner","alias":"bob.turner","name":"Bob Turner","empId":"10312","dept":"Operations","title":"Dispatcher","enabled":true,"groups":["GRP-All-Staff","APP-M365-E3","APP-CargoWise-Ops","APP-WMS-User","APP-SAP-AP-Entry","APP-Finance-Reports"]}],"groups":["APP-CargoWise-Ops","APP-Concur-User","APP-Finance-Reports","APP-M365-E3","APP-SAP-AP-Entry","APP-Salesforce-User","APP-WMS-User","APP-Workday-HR","GRP-All-Staff"]}
'@ | ConvertFrom-Json
# END LAB DATA

function Iso($d) { if ($d) { ([datetime]$d).ToUniversalTime().ToString("o") } else { $null } }

# New objects can take a few seconds to replicate, so retry reads and membership changes.
function Retry([scriptblock]$Do) {
  for ($i = 1; ; $i++) {
    try { return & $Do }
    catch { if ($i -ge 6) { throw }; Start-Sleep -Seconds (2 * $i) }
  }
}

foreach ($m in "Microsoft.Graph.Authentication", "Microsoft.Graph.Users", "Microsoft.Graph.Groups", "Microsoft.Graph.Identity.DirectoryManagement") {
  if (-not (Get-Module -ListAvailable -Name $m)) { throw "The $m module is missing. Install it with: Install-Module $m -Scope CurrentUser" }
}
if (Test-Path $StatePath) { throw "A lab is already seeded ($StatePath). Run Remove-ShiftReadyLab.ps1 first, then seed again." }

Connect-MgGraph -Scopes "User.ReadWrite.All", "Group.ReadWrite.All", "Organization.Read.All" -NoWelcome
$org = Get-MgOrganization | Select-Object -First 1
$domain = ($org.VerifiedDomains | Where-Object IsDefault | Select-Object -First 1).Name
$count = Get-MgUserCount -ConsistencyLevel eventual

Write-Host ""
Write-Host "Tenant:  $($org.DisplayName)"
Write-Host "Domain:  $domain"
Write-Host "Users:   $count"
Write-Host "Creates: $($Lab.users.Count) users and $($Lab.groups.Count) security groups, tagged '$GroupTag'."
Write-Host ""
if ($count -gt 50 -and -not $LabTenant) {
  throw "This tenant has $count users, which looks like a real organization. ShiftReady seeds lab tenants only. If this really is a lab tenant, run the script again with -LabTenant."
}

# Stop before changing anything if a name is already taken.
foreach ($g in $Lab.groups) {
  if (Get-MgGroup -Filter "displayName eq '$g'" -Top 1) { throw "A group named $g already exists in this tenant. Nothing was changed." }
}
foreach ($u in $Lab.users) {
  $upn = "$($u.alias)@$domain"
  if (Get-MgUser -Filter "userPrincipalName eq '$upn'" -Top 1) { throw "A user $upn already exists in this tenant. Nothing was changed." }
}

if (-not $WhatIfPreference) {
  $typed = Read-Host "Type $domain to seed this tenant"
  if ($typed -ne $domain) { throw "The domain didn't match. Nothing was changed." }
}

# The state file is written after every object, so a failed run can still be cleaned up.
$state = [ordered]@{
  schema = "shiftready-entra-lab/1"; tenantDomain = $domain; company = $Lab.company
  seededAt = $null; groups = [ordered]@{}; users = [ordered]@{}; baseline = [ordered]@{}
}
function Save { if (-not $WhatIfPreference) { $state | ConvertTo-Json -Depth 5 | Set-Content -Path $StatePath -Encoding utf8 } }
Save

foreach ($g in $Lab.groups) {
  if ($PSCmdlet.ShouldProcess($g, "Create security group")) {
    $grp = New-MgGroup -DisplayName $g -MailEnabled:$false -MailNickname ($g.ToLower()) -SecurityEnabled -Description $GroupTag
    $state.groups[$g] = $grp.Id; Save
    Write-Host "  group  $g"
  }
}

foreach ($u in $Lab.users) {
  $upn = "$($u.alias)@$domain"
  if (-not $PSCmdlet.ShouldProcess($upn, "Create user ($($u.title), $(if ($u.enabled) { 'enabled' } else { 'disabled' }), $($u.groups.Count) groups)")) { continue }
  $pw = [guid]::NewGuid().ToString() + "-Aa1!" + [guid]::NewGuid().ToString().Substring(0, 8)
  $user = New-MgUser -DisplayName $u.name -UserPrincipalName $upn -MailNickname $u.alias `
    -AccountEnabled:([bool]$u.enabled) -PasswordProfile @{ Password = $pw; ForceChangePasswordNextSignIn = $true } `
    -Department $u.dept -JobTitle $u.title -EmployeeId $u.empId -CompanyName $Lab.company
  $state.users[$u.key] = $user.Id; Save
  foreach ($g in $u.groups) {
    $gid = $state.groups[$g]
    Retry { New-MgGroupMember -GroupId $gid -DirectoryObjectId $user.Id } | Out-Null
  }
  Write-Host "  user   $upn"
}

if ($WhatIfPreference) { return }

# Record each user's session and password timestamps now, so grading can tell whether you
# revoked sessions or reset a password after seeding.
foreach ($k in @($state.users.Keys)) {
  $id = $state.users[$k]
  $x = Retry { Get-MgUser -UserId $id -Property "id,signInSessionsValidFromDateTime,lastPasswordChangeDateTime" }
  $state.baseline[$k] = [ordered]@{ sessionsValidFrom = Iso $x.SignInSessionsValidFromDateTime; passwordChanged = Iso $x.LastPasswordChangeDateTime }
}
$state.seededAt = (Get-Date).ToUniversalTime().ToString("o")
Save

Write-Host ""
Write-Host "Seeded. State saved to $StatePath (keep it)."
Write-Host "Next: work the six tickets in the Microsoft Entra admin center, then run .\Export-ShiftReadyLab.ps1."
