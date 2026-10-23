/* ---------------- v72f: Fullscreen ----------------
   The square with four corners at the top right of a game fills the screen with the field: the browser's own fullscreen when
   it has one (otherwise, as on an iPhone, the game alone fills the window), and the page around the game is put away. It is
   the same game, laid out again, not a second one: every setting, window and display option works as before.
   - The field fills the screen, fitted to the device and its orientation; the mouse wheel or two fingers zoom (far out), and
     dragging an empty spot (or one finger) moves it. The corner tab on a card still drags onto another to compare.
   - Top left: the sky's body (hover or tap it for its cycle), then the other players, top to bottom.
   - Top center: your deck and mana bars, and under them the turn bar: the phase, the button to move on, Auto field and its
     settings square (the automation menu).
   - Right: "Spells" and "Selected", named arrows that slide their drawer in from the right; each stays open until closed.
   - Bottom left: your hand, and under it a thin row behind an arrow: the last roll, with the roll history. Its ⚙ (only in
     fullscreen) shows the log's latest line instead of the roll, or under it.
   - Top right: the pause menu (the game waits while it is open, except online): Resume, Exit fullscreen, Settings, Help (what
     you must know, then every help fold and the rule book), Quit (asks first), and a small link to a passage from the book.
   Leaving the browser's fullscreen (Esc) leaves it too; without the browser's fullscreen, Esc opens the pause menu. */
function fsOn(){return document.documentElement.classList.contains("ecfs")}
const FS={y:0,api:false,zmin:.45,zmax:2.2,z0:1,paused:false,info:null,fitUntil:0,ow:0,oh:0};
const FS_ICON=`<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 9V3h6M15 3h6v6M21 15v6h-6M9 21H3v-6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square"/></svg>`;
function fsButton(){let b=$("#fsbtn");if(!b){b=document.createElement("button");b.type="button";b.id="fsbtn";b.innerHTML=FS_ICON;b.title="Fullscreen";
    b.setAttribute("aria-label","Play in fullscreen");b.onclick=fsEnter;document.body.appendChild(b)}
  const on=!!G&&!fsOn()&&!!$("main.game");b.hidden=!on;document.body.classList.toggle("hasfs",on);
  const f=$("#fieldround");if(on&&f&&b.parentNode!==f)f.appendChild(b);else if(!on&&b.parentNode!==document.body)document.body.appendChild(b)}   // v74a: on the field's top right
function fsEnter(){if(!G||fsOn())return;const h=document.documentElement;FS.y=scrollY;FS.zmin=CAM.ZMIN;FS.zmax=CAM.ZMAX;FS.z0=CAM.z;CAM.ZMIN=.2;CAM.ZMAX=3.4;
  h.classList.add("ecfs");h.classList.toggle("fs-sp",PREF.fsSp===true);h.classList.toggle("fs-sel",PREF.fsSel===true);scrollTo(0,0);
  FS.api=false;if(PREF.fsBrowser===true&&h.requestFullscreen&&!document.fullscreenElement){   // v74a: the browser's own fullscreen only when chosen (it shows its own notice)
    try{const p=h.requestFullscreen({navigationUI:"hide"});FS.api=true;if(p&&p.catch)p.catch(()=>{FS.api=false})}catch(e){FS.api=false}}
  FS.fitUntil=Date.now()+1500;FS.ow=innerWidth;FS.oh=innerHeight;render();fsFit()}
function fsExit(){if(!fsOn())return;fsCloseAll();const h=document.documentElement;h.classList.remove("ecfs","fs-sp","fs-sel");
  CAM.ZMIN=FS.zmin;CAM.ZMAX=FS.zmax||2.2;CAM.z=FS.z0;const api=FS.api;FS.api=false;
  if(api&&document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{});
  if(G)render();const y=FS.y;requestAnimationFrame(()=>scrollTo(0,y))}
