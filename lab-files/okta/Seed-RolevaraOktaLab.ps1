#Requires -Version 7.0
<#
.SYNOPSIS
  Seeds an Okta Integrator org with the Rolevara Pacific Crest Logistics ticket scenario.

.DESCRIPTION
  Creates 7 users and 9 groups for six lab tickets. Every group is tagged "Rolevara lab" in its
  description and every user in its Organization attribute, and each object ID is recorded in
  rolevara-okta-state.json next to this script. Keep that file: Check-RolevaraOktaLab.ps1 and
  Remove-RolevaraOktaLab.ps1 both need it.

  Run this only in a free Okta Integrator org you created for practice, never in an employer's org.
  The script stops if the org has more than 50 users (unless you pass -LabTenant) and asks you to
  type the org's subdomain before changing anything. Users get @pacificcrest.example.com sign-in
  names (example.com never receives mail). Active users get long random passwords that are never
  shown or saved; nobody signs in as them, and no activation emails are sent.

  Needs: PowerShell 7, and an API token created by a Super Administrator of the lab org (Security >
  API > Tokens). The token is read from the OKTA_API_TOKEN environment variable, or asked for with
  hidden input. It is never written to disk. Revoke it when you finish the lab.

.PARAMETER OrgUrl
  Your lab org's URL, for example https://integrator-1234567.okta.com

.PARAMETER LabTenant
  Allows seeding an org with more than 50 users. Use it only if that org is a lab.

.EXAMPLE
  .\Seed-RolevaraOktaLab.ps1 -OrgUrl https://integrator-1234567.okta.com -WhatIf
  Shows what would be created without changing anything.

.EXAMPLE
  .\Seed-RolevaraOktaLab.ps1 -OrgUrl https://integrator-1234567.okta.com
#>
[CmdletBinding(SupportsShouldProcess)]
param(
  [Parameter(Mandatory)][string]$OrgUrl,
  [switch]$LabTenant,
  [string]$StatePath = (Join-Path $PSScriptRoot "rolevara-okta-state.json")
)
$ErrorActionPreference = "Stop"
$GroupTag = "Rolevara lab: Pacific Crest Logistics"
$MailDomain = "pacificcrest.example.com"

# Lab data, generated from the Rolevara simulator (src/app/lab/core.ts). Do not edit by hand.
# BEGIN LAB DATA
$Lab = @'
{"company":"Pacific Crest Logistics (Rolevara lab)","users":[{"key":"maria.lopez","alias":"maria.lopez","name":"Maria Lopez","empId":"10401","dept":"Finance","title":"AP Clerk","enabled":false,"groups":[]},{"key":"robert.hayes","alias":"robert.hayes","name":"Robert Hayes","empId":"10322","dept":"Operations","title":"Dispatcher","enabled":true,"groups":["GRP-All-Staff","APP-M365-E3","APP-CargoWise-Ops","APP-WMS-User"]},{"key":"tanya.wright","alias":"tanya.wright","name":"Tanya Wright","empId":"10257","dept":"Sales","title":"Account Executive","enabled":true,"groups":["GRP-All-Staff","APP-M365-E3","APP-Salesforce-User"]},{"key":"sofia.ramirez","alias":"sofia.ramirez","name":"Sofia Ramirez","empId":"10218","dept":"Sales","title":"Account Executive","enabled":false,"groups":["GRP-All-Staff","APP-Salesforce-User"]},{"key":"rachel.adams","alias":"rachel.adams","name":"Rachel Adams","empId":"10249","dept":"Sales","title":"Account Executive","enabled":true,"groups":["GRP-All-Staff","APP-M365-E3","APP-Salesforce-User"]},{"key":"ethan.moore","alias":"ethan.moore","name":"Ethan Moore","empId":"10402","dept":"Operations","title":"Dispatcher","enabled":false,"groups":[]},{"key":"bob.turner","alias":"bob.turner","name":"Bob Turner","empId":"10312","dept":"Operations","title":"Dispatcher","enabled":true,"groups":["GRP-All-Staff","APP-M365-E3","APP-CargoWise-Ops","APP-WMS-User","APP-SAP-AP-Entry","APP-Finance-Reports"]}],"groups":["APP-CargoWise-Ops","APP-Concur-User","APP-Finance-Reports","APP-M365-E3","APP-SAP-AP-Entry","APP-Salesforce-User","APP-WMS-User","APP-Workday-HR","GRP-All-Staff"]}
'@ | ConvertFrom-Json
# END LAB DATA

# ---------- Okta API ----------
$OrgUrl = $OrgUrl.TrimEnd("/") -replace "-admin\.", "."
if ($OrgUrl -notmatch '^https://[a-z0-9-]+\.(okta|oktapreview|okta-emea)\.com$') { throw "OrgUrl should look like https://integrator-1234567.okta.com" }
$Token = $env:OKTA_API_TOKEN
if (-not $Token) { $Token = Read-Host "Paste a Super Administrator API token for $OrgUrl (input is hidden)" -MaskInput }
if (-not $Token) { throw "No API token was given. Nothing was changed." }

