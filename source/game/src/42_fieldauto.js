/* ---------------- v41: Field Automation ----------------
   A person can hand the cards on their field to the computer: moves, attacks and ambushes. The hand, placing cards, spells,
   sacrifices and everything else stay theirs. Before a game the Rules tab sets it for the table: Off (the button isn't there), or
   how well it plays (Easy, Medium by default, Hard); online, the host's choice holds for everyone.
   In the game: a small "Auto field" button by the turn buttons (it asks first, the X counts as No), and a small square beside it
   that opens its settings. The field moves at the end of your prep phase (after you place and cast) and attacks at the start of
   your attack phase; the stacks it doesn't control are yours to move and attack with as usual.
   The settings, top to bottom: the simple modes (Fully automatic, Attacks only, Every option); Attack; Stance; Aggression (with
   Rush); Ambush; Formation (Wide: small groups; Tall: one army); Risk (v79g: Lives and Picking battles in one); Target bases
   (Walls that don't block the way are always ignored) and Focus on crystals (v71n: its
   options and its guards are in 80_crystals.js), which cards it controls ("Yes, and…" adds
   single kinds of card), Hierarchical control (the order in which these principles win when they pull apart; two can be made
   equal, and then the state of the field decides between them; Target bases and Focus on crystals can be taken out of it with
   their ×, and brought back with +), and the same controls under the field instead of a window. */

const FA_PRINC=[["noatk","Don't attack"],["stance","Stance"],["rush","Rush"],["risk","Risk"],["formation","Formation"],["bases","Target bases"],["crystals","Focus on crystals"],["ambush","Ambush"]];
const FA_CATS=[["soldiers","Soldiers","Grunts, Infantry, Puppets"],["specials","Specials","Jacks, Queens, Kings, Jokers, Assassins"],["support","Support","Scouts, Healers, Repairmen, Rams, Miners"],
  ["ranged","Ranged","Archers and Cannons"],["wildcards","Wildcards","the Emanations' own cards"]];
const FA_KINDS=["grunt","infantry","puppet","jack","queen","king","joker","assassin","scout","healer","repair","ram","miner","archer","cannon",
  "samson","antony","satan","bullgoat","goatbull","slavemaster","slave","leviathan","trafficker","debt"];
const FA_DEF={tgroup:true,tgorder:["wildcard","special","base","standard","support"],mode:"full",stance:"auto",rush:0,formation:"auto",risk:"normal",lives:"balanced",battles:"normal",ambush:true,bases:false,walls:true,
  ctl:{soldiers:true,specials:true,support:true,miners:true,ranged:true,wildcards:true},extra:[],hier:false,order:FA_PRINC.map(p=>p[0]),eq:[],under:false,
  noAttack:false,flee:false,tprio:false,torder:null,teq:[],tIgnoreGI:false,tSameGI:false,xminus:[],hill:true,hillHow:"army",grp:"normal",fLink:true,
  tWeak:false,tStk:{strongest:true,weakest:true,minority:true,majority:true},ambFocus:false,crys:false,crysStance:false,crysLives:false,crysMiner:false,crysAsk:false,crysHow:false,crysShow:true,crysFight:false,hout:[],scope:"full",grpSplit:"stay",aggr:true,aggrHow:"auto",aggrN:4};   // v79f: Aggression   // v71n: the crystals, and the principles taken out of the ranking
/* v47: the kinds of card the field can rank as targets, strongest first by default (suit doesn't matter) */
const FA_TK=[["wildcards","Wildcards"],["joker","Jokers"],["king","Kings"],["ace","Aces"],["queen","Queens"],["jack","Jacks"],["wall","Walls"],["tree","The Tree"],["assassin","Assassins"],
  ["cannon","Cannons"],["infantry","Infantry"],["archer","Archers"],["grunt","Grunts"],["puppet","Puppets"],["healer","Healers"],["repair","Repairmen"],["ram","Rams"],["miner","Miners"],["claimer","Claimers"],["scout","Scouts"]];
