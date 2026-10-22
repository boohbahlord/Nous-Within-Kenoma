/* ---------------- v60: details ----------------
   - Rankings of kinds of card are dragged into place (a mouse drags the whole row; a finger drags the ⋮⋮ grip, so a swipe
     still scrolls the page). ▲ and ▼ stay for the keyboard. The ranking of principles keeps its buttons only.
   - (the rest of v60 is noted where it is made) */

/* ---------- drag a row into place ---------- */
function dragRank(list,itemSel,keyOf,done){
  list.querySelectorAll(itemSel).forEach(it=>{if(it._drag)return;it._drag=true;it.classList.add("dragrow");
    if(!it.querySelector(".grip"))it.insertAdjacentHTML("afterbegin",`<span class="grip" aria-hidden="true">⋮⋮</span>`);
    it.addEventListener("pointerdown",e=>{if(e.button!==0||e.target.closest("button,input,label,a"))return;
      if(e.pointerType!=="mouse"&&!e.target.closest(".grip"))return;e.preventDefault();
      const x0=e.clientX,y0=e.clientY;let moving=false;
      const mv=ev=>{if(!moving){if(Math.hypot(ev.clientX-x0,ev.clientY-y0)<6)return;moving=true;it.classList.add("dragging");list.classList.add("dragon")}
        const el=document.elementFromPoint(ev.clientX,ev.clientY),over=el&&el.closest(itemSel);
        if(!over||over===it||over.parentNode!==it.parentNode)return;
        const kids=[...it.parentNode.children];kids.indexOf(it)<kids.indexOf(over)?over.after(it):over.before(it)};
      const up=()=>{removeEventListener("pointermove",mv);removeEventListener("pointerup",up);removeEventListener("pointercancel",up);
        if(!moving)return;it.classList.remove("dragging");list.classList.remove("dragon");
        done([...list.querySelectorAll(itemSel)].map(keyOf))};
      addEventListener("pointermove",mv);addEventListener("pointerup",up);addEventListener("pointercancel",up)})})}
/* which ranking a list is, and where its new order goes */
function wireRankDrags(root){if(!root)return;
  root.querySelectorAll(".krank").forEach(ol=>{const b=ol.querySelector("button");if(!b)return;
    const attr=[...b.attributes].map(a=>a.name).find(n=>n==="data-grg"||n==="data-grk"||n==="data-tgact");if(!attr)return;
    dragRank(ol,"li",li=>li.querySelector("button").getAttribute(attr).split(":")[1],order=>{
      if(attr==="data-tgact"){const c=faMine();c.tgorder=order;faSave(c)}
      else{const c=grMine();if(attr==="data-grg")c.gorder=order;else c.korder=order;grSave(c)}})});
  root.querySelectorAll('[data-fadet="tprio"] .fahier').forEach(h=>dragRank(h,".facol",col=>col.querySelector('[data-faact^="tup:"]').dataset.faact.slice(4),order=>{
    const c=faMine();let o=order;for(const [a,b] of c.teq){o=o.filter(x=>x!==b);o.splice(o.indexOf(a)+1,0,b)}   // equals stay side by side
    c.torder=c.tSameGI?[...o.filter(x=>x!=="infantry"),"infantry"]:o;faSave(c)}))}
{const _p=paintFA;paintFA=function(){_p.apply(this,arguments);wireRankDrags($("#facfg"));wireRankDrags($("#fapanel"))}}

/* ---------- the spell list in the colors of the schools' animations, faintly (T5) ---------- */
{const _r=render;render=function(){_r.apply(this,arguments);if(!G)return;
  document.querySelectorAll("#spells .spell, .spells .spell").forEach(b=>{const id=b.dataset.s||b.dataset.sp,sp=id&&SP(id);
    if(b.id==="openEther")return;   // the Ether keeps its own bright blue, so everyone finds it
    const sc=sp?sp.school:b.closest("[data-school]")?.dataset.school;const col=sc&&SCHOOL_COL[sc];
    if(col&&b.style.getPropertyValue("--sc")!==col){b.style.setProperty("--sc",col);b.classList.add("schooled")}})}}

/* ---------- Quiet Eyes, v60 (the user's rule): for each enemy's next turn, and only that turn, the enemy sees only the tiles
   its own side stands on; everything else is fog. Scouts don't see through it. 2 mana, once; no upkeep. ---------- */
