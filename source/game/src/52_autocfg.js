/* ---------------- v47: Configure Automation ----------------
   One window (and one fold-down under the field) for everything the computer can do for a person, in three tabs drawn the same
   way: the Field (Field Automation), Ritual Dice and Lazy Hand. The settings live on this device (localStorage "ec-prefs2":
   fa, rd, lh); during a game they travel to the player's seat, so they also work for a joined player.
   Ritual Dice: bought at the start of your prep phase, before Grave Blessing (whose auto switch it turns on), as often and as many
   as you set, only when the grave holds the kinds you ticked, only with mana to spare, never while you owe too much, on credit only
   if you allow it and down to the floor you set; it can buy extra to make up for an overdraw, or skip turns you overdrew.
   Lazy Hand: kinds it never places for you (you place them yourself), an option to place your hand by itself, and sacrifices from
   the hand of the kinds you tick, stopping at a full soul pile, or a set way into the surplus, or only while you are below zero. */

/* ---------- Ritual Dice settings ---------- */
const RD_KINDS=[["standard","Standard"],["special","Special"],["support","Support"],["wildcard","Wildcard"],["base","Base"]];
const RD_DEF={on:false,preset:"even",every:1,perTurn:1,kinds:[],minMana:3,counterOD:true,noOD:false,stopDebt:4,credit:false,creditStop:-3};
const RD_PRESETS=[
  ["miser","Rarely","Rarely: only with plenty to spare and something worth raising, never in debt.",{every:3,perTurn:1,kinds:["special","base"],minMana:6,counterOD:false,noOD:true,stopDebt:1,credit:false,creditStop:0}],
  ["accountant","Every other turn","Modest: one every other turn, never into debt.",{every:2,perTurn:1,kinds:[],minMana:4,counterOD:false,noOD:true,stopDebt:2,credit:false,creditStop:0}],
  ["even","Once a turn","Balanced: one a turn while there is mana to spare (the default).",{every:1,perTurn:1,kinds:[],minMana:3,counterOD:true,noOD:false,stopDebt:4,credit:false,creditStop:-3}],
  ["relic","Best cards, twice a turn","Spends big, but only when the grave holds treasure.",{every:1,perTurn:2,kinds:["special","wildcard","base"],minMana:2,counterOD:true,noOD:false,stopDebt:0,credit:false,creditStop:-3}],
  ["hunger","Twice a turn, on credit","Two a turn, on credit when it must.",{every:1,perTurn:2,kinds:[],minMana:1,counterOD:true,noOD:false,stopDebt:0,credit:true,creditStop:-3}],
  ["mad","As much as it can","Everything into the grave, down to the brink.",{every:1,perTurn:3,kinds:[],minMana:0,counterOD:true,noOD:false,stopDebt:0,credit:true,creditStop:-6}]];
const clampN=(v,a,b,d)=>{v=Math.round(+v);return Number.isFinite(v)?Math.max(a,Math.min(b,v)):d};
function rdClean(c){c=c&&typeof c==="object"?c:{};const o={...RD_DEF};
  for(const k of ["on","counterOD","noOD","credit"])if(typeof c[k]==="boolean")o[k]=c[k];
  if(typeof c.preset==="string")o.preset=c.preset;
  o.every=clampN(c.every??o.every,1,9,1);o.perTurn=clampN(c.perTurn??o.perTurn,1,6,1);o.minMana=clampN(c.minMana??o.minMana,0,30,3);
  o.stopDebt=clampN(c.stopDebt??o.stopDebt,0,30,4);o.creditStop=clampN(c.creditStop??o.creditStop,-6,0,-3);
  o.kinds=Array.isArray(c.kinds)?c.kinds.filter(k=>RD_KINDS.some(x=>x[0]===k)):[];return o}
const rdMine=()=>rdClean(PREF.rd);

