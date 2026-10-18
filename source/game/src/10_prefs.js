/* ---------------- display preferences, page themes, leave warning, quotes ---------------- */
/* a phone: a touch screen no wider than a small tablet held sideways, or any narrow window */
const PHONE_Q="(pointer:coarse) and (max-width:1000px), (max-width:600px)";
const isPhone=()=>typeof matchMedia!=="undefined"&&matchMedia(PHONE_Q).matches;
const PREF=(()=>{let p={};try{p=JSON.parse(localStorage.getItem("ec-prefs2")||"{}")}catch(e){}
  // v20: full width is the default on a computer screen (once; a later choice sticks)
  if(!p.v20){p.v20=1;if(typeof matchMedia!=="undefined"&&matchMedia("(min-width:901px)").matches)p.full=true}
  // v38: on a phone the Selected box sits above the spells by default (once; a later choice sticks)
  if(!p.v38m){p.v38m=1;if(isPhone())p.sel="top"}
  // v43: the Ether's Crossroads theme is the default (once, for anyone who had never chosen a theme)
  if(!p.v43t){p.v43t=1;if(p.theme==null||p.theme==="")p.theme="darkfantasy"}
  return Object.assign({hand:"below",sel:"bottom",ctl:"bottom",ci:1,ui:1,tz:1,coords:false,full:false,theme:"darkfantasy",lines:true,bright:1},p)})();
const sfxV=()=>Math.max(0,Math.min(1.5,PREF.sfxVol==null?1:+PREF.sfxVol));   // v43: the sound effects' volume, 0 to 150%
function savePrefs(){try{localStorage.setItem("ec-prefs2",JSON.stringify(PREF))}catch(e){}}
const THEMES={darkfantasy:["Ether's Crossroads",["th-darkfantasy"]],"":["Kenoma",[]],dull:["Kenoma (dull)",["th-dull"]],office:["Office",["th-office"]],officedark:["Office Dark",["th-officedark"]],earth:["Druid",["th-earth"]],jester:["Jester",["th-black","th-jester"]],ten:["Ten",["th-indigo","th-blue"]],satan:["Disturbed Satan",["th-crimson"]]};
function applyMoonTheme(){
  const h=document.documentElement,b=!!(G&&G.moon.blood&&!G.over);
  for(const k in THEMES)for(const c of THEMES[k][1])h.classList.remove(c);
  h.classList.remove("bloodglitch");
  if(b)h.classList.add("th-crimson","bloodglitch");        // a Blood Moon overrides every page theme
  else for(const c of THEMES[PREF.theme]?THEMES[PREF.theme][1]:[])h.classList.add(c);
  h.classList.toggle("mirage",!!(G&&G.eclipse&&G.eclipse.k==="sun"&&!G.over));   // the suns aligned: a mirage over the page
  if(window.nwkStatic)window.nwkStatic.level(b?3:1);
  const st=document.querySelector("button.static-toggle"),bar=$("#gbar");if(st&&bar&&st.parentNode!==bar)bar.appendChild(st);
}
/* Text Size scales the words only: every font size in the stylesheets is multiplied, except on cards, stacks and dice */
const TZ_SKIP=/\.(card|cf|cx|stack|die|pk|cback|ecount|mini|gbar|gctl|gtog|tipi)\b|svg|#board \.rl|#gbar/;
let tzRules=null;
/* small words grow the most, headings hardly at all, and nothing passes 21px: big text stays readable without breaking panels */
const TZ_DAMP=/\.cin\.sky|skyl|spelltip|stdl|#tipbox|deftag|\.stab\b/;   // hover boxes grow half as much: compact, like a strategy game's tooltips
const tzOf=(orig,f,damp)=>{const m=/^([\d.]+)(px|rem)$/.exec(orig.trim());if(!m)return `calc(${orig} * ${1+(f-1)*.5})`;
  const base=+m[1]*(m[2]==="rem"?16:1),w=Math.max(0,Math.min(1,(18-base)/8))*(damp?.5:1),v=base*(1+(f-1)*w);
  return (f>1?Math.min(v,Math.max(base,21)):v).toFixed(2)+"px"};
