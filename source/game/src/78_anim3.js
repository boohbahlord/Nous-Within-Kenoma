/* ---------- v71l: no animations in the fog; Minimize computer animation ----------
   - Animations on a tile in the fog of war don't play (they would show nothing the player can see, and only cost the
     device). Online, the host doesn't even send a player the ones they couldn't see. On for everyone.
   - Minimize computer animation (the Menu, off by default). On, a slider of five steps hides more effects the further left
     it goes, down to none at all, and "Effects chosen by" can hand the choice to each particular switch instead, which
     greys the slider out. Turning it on starts on the slider; turning it off brings the switches back as they were.
     It works through the switches that were already there (Card and Magic animations, Particular animations). */
{const _t=FX.tile;FX.tile=function(r,c){if(G&&!FX.sees(r,c))return null;return _t.apply(this,arguments)}}
/* online: an animation tied to tiles that this player sees none of plays nothing on their screen, sound included */
const FX_TILED=new Set(["place","move","strike","hit","death","suicide","repair","sac"]);
function fxSeen(e,id){if(!G||!e||!FX_TILED.has(e.k))return true;const V=seatOfGuest(id);if(V==null||e.pl===V)return true;
  const ts=[];if(e.r!=null&&e.c!=null)ts.push([e.r,e.c]);for(const k of ["a","b","from"])if(Array.isArray(e[k])&&e[k].length===2)ts.push(e[k]);
  return !ts.length||ts.some(([r,c])=>!fogTile(V,r,c))}

/* v71r: a computer's step that no person at the table can see (in the fog for all of them, or a hidden card) doesn't wait:
   the people on this device, and online every joined player; with nobody but computers, whoever is watching */
const stepStats={seen:0,hidden:0};
function stepSeen(ts){if(!G)return true;let eyes=G.p.filter(P=>!P.out&&!P.cpu&&!isNPC(P.i)).map(P=>P.i);if(!eyes.length)eyes=[view()];
  const ok=eyes.some(V=>V!=null&&!totalBlind(V)&&ts.some(([r,c])=>r!=null&&G.board[r]&&!fogTile(V,r,c)&&!(G.board[r][c]&&hiddenFrom(V,r,c))));
  stepStats[ok?"seen":"hidden"]++;return ok}
const FX_LVLS=[[],["moves","strikes"],["moves","strikes","deaths","banners","spells"],["moves","strikes","deaths","banners","spells","mana","shuffles","weather"],
  ["moves","strikes","deaths","banners","spells","mana","shuffles","weather","fire","glow","blood","sky"]];
const FX_LVL_NAME=["None","Moves and strikes","Fights and spells","Nothing constant","Nearly all"];
const fxMin=()=>PREF.fxMin===true,fxEach=()=>PREF.fxBy==="each",fxLvl=()=>Math.max(0,Math.min(4,PREF.fxLvl==null?3:+PREF.fxLvl));
/* the switches follow the slider (or the particular choices kept for "each one myself") */
function fxMinApply(){if(!fxMin())return;
  if(fxEach()){PREF.fxOff=[...(PREF.fxOffEach||PREF.fxOff||[])];PREF.fxCards=true;PREF.fxMagic=true;return}
  const on=new Set(FX_LVLS[fxLvl()]);PREF.fxOff=FX_PARTS.map(([k])=>k).filter(k=>!on.has(k));PREF.fxCards=PREF.fxMagic=fxLvl()>0}
function fxMinSet(on){on=!!on;if(on===fxMin())return;
  if(on){PREF.fxFull={off:[...(PREF.fxOff||[])],c:PREF.fxCards,m:PREF.fxMagic};PREF.fxMin=true;PREF.fxBy="slider";if(PREF.fxLvl==null)PREF.fxLvl=3;fxMinApply()}
  else{const F=PREF.fxFull||{off:["fog"],c:true,m:true};PREF.fxOff=[...F.off];PREF.fxCards=F.c;PREF.fxMagic=F.m;PREF.fxMin=false}
  fxMinSave()}