document.addEventListener("fullscreenchange",()=>{if(!document.fullscreenElement&&fsOn()&&FS.api){FS.api=false;fsExit()}else if(fsOn())fsFit()});
/* fit the field to the screen, then center it */
function fsFit(){if(!fsOn()||!G)return;const w=camWrap(),B=$("#board");if(!w||!B)return;
  const cs=getComputedStyle(w),pt=parseFloat(cs.paddingTop),pb=parseFloat(cs.paddingBottom);
  const pass=()=>{const pw=w.clientWidth-36,ph=w.clientHeight-pt-pb;
    const bw=B.offsetWidth,bh=B.offsetHeight;if(!bw||!bh||pw<=0||ph<=0)return;
    CAM.z=Math.max(CAM.ZMIN,Math.min(CAM.ZMAX,CAM.z*Math.min(pw/bw,ph/bh)));B.style.setProperty("--tw",Math.round(CAM.TILE*CAM.z)+"px")};
  pass();requestAnimationFrame(()=>{pass();requestAnimationFrame(()=>fsCenter(w,B,pt,pb))})}
function fsCenter(w,B,pt,pb){const wr=w.getBoundingClientRect(),br=B.getBoundingClientRect(),cy=wr.top+pt+(w.clientHeight-pt-pb)/2,cx=wr.left+w.clientWidth/2;   // the middle of the room between the panels
  w.scrollLeft+=br.left+br.width/2-cx;w.scrollTop+=br.top+br.height/2-cy}
/* a new orientation (or the first moments, while the browser goes fullscreen) fits it again; your own zoom stays otherwise */
addEventListener("resize",()=>{if(!fsOn())return;const turned=(innerWidth>innerHeight)!==(FS.ow>FS.oh);FS.ow=innerWidth;FS.oh=innerHeight;
  if(turned||Date.now()<FS.fitUntil){clearTimeout(FS.rt);FS.rt=setTimeout(fsFit,120)}});

/* ---------- zoom and pan: the wheel, two fingers, one finger ---------- */
document.addEventListener("wheel",e=>{if(!fsOn()||!e.target.closest||!e.target.closest(".camwrap"))return;e.preventDefault();e.stopImmediatePropagation();
  if(e.ctrlKey){camZoom(Math.exp(-e.deltaY*.01),e.clientX,e.clientY);return}   // a trackpad's pinch
  if(PREF.fsWheel!==true)return;   // v74a: the mouse wheel does nothing unless chosen in Controls
  const dir=(e.deltaY<0?1:-1)*(PREF.camInvWheel?-1:1);camZoom(dir>0?1.12:1/1.12,e.clientX,e.clientY)},{capture:true,passive:false});
const FSP=new Map();let fsPan=null,fsPinch=null,fsMoved=false;
document.addEventListener("pointerdown",e=>{if(!fsOn()||e.pointerType!=="touch"||!e.target.closest)return;const w=e.target.closest(".camwrap");if(!w||e.target.closest(".ci"))return;   // the corner tab drags to compare
  FSP.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(FSP.size===2){const [a,b]=[...FSP.values()];fsPinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:CAM.z};fsMoved=true}
  else if(FSP.size===1){fsPan={x:e.clientX,y:e.clientY,l:w.scrollLeft,t:w.scrollTop,w};fsMoved=false}},true);
