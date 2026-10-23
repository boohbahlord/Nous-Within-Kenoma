/* ---------- v72c: the Rule book: every rule of the All Rules page by its code (rebuilt in v74e) ----------
   The All Rules page gives every part a code, numbers and letters by turns (3, 3.B, 3.B.4, 3.B.4.c). The Rule book fetches
   that page when it is first opened (nothing before).
   v74e: All Rules (top left, outside fullscreen; Rule book in the fullscreen pause menu) opens the Rule book's window. It
   starts on the sections, 1 to 13; a section opens into its letters and entries; an entry opens on its own. The button at
   the top left goes back to the entry's section, and from there back to every section. While the window is open Space goes
   forward and Shift+Space back, and neither ends the turn; closing it (× or Esc) gives the keys back. The search bar finds a
   rule by its code (5.C) or by any words in it (Joker). A fold in Help (below Further explanations) and a fold at the bottom
   of the page are options (off by default), in the window, in the folds and in Settings, and work the same way. */
let RB=null,rbLoading=null;
const rbText=el=>(el.textContent||"").replace(/\s+/g," ").trim();
function rbTitle(el){const c=el.cloneNode(true);c.querySelectorAll(".rcode").forEach(x=>x.remove());
  if(/^H[2-4]$/.test(el.tagName))return rbText(c);const b=c.querySelector("b");const t=b&&c.firstElementChild===b?rbText(b):rbText(c);return t.length>80?t.slice(0,78)+"…":t}
async function rbLoad(){if(RB)return RB;if(!rbLoading)rbLoading=fetch("ethers-crossroads-rules.html").then(r=>{if(!r.ok)throw new Error("HTTP "+r.status);return r.text()}).then(t=>{
    const d=new DOMParser().parseFromString(t,"text/html"),main=d.querySelector("main");if(!main)throw new Error("no rules");
    main.querySelectorAll("script,nav.rindex,.totop,.rtools").forEach(e=>e.remove());
    RB=[...main.querySelectorAll("[data-rcode]")].map(el=>{const c=el.cloneNode(true);c.querySelectorAll(".rcode").forEach(x=>x.remove());const b=c.querySelector("b");
      return {code:el.dataset.rcode,id:el.id,lv:el.dataset.rcode.split(".").length,head:/^H[2-4]$/.test(el.tagName),named:!!b&&c.firstElementChild===b,title:rbTitle(el),el}});
    RB.forEach((e,i)=>{e.i=i;let up=null;for(let j=i-1;j>=0;j--)if(RB[j].head&&RB[j].lv<e.lv){up=RB[j];break}e.up=up?up.title:"";e.wtitle=e.head||e.named?e.title:e.up||e.title});   // an unnamed entry's window bears its section's name
    return RB})
    .catch(e=>{rbLoading=null;throw e});
  return rbLoading}
const rbSec=e=>e.code.split(".")[0];
const rbSecs=()=>RB.filter(e=>e.lv===1);
const rbAt=code=>RB.findIndex(x=>x.code===code||x.id===code);
/* what a rule says: an entry, or a heading's own words with the headings under it listed */
function rbBody(e){const el=e.el;let html="";const got=[];
  if(!e.head){const c=el.cloneNode(true);c.querySelectorAll(":scope>.rcode").forEach(x=>x.remove());html=c.innerHTML}
  else if(el.tagName==="H4"&&el.parentElement&&el.parentElement.matches(".subst")){const c=el.parentElement.cloneNode(true);c.querySelector("h4").remove();html=c.innerHTML}
  else{let n=el.nextElementSibling;while(n&&!/^H[2-4]$/.test(n.tagName)){html+=n.outerHTML;got.push(n);n=n.nextElementSibling}
    const kids=RB.filter(x=>x.head&&x.lv===e.lv+1&&x.code.startsWith(e.code+".")&&!got.some(g=>g.contains(x.el)));
    if(kids.length)html+=`<ul class="rbkids">${kids.map(k=>`<li><button type="button" class="link rbent" data-rbopen="${esc(k.code)}"><b>${esc(k.code)}</b> ${esc(k.title)}</button></li>`).join("")}</ul>`}
  return html.replace(/href="#([^"]+)"/g,(m,id)=>RB.some(x=>x.id===id)?`href="#" data-rbgo="${id}"`:`href="ethers-crossroads-rules.html#${id}" target="_blank" rel="noopener"`)}
