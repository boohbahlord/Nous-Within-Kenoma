/* ---------------- v56: large maps and their camera ----------------
   A map 10 or more tiles across sits in a frame that scrolls. Zooming changes the size of the tiles (not a picture of
   them), so everything that measures the board (the fog, the effects, the card info) keeps working.
   - v59: the mouse wheel scrolls the page, as anywhere else; zooming with it is a choice (off by default) in the note
     under the field, which also lists the controls and has − and + buttons. With it on, the wheel zooms around the pointer.
   - Dragging an empty spot of the field moves it; a stack is still clicked as always. On a touch screen the frame scrolls.
   - WASD moves it (Shift: faster), E zooms in and Q out (Menu: reversed). Not while typing.
   - v77a: zooming always keeps the middle of what you see in place; held keys move the field smoothly, two at once on a diagonal.
   - Menu, Large Map Controls: the wheel, both reversals and the speed. The section is faded outside a large map. */
const CAM={z:1,ZMIN:.45,ZMAX:2.2,TILE:64};
const isLarge=()=>!!(G&&(fsOn()||G.map&&(G.map.large||COLS>9||G.rows>9)));   // v72f: fullscreen uses the same camera (88_fullscreen.js)
const camSpeed=()=>Math.max(.4,Math.min(3,+PREF.camSpeed||1));
function camWrap(){const B=$("#board");if(!B)return null;let w=B.parentNode&&B.parentNode.classList&&B.parentNode.classList.contains("camwrap")?B.parentNode:null;
  if(isLarge()&&!w){w=document.createElement("div");w.className="camwrap";B.parentNode.insertBefore(w,B);w.appendChild(B);camWire(w)}
  if(w){const on=isLarge();w.classList.toggle("on",on);B.classList.toggle("large",on);B.style.setProperty("--tw",Math.round(CAM.TILE*CAM.z)+"px")}
  return w}
{const _r=render;render=function(){rSafe(_r,this,arguments);if(G){camWrap();camNote()}}}
/* ---------- the note under a large field: the controls, − and +, and the wheel's zoom switch ---------- */
function camNote(){const w=camWrap();let n=$("#camnote");
  if(!w||!isLarge()){if(n)n.hidden=true;return}
  if(!n){n=document.createElement("div");n.id="camnote";n.className="camnote";w.after(n)}else if(n.previousElementSibling!==w)w.after(n);
  n.hidden=false;const ph=isPhone(),key=(ph?"p":"c")+(PREF.camWheel===true);if(n.dataset.k===key)return;n.dataset.k=key;
  n.innerHTML=`<span class="cz"><button type="button" class="btn ghost sm" data-cz="-1" aria-label="Zoom out">−</button><button type="button" class="btn ghost sm" data-cz="1" aria-label="Zoom in">+</button></span>`+
    (ph?`<span class="dim">Swipe the field to move it.</span>`:`<span class="dim">Drag an empty spot to move the field · WASD moves it, two at once for a diagonal (Shift: faster) · E zooms in, Q out</span>
<label class="cw"><input type="checkbox" id="camWheelBox" ${PREF.camWheel===true?"checked":""}> Zoom with the mouse wheel</label>`);
  n.querySelectorAll("[data-cz]").forEach(b=>b.onclick=()=>camZoom(+b.dataset.cz>0?1.2:1/1.2));
  const cb=n.querySelector("#camWheelBox");if(cb)cb.onchange=()=>{PREF.camWheel=cb.checked;savePrefs();const m=$("#mCamWheel");if(m)m.checked=cb.checked}}
/* v77a: zoom (the keys, − and +, the wheel, a pinch) always keeps the middle of what you see where it is: the middle of the
   frame's part on the screen. The spot is held in tiles, not pixels: the gaps between tiles don't grow with them. */
