/* ---------------- v41: Field Automation ----------------
   A person can hand the cards on their field to the computer: moves, attacks and ambushes. The hand, placing cards, spells,
   sacrifices and everything else stay theirs. Before a game the Rules tab sets it for the table: Off (the button isn't there), or
   how well it plays (Easy, Medium by default, Hard); online, the host's choice holds for everyone.
   In the game: a small "Auto field" button by the turn buttons (it asks first, the X counts as No), and a small square beside it
   that opens its settings. The field moves at the end of your prep phase (after you place and cast) and attacks at the start of
   your attack phase; the stacks it doesn't control are yours to move and attack with as usual.
   The settings, top to bottom: the simple modes; Attack (always on); Stance; Ambush; then, for every option: Rush, Formation,
   Lives, Picking battles, Target bases (with walls that don't block the way ignored), which cards it controls ("Yes, and…" adds
   single kinds of card), Hierarchical control (the order in which these principles win when they pull apart; two can be made
   equal, and then the state of the field decides between them), and the same controls under the field instead of a window. */

const FA_PRINC=[["stance","Stance"],["rush","Rush"],["lives","Lives"],["battles","Picking battles"],["formation","Formation"],["bases","Target bases"],["ambush","Ambush"]];
const FA_CATS=[["soldiers","Soldiers","Grunts, Infantry, Puppets"],["specials","Specials","Jacks, Queens, Kings, Jokers, Assassins"],["support","Support","Scouts, Healers, Repairmen, Rams, Miners"],
  ["ranged","Ranged","Archers and Cannons"],["wildcards","Wildcards","the Substances' own cards"]];
const FA_KINDS=["grunt","infantry","puppet","jack","queen","king","joker","assassin","scout","healer","repair","ram","miner","archer","cannon",
  "samson","antony","satan","bullgoat","goatbull","slavemaster","slave","leviathan","trafficker","debt"];
const FA_DEF={mode:"full",stance:"auto",rush:0,formation:"auto",lives:"balanced",battles:"normal",ambush:true,bases:false,walls:true,
  ctl:{soldiers:true,specials:true,support:true,miners:true,ranged:true,wildcards:true},extra:[],hier:false,order:FA_PRINC.map(p=>p[0]),eq:[],under:false};
const faClean=c=>{c=c&&typeof c==="object"?c:{};const o=JSON.parse(JSON.stringify(FA_DEF));
  for(const k of ["mode","stance","formation","lives","battles"])if(typeof c[k]==="string")o[k]=c[k];
  o.rush=Math.max(0,Math.min(9,Math.round(+c.rush||0)));for(const k of ["ambush","bases","walls","hier","under"])if(typeof c[k]==="boolean")o[k]=c[k];
  if(c.ctl)for(const k in o.ctl)if(typeof c.ctl[k]==="boolean")o.ctl[k]=c.ctl[k];
  if(Array.isArray(c.extra))o.extra=c.extra.filter(k=>FA_KINDS.includes(k));
  if(Array.isArray(c.order)&&c.order.length===FA_PRINC.length&&FA_PRINC.every(([k])=>c.order.includes(k)))o.order=[...c.order];
  if(Array.isArray(c.eq))o.eq=c.eq.filter(p=>Array.isArray(p)&&p.length===2&&p.every(k=>o.order.includes(k)));return o};
const faMine=()=>faClean(PREF.fa);   // this device's settings
const faAllowed=()=>!!G&&(G.opts.fieldAuto||"medium")!=="off";
const faLevel=()=>{const v=G&&G.opts.fieldAuto;return ["easy","medium","hard"].includes(v)?v:"medium"};
const faState=pl=>G&&G.p[pl]&&G.p[pl].fa||null;
const faOn=pl=>faAllowed()&&!!(faState(pl)&&faState(pl).on)&&!G.p[pl].cpu&&!isNPC(pl);
/* the simple modes narrow everything to a few choices */
function faEff(c){c=faClean(c);const d=JSON.parse(JSON.stringify(FA_DEF));
  if(c.mode==="full")return Object.assign(d,{mode:"full",under:c.under});
  if(c.mode==="mostly")return Object.assign(d,{mode:"mostly",stance:c.stance,ambush:c.ambush,under:c.under});
  if(c.mode==="attacks")return Object.assign(d,{mode:"attacks",ambush:false,under:c.under});
  return c}