/* the search: a code, or every word typed somewhere in the rule */
function rbFind(q){const v=q.trim().toLowerCase();if(!v)return [];
  const byCode=RB.filter(e=>e.code.toLowerCase()===v||e.code.toLowerCase().startsWith(v+"."));if(byCode.length)return byCode.slice(0,60).map(e=>({e,snip:""}));
  const words=v.split(/\s+/).filter(w=>w.length>1);if(!words.length)return [];
  const hits=[];for(const e of RB){const t=e.title.toLowerCase();if(e.txt==null){const c=e.el.cloneNode(true);c.querySelectorAll(".rcode").forEach(y=>y.remove());e.txt=rbText(c)}const x=e.txt,lx=x.toLowerCase();
    if(!words.every(w=>t.includes(w)||lx.includes(w)))continue;
    const k=lx.indexOf(words[0]),a=Math.max(0,k-48),snip=k<0||x.length<=e.title.length+3?"":(a?"…":"")+x.slice(a,k+90)+(k+90<x.length?"…":"");   // no snippet when the title already says it all
    hits.push({e,snip,score:words.filter(w=>t.includes(w)).length*3+(e.head?0:1)})}
  return hits.sort((a,b)=>b.score-a.score||a.e.i-b.e.i).slice(0,60)}
const rbMark=(s,q)=>{let h=esc(s);for(const w of q.trim().toLowerCase().split(/\s+/).filter(w=>w.length>1).sort((a,b)=>b.length-a.length)){const re=new RegExp("("+esc(w).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+")","gi");h=h.replace(re,"<mark>$1</mark>")}return h};
/* where each place is: the window, the fold in Help, the fold at the bottom of the page */
const RBV={};
const rbState=pl=>RBV[pl]||(RBV[pl]={v:"top",sec:null,i:-1,q:""});
const rbEnt=(k,cls)=>`<button type="button" class="link rbent${cls?" "+cls:""}" data-rbopen="${esc(k.code)}"><b>${esc(k.code)}</b> ${esc(k.title)}</button>`;
function rbViewHTML(pl){const s=rbState(pl);
  if(s.q.trim()){const hits=rbFind(s.q);return `<p class="rbwhere dim">${hits.length?`${hits.length}${hits.length===60?"+":""} rule${hits.length>1?"s":""} found`:"No rule matches. Try fewer words, or a code like 5.C."}</p>
<ul class="rbhits">${hits.map(h=>`<li>${rbEnt(h.e)}${h.snip?`<small>${rbMark(h.snip,s.q)}</small>`:""}</li>`).join("")}</ul>`}
  if(s.v==="sec"){const S=RB.find(e=>e.code===s.sec),kids=RB.filter(e=>e.code.startsWith(s.sec+"."));
    return `<h3 class="rbh"><span class="rbc">${esc(S.code)}</span> ${esc(S.title)}</h3><p class="rbwhole">${rbEnt({code:S.code,title:"The whole section, from its first words"},"rbfirst")}</p>
<ul class="rbsecl">${kids.map(k=>`<li class="lv${Math.min(4,k.lv)}${k.head?" hd":""}">${rbEnt(k)}</li>`).join("")}</ul>`}
  if(s.v==="rule"){const e=RB[s.i],prev=RB[s.i-1],next=RB[s.i+1];
    return `<p class="rbcode">Rule ${esc(e.code)}${!e.head&&e.named&&e.up?` · ${esc(e.up)}`:""}</p><h3 class="rbh">${esc(e.wtitle)}</h3>
<div class="rbtext">${rbBody(e)||'<p class="dim">This heading gathers the rules listed under it.</p>'}</div>
<p class="rbnav">${prev?`<button type="button" class="btn ghost sm" data-rbopen="${esc(prev.code)}">‹ ${esc(prev.code)}</button>`:"<span></span>"} <a class="link" href="ethers-crossroads-rules.html#${esc(e.id)}" target="_blank" rel="noopener">On the rules page</a> ${next?`<button type="button" class="btn ghost sm" data-rbopen="${esc(next.code)}">${esc(next.code)} ›</button>`:"<span></span>"}</p>`}
  return `<ul class="rbtop">${rbSecs().map(e=>{const n=RB.filter(x=>x.lv===2&&x.code.startsWith(e.code+".")).length;
    return `<li><button type="button" class="rbsecb" data-rbsec="${esc(e.code)}"><b>${esc(e.code)}</b><span>${esc(e.title)}</span>${n?`<small>${n} part${n>1?"s":""}</small>`:""}</button></li>`}).join("")}</ul>`}
