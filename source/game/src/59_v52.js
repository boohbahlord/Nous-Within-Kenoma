/* ---------------- v52: fixes and comfort ----------------
   - The automation window keeps its fold-downs open while it is redrawn (the Yes-and lists used to snap shut).
   - Each Configure Automation tab starts with its own on/off switch.
   - With Field Automation switched off before the game, the settings button stays, for Ritual Dice and Lazy Hand.
   - A watchdog redraws the spell list whenever the active player's mana, debt or phase changes, so a spell never stays
     dark after mana arrives (a Bank loan, a gift, anything else).
   - A loan offer from another player is no longer hidden behind the Bank window. */

/* ---------- the open fold-downs survive a redraw ---------- */
{const _p=paintFA;paintFA=function(){const keep=new Map(),key=(root,d)=>root.id+"|"+((d.querySelector(":scope>summary")||{}).textContent||"");
  for(const root of [$("#facfg"),$("#fapanel")])if(root)root.querySelectorAll("details").forEach(d=>keep.set(key(root,d),d.open));
  const out=_p.apply(this,arguments);
  for(const root of [$("#facfg"),$("#fapanel")])if(root)root.querySelectorAll("details:not([data-fadet]):not([data-grdet])").forEach(d=>{if(d.closest(".facls"))return;const k=key(root,d);if(keep.has(k))d.open=keep.get(k)});   // v73f: the classes keep their own folds (theirs share titles)
  return out}}

/* ---------- an on/off switch at the top of every tab ---------- */
const lhAnyOn=()=>{const l=lhMine();return PREF.lazyAuto===true||!!l.autoPlace||!!l.sac};
function autoMasterHTML(){const V=G?view():null;let on,label,hint;
  if(autoTab==="field"){if(V==null||!G.p[V]||!faAllowed())return "";on=faOn(V);label="Field automation";hint="The computer moves and attacks with the cards on the field."}
  else if(autoTab==="ritual"){on=!!rdMine().on;label="Ritual Dice automation";hint="Buys Ritual Dice before Grave Blessing, as set below."}
  else{on=lhAnyOn();label="Lazy Hand automation";hint="Places and sacrifices hand cards, as set below."}
  return `<p class="fafull automaster"><button type="button" class="btn sm ${on?"":"ghost"}" data-amaster="${autoTab}" aria-pressed="${on}">${label}: ${on?"On":"Off"}</button><span class="dim">${hint}</span></p>`}
autoBodyHTML=function(pfx,under){const V=G?view():null;
  if(autoTab==="ritual")return autoMasterHTML()+rdPanelHTML(rdMine(),pfx);
  if(autoTab==="lazy")return autoMasterHTML()+lhPanelHTML(lhMine(),pfx);
  if(!faAllowed())return `<p class="dim fafull">Field Automation is off for this game (set before the game, in the Rules tab). Ritual Dice and Lazy Hand automation still work.</p>`;
  return autoMasterHTML()+faPanelHTML(faMine(),V,pfx)};
function lhMaster(){const c=lhMine();
  if(lhAnyOn()){c.prev={keep:PREF.lazyAuto===true,autoPlace:!!c.autoPlace,sac:!!c.sac};PREF.lazyAuto=false;c.autoPlace=false;c.sac=false}
  else{const p=c.prev||{};PREF.lazyAuto=p.keep||!(p.autoPlace||p.sac);c.autoPlace=!!p.autoPlace;c.sac=!!p.sac}
  lhSave(c)}
{const _w=wireAuto;wireAuto=function(root){_w(root);
  root.querySelectorAll("[data-amaster]").forEach(b=>b.onclick=()=>{const k=b.dataset.amaster;
    if(k==="field")faToggle();else if(k==="ritual"){const c=rdMine();c.on=!c.on;rdSave(c)}else lhMaster();paintFA();if(G)render()})}}
/* the Lazy Hand settings keep what the master switch put away */
{const _lc=lhClean;lhClean=function(c){const prev=c&&c.prev;const out=_lc(c);if(prev)out.prev={keep:!!prev.keep,autoPlace:!!prev.autoPlace,sac:!!prev.sac};return out}}

/* ---------- Field Automation off for the game: the settings button stays ---------- */
{const _rd=render;render=function(){rSafe(_rd,this,arguments);if(!G||faAllowed())return;const ctl=$("#controls"),V=view();
  const show=!G.over&&G.phase!=="setup"&&G.p[V]&&!G.p[V].cpu&&!isNPC(V)&&!(NET.role==="guest"&&NET.watch);
  if(ctl&&show&&!ctl.querySelector(".fabar")){ctl.insertAdjacentHTML("beforeend",`<span class="fabar"><button type="button" class="btn ghost sm facfgb" data-tip="Configure Automation: Ritual Dice and Lazy Hand" aria-label="Configure Automation">▦</button></span>`);
    ctl.querySelector(".facfgb").onclick=()=>faWindow(autoTab==="field"?"ritual":autoTab)}}}

