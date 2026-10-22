/* ---------------- v63: cheat mode (the user's design) ----------------
   - Off by default; a switch in the setup's Rules tab asks "Are you sure?" first ("Yes, I understand"); it works in any mode.
     Online rooms show that the host has it on, and every player sees "Cheat mode" on the screen.
   - A Cheat button beside the Configure button, and a Cheats fold below Configure Automation (its own switch hides it; it is
     shown at first only to players who hold the cheat menu). Both hold the same menu:
     free magic (me / everyone), the cheat menu for everyone, infinite mana (me / everyone / the Banker), an Ether that never
     empties, every spell in a Cheat List (me / everyone), blocking schools and single spells (they take effect at the next
     round), rare events on demand, Demons and Collectors on demand, and no victory or loss (a player who runs out starts
     again with their deck). */

const cheatOn=()=>!!(G&&G.opts&&G.opts.cheat);
const CH=()=>G.cheat||(G.cheat={all:false,free:[],freeAll:false,inf:[],infAll:false,infBank:false,etherInf:false,list:[],listAll:false,
  block:{schools:[],spells:[]},blockNext:null,noWin:false});
const localSeat=pl=>!!(G&&G.p[pl]&&!G.p[pl].net&&!G.p[pl].cpu&&!isNPC(pl));   // the seats of the device that turned it on
const cheatHas=pl=>cheatOn()&&pl!=null&&G.p[pl]&&!G.p[pl].cpu&&(CH().all||localSeat(pl));
const cheatFree=pl=>cheatOn()&&(CH().freeAll||CH().free.includes(pl));
const cheatInf=pl=>cheatOn()&&(CH().infAll||CH().inf.includes(pl))&&!isNPC(pl);
const cheatList=pl=>cheatOn()&&(CH().listAll||CH().list.includes(pl));

/* ---------- the changes, made by the host (a guest's change is sent to the host) ---------- */
function setCheat(pl,key,val){if(!cheatHas(pl))return false;const C=CH();
  const tog=(arr,on)=>{const s=new Set(C[arr]);on?s.add(pl):s.delete(pl);C[arr]=[...s]};
  if(key==="free")tog("free",val);else if(key==="inf")tog("inf",val);else if(key==="list")tog("list",val);
  else if(["freeAll","infAll","infBank","etherInf","listAll","all","noWin"].includes(key))C[key]=!!val;
  else if(key==="blockSchool"||key==="blockSpell"){const N=C.blockNext||(C.blockNext={schools:[...C.block.schools],spells:[...C.block.spells]}),arr=key==="blockSchool"?N.schools:N.spells,s=new Set(arr);
    val.on?s.add(val.k):s.delete(val.k);N[key==="blockSchool"?"schools":"spells"]=[...s]}
  else return false;
  log(`<b>Cheat mode</b>: ${plName(pl)} changes a cheat (${esc(cheatLabel(key,val))}).`,"event");render();return true}
const cheatLabel=(k,v)=>({free:"free magic for them",freeAll:"free magic for everyone",inf:"infinite mana for them",infAll:"infinite mana for everyone",infBank:"infinite mana for the Banker",
  etherInf:"an Ether that never empties",list:"every spell for them",listAll:"every spell for everyone",all:"the cheat menu for everyone",noWin:"no victory or loss",
  blockSchool:`${v&&v.on?"block":"unblock"} ${v&&v.k} from the next round`,blockSpell:`${v&&v.on?"block":"unblock"} ${v&&SP(v.k)?SP(v.k).name:""} from the next round`})[k]+(typeof v==="boolean"?(v?": on":": off"):"");
async function cheatEvent(pl,k){if(!cheatHas(pl))return false;
  if(k==="blood"){G.moon.blood=true;applyMoonTheme();log("<b>Cheat mode</b>: a <b>Blood Moon</b> rises. Every card killed this round falls into the Outer Darkness.","event")}
  else if(k==="meteor")meteor();
  else if(PLANETS[k]&&typeof eclipse==="function"){if(G.eclipse)endEclipse();await eclipse(k)}
  else if(k==="demons"){if(npcIx("barb")<0){flash("The Demons are off in this game (the Rules tab turns them on).");return false}spawnBarbarians(false)}
  else if(k==="collectors"){if(!sendCollectors(1)){flash("The Bank has no debtor to send Collectors after.");return false}}
  else return false;
  render();return true}
for(const [name,get,set] of [["setCheat",()=>setCheat,f=>setCheat=f],["cheatEvent",()=>cheatEvent,f=>cheatEvent=f]]){
  NETFN[name]={get,set,any:true};const orig=get();set(function(...a){if(NET.role!=="guest")return orig.apply(this,a);const rid=++NET.rid;sendHost({t:"cmd",fn:name,args:netClean(a),ui:uiSnap(),rid})})}

