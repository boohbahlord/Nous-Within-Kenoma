/* ---------------- v65 ----------------
   - The Menu's sliders sit together in one compact block below the drop-downs: the name, ◀, the slider, ▶, the value. */

/* ---------- the Menu: every slider in one block below the drop-downs, with arrows ---------- */
function groupMenuSliders(){const m=$("#menu"),box=m&&m.querySelector(".ovbox");if(!box)return;
  const sl=[...box.querySelectorAll("label.mslide")];if(!sl.length)return;   // a slider inside a fold (Large Map Controls) stays in its fold, with arrows
  let g=box.querySelector(".mslides");if(!g){g=document.createElement("div");g.className="mslides";const first=box.querySelector(".mgrid");if(first)first.after(g);else box.appendChild(g)}
  for(const l of sl){const r=l.querySelector("input[type=range]");if(!r)continue;
    if(!l.querySelector(".mstep")){
      const name=[...l.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join("").trim();
      [...l.childNodes].filter(n=>n.nodeType===3).forEach(n=>n.remove());
      l.insertAdjacentHTML("afterbegin",`<span class="mname">${esc(name)}</span>`);
      const mk=(d,t,a)=>{const b=document.createElement("button");b.type="button";b.className="mstep";b.textContent=t;b.setAttribute("aria-label",`${name}: ${a}`);
        b.onclick=e=>{e.preventDefault();if(r.disabled)return;const st=+r.step||1,v=Math.min(+r.max,Math.max(+r.min,+r.value+d*st));if(v===+r.value)return;r.value=v;
          r.dispatchEvent(new Event("input",{bubbles:true}));r.dispatchEvent(new Event("change",{bubbles:true}))};return b};
      r.before(mk(-1,"◀","less"));r.after(mk(1,"▶","more"))}
    l.querySelectorAll(".mstep").forEach(b=>b.disabled=r.disabled);
    if(!l.closest("details")&&l.parentNode!==g)g.appendChild(l)}}
{const _om=openMenu;openMenu=function(){_om.apply(this,arguments);groupMenuSliders()}}

/* ---------- cards in the players' colors, further apart: each color has its own card tone (U3). Crimson and Ember used to
   come out the same muddy red-brown; now Crimson is a deep red and Ember a burnt orange. Light lettering reads on every one. */
const CARD_TONE={"#ee7a3c":"#8f4a0e","#e3b944":"#6f5a0c","#45b89c":"#14604f","#4c92e6":"#1f4c8c","#a77de8":"#55348f","#e4648f":"#8a2457","#d7333b":"#7e0d16","#8fb33f":"#46661a","#74d7ea":"#16687a"};
const toneOf=col=>CARD_TONE[String(col||"").toLowerCase()]||null;
const addTone=h=>h.replace(/style="--pc:([^";]*)/,(m,col)=>{const t=toneOf(col);return t?`style="--pc:${col};--pcb:${t}`:m});
{const _f=face;face=function(){return addTone(_f.apply(this,arguments))}}
{const _sd=siegeDecor;siegeDecor=function(){const h=_sd.apply(this,arguments);return h.replace(/(<div class="stack[^"]*v61[^"]*") style="--pc:([^";]*)/,(m,a,col)=>{const t=toneOf(col);return t?`${a} style="--pc:${col};--pcb:${t}`:m})}}

/* ---------- the opening: a clear line above the field says where the Ace goes (U2) ---------- */
{const _r=render;render=function(){_r.apply(this,arguments);if(!G)return;const b=$("#board");if(!b)return;
  const host=b.closest(".camwrap,.boardwrap")||b;let h=$("#acehint");
  const want=G.phase==="setup"&&G.setupStep==="ace"&&canAct()&&!G.p[G.active].cpu;
  if(!want){if(h)h.remove();return}
  const txt=hq()&&!G.p[G.active].opening.length?"Place your second base Ace: click any glowing tile on your backline.":"Place your Ace to start: click any glowing tile on your backline. It spawns your base, with a Jack inside.";
  if(!h){h=document.createElement("p");h.id="acehint";h.setAttribute("role","status")}
  if(h.textContent!==txt)h.textContent=txt;if(h.nextElementSibling!==host)host.before(h)}}

