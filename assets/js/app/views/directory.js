// Directory console: searchable, sortable account table with an account detail panel.
import { S, U } from "../../engine/store.js";
import { ROLES, ALL_GROUPS, fmtDay } from "../../engine/company.js";
import { TK } from "../../engine/tickets.js";
import { h, ui, userPills, lastTxt, plural } from "../ui.js";

const STATUS = [["all","All statuses"],["enabled","Enabled"],["disabled","Disabled"],["locked","Locked"],["prehire","Pre-hire"],["contractor","Contractors"],["service","Service accounts"]];
const statusOk = (u, s) => s === "all" || (s === "enabled" && u.enabled) || (s === "disabled" && !u.enabled && !u.preHire) || (s === "locked" && u.locked) || (s === "prehire" && u.preHire) || (s === "contractor" && u.type === "Contractor") || (s === "service" && u.type === "Service");
const COLS = [["name","Name"],["title","Job"],["last","Last sign-in"],["status","Status"]];
const sorters = {
  name: (a, b) => a.name.localeCompare(b.name),
  title: (a, b) => (a.dept + a.title).localeCompare(b.dept + b.title) || a.name.localeCompare(b.name),
  last: (a, b) => (b.last ?? -1) - (a.last ?? -1) || a.name.localeCompare(b.name), // oldest sign-in first
  status: (a, b) => (a.enabled - b.enabled) || (b.locked - a.locked) || a.name.localeCompare(b.name),
};