/* ---------- what the cheats do ---------- */
{const _sc=spellCost;spellCost=function(sp){if(G&&cheatFree(G.active))return 0;return _sc.apply(this,arguments)}}
{const _ca=canAfford;canAfford=function(pl,n){if(cheatInf(pl))return true;return _ca.apply(this,arguments)}}
{const _sp=spend;spend=function(pl,n){if(cheatInf(pl))return;return _sp.apply(this,arguments)}}
{const _cr=cycleRound;cycleRound=function(){if(G&&cheatOn()){const C=CH();if(C.blockNext){C.block=C.blockNext;C.blockNext=null;log("<b>Cheat mode</b>: the spell blocks change with the new round.","event")}
  if(C.infBank&&G.bank&&!G.bank.dead)G.bank.mana=Math.max(G.bank.mana,999)}return _cr.apply(this,arguments)}}
{const _sb=spellBlock;spellBlock=function(sp){if(sp&&cheatOn()){const B=CH().block;if(B.schools.includes(sp.school)||B.spells.includes(sp.id))return "Blocked in cheat mode."}return _sb.apply(this,arguments)}}
/* the Ether that never empties: whatever is conjured out of it comes back as a new card of the same kind */
for(const [name,get,set] of [["conjure",()=>conjure,f=>conjure=f],["conjureU",()=>conjureU,f=>conjureU=f]]){const orig=get();
  set(async function(){const before=new Set(G.ether.map(c=>c.id)),out=await orig.apply(this,arguments);
    if(cheatOn()&&CH().etherInf){const now=new Set(G.ether.map(c=>c.id));for(const id of before)if(!now.has(id)){const c=[...G.p.flatMap(P=>[...P.deck,...P.hand])].find(x=>x.id===id);
      if(c)G.ether.push(c.unit?mkUnit(c.unit,null):mk(c.rank,c.suit,c.color))}}
    return out})}
/* every spell in a Cheat List: the spells of other Emanations, castable */
{const _sr=spellReady;spellReady=function(sp){if(sp&&sp.tribe&&G&&cheatList(G.active)&&G.p[G.active].tribe!==sp.tribe)return phaseOk(sp)&&!spellBlock(sp)&&sp.ok()&&canAfford(G.active,spellCost(sp));return _sr.apply(this,arguments)}}
{const _c=cast;cast=async function(sp){const P=G&&G.p[G.active];if(sp&&sp.tribe&&P&&cheatList(G.active)&&P.tribe!==sp.tribe){const t=P.tribe;P.tribe=sp.tribe;try{return await _c.apply(this,arguments)}finally{P.tribe=t}}return _c.apply(this,arguments)}}
{const _rs=renderSpells;renderSpells=function(live){_rs.apply(this,arguments);if(!G||!cheatOn())return;const V=view(),P=G.p[V],box=$("#spells");if(!box||!P||!cheatList(V))return;
  const list=SPELLS.filter(s=>s.tribe&&s.tribe!==P.tribe&&!ETHER_IDS.has(s.id)).sort((a,b)=>a.school.localeCompare(b.school)||a.name.localeCompare(b.name));if(!list.length)return;
  box.insertAdjacentHTML("beforeend",`<details class="school cheatlist" data-sc="Cheat List" open><summary>Cheat List</summary>${list.map(s=>spellRow(s,live)).join("")}</details>`);
  box.querySelectorAll(".cheatlist [data-s]").forEach(b=>b.onclick=()=>{if(!canAct())return;cast(SP(b.dataset.s))})}}
/* no victory or loss: a player who would be out starts again with the deck they began with */
{const _ng=newGame;newGame=function(){const out=_ng.apply(this,arguments);if(G&&cheatOn())G.cheatDecks=G.p.map(P=>[...P.deck,...P.hand].map(c=>({rank:c.rank,suit:c.suit,color:c.color,unit:c.unit})));return out}}
{const _el=eliminate;eliminate=function(pl,why){if(!G||!cheatOn()||!CH().noWin||isNPC(pl)||isHorde(pl)||!G.cheatDecks||!G.cheatDecks[pl])return _el.apply(this,arguments);
  const P=G.p[pl];P.deck=shuffle(G.cheatDecks[pl].map(d=>d.unit?mkUnit(d.unit,pl):Object.assign(mk(d.rank,d.suit,d.color),{owner:pl})));P.hand=[];
  const ai=P.deck.findIndex(c=>kind(c)==="ace"),back=(seat(pl).back||[]).filter(([r,c])=>!isVoid(r,c)&&!G.board[r][c]);
  if(ai>=0&&back.length){const a=P.deck.splice(ai,1)[0];a.owner=pl;const [r,c]=back[0];G.board[r][c]={owner:pl,cards:[a],moved:true,attacked:false}}
  draw(pl,5,"cheat");log(`<b>Cheat mode</b>: ${plName(pl)} would be out (${why}), but starts again with their deck.`,"event");
  if(!P.cpu)popup("Cheat mode: you start again",`<p>${esc(why)}. With victory and loss off, you are not out: you start again with the deck you began with${back.length?", an Ace on your back line":""} and five cards in hand.</p>`,pl);render()}}