function rbBackHTML(pl){const s=rbState(pl);if(s.q.trim())return `<button type="button" class="btn ghost sm rbback" data-rbclear="1">‹ Back</button>`;
  if(s.v==="rule"){const S=RB.find(e=>e.code===s.sec);return `<button type="button" class="btn ghost sm rbback" data-rbto="sec" title="Back to section ${esc(S.code)}">‹ ${esc(S.code)} ${esc(S.title)}</button>`}
  if(s.v==="sec")return `<button type="button" class="btn ghost sm rbback" data-rbto="top" title="Back to every section">‹ Every section</button>`;
  return `<span class="rbwhere dim">Every section, 1 to ${rbSecs().length}</span>`}
const rbOptsHTML=()=>`<details class="rbopts"><summary>Options</summary>
<label class="rbchk"><input type="checkbox" data-rbpref="rbHelp" ${PREF.rbHelp?"checked":""}><span>A Rule book fold in Help, below Further explanations</span></label>
<label class="rbchk"><input type="checkbox" data-rbpref="rbFoot" ${PREF.rbFoot?"checked":""}><span>A Rule book fold at the bottom of the page</span></label>
<p class="dim">All Rules at the top left always opens the Rule book's window (Ctrl+click it for the page). Settings has these two as well. <a class="link" href="ethers-crossroads-rules.html" target="_blank" rel="noopener">The All Rules page</a></p></details>`;
function rbHTML(pl){const win=pl==="win";
  return `<div class="rbbar">${rbBackHTML(pl)}${win?`<button type="button" class="xclose" data-rbclose="1" aria-label="Close the Rule book">×</button>`:""}</div>
<div class="rbfindrow"><input type="search" class="rbq" value="${esc(rbState(pl).q)}" placeholder="Find a rule: a code (5.C) or any words (Joker)" aria-label="Find a rule by its code or its words">${rbOptsHTML()}</div>
${win?`<p class="rbkeys">Space: forward · Shift+Space: back · they don't end your turn while this is open; × or Esc closes it</p>`:""}
<div class="rbview">${rbViewHTML(pl)}</div>`}
const rbHost=pl=>pl==="win"?$("#rbwin .rbbox"):pl==="help"?$("#info details.rbhelp .rbbody"):$("#rbfoot .rbbody");
function rbPaint(pl,keepFocus){const h=rbHost(pl);if(!h||!RB)return;const openOpts=!!(h.querySelector(".rbopts")||{}).open;
  h.innerHTML=rbHTML(pl);if(openOpts)h.querySelector(".rbopts").open=true;
  const v=h.querySelector(".rbview");if(v)v.scrollTop=0;if(pl==="win"&&!keepFocus)h.focus({preventScroll:true})}
function rbViewOnly(pl){const h=rbHost(pl);if(!h)return;const v=h.querySelector(".rbview"),b=h.querySelector(".rbbar");if(v)v.innerHTML=rbViewHTML(pl);
  if(b){const x=b.querySelector(".xclose");b.innerHTML=rbBackHTML(pl);if(x)b.appendChild(x)}}
function rbGo(pl,to){const s=rbState(pl);s.q="";
  if(to==="top"){s.v="top";s.sec=null}else if(to==="sec"){s.v="sec"}
  else{const i=typeof to==="number"?to:rbAt(to);if(i<0)return;s.v="rule";s.i=i;s.sec=rbSec(RB[i])}
  rbPaint(pl);if(pl!=="win"){const h=rbHost(pl);if(h){const r=h.getBoundingClientRect();if(r.top<0)h.scrollIntoView({block:"start"})}}}
/* Space forward, Shift+Space back: the sections, a section's list, then rule by rule */
function rbStep(pl,d){if(!RB)return;const s=rbState(pl);if(s.q.trim())return;   // not loaded yet (or no connection): nothing to step through
  if(s.v==="top"){if(d>0){s.sec=rbSecs()[0].code;rbGo(pl,"sec")}return}
  if(s.v==="sec"){if(d>0)rbGo(pl,rbAt(s.sec));else rbGo(pl,"top");return}
  const j=s.i+d;if(j>=0&&j<RB.length)rbGo(pl,j);else if(j<0)rbGo(pl,"sec")}   // back from the first rule: its section's list, as on the way in
/* one set of handlers per place, on the place itself */
function rbWire(host,pl){if(host.dataset.rbw===pl)return;host.dataset.rbw=pl;
  host.addEventListener("click",ev=>{const t=ev.target.closest("[data-rbopen],[data-rbsec],[data-rbto],[data-rbgo],[data-rbclear],[data-rbclose]");if(!t||!host.contains(t))return;ev.preventDefault();
    const s=rbState(pl);
    if(t.dataset.rbclose){rbClose();return}
    if(t.dataset.rbclear){s.q="";rbPaint(pl);return}
    if(t.dataset.rbsec){s.sec=t.dataset.rbsec;rbGo(pl,"sec");return}
    if(t.dataset.rbto){rbGo(pl,t.dataset.rbto);return}
    rbGo(pl,t.dataset.rbopen||t.dataset.rbgo)});
  host.addEventListener("input",ev=>{if(!ev.target.matches(".rbq"))return;rbState(pl).q=ev.target.value;rbViewOnly(pl)});
  host.addEventListener("keydown",ev=>{if(ev.target.matches(".rbq")&&ev.key==="Enter"){const b=host.querySelector(".rbview [data-rbopen]");if(b){ev.preventDefault();b.click()}}});
  host.addEventListener("change",ev=>{const k=ev.target.dataset&&ev.target.dataset.rbpref;if(!k)return;PREF[k]=ev.target.checked;savePrefs();rbSync()})}
/* the window */
function rbClose(){const w=$("#rbwin");if(w)w.hidden=true;const a=rbClose.from;rbClose.from=null;if(a&&a.isConnected)a.focus({preventScroll:true})}
function rbWin(code){let w=$("#rbwin");
  if(!w){w=document.createElement("div");w.id="rbwin";w.className="faov";w.innerHTML=`<div class="ovbox wide rbbox" role="dialog" aria-modal="true" aria-label="Rule book" tabindex="-1"></div>`;document.body.appendChild(w);
    w.addEventListener("click",ev=>{if(ev.target===w)rbClose()})}
  rbClose.from=document.activeElement;w.hidden=false;const box=w.querySelector(".rbbox");
  if(!RB){box.innerHTML=`<p class="dim">Opening the rule book…</p>`;box.focus({preventScroll:true})}
  rbLoad().then(()=>{rbWire(box,"win");if(code)rbGo("win",code);else rbPaint("win")}).catch(()=>{box.innerHTML=`<button type="button" class="xclose" aria-label="Close">×</button><p class="dim">The rule book could not be opened (no connection?). <a class="link" href="ethers-crossroads-rules.html" target="_blank" rel="noopener">All Rules</a></p>`;box.querySelector(".xclose").onclick=rbClose})}
const rbOpen=code=>rbWin(code);
const rbWinOpen=()=>{const w=$("#rbwin");return !!w&&!w.hidden};
const rbAbove=()=>{const p=$("#pop");return !!p&&!p.hidden&&p.getClientRects().length>0&&p.innerHTML.trim()!==""};   // a popup over the rule book takes the keys
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&rbWinOpen()&&!rbAbove()){rbClose();e.stopPropagation();e.preventDefault()}},true);
window.addEventListener("keydown",e=>{if(!rbWinOpen())return;const nx=kmIs(e,"rbNext");if(!nx&&!kmIs(e,"rbPrev"))return;   // v78d: Space and Shift+Space, as bound
  const a=document.activeElement;if(a&&a.matches&&(typing(a)||a.matches("input[type=checkbox],input[type=radio],summary")&&$("#rbwin").contains(a)))return;   // v78j: typing()   // typing a space; ticking an option or opening a fold in the book
  if(rbAbove())return;   // a popup over the book: Space is its own
  e.preventDefault();e.stopImmediatePropagation();rbStep("win",nx?1:-1)},true);
/* the folds: in Help below Further explanations, and at the bottom of the page; each an option */
function rbMount(box,pl){if(!box)return;rbWire(box,pl);if(RB){rbPaint(pl);return}box.innerHTML='<p class="dim">Opening the rule book…</p>';
  rbLoad().then(()=>rbPaint(pl)).catch(()=>{box.innerHTML='<p class="dim">The rule book could not be opened (no connection?). <a class="link" href="ethers-crossroads-rules.html" target="_blank" rel="noopener">All Rules</a></p>'})}
function rbSync(){const info=$("#info");
  if(info){let d=info.querySelector("details.rbhelp");
    if(PREF.rbHelp&&!d){d=document.createElement("details");d.className="cinfo rbook rbhelp";d.innerHTML=`<summary>Rule book</summary><div class="rbbody"></div>`;
      const fe=[...info.querySelectorAll("details.cinfo")].find(x=>{const s=x.querySelector(":scope>summary");return s&&s.textContent.trim()==="Further explanations"});
      if(fe)fe.after(d);else info.appendChild(d)}
    else if(!PREF.rbHelp&&d)d.remove()}
  let f=$("#rbfoot");const main=$("main.game");
  if(PREF.rbFoot&&!f&&main){f=document.createElement("details");f.id="rbfoot";f.className="cinfo rbook rbfootd";f.innerHTML=`<summary>Rule book</summary><div class="rbbody"></div>`;main.appendChild(f)}
  else if(!PREF.rbFoot&&f)f.remove();
  for(const pl of ["win","help","foot"]){const h=rbHost(pl);if(h&&h.querySelector(".rbopts"))h.querySelectorAll("[data-rbpref]").forEach(i=>i.checked=!!PREF[i.dataset.rbpref])}}
document.addEventListener("toggle",e=>{const d=e.target;if(!d||!d.matches||!d.open)return;if(d.matches("details.rbhelp"))rbMount(d.querySelector(".rbbody"),"help");else if(d.matches("#rbfoot"))rbMount(d.querySelector(".rbbody"),"foot")},true);
{const _mi=mountInfo;mountInfo=function(){_mi.apply(this,arguments);rbSync()}}
/* All Rules at the top left opens the window (Ctrl+click, or a middle click, still opens the page) */
document.addEventListener("click",e=>{const a=e.target.closest&&e.target.closest('.crumbs a[href="ethers-crossroads-rules.html"]');if(!a||!a.closest("main.game"))return;
  if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button)return;e.preventDefault();e.stopPropagation();rbWin()},true);   // before the leave-the-game guard: the window doesn't leave
/* the fullscreen pause menu: Rule book beside Help */
{const _fp=fsPause;fsPause=function(){_fp.apply(this,arguments);const h=$("#fsHelpB");if(!h||$("#fsRbB"))return;
  h.insertAdjacentHTML("afterend",`<button type="button" class="btn ghost" id="fsRbB">Rule book</button>`);$("#fsRbB").onclick=()=>rbWin()}}
/* Settings: the two folds */
{const _om=openMenu;openMenu=function(){_om.apply(this,arguments);const m=$("#menu"),a=m&&m.querySelector("#mCtl");if(!a||m.querySelector("#mRbHelp"))return;
  const sel=(id,t,on)=>`<label class="f">${t} <select id="${id}"><option value="0" ${on?"":"selected"}>Off (default)</option><option value="1" ${on?"selected":""}>On</option></select></label>`;
  a.closest("label").insertAdjacentHTML("afterend",sel("mRbHelp","Rule book fold in Help",PREF.rbHelp)+sel("mRbFoot","Rule book fold at the bottom",PREF.rbFoot));
  $("#mRbHelp").onchange=e=>{PREF.rbHelp=e.target.value==="1";savePrefs();rbSync()};$("#mRbFoot").onchange=e=>{PREF.rbFoot=e.target.value==="1";savePrefs();rbSync()}}}

if(window.__EC)Object.assign(window.__EC,{rbLoad:()=>rbLoad(),rbOpen:c=>rbOpen(c),rbWin:c=>rbWin(c),rbMount:(b,p)=>rbMount(b,p),rbSync:()=>rbSync(),rbStep:(p,d)=>rbStep(p,d),rbFind:q=>rbFind(q),rbState:p=>rbState(p)});
