/* ---------------- UI pass 1 (v20): the play screen fits the window ----------------
   The spell list lives in its own scroll box with the Bank on top; conjuring moved into the Ether shop; Grave Blessing can
   cast itself; every window has an X; card info shows on hovering a card's corner; hover tips (tap tips on touch). */

/* ---------- the spell list ---------- */
const ETHER_SHOP=[
  ["Standard",[["cs","Soldier","a random 2 to 10"],["carch","Archer"],["ccan","Cannon"]]],
  ["Special",[["cj","Jack"],["cq","Queen"],["ck","King"],["cjk","Joker"],["cas","Assassin"]]],
  ["Support",[["csc","Scout"],["cmine","Miner"],["crep","Repairman"],["cram","Battering Ram"],["cheal","Healer"]]],
  ["Base",[["ca","Ace"],["cwall","Wall"]]]];
const ETHER_IDS=new Set(ETHER_SHOP.flatMap(([,l])=>l.map(x=>x[0])));
const ETHER_KIND={cs:"soldier",carch:"archer",ccan:"cannon",cj:"jack",cq:"queen",ck:"king",cjk:"joker",cas:"assassin",csc:"scout",cmine:"miner",crep:"repair",cram:"ram",cheal:"healer",ca:"ace",cwall:"wall"};
/* v59 fix: the Ether as a whole is closed only when every spell in it is (Jail, a dead Banker…); one spell's own limit
   (the Carriage outside King of the Hill) closes only that spell. The Carriage isn't listed outside King of the Hill. */
const etherShown=id=>id!=="ccar"||kothOn();
function etherBlock(){const b=SPELLS.filter(s=>ETHER_IDS.has(s.id)&&etherShown(s.id)).map(spellBlock);return b.length&&b.every(Boolean)?b[0]:""}
const etherLeft=id=>{const k=ETHER_KIND[id];if(k==="miner"||k==="repair"||k==="puppet"||k==="carriage")return Infinity;return G.ether.filter(c=>k==="soldier"?/^\d+$/.test(c.rank):c.unit?c.unit===k:kind(c)===k).length};
SP("maxmana").name="Increase Max Mana";