/* ---------- which cards it controls ---------- */
const faKind=c=>c.unit||(c.puppet?"puppet":kind(c));
function faCat(c){const u=c.unit;if(u==="miner")return "miners";if(u&&UNIT[u]&&UNIT[u].shooter)return "ranged";if(["scout","healer","repair","ram"].includes(u))return "support";
  if(u==="assassin")return "specials";if(u)return "wildcards";if(c.puppet)return "soldiers";const k=kind(c);return k==="grunt"||k==="infantry"?"soldiers":"specials"}
function faControls(c,cfg){if(cfg.extra.includes(faKind(c)))return true;const k=faCat(c);return k==="miners"?cfg.ctl.support||cfg.ctl.miners:!!cfg.ctl[k]}

/* ---------- the hierarchy: higher principles pull harder; equals share a rank, and the field decides between them ---------- */
const FA_AGGR={stance:c=>({offensive:1,defensive:-1}[c.stance]||0),rush:c=>c.rush?1:0,lives:c=>({throw:1,preserve:-1}[c.lives]||0),
  battles:c=>({reckless:1,careful:-1}[c.battles]||0),formation:()=>0,bases:c=>c.bases?1:0,ambush:c=>c.ambush?-1:0};
function faScales(c,pl){const sc={};for(const [k] of FA_PRINC)sc[k]=1;if(!c.hier)return sc;
  const pairOf=k=>c.eq.find(p=>p.includes(k));let rank=0;const seen=new Set();
  for(const k of c.order){if(seen.has(k))continue;const p=pairOf(k);const grp=p?p:[k];for(const g of grp){seen.add(g);sc[g]=Math.max(.35,1-.15*rank)}rank++}
  // between two equals the field decides: behind, the more careful one leads; ahead, the bolder one
  const mine=stacksOf(pl).reduce((a,x)=>a+AI.value(x.st),0),foe=AI.enemyStacks(pl).reduce((a,x)=>a+AI.value(x.st),0),behind=mine<foe;
  for(const [a,b] of c.eq){const da=FA_AGGR[a](c),db=FA_AGGR[b](c);if(da===db)continue;const lead=(behind?da<db:da>db)?a:b;sc[lead]=Math.min(1,sc[lead]+.1)}
  return sc}
const faMix=(a,b,t)=>{const o={...a};for(const k of ["atk","def","dist","ally","ctr"])o[k]=(a[k]||0)*(1-t)+(b[k]||0)*t;return o};
const FA_CENTER={atk:1,def:.9,dist:.15,ally:.25,ctr:.6};
const faRushing=pl=>{const s=faState(pl);return !!(s&&s.cfg&&s.cfg.rush>0&&s.rushUntil!=null&&G.moon.round<=s.rushUntil)};
/* a Wall matters only when it stands between your field and an enemy base */
function faWallBlocks(pl,wr,wc){const bases=AI.enemyStacks(pl).filter(e=>hasBase(e.st)&&!hasK(e.st,"wall"));const mine=stacksOf(pl);
  const d=(a,b,c,e)=>Math.abs(a-c)+Math.abs(b-e);
  return bases.some(b=>d(wr,wc,b.r,b.c)<=2&&mine.some(m=>d(m.r,m.c,wr,wc)+d(wr,wc,b.r,b.c)<=d(m.r,m.c,b.r,b.c)+1))}
function faCtx(pl){
  const s=faState(pl),c=faEff(s&&s.cfg),sc=faScales(c,pl);
  let W={...AI.stance(pl)};
  const fixed={offensive:AI.W.OFF,defensive:AI.W.DEF,center:FA_CENTER}[c.stance];if(fixed)W=faMix(W,fixed,sc.stance);
  if(faRushing(pl))W=faMix(W,AI.W.PUSH,sc.rush);
  W.ally=(W.ally||0)+({wide:.5,deep:-.15}[c.formation]||0)*sc.formation;W.stack=({deep:.8,wide:-.1}[c.formation]||0)*sc.formation;
  const lv={preserve:1,balanced:0,throw:-1}[c.lives]||0;W.def=(W.def||0)*(1+.4*lv*sc.lives);
  const thrAdj=(lv>0?.12:lv<0?-.15:0)*sc.lives+({careful:.08,reckless:-.1}[c.battles]||0)*sc.battles;
  const ok=grp=>grp.length>0&&grp.every(x=>faControls(x,c));
  return {level:faLevel(),W,thrAdj,lossMul:1+.5*lv*sc.lives,moves:c.mode!=="attacks",ambushP:c.ambush?.7*sc.ambush:0,ok,
    okAtk:(st,o)=>o.card?faControls(o.card,c):ok(st.cards.filter(x=>!isBase(x))),
    gainMul:E=>{let m=1;if(c.bases&&hasBase(E)&&!hasK(E,"wall"))m*=1+sc.bases;
      if(c.walls&&hasK(E,"wall")){const at=AI.enemyStacks(pl).find(e=>e.st===E);if(at&&!faWallBlocks(pl,at.r,at.c))m*=1-.7*sc.bases}return m}}}

