/* ---------------- v62: mining slots, and wildcards that say what they're for ----------------
   - Each wildcard's card info starts with one short line on how to use it (the Selected box and the card's tips show the
     same info). */

/* ---------- wildcards: what each is for, in a line ---------- */
const WILD_USE={
  samson:"Shoot an enemy two tiles away (3d20) or slash up close. Stacks only with an Ace. When he falls, Antony rises.",
  antony:"Every card he kills charges a bolt for Lightning Strike.",
  satan:"Fights at 6d12 with no modifiers, alone. Lead with him into your strongest enemy.",
  leviathan:"At a New Moon, Rise to the Moon (free): every enemy pays a toll each New Moon after. What it kills goes to the Outer Darkness.",
  bullgoat:"Charge an enemy two or three tiles away in a straight line (10 + 2d20). When it dies it comes back as the Goatbull.",
  goatbull:"Stomp a stack to pin it for 2d2 of its turns; charge an enemy exactly two tiles away.",
  debt:"Fights with the score of the card it faces. Only players in debt to the Bank can strike it.",
  slavemaster:"Enemy soldiers killed in its fights become your thralls (ten at most).",
  slave:"Shoot an enemy two tiles away (10 + 1d12). No defense; keep it behind your lines.",
  trafficker:"Enemies that die beside it become prisoners (three at most); sell them with Life for Sell."};
for(const [u,t] of Object.entries(WILD_USE))if(INFO[u]&&Array.isArray(INFO[u][2])&&!INFO[u][2].some(r=>r[0]==="Use"))INFO[u][2].unshift(["Use",t]);

/* ---------- Mining slots (the user's design) ----------
   A row of small slots below the field, the hand, the Grave and Ether row and the dice: one for each of your Aces (two Miners),
   each crystal one of your stacks stands on, each plot of the Bank's land you hold, and the Moon (when your Miner is on it,
   or your Leviathan is: then the Moon's mining slot is yours). Pick a Miner in your hand, then a lit slot: the Miner goes
   straight there, wherever it is on the field. Each slot shows its takings: the last pay period (its rounds), a turn on
   average, and ever. ▾ folds it; the arrow at the right moves it below Configure Automation, then below Help, then back. */
mineNote=function(pl,key,n){if(!G)return;const M=G.mine=G.mine||{},k=pl+"|"+key,e=M[k]||(M[k]={t:0,h:[]});n=Math.round(n*100)/100;e.t=Math.round((e.t+n)*100)/100;e.h.push([G.moon.round,n]);if(e.h.length>90)e.h.shift()};
{const _cr=cycleRound;cycleRound=function(){try{if(G&&typeof payDay==="function"&&payDay()){const a=G.payHist=G.payHist||[];if(a[a.length-1]!==G.moon.round)a.push(G.moon.round)}}catch(e){}return _cr.apply(this,arguments)}}
function minePeriod(){const ph=(G.payHist||[]).filter(x=>x<=G.moon.round);
  if(!ph.length)return {a:1,b:G.moon.round,done:false};return {a:ph.length>1?ph[ph.length-2]+1:1,b:ph[ph.length-1],done:true}}
function mineStats(pl,key){const e=G.mine&&G.mine[pl+"|"+key];if(!e)return null;const P=minePeriod(),inP=e.h.filter(([r])=>r>=P.a&&r<=P.b);
  const sum=Math.round(inP.reduce((a,x)=>a+x[1],0)*10)/10;return {P,sum,avg:inP.length?Math.round(sum/inP.length*10)/10:0,turns:inP.length,ever:e.t}}
function mineSlots(V){const out=[];if(!G||V==null||!G.p[V]||G.phase==="setup")return out;
  for(const {st,r,c} of stacksOf(V)){const ms=st.cards.filter(x=>x.unit==="miner"),ace=st.cards.find(x=>kind(x)==="ace");
    if(ace){out.push({k:"ace:"+ace.id,kind:"ace",name:"Ace",at:coord(r,c),r,c,st,ms,cap:2});continue}
    const cr=crystalAt(r,c);if(cr)out.push({k:"cr:"+r+"."+c,kind:"cr",name:"Crystal",at:coord(r,c),sub:`${cr.left} left`,r,c,st,ms,cap:1})}
  for(const p of G.plots||[])if(p.owner===V)out.push({k:"plot:"+p.i,kind:"plot",name:`Plot ${p.i+1}`,at:"land from the Bank",p,ms:p.miners,cap:1});
  const MM=G.moonMiner,ML=G.moonLev,mine=MM&&MM.owner===V,lev=ML&&ML.owner===V;
  if(mine||lev&&!G.moon.gone)out.push({k:"moon",kind:"moon",name:"The Moon",at:lev?"the Leviathan's":"",ms:mine?[MM.card]:[],lev:lev?ML.card:null,cap:1});
  return out}
