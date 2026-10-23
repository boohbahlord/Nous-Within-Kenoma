/* ---------- v72d: Automated Strategies: named Field Automation setups, saved on this device ----------
   At the bottom of Field Automation, a fold holds the saved strategies in a narrow list that scrolls. Pick one and tick
   "Use it" to switch Field Automation to it; change any setting afterwards and "Use it" unticks by itself, since the field
   no longer plays that strategy. Save the current settings into the picked one, or as a new one; rename, delete, or give
   it a place in the list (1 is the top). Send it to another person at the table (on this device or online): it waits in
   their own fold until they save it under a name of their choosing, which never overwrites one of theirs. */
const stList=()=>Array.isArray(PREF.strats)?PREF.strats:(PREF.strats=[]);
const stCfg=c=>{const o=faClean(c);delete o.under;return o};
const stSame=(a,b)=>JSON.stringify(stCfg(a))===JSON.stringify(stCfg(b));
const stNewId=()=>"s"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const stName=n=>String(n||"").replace(/\s+/g," ").trim().slice(0,40);
let stUI={sel:null,mode:null,inbox:null};
function stUse(id){const s=stList().find(x=>x.id===id);if(!s)return;PREF.stratOn=id;stUI.sel=id;faSave(Object.assign(stCfg(s.cfg),{under:faMine().under},s.cfg&&s.cfg.scope?{}:{scope:faMine().scope}))}   // a strategy saved before Soft Automate keeps the current choice
/* any other change: the strategy is no longer in use */
{const _fs=faSave;faSave=function(c){const out=_fs.apply(this,arguments);if(PREF.stratOn){const s=stList().find(x=>x.id===PREF.stratOn);if(!s||!stSame(s.cfg,PREF.fa)){PREF.stratOn=null;savePrefs();paintFA()}}return out}}
/* sending, through the game (the host keeps each person's inbox) */
function stSend(from,to,name,cfg){if(!G||!G.p[from]||!G.p[to]||G.p[to].cpu||isNPC(to)||NET.ctx!=null&&NET.ctx!==from||from===to)return false;
  const P=G.p[to];P.stInbox=(P.stInbox||[]).slice(-9);P.stInbox.push({from,name:stName(name)||"A strategy",cfg:stCfg(cfg)});
  log(`${plName(from)} sends ${plName(to)} an automated strategy, “${esc(stName(name))}”.`);render();return true}