/* ---------- when it plays: the end of your prep phase (after you place and cast), the start of your attack phase ---------- */
async function faRun(pl,ph){if(!faOn(pl)||G.over)return;const was=G.busy;G.busy=true;render();
  try{await AI.field(pl,ph,faCtx(pl))}catch(e){console.error(e);log("Field automation stumbles: "+esc(e.message))}
  G.busy=was;render()}
{const _ap=actPhase;actPhase=async function(pl,ph){
  if(ph==="attack"&&faOn(pl))await faRun(pl,"attack");
  const out=await _ap.apply(this,arguments);
  if(ph==="prep"&&faOn(pl)&&!G.over&&G.active===pl)await faRun(pl,"prep");
  return out}}

/* ---------- switching it on and off (a joined player's choice travels to the host) ---------- */
function setFieldAuto(pl,on,cfg){
  if(!G||!G.p[pl]||isNPC(pl)||!faAllowed())return;if(NET.ctx!=null&&NET.ctx!==pl)return;
  const P=G.p[pl],prev=P.fa||{},c=faClean(cfg);P.fa={on:!!on,cfg:c,rushUntil:prev.rushUntil};
  if(c.rush>0&&(!prev.cfg||prev.cfg.rush!==c.rush||prev.rushUntil==null||G.moon.round>prev.rushUntil))P.fa.rushUntil=G.moon.round+c.rush-1;
  if(!c.rush)P.fa.rushUntil=null;
  if(!!prev.on!==!!on){log(`${plName(pl)} ${on?"hands the field to the computer (Field Automation on)":"takes the field back (Field Automation off)"}.`,"event");
    if(on&&G.active===pl&&G.phase==="attack"&&!G.busy)setTimeout(()=>{if(faOn(pl)&&G.active===pl&&G.phase==="attack")faRun(pl,"attack")},50)}
  render()}
/* this device's settings changed: keep them, and send them on if the automation is running */
function faSave(c){PREF.fa=faClean(c);savePrefs();const V=view(),s=faState(V);if(G&&s&&s.on)setFieldAuto(V,true,PREF.fa);paintFA()}

/* ---------- the question ---------- */
function faAsk(yes){let box=$("#faask");if(!box){box=document.createElement("div");box.id="faask";box.className="faov";document.body.appendChild(box)}
  box.innerHTML=`<div class="ovbox" role="alertdialog" aria-labelledby="faq"><button type="button" class="xclose" id="faX" aria-label="Close: no">×</button>
<h2 id="faq">Automate your field?</h2>
<p>The computer (${({easy:"Easy",medium:"Medium",hard:"Hard"})[faLevel()]}) moves and attacks with the cards on your field, following the settings in the small square beside the button: by default, every card, and it decides when to attack, defend or hold the center.</p>
<p class="dim">Your hand, placing cards, spells and sacrifices stay yours. It moves your field at the end of your prep phase and attacks at the start of your attack phase; turn it off any time.</p>
<p class="acts"><button type="button" class="btn" id="faY">Yes</button> <button type="button" class="btn ghost" id="faN">No</button></p></div>`;
  box.hidden=false;const close=()=>{box.hidden=true};$("#faY").onclick=()=>{close();yes()};$("#faN").onclick=close;$("#faX").onclick=close;$("#faN").focus()}
function faToggle(){const V=view(),s=faState(V);if(s&&s.on){setFieldAuto(V,false,faMine());return}faAsk(()=>setFieldAuto(V,true,faMine()))}