/* ---------- the menu: the Cheat button, its window, and the Cheats fold ---------- */
const CHEAT_EVENTS=()=>[["blood","A Blood Moon"],["meteor","A meteor"],...Object.keys(PLANETS).map(k=>[k,`The eclipse of ${PLANETS[k].name.replace(/^The /,"the ")}`])];
function cheatHTML(V){const C=CH(),me=k=>C[k].includes(V),row=(key,on,label,val)=>`<label class="farow"><span class="fal"><b>${label}</b></span><input type="checkbox" data-cheat="${key}" ${on?"checked":""}></label>`;
  const N=C.blockNext||C.block,schools=[...new Set(SPELLS.map(s=>s.school))];
  return `<p class="cheatnote">⚠ Changes to spells (blocks) take effect at the next round.</p>
<div class="cheatgrid">
<section><h4>Magic and mana</h4>${row("free",me("free"),"Free magic: me")}${row("freeAll",C.freeAll,"Free magic: everyone")}${row("inf",me("inf"),"Infinite mana: me")}${row("infAll",C.infAll,"Infinite mana: everyone")}${row("infBank",C.infBank,"Infinite mana: the Banker")}${row("etherInf",C.etherInf,"The Ether never empties")}</section>
<section><h4>Spells and players</h4>${row("list",me("list"),"Every spell (Cheat List): me")}${row("listAll",C.listAll,"Every spell: everyone")}${row("all",C.all,"The cheat menu for everyone")}${row("noWin",C.noWin,"No victory or loss")}</section>
<section><h4>Rare events</h4><div class="cheatbtns">${CHEAT_EVENTS().map(([k,t])=>`<button type="button" class="btn ghost sm" data-chev="${k}">${esc(t)}</button>`).join("")}</div>
<h4>Spawn</h4><div class="cheatbtns"><button type="button" class="btn ghost sm" data-chev="demons">A band of Demons</button><button type="button" class="btn ghost sm" data-chev="collectors">The Bank's Collectors</button></div></section>
<section class="cheatblock"><h4>Block schools and spells <small class="dim">(pick a school to see its spells)</small></h4>${schools.map(sc=>`<details><summary><label class="cbs" onclick="event.stopPropagation()"><input type="checkbox" data-cbs="${esc(sc)}" ${N.schools.includes(sc)?"checked":""}> Block</label> ${esc(sc)}</summary><div class="cheatspells">${SPELLS.filter(s=>s.school===sc).sort((a,b)=>a.name.localeCompare(b.name)).map(s=>`<label class="cbsp"><input type="checkbox" data-cbsp="${s.id}" ${N.spells.includes(s.id)?"checked":""}> ${esc(s.name)}</label>`).join("")}</div></details>`).join("")}</section>
</div>`}
function wireCheat(root,V){
  root.querySelectorAll("[data-cheat]").forEach(i=>i.onchange=()=>setCheat(V,i.dataset.cheat,i.checked));
  root.querySelectorAll("[data-chev]").forEach(b=>b.onclick=()=>cheatEvent(V,b.dataset.chev));
  root.querySelectorAll("[data-cbs]").forEach(i=>i.onchange=()=>setCheat(V,"blockSchool",{k:i.dataset.cbs,on:i.checked}));
  root.querySelectorAll("[data-cbsp]").forEach(i=>i.onchange=()=>setCheat(V,"blockSpell",{k:i.dataset.cbsp,on:i.checked}))}