function stTake(pl,i){if(!G||!G.p[pl]||NET.ctx!=null&&NET.ctx!==pl)return false;const L=G.p[pl].stInbox||[];if(i<0||i>=L.length)return false;L.splice(i,1);render();return true}
for(const [name,get,set] of [["stSend",()=>stSend,f=>stSend=f],["stTake",()=>stTake,f=>stTake=f]])netAny(name,get,set);
/* v73f: a copy's name: the name and the first number not taken (Jackal → Jackal1, again → Jackal2; Jackal2 → Jackal21) */
function copyName(name,names){const has=new Set(names);for(let k=1;;k++){const n=name+k;if(!has.has(n))return n}}
/* the fold */
function stHTML(){const L=stList(),V=G?view():null,sel=L.find(x=>x.id===stUI.sel)||null,on=PREF.stratOn,m=stUI.mode,inbox=G&&V!=null&&G.p[V]&&G.p[V].stInbox||[];
  const people=G&&V!=null?G.p.filter(P=>P.i!==V&&!P.cpu&&!isNPC(P.i)&&!P.out):[];
  let form="";
  if(m==="new"||m==="rename")form=`<p class="stform"><input type="text" class="stname" maxlength="40" aria-label="Its name" value="${esc(m==="rename"&&sel?sel.name:`Strategy ${L.length+1}`)}"> <button type="button" class="btn sm" data-st="${m}ok">${m==="new"?"Save":"Rename"}</button> <button type="button" class="btn ghost sm" data-st="cancel">Cancel</button></p>`;
  else if(m==="move"&&sel)form=`<p class="stform">Place it at <input type="number" class="stpos" min="1" max="${L.length}" value="${L.indexOf(sel)+1}" aria-label="Its place in the list"> of ${L.length} <button type="button" class="btn sm" data-st="moveok">Move</button> <button type="button" class="btn ghost sm" data-st="cancel">Cancel</button></p>`;
  else if(m==="del"&&sel)form=`<p class="stform">Delete “${esc(sel.name)}” for good? <button type="button" class="btn sm" data-st="delok">Delete</button> <button type="button" class="btn ghost sm" data-st="cancel">Keep it</button></p>`;
  else if(m==="send"&&sel)form=`<p class="stform">${people.length?`Send “${esc(sel.name)}” to ${people.map(P=>`<button type="button" class="btn ghost sm" data-stto="${P.i}">${esc(P.name)}</button>`).join(" ")}`:"No other person at this table to send it to."} <button type="button" class="btn ghost sm" data-st="cancel">Cancel</button></p>`;
  else if(m==="saveas"&&stUI.inbox!=null&&inbox[stUI.inbox]){const x=inbox[stUI.inbox];form=`<p class="stform">Save “${esc(x.name)}” as <input type="text" class="stname" maxlength="40" aria-label="Its name" value="${esc(stName(x.name+" (from "+(G.p[x.from]?G.p[x.from].name:"a player")+")"))}"> <button type="button" class="btn sm" data-st="saveasok">Save</button> <button type="button" class="btn ghost sm" data-st="cancel">Cancel</button></p>`}
  const rows=L.map((s,i)=>`<button type="button" role="option" aria-selected="${s.id===stUI.sel}" class="strowi${s.id===stUI.sel?" on":""}${s.id===on?" used":""}" data-stpick="${s.id}"><b>${i+1}</b><span>${esc(s.name)}</span>${s.id===on?"<em>in use</em>":""}</button>`).join("");
  return `<section class="fasec fafull fastrat"><h4>Automated Strategies</h4><details class="faextra stfold" ${PREF.stOpen||inbox.length?"open":""}><summary>Saved strategies <small class="dim">(${L.length}${inbox.length?` · ${inbox.length} sent to you`:""})</small></summary>
<div class="strow"><div class="stlist" role="listbox" aria-label="Saved strategies">${rows||'<p class="dim stnone">None yet: set Field Automation up, then Save as a new strategy.</p>'}</div>
<label class="stuse"><input type="checkbox" class="stusebox" ${sel&&on===sel.id?"checked":""} ${sel?"":"disabled"}> <span>Use it</span></label></div>
<p class="stacts"><button type="button" class="btn ghost sm" data-st="new">Save as a new strategy</button>${sel?` <button type="button" class="btn ghost sm" data-st="save">Save settings to it</button> <button type="button" class="btn ghost sm" data-st="rename">Rename</button> <button type="button" class="btn ghost sm" data-st="copy">Copy</button> <button type="button" class="btn ghost sm" data-st="move">Position</button> <button type="button" class="btn ghost sm" data-st="del">Delete</button>${people.length?` <button type="button" class="btn ghost sm" data-st="send">Send to…</button>`:""}`:""}</p>${form}
${inbox.length?`<div class="stinbox"><b>Sent to you</b>${inbox.map((x,i)=>`<p>“${esc(x.name)}” from ${esc(G.p[x.from]?G.p[x.from].name:"a player")} <button type="button" class="btn ghost sm" data-stin="${i}">Save as…</button> <button type="button" class="btn ghost sm" data-stdrop="${i}">Discard</button></p>`).join("")}</div>`:""}
<label class="f stsplit">When cards leave a stack of a group (guards, a guarded or defended area, a squadron; attackers always keep attacking) <select class="fgsplit"><option value="stay" ${faMine().grpSplit!=="leave"?"selected":""}>They stay in its group (default)</option><option value="leave" ${faMine().grpSplit==="leave"?"selected":""}>They leave the group</option></select></label>
<p class="dim">Groups: right-click one of your stacks (with the keys, ${esc(kmTipT("menu"))}) to send a stack to attack an enemy stack, set guards on a stack, guard or defend an area, form a squadron, or give a group or a stack one of these strategies.</p>
<p class="dim">Saved on this device. "Use it" unticks itself when you change a setting it doesn't hold.</p></details></section>`}
function stWire(root){const L=stList(),sel=L.find(x=>x.id===stUI.sel),go=()=>{savePrefs();paintFA()},val=c=>{const i=root.querySelector(c);return i?i.value:""};
  const fold=root.querySelector(".stfold");if(fold)fold.addEventListener("toggle",()=>{PREF.stOpen=fold.open;savePrefs()});
  root.querySelectorAll("[data-stpick]").forEach(b=>b.onclick=()=>{stUI.sel=b.dataset.stpick;if(stUI.mode!=="new")stUI.mode=null;paintFA()});
  const u=root.querySelector(".stusebox");if(u)u.onchange=()=>{if(!sel)return;if(u.checked)stUse(sel.id);else{PREF.stratOn=null;go()}};
  root.querySelectorAll("[data-st]").forEach(b=>b.onclick=()=>{const a=b.dataset.st,V=G?view():null;
    if(["new","rename","move","del","send"].includes(a)){stUI.mode=stUI.mode===a?null:a;paintFA();return}
    if(a==="cancel"){stUI.mode=null;stUI.inbox=null;paintFA();return}
    if(a==="copy"&&sel){const s={id:stNewId(),name:stName(copyName(sel.name,L.map(x=>x.name)))||sel.name,cfg:JSON.parse(JSON.stringify(sel.cfg)),at:Date.now()};L.splice(L.indexOf(sel)+1,0,s);stUI.sel=s.id;stUI.mode=null;flash(`Copied as “${s.name}”.`);go();return}
    if(a==="save"&&sel){sel.cfg=stCfg(faMine());sel.at=Date.now();PREF.stratOn=sel.id;flash(`Saved to “${sel.name}”.`);go();return}
    if(a==="newok"){const nm=stName(val(".stname"))||`Strategy ${L.length+1}`,s={id:stNewId(),name:nm,cfg:stCfg(faMine()),at:Date.now()};L.push(s);stUI.sel=s.id;stUI.mode=null;PREF.stratOn=s.id;go();return}
    if(a==="renameok"&&sel){sel.name=stName(val(".stname"))||sel.name;stUI.mode=null;go();return}
    if(a==="moveok"&&sel){const n=Math.max(1,Math.min(L.length,Math.round(+val(".stpos")||1)));L.splice(L.indexOf(sel),1);L.splice(n-1,0,sel);stUI.mode=null;go();return}
    if(a==="delok"&&sel){L.splice(L.indexOf(sel),1);if(PREF.stratOn===sel.id)PREF.stratOn=null;stUI.sel=null;stUI.mode=null;go();return}
    if(a==="saveasok"&&G&&V!=null){const x=(G.p[V].stInbox||[])[stUI.inbox];if(!x)return;const s={id:stNewId(),name:stName(val(".stname"))||x.name,cfg:stCfg(x.cfg),at:Date.now()};L.push(s);stUI.sel=s.id;
      const i=stUI.inbox;stUI.mode=null;stUI.inbox=null;savePrefs();stTake(V,i);flash(`Saved as “${s.name}”.`);paintFA();return}});
  root.querySelectorAll("[data-stto]").forEach(b=>b.onclick=()=>{if(!sel||!G)return;stSend(view(),+b.dataset.stto,sel.name,sel.cfg);stUI.mode=null;flash(`Sent “${sel.name}” to ${G.p[+b.dataset.stto].name}.`);paintFA()});
  root.querySelectorAll("[data-stin]").forEach(b=>b.onclick=()=>{stUI.inbox=+b.dataset.stin;stUI.mode="saveas";paintFA()});
  root.querySelectorAll("[data-stdrop]").forEach(b=>b.onclick=()=>{if(G)stTake(view(),+b.dataset.stdrop);paintFA()});
  const sp=root.querySelector(".fgsplit");if(sp)sp.onchange=()=>faSave(Object.assign(faMine(),{grpSplit:sp.value}))}
{const _fp=faPanelHTML;faPanelHTML=function(){return _fp.apply(this,arguments)+stHTML()}}
{const _fw=faWire;faWire=function(root){_fw.apply(this,arguments);if(root.querySelector(".fastrat"))stWire(root)}}

if(window.__EC)Object.assign(window.__EC,{stList:()=>stList(),stUse:id=>stUse(id),stSend:(...a)=>stSend(...a)});