/* ---------- Miners at work can't be captured (N1): a stack with a Miner on a crystal (a mining slot on the field) can't be
   captured, nor can the cards with it. Miners in the Bank's plots and on the Moon are off the field; in an Ace they sit in a base. */
const mining=(r,c)=>{const t=G.board[r]&&G.board[r][c];return !!(t&&crystalAt(r,c)&&t.cards.some(x=>x.unit==="miner"))};
{const _ao=attackOptions;attackOptions=function(r,c){const out=_ao.apply(this,arguments);return Array.isArray(out)?out.filter(o=>!(o.mode==="capture"&&mining(o.r,o.c))):out}}
if(INFO.miner&&!INFO.miner[2].some(([k])=>k==="At work"))INFO.miner[2].push(["At work","can't be captured while mining on a crystal, and neither can the cards with it"]);

/* ---------- Lock in place (N2), only while Field Automation plays your field: the cards you lock stay where they are (the
   rest of their stack can still go). From the Selected box, or the free spell Lock in Place (shown only while Field
   Automation is on). Not on bases, pinned or stunned stacks, or cards already locked. A faint lock shows on the card; click
   the stack and a window offers to unlock it. ---------- */
const LOCK_SVG=`<svg viewBox="0 0 16 18" aria-hidden="true"><rect x="2.5" y="8" width="11" height="8.5" rx="1.6" fill="currentColor" fill-opacity=".35" stroke="currentColor" stroke-width="1.4"/><path d="M5,8V5.6a3,3 0 0 1 6,0V8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
const lockable=(c,st)=>!!c&&!!st&&!isBase(c)&&!st.pin&&!st.stun&&!c.faLock;
const lockIds=st=>{const s=G.sel,pick=s&&s.pick&&s.pick.size?s.pick:null;return st.cards.filter(x=>(!pick||pick.has(x.id))&&lockable(x,st)).map(x=>x.id)};
function setFaLock(pl,r,c,ids,on){const st=G.board[r]&&G.board[r][c];if(!st||st.owner!==pl||!Array.isArray(ids))return false;let n=0;
  for(const x of st.cards)if(ids.includes(x.id)){if(on&&lockable(x,st)){x.faLock=true;n++}else if(!on&&x.faLock){delete x.faLock;n++}}
  if(n)log(on?`${plName(pl)} locks ${n} card${n>1?"s":""} in place on ${coord(r,c)}: Field Automation won't move ${n>1?"them":"it"}.`:`${plName(pl)} unlocks ${n} card${n>1?"s":""} on ${coord(r,c)}: Field Automation may move ${n>1?"them":"it"} again.`);
  render();return n>0}
for(const [name,get,set] of [["setFaLock",()=>setFaLock,f=>setFaLock=f]]){
  NETFN[name]={get,set,any:true};const orig=get();set(function(...a){if(NET.role!=="guest")return orig.apply(this,a);const rid=++NET.rid;sendHost({t:"cmd",fn:name,args:netClean(a),ui:uiSnap(),rid})})}
/* the free spell, shown only while Field Automation is on */
SPELLS.push({id:"falock",name:"Lock in Place",cost:0,school:"Enchantment",
  text:"Field Automation only. Select your stack (and check the cards, or leave all): they stay where they are; Field Automation won't move them. Not on bases, pinned or stunned stacks, or cards already locked.",
  ok:()=>{const st=selStack();return faOn(G.active)&&!!st&&st.owner===G.active&&lockIds(st).length>0},
  run:()=>{const st=selStack();if(st)setFaLock(G.active,G.sel.r,G.sel.c,lockIds(st),true)}});