const FA_TKEYS=FA_TK.map(x=>x[0]);
const FA_OUT=["bases","crystals"];   // v71n: the principles that can be taken out of the ranking (× in it, + to bring them back)
const FA_RISK_LIVES={careful:"preserve",normal:"balanced",reckless:"throw"};
const faClean=c=>{c=c&&typeof c==="object"?c:{};const o=JSON.parse(JSON.stringify(FA_DEF));
  /* v79g: Lives and Picking battles are one setting, Risk; older settings and rankings come over (Lives or Picking battles
     where Risk now stands) */
  const one=a=>[...new Set(a.map(k=>k==="lives"||k==="battles"?"risk":k))];
  if(Array.isArray(c.order)&&c.order.some(k=>k==="lives"||k==="battles"))c={...c,order:one(c.order),eq:Array.isArray(c.eq)?c.eq.map(p=>Array.isArray(p)?one(p):p).filter(p=>Array.isArray(p)&&p.length===2):c.eq};
  for(const k of ["mode","stance","formation","lives","battles","hillHow","grp"])if(typeof c[k]==="string")o[k]=c[k];
  if(!FA_RISK_LIVES[c.risk]){const s=({throw:1,preserve:-1}[c.lives]||0)+({reckless:1,careful:-1}[c.battles]||0);o.risk=s<0?"careful":s>0?"reckless":"normal"}else o.risk=c.risk;
  o.lives=FA_RISK_LIVES[o.risk];o.battles=o.risk;
  if(o.formation==="auto"&&(c.grp==="big"||c.grp==="small"))o.formation=c.grp==="big"?"deep":"wide";   // v79g: Attack groups went into Formation (Tall: one army; Wide: small groups)
  if(o.mode==="mostly")o.mode="custom";   // v79g: Mostly automatic is gone
  o.grpSplit=c.grpSplit==="leave"?"leave":"stay";   // v78e: cards that leave a stack of a group stay in it, or leave it (96d_fagroups.js)
  o.scope=c.scope==="soft"?"soft":"full";
  if(typeof c.aggr==="boolean")o.aggr=c.aggr;if(["auto","radius","square"].includes(c.aggrHow))o.aggrHow=c.aggrHow;if(Number.isFinite(+c.aggrN)&&c.aggrN!=null)o.aggrN=Math.max(1,Math.min(12,Math.round(+c.aggrN)));   // v79f   // v74f: Full field automation (the default) or Soft Automate
  o.rush=Math.max(0,Math.min(9,Math.round(+c.rush||0)));for(const k of ["ambush","bases","walls","hier","under","noAttack","flee","tprio","tIgnoreGI","tSameGI","tgroup","hill","fLink","ambFocus","crys","crysStance","crysLives","crysMiner","crysAsk","crysHow","crysShow","crysFight"])if(typeof c[k]==="boolean")o[k]=c[k];
  if(Array.isArray(c.tgorder))o.tgorder=[...c.tgorder.filter(k=>o.tgorder.includes(k)),...o.tgorder.filter(k=>!c.tgorder.includes(k))];   // v54: the ranking by kinds of card
  o.torder=Array.isArray(c.torder)?[...c.torder.filter(k=>FA_TKEYS.includes(k)),...FA_TKEYS.filter(k=>!c.torder.includes(k))]:[...FA_TKEYS];
  if(Array.isArray(c.teq))o.teq=c.teq.filter(p=>Array.isArray(p)&&p.length===2&&p.every(k=>FA_TKEYS.includes(k)));
  if(Array.isArray(c.order)&&!c.order.includes("noatk"))c={...c,order:["noatk",...c.order]};   // older settings: Don't attack goes on top
  if(Array.isArray(c.order)&&!c.order.includes("crystals")){const o2=[...c.order],i=o2.indexOf("bases");o2.splice(i<0?o2.length:i+1,0,"crystals");c={...c,order:o2}}   // v71n: Focus on crystals comes in after Target bases
  if(Array.isArray(c.hout))o.hout=FA_OUT.filter(k=>c.hout.includes(k));
  if(c.ctl)for(const k in o.ctl)if(typeof c.ctl[k]==="boolean")o.ctl[k]=c.ctl[k];
  if(Array.isArray(c.extra))o.extra=c.extra.filter(k=>FA_KINDS.includes(k));if(Array.isArray(c.xminus))o.xminus=c.xminus.filter(k=>FA_KINDS.includes(k)&&!o.extra.includes(k));
  if(Array.isArray(c.order)&&c.order.length===FA_PRINC.length&&FA_PRINC.every(([k])=>c.order.includes(k)))o.order=[...c.order];
  if(typeof c.tWeak==="boolean")o.tWeak=c.tWeak;if(c.tStk&&typeof c.tStk==="object"){o.tStk={};for(const k of ["strongest","weakest","minority","majority"])o.tStk[k]=c.tStk[k]!==false&&(c.tStk[k]===true||FA_DEF.tStk[k])}   // v72e
  if(Array.isArray(c.classes)&&typeof clsClean==="function")o.classes=clsClean(c.classes);if(typeof c.classMulti==="boolean")o.classMulti=c.classMulti;   // v72e: the classes travel with the settings to the game
  if(Array.isArray(c.eq))o.eq=c.eq.filter(p=>Array.isArray(p)&&p.length===2&&p.every(k=>o.order.includes(k)&&!o.hout.includes(k)));
  o.grp="normal";o.fLink=true;o.walls=true;o.tIgnoreGI=false;o.tSameGI=false;   // v79g: these settings are gone; they always work this way
  o.eq=[];return faTgFill(o,c)};   // v79l: no more equals in the ranking; the target types filled in (99j_ranks.js)
const faMine=()=>faClean(PREF.fa);   // this device's settings
const faAllowed=()=>!!G&&(G.opts.fieldAuto||"medium")!=="off";
const faLevel=()=>{const v=G&&G.opts.fieldAuto;return ["easy","medium","hard"].includes(v)?v:"medium"};
const faState=pl=>G&&G.p[pl]&&G.p[pl].fa||null;
const faOn=pl=>faAllowed()&&!!(faState(pl)&&faState(pl).on)&&!G.p[pl].cpu&&!isNPC(pl);
/* the simple modes narrow everything to a few choices */
function faEff(c){c=faClean(c);const d=JSON.parse(JSON.stringify(FA_DEF));d.hill=c.hill;d.hillHow=c.hillHow;d.scope=c.scope;   // Capture the Hill is the player's in every mode
  if(c.mode==="full")return Object.assign(d,{mode:"full",under:c.under});
  if(c.mode==="attacks")return Object.assign(d,{mode:"attacks",ambush:false,under:c.under});
  return c}

