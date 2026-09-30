// Brightpath SaaS: software, SOC 2. Tickets are in development.
import { iconByPrefix, noteByPrefix } from "../appIcons";
import type { CompanyPack } from "../types";
import { Mark } from "./mark";

export const pack: CompanyPack = {
  id: "brightpath",
  name: "Brightpath SaaS",
  industry: "Software",
  frameworks: "SOC 2",
  storageKey: "shiftready-sim-brightpath-v1",
  hasTickets: false,
  Mark,
  appIcon: iconByPrefix({
    "APP-Office-Suite": "suite", "APP-Chat": "suite", "APP-Finance-Reports": "chart", "APP-ERP": "ledger", "APP-Billing-Platform": "claim",
    "APP-Code-Repo": "code", "APP-Code-Review-Approve": "code", "APP-CI-CD-Deploy-Prod": "deploy", "APP-Cloud-Console": "cloud",
    "APP-Observability": "gauge", "APP-Prod-DB-Read": "database", "APP-Security-SIEM": "audit", "APP-IT-Device-Mgmt": "gear",
    "APP-Support-Desk": "ticket", "APP-Customer-Impersonation": "alert", "APP-CRM": "crm", "APP-HRIS": "people",
    "GRP-": "group", "ROLE-": "key", "SVC-": "gear",
  }),
  toolNote: noteByPrefix({
    "APP-Code-Repo": "Source code usually lives in GitHub, GitLab or Bitbucket; branch protection enforces review before merge.",
    "APP-CI-CD-Deploy-Prod": "Deploys often run through GitHub Actions, GitLab CI, CircleCI or Argo CD, with production gated by approvals.",
    "APP-Cloud-Console": "Production usually runs on AWS, Microsoft Azure or Google Cloud.",
    "ROLE-Cloud-Prod-Admin": "Just-in-time admin access is often brokered by tools such as AWS IAM Identity Center, Azure PIM or Teleport.",
    "APP-Observability": "Common observability tools are Datadog, Grafana and New Relic.",
    "APP-Security-SIEM": "Security logs typically go to a SIEM such as Splunk, Microsoft Sentinel or Datadog Cloud SIEM.",
    "ROLE-IdP-Admin": "The identity provider is usually Okta, Microsoft Entra ID or Google Workspace.",
    "APP-IT-Device-Mgmt": "Laptops are usually managed with Jamf, Kandji or Microsoft Intune.",
    "APP-Support-Desk": "Support teams commonly use Zendesk, Intercom or Freshdesk.",
    "APP-CRM": "The CRM is usually Salesforce or HubSpot.",
    "APP-HRIS": "Growing software companies often use Rippling, BambooHR or Workday.",
    "APP-ERP": "Finance often runs on NetSuite or QuickBooks, with Bill or Ramp for payables.",
  }),
  load: async () => ({ company: await import("./company"), policy: await import("./policy") }),
  loadRecords: () => import("./finance"),
};
