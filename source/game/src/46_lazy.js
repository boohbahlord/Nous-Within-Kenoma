/* ---------------- v44: Lazy Hand ----------------
   A free helper right under the Bank: click it, then click a card in your hand, and the computer puts that card down for you
   where it would play it (by your Field Automation settings while Field Automation is on). Its "auto" switch keeps it on, so
   every card you click goes down by itself; it is off by default, and the switch is kept on this device. */
const HAND_ICON=`<svg class="usym lazyico" viewBox="-12 -12 24 24" width="18" height="18" aria-hidden="true"><path d="M-4,10C-7,8 -9,4 -9,1V-2C-9,-4 -6,-4 -6,-2V1V-7C-6,-9 -3,-9 -3,-7V-1V-9C-3,-11 0,-11 0,-9V-1V-8C0,-10 3,-10 3,-8V0V-5C3,-7 6,-7 6,-5V3C6,7 4,10 0,10Z" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
let lazyArmed=false;
const lazyAuto=()=>PREF.lazyAuto===true;
const lazyOn=()=>lazyArmed||lazyAuto();
const lazyCan=()=>!!G&&!G.over&&canAct()&&G.active===view()&&!G.placing&&(G.phase==="prep"||G.phase==="setup"&&G.setupStep==="more");
function lazySpot(pl,card){const ctx=typeof faOn==="function"&&faOn(pl)?faCtx(pl):null;return AI.bestSpot(pl,card,ctx)}
function lazyPlace(card){const pl=G.active,t=lazySpot(pl,card);
  if(!t){flash(`Lazy Hand finds no place for ${nameOf(card)}.`);return false}
  G.selHand=card;G.mode=null;place(card,t[0],t[1]);G.selHand=null;if(!lazyAuto())lazyArmed=false;render();return true}
function lazyHTML(live){const ok=live&&lazyCan(),on=lazyAuto();
  return `<div class="spellrow lazyrow"><button type="button" class="autotog cfgtog${lhMine().autoPlace||lhMine().sac?" on":""}" id="lhCfg" aria-label="Lazy Hand automation" data-tip="Lazy Hand automation: what it never places, and sacrifices from your hand.">⚙</button><button type="button" class="autotog${on?" on":""}" id="autoLazy" aria-pressed="${on}" data-tip="Keep Lazy Hand on: every card you click in your hand is placed for you.">auto</button><button type="button" class="spell lazy ${ok?"":"off"} ${lazyOn()?"armed":""}" id="lazyBtn" aria-pressed="${lazyOn()}" data-tip="Lazy Hand: click it, then a card in your hand, and the computer places that card for you. With Field Automation on, it follows those settings. Free, as often as you like."><span class="sn">${HAND_ICON}Lazy Hand</span><em>${lazyOn()?"on":"free"}</em></button></div>`}
{const _rs=renderSpells;renderSpells=function(live){_rs(live);const bs=$("#bankslot");if(!bs||!G||isNPC(view())||G.p[view()].cpu)return;
  bs.insertAdjacentHTML("beforeend",lazyHTML(live));
  $("#lazyBtn").onclick=()=>{if(!lazyCan())return;if(lazyAuto()){PREF.lazyAuto=false;savePrefs();lazyArmed=false}else lazyArmed=!lazyArmed;
    if(lazyArmed)flash("Lazy Hand: click a card in your hand.");render()};
  $("#autoLazy").onclick=()=>{PREF.lazyAuto=!lazyAuto();lazyArmed=false;savePrefs();render()};
  $("#lhCfg").onclick=e=>{e.stopPropagation();faWindow("lazy")}}}
/* while it is on, a click on a card in the hand places it */
{const _r=render;render=function(){_r.apply(this,arguments);const h=$("#hand");if(!h||!G)return;const on=lazyOn()&&lazyCan();h.classList.toggle("lazy",on);if(!on)return;
  h.querySelectorAll("[data-h]").forEach(b=>{const orig=b.onclick;b.onclick=e=>{if(!lazyOn()||!lazyCan())return orig&&orig.call(b,e);
    const c=G.p[view()].hand[+b.dataset.h];if(c&&lhExcluded(c,lhMine()))return orig&&orig.call(b,e);   // v47: kinds Lazy Hand leaves to you
    if(c)lazyPlace(c)}})}}
if(window.__EC)Object.assign(window.__EC,{lazySpot,lazyPlace,lazyOn});
