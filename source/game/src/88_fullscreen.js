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
  const on=!!G&&!fsOn()&&!!$("main.game");b.hidden=!on;document.body.classList.toggle("hasfs",on)}
function fsEnter(){if(!G||fsOn())return;const h=document.documentElement;FS.y=scrollY;FS.zmin=CAM.ZMIN;FS.zmax=CAM.ZMAX;FS.z0=CAM.z;CAM.ZMIN=.2;CAM.ZMAX=3.4;
  h.classList.add("ecfs");h.classList.toggle("fs-sp",PREF.fsSp===true);h.classList.toggle("fs-sel",PREF.fsSel===true);scrollTo(0,0);
  FS.api=false;if(h.requestFullscreen&&!document.fullscreenElement){try{const p=h.requestFullscreen({navigationUI:"hide"});FS.api=true;if(p&&p.catch)p.catch(()=>{FS.api=false})}catch(e){FS.api=false}}
  FS.fitUntil=Date.now()+1500;FS.ow=innerWidth;FS.oh=innerHeight;render();fsFit()}
function fsExit(){if(!fsOn())return;fsCloseAll();const h=document.documentElement;h.classList.remove("ecfs","fs-sp","fs-sel");
  CAM.ZMIN=FS.zmin;CAM.ZMAX=FS.zmax||2.2;CAM.z=FS.z0;const api=FS.api;FS.api=false;
  if(api&&document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{});
  if(G)render();const y=FS.y;requestAnimationFrame(()=>scrollTo(0,y))}
document.addEventListener("fullscreenchange",()=>{if(!document.fullscreenElement&&fsOn()&&FS.api){FS.api=false;fsExit()}else if(fsOn())fsFit()});
/* fit the field to the screen, then center it */
function fsFit(){if(!fsOn()||!G)return;const w=camWrap(),B=$("#board");if(!w||!B)return;
  const pass=()=>{const cs=getComputedStyle(w),pw=w.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight),ph=w.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom);
    const bw=B.offsetWidth,bh=B.offsetHeight;if(!bw||!bh||pw<=0||ph<=0)return;
    CAM.z=Math.max(CAM.ZMIN,Math.min(CAM.ZMAX,CAM.z*Math.min(pw/bw,ph/bh)));B.style.setProperty("--tw",Math.round(CAM.TILE*CAM.z)+"px")};
  pass();requestAnimationFrame(()=>{pass();requestAnimationFrame(()=>{w.scrollLeft=(w.scrollWidth-w.clientWidth)/2;w.scrollTop=(w.scrollHeight-w.clientHeight)/2})})}
/* a new orientation (or the first moments, while the browser goes fullscreen) fits it again; your own zoom stays otherwise */
addEventListener("resize",()=>{if(!fsOn())return;const turned=(innerWidth>innerHeight)!==(FS.ow>FS.oh);FS.ow=innerWidth;FS.oh=innerHeight;
  if(turned||Date.now()<FS.fitUntil){clearTimeout(FS.rt);FS.rt=setTimeout(fsFit,120)}});

/* ---------- zoom and pan: the wheel, two fingers, one finger ---------- */
document.addEventListener("wheel",e=>{if(!fsOn()||!e.target.closest||!e.target.closest(".camwrap"))return;e.preventDefault();e.stopImmediatePropagation();
  if(e.ctrlKey){camZoom(Math.exp(-e.deltaY*.01),e.clientX,e.clientY);return}   // a trackpad's pinch
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
{const _r=render;render=function(){_r.apply(this,arguments);fsButton();if(G&&fsOn())fsPaint()}}
/* the sky's body: its cycle on hover, or on a tap */
document.addEventListener("click",e=>{if(!fsOn())return;const m=e.target.closest&&e.target.closest("#moon");const mo=$("#moon");if(!mo)return;
  if(m&&!mo.classList.contains("moontarget"))mo.classList.toggle("fsopen");else if(!m)mo.classList.remove("fsopen")});

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
<details class="cinfo"><summary>Fullscreen controls</summary><ul class="mklist"><li><b>Zoom:</b> the mouse wheel, a trackpad's pinch, or two fingers.</li><li><b>Move the field:</b> drag an empty spot, swipe with one finger, or WASD and the arrow keys (Q and E zoom too).</li>
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
function fsCloseAll(){fsHelpClose();for(const id of ["fsquote"]){const o=$("#"+id);if(o)o.hidden=true}fsResume();const m=$("#fsrowM");if(m)m.hidden=true;const mo=$("#moon");if(mo)mo.classList.remove("fsopen")}
document.addEventListener("keydown",e=>{if(!fsOn()||e.key!=="Escape")return;
  const q=$("#fsquote"),hp=$("#fshelp"),pz=$("#fspause");
  if(q&&!q.hidden){q.hidden=true;e.preventDefault();return}if(hp&&!hp.hidden){fsHelpClose();e.preventDefault();return}if(pz&&!pz.hidden){fsResume();e.preventDefault();return}
  if(document.fullscreenElement)return;if(typeof dialogOpen==="function"&&dialogOpen())return;e.preventDefault();fsPause()});   // without the browser's fullscreen, Esc pauses
/* the start screen and a new game */
{const _s=showStart;showStart=function(){if(fsOn())fsExit();return _s.apply(this,arguments)}}
{const _sg=startGame;startGame=function(){const out=_sg.apply(this,arguments);if(fsOn())requestAnimationFrame(fsFit);return out}}

if(window.__EC)Object.assign(window.__EC,{fsEnter:()=>fsEnter(),fsExit:()=>fsExit(),fsFit:()=>fsFit(),fsOn:()=>fsOn(),fsPause:()=>fsPause()});