/* ---------- the settings, drawn the same in the window and under the field ---------- */
const faVal=(k,c)=>({stance:{auto:"Automatic",offensive:"Offensive",defensive:"Defensive",center:"Center"}[c.stance],rush:c.rush?`${c.rush} round${c.rush>1?"s":""}`:"Off",
  lives:{preserve:"Preserve",balanced:"Balanced",throw:"Throw them in"}[c.lives],battles:{careful:"Careful",normal:"Normal",reckless:"Reckless"}[c.battles],
  formation:{auto:"Automatic",wide:"Wide",deep:"Deep"}[c.formation],bases:c.bases?"On":"Off",ambush:c.ambush?"On":"Off"})[k];
function faPanelHTML(c,pl,pfx){
  const radio=(key,opts)=>`<div class="opts faopts">${opts.map(([v,t,s])=>`<label class="opt"><input type="radio" name="fa${pfx}-${key}" data-fa="${key}" value="${v}" ${c[key]===v?"checked":""}><span>${t}${s?`<small>${s}</small>`:""}</span></label>`).join("")}</div>`;
  const box=(path,on,t,s,dis)=>`<label class="chk"><input type="checkbox" data-fa="${path}" ${on?"checked":""} ${dis?"disabled":""}> <span><b>${t}</b>${s?`<small>${s}</small>`:""}</span></label>`;
  const sec=(t,body,cls="")=>`<section class="fasec ${cls}"><h4>${t}</h4>${body}</section>`;
  const s=pl!=null?faState(pl):null,left=s&&s.rushUntil!=null&&c.rush?Math.max(0,s.rushUntil-G.moon.round+1):null;
  const custom=c.mode==="custom",some=c.mode==="mostly"||custom;
  let h=sec("Simple mode",radio("mode",[["full","Fully automatic","It decides everything, offense, defense or the center (the default)"],["mostly","Mostly automatic","You choose the stance and ambushes"],
    ["attacks","Attacks only","It only attacks; you move every card"],["custom","Every option","Choose each setting yourself"]]),"famodes");
  h+=sec("Attack",box("",true,"Always on","Your field attacks enemies in sight when the odds say so.",true),"falock");
  if(some){h+=sec("Stance",radio("stance",[["auto","Automatic","Changes with the field"],["offensive","Offensive",""],["defensive","Defensive",""],["center","Control the center",""]]));
    h+=sec("Ambush",box("ambush",c.ambush,"Set ambushes","Assassins and face-down stacks with nothing in reach wait in ambush."))}
  if(custom){
    h+=sec("Rush the enemy",`<div class="farush">${box("rushon",c.rush>0,"Rush","Everything it controls goes for the enemy, whatever the stance.")}<span class="faspin"><button type="button" class="btn ghost sm" data-faact="rush-" aria-label="One round less">▼</button><b>${Math.max(1,c.rush)}</b><button type="button" class="btn ghost sm" data-faact="rush+" aria-label="One round more">▲</button> round${Math.max(1,c.rush)>1?"s":""}${left!=null?` <small class="dim">(${left?left+" left":"over"})</small>`:""}</span></div>`);
    h+=sec("Formation",radio("formation",[["auto","Automatic",""],["wide","Wide","Spread out, surround, take the advantage"],["deep","Deep","Columns: stack strength, even with fewer to stack with"]]));
    h+=sec("Lives",radio("lives",[["preserve","Preserve","Keep cards alive first"],["balanced","Balanced","The default"],["throw","Throw them in","Trade cards freely to hurt the enemy"]]));
    h+=sec("Picking battles",radio("battles",[["careful","Careful","Fights only with good odds"],["normal","Normal",""],["reckless","Reckless","Takes long shots"]])+`<p class="dim">Lives ranks above this unless you change the order below.</p>`);
    h+=sec("Bases",box("bases",c.bases,"Target bases","Enemy Aces and the Tree are worth more to it.")+box("walls",c.walls,"Don't count non-obstructive walls","A Wall only matters when it stands between your field and a base."));
    h+=sec("Which cards it controls",`<div class="facats">${FA_CATS.map(([k,t,s2])=>box("ctl."+k,c.ctl[k],t,s2)).join("")}${!c.ctl.support?box("ctl.miners",c.ctl.miners,"Miners","Even with Support off"):""}</div>
<details class="faextra" ${c.extra.length?"open":""}><summary>Yes, and… (add single kinds of card)</summary><div class="opts fakinds">${FA_KINDS.map(k=>`<label class="opt"><input type="checkbox" data-faextra="${k}" ${c.extra.includes(k)?"checked":""}><span>${esc(shortInfo(k))}</span></label>`).join("")}</div><p class="dim">These are added to the groups above, never taken away.</p></details>`);
    h+=sec("Hierarchical control",box("hier",c.hier,"Rank the principles","When they pull apart, the one on the left wins. Press = on two to make them equal: then the field decides between them.")+(c.hier?faHierHTML(c):""));
  }
  h+=sec("Where",box("under",c.under,"Show these controls under the field","A wide fold-down above Basics explained, instead of this window."));
  h+=`<p class="dim fanote">Some options aren't the best choice for every situation on your field.</p>`;
  return h}