function camMid(w){const r=w.getBoundingClientRect(),l=Math.max(r.left,0),t=Math.max(r.top,0),rr=Math.min(r.right,innerWidth),bb=Math.min(r.bottom,innerHeight);
  return rr>l&&bb>t?[(l+rr)/2,(t+bb)/2]:[r.left+r.width/2,r.top+r.height/2]}
function camGrid(){const B=$("#board"),rows=B?B.querySelectorAll(":scope>.row"):[];if(!rows.length)return null;const a=rows[0].querySelectorAll(".tile");if(!a.length)return null;
  const r0=a[0].getBoundingClientRect(),b=rows.length>1?rows[1].querySelector(".tile"):null;
  return {x:r0.left,y:r0.top,px:(a.length>1?a[1].getBoundingClientRect().left-r0.left:r0.width)||1,py:(b?b.getBoundingClientRect().top-r0.top:r0.height)||1}}
function camZoom(f){const w=camWrap();if(!w||!isLarge())return;const z0=CAM.z,z1=Math.max(CAM.ZMIN,Math.min(CAM.ZMAX,z0*f));if(z1===z0)return;
  const [cx,cy]=camMid(w),g0=camGrid();CAM.z=z1;$("#board").style.setProperty("--tw",Math.round(CAM.TILE*z1)+"px");
  const g1=g0&&camGrid();if(!g1)return;
  w.scrollLeft+=g1.x+(cx-g0.x)/g0.px*g1.px-cx;w.scrollTop+=g1.y+(cy-g0.y)/g0.py*g1.py-cy}
function camPan(dx,dy){const w=camWrap();if(!w||!isLarge())return;w.scrollBy({left:dx,top:dy,behavior:"auto"})}
function camWire(w){
  w.addEventListener("wheel",e=>{if(!isLarge()||e.ctrlKey)return;
    if(PREF.camWheel!==true){   // the page scrolls, not the field's frame: the mouse over the field never traps the page
      if(Math.abs(e.deltaX)>Math.abs(e.deltaY))return;e.preventDefault();const k=e.deltaMode===1?16:e.deltaMode===2?innerHeight:1;scrollBy(0,e.deltaY*k);return}
    e.preventDefault();const dir=(e.deltaY<0?1:-1)*(PREF.camInvWheel?-1:1);camZoom(dir>0?1.12:1/1.12,e.clientX,e.clientY)},{passive:false});
  let drag=null,moved=false;
  w.addEventListener("pointerdown",e=>{if(!isLarge()||e.pointerType!=="mouse"||e.button!==0||PREF.camDrag===false)return;if(e.target.closest(".stack,button,.ci,input,select,a"))return;   // v74a: dragging can be turned off (Controls); a stack or a button is clicked, not dragged
    drag={x:e.clientX,y:e.clientY,l:w.scrollLeft,t:w.scrollTop};moved=false});
  addEventListener("pointermove",e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>5){moved=true;w.classList.add("dragging")}
    if(moved){w.scrollLeft=drag.l-dx;w.scrollTop=drag.t-dy}});
  addEventListener("pointerup",()=>{if(!drag)return;drag=null;w.classList.remove("dragging");if(moved)setTimeout(()=>{moved=false},0)});
  w.addEventListener("click",e=>{if(moved){e.stopPropagation();e.preventDefault();moved=false}},true)}   // a drag is not a click on a tile
const typing=t=>!!(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)));
/* v77a: a held key moves the field smoothly, two at once on a diagonal (W and A: up and to the left); E zooms in, Q out */
const CAM_DIR={w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};   // v78b: WASD (the arrow keys move the field's selector, 98b_fieldkeys.js)
const CAMK=new Set();let camRaf=0,camT=0,camFast=false;
function camTick(t){camRaf=0;if(!CAMK.size||!isLarge()){camT=0;return}const dt=camT?Math.min(50,t-camT):16;camT=t;let dx=0,dy=0;
  for(const k of CAMK){dx+=CAM_DIR[k][0];dy+=CAM_DIR[k][1]}
  if(dx||dy){const n=Math.hypot(dx,dy),v=.9*camSpeed()*(camFast?2.2:1)*dt;camPan(dx/n*v,dy/n*v)}
  camRaf=requestAnimationFrame(camTick)}