function spellRow(s,live){
  const P=me(),od=G.p[G.active].od,ok=live&&spellReady(s),cost=spellCost(s);
  let moon="";if(s.id==="clair"||s.id==="naked"){if(newPrices())moon="moon-dark";else if(fullPrices())moon="moon-bright"}
  let extra="";
  if(s.id==="bless"){const aces=stacksOf(G.active).filter(x=>hasK(x.st,"ace")).length,n=Math.min(6,1+aces,blessCap(G.active))+3*(G.ritual||0)+(oathNow(G.active,"moon")?1:0);extra=`<small class="dc">${n}d6</small>`+(od?`<small class="odpen ${od>6?"big":""}">−${od}d6 max</small>`:"")}
  const moonPrice=(s.id==="clair"||s.id==="naked")&&(newPrices()||fullPrices());
  if(s.dice)extra+=`<small class="dc">${moonPrice?(newPrices()?"New Moon price":"Full Moon price"):s.dice}</small>`;
  if(s.id==="bolt"){const b=G.p[G.active].bolts||0;extra+=`<span class="bolts" aria-label="${b} of 3 bolts">${[0,1,2].map(i=>`<i class="${i<b?"f":""}">${unitSVG("bolt",i<b?"#8fd0ff":"#4a5a66",13)}</i>`).join("")}</span>`}
  if(s.id==="slaves"){const n=(G.p[G.active].thralls||[]).length;extra+=`<span class="chips" aria-label="${n} of 10 thralls">${Array.from({length:10},(_,i)=>`<i class="${i<n?"f":""}">${unitSVG("chip",i<n?"#9fe8b4":"#3d4a40",11)}</i>`).join("")}</span>`}
  if(s.once)extra+=`<small class="dc once">${G.p[G.active].once&&G.p[G.active].once[s.id]?"used":"once"}</small>`;
  const block=spellBlock(s);
  const btn=`<button class="spell${s.tribe?" subsp":""} ${ok?"":"off"} ${moon} ${s.school==="Necromancy"?"nec":""} ${s.id==="sever"&&P.sevArmed?"armed":""}" data-s="${s.id}" data-sp="${s.id}"><span class="sn">${esc(s.name)}${extra}</span><em>${s.fire?fireCost(s)+" fire":s.id==="hypo"&&!selOwn()?"3+":cost?cost+" mana":"free"}</em></button>`;
  if(s.id!=="bless")return btn;
  const on=!!G.p[view()].autoBless;
  return `<div class="spellrow"><button type="button" class="autotog${on?" on":""}" id="autoBless" aria-pressed="${on}" data-tip="Cast Grave Blessing for you at the start of every prep phase.">${on?"auto":"auto"}</button>${btn}</div>`;
}
function renderSpells(live){
  const box=$("#spells");if(!box)return;
  box.classList.toggle("bloodmoon",!!G.moon.blood);
  const V=G.p[view()],keep=box.scrollTop;
  const mine=s=>(!s.tribe||s.tribe===V.tribe)&&!ETHER_IDS.has(s.id)&&!inDrawer(s,V)&&!(survival()&&["forced","double","three","naked"].includes(s.id));
  const head=!live?`<p class="dim sp-note">${G.passing?"":me().cpu?`${esc(me().name)} is casting.`:"Spells are cast in your prep phase."}</p>`:G.phase==="prep"?"":G.opts.atkSpells&&G.phase==="attack"?'<p class="dim sp-note">Enchantments, curses, sorcery and illusions can be cast now.</p>':'<p class="dim sp-note">Spells are cast in your prep phase.</p>';
  const byPrice=(a,b)=>spellCost(a)-spellCost(b)||a.name.localeCompare(b.name);
  box.innerHTML=head+SCHOOLS.filter(sc=>sc==="Conjuring"||sc==="Astrology"||SPELLS.some(s=>s.school===sc&&mine(s))).map(sc=>{
    let list=SPELLS.filter(s=>s.school===sc&&mine(s));
    let pinned="";
    if(sc==="Conjuring"){const mx=list.find(s=>s.id==="maxmana");list=list.filter(s=>s.id!=="maxmana");
      const blk=etherBlock();
      pinned=`<button class="spell ether ${live&&!blk?"":"off"}" id="openEther" data-tip="${esc(blk||"Open the Ether: every card you can conjure into your deck, by type, cheapest first.")}"><span class="sn"><i class="ethmark" aria-hidden="true">✦</i>Ether<small class="dc">${G.ether.length} souls</small></span><em>shop ›</em></button>`+(mx?spellRow(mx,live):"")}
    if(sc==="Astrology")pinned=astroPins(live,V);
    if(sc==="Necromancy")pinned=moonOathRow(view());
    list.sort(byPrice);if(sc==="Necromancy"){const top=["bless","ritual"];list.sort((a,b)=>(top.includes(a.id)?top.indexOf(a.id):9)-(top.includes(b.id)?top.indexOf(b.id):9))}   // v47: Grave Blessing, then Ritual Dice
    const rows=list.map(s=>spellRow(s,live)),core=sc==="Necromancy"?list.filter(s=>s.id==="bless"||s.id==="ritual").length:0;
    return `<details class="school" data-sc="${sc}" ${(PREF.shut||[]).includes(sc)?"":"open"}><summary>${sc}</summary>${core?`<div class="necrocore">${rows.slice(0,core).join("")}</div>`:""}${pinned}${rows.slice(core).join("")}</details>`}).join("");
  box.scrollTop=keep;
  box.querySelectorAll("details.school").forEach(d=>d.ontoggle=()=>{const sc=d.dataset.sc,S=new Set(PREF.shut||[]);d.open?S.delete(sc):S.add(sc);PREF.shut=[...S];savePrefs()});
  box.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{if(!canAct())return;cast(SP(b.dataset.s))});
  if($("#openEther"))$("#openEther").onclick=()=>openEtherShop();
  wireAstroPins();
  if($("#autoBless"))$("#autoBless").onclick=e=>{e.stopPropagation();const Q=G.p[view()],v=!Q.autoBless;setAutoBless(view(),v);PREF.autoBless=v;savePrefs();render()};
  const bs=$("#bankslot");if(bs){bs.innerHTML=bankBarHTML();if($("#openBank"))$("#openBank").onclick=openBank}
  if(etherOpen())fillEther();
  refreshDrawers();
}
/* Grave Blessing on its own, at the start of a person's prep phase */
async function autoBlessing(pl){const P=G.p[pl];if(!P||P.cpu||!P.autoBless)return;const sp=SP("bless");if(spellReady(sp))await cast(sp)}

