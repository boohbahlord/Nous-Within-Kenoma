/* ---------- v72b: Accessibility Settings: Colorblind-safe colors and Dyslexic mode ----------
   The Menu (and Settings before a game) gathers them in an "Accessibility Settings" fold; the setup's Display tab has an
   Accessibility box. Dyslexic mode (only on this device, on every Ether's Crossroads page): the blackletter and the thin
   monospace give way to the device's clear sans-serif (Verdana, Tahoma or Arial), with more room between letters, words
   and lines, and no all-capitals or italics (site.css; the pages' heads apply it before they draw). Colorblind-safe colors
   now also mark the tiles you can move to (blue), place on (yellow, ruled) and attack (vermilion, hatched). */
const DYS_FONTS='@font-face{font-family:"Grenze Gotisch";font-style:normal;font-weight:500;src:local("Verdana"),local("Tahoma"),local("Segoe UI"),local("Arial"),local("DejaVu Sans"),local("Liberation Sans")}@font-face{font-family:"UnifrakturMaguntia";font-style:normal;font-weight:400;src:local("Verdana"),local("Tahoma"),local("Segoe UI"),local("Arial"),local("DejaVu Sans"),local("Liberation Sans")}';
function dysFonts(on){let y=document.getElementById("dysfonts");
  if(on){if(!y){y=document.createElement("style");y.id="dysfonts";y.textContent=DYS_FONTS}document.head.appendChild(y)}   // last, so it wins over Data saving's fonts
  else if(y)y.remove()}
{const _ap=applyPrefs;applyPrefs=function(){_ap.apply(this,arguments);const on=PREF.dys===true;document.documentElement.classList.toggle("dys",on);dysFonts(on)}}
{const _lf=liteFonts;liteFonts=function(){_lf.apply(this,arguments);dysFonts(PREF.dys===true)}}
function dysSet(on){PREF.dys=!!on;savePrefs();applyPrefs();if(G)render();const m=$("#mDys");if(m)m.value=PREF.dys?"1":"0";const g=$("#gDys");if(g)g.value=PREF.dys?"1":"0"}
/* the Menu: one fold for both */
{const _om=openMenu;openMenu=function(){_om.apply(this,arguments);const m=$("#menu"),box=m&&m.querySelector(".ovbox");if(!box||box.querySelector(".maccess"))return;
  const grid=box.querySelector(".mgrid");if(!grid)return;
  const d=document.createElement("details");d.className="maccess";d.open=!!(PREF.cb||PREF.dys||PREF.accOpen);
  d.innerHTML=`<summary>Accessibility Settings</summary><div class="mgrid"></div>`;const g=d.querySelector(".mgrid");
  const cb=box.querySelector("#mCb");if(cb)g.appendChild(cb.closest("label"));
  g.insertAdjacentHTML("beforeend",`<label class="f">Dyslexic mode <select id="mDys"><option value="0" ${PREF.dys?"":"selected"}>Off (default)</option><option value="1" ${PREF.dys?"selected":""}>On</option></select></label>`);
  (box.querySelector(".mslides")||grid).after(d);
  d.addEventListener("toggle",()=>{PREF.accOpen=d.open;savePrefs()});
  $("#mDys").onchange=e=>dysSet(e.target.value==="1")}}
/* the online Display tab */
{const _pd=paintDisp;paintDisp=function(){_pd.apply(this,arguments);const a=$("#gCb");if(!a||$("#gDys"))return;
  a.closest("label").insertAdjacentHTML("afterend",`<label class="f">Dyslexic mode <select id="gDys"><option value="0" ${PREF.dys?"":"selected"}>Off</option><option value="1" ${PREF.dys?"selected":""}>On</option></select></label>`);
  $("#gDys").onchange=e=>dysSet(e.target.value==="1")}}
document.addEventListener("change",e=>{if(e.target&&e.target.id==="ddys")dysSet(e.target.checked)});

if(window.__EC)Object.assign(window.__EC,{dysSet:on=>dysSet(on)});