/* ---------- the spell list watchdog ---------- */
let spSig="";
setInterval(()=>{if(!G||G.over||document.hidden)return;const V=view(),P=G.p[G.active];if(!P)return;
  const sig=[G.active,G.phase,G.busy,G.passing,mana(G.active),debtOf(G.active),owedOf(G.active),P.hand.length,G.spentOther,G.blessed,V].join("|");
  if(sig===spSig)return;if(!spSig){spSig=sig;return}
  if(G.busy||document.querySelector("#ov:not([hidden]) .ovbox"))return;   // wait until nothing is being asked; the next tick redraws
  spSig=sig;render()},700);

/* ---------- a loan offer from another player shows over the Bank window ---------- */
{const _al=askLoan;askLoan=function(from,to,n){const was=!!document.querySelector("#ov:not([hidden]) .ovbox.bank"),out=_al.apply(this,arguments);
  if(out&&out.state==="offer"&&!G.p[from].cpu&&was)bankHoldOpen=true;   // the terms are on screen now: don't draw the Bank over them
  return out}}
let bankHoldOpen=false;
{const _an=answerLoan;answerLoan=function(L){const was=!!document.querySelector("#ov:not([hidden]) .ovbox.bank"),out=_an.apply(this,arguments);   // v78j
  // v78p: the terms, or the screen passing the device to the borrower, are up: the Bank's redraw waits (only after a click in the Bank)
  if(L&&L.state==="offer"&&document.querySelector("#ov:not([hidden]) #qy, #ov:not([hidden]) #ready")){if(was)bankHoldOpen=true;const w=$("#dipwin");if(w&&!w.hidden)w.hidden=true}
  return out}}
{const _ob=openBank;openBank=function(){if(bankHoldOpen){bankHoldOpen=false;return}if(G&&G.passing)return;   // v78p: never over the pass screen
  return _ob.apply(this,arguments)}}

/* ---------- the ▸ rankings: opening one turns it on, closing it turns it off ---------- */
{const _fw=faWire;faWire=function(root){_fw(root);
  root.querySelectorAll("[data-fadet]").forEach(d=>d.addEventListener("toggle",()=>{const c=faMine(),k=d.dataset.fadet;if(!!c[k]===d.open)return;c[k]=d.open;faSave(c)}))}}

/* ---------- the field settings in two columns: the button choices on the left, the switches and arrows on the right ----------
   (a phone has one column, so the switches come below) */
{const _fp=faPanelHTML;faPanelHTML=function(){const html=_fp.apply(this,arguments);if(isPhone())return html;
  const t=document.createElement("template");t.innerHTML=html;const kids=[...t.content.childNodes];let out="",run=[];
  const flush=()=>{if(!run.length)return;const L=run.filter(e=>e.querySelector(".faopts")),R=run.filter(e=>!e.querySelector(".faopts"));
    out+=`<div class="fa2col fafull"><div>${L.map(e=>e.outerHTML).join("")}</div><div>${R.map(e=>e.outerHTML).join("")}</div></div>`;run=[]};
  for(const n of kids){if(n.nodeType===1&&n.matches("section.fasec")&&!n.classList.contains("fafull"))run.push(n);else{flush();out+=n.nodeType===1?n.outerHTML:(n.textContent||"")}}
  flush();return out}}

/* ---------- Ritual Dice: "Custom" remembers the last custom settings ---------- */
const RD_KEYS=["every","perTurn","kinds","minMana","counterOD","noOD","stopDebt","credit","creditStop"];
{const _rc=rdClean;rdClean=function(c){const out=_rc(c);if(c&&c.lastCustom&&typeof c.lastCustom==="object"){const l=_rc({...c.lastCustom});out.lastCustom={};for(const k of RD_KEYS)out.lastCustom[k]=l[k]}return out}}
{const _rs=rdSave;rdSave=function(c){if(c&&c.preset==="custom"){c.lastCustom={};for(const k of RD_KEYS)c.lastCustom[k]=Array.isArray(c[k])?[...c[k]]:c[k]}return _rs(c)}}
{const _rw=rdWire;rdWire=function(root){_rw(root);const b=root.querySelector('[data-rdpreset="custom"]');
  if(b)b.onchange=()=>{const c=rdMine();if(c.lastCustom)rdSave({...c,...c.lastCustom,preset:"custom"});else rdSave({...c,preset:"custom"})}}}