/* ---------- Lazy Hand settings ---------- */
const LH_DEF={exclude:[],xextra:[],xminus:[],sminus:[],autoPlace:false,sac:false,skinds:[],sextra:[],notFull:true,surplus:0,maxSurplus:false,negOnly:false};
const LH_RANKS=["2","3","4","5","6","7","8","9","10","J","Q","K","A","JK"];
const LH_UNITS=["puppet","scout","healer","repair","ram","miner","claimer","archer","cannon","assassin","wall","tree","satan","carriage","samson","antony","bullgoat","goatbull","slavemaster","slave","leviathan","trafficker","debt"];   // v66: every card an Emanation can hold (the Tree, Satan, the Carriage too)
let lhKeysMemo=null;
function lhKeyList(){if(lhKeysMemo)return lhKeysMemo;
  lhKeysMemo=[...LH_RANKS.map(r=>{const k=kind(protoCard(r));return [r,r==="JK"?"Joker":/^\d+$/.test(r)?`${r} ${shortInfo(k)}`:shortInfo(k)]}),...LH_UNITS.filter(u=>INFO[u]).map(u=>[u,shortInfo(u)])];return lhKeysMemo}
function lhClean(c){c=c&&typeof c==="object"?c:{};const o={...LH_DEF},keys=new Set([...LH_RANKS,...LH_UNITS]),cats=new Set(RD_KINDS.map(x=>x[0]));
  for(const k of ["autoPlace","sac","notFull","maxSurplus","negOnly"])if(typeof c[k]==="boolean")o[k]=c[k];
  for(const k of ["exclude","skinds"])o[k]=Array.isArray(c[k])?c[k].filter(x=>cats.has(x)):[];
  for(const k of ["xextra","sextra","xminus","sminus"])o[k]=Array.isArray(c[k])?c[k].filter(x=>keys.has(x)):[];
  o.xminus=o.xminus.filter(x=>!o.xextra.includes(x));o.sminus=o.sminus.filter(x=>!o.sextra.includes(x));
  o.surplus=clampN(c.surplus??0,0,30,0);return o}
const lhMine=()=>lhClean(PREF.lh);
const cardCat=c=>{const k=cardClass(c).toLowerCase();return k==="demon"?"standard":k};
const cardKey=c=>c.puppet?"puppet":c.unit?c.unit:c.rank;
const lhExcluded=(c,cfg)=>{if(!cfg)return false;const k=cardKey(c);if((cfg.xminus||[]).includes(k))return false;return cfg.exclude.includes(cardCat(c))||cfg.xextra.includes(k)};
const lhSacs=(c,cfg)=>{const k=cardKey(c);if((cfg.sminus||[]).includes(k))return false;return cfg.skinds.includes(cardCat(c))||cfg.sextra.includes(k)};

/* ---------- the settings travel to the player's seat ---------- */
function setAutoCfg(pl,key,cfg){if(!G||!G.p[pl]||!["rdCfg","lhCfg"].includes(key))return;G.p[pl][key]=key==="rdCfg"?rdClean(cfg):lhClean(cfg)}
{NETFN.setAutoCfg={get:()=>setAutoCfg,set:f=>setAutoCfg=f,any:true};const orig=setAutoCfg;
  setAutoCfg=function(...a){if(NET.role!=="guest")return orig.apply(this,a);const rid=++NET.rid;sendHost({t:"cmd",fn:"setAutoCfg",args:netClean(a),ui:uiSnap(),rid})}}
const autoSent={};
function autoSync(){if(!G||G.over||NET.role==="guest"&&NET.seat==null)return;const V=view(),P=G.p[V];if(!P||P.cpu||isNPC(V))return;   // v78i: a joined player waits for their seat
  for(const [key,cfg] of [["rdCfg",rdMine()],["lhCfg",lhMine()]]){const j=JSON.stringify(cfg),k=V+key;if(autoSent[k]===j&&JSON.stringify(P[key])===j)continue;if(autoSent[k]===j&&NET.role==="guest")continue;autoSent[k]=j;setAutoCfg(V,key,cfg)}}
{const _r=render;render=function(){rSafe(_r,this,arguments);autoSync()}}