/* ---------- which cards it controls ---------- */
const faKind=c=>c.unit||(c.puppet?"puppet":kind(c));
function faCat(c){const u=c.unit;if(u==="miner")return "miners";if(u&&UNIT[u]&&UNIT[u].shooter)return "ranged";if(["scout","healer","repair","ram"].includes(u))return "support";
  if(u==="assassin")return "specials";if(u)return "wildcards";if(c.puppet)return "soldiers";const k=kind(c);return k==="grunt"||k==="infantry"?"soldiers":"specials"}
function faControls(c,cfg){const k0=faKind(c);if((cfg.xminus||[]).includes(k0))return false;if(cfg.extra.includes(k0))return true;const k=faCat(c);return k==="miners"?cfg.ctl.support||cfg.ctl.miners:!!cfg.ctl[k]}

/* ---------- the hierarchy: higher principles pull harder; equals share a rank, and the field decides between them ---------- */
const FA_AGGR={noatk:c=>c.noAttack?-1:0,stance:c=>({offensive:1,defensive:-1}[c.stance]||0),rush:c=>c.rush?1:0,risk:c=>({reckless:1,careful:-1}[c.risk]||0),   // Skirmish counts as neither
  formation:()=>0,bases:c=>c.bases?1:0,crystals:c=>c.crys?(c.crysFight?1:-1):0,ambush:c=>c.ambush?-1:0};
function faScales(c,pl){const sc={};for(const [k] of FA_PRINC)sc[k]=1;if(!c.hier)return sc;
  const pairOf=k=>c.eq.find(p=>p.includes(k));let rank=0;const seen=new Set();
  for(const k of c.order){if(seen.has(k)||c.hout.includes(k))continue;const p=pairOf(k);const grp=p?p:[k];for(const g of grp){seen.add(g);sc[g]=Math.max(.35,1-.15*rank)}rank++}   // one taken out of the ranking keeps its full weight
  // between two equals the field decides: behind, the more careful one leads; ahead, the bolder one
  const mine=stacksOf(pl).reduce((a,x)=>a+AI.value(x.st),0),foe=AI.enemyStacks(pl).reduce((a,x)=>a+AI.value(x.st),0),behind=mine<foe;
  for(const [a,b] of c.eq){const da=FA_AGGR[a](c),db=FA_AGGR[b](c);if(da===db)continue;const lead=(behind?da<db:da>db)?a:b;sc[lead]=Math.min(1,sc[lead]+.1)}
  return sc}
const faMix=(a,b,t)=>{const o={...a};for(const k of ["atk","def","dist","ally","ctr"])o[k]=(a[k]||0)*(1-t)+(b[k]||0)*t;if(t>=.5&&b.k)o.k=b.k;return o};   // the stronger side names the stance
const FA_CENTER={atk:1,def:.8,dist:.04,ally:.3,ctr:1,k:"center"};
const FA_OFF={atk:1.45,def:.45,dist:.85,ally:.1,k:"off"};
const FA_SKIRM={atk:1.3,def:1.6,dist:.5,ally:.15,k:"skirmish"};   // v72a: hit what it can beat, keep out of reach of what it can't (its targets are picked in 83_v72a.js)   // v71: Offensive goes forward and fights; the computers keep their own, warier OFF   // v70c: it goes for the middle and holds it, striking what comes in reach
const faRushing=pl=>{const s=faState(pl);return !!(s&&s.cfg&&s.cfg.rush>0&&s.rushUntil!=null&&G.moon.round<=s.rushUntil)};
/* a Wall matters only when it stands between your field and an enemy base */
function faWallBlocks(pl,wr,wc){const bases=AI.enemyStacks(pl).filter(e=>hasBase(e.st)&&!hasK(e.st,"wall"));const mine=stacksOf(pl);
  const d=(a,b,c,e)=>Math.abs(a-c)+Math.abs(b-e);
  return bases.some(b=>d(wr,wc,b.r,b.c)<=2&&mine.some(m=>d(m.r,m.c,wr,wc)+d(wr,wc,b.r,b.c)<=d(m.r,m.c,b.r,b.c)+1))}
/* the rank of each principle (equals share one) */
function faRanks(c){const r={};let n=0;const seen=new Set();for(const k of c.order){if(seen.has(k)||c.hout.includes(k))continue;const p=c.eq.find(q=>q.includes(k));for(const g of p||[k]){seen.add(g);r[g]=n}n++}return r}
/* target priority: a stack is worth more the higher its best kind ranks; Grunts and Infantry can be flattened or merged */
const faTKind=(c,cfg)=>{if(c.puppet)return "puppet";const u=c.unit;if(u)return FA_TKEYS.includes(u)?u:"wildcards";const k=kind(c);return cfg.tSameGI&&k==="infantry"?"grunt":FA_TKEYS.includes(k)?k:"grunt"};
function faTargetFactor(cfg){if(!cfg.tprio)return ()=>1;
  const ord=cfg.tSameGI?cfg.torder.filter(k=>k!=="infantry"):cfg.torder,r={};let n=0;const seen=new Set();
  for(const k of ord){if(seen.has(k))continue;const p=cfg.teq.find(q=>q.includes(k));for(const g of p||[k]){seen.add(g);r[g]=n}n++}
  if(cfg.tSameGI)r.infantry=r.grunt;const N=Math.max(1,n-1);
  return E=>{const ks=E.cards.map(x=>faTKind(x,cfg));const best=Math.min(...ks.map(k=>r[k]??n));let m=1.6-1.2*best/N;
    if(cfg.tIgnoreGI&&ks.every(k=>k==="grunt"||k==="infantry")){const v=AI.value(E),avg=E.cards.length*(1+.8+6/7);if(v>0)m*=avg/v}
    return Math.max(.2,m)}}