/* ---------- the Ether shop: a panel on the right ---------- */
const etherOpen=()=>{const e=$("#etherpanel");return !!e&&!e.hidden};
function openEtherShop(){let e=$("#etherpanel");
  if(!e){e=document.createElement("aside");e.id="etherpanel";e.className="drawer";e.setAttribute("aria-label","The Ether");document.body.appendChild(e);
    document.addEventListener("keydown",ev=>{if(ev.key==="Escape"&&etherOpen())closeEther()})}
  closeDrawer();e.hidden=false;fillEther();}
function closeEther(){const e=$("#etherpanel");if(e)e.hidden=true}
function fillEther(){
  const e=$("#etherpanel");if(!e||!G)return;const live=canAct()&&G.phase==="prep",keep=e.querySelector(".dbody")?e.querySelector(".dbody").scrollTop:0;
  const blk=etherBlock();
  const rows=ETHER_SHOP.map(([cat,items])=>{
    const its=items.map(([id,nm,sub])=>({id,nm,sub,sp:SP(id),left:etherLeft(id)})).filter(x=>x.sp&&spellMine(x.sp)&&etherShown(x.id)).sort((a,b)=>spellCost(a.sp)-spellCost(b.sp)||a.nm.localeCompare(b.nm));
    return `<h3>${cat}</h3>${its.map(x=>{const c=spellCost(x.sp),ok=live&&!blk&&!spellBlock(x.sp)&&x.left>0&&spellReady(x.sp);
      return `<button class="spell eitem ${ok?"":"off"}" data-buy="${x.id}" data-sp="${x.id}"><span class="sn">${esc(x.nm)}${x.sp.dice?`<small class="dc">${x.sp.dice}</small>`:""}<small class="left">${x.left===Infinity?"unlimited":x.left?x.left+" left":"none left"}</small></span><em>${c?c+" mana":"free"}</em></button>`}).join("")}`}).join("");
  e.innerHTML=`<div class="dhead"><h2>The Ether</h2><button type="button" class="xclose" aria-label="Close the Ether">×</button></div>
<p class="dnote">${blk?esc(blk):live?"Conjure a card's soul into your deck. Dice prices are rolled each round.":"You can conjure in your own prep phase."}</p>
<div class="dbody scrollbox">${rows}<p class="dfoot"><button class="link" id="etherSouls">See every soul in the Ether (${G.ether.length})</button></p></div>`;
  e.querySelector(".dbody").scrollTop=keep;
  e.querySelector(".xclose").onclick=closeEther;
  $("#etherSouls").onclick=showEther;
  e.querySelectorAll("[data-buy]").forEach(b=>b.onclick=async()=>{if(!canAct())return;await cast(SP(b.dataset.buy));fillEther()});
}