/* ---------- the window and the fold-down: three tabs ---------- */
let autoTab=["field","ritual","lazy"].includes(PREF.autoTab)?PREF.autoTab:"field";
function autoStatus(k){const V=G?view():null;if(k==="field")return V!=null&&G.p[V]&&faOn(V)?"On":"Off";if(k==="ritual")return rdMine().on?"On":"Off";const l=lhMine();return PREF.lazyAuto||l.autoPlace||l.sac?"On":"Off"}
const AUTO_TABS=[["field","Field"],["ritual","Ritual Dice"],["lazy","Lazy Hand"]];
function autoTabsHTML(){return `<div class="atabs fafull" role="tablist">${AUTO_TABS.map(([k,t])=>`<button type="button" class="stab${autoTab===k?" on":""}" data-atab="${k}" role="tab" aria-selected="${autoTab===k}">${t} <small>${autoStatus(k)}</small></button>`).join("")}</div>`}
function autoBodyHTML(pfx,under){const V=G?view():null;
  if(autoTab==="ritual")return rdPanelHTML(rdMine(),pfx);
  if(autoTab==="lazy")return lhPanelHTML(lhMine(),pfx);
  if(!faAllowed())return `<p class="dim fafull">Field Automation is off for this game (the Rules tab before a game).</p>`;
  const on=V!=null&&faOn(V);return `${under?`<p class="fafull"><button type="button" class="btn ${on?"":"ghost"} sm" id="faTogU" aria-pressed="${on}">${on?"Turn field automation off":"Turn field automation on"}</button></p>`:""}${faPanelHTML(faMine(),V,pfx)}`}
const whereHTML=pfx=>{const K=cfgKit("data-fa","data-faact","fa"+pfx);return K.sec("Where",K.row("under",faMine().under,"Show these controls under the field","A wide fold-down above Basics explained, with every tab."),"fafull fawhere")};
function wireAuto(root){
  root.querySelectorAll("[data-atab]").forEach(b=>b.onclick=()=>{autoTab=b.dataset.atab;PREF.autoTab=autoTab;savePrefs();paintFA()});
  faWire(root);rdWire(root);lhWire(root);const t=root.querySelector("#faTogU");if(t)t.onclick=faToggle}
faWindow=function(tab){if(typeof tab==="string")autoTab=tab;let box=$("#facfg");if(!box){box=document.createElement("div");box.id="facfg";box.className="faov";document.body.appendChild(box)}
  box.hidden=false;paintFA()};
paintFA=function(){const V=G?view():null,c=faMine();
  const w=$("#facfg");if(w&&!w.hidden){const sc=w.querySelector(".fabody")?w.querySelector(".fabody").scrollTop:0;
    w.innerHTML=`<div class="ovbox wide faconf" role="dialog" aria-labelledby="facq"><button type="button" class="xclose" id="facX" aria-label="Close">×</button><h2 id="facq">Configure Automation</h2>${whereHTML("w")}${autoTabsHTML()}<div class="fabody">${autoBodyHTML("w",false)}</div><p class="acts"><button type="button" class="btn" id="facOk">Done</button></p></div>`;
    w.querySelector(".fabody").scrollTop=sc;wireAuto(w);$("#facX").onclick=$("#facOk").onclick=()=>{w.hidden=true}}
  const info=$("#info");if(!info)return;let d=$("#fapanel");
  const want=!!(G&&!G.over&&c.under&&G.p[V]&&!G.p[V].cpu&&!isNPC(V));
  if(!want){if(d)d.remove();return}
  if(!d){d=document.createElement("details");d.id="fapanel";d.className="cinfo fapanel";if(PREF.faOpen)d.open=true;d.addEventListener("toggle",()=>{PREF.faOpen=d.open;savePrefs()});info.prepend(d)}
  d.innerHTML=`<summary>Configure Automation <span class="dim fasum">· Field ${autoStatus("field")} · Ritual Dice ${autoStatus("ritual")} · Lazy Hand ${autoStatus("lazy")} · Grave ${autoStatus("grave")}</span></summary><div class="fawide">${autoTabsHTML()}${autoBodyHTML("u",true)}</div>`;
  wireAuto(d)};