/* can the Miner picked in the hand go into this slot now? */
function mineFits(s,V){const m=G&&G.selHand;if(!m||m.unit!=="miner"||G.active!==V||G.phase!=="prep"||!canAct())return false;
  if(s.kind==="ace"||s.kind==="cr")return s.st.owner===V&&stackLegal([...s.st.cards,m]);
  if(s.kind==="plot")return !s.p.miners.length;
  if(s.kind==="moon")return !!s.lev&&!G.moonMiner&&!G.moon.gone;return false}   // v78j
/* the Moon's mining slot, held by the Leviathan's player */
function moonPlant(pl){const ML=G.moonLev,m=G.p[pl].hand.find(x=>x.unit==="miner");if(!ML||ML.owner!==pl||G.moonMiner||!m||G.moon.gone)return false;   // v78j: the Moon must be in the sky
  G.p[pl].hand.splice(G.p[pl].hand.indexOf(m),1);m.owner=pl;G.moonMiner={owner:pl,card:m};G.selHand=null;
  log(`${plName(pl)} sends a Miner up to the Moon, where the Leviathan keeps watch: it mines from the next turn.`);return true}
NETFN.moonPlant={get:()=>moonPlant,set:f=>moonPlant=f};{const orig=moonPlant;moonPlant=function(...a){if(NET.role!=="guest")return orig.apply(this,a);const rid=++NET.rid;sendHost({t:"cmd",fn:"moonPlant",args:netClean(a),ui:uiSnap(),rid})}}
function mineAct(s,V){if(!mineFits(s,V))return;const m=G.selHand;
  if(s.kind==="ace"||s.kind==="cr")place(m,s.r,s.c);else if(s.kind==="plot"){plantMiner(V,s.p);G.selHand=null}else if(s.kind==="moon")moonPlant(V);
  render()}