/* ---------- the status line under the phases ---------- */
function whoHTML(){
  if(G.over)return `<span class="sl-k">Game</span> Over.`;
  if(G.passing)return `<span class="sl-k">Turn</span> Passing the device…`;
  const P=me(),many=G.p.filter(Q=>!Q.cpu).length>1,rn=G.moon.round||1;
  const ph=G.phase==="setup"?"Setup":G.phase==="moon"?"The sky turns":({draw:"Draw phase",prep:"Prep phase",attack:"Attack phase"})[G.phase]||"";
  const shared=G.nextLabel==="Ready →"&&G.phase!=="setup"&&G.phase!=="moon";
  const whoTxt=P.cpu?`<b>${esc(P.name)}</b> is playing…`:G.opts.online?(G.active===view()?`<b>Your turn</b>`:`<b>${esc(P.name)}</b> is playing…`):many?`<b>${esc(P.name)}</b>'s turn`:`<b>Your turn</b>`;
  return `${whoTxt}<span class="sl-sep">·</span>${ph}${shared?`<span class="sl-chip" data-tip="Every player takes this phase at the same time. Press Ready when you're done.">Shared phase</span>`:""}`;
}

/* ---------- windows: an X on every box that can be closed ---------- */
function addCloseX(root,trigger){if(!root||root.querySelector(":scope > .xclose"))return;const b=document.createElement("button");b.type="button";b.className="xclose";b.setAttribute("aria-label","Close");b.textContent="×";b.onclick=()=>{const t=trigger();if(t)t.click()};root.prepend(b)}
function decorateOv(){const o=$("#ov");if(!o||o.hidden)return;const box=o.querySelector(".ovbox");if(!box)return;
  const t=()=>box.querySelector("#mcancel")||box.querySelector("[data-close]");if(t())addCloseX(box,t)}

/* ---------- tips: hover on a computer, tap (with an X) on a touch screen ---------- */
let tipT=0;
function tipBox(){let t=$("#tipbox");if(!t){t=document.createElement("div");t.id="tipbox";t.setAttribute("role","tooltip");t.hidden=true;document.body.appendChild(t);
  t.addEventListener("click",e=>{if(e.target.closest(".xclose"))t.hidden=true;e.stopPropagation()})}return t}
function showTip(el,pinned){const sp=el.dataset.sp&&SP(el.dataset.sp),sub=el.dataset.sub,txt=el.dataset.tip;if(!sp&&!txt&&!sub)return;const t=tipBox();
  const rich=sp?spellTipHTML(sp):sub?subTipHTML(sub)+(txt?`<p class="sblock">${esc(txt)}</p>`:""):"";
  t.innerHTML=(pinned?`<button type="button" class="xclose" aria-label="Close">×</button>`:"")+(rich||`<p>${esc(txt)}</p>`);t.hidden=false;t.classList.toggle("pinned",!!pinned);t.classList.toggle("rich",!!rich);
  const r=el.getBoundingClientRect(),w=Math.min(rich?380:340,innerWidth-20);t.style.width=w+"px";
  let x=r.left,y=r.bottom+6;if(x+w>innerWidth-10)x=innerWidth-w-10;t.style.left=Math.max(10,x)+scrollX+"px";t.style.top=y+scrollY+"px";
  const th=t.offsetHeight;if(r.bottom+6+th>innerHeight&&r.top-th-6>0)t.style.top=r.top-th-6+scrollY+"px"}