/* v72e: a class's own settings stand in for the player's while its stacks are weighed (87_classes.js) */
let FA_OVR=null;
const faCfgOf=pl=>FA_OVR&&FA_OVR.pl===pl?FA_OVR.cfg:faEff(faState(pl)&&faState(pl).cfg);
function faCtx(pl){
  const c=faCfgOf(pl),sc=faScales(c,pl);
  let W={...AI.stance(pl)};
  const fixed={offensive:FA_OFF,defensive:AI.W.DEF,center:FA_CENTER,skirmish:FA_SKIRM}[c.stance];if(fixed)W=faMix(W,fixed,sc.stance);
  if(faRushing(pl))W=faMix(W,AI.W.PUSH,sc.rush);
  W.ally=(W.ally||0)+({wide:.1,deep:-.1}[c.formation]||0)*sc.formation;W.stack=({deep:.8,wide:-.3}[c.formation]||0)*sc.formation;   // v71: Wide surrounds (below), Tall stacks
  const lv={preserve:1,balanced:0,throw:-1}[c.lives]||0;W.def=(W.def||0)*(1+.4*lv*sc.risk);   // v79g: Risk (it was Lives and Picking battles)
  const thrAdj=(lv>0?.12:lv<0?-.15:0)*sc.risk+({careful:.08,reckless:-.1}[c.battles]||0)*sc.risk;
  const ok=grp=>grp.length>0&&grp.every(x=>faControls(x,c));
  // Don't attack: on top it stops every attack; Rush or Target bases ranked above it still get their way
  const rk=faRanks(c),above=k=>c.hier&&rk[k]<rk.noatk,rushes=faRushing(pl)&&above("rush"),basesOnly=c.noAttack&&!rushes&&c.bases&&above("bases"),noAtk=c.noAttack&&!rushes&&!basesOnly;
  const tf=faTargetFactor(c);
  const ring=.3+({wide:.6,deep:-.15}[c.formation]||0)*sc.formation;   // v71: a stack of mine already beside the target counts for this much more
  return {level:faLevel(),W,thrAdj,aggr:{on:c.aggr!==false&&!noAtk,how:c.aggrHow||"auto",n:c.aggrN||4},form:c.formation,ring,lossMul:1+.5*lv*sc.risk,moves:c.mode!=="attacks",ambushP:c.ambush?.7*sc.ambush:0,ok,flee:c.formation==="deep"&&c.flee,
    okAtk:(st,o)=>{if(noAtk)return false;const E=G.board[o.r]&&G.board[o.r][o.c];if(basesOnly&&!(E&&hasBase(E)))return false;return o.card?faControls(o.card,c):ok(st.cards.filter(x=>!isBase(x)))},
    gainMul:E=>{let m=tf(E);if(c.bases&&hasBase(E)&&!hasK(E,"wall"))m*=1+sc.bases;
      if(c.walls&&hasK(E,"wall")){const at=AI.enemyStacks(pl).find(e=>e.st===E);if(at&&!faWallBlocks(pl,at.r,at.c))m*=1-.7*sc.bases}return m}}}

/* ---------- when it plays: the end of your prep phase (after you place and cast), and (v74f) the end of your attack phase ---------- */
async function faRun(pl,ph){if(!faOn(pl)||G.over)return;const was=G.busy;G.busy=true;render();
  try{await AI.field(pl,ph,faCtx(pl))}catch(e){console.error(e);log("Field automation stumbles: "+esc(e.message))}
  G.busy=was;render()}
{const _ap=actPhase;actPhase=async function(pl,ph){   // v74f: at the end of each phase, after you have acted with the cards yourself
  const out=await _ap.apply(this,arguments);
  if((ph==="prep"||ph==="attack")&&faOn(pl)&&!G.over&&G.active===pl)await faRun(pl,ph);
  return out}}

/* ---------- switching it on and off (a joined player's choice travels to the host) ---------- */
function setFieldAuto(pl,on,cfg){
  if(!G||!G.p[pl]||isNPC(pl)||!faAllowed())return;if(NET.ctx!=null&&NET.ctx!==pl)return;
  const P=G.p[pl],prev=P.fa||{},c=faClean(cfg);P.fa={on:!!on,cfg:c,rushUntil:prev.rushUntil};
  if(c.rush>0&&(!prev.cfg||prev.cfg.rush!==c.rush||prev.rushUntil==null||on&&!prev.on))P.fa.rushUntil=G.moon.round+c.rush-1;   // v78j
  if(!c.rush)P.fa.rushUntil=null;
  if(!!prev.on!==!!on){log(`${plName(pl)} ${on?"hands the field to the computer (Field Automation on)":"takes the field back (Field Automation off)"}.`,"event");
}
  render()}