function faHierHTML(c){const pend=faHierHTML.pending,pairOf=k=>c.eq.find(p=>p.includes(k));
  return `<div class="fahier">${c.order.map((k,i)=>{const p=pairOf(k);return `<div class="facol${p?" eqpair":pend===k?" eqwait":""}"><span class="farank">${i+1}</span><b>${FA_PRINC.find(x=>x[0]===k)[1]}</b><small>${faVal(k,c)}</small>
<span class="facolbtns"><button type="button" class="btn ghost sm" data-faact="up:${k}" aria-label="Higher priority" ${i?"":"disabled"}>▲</button><button type="button" class="btn ghost sm" data-faact="eq:${k}" aria-label="Equal" aria-pressed="${!!p||pend===k}">=</button><button type="button" class="btn ghost sm" data-faact="down:${k}" aria-label="Lower priority" ${i<c.order.length-1?"":"disabled"}>▼</button></span></div>`}).join("")}</div>`}
/* every change goes through here */
function faWire(root){
  const c=faMine();
  root.querySelectorAll("[data-fa]").forEach(i=>{const path=i.dataset.fa;if(!path)return;i.onchange=()=>{const c2=faMine();
    if(path==="rushon")c2.rush=i.checked?Math.max(1,c2.rush||1):0;
    else if(path.startsWith("ctl."))c2.ctl[path.slice(4)]=i.checked;
    else if(i.type==="checkbox")c2[path]=i.checked;else c2[path]=i.value;
    faSave(c2)}});
  root.querySelectorAll("[data-faextra]").forEach(i=>i.onchange=()=>{const c2=faMine(),k=i.dataset.faextra;c2.extra=c2.extra.filter(x=>x!==k);if(i.checked)c2.extra.push(k);faSave(c2)});
  root.querySelectorAll("[data-faact]").forEach(b=>b.onclick=()=>{const c2=faMine(),[a,k]=b.dataset.faact.split(":");
    if(a==="rush+"||a==="rush-"){c2.rush=Math.max(1,Math.min(9,(c2.rush||1)+(a==="rush+"?1:-1)));faSave(c2);return}
    const blocks=[];const seen=new Set();for(const x of c2.order){if(seen.has(x))continue;const p=c2.eq.find(q=>q.includes(x));const g=p?c2.order.filter(y=>p.includes(y)):[x];g.forEach(y=>seen.add(y));blocks.push(g)}
    const bi=blocks.findIndex(g=>g.includes(k));
    if(a==="up"&&bi>0)[blocks[bi-1],blocks[bi]]=[blocks[bi],blocks[bi-1]];
    if(a==="down"&&bi<blocks.length-1)[blocks[bi+1],blocks[bi]]=[blocks[bi],blocks[bi+1]];
    if(a==="eq"){const p=c2.eq.find(q=>q.includes(k));
      if(p){c2.eq=c2.eq.filter(q=>q!==p);faHierHTML.pending=null}
      else if(faHierHTML.pending&&faHierHTML.pending!==k&&!c2.eq.some(q=>q.includes(faHierHTML.pending))){const a2=faHierHTML.pending;faHierHTML.pending=null;c2.eq.push([a2,k]);
        // the second joins the first, side by side
        const fl=blocks.flat().filter(x=>x!==k);fl.splice(fl.indexOf(a2)+1,0,k);c2.order=fl;faSave(c2);return}
      else faHierHTML.pending=faHierHTML.pending===k?null:k}
    c2.order=blocks.flat();faSave(c2)})}