/* ---------- the Ritual Dice tab ---------- */
function rdPanelHTML(c,pfx){const K=cfgKit("data-rd","data-rdact","rd"+pfx),{row,spin,sec}=K,off=!c.on;
  let h=`<p class="dim fafull">At the start of your prep phase, before Grave Blessing (switching this on switches Grave Blessing's auto on too). Each Ritual Dice costs 1 mana and adds 3d6 to this turn's Grave Blessing. It is never bought when Grave Blessing can't be cast.</p>`;
  h+=sec("Playstyle",`<div class="opts faopts${off?" off":""}">${RD_PRESETS.map(([k,t,d])=>`<label class="opt"${K.tip(d)}><input type="radio" name="rd${pfx}-preset" data-rdpreset="${k}" ${c.preset===k?"checked":""} ${off?"disabled":""}><span>${t}${K.sm(d)}</span></label>`).join("")}<label class="opt"${K.tip(c.lastCustom?"Your own settings, as you last left them.":"Change any setting below and it becomes Custom.")}><input type="radio" name="rd${pfx}-preset" data-rdpreset="custom" ${c.preset==="custom"?"checked":""} ${off||!c.lastCustom&&c.preset!=="custom"?"disabled":""}><span>Custom${K.sm(c.lastCustom?"As you last left it.":"")}</span></label></div>`,
    "fafull","Sets everything below at once. Change any of it and it becomes Custom.");
  h+=sec("How often",spin("Every","1: every turn",c.every,"every",c.every>1?"turns":"turn",off)+spin("How many each time","Each one is 1 mana and 3d6.",c.perTurn,"perTurn","",off));
  h+=sec("Only when the grave holds",K.chips(RD_KINDS,c.kinds,"data-rdkind",off)+`<p class="dim">None ticked: whatever the grave holds.</p>`);
  h+=sec("Mana",spin("Only with at least","It buys only with this much mana to spare.",c.minMana,"minMana","mana",off)+
    spin("Stop while owing","Mana debt plus loans. 0: owing never stops it.",c.stopDebt?c.stopDebt:"0",`stopDebt`,c.stopDebt?"or more":"(never stops)",off));
  h+=sec("Overdraw",row("noOD",c.noOD,"Not on a turn with an overdraw","An overdraw cuts Grave Blessing's dice; this waits it out.",off)+row("counterOD",c.counterOD,"Buy extra to make up for overdraw","Enough more Ritual Dice to cover the dice an overdraw takes away.",off||c.noOD));
  h+=sec("Credit",row("credit",c.credit,"Buy on credit","When your mana runs short, the Bank's credit pays.",off)+spin("Stop buying on credit at","Your mana won't go below this to buy one.",c.creditStop,"creditStop","mana",off||!c.credit));
  return h}
function rdSave(c){c=rdClean(c);PREF.rd=c;if(c.on&&G){const V=view();if(G.p[V]&&!G.p[V].autoBless){setAutoBless(V,true)}PREF.autoBless=true}savePrefs();autoSync();paintFA();if(G)render()}
function rdWire(root){
  root.querySelectorAll("[data-rd]").forEach(i=>{const k=i.dataset.rd;if(!k)return;i.onchange=()=>{const c=rdMine();c[k]=i.checked;if(k!=="on")c.preset="custom";rdSave(c)}});
  root.querySelectorAll("[data-rdkind]").forEach(i=>i.onchange=()=>{const c=rdMine(),k=i.dataset.rdkind;c.kinds=c.kinds.filter(x=>x!==k);if(i.checked)c.kinds.push(k);c.preset="custom";rdSave(c)});
  root.querySelectorAll("[data-rdpreset]").forEach(i=>i.onchange=()=>{const p=RD_PRESETS.find(x=>x[0]===i.dataset.rdpreset);if(!p)return;rdSave({...rdMine(),...p[3],preset:p[0]})});
  root.querySelectorAll("[data-rdact]").forEach(b=>b.onclick=()=>{const c=rdMine(),v=b.dataset.rdact,k=v.slice(0,-1),d=v.endsWith("+")?1:-1;c[k]=(c[k]||0)+d;c.preset="custom";rdSave(c)})}

