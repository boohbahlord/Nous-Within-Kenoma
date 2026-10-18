/* ---------------- Prompt 12, part 1 (v25): the sky's menus ----------------
   Lightning and the Asteroid are Astrology now (they still follow Sorcery's timing). The Oaths have their own panel, like the Ether;
   spells that only an Oath opens show only while it is sworn. The Firmament's Heavenly Bodies have a panel of their own, for it alone. */

for(const id of ["bolt","asteroid"]){const s=SP(id);if(s){s.atkSchool=s.school;s.school="Astrology"}}

const OATHS=[["earth","Any sky"],["venus","Venus in the sky"],["jupiter","Jupiter in the sky"],["mercury","Mercury in the sky"]];
const OATH_ONLY={betray:"mercury",warnow:"mercury",bribe:"mercury"};
const FIRM_PLANETS=["mars","sun","venus","jupiter","mercury","sunfall"];
/* spells that only work under a certain sky show only while it is there */
const SKY_ONLY={peace:()=>planetUp("mercury"),war:()=>planetUp("mercury"),buypeace:()=>planetUp("mercury"),cry:()=>sunUp()};
/* spells that live in a panel instead of the list, or that need an Oath first */
function inDrawer(s,V){
  if(s.id.startsWith("oath_"))return true;
  if(OATH_ONLY[s.id])return V.oath!==OATH_ONLY[s.id];
  if(SKY_ONLY[s.id])return !SKY_ONLY[s.id]();
  if(V.tribe==="firm"&&FIRM_PLANETS.includes(s.id))return true;
  return false;
}
function astroPins(live,V){
  const sworn=V.oath?SP("oath_"+V.oath):null;
  let h=`<button class="spell drawerbtn oaths ${live?"":"off"}" id="openOaths" data-tip="The Oaths: swear one to a Heavenly Body (or the Earth) for its gifts and its price. One at a time."><span class="sn">Oaths${sworn?`<small class="dc">${esc(sworn.name.replace(/^Oath of (the )?/,""))} sworn</small>`:""}</span><em>›</em></button>`;
  if(V.tribe==="firm")h+=`<button class="spell drawerbtn planets ${live?"":"off"}" id="openPlanets" data-tip="Your Heavenly Bodies: hang one in the moon's place."><span class="sn">Heavenly Bodies<small class="dc">${FIRM_PLANETS.filter(id=>SP(id)&&spellReady(SP(id))).length} ready</small></span><em>›</em></button>`;
  return h;
}
function wireAstroPins(){
  if($("#openOaths"))$("#openOaths").onclick=()=>openDrawer("oaths");
  if($("#openPlanets"))$("#openPlanets").onclick=()=>openDrawer("planets");
}
/* ---------- one panel on the right, shared by the Oaths and the Heavenly Bodies (the Ether keeps its own) ---------- */
const DRAWERS={
  oaths:{title:"Oaths",fill:oathsHTML},
  planets:{title:"Your Heavenly Bodies",fill:planetsHTML}
};
let drawerKind=null;
function openDrawer(k){closeEther();let e=$("#skypanel");
  if(!e){e=document.createElement("aside");e.id="skypanel";e.className="drawer";document.body.appendChild(e);
    document.addEventListener("keydown",ev=>{if(ev.key==="Escape"&&!e.hidden)closeDrawer()})}
  drawerKind=k;e.hidden=false;fillDrawer()}
function closeDrawer(){const e=$("#skypanel");if(e)e.hidden=true;drawerKind=null}
function refreshDrawers(){if(drawerKind&&$("#skypanel")&&!$("#skypanel").hidden)fillDrawer()}
function fillDrawer(){
  const e=$("#skypanel");if(!e||!G||!drawerKind)return;const D=DRAWERS[drawerKind],keep=e.querySelector(".dbody")?e.querySelector(".dbody").scrollTop:0;
  const [note,body]=D.fill();
  e.setAttribute("aria-label",D.title);e.className="drawer "+drawerKind;
  e.innerHTML=`<div class="dhead"><h2>${D.title}</h2><button type="button" class="xclose" aria-label="Close">×</button></div><p class="dnote">${note}</p><div class="dbody scrollbox">${body}</div>`;
  e.querySelector(".dbody").scrollTop=keep;e.querySelector(".xclose").onclick=closeDrawer;
  e.querySelectorAll("[data-cast]").forEach(b=>b.onclick=async()=>{if(!canAct())return;await cast(SP(b.dataset.cast));render()});
  e.querySelectorAll("[data-break]").forEach(b=>b.onclick=()=>{if(!canAct())return;toggleOath(b.dataset.break);render()});
}
function oathsHTML(){
  const V=G.p[view()],live=canAct()&&G.phase==="prep"&&G.active===view();
  const rows=OATHS.map(([k,need])=>{const sp=SP("oath_"+k);if(!sp)return "";const t=SPELL_TEXT[sp.id]||{};
    const sworn=V.oath===k,ok=live&&!sworn&&spellReady(sp),blk=spellBlock(sp);
    const act=sworn?`<button class="btn ghost sm" data-break="${k}" ${live?"":"disabled"}>Break</button>`:`<button class="btn sm" data-cast="${sp.id}" ${ok?"":"disabled"}>Swear</button>`;
    return `<div class="orow${sworn?" sworn":""}"><div class="otop"><b>${esc(sp.name)}</b><span class="oneed">${need}</span></div><p>${esc(t.e||sp.text)}</p><div class="oact">${sworn?'<span class="otag">Sworn</span>':blk?`<span class="dim">${esc(blk)}</span>`:""}${act}</div></div>`}).join("");
  const opened=Object.entries(OATH_ONLY).filter(([,k])=>V.oath===k).map(([id])=>SP(id).name);
  return [`One Oath at a time: swearing a new one breaks the old. An Oath to a Heavenly Body only works while that Heavenly Body is in the sky.${opened.length?` Your Oath opens: ${opened.join(", ")}.`:""}`,rows];
}
function planetsHTML(){
  const live=canAct()&&G.phase==="prep"&&G.active===view();
  const rows=FIRM_PLANETS.map(id=>{const sp=SP(id);if(!sp)return "";const ok=live&&spellReady(sp),c=spellCost(sp),blk=spellBlock(sp);
    return `<button class="spell eitem ${ok?"":"off"}" data-cast="${id}" data-sp="${id}"><span class="sn">${esc(sp.name)}${sp.dice?`<small class="dc">${sp.dice}</small>`:""}<small class="left">${esc(SKY_FORM[id]||"")}</small></span><em>${c?c+" mana":"free"}</em></button>`}).join("");
  return [live?"Hang a Heavenly Body in the moon's place. Prices are rolled each round.":"You can raise a Heavenly Body in your own prep phase.",rows];
}