function fxMinSave(){savePrefs();applyPrefs();fxMinPaint();if(G)render()}
{const _aa=askAnimations;askAnimations=function(){if(fxMin())return;return _aa.apply(this,arguments)}}   // the phone's question would undo the choice
/* the Display bar's two animation switches stand still while the choice is minimized */
{const _ap=applyPrefs;applyPrefs=function(){_ap.apply(this,arguments);for(const id of ["#pAnimC","#pAnimM"]){const b=$(id);if(b){b.disabled=fxMin();b.title=fxMin()?"Minimize computer animation is on: the Menu decides.":""}}}}

/* the Menu: the drop-downs with the drop-downs, the slider with the sliders */
function fxMinPaint(){const m=$("#menu");if(!m)return;const on=fxMin(),each=fxEach();
  const mn=m.querySelector("#mFxMin");if(mn)mn.value=on?"1":"0";
  const by=m.querySelector("#mFxBy");if(by){by.value=each?"each":"slider";by.closest("label").hidden=!on}
  const sl=m.querySelector("#mFxLvl");if(sl){sl.value=fxLvl();sl.disabled=!on||each;const L=sl.closest("label");L.hidden=!on;L.classList.toggle("faded",each);
    L.querySelectorAll(".mstep").forEach(b=>b.disabled=sl.disabled);const v=m.querySelector("#mFxLvlV");if(v)v.textContent=FX_LVL_NAME[fxLvl()]}
  for(const [id,k] of [["#mAnimC","fxCards"],["#mAnimM","fxMagic"]]){const s=m.querySelector(id);if(s){s.value=PREF[k]===false?"0":"1";s.disabled=on;s.closest("label").classList.toggle("faded",on)}}
  const parts=m.querySelector("#mParts");if(parts){const lock=on&&!each;parts.classList.toggle("faded",lock);
    parts.querySelectorAll("[data-fxp]").forEach(i=>{i.disabled=lock;i.checked=!(PREF.fxOff||[]).includes(i.dataset.fxp)})}}
{const _om=openMenu;openMenu=function(){_om.apply(this,arguments);const m=$("#menu"),a=m&&m.querySelector("#mAnimM");if(!a||m.querySelector("#mFxMin"))return;
  a.closest("label").insertAdjacentHTML("afterend",`<label class="f">Minimize computer animation <select id="mFxMin"><option value="0">Off (default)</option><option value="1">On</option></select></label>
<label class="f" hidden>Effects chosen by <select id="mFxBy"><option value="slider">The slider (default)</option><option value="each">Each one myself, below</option></select></label>`);
  const g=m.querySelector(".mslides")||m.querySelector(".mgrid");
  g.insertAdjacentHTML("beforeend",`<label class="f mslide" hidden>Effects <input type="range" id="mFxLvl" min="0" max="4" step="1" aria-label="Effects: further left hides more"><b id="mFxLvlV"></b></label>`);
  groupMenuSliders();
  $("#mFxMin").onchange=e=>fxMinSet(e.target.value==="1");
  $("#mFxBy").onchange=e=>{PREF.fxBy=e.target.value==="each"?"each":"slider";fxMinApply();fxMinSave()};
  $("#mFxLvl").oninput=e=>{PREF.fxLvl=+e.target.value;fxMinApply();fxMinSave()};
  const parts=m.querySelector("#mParts");if(parts)parts.addEventListener("change",e=>{if(e.target.dataset.fxp!=null&&fxMin()&&fxEach()){PREF.fxOffEach=[...(PREF.fxOff||[])];savePrefs()}});
  fxMinPaint()}}

if(window.__EC)Object.assign(window.__EC,{stepStats,fxLvl,FX_LVLS,fxSeen:(e,id)=>fxSeen(e,id)});
