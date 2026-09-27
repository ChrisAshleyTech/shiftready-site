// GRC audit desk: audit tasks and control definitions (ported from the original simulator).
import { S } from "../../engine/store.js";
import { G, GK, gQs, gTotals } from "../../engine/grc.js";
import { h, checksHtml, num } from "../ui.js";

export function render(r){
  const tabs = `<div class="segmented" role="group" aria-label="Audit desk sections"><a href="#/grc" ${r.id!=="controls"?'aria-current="page"':""}>Audit tasks</a><a href="#/grc/controls" ${r.id==="controls"?'aria-current="page"':""}>Controls &amp; definitions</a></div>`;
  const head = `<div class="page-h"><h1>GRC audit desk</h1><p>You're the IT auditor for Pacific Crest's Q3 SOX cycle. Test the access controls, judge what you find, and write it up. Task 4 audits your own IAM shift.</p></div>`;
  if (r.id === "controls") return head + tabs + `<div style="margin-top:16px">${controls()}</div>`;
  return head + tabs + `<div style="margin-top:16px">${tasks(r.id)}</div>`;
}

function tasks(sel){
  const tt = gTotals();
  let intro = "";
  if (tt.done === G.length) {
    const msg = tt.pct>=90?"Workpapers are review-ready.":tt.pct>=75?"Solid fieldwork. Go back over the items you missed.":"Retry the tasks you missed before sign-off.";
    intro = `<div class="callout acc" style="margin-bottom:16px"><b>Fieldwork complete: ${tt.pct}%.</b> ${msg}</div>`;
  }
  const list = G.map((g,i)=>{const gs=S.grc[g.id]||{}; const lk=g.lock&&g.lock(); return `<a class="tk ${gs.checks?"done":""}" href="#/grc/${g.id}" ${sel===g.id?'aria-current="page"':""}>
    <span class="pri">${i+1}</span><span><span class="t" style="display:block">${h(g.title)}</span><span class="s" style="display:block"><span class="mono">${g.ctrl}</span> · ${g.kind==="table"?g.rows.length+" items to test":"Judgment"}</span></span>
    <span class="pills">${gs.checks?`<span class="pill ok">Submitted</span><span class="pill mono">${gs.score}/${gs.max}</span>`:lk?'<span class="pill">Locked</span>':'<span class="pill">Open</span>'}</span></a>`;}).join("");
  return intro + `<div class="queue ${sel?"has-detail":""}"><div class="qlist" aria-label="Audit tasks">${list}</div>
    <div class="qdetail">${sel && GK[sel] ? task(sel) : '<div class="panel empty"><h2>Pick a task</h2><p>Work them in order. Later tasks build on earlier findings.</p></div>'}</div></div>`;
}