export function render(r){
  const sel = r.id && S.users[r.id] ? r.id : null;
  const q = ui.dirQ.trim().toLowerCase();
  const depts = ["All", ...new Set(Object.values(S.users).map(u => u.dept))];
  const list = Object.values(S.users).filter(u => (ui.dirDept === "All" || u.dept === ui.dirDept) && statusOk(u, ui.dirStatus)
    && (!q || u.name.toLowerCase().includes(q) || u.id.includes(q) || u.empId.toLowerCase().includes(q) || u.title.toLowerCase().includes(q)));
  const { key, dir } = ui.dirSort;
  list.sort((a, b) => dir * sorters[key](a, b));
  const th = ([k, l]) => `<th scope="col" aria-sort="${key === k ? (dir > 0 ? "ascending" : "descending") : "none"}"><button class="sortbtn" data-a="dirSort" data-k="${k}">${l}<span aria-hidden="true">${key === k ? (dir > 0 ? " ▲" : " ▼") : ""}</span></button></th>`;
  const rows = list.map(u => `<tr ${sel === u.id ? 'aria-selected="true"' : ""}>
      <td><div class="who"><a class="name" href="#/directory/${encodeURIComponent(u.id)}" ${sel === u.id ? 'aria-current="page"' : ""}>${h(u.name)}</a><span class="mono muted" style="font-size:12px">${h(u.id)}</span></div></td>
      <td>${h(u.title)}<div class="muted" style="font-size:12px">${h(u.dept)}</div></td>
      <td class="num" style="white-space:nowrap">${lastTxt(u.last)}</td>
      <td><span class="pills">${userPills(u) || '<span class="pill ok">Active</span>'}</span></td></tr>`).join("");

  return `<div class="page-h"><h1>Directory</h1><p>Pacific Crest's identity directory: ${Object.keys(S.users).length} accounts. Search, filter, then open an account to change it.</p></div>
  <div class="dir ${sel ? "has-detail" : ""}">
    <div class="dlist">
      <div class="control-row" role="search">
        <div class="field" style="flex:2 1 220px"><label for="dir-q">Search</label><input type="search" id="dir-q" data-input="dirQ" value="${h(ui.dirQ)}" placeholder="Name, username, employee ID or title" autocomplete="off"></div>
        <div class="field" style="flex:1 1 150px"><label for="dir-dept">Department</label><select id="dir-dept" data-change="dirDept">${depts.map(d => `<option ${d === ui.dirDept ? "selected" : ""}>${h(d)}</option>`).join("")}</select></div>
        <div class="field" style="flex:1 1 150px"><label for="dir-st">Status</label><select id="dir-st" data-change="dirStatus">${STATUS.map(([k, l]) => `<option value="${k}" ${k === ui.dirStatus ? "selected" : ""}>${l}</option>`).join("")}</select></div>
      </div>
      <div class="spread"><p class="muted" style="font-size:14px" role="status">${plural(list.length, "account", "accounts")}${q || ui.dirDept !== "All" || ui.dirStatus !== "all" ? " match" : ""}</p>
        ${q || ui.dirDept !== "All" || ui.dirStatus !== "all" ? `<button class="btn quiet sm" data-a="dirClear">Clear filters</button>` : ""}</div>
      ${list.length ? `<div class="tablewrap"><table><caption class="sr-only">Accounts, sorted by ${COLS.find(c => c[0] === key)[1]}</caption><thead><tr>${COLS.map(th).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`
        : `<div class="panel empty"><h2>No accounts match</h2><p>Try a shorter search, or <button class="linkbtn" data-a="dirClear">clear the filters</button>.</p></div>`}
    </div>
    ${sel ? `<div class="udetail-wrap">${detail(sel)}</div>` : ""}
  </div>`;
}

function detail(id){
  const u = U(id);
  const avail = ALL_GROUPS.filter(g => !u.groups.includes(g));
  const at = S.active && S.tickets[S.active] && S.tickets[S.active].status === "working" ? TK[S.active] : null;
  return `<article class="panel pad udetail" aria-labelledby="u-h">
    <a class="backlink" href="#/directory">← Directory</a>
    ${at ? `<div class="callout acc">Changes are logged against <a class="mono" href="#/queue/${at.id}">${at.id}</a>: ${h(at.title)}</div>`
      : `<div class="callout warn"><b>No active ticket.</b> Changes you make now won't be tied to a ticket, and auditors will flag them. <a href="#/queue">Start a ticket first</a>.</div>`}
    <div class="ticket-h"><div class="pills">${userPills(u) || '<span class="pill ok">Active</span>'}</div><h2 id="u-h" data-panel-focus>${h(u.name)}</h2><div class="meta"><span>${h(u.title)}</span><span>${h(u.dept)}</span></div></div>
    <dl class="kv">
      <dt>Username</dt><dd class="mono">${h(u.id)}@pacificcrest.co</dd>
      <dt>Employee ID</dt><dd class="mono">${h(u.empId)}</dd>
      <dt>Manager</dt><dd>${h(u.mgr)}</dd>
      <dt>Account type</dt><dd>${u.type}</dd>
      <dt>Status</dt><dd>${u.enabled ? "Enabled" : "Disabled"}${u.locked ? " · Locked (too many failed sign-ins)" : ""}</dd>
      <dt>Last sign-in</dt><dd>${lastTxt(u.last)}</dd>
      <dt>Account expires</dt><dd>${u.expiry === null ? "Never" : fmtDay(u.expiry) + " (" + u.expiry + " days)"}</dd>
      <dt>MFA</dt><dd>${u.mfa ? "Microsoft Authenticator (registered)" : u.mfaReset ? "Reset: re-registration required" : "Not registered"}</dd>
      <dt>Credential</dt><dd>${u.pwReset ? "Temporary password issued" : "Set by user"}${u.revoked ? " · Sessions revoked" : ""}</dd>
    </dl>
    <section class="sec" aria-labelledby="ua-h"><h3 id="ua-h">Account</h3>
      <div class="btns">${u.enabled ? `<button class="btn danger" data-a="act" data-op="disable" data-uid="${id}">Disable</button>` : `<button class="btn" data-a="act" data-op="enable" data-uid="${id}">Enable</button>`}
        ${u.locked ? `<button class="btn" data-a="act" data-op="unlock" data-uid="${id}">Unlock</button>` : ""}</div>
      ${u.locked ? "" : '<p class="muted" style="font-size:12px">Not locked, so there\'s nothing to unlock.</p>'}</section>
    <section class="sec actgroup" aria-labelledby="uc-h"><h3 id="uc-h">Credentials and sessions</h3>
      <div class="btns"><button class="btn" data-a="act" data-op="pwreset" data-uid="${id}">Reset password</button><button class="btn" data-a="act" data-op="mfareset" data-uid="${id}">Reset MFA</button><button class="btn" data-a="act" data-op="revoke" data-uid="${id}">Revoke sessions</button></div>
      <p class="note">These can't be undone. The user has to set up a new password or MFA method.</p></section>
    <section class="sec" aria-labelledby="ug-h"><h3 id="ug-h">Group memberships (${u.groups.length})</h3>
      <div class="grps">${u.groups.length ? u.groups.slice().sort().map(g => `<div class="grp"><span class="mono">${g}</span><button class="btn quiet sm" data-a="rmgrp" data-g="${g}" data-uid="${id}" aria-label="Remove ${g}">Remove</button></div>`).join("") : '<p class="muted" style="font-size:14px">No memberships.</p>'}</div>
      <div class="control-row"><div class="field"><label for="addg">Add a group</label><select id="addg">${avail.map(g => `<option>${g}</option>`).join("")}</select></div><button class="btn" data-a="addgrp" data-uid="${id}">Add</button></div></section>
    <section class="sec" aria-labelledby="uj-h"><h3 id="uj-h">Job info</h3>
      <div class="control-row"><div class="field"><label for="job">Department / title</label><select id="job">${Object.keys(ROLES).map(k => `<option value="${k}" ${k === u.dept + "|" + u.title ? "selected" : ""}>${k.replace("|", " / ")}</option>`).join("")}</select></div><button class="btn" data-a="job" data-uid="${id}">Update job info</button></div>
      <p class="muted" style="font-size:12px">Updating job info doesn't change group memberships.</p></section>
    <section class="sec" aria-labelledby="ux-h"><h3 id="ux-h">Account expiry</h3>
      <div class="control-row"><div class="field" style="flex:0 1 200px"><label for="exp">Days from today</label><input type="number" id="exp" min="0" max="365" inputmode="numeric"></div><button class="btn" data-a="expiry" data-uid="${id}">Set expiry</button></div>
      <p class="muted" style="font-size:12px">Enter 0 to remove the expiry.</p></section>
  </article>`;
}