/* this device's settings changed: keep them, and send them on if the automation is running */
function faSave(c){PREF.fa=faClean(c);savePrefs();const V=view(),s=faState(V);if(G&&s&&s.on)setFieldAuto(V,true,PREF.fa);paintFA()}

/* ---------- the question ---------- */
function faAsk(yes){let box=$("#faask");if(!box){box=document.createElement("div");box.id="faask";box.className="faov";document.body.appendChild(box)}
  box.innerHTML=`<div class="ovbox" role="alertdialog" aria-labelledby="faq"><button type="button" class="xclose" id="faX" aria-label="Close: no">×</button>
<h2 id="faq">Automate your field?</h2>
<p>The computer (${({easy:"Easy",medium:"Medium",hard:"Hard"})[faLevel()]}) moves and attacks with the cards on your field, following the settings in the small square beside the button: by default, every card, and it decides when to attack, defend or hold the center.</p>
<p class="dim">Your hand, placing cards, spells and sacrifices stay yours. It acts only at the end of each phase of your turn: it moves when you end your prep phase and attacks when you end your attack phase, so until then you can act with these cards yourself. Turn it off any time.</p>
<p class="acts"><button type="button" class="btn" id="faY">Yes</button> <button type="button" class="btn ghost" id="faN">No</button></p></div>`;
  box.hidden=false;const close=()=>{box.hidden=true};$("#faY").onclick=()=>{close();yes()};$("#faN").onclick=close;$("#faX").onclick=close;$("#faN").focus()}
function faToggle(){const V=view(),s=faState(V);if(s&&s.on){setFieldAuto(V,false,faMine());return}
  faAsk(()=>{const c=faMine();c.under=true;PREF.fa=c;PREF.faOpen=true;savePrefs();setFieldAuto(V,true,c)})}   // on: its controls go under the field (uncheck to remove)

/* ---------- the settings, drawn the same in the window and under the field ---------- */
const faVal=(k,c)=>({stance:{auto:"Automatic",offensive:"Offensive",defensive:"Defensive",center:"Center",skirmish:"Skirmish"}[c.stance],rush:c.rush?`${c.rush} round${c.rush>1?"s":""}`:"Off",
  risk:{careful:"Careful",normal:"Normal",reckless:"Reckless"}[c.risk],
  formation:{auto:"Automatic",wide:"Wide",deep:"Tall"}[c.formation],bases:c.bases?"On":"Off",crystals:c.crys?"On":"Off",ambush:c.ambush?"On":"Off",noatk:c.noAttack?"On":"Off"})[k];
/* v47: one kit draws every automation panel the same way: the words on the left, the switch or the arrows on the right */
function cfgKit(attr,act,pfx){
  const ph=isPhone(),tip=t=>t&&!ph?` data-tip="${esc(t)}"`:"",sm=t=>t&&ph?`<small>${t}</small>`:"";   // a phone shows the line, a computer shows it on hover
  return {tip,sm,
    row:(path,on,t,s,dis)=>`<label class="farow${dis?" off":""}"${tip(s)}><span class="fal"><b>${t}</b>${sm(s)}</span><input type="checkbox" ${attr}="${path}" ${on?"checked":""} ${dis?"disabled":""}></label>`,
    spin:(t,s,val,key,unit,dis)=>`<div class="farow${dis?" off":""}"${tip(s)}><span class="fal"><b>${t}</b>${sm(s)}</span><span class="faspin"><button type="button" class="btn ghost sm" ${act}="${key}-" aria-label="Less" ${dis?"disabled":""}>▼</button><b>${val}</b><button type="button" class="btn ghost sm" ${act}="${key}+" aria-label="More" ${dis?"disabled":""}>▲</button>${unit?`<small>${unit}</small>`:""}</span></div>`,
    radio:(key,cur,opts,dis)=>`<div class="opts faopts${dis?" off":""}">${opts.map(([v,t,s])=>`<label class="opt"${tip(s)}><input type="radio" name="${pfx}-${key}" ${attr}="${key}" value="${v}" ${cur===v?"checked":""} ${dis?"disabled":""}><span>${t}${sm(s)}</span></label>`).join("")}</div>`,
    pmChips:(list,plus,minus,act,dis)=>`<div class="pmchips${dis?" off":""}">${list.map(([k,t])=>{const s=plus.includes(k)?"plus":minus.includes(k)?"minus":"";return `<button type="button" class="pmchip ${s}" ${act}="${k}" ${dis?"disabled":""} aria-label="${esc(t)}: ${s==="plus"?"yes":s==="minus"?"no":"as its group"}"><i>${s==="plus"?"+":s==="minus"?"−":"·"}</i>${esc(t)}</button>`}).join("")}</div><p class="dim pmhelp">Click to cycle: + yes, even if its group is off · − no, even if its group is on · · as its group.</p>`,
    chips:(list,on,dataAttr,dis)=>`<div class="opts fakinds${dis?" off":""}">${list.map(([k,t])=>`<label class="opt"><input type="checkbox" ${dataAttr}="${k}" ${on.includes(k)?"checked":""} ${dis?"disabled":""}><span>${esc(t)}</span></label>`).join("")}</div>`,
    sec:(t,body,cls="",hint,note)=>`<section class="fasec ${cls}"><h4${tip(hint)}>${t}</h4>${body}${hint&&ph?`<p class="dim">${hint}</p>`:""}${note?`<p class="fanote2">${note}</p>`:""}</section>`}}
