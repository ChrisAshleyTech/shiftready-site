// Career and how-to guides for identity and access roles: the questions people search for before they
// apply. Each guide is its own pre-rendered page at /guides/<slug>/ (see guides/*/index.html), and the
// FAQ pairs also feed FAQPage JSON-LD. Copy voice: second person, never "we" (e2e copy rules).
import type { QA } from "@/marketing/Faq";

export type Section = { h: string; p?: string[]; list?: string[] };
export type Guide = {
  slug: string; eyebrow: string; title: string; lead: string; updated: string;
  sections: Section[]; practice: { text: string; href: string; label: string }; faq: QA;
};

export const GUIDES: Guide[] = [
  {
    slug: "iam-analyst-interview-practice", eyebrow: "Interview prep", updated: "2026-10-02",
    title: "IAM analyst interview questions, and how to practise the answers",
    lead: "Identity and access management interviews test judgment more than definitions. Here are the questions that come up most, what a strong answer covers, and how to rehearse them on realistic tickets.",
    sections: [
      { h: "What IAM interviewers are really checking",
        p: ["Most IAM analyst interviews mix three things: core concepts (authentication, authorization, least privilege), process (how access is requested, approved, provisioned and removed), and scenario questions where you talk through a ticket.",
          "The scenario questions decide most offers. Interviewers want to hear you verify identity before acting, follow the approval path, and say which control a step satisfies. Candidates who only know definitions tend to skip those steps when the scenario gets messy."] },
      { h: "Common IAM analyst interview questions",
        list: [
          "Walk through the joiner, mover, leaver process. What can go wrong at each stage?",
          "A caller says they are an executive and needs MFA moved to a new phone right now. What do you do?",
          "What is the difference between authentication and authorization?",
          "What is least privilege, and how do you enforce it when a manager asks to copy a coworker's access?",
          "What is separation of duties? Give an example of a toxic combination.",
          "How does a user access review work, and what happens to access nobody certifies?",
          "An account that should have been disabled was used in a password spray. How do you contain it and find the root cause?",
          "What is the difference between RBAC and ABAC?",
          "How do you handle service accounts and their owners?",
          "What evidence would an auditor want for a termination?",
        ] },
      { h: "What a strong answer covers",
        p: ["For scenario questions, answer in the order the work happens: verify who is asking, check the policy or access matrix, confirm approval, make the change, record it on the ticket, and say what you would check afterwards.",
          "Name the risk behind each step. \"Verify the employee ID against the HR record, because social engineering against the help desk is a common way into an account\" is far stronger than \"check their ID\"."] },
      { h: "How to practise",
        p: ["Reading lists of questions only goes so far. The fastest way to sound confident is to work real-looking tickets and see where your process breaks.",
          "In the Rolevara IAM Ops track you work a full service desk shift at a fictional logistics company: 20 tickets across joiners, movers, leavers, password and MFA resets, access requests and incidents. Each ticket is graded on the outcome and the process, and missed work comes back later as a follow-up incident, just as it would on the job."] },
    ],
    practice: { text: "Work a free IAM service desk shift and get graded on every ticket.", href: "/app/", label: "Start the free shift" },
    faq: [
      ["How long does it take to prepare for an IAM analyst interview?", "Most people need one to three weeks of focused practice on the joiner, mover, leaver process, access reviews and incident scenarios, plus a review of the identity platform named in the job post."],
      ["Do IAM analyst interviews include technical tests?", "Often. Expect scenario walk-throughs, and sometimes a practical task such as reading an access report, spotting separation-of-duties conflicts or explaining a provisioning workflow."],
      ["Can Rolevara be used for free?", "Yes. The full Pacific Crest Logistics scenario, including the IAM service desk shift and the GRC audit, is free."],
    ],
  },
  {
    slug: "how-to-get-into-iam", eyebrow: "Career guide", updated: "2026-10-02",
    title: "How to get an IAM job with no experience",
    lead: "Identity and access management is one of the most reachable ways into cybersecurity. This guide covers the entry roles, the skills hiring managers look for, and how to show experience before your first IAM job.",
    sections: [
      { h: "Entry-level IAM roles",
        list: [
          "Service desk or help desk analyst: password resets, MFA, account unlocks and access requests. Many IAM careers start here.",
          "IAM analyst or identity operations analyst: provisioning, deprovisioning, access reviews and role maintenance.",
          "Access administrator: day-to-day changes in a directory or identity platform.",
          "IAM engineer (usually after one or two years): integrations, automation and platform configuration.",
        ] },
      { h: "Skills hiring managers look for",
        list: [
          "The identity lifecycle: joiner, mover, leaver, rehire and leave of absence.",
          "Least privilege, role-based access and separation of duties.",
          "Caller and requester verification before any credential change.",
          "Access reviews and the audit evidence that proves controls work.",
          "Hands-on time in a directory or identity platform such as Microsoft Entra ID, Okta or AWS IAM.",
          "Clear ticket notes: what you did, why, and who approved it.",
        ] },
      { h: "The experience problem, and how to solve it",
        p: ["Job posts ask for experience you can only get on the job. The way around it is to show the same judgment in a setting that looks like the job: realistic tickets, real policies and a record of how you did.",
          "A job simulation gives you that record. Rolevara puts you on the identity service desk of a fictional company with a directory of 131 accounts, a runbook and an access matrix. Every ticket is graded on what you changed and how you got there, and the readiness report shows a hiring manager the result."] },
      { h: "Certifications worth considering",
        p: ["Certifications help you pass resume filters but rarely replace practical skill. Common choices are CompTIA Security+ for fundamentals, Microsoft SC-300 for Entra ID, and the Okta Certified Professional. Pair any certification with hands-on practice so you can talk through real scenarios in the interview."] },
    ],
    practice: { text: "See whether you can do the job: work a full IAM shift for free.", href: "/app/", label: "Try the IAM simulator" },
    faq: [
      ["Is IAM a good entry point into cybersecurity?", "Yes. IAM work is needed in almost every organization, the entry roles overlap with service desk experience, and the skills lead on to security engineering, GRC and privileged access management."],
      ["Do you need to code for an IAM job?", "Not for most entry roles. Scripting (PowerShell or Python) becomes useful for automation and engineering roles later."],
      ["What should go on a resume for an IAM role without experience?", "Concrete practice: the scenarios you worked, the controls you applied, any lab tenant you configured, and a shareable result such as a readiness report or portfolio project."],
    ],
  },
  {
    slug: "grc-analyst-job-simulation", eyebrow: "Career guide", updated: "2026-10-02",
    title: "GRC analyst job simulation: practise IT audit and access controls",
    lead: "Governance, risk and compliance work is easier to learn by doing an audit than by reading a framework. Here is what a GRC analyst does day to day, and how to practise it on a realistic company.",
    sections: [
      { h: "What a GRC analyst does",
        list: [
          "Tests controls against evidence: samples tickets, logs and approvals to see whether a control operated.",
          "Rates deficiencies as a control deficiency, significant deficiency or material weakness.",
          "Runs or checks user access reviews and follows up on access nobody certified.",
          "Maintains a risk register and rates likelihood and impact.",
          "Reviews vendor SOC 2 reports and decides whether exceptions are acceptable.",
          "Maps controls to frameworks such as SOX ITGC, NIST 800-53, ISO 27001 and SOC 2, and writes findings management can act on.",
        ] },
      { h: "Why access controls are the core of most audits",
        p: ["Provisioning, termination and access review controls appear in nearly every IT general controls audit. If you can test those three well, you can handle a large share of real GRC work.",
          "A strong test answers four questions: was access approved before it was granted, was it removed on time when someone left, were reviews complete, and is the evidence good enough that someone else would reach the same conclusion."] },
      { h: "How the Rolevara GRC Audit track works",
        p: ["The GRC Audit track puts you on the audit side of the same fictional company the IAM track runs. You test new-user provisioning and timely terminations against sampled evidence, audit the change log of the IAM shift, assess access-review completeness, rate an IT risk register, review a vendor SOC 2 Type II report, and write the finding.",
          "You can take the GRC path on its own, or work the IAM shift first and then audit your own decisions."] },
    ],
    practice: { text: "Run a SOX IT general controls audit on a realistic company, free.", href: "/app/#/grc", label: "Open the audit desk" },
    faq: [
      ["Do you need an audit background to become a GRC analyst?", "No. Many GRC analysts come from IT support, IAM or compliance roles. Understanding how access controls work in practice is a strong head start."],
      ["Which frameworks should a new GRC analyst learn first?", "Start with the one in the job posts you want: SOX ITGC for public companies, SOC 2 for software vendors, HIPAA for healthcare, PCI DSS for retail and payments, and NIST 800-53 or CMMC for government work."],
      ["Is the policy content in Rolevara compliance advice?", "No. The runbook policies are training material based on published frameworks, not legal or compliance advice."],
    ],
  },
  {
    slug: "how-to-get-into-pam", eyebrow: "Career guide", updated: "2026-10-02",
    title: "How to get into privileged access management (PAM)",
    lead: "Privileged access management protects the accounts attackers want most. This guide explains what PAM work involves, the path most people take into it, and how to practise the core tasks.",
    sections: [
      { h: "What PAM teams do",
        list: [
          "Remove standing admin access and replace it with just-in-time elevation that expires.",
          "Decide who is eligible for which privileged role, based on their job.",
          "Control break-glass (emergency) accounts: when they can be used, how use is monitored, and the review afterwards.",
          "Rotate shared and service-account credentials.",
          "Review privileged sessions and escalate anything suspicious.",
          "Handle admin leavers and vendor access, where mistakes are most costly.",
        ] },
      { h: "The usual path into PAM",
        p: ["Most PAM specialists start in IAM operations or system administration. They learn how accounts and roles work in general, then move to the smaller set of accounts where the stakes are highest.",
          "Hiring managers look for the same judgment as IAM, applied more strictly: verify, approve, time-limit, record and review. Experience with a PAM or just-in-time tool helps, and so does understanding the controls auditors test for privileged access."] },
      { h: "How to practise PAM",
        p: ["The Rolevara PAM track (early access) covers just-in-time role activation with approval and time limits, eligibility by job, break-glass use and review, credential rotation, privileged session review, and admin leavers, across six fictional companies.",
          "Start with the free IAM Ops shift if you are new to identity work. The PAM decisions build on the same lifecycle and approval habits."] },
    ],
    practice: { text: "Build the identity habits PAM depends on with the free IAM shift.", href: "/app/", label: "Start practising" },
    faq: [
      ["Is PAM part of IAM?", "Yes. PAM is a specialist area within identity and access management that focuses on administrator, service and emergency accounts."],
      ["What is just-in-time access?", "Privileged rights that are granted only when needed, after approval, and removed automatically when a time limit ends, so nobody holds admin access all the time."],
      ["Is the Rolevara PAM track available now?", "It is in early access. The free IAM Ops shift is available now and covers the lifecycle and approval skills PAM builds on."],
    ],
  },
  {
    slug: "joiner-mover-leaver-process", eyebrow: "How-to", updated: "2026-10-02",
    title: "The joiner, mover, leaver process explained",
    lead: "Joiner, mover, leaver (JML) is the backbone of identity and access management. Here is what happens at each stage, the mistakes that cause audit findings and incidents, and how to practise it.",
    sections: [
      { h: "Joiners",
        p: ["A joiner is a new hire. HR creates the record, and IAM provisions the accounts and access that the role needs, based on an access matrix or role definition, not on what a coworker happens to have.",
          "Common mistakes: copying a coworker's access, provisioning before the HR record is final, and granting access that needs separate approval without recording it."] },
      { h: "Movers",
        p: ["A mover changes job, department or manager. The new access is added and, just as important, the old access is removed. Movers who keep old access build up toxic combinations that break separation of duties.",
          "Common mistakes: adding the new access but leaving the old, and changing groups without updating job data that downstream systems depend on."] },
      { h: "Leavers",
        p: ["A leaver's accounts are disabled on time, sessions are revoked, and access is removed. Termination timeliness is one of the controls auditors test most often.",
          "Common mistakes: disabling the account but leaving active sessions, missing accounts outside the main directory, and leaving contractor accounts with no expiry date. Enabled accounts that should have been disabled are a common entry point for password spraying."] },
      { h: "Practise JML on a realistic queue",
        p: ["In Rolevara you work joiner, mover, leaver, rehire and leave-of-absence tickets against a fictional company's access matrix. Each ticket is graded on the account state afterwards and on the process: verification, approval and order of steps. Miss a step and the requester replies, or the gap returns later as a security incident."] },
    ],
    practice: { text: "Work joiner, mover and leaver tickets and see how each one is graded.", href: "/app/", label: "Try JML tickets" },
    faq: [
      ["What does JML stand for in IAM?", "Joiner, mover, leaver: the three lifecycle events that drive account creation, access changes and account removal."],
      ["Who owns the joiner, mover, leaver process?", "HR owns the trigger (the employment change), managers approve the access, and the IAM team carries out and records the changes."],
      ["What do auditors test in the JML process?", "Usually that new access was approved before it was granted, that leavers were disabled within the policy time limit, and that the evidence supports both."],
    ],
  },
  {
    slug: "user-access-review", eyebrow: "How-to", updated: "2026-10-02",
    title: "How to run a user access review",
    lead: "A user access review (UAR), also called access certification or recertification, checks that people still need the access they have. Here is how a review works, what auditors look for, and how to practise one.",
    sections: [
      { h: "The steps of a user access review",
        list: [
          "Define the scope: which applications, roles or privileged groups, and the population as of a set date.",
          "Send each reviewer (usually the manager or application owner) the list of access to certify.",
          "Reviewers keep or revoke each item, with a reason for anything unusual.",
          "IAM removes the revoked access and records when it was done.",
          "Follow up on items nobody reviewed. Unreviewed access is a finding, not a pass.",
          "Keep the evidence: the population, the decisions, who made them and the removal tickets.",
        ] },
      { h: "What auditors check",
        p: ["Auditors test completeness (was the full population reviewed), accuracy (was the list pulled from the real system), timeliness (were revocations done) and independence (nobody certifies their own access).",
          "Rubber-stamping, where a reviewer approves everything without looking, is the most common weakness. Look for reviews completed in seconds or with no revocations at all."] },
      { h: "Practise both sides",
        p: ["In Rolevara, access reviews show up as tickets on the IAM side, and as an access-review completeness test (UAR-01) on the GRC side. Working both shows you how a small shortcut in the review becomes an audit finding."] },
    ],
    practice: { text: "Run access reviews and audit them on a realistic company, free.", href: "/app/", label: "Start practising" },
    faq: [
      ["How often should user access reviews run?", "Commonly every quarter for privileged and financially significant access, and every six or twelve months for everything else. Follow the policy and framework that apply."],
      ["What is the difference between an access review and an access audit?", "The review is the control the business runs. The audit tests whether that review was complete, accurate and acted on."],
      ["Is a user access review the same as recertification?", "Yes. Access review, access certification and recertification are used for the same control."],
    ],
  },
  {
    slug: "entra-okta-aws-iam-practice-labs", eyebrow: "Hands-on", updated: "2026-10-02",
    title: "Practise Microsoft Entra ID, Okta and AWS IAM in a free tenant",
    lead: "Employers want hands-on time in the identity platforms they run. This guide covers how to get a free practice environment for each, and what to practise once you have one.",
    sections: [
      { h: "Free practice environments",
        list: [
          "Microsoft Entra ID: an Azure free account or a Microsoft 365 developer tenant.",
          "Okta: a free Okta Integrator org.",
          "AWS IAM: a free-tier AWS account, ideally with a budget alert set before you start.",
        ] },
      { h: "What to practise",
        list: [
          "Joiner, mover, leaver and rehire changes in a real directory.",
          "Disabling accounts and revoking sessions for a leaver.",
          "Group-based access that matches the role, provisioned from an access matrix.",
          "Least-privilege tokens and read-only access for checks and reporting.",
          "Scripting the changes safely: PowerShell with Microsoft Graph, or CloudFormation for AWS.",
        ] },
      { h: "Rolevara platform labs",
        p: ["Rolevara platform labs (early access, part of Pro + Labs) seed your own free tenant with the fictional Pacific Crest directory. You work the tickets in the real Entra admin center, Okta Admin Console or AWS IAM console, then a read-only check grades your work ticket by ticket. Each lab also produces a GitHub portfolio project.",
          "The labs are optional. The simulator itself runs in the browser and needs no tenant."] },
    ],
    practice: { text: "See what each lab covers, and how the grading works.", href: "/labs/", label: "Explore the labs" },
    faq: [
      ["Can you practise Microsoft Entra ID for free?", "Yes. An Azure free account or a Microsoft 365 developer tenant gives you an Entra ID directory to practise in."],
      ["Which certification matches Entra ID practice?", "Microsoft SC-300 (Identity and Access Administrator) covers Entra ID administration."],
      ["Do the Rolevara labs need paid licences?", "No. Each lab runs in a free tenant or free-tier account you own."],
    ],
  },
];

export const guideHref = (g: Guide) => `/guides/${g.slug}/`;
