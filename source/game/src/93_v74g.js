/* ---------- v74g: cards someone else can see; news at the Auction and the Bank ----------
   - Seen cards: while another player can see your hand (everyone under the Sun's eclipse; the Naked Hand's caster and their
     side while it lasts), every card in it wears a see-through Eye (it fades in and out, never fully, with animations on)
     and, at its top, the symbol of each player who can see it.
   - Spells: something new at the Auction (not your own sale) or at the Bank (a loan someone asks of you) puts a glow and a
     "!" on Spells (its heading; in fullscreen, its drawer tab). Clicking it shows a small notice at the bottom of the spells:
     where it comes from and what it is (several at once in one line), with a button that shows you where. Seen or closed,
     the "!" stays away until something new comes in. */
const EYE_SVG=`<svg viewBox="0 0 48 30" aria-hidden="true"><path d="M2 15C10 4 38 4 46 15 38 26 10 26 2 15Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><circle cx="24" cy="15" r="7.5" fill="none" stroke="currentColor" stroke-width="2.6"/><circle cx="24" cy="15" r="3" fill="currentColor"/></svg>`;
function handSeers(V){if(!G||!G.p[V]||G.passing)return [];const P=G.p[V];
  return G.p.filter(Q=>Q.i!==V&&!Q.out&&!isNPC(Q.i)&&Q.cpu!=="horde"&&(eclipseOn("sun")||P.shownBy!=null&&(P.shownBy===Q.i||!isEnemy(P.shownBy,Q.i)))).map(Q=>Q.i)}
{const _r=render;render=function(){rSafe(_r,this,arguments);if(!G)return;const V=view(),who=handSeers(V);
  const sym=who.map(i=>{const Q=G.p[i];return `<i style="--pc:${Q.color}" title="${esc(Q.name)} can see it">${solidSVG(Q.solid,Q.color,12)}</i>`}).join(""),names=who.map(i=>G.p[i].name).join(", ");
  for(const b of document.querySelectorAll("#hand [data-h]")){b.querySelectorAll(".seeneye,.seers").forEach(x=>x.remove());b.classList.toggle("seen",!!who.length);if(!who.length)continue;
    b.insertAdjacentHTML("beforeend",`<span class="seeneye" aria-hidden="true">${EYE_SVG}</span><span class="seers">${sym}</span>`);
    const l=b.getAttribute("aria-label")||"";if(!/ · seen by /.test(l))b.setAttribute("aria-label",`${l} · seen by ${names}`)}}}

/* ---- Spells: the "!" and its notice ---- */
const SPSEEN=new Map();   // per game and seat: what this device has been told about already
const spKey=()=>G&&G.map?`${G.map.seed}:${view()}`:"";
function spNotes(V){const out=[];if(!G||!G.p[V])return out;
  for(const it of G.auction||[])if(it&&it.card&&it.seller!==V)out.push({k:"a"+it.card.id,src:"auction",what:`${nameOf(it.card)}${it.price?` for ${it.price} mana`:""}${it.bank?" (the Bank sells it)":""}`});
  if(typeof loanReqsFor==="function")for(const L of loanReqsFor(V))out.push({k:"l"+L.id,src:"bank",what:`${G.p[L.from]?G.p[L.from].name:"Someone"} asks you for a loan of ${L.n} mana`});
  return out}
const spSeenSet=()=>{const k=spKey();let s=SPSEEN.get(k);if(!s){s=new Set();SPSEEN.set(k,s)}return s};
const spFresh=V=>{const s=spSeenSet();return spNotes(V).filter(n=>!s.has(n.k))};
const spWhere=src=>src==="bank"?(typeof dipOn==="function"&&dipOn()?"Diplomacy (under the Bank)":"the Bank (at the top of the spells)"):fsOn()?"the Auction (at the bottom of the spells)":"the Auction (under your hand, beside the Grave)";
function spNoteHTML(list){const by={auction:list.filter(n=>n.src==="auction"),bank:list.filter(n=>n.src==="bank")};
  if(list.length===1){const n=list[0];return `<b>${n.src==="bank"?"The Bank":"The Auction"}</b>: ${esc(n.what)}. Scroll to ${spWhere(n.src)} to see it.`}
  const parts=[];if(by.auction.length)parts.push(`${by.auction.length} at the Auction`);if(by.bank.length)parts.push(`${by.bank.length} loan request${by.bank.length>1?"s":""} at the Bank`);
  return `<b>New</b>: ${parts.join(" and ")}. See ${[...new Set(list.map(n=>n.src))].map(spWhere).join(" and ")}.`}
function spShow(){if(!G)return;const V=view(),list=spFresh(V);const sp=$(".spellpanel");if(!sp||!list.length)return;
  for(const n of list)spSeenSet().add(n.k);
  let box=$("#spnote");if(!box){box=document.createElement("div");box.id="spnote";box.setAttribute("role","status")}
  sp.appendChild(box);const src=list[0].src;
  box.innerHTML=`<p>${spNoteHTML(list)}</p><p class="spacts"><button type="button" class="btn ghost sm" id="spGo">Show me</button> <button type="button" class="xclose" id="spX" aria-label="Close the notice">×</button></p>`;
  box.hidden=false;clearTimeout(spShow.t);spShow.t=setTimeout(()=>{box.hidden=true},16000);
  $("#spX").onclick=()=>{box.hidden=true};
  $("#spGo").onclick=()=>{const t=src==="bank"?($("#dipbar")||$(".bankbar")||$("#bankslot")):$("#seeauct");box.hidden=true;if(!t)return;t.scrollIntoView({block:"center",behavior:"smooth"});t.classList.add("spping");setTimeout(()=>t.classList.remove("spping"),2400)};
  spPaint()}
function spPaint(){if(!G)return;const V=view(),n=spFresh(V).length,h=$(".spellpanel>h3"),t=$("#fstabSp");
  for(const el of [h,t]){if(!el)continue;el.classList.toggle("spnew",!!n);let b=el.querySelector(".spbang");
    if(n&&!b){el.insertAdjacentHTML("beforeend",`<i class="bang spbang" aria-label="Something new at the Auction or the Bank">!</i>`)}else if(!n&&b)b.remove()}
  if(h&&!h.dataset.spw){h.dataset.spw=1;h.addEventListener("click",()=>{if(G&&spFresh(view()).length)spShow()})}
  if(t&&!t.dataset.spw){t.dataset.spw=1;t.addEventListener("click",()=>{setTimeout(()=>{if(!G)return;if(PREF.fsSp){if(spFresh(view()).length)spShow()}else{const b=$("#spnote");if(b)b.hidden=true}},0)})}}
{const _r=render;render=function(){rSafe(_r,this,arguments);try{spPaint()}catch(e){console.error(e)}}}

if(window.__EC)Object.assign(window.__EC,{handSeers:V=>handSeers(V),spNotes:V=>spNotes(V),spFresh:V=>spFresh(V),spShow:()=>spShow()});