/* v79f: the Aggression boxes (the field's settings and each class's): on or off, then how near an enemy must be */
const FA_AGGR_HOW=[["auto","Automatic","The distance changes with the field: farther on the offensive, when nobody has fought for a while or when you are well ahead; nearer on the defensive or when far behind"],
  ["radius","Radius","Enemies within this many tiles as the crow flies (a circle)"],["square","Square","Enemies within this many steps any way, diagonals included (a square)"]];
function faAggrHTML(K,c,on,how,n){const a=c.aggr!==false;
  return K.row(on,a,"Aggressive","Cards go after the enemies near them that they would fight, whenever they may attack at all (not under Don't attack). Off: they wait for enemies to come into reach.")+
    (a?K.radio(how,c.aggrHow||"auto",FA_AGGR_HOW)+K.spin("How near",c.aggrHow==="auto"?"Automatic sets it":"",c.aggrHow==="auto"?"auto":(c.aggrN||4),n,c.aggrHow==="auto"?"":"tiles",c.aggrHow==="auto"):"")}
const FA_CAUTION="Careful: ranking is a powerful setting. A bad order can lose you cards, or the game.";
function faPanelHTML(c,pl,pfx){
  const K=cfgKit("data-fa","data-faact","fa"+pfx),{row,spin,radio,sec}=K;
  const s=pl!=null?faState(pl):null,left=s&&s.rushUntil!=null&&c.rush?Math.max(0,s.rushUntil-G.moon.round+1):null;
  const custom=c.mode==="custom",some=custom;
  let h=sec("Simple mode",radio("mode",c.mode,[["full","Fully automatic","It decides everything, offense, defense or the center (the default)"],
    ["attacks","Attacks only","It only attacks; you move every card"],["custom","Every option","Choose each setting yourself"]]),"fafull famodes");
  h+=sec("Attack",some?row("noAttack",c.noAttack,"Don't attack","Your field moves but never attacks. On top of the ranking unless you move it."):row("",true,"Attacks when the odds say so","Your field attacks enemies in sight when the odds say so.",true),some?"":"falock");
  if(kothOn())h+=sec("Capture the Hill",row("hill",c.hill,"Capture the Hill","It goes for the Hill to score (on by default).")+(c.hill?radio("hillHow",c.hillHow,[["army","Gather an army first","Cards gather into a big army, then march on the Hill together"],["straight","Straight there","Every card heads for the Hill at once"],["groups","In small groups","Groups of two or three set out one after another"]]):""));
  if(some){h+=sec("Stance",radio("stance",c.stance,[["auto","Automatic","Changes with the field"],["offensive","Offensive",""],["defensive","Defensive",""],["center","Control the center",""],
      ["skirmish","Skirmish","Hit and run: it picks off equal or weaker stacks (small ones first) that have no edge over it, then falls back when stronger ones come"]]));
    h+=sec("Aggression",faAggrHTML(K,c,"aggr","aggrHow","aggrN")+
      row("rushon",c.rush>0,"Rush: all-out","Everything it controls goes for the enemy for the rounds below, whatever the stance and the distance.")+spin("For how long",left!=null?`${left?left+" left":"over"}`:"",Math.max(1,c.rush),"rush",`round${Math.max(1,c.rush)>1?"s":""}`,!c.rush),
      "","Whether cards go after the enemies near them, how near an enemy must be, and Rush.");
    h+=sec("Ambush",row("ambush",c.ambush,"Set ambushes","Assassins and face-down stacks with nothing in reach wait in ambush.")+
      (c.ambush?row("ambFocus",c.ambFocus,"Focus on ambush","Stacks that can ambush hold their ground near the enemy and always wait in ambush; from an ambush they strike only with the odds well on their side."):""))}
  if(custom){
    h+=sec("Formation",radio("formation",c.formation,[["auto","Automatic","Each stack as the odds say"],["wide","Wide","Spread out in small groups of two or three stacks, surround, take the advantage"],["deep","Tall","One army: tall stacks that keep together, move as one and strike together"]]));
    h+=sec("Risk",radio("risk",c.risk,[["careful","Careful","Keeps cards alive and fights only with good odds"],["normal","Normal","The default"],["reckless","Reckless","Trades cards freely and takes long shots"]])+(c.formation==="deep"?row("flee",c.flee,"Flee when low","A stack that has lost half its cards pulls back from the enemy."):""),"","",
      "How much it risks: how sure a win must be before it attacks, and how freely it trades cards.");
    h+=sec("Bases and crystals",row("bases",c.bases,"Target bases","Enemy Aces and the Tree are worth more to it (a Wall counts only when it stands between your field and a base).")+
      row("crys",c.crys,"Focus on crystals","Your field guards the crystals for your Miners until they're dug out. More options below."));
    h+=sec("Which cards it controls",`<div class="facats">${FA_CATS.map(([k,t,s2])=>row("ctl."+k,c.ctl[k],t,s2)).join("")}${!c.ctl.support?row("ctl.miners",c.ctl.miners,"Miners","Even with Support off"):""}</div>
<details class="faextra" ${c.extra.length||c.xminus.length?"open":""}><summary>Yes, and… (single kinds of card: + it controls them, − it leaves them to you)</summary>${K.pmChips(FA_KINDS.map(k=>[k,shortInfo(k)]),c.extra,c.xminus,"data-fapm")}</details>`,"fafull");
    /* v52: the two rankings open like the Yes-and lists: ▸ closed is off, ▾ open is on */
    h+=sec("Hierarchical control",`<details class="faextra fadet" data-fadet="hier" ${c.hier?"open":""}><summary>Rank the principles <small class="dim">(${c.hier?"on":"off"})</small></summary><p class="dim">When they pull apart, the higher one wins.</p>`+faPrincHTML(c)+
      (c.hout.length?`<p class="fahin">${c.hout.map(k=>`<button type="button" class="btn ghost sm" data-faact="in:${k}" title="Add it to the ranking">+ ${FA_PRINC.find(x=>x[0]===k)[1]}</button>`).join(" ")}<small class="dim">Out of the ranking: ${c.hout.length>1?"they keep":"it keeps"} ${c.hout.length>1?"their":"its"} full weight.</small></p>`:"")+`</details>`,"fafull","",c.hier?FA_CAUTION:"");
    h+=sec("Target priority",`<details class="faextra fadet" data-fadet="tprio" ${c.tprio?"open":""}><summary>Rank the kinds of card to target <small class="dim">(${c.tprio?"on":"off: every target is weighed by the odds alone"})</small></summary>`+faTgHTML(K,c)+`</details>`,"fafull","",c.tprio?FA_CAUTION:"");   // v79l: as a class has it
    if(c.crys)h+=sec("Crystals",`<details class="faextra" open><summary>More options for Focus on crystals</summary>`+
      row("crysStance",c.crysStance,"Depends on the stance","It guards crystals only while your field defends or holds the center.")+
      row("crysLives",c.crysLives,"Depends on Risk","Careful guards only where it's safe; Normal unless it's badly outnumbered; Reckless, whatever comes.")+
      row("crysMiner",c.crysMiner,"Only with a Miner","Only while you have a Miner in your deck, your hand or on the field.")+
      row("crysAsk",c.crysAsk,"Ask me first","Before a stack sets out to guard a crystal: yes, no, or other stacks instead (at most once every five rounds).")+
      (c.crysAsk?row("crysHow",c.crysHow,"Ask how long","The same question asks how many rounds to guard it."):"")+
      row("crysShow",c.crysShow,"Show the guard","A soft ring around the crystal and around its guard, joined by a dashed line (only you and your team see it).")+
      row("crysFight",c.crysFight,"Fight over crystals","Some of your cards go after enemy stacks on crystals first.")+
      `<p class="dim">${c.crysStance||c.crysLives?"Guarding follows "+(c.crysStance&&c.crysLives?"the stance and Lives":c.crysStance?"the stance":"Lives")+" first, then its place in the ranking.":"With neither the stance nor Lives checked, guarding a crystal comes before everything else, whatever the ranking."} To stop guarding for five rounds, select the guard: Stop guarding the crystal.</p></details>`,"fafull");
  }
  h+=`<p class="dim fanote fafull">Some options aren't the best choice for every situation on your field.</p>`;
  return h}
