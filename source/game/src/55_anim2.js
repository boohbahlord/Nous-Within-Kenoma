/* ---------------- v49: particular animations ----------------
   Under the two big switches (card animations, magic and other animations) each kind of animation can be turned off on its own
   in the Menu: moves, strikes, deaths, mana, shuffles, spells, weather, fire, the drifting fog, the sky's shimmer, glowing notices,
   the Blood Moon's screen effects and the Crit Hit banners. Kept on this device (localStorage "ec-prefs2": fxOff). */
const FX_PARTS=[["moves","Cards moving"],["strikes","Strikes and hits"],["deaths","Deaths (smoke and the skull)"],["mana","Mana pouring in and out"],["shuffles","Shuffles and the grave's wisps"],
  ["spells","Spell signs and bursts"],["weather","Weather: rain, wind, lightning, meteors"],["fire","Fire on the field"],["fog","The fog drifting"],["sky","The sky's shimmer"],
  ["glow","Glowing notices"],["blood","The Blood Moon's screen effects"],["banners","Crit Hit and Miss banners"]];
const FX_PART={slide:"moves",strike:"strikes",hit:"strikes",blunt:"strikes",boom:"strikes",burst:"strikes",smoke:"deaths",skull:"deaths",pour:"mana",fill:"mana",dollar:"mana",pop:"mana",
  shuffle:"shuffles",wisp:"shuffles",sigil:"spells",symbol:"spells",area:"spells",spell:"spells",meteor:"weather",lightning:"weather",wind:"weather",rain:"weather",flames:"fire",fogroll:"fog"};
const fxPartOn=k=>!(PREF.fxOff||[]).includes(k);
/* v59: the fog's drifting is off by default (once, for everyone; it can be switched back on in the Menu). v74f: off again, once
   more for everyone (Performance Settings, "The fog drifting") */
if((PREF.fogMig|0)<2){PREF.fxOff=[...new Set([...(PREF.fxOff||[]),"fog"])];if(PREF.fxFull&&Array.isArray(PREF.fxFull.off))PREF.fxFull.off=[...new Set([...PREF.fxFull.off,"fog"])];if(Array.isArray(PREF.fxOffEach))PREF.fxOffEach=[...new Set([...PREF.fxOffEach,"fog"])];PREF.fogMig=2;savePrefs()}
for(const [m,k] of Object.entries(FX_PART)){const f=FX[m];if(typeof f!=="function")continue;FX[m]=function(){if(!fxPartOn(k))return m==="spell"?true:undefined;return f.apply(this,arguments)}}
{const _cf=castFX;castFX=function(){if(!fxPartOn("spells"))return;return _cf.apply(this,arguments)}}
{const _cb=critBanner;critBanner=function(){if(!fxPartOn("banners"))return;return _cb.apply(this,arguments)}}
{const _ap=applyPrefs;applyPrefs=function(){_ap.apply(this,arguments);for(const k of ["fog","fire","sky","glow","blood"])document.documentElement.classList.toggle("still-"+k,!fxPartOn(k))}}
/* the Menu: a fold of switches under the two big ones */
{const _om=openMenu;openMenu=function(){_om.apply(this,arguments);const m=$("#menu");if(!m)return;const g=m.querySelector(".mgrid");if(!g||m.querySelector("#mParts"))return;
  g.insertAdjacentHTML("afterend",`<details id="mParts" class="sub"><summary>Particular animations</summary><p class="dim">Each one on its own, under Card and Magic animations above.</p><div class="facats">${FX_PARTS.map(([k,t])=>`<label class="farow"><span class="fal"><b>${t}</b></span><input type="checkbox" data-fxp="${k}" ${fxPartOn(k)?"checked":""}></label>`).join("")}</div></details>`);
  m.querySelectorAll("[data-fxp]").forEach(i=>i.onchange=()=>{const S=new Set(PREF.fxOff||[]);i.checked?S.delete(i.dataset.fxp):S.add(i.dataset.fxp);PREF.fxOff=[...S];savePrefs();applyPrefs()})}}
if(window.__EC)Object.assign(window.__EC,{moonTarget:pl=>moonTarget(pl),fullMoonToll:()=>fullMoonToll()});