SPELL_TEXT.falock={n:"Field Automation only. Free.",e:"The cards you select stay where they are: Field Automation won't move them.",l:"Not on bases, pinned or stunned stacks, or cards already locked. Click the stack to unlock."};
{const _r=render;render=function(){_r.apply(this,arguments);if(!G)return;if(!faOn(view()))document.querySelectorAll('[data-s="falock"]').forEach(b=>b.remove())}}
/* the Selected box: lock or unlock */
{const _rs=renderSel;renderSel=function(live){_rs.apply(this,arguments);if(!G||!G.sel)return;const V=view(),st=selStack(),box=$("#selbox");
  if(!box||!st||st.owner!==V||!faOn(V)||isNPC(V)||showsBack(V,G.sel.r,G.sel.c))return;
  const ids=lockIds(st),locked=st.cards.filter(x=>x.faLock).map(x=>x.id);if(!ids.length&&!locked.length)return;
  const {r,c}=G.sel;
  box.insertAdjacentHTML("beforeend",`<p class="falockrow"><span class="dim">Field Automation:</span>${ids.length?` <button type="button" class="btn sm ghost" id="faLockB"><i class="flockico">${LOCK_SVG}</i> Lock in place${ids.length<st.cards.length?` (${ids.length})`:""}</button>`:""}${locked.length?` <button type="button" class="btn sm ghost" id="faUnlockB">Unlock movement (${locked.length})</button>`:""}</p>`);
  if($("#faLockB"))$("#faLockB").onclick=()=>setFaLock(V,r,c,ids,true);
  if($("#faUnlockB"))$("#faUnlockB").onclick=()=>setFaLock(V,r,c,locked,false)}}