function Okta([string]$Method, [string]$Path, $Body, [switch]$Allow404) {
  $p = @{ Method = $Method; Uri = "$OrgUrl$Path"; Headers = @{ Authorization = "SSWS $Token"; Accept = "application/json" }; SkipHttpErrorCheck = $true; StatusCodeVariable = "code" }
  if ($null -ne $Body) { $p.Body = $Body | ConvertTo-Json -Depth 6; $p.ContentType = "application/json" }
  # Okta rate limits: wait and retry on 429.
  for ($i = 1; ; $i++) {
    $r = Invoke-RestMethod @p
    if ($code -eq 429 -and $i -lt 5) { Start-Sleep -Seconds (5 * $i); continue }
    if ($code -eq 404 -and $Allow404) { return $null }
    if ($code -ge 400) { throw "Okta returned $code for $Method ${Path}: $($r.errorSummary) $(($r.errorCauses | ForEach-Object errorSummary) -join '; ')" }
    return $r
  }
}
function Iso($d) { if ($d) { ([datetime]$d).ToUniversalTime().ToString("o") } else { $null } }

if (Test-Path $StatePath) { throw "A lab is already seeded ($StatePath). Run Remove-RolevaraOktaLab.ps1 first, then seed again." }

$subdomain = ([uri]$OrgUrl).Host.Split(".")[0]
$org = try { Okta GET "/api/v1/org" } catch { $null }
$count = @(Okta GET "/api/v1/users?limit=200").Count

Write-Host ""
Write-Host "Org:      $OrgUrl$(if ($org.companyName) { " ($($org.companyName))" })"
Write-Host "Users:    $count$(if ($count -ge 200) { '+' })"
Write-Host "Creates:  $($Lab.users.Count) users and $($Lab.groups.Count) groups, tagged '$GroupTag'."
Write-Host ""
if ($count -gt 50 -and -not $LabTenant) {
  throw "This org has $count users, which looks like a real organization. Rolevara seeds lab orgs only. If this really is a lab org, run the script again with -LabTenant."
}

# Stop before changing anything if a name is already taken.
foreach ($g in $Lab.groups) {
  if (@(Okta GET "/api/v1/groups?q=$([uri]::EscapeDataString($g))" | Where-Object { $_.profile.name -eq $g }).Count) { throw "A group named $g already exists in this org. Nothing was changed." }
}
foreach ($u in $Lab.users) {
  $login = "$($u.alias)@$MailDomain"
  if (Okta GET "/api/v1/users/$([uri]::EscapeDataString($login))" -Allow404) { throw "A user $login already exists in this org. Nothing was changed." }
}

if (-not $WhatIfPreference) {
  $typed = Read-Host "Type $subdomain to seed this org"
  if ($typed -ne $subdomain) { throw "The subdomain didn't match. Nothing was changed." }
}

# The state file is written after every object, so a failed run can still be cleaned up.
$state = [ordered]@{
  schema = "rolevara-okta-lab/1"; orgUrl = $OrgUrl; company = $Lab.company
  seededAt = $null; groups = [ordered]@{}; users = [ordered]@{}; baseline = [ordered]@{}
}
function Save { if (-not $WhatIfPreference) { $state | ConvertTo-Json -Depth 5 | Set-Content -Path $StatePath -Encoding utf8 } }
Save

foreach ($g in $Lab.groups) {
  if ($PSCmdlet.ShouldProcess($g, "Create group")) {
    $grp = Okta POST "/api/v1/groups" @{ profile = @{ name = $g; description = $GroupTag } }
    $state.groups[$g] = $grp.id; Save
    Write-Host "  group  $g"
  }
}

foreach ($u in $Lab.users) {
  $login = "$($u.alias)@$MailDomain"
  # Disabled users with access are former employees (deactivated); without access they are pre-hires (staged).
  $former = -not $u.enabled -and $u.groups.Count -gt 0
  $status = if ($u.enabled) { "active" } elseif ($former) { "deactivated" } else { "staged" }
  if (-not $PSCmdlet.ShouldProcess($login, "Create user ($($u.title), $status, $($u.groups.Count) groups)")) { continue }
  $first, $last = $u.name -split " ", 2
  $body = @{ profile = @{ firstName = $first; lastName = $last; email = $login; login = $login; department = $u.dept; title = $u.title; employeeNumber = $u.empId; organization = $Lab.company } }
  $activate = $u.enabled -or $former
  if ($activate) { $body.credentials = @{ password = @{ value = [guid]::NewGuid().ToString() + "-Aa1!" + [guid]::NewGuid().ToString().Substring(0, 8) } } }
  $user = Okta POST "/api/v1/users?activate=$($activate.ToString().ToLower())" $body
  $state.users[$u.key] = $user.id; Save
  foreach ($g in $u.groups) { Okta PUT "/api/v1/groups/$($state.groups[$g])/users/$($user.id)" | Out-Null }
  if ($former) { Okta POST "/api/v1/users/$($user.id)/lifecycle/deactivate?sendEmail=false" | Out-Null }
  Write-Host "  user   $login ($status)"
}

if ($WhatIfPreference) { return }

# Record each user's password timestamp now, so grading can tell whether a new password was issued.
foreach ($k in @($state.users.Keys)) {
  $x = Okta GET "/api/v1/users/$($state.users[$k])"
  $state.baseline[$k] = [ordered]@{ passwordChanged = Iso $x.passwordChanged }
}
$state.seededAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
Save

Write-Host ""
Write-Host "Seeded. State saved to $StatePath (keep it)."
Write-Host "Next: work the six tickets in the Okta Admin Console, then run .\Check-RolevaraOktaLab.ps1 with a read-only admin's token."