/* ---------- the Lazy Hand tab ---------- */
function lhPanelHTML(c,pfx){const K=cfgKit("data-lh","data-lhact","lh"+pfx),{row,spin,sec}=K,so=!c.sac;
  let h=`<p class="fawarn caution fafull"><b aria-hidden="true">⚠</b> Caution: Lazy Hand doesn't know the plan. When it plays the cards, check its moves now and then.</p>`;
  h+=sec("Lazy Hand",row("keep",PREF.lazyAuto===true,"Keep Lazy Hand on","Every card you click in your hand is placed for you (the spell's auto switch).")+
    row("autoPlace",c.autoPlace,"Place cards automatically","At the start of your prep phase it places every card it may, where the computer would play it."),"fafull");
  h+=sec("Never placed automatically",K.chips(RD_KINDS,c.exclude,"data-lhex")+`<details class="faextra" ${c.xextra.length||c.xminus.length?"open":""}><summary>Yes, and… (single kinds: + never placed for you, − placed for you even if its group is ticked)</summary>${K.pmChips(lhKeyList(),c.xextra,c.xminus,"data-lhxpm")}</details><p class="dim">You place these yourself, even with Lazy Hand on.</p>`,"fafull");
  h+=sec("Sacrifice from the hand",row("sac",c.sac,"Sacrifice cards by itself","At the start of your prep phase, before anything is spent: the kinds you tick here.")+K.chips(RD_KINDS,c.skinds,"data-lhsk",so)+
    `<details class="faextra" ${c.sextra.length||c.sminus.length?"open":""}><summary>Yes, and… (single kinds: + sacrificed, like the 2 Grunt; − never sacrificed)</summary>${K.pmChips(lhKeyList(),c.sextra,c.sminus,"data-lhspm",so)}</details>`+
    row("negOnly",c.negOnly,"Only while mana is below zero","It sacrifices until you are back at zero; the limits below don't apply.",so)+
    row("notFull",c.notFull,"Not when mana is full","It stops at your maximum, so nothing goes into the surplus.",so||c.negOnly)+
    (!c.notFull?row("maxSurplus",c.maxSurplus,"Up to the most surplus","As far as the soul pile allows.",so||c.negOnly)+spin("Up to this far into the surplus","",c.surplus,"surplus","mana",so||c.negOnly||c.maxSurplus):""),"fafull");
  return h}
function lhSave(c){PREF.lh=lhClean(c);savePrefs();autoSync();paintFA();if(G)render()}
function lhWire(root){
  root.querySelectorAll("[data-lh]").forEach(i=>{const k=i.dataset.lh;if(!k)return;i.onchange=()=>{if(k==="keep"){PREF.lazyAuto=i.checked;savePrefs();paintFA();if(G)render();return}const c=lhMine();c[k]=i.checked;lhSave(c)}});
  for(const [attr,pk,mk] of [["data-lhxpm","xextra","xminus"],["data-lhspm","sextra","sminus"]])
    root.querySelectorAll(`[${attr}]`).forEach(b=>b.onclick=()=>{const c=lhMine(),[p,m]=pmCycle(c[pk],c[mk],b.getAttribute(attr));c[pk]=p;c[mk]=m;lhSave(c)});
  for(const [attr,key] of [["data-lhex","exclude"],["data-lhsk","skinds"]])
    root.querySelectorAll(`[${attr}]`).forEach(i=>i.onchange=()=>{const c=lhMine(),k=i.getAttribute(attr);c[key]=c[key].filter(x=>x!==k);if(i.checked)c[key].push(k);lhSave(c)});
  root.querySelectorAll("[data-lhact]").forEach(b=>b.onclick=()=>{const c=lhMine(),v=b.dataset.lhact,k=v.slice(0,-1);c[k]=(c[k]||0)+(v.endsWith("+")?1:-1);lhSave(c)})}