document.addEventListener("pointermove",e=>{if(!FSP.has(e.pointerId))return;FSP.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(FSP.size>=2&&fsPinch){const [a,b]=[...FSP.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(fsPinch.d>12)camZoom(fsPinch.z*d/fsPinch.d/CAM.z,(a.x+b.x)/2,(a.y+b.y)/2);return}
  if(fsPan){const dx=e.clientX-fsPan.x,dy=e.clientY-fsPan.y;if(!fsMoved&&Math.abs(dx)+Math.abs(dy)>8)fsMoved=true;if(fsMoved){fsPan.w.scrollLeft=fsPan.l-dx;fsPan.w.scrollTop=fsPan.t-dy}}},true);
const fsUp=e=>{if(!FSP.has(e.pointerId))return;FSP.delete(e.pointerId);if(FSP.size<2)fsPinch=null;
  if(FSP.size===1&&fsPan){const [p]=[...FSP.values()];fsPan={x:p.x,y:p.y,l:fsPan.w.scrollLeft,t:fsPan.w.scrollTop,w:fsPan.w}}   // one finger left: it goes on moving the field
  if(!FSP.size){fsPan=null;if(fsMoved)setTimeout(()=>{fsMoved=false},60)}};
document.addEventListener("pointerup",fsUp,true);document.addEventListener("pointercancel",fsUp,true);
document.addEventListener("click",e=>{if(fsMoved&&fsOn()&&e.target.closest&&e.target.closest(".camwrap")){e.stopPropagation();e.preventDefault();fsMoved=false}},true);   // a swipe is not a click on a tile

/* ---------- the parts drawn only in fullscreen ---------- */
function fsUI(){let u=$("#fsui");if(u)return u;u=document.createElement("div");u.id="fsui";
  u.innerHTML=`<button type="button" id="fspauseb" aria-haspopup="dialog" title="Pause menu"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor"/></svg><span>Menu</span></button>
<p id="fsphase" aria-live="polite"></p>
<button type="button" class="fstab" id="fstabSp" aria-expanded="false"><i aria-hidden="true">◂</i><span>Spells</span></button>
<button type="button" class="fstab" id="fstabSel" aria-expanded="false"><i aria-hidden="true">◂</i><span>Selected</span></button>
<div id="fsrow"><button type="button" id="fsrowT" aria-expanded="false"><i aria-hidden="true">▸</i><span>Dice</span></button><div id="fsrowB"></div><button type="button" id="fsrowC" aria-haspopup="true" aria-expanded="false" title="What this row shows (fullscreen only)" aria-label="What this row shows">⚙</button>
<div id="fsrowM" hidden role="group" aria-label="What this row shows">${[["dice","The last roll"],["log","The log's latest line instead"],["both","The last roll, and the log's latest line under it"]].map(([v,t])=>`<label class="opt"><input type="radio" name="fsrowm" value="${v}"><span>${t}</span></label>`).join("")}</div></div>`;
  ($("main.game")||document.body).appendChild(u);   // inside the game, so it takes the same interface size
  $("#fspauseb").onclick=fsPause;
  u.insertAdjacentHTML("afterbegin",`<button type="button" id="fsctlb" aria-haspopup="dialog" title="Controls"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="2.5" y="6.5" width="19" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6 10h1M9 10h1M12 10h1M15 10h1M18 10h0.5M7 14h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><span>Controls</span></button>`);
  $("#fsctlb").onclick=fsControls;
  const tab=(id,key,cls)=>{$(id).onclick=()=>{PREF[key]=!PREF[key];savePrefs();document.documentElement.classList.toggle(cls,PREF[key]);fsPaint()}};
  tab("#fstabSp","fsSp","fs-sp");tab("#fstabSel","fsSel","fs-sel");
  $("#fsrowT").onclick=()=>{PREF.fsRowOpen=!PREF.fsRowOpen;savePrefs();fsPaint()};
  $("#fsrowC").onclick=()=>{const m=$("#fsrowM");m.hidden=!m.hidden;$("#fsrowC").setAttribute("aria-expanded",!m.hidden)};
  u.querySelectorAll("#fsrowM input").forEach(i=>i.onchange=()=>{PREF.fsRow=i.value;PREF.fsRowOpen=true;savePrefs();$("#fsrowM").hidden=true;$("#fsrowC").setAttribute("aria-expanded","false");fsPaint()});
  return u}
const fsRowMode=()=>["dice","log","both"].includes(PREF.fsRow)?PREF.fsRow:"dice";
function fsRollHTML(){if(G.passing)return `<span class="dim">The dice are hidden while the device changes hands.</span>`;const V=view();
  const L=G.p.map((P,i)=>({P,i})).filter(x=>x.P.tray&&!isNPC(x.i)&&(multiView()||x.i===V)).sort((a,b)=>b.P.tray.t-a.P.tray.t),x=L[0];if(!x)return `<span class="dim">No rolls yet.</span>`;const t=x.P.tray;
  return `<span class="fsroll" style="--pc:${x.P.color}"><b>${esc(x.P.name)}</b> <small>${esc(t.label)}</small> <span class="dice">${t.dice.length?t.dice.map(d=>dieSVG(d,x.P.color)).join(""):'<span class="dim">no dice</span>'}</span>${t.line?` <em>${esc(t.line)}</em>`:""}</span><button type="button" class="link fshist" data-fshist="${x.i}">History</button>`}
function fsLogHTML(){const li=document.querySelector("#log li");return `<span class="fslog">${li?li.innerHTML:'<span class="dim">Nothing in the log yet.</span>'}</span>`}
function fsPaint(){if(!G||!fsOn())return;fsUI();const h=document.documentElement,V=view(),P=G.p[V];
  const ph={draw:"Drawing",prep:"Prep",attack:"Attack",setup:"Setup",moon:"The sky"}[G.phase]||G.phase,A=G.p[G.active];
  $("#fsphase").innerHTML=`Round ${Math.max(1,G.moon?G.moon.round:1)} · ${esc(ph||"")}${A?` · <span style="color:${A.color}">${esc(A.name)}</span>`:""}`;
  for(const [id,key,name] of [["#fstabSp","fsSp","Spells"],["#fstabSel","fsSel","Selected"]]){const b=$(id),open=PREF[key]===true;b.setAttribute("aria-expanded",open);b.querySelector("i").textContent=open?"▸":"◂";
    b.title=open?`Close ${name}`:`Open ${name}`;b.classList.toggle("open",open)}
  $("#fstabSel").classList.toggle("ping",!PREF.fsSel&&!!(G.sel||G.selHand));   // something is selected and the drawer is shut
  const sp=$(".spellpanel");if(sp)sp.classList.remove("folded");   // a phone's fold is the drawer itself here
  const mode=fsRowMode(),open=PREF.fsRowOpen===true,row=$("#fsrow");row.classList.toggle("open",open);
  $("#fsrowT").setAttribute("aria-expanded",open);$("#fsrowT").querySelector("i").textContent=open?"▾":"▸";$("#fsrowT").querySelector("span").textContent=mode==="log"?"Log":mode==="both"?"Dice & log":"Dice";
  row.querySelectorAll("#fsrowM input").forEach(i=>i.checked=i.value===mode);
  const B=$("#fsrowB");B.innerHTML=open?(mode==="dice"?fsRollHTML():mode==="log"?fsLogHTML():fsRollHTML()+"<br>"+fsLogHTML()):"";
  B.querySelectorAll("[data-fshist]").forEach(b=>b.onclick=e=>{e.stopPropagation();openHist(+b.dataset.fshist,b)});
  h.style.setProperty("--fsrowh",row.offsetHeight+"px");const me=$("#me");if(me)h.style.setProperty("--fsmeh",(me.offsetHeight||36)+"px");
  if(P&&!P.cpu)h.style.setProperty("--fspc",P.color)}
{const _r=render;render=function(){rSafe(_r,this,arguments);fsButton();fsPiles();if(G&&fsOn())fsPaint()}}
/* v74a: the Grave, the Ether, the Outer Darkness and the Auction sit under the hand (as before v72a); in fullscreen, at the bottom of the spells */
function fsPiles(){const sh=$("#shared"),sp=$(".spellpanel"),hs=$("#handslot");if(!sh||!sp||!hs)return;
  if(fsOn()){if(sh.parentNode!==sp)sp.appendChild(sh)}else if(sh.previousElementSibling!==hs)hs.after(sh);
  const d=$("#dicefold");if(d&&!fsOn()&&sh.nextElementSibling!==d)sh.after(d)}
/* the sky's body: its cycle on hover, or on a tap */
document.addEventListener("click",e=>{if(!fsOn())return;const m=e.target.closest&&e.target.closest("#moon");const mo=$("#moon");if(!mo)return;
  if(m&&!mo.classList.contains("moontarget"))mo.classList.toggle("fsopen");else if(!m)mo.classList.remove("fsopen")});

/* ---------- v74a: Controls: what moves what, and the options for it (a phone gets its own list) ---------- */
/* v75b: the list follows the device's pointer, not the window's width: any mouse or trackpad shows the keyboard and mouse list
   (a narrow window or a touchscreen computer too); only a device that is touch alone opens on the touch list. Either can be picked. */
const fsTouchOnly=()=>typeof matchMedia!=="undefined"&&!matchMedia("(any-pointer:fine)").matches&&!matchMedia("(any-hover:hover)").matches;
function fsControls(){const o=fsOv("fsctl"),touch=PREF.fsCtlTab?PREF.fsCtlTab==="touch":fsTouchOnly(),ck=(id,on,t,s)=>`<label class="farow"><span class="fal"><b>${t}</b>${s?`<small>${s}</small>`:""}</span><input type="checkbox" id="${id}" ${on?"checked":""}></label>`;
  const L=touch?[["Move the field","swipe it with one finger"],["Zoom","pinch with two fingers"],["Pick a stack or a card","tap it; tap it again to let go"],["A class (Field Automation)","double-tap a stack or a hand card"],
      ["Spells and Selected","the named arrows on the right"],["Dice and the log","the arrow at the bottom left; its ⚙ for more"],["The sky","tap the body at the top left"],["Leave fullscreen","Menu, then Exit fullscreen"]]
    :[["Move the field",`${esc(kmShow4(["camUp","camLeft","camDown","camRight"]))}, two at once for a diagonal (Shift: faster)${PREF.camDrag!==false?", or drag an empty spot":""}; it can go past the edges`],["Zoom",`${esc(kmShow("zoomIn"))} in, ${esc(kmShow("zoomOut"))} out${PREF.fsWheel===true?", the mouse wheel":""}, a trackpad's pinch; always around the middle of the screen`],["The turn button",`${esc(kmShow("turn"))}: Ready, the next phase, End turn`],
      ["Pick a stack or a card","click it"],["A class (Field Automation)","right-click a stack or a hand card"],["Compare two stacks","drag a card's corner tab onto another stack"],["Spells and Selected","the named arrows on the right"],
      ["Dice and the log","the arrow at the bottom left; its ⚙ for more"],["The sky","hover the body at the top left"],["Leave fullscreen",`${esc(kmShow("fullscreen"))}, or Menu then Exit fullscreen${document.fullscreenElement?"; Esc also leaves the browser's fullscreen (the browser's own key)":"; Esc opens the Menu"}`],["Every key","the pause menu's Keyboard controls"]];
  o.innerHTML=`<div class="ovbox fscbox" role="dialog" aria-modal="true" aria-labelledby="fsch"><button type="button" class="xclose" id="fscX" aria-label="Close">×</button><h2 id="fsch">Controls</h2>
<div class="fsctabs" role="tablist"><button type="button" class="stab${touch?"":" on"}" role="tab" aria-selected="${!touch}" data-fsct="mouse">Keyboard and mouse</button><button type="button" class="stab${touch?" on":""}" role="tab" aria-selected="${touch}" data-fsct="touch">Touch</button></div>
<dl class="fsckeys">${L.map(([a,b])=>`<dt>${a}</dt><dd>${b}</dd>`).join("")}</dl>
<div class="fscopts">${touch?"":ck("fscWheel",PREF.fsWheel!==true,"Disable mouse scroll","On by default: the mouse wheel does nothing over the field. Off: it zooms.")+ck("fscDrag",PREF.camDrag!==false,"Drag to move the field","Dragging an empty spot moves the field (here and on large maps).")}
${ck("fscBrowser",PREF.fsBrowser===true,"Use the browser's own fullscreen","Hides the browser's bars too; the browser then shows its own notice about leaving it.")}</div>
<p class="acts"><button type="button" class="btn" id="fscOk">Done</button></p></div>`;
  o.hidden=false;const close=()=>{o.hidden=true;const b=$("#fsctlb");if(b)b.focus()};$("#fscX").onclick=$("#fscOk").onclick=close;o.onclick=e=>{if(e.target===o)close()};$("#fscOk").focus();
  o.querySelectorAll("[data-fsct]").forEach(b=>b.onclick=()=>{PREF.fsCtlTab=b.dataset.fsct;savePrefs();fsControls()});
  const on=(id,f)=>{const i=$("#"+id);if(i)i.onchange=()=>{f(i.checked);savePrefs()}};
  on("fscWheel",v=>{PREF.fsWheel=!v});on("fscDrag",v=>{PREF.camDrag=v});
  on("fscBrowser",v=>{PREF.fsBrowser=v;const h=document.documentElement;if(v&&h.requestFullscreen&&!document.fullscreenElement){try{const p=h.requestFullscreen({navigationUI:"hide"});FS.api=true;if(p&&p.catch)p.catch(()=>{FS.api=false})}catch(e){}}
    else if(!v&&document.fullscreenElement&&document.exitFullscreen){FS.api=false;document.exitFullscreen().catch(()=>{})}})}
/* ---------- the pause menu, Help, a passage from the book ---------- */
function fsOv(id){let o=$("#"+id);if(!o){o=document.createElement("div");o.id=id;o.className="fsov";document.body.appendChild(o)}return o}
function fsResume(){const o=$("#fspause");if(o)o.hidden=true;if(FS.paused&&G){G.paused=false;FS.paused=false;render()}}
function fsPause(){if(!G)return;if(!G.opts.online&&!G.paused){G.paused=true;FS.paused=true}
  const o=fsOv("fspause");
  o.innerHTML=`<div class="ovbox fspbox" role="dialog" aria-modal="true" aria-labelledby="fsph"><h2 id="fsph">${G.opts.online?"Menu":"Paused"}</h2>${G.opts.online?`<p class="dim">Online, the game goes on while this menu is open.</p>`:""}
<div class="fspacts"><button type="button" class="btn" id="fsRes">Resume</button><button type="button" class="btn ghost" id="fsOut">Exit fullscreen</button><button type="button" class="btn ghost" id="fsSet">Settings</button><button type="button" class="btn ghost" id="fsHelpB">Help</button><button type="button" class="btn ghost" id="fsQuit">Quit</button></div>
<div id="fsQuitAsk" class="fsask" hidden role="alertdialog" aria-labelledby="fsqq"><p id="fsqq"><b>Quit this game?</b> It is lost, and can't be picked up again.</p><p class="acts"><button type="button" class="btn" id="fsQuitY">Quit the game</button> <button type="button" class="btn ghost" id="fsQuitN">Keep playing</button></p></div>
<p class="fsqlink"><button type="button" class="link" id="fsQuote">A passage from the book</button></p></div>`;
  o.hidden=false;$("#fsRes").focus();
  $("#fsRes").onclick=fsResume;
  $("#fsOut").onclick=()=>{fsResume();fsExit()};
  $("#fsSet").onclick=()=>{fsResume();openMenu()};
  $("#fsHelpB").onclick=fsHelp;
  $("#fsQuit").onclick=()=>{if(!inGame()){fsResume();fsExit();startMode=null;showStart();return}$("#fsQuitAsk").hidden=false;$("#fsQuitN").focus()};
  $("#fsQuitN").onclick=()=>{$("#fsQuitAsk").hidden=true;$("#fsQuit").focus()};
  $("#fsQuitY").onclick=()=>{leaving=true;fsResume();fsExit();startMode=null;showStart()};
  $("#fsQuote").onclick=fsQuote}
function fsHelp(){const o=fsOv("fshelp");
  o.innerHTML=`<div class="ovbox wide fshbox" role="dialog" aria-modal="true" aria-labelledby="fshh"><button type="button" class="xclose" id="fshX" aria-label="Close">×</button><h2 id="fshh">Help</h2>
<details class="cinfo fsmk" open><summary>What you must know</summary><p class="mktldr"><b>TLDR</b> ${MK_TLDR}</p><div class="mkbody">${MK_BODY}</div><details class="sub"><summary>Tell me more</summary>${MK_MORE.replace(/<h3>[^<]*<\/h3>/,"")}</details></details>
<details class="cinfo"><summary>Fullscreen controls</summary><ul class="mklist"><li><b>Zoom:</b> the mouse wheel, a trackpad's pinch, or two fingers.</li><li><b>Move the field:</b> drag an empty spot, swipe with one finger, or ${esc(kmShow4(["camUp","camLeft","camDown","camRight"]))} (${esc(kmShow("zoomIn"))} zooms in, ${esc(kmShow("zoomOut"))} out).</li>
<li><b>Spells and Selected:</b> the named arrows on the right open their drawers; they stay open until you close them.</li><li><b>Dice and the log:</b> the arrow under your hand; its ⚙ chooses the last roll, the log's latest line, or both.</li>
<li><b>The sky:</b> hover or tap the body at the top left for its cycle.</li><li><b>Field Automation:</b> Auto field and its square in the turn bar at the top.</li><li><b>Leave:</b> Menu (top right), Exit fullscreen${document.fullscreenEnabled?", or Esc":""}.</li></ul></details>
<div id="fshslot"></div></div>`;
  const info=$("#info"),slot=$("#fshslot");if(info&&slot){if(!FS.info)FS.info={parent:info.parentNode,next:info.nextSibling};slot.appendChild(info)}   // every help fold and the rule book, while the window is open
  o.hidden=false;$("#fshX").focus();$("#fshX").onclick=fsHelpClose;o.onclick=e=>{if(e.target===o)fsHelpClose()}}
function fsHelpClose(){const o=$("#fshelp");if(o)o.hidden=true;const info=$("#info");
  if(FS.info&&info){const {parent,next}=FS.info;if(next&&next.parentNode===parent)parent.insertBefore(info,next);else parent.appendChild(info);FS.info=null}
  const b=$("#fsHelpB");if(b&&!$("#fspause").hidden)b.focus()}
function fsQuote(){const o=fsOv("fsquote"),q=$("#qtext"),s=$("#qsrc");
  o.innerHTML=`<div class="fsqbox" role="dialog" aria-modal="true" aria-label="A passage from the book"><blockquote id="fsqt"></blockquote><p id="fsqs"></p><p class="acts"><button type="button" class="btn ghost" id="fsqN">Another passage</button> <button type="button" class="btn" id="fsqX">Close</button></p></div>`;
  const paint=()=>{const t=$("#fsqt");if(!t)return;t.innerHTML=q&&q.innerHTML.trim()?q.innerHTML:`<span class="dim">The book is still opening…</span>`;$("#fsqs").innerHTML=s?s.innerHTML:""};
  const next=()=>{const b=$("#qnext");if(b)b.click();for(const ms of [60,300,800,1600])setTimeout(paint,ms)};
  if(!q||!q.innerHTML.trim())next();paint();o.hidden=false;$("#fsqX").focus();
  $("#fsqN").onclick=next;$("#fsqX").onclick=()=>{o.hidden=true;const b=$("#fsQuote");if(b)b.focus()}}
function fsCloseAll(){fsHelpClose();for(const id of ["fsquote","fsctl"]){const o=$("#"+id);if(o)o.hidden=true}fsResume();const m=$("#fsrowM");if(m)m.hidden=true;const mo=$("#moon");if(mo)mo.classList.remove("fsopen")}
document.addEventListener("keydown",e=>{if(!fsOn()||e.key!=="Escape")return;
  const q=$("#fsquote"),hp=$("#fshelp"),pz=$("#fspause");
  for(const o of [$("#fsctl"),$("#fsrowmore")])if(o&&!o.hidden){o.hidden=true;e.preventDefault();return}   // v78j: and the row's More options
  if(q&&!q.hidden){q.hidden=true;e.preventDefault();return}if(hp&&!hp.hidden){fsHelpClose();e.preventDefault();return}if(pz&&!pz.hidden){fsResume();e.preventDefault();return}
  if(document.fullscreenElement)return;if(typeof dialogOpen==="function"&&dialogOpen())return;if(kbTop())return;   // v78j: what is open closes first
  e.preventDefault();fsPause()});   // without the browser's fullscreen, Esc pauses
/* the start screen and a new game */
{const _s=showStart;showStart=function(){if(fsOn())fsExit();return _s.apply(this,arguments)}}
{const _sg=startGame;startGame=function(){const out=_sg.apply(this,arguments);if(fsOn())requestAnimationFrame(fsFit);return out}}

if(window.__EC)Object.assign(window.__EC,{fsEnter:()=>fsEnter(),fsExit:()=>fsExit(),fsFit:()=>fsFit(),fsOn:()=>fsOn(),fsPause:()=>fsPause()});

/* v74a: Space is the turn button (Ready, the next phase, End turn) when nothing else is open and you aren't typing */
document.addEventListener("keydown",e=>{if(!kmIs(e,"turn")||!G||G.over)return;   // v78d: Space, as bound
  const a=document.activeElement;if(a&&(a.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)))return;
  if(a&&a!==document.body&&a.tagName==="BUTTON"&&!a.closest("#board,#hand"))return;   // a focused button keeps its own Space
  if(e.repeat){e.preventDefault();return}   // v78j: held down, it fires once
  if(KB.mode||kbTop())return;   // v78j: a spell list, the hand, a drawer or any window has the keys
  if([...document.querySelectorAll("#ov,#menu,#facfg,#fspause,#fshelp,#fsquote,#fsctl,#pop,#histpop,#rbwin,#clstgwin,#leavebox,.faov")].some(x=>!x.hidden&&x.getClientRects().length&&x.innerHTML.trim()))return;
  const n=$("#next");if(!n||n.disabled||!n.getClientRects().length)return;e.preventDefault();n.click()},true);