/* the faint lock on the card (for its own player) */
const showLock=c=>!!(c&&c.faLock&&G&&c.owner!=null&&c.owner===view()&&faOn(c.owner));
{const _f=face;face=function(c){const h=_f.apply(this,arguments);return showLock(c)?h.replace(/<\/span>$/,`<span class="flock" title="Locked in place">${LOCK_SVG}</span></span>`):h}}
{const _sd=siegeDecor;siegeDecor=function(inner,st,V,r,c){const h=_sd.apply(this,arguments);if(!st||st.owner!==V||!faOn(st.owner)||!st.cards.some(x=>x.faLock))return h;
  return h.replace(/(<div class="stack[^>]*>)/,`$1<span class="flock" title="Locked in place: Field Automation won't move ${st.cards.every(x=>x.faLock||isBase(x))?"this stack":"the locked cards"}">${LOCK_SVG}</span>`)}}
/* click a locked stack of yours: a window offers to unlock it */
document.addEventListener("click",e=>{if(!G||G.over)return;const t=e.target.closest&&e.target.closest("#board .tile");if(!t)return;
  const r=+t.dataset.r,c=+t.dataset.c,V=view(),st=G.board[r]&&G.board[r][c];
  if(!st||st.owner!==V||!faOn(V)||!st.cards.some(x=>x.faLock))return;
  setTimeout(()=>{let w=$("#lockq");if(!w){w=document.createElement("div");w.id="lockq";w.className="faov";document.body.appendChild(w)}
    const ids=st.cards.filter(x=>x.faLock).map(x=>x.id);
    w.innerHTML=`<div class="ovbox lockbox" role="dialog" aria-labelledby="lockqh"><button type="button" class="xclose" id="lockqX" aria-label="Keep it locked">×</button><h2 id="lockqh">Unlock movement?</h2>
<p>${ids.length>1?`${ids.length} cards here are`:"A card here is"} locked in place: Field Automation won't move ${ids.length>1?"them":"it"}.</p>
<p class="acts"><button type="button" class="btn" id="lockqY">Yes, unlock</button> <button type="button" class="btn ghost" id="lockqN">Keep it locked</button></p></div>`;w.hidden=false;
    const close=()=>{w.hidden=true};$("#lockqY").onclick=()=>{close();setFaLock(V,r,c,ids,false)};$("#lockqN").onclick=close;$("#lockqX").onclick=close;w.onclick=ev=>{if(ev.target===w)close()};$("#lockqY").focus()},0)},true);
if(window.__EC)Object.assign(window.__EC,{setFaLock:(...a)=>setFaLock(...a),attackOptionsW:(...a)=>attackOptions(...a),faceW:(...a)=>face(...a)});

/* ---------- blind: Field Automation and Lazy Hand pause (N3). While a player is blinded (the second Sun, an eclipse and the
   like) their field isn't played for them and Lazy Hand places nothing; both stay on and carry on once they can see. ---------- */
const blindPause=pl=>typeof totalBlind==="function"&&totalBlind(pl);
function notePause(pl,what){const k=what+"|"+G.turnNo;G._blindNote=G._blindNote||{};if(G._blindNote[pl]===k)return;G._blindNote[pl]=k;
  log(`${what} pauses while ${plName(pl)} is blind; it carries on when they can see again.`,"event")}
{const _fr=faRun;faRun=async function(pl){if(G&&faOn(pl)&&blindPause(pl)){notePause(pl,"Field Automation");return}return _fr.apply(this,arguments)}}
{const _lp=lhAutoPlace;lhAutoPlace=async function(pl){if(G&&blindPause(pl)){const c=G.p[pl].lhCfg;if(c&&c.autoPlace)notePause(pl,"Lazy Hand");return}return _lp.apply(this,arguments)}}
{const _ls=lhAutoSac;lhAutoSac=async function(pl){if(G&&blindPause(pl))return;return _ls.apply(this,arguments)}}
{const _l=lazyPlace;lazyPlace=function(card){if(G&&blindPause(G.active)){G.selHand=card;G.mode=null;flash("Lazy Hand pauses while you are blind: place this card yourself.");render();return false}return _l.apply(this,arguments)}}
/* the buttons say so */
{const _r=render;render=function(){_r.apply(this,arguments);if(!G)return;const V=view();if(V==null||!blindPause(V))return;
  const t=document.querySelector(".fabar .fatog");if(t&&faOn(V)&&!t.dataset.blind){t.dataset.blind="1";t.textContent="Auto field: paused (blind)";t.title="Field Automation pauses while you are blind; it carries on when you can see again."}
  const l=$("#lazyBtn");if(l&&!l.classList.contains("blindpause")){l.classList.add("blindpause");l.setAttribute("data-tip","Lazy Hand pauses while you are blind.")}}}
if(window.__EC)Object.assign(window.__EC,{skyAsyncW:(...a)=>skyAsync(...a),totalBlindW:V=>totalBlind(V),faRunW2:(...a)=>faRun(...a),lhAutoPlaceW:(...a)=>lhAutoPlace(...a)});

/* ---------- v66: the Puppet's picture: a round head in the middle of the card, like a puppet toy or a dummy doll: dot eyes, a
   small nose, a smile and a boy's hair. It stays clear of the count in the corner (the old hanging puppet ran into it). ---------- */
UNIT_ICON.puppet=`<g transform="translate(0,.6)">`+
  `<path d="M-6.9,1.6a6.9,7.2 0 1,0 13.8,0a6.9,7.2 0 1,0 -13.8,0Z"/>`+   // the head
  `<path d="M-7.1,1.3C-7.5,-5.4 -3.4,-8.9 0.3,-8.7C4.6,-8.5 7.6,-5.3 7.1,0.9L5.6,-1.9L4,-0.2L2.5,-2.5L0.7,-0.5L-1,-2.8L-2.8,-0.6L-4.4,-2.6L-5.9,-0.4Z" fill="@" stroke-width="1.1"/>`+   // a boy's hair, a cap with a jagged fringe
  `<path d="M-6.9,1.4c-1.6,-.2 -1.9,2.6 -.3,3 M6.9,1.4c1.6,-.2 1.9,2.6 .3,3" stroke-width="1.2"/>`+   // the ears
  `<circle cx="-2.6" cy="2.4" r="1.15" fill="@" stroke="none"/><circle cx="2.6" cy="2.4" r="1.15" fill="@" stroke="none"/>`+   // dot eyes
  `<circle cx="0" cy="4.5" r=".6" fill="@" stroke="none"/>`+   // a small nose
  `<path d="M-3,5.9Q0,8.8 3,5.9" stroke-width="1.5"/></g>`;   // a smile   // a small nose and a smile

/* ---------- v66: hearts down the left edge of the card, top to bottom; smaller when there are many ---------- */
const heartN=h=>h.replace(/<span class="hearts" aria-label="(\d+) of (\d+) hearts"/g,(m,a,b)=>`${m} style="--hn:${Math.max(3,+b)}"`);
{const _f=face;face=function(){return heartN(_f.apply(this,arguments))}}
{const _sd=siegeDecor;siegeDecor=function(){return heartN(_sd.apply(this,arguments))}}

/* ---------- v67: a popup whenever a wildcard dies, saying where it went; several at once share one popup. Samson keeps his
   own ("Antony rises": a new card arose from the old one), and so does Antony; the BullGoat's says the Goatbull will come. ---------- */
const WILD_DEAD=new Set(["satan","leviathan","bullgoat","goatbull","debt","slavemaster","slave","trafficker","tree"]);
let wildQ=[];
function wildFlush(){const q=wildQ;wildQ=[];if(!q.length||!G)return;
  const lines=q.map(x=>`<li>${x.html}</li>`).join(""),born=q.some(x=>x.born);
  popup(q.length>1?"Wildcards are dead":q[0].title,q.length>1?`<ul class="wilddead">${lines}</ul>`:`<p>${q[0].html}</p>`,q[0].owner)}
{const _bu=bury;bury=function(card,r,c,st){const u=card&&card.unit,owner=st&&st.owner,was=u;
  const out=_bu.apply(this,arguments);
  if(!G||!was||!WILD_DEAD.has(was)||owner==null||!G.p[owner])return out;
  const who=esc(G.p[owner].name),nm=esc(UNIT[was].name);let where,title=`${UNIT[was].short||UNIT[was].name} is dead`,born=false;
  if(was==="bullgoat"){title="The Goatbull will rise";born=true;where=`${who}'s BullGoat is dead. It goes back into the deck and will be drawn again as the Goatbull: a new card arises from the old one.`}
  else if(was==="slave")where=`${who}'s Slave is dead. It dies as the soldier it once was, into the grave.`;
  else{const at=G.dark.includes(card)?"falls into the Outer Darkness":G.ether.includes(card)?"goes to the Ether":G.grave.includes(card)?"lies in the grave":"is gone";where=`${who}'s ${nm} is dead: it ${at}.`}
  wildQ.push({title,html:where,owner,born});if(wildQ.length===1)setTimeout(wildFlush,0);
  return out}}

/* ---------- v68: tile names on by default (once, for everyone; the Menu and the Display bar still turn them off) ---------- */
if(!PREF.coordsOn68){PREF.coordsOn68=true;PREF.coords=true;try{savePrefs();applyPrefs()}catch(e){}}

/* ---------- v69: each computer's playstyle (an archetype; Random picks one for the game) ---------- */
{const _m=mkPlayer;mkPlayer=function(i,o){const P=_m.apply(this,arguments);if(P.cpu&&P.cpu!=="horde"&&!P.npc&&!(o&&o.npc)){const ks=Object.keys(AI.ARCH);P.arch=ks.includes(o&&o.arch)?o.arch:pick(ks)}return P}}

/* ---------- v70: no more crystals on the field than there are players (not in King of the Hill) ---------- */
{const _sc=spawnCrystal;spawnCrystal=function(){if(G&&!kothOn()){const n=G.p.filter(P=>!isNPC(P.i)&&!isHorde(P.i)).length;if((G.crystals||[]).length>=n)return false}return _sc.apply(this,arguments)}}

/* ---------- v70: Aces and Walls are unlimited in the Ether (an empty Ether makes a new one) ---------- */
UNLIMITED.add("wall");
{const sp=SP("ca");if(sp)sp.ok=()=>true}
{const _c=conjure;conjure=async function(k){if(k==="ace"&&!G.ether.some(c=>kind(c)==="ace")){const c=mk("A",pick(["S","H","D","C"]));c.owner=G.active;me().deck.push(c);shuffle(me().deck);
  log(`An Ace's soul materializes from the Ether into ${plName(G.active)}'s deck.`);return}return _c.apply(this,arguments)}}

/* ---------- v70: while an eclipse's, the Blood Moon's or the Moon's event sound plays, the music fades out slowly to make room ---------- */
{const _sa=AUD.setAmb;if(typeof _sa==="function")AUD.setAmb=function(k){const out=_sa.apply(this,arguments);try{window.ECMusic&&ECMusic.hold&&ECMusic.hold(!!k)}catch(e){}return out}}

/* ---------- v70: a planet's own magic shows its own sign, in its own color: when the sky acts by itself (not a player's
   spell), its astrological sign rises over the tile it touches, or over the field ---------- */
const PLANET_SIGN={
  moon:["#ece6d2",`<path d="M15.5 3.6a8.6 8.6 0 1 0 0 16.8a7 7 0 1 1 0-16.8z"/>`],
  blood:["#e0303c",`<path d="M15.5 3.6a8.6 8.6 0 1 0 0 16.8a7 7 0 1 1 0-16.8z"/>`],
  sun:["#9a82ff",SIGN.Sorcery],
  blacksun:["#8a78b0",`<circle cx="12" cy="12" r="5.6" fill="currentColor"/><path d="M12 2.2v2.6M12 19.2v2.6M2.2 12h2.6M19.2 12h2.6M5.1 5.1l1.8 1.8M17.1 17.1l1.8 1.8M5.1 18.9l1.8-1.8M17.1 6.9l1.8-1.8"/>`],
  mars:["#e0503a",SIGN.Curse],
  venus:["#f4dca6",`<circle cx="12" cy="8.6" r="5.2"/><path d="M12 13.8v8 M8.4 18.2h7.2"/>`],
  jupiter:["#e2b882",SIGN.Enchantment],
  mercury:["#d4cec6",`<path d="M8 2.6c0 2.6 1.8 4 4 4s4-1.4 4-4"/><circle cx="12" cy="11" r="4.2"/><path d="M12 15.2v6.6 M9 18.8h6"/>`],
  saturn:["#d4ac52",SIGN.Necromancy],
  neptune:["#3f9be0",SIGN.Illusion]};
function planetFX(k,r,c){if(!FX.on()||!PLANET_SIGN[k])return;const [col,path]=PLANET_SIGN[k];
  const rect=r!=null?FX.tile(r,c):(()=>{const b=$("#board");return b?b.getBoundingClientRect():null})();if(!rect)return;
  const s=r!=null?Math.max(44,rect.height*.8):Math.min(150,Math.max(90,rect.width*.22));
  const e=FX.make("sign planetsign",rect,{w:s,h:s,col,html:`<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`});if(!e)return;
  e.style.color=col;e.style.filter=`drop-shadow(0 0 6px ${col})`;
  FX.play(e,[{transform:"translateY(8px) scale(.55)",opacity:0},{transform:"translateY(-4px) scale(1)",opacity:.95,offset:.3},{transform:`translateY(${r!=null?-26:-40}px) scale(1.15)`,opacity:0}],r!=null?1300:1700)}
const skySignK=()=>{const m=G.moon;return m.gone?(m.gone==="off"?null:m.gone):m.blood?"blood":"moon"};
{const _e=eclipse;eclipse=async function(k){later(()=>planetFX(k==="sun"&&G.moon.gone==="blacksun"?"blacksun":k));return _e.apply(this,arguments)}}
{const _v=venusCycle;venusCycle=function(){later(()=>planetFX("venus"));return _v.apply(this,arguments)}}
{const _m=mercuryCycle;mercuryCycle=async function(){later(()=>planetFX("mercury"));return _m.apply(this,arguments)}}
{const _f=fullMoonToll;fullMoonToll=async function(){later(()=>planetFX(G.moon.blood?"blood":"moon"));return _f.apply(this,arguments)}}
{const _d=damage;damage=function(r,c){if(G&&G.sunHurt)later(()=>planetFX("sun",r,c));return _d.apply(this,arguments)}}
{const _ms=moonStart;moonStart=async function(){const was=G.moon.blood;const out=await _ms.apply(this,arguments);if(G.moon.blood&&!was)later(()=>planetFX("blood"));return out}}