const quietNow=V=>V!=null&&!!G&&G.active===V&&(G.quiet||[]).some(q=>q.v2&&(q.now||[]).includes(V));
{const sp=SP("quiet");if(sp){delete sp.dice;
  sp.text="For the next turn of each enemy, and only that turn, they see only the tiles their own cards stand on: every other tile is fog. Scouts don't see through it.";
  sp.ok=()=>!(G.quiet||[]).some(q=>q.v2&&q.by===G.active&&(q.pending.length||q.now.length));
  sp.run=async()=>{const by=G.active,foes=G.p.filter(P=>!P.out&&P.i!==by&&isEnemy(by,P.i)&&!isNPC(P.i)).map(P=>P.i);
    (G.quiet=G.quiet||[]).push({v2:true,by,pending:foes,now:[]});
    log(`<b>Quiet Eyes</b>: ${plName(by)} hushes the field. On their next turn, ${foes.map(plName).join(", ")||"the enemy"} will see only where their own cards stand.`,"event");
    notify(by,"Quiet Eyes: on each enemy's next turn, they see only the tiles their own cards stand on.")}}
  SPELL_TEXT.quiet={e:"For the next turn of each enemy, and only that turn, they see only the tiles their own cards stand on. Every other tile is fog.",l:"Scouts don't see through it. Once at a time."}}
{const _bt=beginTurn;beginTurn=function(pl){const out=_bt.apply(this,arguments);
  for(const q of G.quiet||[])if(q.v2&&q.pending.includes(pl)){q.pending=q.pending.filter(x=>x!==pl);q.now.push(pl);G._vis=null;
    log(`<b>Quiet Eyes</b>: this turn ${plName(pl)} sees only the tiles their own cards stand on.`,"event")}
  return out}}
{const _et=endTurn;endTurn=function(pl){for(const q of G.quiet||[])if(q.v2){q.now=q.now.filter(x=>x!==pl);q.pending=q.pending.filter(x=>G.p[x]&&!G.p[x].out)}
  G.quiet=(G.quiet||[]).filter(q=>!q.v2||q.pending.length||q.now.length);G._vis=null;return _et.apply(this,arguments)}}
{const _qr=quietRound;quietRound=function(){const all=G.quiet||[];G.quiet=all.filter(q=>!q.v2);try{return _qr.apply(this,arguments)}finally{G.quiet=[...G.quiet,...all.filter(q=>q.v2)]}}}   // no upkeep any more
{const _s=seesTile;seesTile=function(V,r,c){if(quietNow(V)){const st=G.board[r][c];return !st||!isEnemy(st.owner,V)}return _s.apply(this,arguments)}}
{const _f=fogTile;fogTile=function(V,r,c){if(quietNow(V)&&!totalBlind(V))return !visionMap(V).own.some(x=>x.r===r&&x.c===c);return _f.apply(this,arguments)}}
if(window.__EC)Object.assign(window.__EC,{seesTile:(...a)=>seesTile(...a),fogTile:(...a)=>fogTile(...a),quietNow:V=>quietNow(V)});

/* ---------- Grave automation (v60): Resurrection is a raising from the grave too, so it picks there (only cards you can
   afford); and when nothing matches the settings and it has to ask, the window says why ---------- */
{const _ask=ask;ask=async function(pl,spec){const P=G&&G.p[pl],cfg=P&&!P.cpu&&P.grCfg;
  if(spec&&cfg&&cfg.on&&Array.isArray(spec.cards)&&(spec.id==="grave"||spec.id==="resur")){
    if(spec.id==="resur"){const can=spec.cards.filter((c,i)=>!(spec.offs&&spec.offs[i])),i=grPick(can,cfg);
      if(i>=0){await sleep(250);return spec.cards.indexOf(can[i])}}
    else if(grPick(spec.cards,cfg)<0&&cfg.askNone)spec={...spec,sub:`Grave automation: nothing in the grave matches your settings, so you pick.${spec.sub?" "+spec.sub:""}`}}
  return _ask.call(this,pl,spec)}}

/* ---------- the dice box (T7): a fold of its own, just below the row of Grave, Ether, Outer Darkness and the rest;
   open by default, remembered on this device ---------- */
{const _r=render;render=function(){_r.apply(this,arguments);if(!G)return;const sh=$("#shared"),t=$("#mytray");if(!sh||!t)return;
  let d=$("#dicefold");if(!d){d=document.createElement("details");d.id="dicefold";d.className="dicefold";d.open=PREF.diceOpen!==false;d.innerHTML="<summary>Dice rolls</summary>";
    d.addEventListener("toggle",()=>{if(PREF.diceOpen===d.open)return;PREF.diceOpen=d.open;savePrefs()})}
  const at=$("#handslot")||sh;if(d.previousElementSibling!==at)at.after(d);if(t.parentNode!==d)d.appendChild(t);d.hidden=!t.innerHTML.trim()}}   // v72a: the piles went under the spells; the dice stay under the hand