const faHierHTML={pending:null,tpending:null};
/* moving in a ranking: blocks of equals move together */
function hierMove(order,eq,pkey,a,k){
  const blocks=[];const seen=new Set();for(const x of order){if(seen.has(x))continue;const p=eq.find(q=>q.includes(x));const g=p?order.filter(y=>p.includes(y)):[x];g.forEach(y=>seen.add(y));blocks.push(g)}
  const bi=blocks.findIndex(g=>g.includes(k));
  if(a==="up"&&bi>0)[blocks[bi-1],blocks[bi]]=[blocks[bi],blocks[bi-1]];
  if(a==="down"&&bi<blocks.length-1)[blocks[bi+1],blocks[bi]]=[blocks[bi],blocks[bi+1]];
  if(a==="eq"){const p=eq.find(q=>q.includes(k)),pend=faHierHTML[pkey];
    if(p){eq=eq.filter(q=>q!==p);faHierHTML[pkey]=null}
    else if(pend&&pend!==k&&!eq.some(q=>q.includes(pend))){faHierHTML[pkey]=null;eq=[...eq,[pend,k]];
      const fl=blocks.flat().filter(x=>x!==k);fl.splice(fl.indexOf(pend)+1,0,k);return {order:fl,eq}}   // the second joins the first, side by side
    else faHierHTML[pkey]=pend===k?null:k}
  return {order:blocks.flat(),eq}}