const camBlocked=()=>!!document.querySelector("#ov:not([hidden]) .ovbox, #menu:not([hidden]), #facfg:not([hidden]), #rbwin:not([hidden])");
document.addEventListener("keydown",e=>{if(!isLarge()||e.ctrlKey||e.metaKey||e.altKey||typing(e.target)||camBlocked())return;
  const k=e.key.toLowerCase(),inv=PREF.camInvKeys?-1:1;camFast=e.shiftKey;
  if(CAM_DIR[k]){e.preventDefault();if(!CAMK.has(k)){CAMK.add(k);if(!camRaf){camT=0;camRaf=requestAnimationFrame(camTick)}}return}
  const zin=k==="e",zout=k==="q";if(zin||zout){e.preventDefault();camZoom((zin?1:-1)*inv>0?1.15:1/1.15)}});
document.addEventListener("keyup",e=>{CAMK.delete(e.key.toLowerCase());camFast=e.shiftKey});
addEventListener("blur",()=>CAMK.clear());
/* the Menu: Large Map Controls */
{const _om=openMenu;openMenu=function(){_om.apply(this,arguments);const m=$("#menu");if(!m||m.querySelector("#mCam"))return;const anchor=m.querySelector("#mParts")||m.querySelector(".mgrid");if(!anchor)return;
  const on=isLarge(),c=(id,t,v)=>`<label class="farow"><span class="fal"><b>${t}</b></span><input type="checkbox" id="${id}" ${v?"checked":""} ${on?"":"disabled"}></label>`;
  anchor.insertAdjacentHTML("afterend",`<details id="mCam" class="sub${on?"":" faded"}"><summary>Large Map Controls${on?"":" <small>(large maps only)</small>"}</summary>
<p class="dim">The mouse wheel scrolls the page unless zooming with it is on; drag an empty spot of the field to move it; WASD moves it, two at once for a diagonal (Shift: faster); E zooms in and Q out, always around the middle of the screen.</p><div class="facats">
${c("mCamDrag","Drag an empty spot to move the field",PREF.camDrag!==false)}${c("mCamWheel","Zoom with the mouse wheel",PREF.camWheel===true)}${c("mCamInvW","Reverse the wheel's zoom",!!PREF.camInvWheel)}${c("mCamInvK","Reverse the keys' zoom",!!PREF.camInvKeys)}</div>
<label class="f mslide">Moving speed <input type="range" id="mCamSpd" min="40" max="300" step="10" value="${Math.round(camSpeed()*100)}" ${on?"":"disabled"}><b id="mCamSpdV">${Math.round(camSpeed()*100)}%</b></label></details>`);
  const set=(k,v)=>{PREF[k]=v;savePrefs()};
  $("#mCamDrag").onchange=e=>set("camDrag",e.target.checked);   // v77c: also outside fullscreen (it was only in fullscreen's Controls)
  $("#mCamWheel").onchange=e=>{set("camWheel",e.target.checked);const n=$("#camnote");if(n)n.dataset.k="";camNote()};$("#mCamInvW").onchange=e=>set("camInvWheel",e.target.checked);$("#mCamInvK").onchange=e=>set("camInvKeys",e.target.checked);
  $("#mCamSpd").oninput=e=>{set("camSpeed",+e.target.value/100);$("#mCamSpdV").textContent=e.target.value+"%"}}}

/* the crit seal over a card on a zoomed-out field is no bigger than its tile allows */
{const _cb=critBanner;critBanner=function(){_cb.apply(this,arguments);const b=$("#critfx");if(!b)return;b.style.setProperty("--fxs",isLarge()?Math.max(.5,Math.min(1,CAM.TILE*CAM.z/64)).toFixed(2):"1")}}
if(window.__EC)Object.assign(window.__EC,{camZoom,camPan,isLarge,CAM});