/* ---------- games of three or more: the other players as small columns in their color (D29) ----------
   Each column: name, kind of player, a thin deck line and mana line with numbers, the hand count and the status tags.
   No dice box in the columns: one shared dice box (by the hand) lists everyone's latest rolls. */
const multiView=()=>!!G&&G.p.filter((P,i)=>i!==view()&&!isNPC(i)).length>=2;
function miniBoxHTML(pl){const P=G.p[pl],V=view(),act=pl===G.active&&G.phase!=="setup";
  const kindTxt=P.cpu==="horde"?"the Horde":(P.cpu?`computer · ${P.cpu}${P.arch&&AI.ARCH[P.arch]?" · "+AI.ARCH[P.arch].name:""}`:"player")+(TRIBES[P.tribe]?` · ${TRIBES[P.tribe].name}`:"");
  let h=`<div class="ph mini"><button type="button" class="subst" data-stat="${pl}" aria-label="Status">${solidSVG(P.solid,P.color,15)}</button><b>${esc(P.name)}</b>${pl!==V&&!isEnemy(pl,V)?'<span class="ally">ally</span>':""}${P.out?'<span class="outmark">out</span>':act?'<span class="turnmark">to play</span>':""}</div><div class="minisub">${esc(kindTxt)}</div>`;
  if(P.out)return h;
  if(P.cpu==="horde"){const u=stacksOf(pl).reduce((a,x)=>a+x.st.cards.length,0);return h+`<div class="minitags">${u} card${u===1?"":"s"} on the field</div>`}
  const N=Math.max(1,P.start||P.deck.length||1),n=P.deck.length,m=mana(pl)-(P.debt||0),cap=soulCap(pl);
  const line=(t,v,max,txt,neg)=>`<div class="mline${neg?" neg":""}"><span>${t}</span><i><u style="width:${Math.max(0,Math.min(100,v/max*100)).toFixed(1)}%"></u></i><b>${txt}</b></div>`;
  h+=line("Deck",n,N,n)+line("Mana",Math.max(0,m),cap,`${m}/${cap}`,m<0);
  const open=handOpen(pl,V);
  const tags=[`<span>Hand <b>${P.hand.length}/${handCap(pl)}</b></span>`,...(open&&P.hand.length?[`<span class="seenmark" title="seen">${P.hand.map(c=>esc(short(c))).join(" ")}</span>`]:[]),...econTags(P)];
  if(P.tribe==="tiph"){const k=stacksOf(pl).reduce((a,x)=>a+x.st.cards.reduce((b,c)=>b+((c.prisoners||[]).length),0),0);if(k)tags.push(`<span>Prisoners <b>${k}</b></span>`)}
  if(P.tribe==="yald")tags.push(`<span>Hunger <b>${P.hunger||0}/7</b></span>`);
  if(P.tribe==="binah")tags.push(`<span>Thralls <b>${(P.thralls||[]).length}/10</b></span>`);
  return h+`<div class="minitags">${tags.join("")}</div>`}
{const _pb=pboxHTML;pboxHTML=function(pl,top){if(top&&pl!==view()&&multiView())return miniBoxHTML(pl);return _pb.apply(this,arguments)}}
/* the one dice box: everyone's latest roll, newest first; a row opens that player's history */
function trayAllHTML(){const L=G.p.map((P,i)=>({P,i})).filter(x=>x.P.tray&&!isNPC(x.i)).sort((a,b)=>b.P.tray.t-a.P.tray.t);
  if(!L.length)return `<div class="trayall"><span class="tl">Dice</span><span class="dim">No rolls yet.</span></div>`;
  return `<div class="trayall"><span class="tl">Dice, newest first</span>${L.map(({P,i})=>{const t=P.tray;return `<button type="button" class="trow" data-hist="${i}" style="--pc:${P.color}" aria-label="${esc(P.name)}: show history"><b>${esc(P.name)}</b><small>${esc(t.label)}</small><span class="dice">${t.dice.length?t.dice.map(d=>dieSVG(d,P.color)).join(""):'<span class="dim">no dice</span>'}</span>${t.line?`<em>${esc(t.line)}</em>`:""}</button>`}).join("")}</div>`}
{const _r=render;render=function(){rSafe(_r,this,arguments);if(!G)return;const foe=$("#foe");if(foe)foe.classList.toggle("minis",multiView());
  {const t=$("#mytray");if(t&&t.innerHTML){t.innerHTML=trayAllHTML();t.querySelectorAll("[data-hist]").forEach(b=>b.onclick=e=>{e.stopPropagation();openHist(+b.dataset.hist,b)})}}}}   // v74b: always everyone's (the enemies' boxes lost their dice box)