const touchy=()=>matchMedia("(hover: none)").matches;
let tipEl=null;
document.addEventListener("pointerover",e=>{if(e.pointerType!=="mouse")return;const el=e.target.closest&&e.target.closest("[data-tip],[data-sp],[data-sub]");if(!el||el===tipEl)return;tipEl=el;clearTimeout(tipT);tipT=setTimeout(()=>showTip(el,false),850)});
document.addEventListener("pointerout",e=>{if(e.pointerType!=="mouse")return;const el=e.target.closest&&e.target.closest("[data-tip],[data-sp],[data-sub]");if(!el)return;if(e.relatedTarget&&el.contains(e.relatedTarget))return;tipEl=null;clearTimeout(tipT);const t=$("#tipbox");if(t&&!t.classList.contains("pinned"))t.hidden=true});
/* on touch, a long press shows the tip with an X instead of acting */
let lpT=0,lpFired=false;
document.addEventListener("touchstart",e=>{const el=e.target.closest&&e.target.closest("[data-tip],[data-sp],[data-sub]");if(!el)return;lpFired=false;clearTimeout(lpT);lpT=setTimeout(()=>{lpFired=true;showTip(el,true)},450)},{passive:true});
document.addEventListener("touchend",e=>{clearTimeout(lpT);if(lpFired){e.preventDefault();lpFired=false}});
document.addEventListener("touchmove",()=>clearTimeout(lpT),{passive:true});
document.addEventListener("click",e=>{if(!touchy())return;const el=e.target.closest&&e.target.closest("[data-tip],[data-sp],[data-sub]");if(!el||el.closest("button,label"))return;showTip(el,true);e.stopPropagation()});
document.addEventListener("click",e=>{const t=$("#tipbox");if(t&&!t.hidden&&!e.target.closest("#tipbox")&&!(e.target.closest&&e.target.closest("[data-tip],[data-sp],[data-sub]")))t.hidden=true});
/* piles (grave, Ether, Outer Darkness) grouped the way the shop is: by card type */
const PILE_ORDER=["Standard","Special","Support","Base","Wildcard","Demon"];
function pileGroups(cards){const g={};for(const c of cards){let k=cardClass(c);if(k==="Demon")k="Standard";(g[k]=g[k]||[]).push(c)}
  const rk=c=>c.unit?100+Object.keys(UNIT).indexOf(c.unit):c.rank==="JK"?60:({J:51,Q:52,K:53,A:54}[c.rank]||num(c));
  return PILE_ORDER.filter(k=>g[k]).map(k=>[k,g[k].sort((a,b)=>rk(a)-rk(b))])}
/* ---------- card info: rest the mouse on a card's top-right corner (no click); tap it on a touch screen ---------- */
let ciT=0,ciEl=null;
function cornerInfo(t){const r=t.getBoundingClientRect();let html="";
  if(t.closest("#board")){const src=stackAtTile(t.closest(".tile"));if(!src)return null;html=infoHTML1(src.st,stackTitle(src.st,src.r,src.c))}
  else{const c=cardById(+t.dataset.cid);if(!c)return null;html=infoHTML1({cards:[c],owner:c.owner},nameOf(c))}
  return pop(html,r.right+4,r.top-8,"info")}
document.addEventListener("pointerover",e=>{if(e.pointerType!=="mouse"||!G)return;const t=e.target.closest&&e.target.closest(".ci");if(!t||t===ciEl)return;
  ciEl=t;clearTimeout(ciT);ciT=setTimeout(()=>{if(ciEl!==t)return;const el=cornerInfo(t);if(el)el.dataset.hover="1"},140)});
document.addEventListener("pointerout",e=>{if(e.pointerType!=="mouse")return;const t=e.target.closest&&e.target.closest(".ci");if(!t)return;
  const to=e.relatedTarget;if(to&&(t.contains(to)||(to.closest&&to.closest("#cinfo"))))return;
  ciEl=null;clearTimeout(ciT);const p=$("#cinfo");if(p&&p.dataset.hover)p.hidden=true});
document.addEventListener("pointerout",e=>{if(e.pointerType!=="mouse")return;const p=e.target.closest&&e.target.closest("#cinfo");if(!p||!p.dataset.hover)return;
  const to=e.relatedTarget;if(to&&(p.contains(to)||(to.closest&&to.closest(".ci"))))return;p.hidden=true;ciEl=null});
/* ---------- the right column always ends at the bottom of the window, so Selected is never below the fold ---------- */
function fitSide(){const g=document.querySelector(".gside");if(!g)return;
  if(innerWidth<=900){g.style.maxHeight="";g.style.height="";return}
  const z=+PREF.ui||1,top=g.parentNode.getBoundingClientRect().top,bar=56;
  const h=Math.max(250,innerHeight-Math.max(8,top)-bar);g.style.height=g.style.maxHeight=h/z+"px"}
addEventListener("scroll",()=>requestAnimationFrame(fitSide),{passive:true});
addEventListener("resize",fitSide);
