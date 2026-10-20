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
UNIT_ICON.puppet=`<g transform="scale(1.15)">`+`<path d="M6.4,1.4a6.4,6.4 0 1,1 -12.8,0a6.4,6.4 0 1,1 12.8,0Z"/>`+   // the head
  `<path d="M-6.2,-0.4C-6.4,-4.6 -3.4,-6.9 0.2,-6.9C3.4,-6.9 6.2,-4.9 6.3,-0.6 M-5.6,-2.2L-3.6,-4.9 M-3.3,-1.9L-1.4,-5.4 M-0.8,-1.8L0.9,-5.6 M1.7,-2L3.3,-5.2 M0.4,-6.9C0.8,-8.6 2.4,-9.2 3.3,-8.3"/>`+   // a boy's fringe and a tuft
  `<circle cx="-2.3" cy="0.9" r="0.95" fill="@" stroke="none"/><circle cx="2.3" cy="0.9" r="0.95" fill="@" stroke="none"/>`+   // dot eyes
  `<path d="M0,2.2V3.1"/><path d="M-2.7,4.6Q0,6.6 2.7,4.6"/></g>`;   // a small nose and a smile

/* ---------- v66: hearts down the left edge of the card, top to bottom; smaller when there are many ---------- */
const heartN=h=>h.replace(/<span class="hearts" aria-label="(\d+) of (\d+) hearts"/g,(m,a,b)=>`${m} style="--hn:${Math.max(3,+b)}"`);
{const _f=face;face=function(){return heartN(_f.apply(this,arguments))}}
{const _sd=siegeDecor;siegeDecor=function(){return heartN(_sd.apply(this,arguments))}}