function faWindow(){let box=$("#facfg");if(!box){box=document.createElement("div");box.id="facfg";box.className="faov";document.body.appendChild(box)}
  box.hidden=false;paintFA()}
/* paint the window and the fold-down, wherever they are */
function paintFA(){const V=G?view():null,c=faMine();
  const w=$("#facfg");if(w&&!w.hidden){const sc=w.querySelector(".fabody")?w.querySelector(".fabody").scrollTop:0;
    w.innerHTML=`<div class="ovbox wide faconf" role="dialog" aria-labelledby="facq"><button type="button" class="xclose" id="facX" aria-label="Close">×</button><h2 id="facq">Configure field automation</h2><div class="fabody">${faPanelHTML(c,V,"w")}</div><p class="acts"><button type="button" class="btn" id="facOk">Done</button></p></div>`;
    w.querySelector(".fabody").scrollTop=sc;faWire(w);$("#facX").onclick=$("#facOk").onclick=()=>{w.hidden=true}}
  const info=$("#info");if(!info)return;let d=$("#fapanel");
  const want=!!(G&&!G.over&&faAllowed()&&c.under&&G.p[V]&&!G.p[V].cpu&&!isNPC(V));
  if(!want){if(d)d.remove();return}
  if(!d){d=document.createElement("details");d.id="fapanel";d.className="cinfo fapanel";if(PREF.faOpen)d.open=true;d.addEventListener("toggle",()=>{PREF.faOpen=d.open;savePrefs()});info.prepend(d)}
  const on=faOn(V);d.innerHTML=`<summary>Field automation · ${on?"On":"Off"}</summary><div class="fawide"><p><button type="button" class="btn ${on?"":"ghost"} sm" id="faTogU" aria-pressed="${on}">${on?"Turn it off":"Turn it on"}</button></p>${faPanelHTML(c,V,"u")}</div>`;
  faWire(d);$("#faTogU").onclick=faToggle}

/* ---------- the button by the turn buttons ---------- */
let faSig="";
{const _rd=render;render=function(){_rd.apply(this,arguments);if(!G)return;const ctl=$("#controls");const V=view();
  const show=faAllowed()&&!G.over&&G.phase!=="setup"&&G.p[V]&&!G.p[V].cpu&&!isNPC(V)&&!(NET.role==="guest"&&NET.watch);
  if(ctl&&show&&!ctl.querySelector(".fabar")){const on=faOn(V);
    ctl.insertAdjacentHTML("beforeend",`<span class="fabar"><button type="button" class="btn ${on?"":"ghost"} sm fatog" aria-pressed="${on}" title="The computer moves and attacks with the cards on your field">Auto field: ${on?"On":"Off"}</button><button type="button" class="btn ghost sm facfgb" title="Configure field automation" aria-label="Configure field automation">▦</button></span>`);
    ctl.querySelector(".fatog").onclick=faToggle;ctl.querySelector(".facfgb").onclick=faWindow}
  const sig=JSON.stringify([show,faOn(V),PREF.fa,G.moon.round]);if(sig!==faSig){faSig=sig;paintFA()}}}

/* ---------- the setup: Off, or how well it plays ---------- */
{const _ss=showStart;showStart=function(){const out=_ss.apply(this,arguments);const p=document.querySelector('.ovbox.setup .spanel[data-p="rules"]');
  if(p&&!$("#ofauto"))p.insertAdjacentHTML("beforeend",`<fieldset class="pf"><legend>Field Automation</legend><label class="f">Field Automation <select id="ofauto"><option value="off">Off</option><option value="easy">On · Easy</option><option value="medium" selected>On · Medium (default)</option><option value="hard">On · Hard</option></select></label><p class="dim">Lets a player hand the cards on their field to the computer during the game; their hand and spells stay theirs. Off hides the button for everyone.</p></fieldset>`);
  return out}}
{const _sg=startGame;startGame=function(opts){const s=$("#ofauto");if(opts&&s)opts.fieldAuto=s.value;return _sg.apply(this,arguments)}}

if(window.__EC)Object.assign(window.__EC,{setFieldAuto,faCtx,faRun,faWindow,faEff,FA_DEF});