function applyTextScale(f){
  document.body.classList.toggle("bigtext",f>=1.4);
  if(!tzRules){tzRules=[];
    for(const sh of document.styleSheets){let rs;try{rs=sh.cssRules}catch(e){continue}
      const walk=list=>{for(const r of list){if(r.cssRules&&!r.style)walk(r.cssRules);else if(r.style&&r.style.fontSize&&!TZ_SKIP.test(r.selectorText||"")&&/px|rem|vw|vh/.test(r.style.fontSize)&&!/em|%/.test(r.style.fontSize.replace(/rem/g,"")))tzRules.push([r,r.style.fontSize])}};
      walk(rs)}}
  // remember which rules are damped
  for(const [r,orig] of tzRules)r.style.fontSize=f===1?orig:tzOf(orig,f,TZ_DAMP.test(r.selectorText||""));
}
function applyPrefs(){
  const h=document.documentElement;
  const ph=isPhone();document.body.classList.toggle("phone",ph);
  applyTextScale(PREF.tz*(ph?.9:1));   // a phone's 100% is 90% text, and 80% for the interface and card icons
  document.body.classList.toggle("fullw",!!PREF.full);
  h.style.setProperty("--ci",PREF.ci*(ph?.8:1));h.style.setProperty("--uiz",PREF.ui*(ph?.8:1));
  const wrap=$("#handwrap"),slot=$("#handslot"),side=$("#sidehand");
  if(wrap&&slot&&side){const dest=PREF.hand==="below"?slot:side;if(wrap.parentNode!==dest)dest.appendChild(wrap)}
  document.body.classList.toggle("hand-below",PREF.hand==="below");
  const mv=(el,dest)=>{if(el&&dest&&el.parentNode!==dest)dest.appendChild(el)};
  mv($("#selwrap"),PREF.sel==="bottom"?$("#selbottom"):$("#seltop"));
  mv($("#controls"),PREF.ctl==="bottom"?$("#ctlbottom"):$("#ctltop"));
  if($("#actbar"))$("#actbar").hidden=PREF.ctl!=="bottom";
  document.body.classList.toggle("ctl-bottom",PREF.ctl==="bottom");
  const bar=$("#gbar");
  if(bar){$("#ciV").textContent=Math.round(PREF.ci*100)+"%";$("#uiV").textContent=Math.round(PREF.ui*100)+"%";$("#tzV").textContent=Math.round(PREF.tz*100)+"%";$("#brV").textContent=Math.round(PREF.bright*100)+"%";
    $("#pHand").textContent="Hand: "+(PREF.hand==="below"?"Under your deck":"Side");$("#pTheme").value=PREF.theme;
    $("#pCoord").textContent="Tile names: "+(PREF.coords?"On":"Off");$("#pCoord").setAttribute("aria-pressed",PREF.coords);
    $("#pFull").textContent="Page: "+(PREF.full?"Full width":"Standard");$("#pFull").setAttribute("aria-pressed",PREF.full);
    bar.classList.toggle("open",!!PREF.barOpen);$("#pMore").textContent=PREF.barOpen?"Display ▾":"Display ▴";$("#pMore").setAttribute("aria-expanded",!!PREF.barOpen)}
  applyMoonTheme();
  if(window.nwkLook)window.nwkLook();   // the background lines and the brightness live in site.js, for every page
}
function mountBar(){
  const Rb=document.createElement("div");Rb.id="gbar";Rb.className="gbar";
  Rb.innerHTML=`<span id="gmore"><label>Theme <select id="pTheme">${Object.entries(THEMES).map(([k,[n]])=>`<option value="${k}">${n}</option>`).join("")}</select></label><span class="gctl">Card Icons <button type="button" data-z="ci" data-d="-1" aria-label="Smaller card icons">−</button><b id="ciV"></b><button type="button" data-z="ci" data-d="1" aria-label="Bigger card icons">+</button></span><span class="gctl">UI Size <button type="button" data-z="ui" data-d="-1" aria-label="Smaller interface">−</button><b id="uiV"></b><button type="button" data-z="ui" data-d="1" aria-label="Bigger interface">+</button></span><span class="gctl">Text Size <button type="button" data-z="tz" data-d="-1" aria-label="Smaller text">−</button><b id="tzV"></b><button type="button" data-z="tz" data-d="1" aria-label="Bigger text">+</button></span><span class="gctl">Brightness <button type="button" data-z="bright" data-d="-1" aria-label="Darker">−</button><b id="brV"></b><button type="button" data-z="bright" data-d="1" aria-label="Brighter">+</button></span><button type="button" id="pHand" class="gtog"></button><button type="button" id="pCoord" class="gtog"></button><button type="button" id="pFull" class="gtog pc-only"></button><button type="button" id="pReset" class="gtog" title="Card icons, interface, text and brightness back to 100%">Reset sizes</button></span><button type="button" id="pMore" class="gtog" aria-expanded="false" aria-controls="gmore">Display ▴</button>`;
  document.body.append(Rb);savePrefs();
  $("#pTheme").onchange=e=>{PREF.theme=e.target.value;savePrefs();applyPrefs()};
  Rb.querySelectorAll("[data-z]").forEach(b=>b.onclick=()=>{const k=b.dataset.z,lim=k==="ci"?[.8,1.8]:k==="tz"?[.8,1.8]:k==="bright"?[.7,1.3]:[.8,1.4];PREF[k]=Math.round(Math.min(lim[1],Math.max(lim[0],PREF[k]+ +b.dataset.d*.1))*10)/10;savePrefs();applyPrefs()});
  $("#pHand").onclick=()=>{PREF.hand=PREF.hand==="below"?"side":"below";savePrefs();applyPrefs()};
  $("#pCoord").onclick=()=>{PREF.coords=!PREF.coords;savePrefs();applyPrefs();if(G)render()};
  $("#pFull").onclick=()=>{PREF.full=!PREF.full;savePrefs();applyPrefs()};
  $("#pReset").onclick=()=>{PREF.ci=1;PREF.ui=1;PREF.tz=1;PREF.bright=1;savePrefs();applyPrefs();if(G)render()};
  $("#pMore").onclick=()=>{PREF.barOpen=!PREF.barOpen;savePrefs();applyPrefs()};
}
/* leaving mid-game asks first */
const inGame=()=>G&&!G.over;
let leaving=false;   // set once the player has said yes, so the browser doesn't ask a second time
function confirmLeave(go){
  if(!inGame()){go();return}
  let box=$("#leavebox");if(!box){box=document.createElement("div");box.id="leavebox";document.body.appendChild(box)}
  box.innerHTML=`<div class="ovbox" role="alertdialog" aria-labelledby="lvq"><h2 id="lvq">Are you sure you want to end your game session?</h2><p class="dim">The game in progress will be lost.</p><p class="acts"><button class="btn" id="lvy">End the session</button> <button class="btn ghost" id="lvn">Keep playing</button></p></div>`;
  box.hidden=false;$("#lvn").focus();
  $("#lvy").onclick=()=>{box.hidden=true;leaving=true;go()};$("#lvn").onclick=()=>{box.hidden=true};
}
function guardLinks(){
  document.querySelectorAll(".game .crumbs a").forEach(a=>a.addEventListener("click",e=>{if(!inGame())return;e.preventDefault();confirmLeave(()=>{location.href=a.href})}));
}
/* the phone's Back button (and a swipe back) asks too: a game in progress keeps one extra history entry to catch it */
let backTrap=false;
function armBackTrap(){if(backTrap||!inGame())return;try{history.pushState({ecGame:1},"",location.href);backTrap=true}catch(e){}}
addEventListener("popstate",()=>{if(!backTrap)return;backTrap=false;
  if(!inGame())return;
  confirmLeave(()=>{history.back()});
  const keep=$("#lvn");if(keep)keep.addEventListener("click",armBackTrap,{once:true})});
addEventListener("beforeunload",e=>{if(inGame()&&!G.opts.fast&&!leaving){e.preventDefault();e.returnValue=""}});
{const _rd=render;render=function(){_rd.apply(this,arguments);armBackTrap()}}

/* passages from the book, for whoever is waiting */
function mountQuotes(){
  const Q=window.EC_QUOTES||[],box=$("#quotes");if(!box||!Q.length)return;
  let last=-1;
  const show=()=>{let i;do{i=Math.floor(Math.random()*Q.length)}while(Q.length>1&&i===last);last=i;const q=Q[i];
    $("#qtext").textContent=q.t;$("#qsrc").textContent=`Chapter ${q.n} · ${q.title}`;$("#qtext").parentNode.scrollTop=0};
  $("#qnext").onclick=show;show();setInterval(()=>{if(!document.hidden)show()},75000);
}