/* a +/− chip: neither → + → − → neither */
function pmCycle(plus,minus,k){if(plus.includes(k))return [plus.filter(x=>x!==k),[...minus.filter(x=>x!==k),k]];if(minus.includes(k))return [plus,minus.filter(x=>x!==k)];return [[...plus,k],minus]}
/* every change goes through here */
function faWire(root){
  root.querySelectorAll("[data-fa]").forEach(i=>{const path=i.dataset.fa;if(!path)return;i.onchange=()=>{const c2=faMine();
    if(path==="rushon")c2.rush=i.checked?Math.max(1,c2.rush||1):0;
    else if(path.startsWith("ctl."))c2.ctl[path.slice(4)]=i.checked;
    else if(path.startsWith("tStk."))c2.tStk=Object.assign({},c2.tStk,{[path.slice(5)]:i.checked});
    else if(i.type==="checkbox")c2[path]=i.checked;else c2[path]=i.value;
    faSave(c2)}});
  root.querySelectorAll("[data-fapm]").forEach(b=>b.onclick=()=>{const c2=faMine(),k=b.dataset.fapm,[p,m]=pmCycle(c2.extra,c2.xminus,k);c2.extra=p;c2.xminus=m;faSave(c2)});
  root.querySelectorAll("[data-faact]").forEach(b=>b.onclick=()=>{const c2=faMine(),v=b.dataset.faact;
    if(v==="aggrN+"||v==="aggrN-"){c2.aggrN=Math.max(1,Math.min(12,(c2.aggrN||4)+(v==="aggrN+"?1:-1)));faSave(c2);return}   // v79f
    if(v==="rush+"||v==="rush-"){c2.rush=Math.max(1,Math.min(9,(c2.rush||1)+(v==="rush+"?1:-1)));faSave(c2);return}
    if(v.startsWith("out:")||v.startsWith("in:")){const [a,k]=v.split(":");if(!FA_OUT.includes(k))return;
      if(a==="out"){if(!c2.hout.includes(k))c2.hout.push(k);c2.eq=c2.eq.filter(p=>!p.includes(k));if(faHierHTML.pending===k)faHierHTML.pending=null}
      else{c2.hout=c2.hout.filter(x=>x!==k);c2.order=[...c2.order.filter(x=>x!==k),k]}   // back in at the bottom
      faSave(c2);return}
    const t=v.startsWith("t"),[a,k]=(t?v.slice(1):v).split(":");
    if(t){const ord=c2.tSameGI?c2.torder.filter(x=>x!=="infantry"):c2.torder,r=hierMove(ord,c2.teq,"tpending",a,k);
      c2.torder=c2.tSameGI?[...r.order,"infantry"]:r.order;c2.teq=r.eq}
    else{const r=hierMove(c2.order.filter(x=>!c2.hout.includes(x)),c2.eq,"pending",a,k);c2.order=[...r.order,...c2.hout];c2.eq=r.eq}   // the ones out of the ranking don't count when moving
    faSave(c2)})}
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
{const _rd=render;render=function(){rSafe(_rd,this,arguments);if(!G)return;const ctl=$("#controls");const V=view();
  const show=faAllowed()&&!G.over&&G.phase!=="setup"&&G.p[V]&&!G.p[V].cpu&&!isNPC(V)&&!(NET.role==="guest"&&NET.watch);
  if(ctl&&show&&!ctl.querySelector(".fabar")){const on=faOn(V);
    ctl.insertAdjacentHTML("beforeend",`<span class="fabar"><button type="button" class="btn ${on?"":"ghost"} sm fatog" aria-pressed="${on}" title="The computer moves and attacks with the cards on your field">Auto field: ${on?"On":"Off"}</button><button type="button" class="btn ghost sm facfgb" title="Configure field automation" aria-label="Configure field automation">▦</button></span>`);
    ctl.querySelector(".fatog").onclick=faToggle;ctl.querySelector(".facfgb").onclick=faWindow}
  const sig=JSON.stringify([show,faOn(V),PREF.fa,G.moon.round]);if(sig!==faSig){faSig=sig;paintFA()}}}

/* ---------- the setup: Off, or how well it plays ---------- */
{const _ss=showStart;showStart=function(){const out=_ss.apply(this,arguments);const p=document.querySelector('.ovbox.setup .spanel[data-p="rules"]>.scols')||document.querySelector('.ovbox.setup .spanel[data-p="rules"]');
  if(p&&!$("#ofauto"))p.insertAdjacentHTML("beforeend",`<fieldset class="pf"><legend>Field Automation</legend><label class="f">Field Automation <select id="ofauto"><option value="off">Off</option><option value="easy">On · Easy</option><option value="medium" ${startMode==="survival"?"":"selected"}>On · Medium${startMode==="survival"?"":" (default)"}</option><option value="hard" ${startMode==="survival"?"selected":""}>On · Hard${startMode==="survival"?" (default in Survival)":""}</option></select></label><p class="dim">Lets a player hand the cards on their field to the computer during the game; their hand and spells stay theirs. Off switches Field Automation off for everyone; Ritual Dice and Lazy Hand automation still work.</p></fieldset>`);
  return out}}
{const _sg=startGame;startGame=function(opts){const s=$("#ofauto");if(opts&&s)opts.fieldAuto=s.value;return _sg.apply(this,arguments)}}

if(window.__EC)Object.assign(window.__EC,{setFieldAuto,faCtx,faRun,faWindow,faEff,FA_DEF});