/* ---------- what they do: at the start of a person's prep phase, sacrifices, Ritual Dice, Grave Blessing, then placing ---------- */
async function lhAutoSac(pl){const P=G.p[pl],c=P.lhCfg;if(!c||!c.sac||G.over)return;let n=0;
  for(const card of [...P.hand]){if(!sacrificeAllowed()||!canSacCard(card))continue;
    if(!lhSacs(card,c))continue;
    const hi=handSacRange(card)[1],m=mana(pl);
    if(c.negOnly){if(effMana(pl)>=0)break}
    else{const lim=c.notFull?soulCap(pl):c.maxSurplus?surCap(pl):Math.min(surCap(pl),soulCap(pl)+c.surplus);if(m+hi>lim)continue}
    if(sacrifice(card,"hand"))n++}
  if(n){log(`Lazy Hand sacrifices ${n} card${n>1?"s":""} from ${plName(pl)}'s hand.`);render();await sleep(250)}}
async function autoRitual(pl){const P=G.p[pl],c=P.rdCfg,sp=SP("ritual");if(!c||!c.on||!sp||G.over)return;
  const tn=tnOf(pl);if(c.every>1&&P.rdLast!=null&&tn-P.rdLast<c.every)return;
  if(c.kinds.length&&!G.grave.some(x=>c.kinds.includes(cardCat(x))))return;
  const od=P.od||0;if(c.noOD&&od>0)return;
  const aces=stacksOf(pl).filter(x=>hasK(x.st,"ace")).length,base=Math.min(6,1+aces),lost=Math.max(0,base-Math.min(base,blessCap(pl)));
  let n=c.perTurn+(c.counterOD&&lost>0?Math.ceil(lost/3):0),bought=0;
  for(let i=0;i<n;i++){if(G.over||!spellReady(sp))break;const cost=spellCost(sp);
    if(c.stopDebt>0&&debtOf(pl)+owedOf(pl)>=c.stopDebt)break;
    if(mana(pl)>=cost&&mana(pl)>=c.minMana){await cast(sp);bought++;continue}
    if(!c.credit||!bankOpen()||effMana(pl)-cost<c.creditStop)break;
    const was=P.credit;P.credit=true;try{await cast(sp)}finally{P.credit=was}bought++}
  if(bought){P.rdLast=tn;render()}}
async function lhAutoPlace(pl){const P=G.p[pl],c=P.lhCfg;if(!c||!c.autoPlace||G.over||G.phase!=="prep")return;let n=0;
  for(const card of [...P.hand]){if(lhExcluded(card,c)||!P.hand.includes(card))continue;const t=lazySpot(pl,card);if(!t||!canPlace(card,t[0],t[1]))continue;
    G.selHand=card;place(card,t[0],t[1]);G.selHand=null;n++;render();await sleep(220)}
  if(n)log(`Lazy Hand places ${n} card${n>1?"s":""} for ${plName(pl)}.`)}
{const _ab=autoBlessing;autoBlessing=async function(pl){const P=G.p[pl],me_=P&&!P.cpu&&!isNPC(pl);
  if(me_){await lhAutoSac(pl);await autoRitual(pl)}
  await _ab.apply(this,arguments);
  if(me_&&!G.over)await lhAutoPlace(pl)}}

/* ---------- the Ritual Dice row gets its settings button ---------- */
{const _sr=spellRow;spellRow=function(s,live){const h=_sr(s,live);if(!s||s.id!=="ritual"||!G)return h;const on=rdMine().on;
  return `<div class="spellrow"><button type="button" class="autotog cfgtog${on?" on":""}" id="rdCfg" aria-label="Ritual Dice automation" data-tip="Ritual Dice automation (${on?"on":"off"}): buy it for you, when and how much.">⚙︎</button>${h}</div>`}}
{const _rs=renderSpells;renderSpells=function(live){_rs(live);const b=$("#rdCfg");if(b)b.onclick=e=>{e.stopPropagation();faWindow("ritual")}}}
if(window.__EC)Object.assign(window.__EC,{rdMine,lhMine,autoRitual,lhAutoSac,lhAutoPlace,faWindow:t=>faWindow(t)});