const MINE_POS=["hand","field","auto","help"];   // v74d: above the hand cards by default (and always in fullscreen)
function mineSlotHTML(s,V){const st=mineStats(V,s.k),fit=mineFits(s,V),empty=Math.max(0,s.cap-s.ms.length);
  const cards=(s.lev?face(s.lev,{cls:"sm",noci:true}):"")+s.ms.map(m=>face(m,{cls:"sm",noci:true})).join("")+Array.from({length:empty},()=>`<span class="msempty" aria-hidden="true"></span>`).join("");
  const stat=st?`<span class="msstat"><span>Rounds ${st.P.a}–${st.P.b}${st.P.done?"":"…"}: <b>${st.sum}</b> (<b>${st.avg}</b> a turn)</span><span>Ever: <b>${st.ever}</b> mana</span></span>`:"";
  return `<button type="button" class="mslot k-${s.kind}${fit?" tplace":""}" data-ms="${esc(s.k)}" ${fit?"":"aria-disabled=\"true\""} title="${esc(s.name+(s.at?" · "+s.at:""))}${fit?": place the Miner here":""}">
<span class="msn"><b>${esc(s.name)}</b>${s.at?`<small>${esc(s.at)}</small>`:""}${s.sub?`<small>${esc(s.sub)}</small>`:""}<em>${s.ms.length}/${s.cap||1}</em></span><span class="msc">${cards}</span>${stat}</button>`}
function paintMines(){if(!G)return;const V=view(),slots=mineSlots(V);let box=$("#minepanel");
  if(!slots.length){if(box)box.hidden=true;return}
  if(!box){box=document.createElement("section");box.id="minepanel";box.className="minepanel";box.setAttribute("aria-label","Mining slots")}
  const fs=typeof fsOn==="function"&&fsOn(),at=PREF.mineAt|0,pos=fs?"hand":MINE_POS[at]||"hand",hand=$("#hand");
  if(pos==="hand"&&hand){if(box.nextElementSibling!==hand)hand.before(box)}
  else{const anchor=pos==="auto"?($("#fapanel")||$("#helphead")):pos==="help"?$("#info"):($("#dicefold")||$("#shared"));if(anchor&&box.previousElementSibling!==anchor)anchor.after(box)}
  box.classList.toggle("msmini",pos==="hand");
  const open=PREF.mineOpen!==false,picking=G.selHand&&G.selHand.unit==="miner";box.hidden=false;
  const next=MINE_POS[(at+1)%4],nt={hand:"Move back above your hand",field:"Move below the field",auto:"Move below Configure Automation",help:"Move below Help"}[next];
  box.innerHTML=`<div class="mshead"><button type="button" class="msfold" aria-expanded="${open}">${open?"▾":"▸"} Mining slots <span class="dim">${slots.length}</span></button>${picking&&open?`<span class="mshint">Pick a lit slot for your Miner.</span>`:""}${fs?"":`<button type="button" class="msmove" title="${nt}" aria-label="${nt}">${next==="hand"?"⇡":"⇣"}</button>`}</div>${open?`<div class="msrow">${slots.map(s=>mineSlotHTML(s,V)).join("")}</div>`:""}`;
  box.querySelector(".msfold").onclick=()=>{PREF.mineOpen=!open;savePrefs();paintMines()};
  const mv=box.querySelector(".msmove");if(mv)mv.onclick=()=>{PREF.mineAt=(at+1)%4;savePrefs();paintMines();box.scrollIntoView({block:"nearest"})};
  box.querySelectorAll("[data-ms]").forEach(b=>b.onclick=()=>{const s=slots.find(x=>x.k===b.dataset.ms);if(s)mineAct(s,V)})}
{const _r=render;render=function(){rSafe(_r,this,arguments);try{paintMines()}catch(e){console.error(e)}}}
if(window.__EC)Object.assign(window.__EC,{mineSlots,mineStats,moonPlant:(...a)=>moonPlant(...a),paintMines});
/* the wildcards' use line also in the Selected box (a wildcard picked in the hand, or in the stack picked on the field) and
   in the card's own tip */
{const _r=render;render=function(){rSafe(_r,this,arguments);if(!G)return;const box=$("#selbox");if(!box||box.querySelector(".wilduse"))return;
  let cards=[];if(G.selHand)cards=[G.selHand];else if(G.sel&&G.board[G.sel.r]&&G.board[G.sel.r][G.sel.c])cards=G.board[G.sel.r][G.sel.c].cards;
  const us=[...new Set(cards.filter(c=>c.unit&&WILD_USE[c.unit]).map(c=>c.unit))];if(!us.length)return;
  box.insertAdjacentHTML("afterbegin",us.map(u=>`<p class="wilduse"><b>${esc((UNIT[u].short||UNIT[u].name))}</b> ${esc(WILD_USE[u])}</p>`).join(""))}}
{const _f=face;face=function(c,o){const h=_f.apply(this,arguments);if(!c||!c.unit||!WILD_USE[c.unit])return h;return h.replace(/title="([^"]*)"/,(m,t)=>`title="${t}: ${esc(WILD_USE[c.unit])}"`)}}

/* ---------- N1: a Wall can also go up on any empty tile within a circle of two around one of your Repairmen; while a Wall is
   picked in the hand, the Repairmen's tiles glow blue ---------- */
const nearRepair=(pl,r,c)=>stacksOf(pl).some(({st,r:a,c:b})=>st.cards.some(x=>x.unit==="repair")&&(a-r)**2+(b-c)**2<=5);   // a round circle of two
{const _cp=canPlace;canPlace=function(card,r,c){if(_cp.apply(this,arguments))return true;
  if(!G||!card||kind(card)!=="wall"||G.phase==="setup"||isVoid(r,c)||fogTile(G.active,r,c)||G.board[r][c])return false;return nearRepair(G.active,r,c)}}   // v78j: seen tiles only
{const _r=render;render=function(){rSafe(_r,this,arguments);if(!G||!G.selHand||kind(G.selHand)!=="wall")return;
  for(const {st,r,c} of stacksOf(G.active))if(st.cards.some(x=>x.unit==="repair")){const t=document.querySelector(`#board .tile[data-r="${r}"][data-c="${c}"]`);if(t)t.classList.add("repsrc")}}}
if(INFO.wall)INFO.wall[2]=INFO.wall[2].map(([k,v])=>k==="Moves"?[k,"never; it goes up on any empty tile of your spawn lines, or on any empty tile within two of one of your Repairmen"]:[k,v]);
if(INFO.repair&&!INFO.repair[2].some(r=>r[0]==="Builds"))INFO.repair[2].splice(1,0,["Builds","a Wall from your hand can go up on any empty tile within two of him"]);

/* ---------- N8: the map's art in a few steps (Full, two thirds, one third, Off); with the map off, the tiles nobody can play
   glow very faintly (no animation) so the field's shape still shows ---------- */
const MAP_STEPS=[["Off",0],["⅓",.33],["⅔",.66],["Full",1]];
const mapStep=()=>{const v=PREF.mapStep;return v==null?3:Math.max(0,Math.min(3,v|0))};
{const _ap=applyPrefs;applyPrefs=function(){_ap.apply(this,arguments);const s=mapStep();document.documentElement.style.setProperty("--mapop",MAP_STEPS[s][1]);document.documentElement.classList.toggle("nomap",s===0)}}
{const _om=openMenu;openMenu=function(){_om.apply(this,arguments);const m=$("#menu"),a=m&&m.querySelector("#mPxMap");if(!a||m.querySelector("#mMapOp"))return;
  a.closest("label").insertAdjacentHTML("afterend",`<label class="f mslide">Map <input type="range" id="mMapOp" min="0" max="3" step="1" value="${mapStep()}"><b id="mMapOpV">${MAP_STEPS[mapStep()][0]}</b></label>`);
  $("#mMapOp").oninput=e=>{PREF.mapStep=+e.target.value;$("#mMapOpV").textContent=MAP_STEPS[PREF.mapStep][0];savePrefs();applyPrefs()}}}

/* ---------- music: The Crossroads plays while a game is set up; the game's songs once it starts ---------- */
{const _sg=startGame;startGame=function(){const out=_sg.apply(this,arguments);try{window.ECMusic&&ECMusic.setLobby&&ECMusic.setLobby(false)}catch(e){}return out}}
{const _ss=showStart;showStart=function(){const out=_ss.apply(this,arguments);try{window.ECMusic&&ECMusic.setLobby&&ECMusic.setLobby(true)}catch(e){}return out}}