/* v74a: the history of rolls opens above its button when there is no room below (the dice row at the bottom of fullscreen) */
{const _oh=openHist;openHist=function(pl,anchor){_oh.apply(this,arguments);const box=$("#histpop");if(!box||box.hidden||!anchor)return;
  const r=anchor.getBoundingClientRect(),h=box.offsetHeight,below=innerHeight-r.bottom-8,above=r.top-8;
  if(h>below&&above>below){box.style.maxHeight=Math.max(120,above)+"px";box.style.overflow="auto";box.style.top=Math.max(8,r.top-Math.min(h,above)-4)+scrollY+"px"}
  else if(h>below){box.style.maxHeight=Math.max(120,below)+"px";box.style.overflow="auto"}}}

/* v75c: the turn bar names the phase on its left (Draw, Prep, Attack) wherever the phase line beside it isn't shown:
   in fullscreen, and with the turn buttons at the top */
{const _r=render;render=function(){rSafe(_r,this,arguments);if(!G)return;const ctl=$("#controls");if(!ctl)return;let l=ctl.querySelector(".phl");
  const need=fsOn()||PREF.ctl!=="bottom",ph={draw:"Draw",prep:"Prep",attack:"Attack",setup:"Setup",moon:"The sky"}[G.phase];
  if(!need||!ph||G.over||G.passing){if(l)l.remove();return}
  if(!l){l=document.createElement("span");l.className="phl";ctl.prepend(l)}else if(ctl.firstElementChild!==l)ctl.prepend(l);
  l.textContent=me()&&me().cpu?`${me().name}: ${ph}`:`${ph} phase`}}