function task(id){
  const g=GK[id], gs=S.grc[id]||(S.grc[id]={}), done=!!gs.checks, lk=g.lock&&g.lock();
  let s=`<article class="panel pad ticket" aria-labelledby="gt-h"><a class="backlink" href="#/grc">← Audit tasks</a>
    <div class="ticket-h"><div class="row-inline"><span class="pill acc mono">${g.ctrl}</span>${done?'<span class="pill ok">Submitted</span>':""}</div><h2 id="gt-h" data-panel-focus>${h(g.title)}</h2></div>
    <div class="body-text">${g.intro}</div>`;
  if(g.evidence) s+=`<div class="callout"><h4>Evidence</h4><dl class="kv">${g.evidence.map(([k,v])=>`<dt>${h(k)}</dt><dd>${h(v)}</dd>`).join("")}</dl></div>`;
  if(lk) return s+`<div class="callout warn">${h(lk)} <a href="#/queue">Go to the queue</a></div></article>`;
  if(done){
    s+=`<section class="sec"><h3>Grade</h3><div class="scorebig">${gs.score}/${gs.max}</div>${checksHtml(gs.checks)}</section>
      <div class="lesson"><b>Takeaway.</b> ${h(g.lesson)}</div>
      <div class="btns"><button class="btn" data-a="grcRetry" data-gid="${id}">Retry this task</button></div>`;
    return s+`</article>`;
  }
  const d=gs.draft||{};
  s+=`<form class="stack" id="gform-${id}" data-submit="grcSubmit" data-gid="${id}" novalidate>`;
  if(g.kind==="table"){
    s+=`<section class="sec"><h3>Test each item</h3><div class="srows">${g.rows.map((r,i)=>`<div class="srow">
      <div class="t">${i+1}. ${h(r.name)} <span class="muted" style="font-weight:400">· ${h(r.sub)}</span></div>
      <dl class="kv">${r.kv.map(([k,v])=>`<dt>${h(k)}</dt><dd${k==="Groups granted"?' class="mono" style="font-size:12px"':""}>${h(v)}</dd>`).join("")}</dl>
      <div class="field"><label for="g-${id}-r${i}">Result for ${h(r.name)}</label><select id="g-${id}-r${i}" data-change="grcDraft" data-gid="${id}"><option value="">Select result</option>${g.opts.map((o,j)=>`<option value="${j}" ${d[i]===j?"selected":""}>${h(o)}</option>`).join("")}</select></div></div>`).join("")}</div></section>`;
  } else {
    const qs=gQs(g,gs);
    if(g.dynamic) s+=`<div class="row-inline"><span class="muted" style="font-size:14px">Evidence snapshot of your log: ${S.log.length} entries.</span><button type="button" class="btn sm" data-a="grcRefresh" data-gid="${id}">Refresh snapshot</button></div>`;
    s+=qs.map((q,i)=>`<fieldset><legend>${h(q.q)}</legend>${
      q.num?`<label class="sr-only" for="g-${id}-q${i}">${h(q.short)}</label><input type="number" id="g-${id}-q${i}" data-change="grcDraft" data-gid="${id}" min="0" style="width:140px" value="${d[i]??""}">`
      :q.opts.map((o,j)=>`<label class="opt"><input type="${q.multi?"checkbox":"radio"}" name="g-${id}-q${i}" value="${j}" data-change="grcDraft" data-gid="${id}" ${(q.multi?(d[i]||[]).includes(j):d[i]===j)?"checked":""}><span>${h(o)}</span></label>`).join("")}</fieldset>`).join("");
  }
  s+=`<div id="gerr-${id}" role="alert"></div><div class="btns"><button class="btn primary" type="submit">Submit workpaper</button></div></form>`;
  return s+`</article>`;
}

function controls(){
  const C_=[["APD-01","New user provisioning","Access is approved by the user's manager before provisioning and limited to the role's birthright groups.","Per event · Manual · Preventive"],
    ["APD-02","Timely terminations","Accounts are disabled within one business day of the HR termination date.","Per event · Manual · Preventive"],
    ["APD-03","Change authorization","Every account change references an approved ticket. Caller identity is verified before any credential change.","Per event · Manual · Preventive"],
    ["UAR-01","Quarterly access review","Managers certify all directory accounts, including contractors and service accounts, each quarter. Revocations are completed within 5 business days.","Quarterly · Manual · Detective"],
    ["VEN-01","Vendor oversight","SOC reports for critical vendors are reviewed each year, including exceptions, gap coverage, subservice providers and user entity controls.","Annual · Manual · Detective"]];
  return `<div class="stack lg">
    <div class="tablewrap"><table><caption class="sr-only">Controls in scope</caption><thead><tr><th scope="col">Control</th><th scope="col">Description</th><th scope="col">Attributes</th></tr></thead><tbody>${C_.map(c=>`<tr><td><span class="mono">${c[0]}</span><div>${c[1]}</div></td><td>${c[2]}</td><td class="muted">${c[3]}</td></tr>`).join("")}</tbody></table></div>
    <section class="panel pad stack"><h2 style="font-size:var(--fs-lg)">Deficiency levels (SOX)</h2><ul style="margin:0;padding-inline-start:20px;max-width:80ch">
      <li><b>Control deficiency:</b> a control's design or operation doesn't prevent or detect misstatements on a timely basis.</li>
      <li><b>Significant deficiency:</b> less severe than a material weakness, but important enough to merit the attention of those overseeing financial reporting.</li>
      <li><b>Material weakness:</b> a reasonable possibility that a material misstatement won't be prevented or detected on a timely basis.</li></ul>
      <p class="muted" style="font-size:14px">Weigh the likelihood and size of a possible misstatement, the systems involved, and whether compensating controls operate.</p></section>
    <section class="panel pad stack"><h2 style="font-size:var(--fs-lg)">Finding format</h2><p><b>Condition</b> (what you found, with numbers) · <b>Criteria</b> (the requirement) · <b>Cause</b> (why it happened) · <b>Effect</b> (the risk or impact) · <b>Recommendation</b> (a fix that addresses the cause).</p></section>
  </div>`;
}