function cheatWindow(){const V=view();if(!cheatHas(V))return;let w=$("#cheatw");if(!w){w=document.createElement("div");w.id="cheatw";w.className="faov";document.body.appendChild(w)}
  w.innerHTML=`<div class="ovbox wide cheatbox" role="dialog" aria-labelledby="cheatq"><button type="button" class="xclose" id="cheatX" aria-label="Close">×</button><h2 id="cheatq">Cheat mode</h2>${cheatHTML(V)}<p class="acts"><button type="button" class="btn" id="cheatOk">Done</button></p></div>`;
  w.hidden=false;wireCheat(w,V);const close=()=>{w.hidden=true};$("#cheatX").onclick=close;$("#cheatOk").onclick=close}
{const _r=render;render=function(){rSafe(_r,this,arguments);if(!G)return;const on=cheatOn(),V=view(),has=on&&cheatHas(V);
  // the sign every player sees
  let b=$("#cheatbadge");if(on&&!b){b=document.createElement("div");b.id="cheatbadge";b.textContent="Cheat mode";b.title="Cheat mode is on in this game.";document.body.appendChild(b)}if(b)b.hidden=!on;
  // the Cheat button beside Configure
  const bar=document.querySelector(".fabar");if(bar){let cb=bar.querySelector(".cheatb");if(has&&!cb){bar.insertAdjacentHTML("beforeend",`<button type="button" class="btn ghost sm cheatb" aria-label="Cheat mode">Cheat</button>`);cb=bar.querySelector(".cheatb");cb.onclick=cheatWindow}if(cb&&!has)cb.remove()}
  // the Cheats fold below Configure Automation
  let d=$("#cheatpanel");const want=has&&PREF.cheatPanel!==false;
  if(!want){if(d)d.remove()}else{const info=$("#info");if(info){if(!d){d=document.createElement("details");d.id="cheatpanel";d.className="cinfo cheatpanel";d.open=!!PREF.cheatOpen;d.addEventListener("toggle",()=>{PREF.cheatOpen=d.open;savePrefs()})}
    const fa=$("#fapanel");if(fa){if(d.previousElementSibling!==fa)fa.after(d)}else if(d.parentNode!==info||info.firstElementChild!==d)info.prepend(d);
    const key=JSON.stringify(CH())+V;if(d.dataset.k!==key){d.dataset.k=key;d.innerHTML=`<summary>Cheats <span class="dim fasum">· cheat mode is on</span></summary><p class="fafull automaster"><button type="button" class="btn sm ghost" id="cheatHide">Hide this fold</button><span class="dim">The Cheat button beside Configure still opens the menu; Display in the Menu brings this fold back.</span></p>${cheatHTML(V)}`;
      wireCheat(d,V);$("#cheatHide").onclick=()=>{PREF.cheatPanel=false;savePrefs();render()}}}}}}
/* the Menu can bring the fold back */
{const _om=openMenu;openMenu=function(){_om.apply(this,arguments);if(!cheatOn())return;const m=$("#menu"),a=m&&m.querySelector("#mCardSym");if(!a||m.querySelector("#mCheatPanel"))return;
  a.closest("label").insertAdjacentHTML("afterend",`<label class="f">Cheats fold <select id="mCheatPanel"><option value="1" ${PREF.cheatPanel!==false?"selected":""}>Shown</option><option value="0" ${PREF.cheatPanel===false?"selected":""}>Hidden</option></select></label>`);
  $("#mCheatPanel").onchange=e=>{PREF.cheatPanel=e.target.value==="1";savePrefs();render()}}}

if(window.__EC)Object.assign(window.__EC,{castW:(...a)=>cast(...a),eliminateW:(...a)=>eliminate(...a),cycleRoundW:(...a)=>cycleRound(...a),spellCostW:(...a)=>spellCost(...a),canAffordW:(...a)=>canAfford(...a),spellReadyW:(...a)=>spellReady(...a),spellBlockW:(...a)=>spellBlock(...a),cheatHas,setCheat:(...a)=>setCheat(...a),cheatEvent:(...a)=>cheatEvent(...a),cheatWindow,CH});

/* ---------- the setup switch asks first; turning it off doesn't ---------- */
document.addEventListener("change",e=>{const i=e.target;if(!i||i.id!=="ocheat"||!i.checked)return;i.checked=false;
  let w=$("#cheatq");if(!w){w=document.createElement("div");w.id="cheatq";w.className="faov";document.body.appendChild(w)}
  w.innerHTML=`<div class="ovbox cheatbox" role="alertdialog" aria-labelledby="cheatqh"><button type="button" class="xclose" id="cheatqX" aria-label="No, keep it off">×</button><h2 id="cheatqh">Are you sure?</h2>
<p>The game is not meant to be played like this. Cheat mode lets you change the rules while you play: free magic, infinite mana, every spell, blocks, rare events and spawns, and no victory or loss. Every player sees that it is on, and an online room shows it in the list.</p>
<p class="acts"><button type="button" class="btn" id="cheatqY">Yes, I understand</button></p></div>`;w.hidden=false;
  const close=on=>{w.hidden=true;i.checked=on;if(on)i.dispatchEvent(new Event("input",{bubbles:true}))};
  $("#cheatqY").onclick=()=>close(true);$("#cheatqX").onclick=()=>close(false);w.onclick=ev=>{if(ev.target===w)close(false)};$("#cheatqY").focus()});
document.addEventListener("keydown",e=>{const w=$("#cheatq");if(e.key==="Escape"&&w&&!w.hidden){w.hidden=true}});
