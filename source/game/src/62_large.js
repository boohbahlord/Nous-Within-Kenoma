/* ---------------- v56: large maps and their camera ----------------
   A map 10 or more tiles across sits in a frame that scrolls. Zooming changes the size of the tiles (not a picture of
   them), so everything that measures the board (the fog, the effects, the card info) keeps working.
   - v59: the mouse wheel scrolls the page, as anywhere else; zooming with it is a choice (off by default) in the note
     under the field, which also lists the controls and has − and + buttons. With it on, the wheel zooms around the pointer.
   - Dragging an empty spot of the field moves it; a stack is still clicked as always. On a touch screen the frame scrolls.
   - WASD or the arrow keys move it (Shift: faster), Q and E or C and V zoom in and out (Menu: reversed). Not while typing.
   - Menu, Large Map Controls: the wheel, both reversals and the speed. The section is faded outside a large map. */
const CAM={z:1,ZMIN:.45,ZMAX:2.2,TILE:64};
const isLarge=()=>!!(G&&G.map&&(G.map.large||COLS>9||G.rows>9));
const camSpeed=()=>Math.max(.4,Math.min(3,+PREF.camSpeed||1));
function camWrap(){const B=$("#board");if(!B)return null;let w=B.parentNode&&B.parentNode.classList&&B.parentNode.classList.contains("camwrap")?B.parentNode:null;
  if(isLarge()&&!w){w=document.createElement("div");w.className="camwrap";B.parentNode.insertBefore(w,B);w.appendChild(B);camWire(w)}
  if(w){const on=isLarge();w.classList.toggle("on",on);B.classList.toggle("large",on);B.style.setProperty("--tw",Math.round(CAM.TILE*CAM.z)+"px")}
  return w}
{const _r=render;render=function(){_r.apply(this,arguments);if(G){camWrap();camNote()}}}
/* ---------- the note under a large field: the controls, − and +, and the wheel's zoom switch ---------- */
function camNote(){const w=camWrap();let n=$("#camnote");
  if(!w||!isLarge()){if(n)n.hidden=true;return}
  if(!n){n=document.createElement("div");n.id="camnote";n.className="camnote";w.after(n)}else if(n.previousElementSibling!==w)w.after(n);
  n.hidden=false;const ph=isPhone(),key=(ph?"p":"c")+(PREF.camWheel===true);if(n.dataset.k===key)return;n.dataset.k=key;
  n.innerHTML=`<span class="cz"><button type="button" class="btn ghost sm" data-cz="-1" aria-label="Zoom out">−</button><button type="button" class="btn ghost sm" data-cz="1" aria-label="Zoom in">+</button></span>`+
    (ph?`<span class="dim">Swipe the field to move it.</span>`:`<span class="dim">Drag an empty spot to move the field · WASD or the arrow keys move it (Shift: faster) · Q and E zoom</span>
<label class="cw"><input type="checkbox" id="camWheelBox" ${PREF.camWheel===true?"checked":""}> Zoom with the mouse wheel</label>`);
  n.querySelectorAll("[data-cz]").forEach(b=>b.onclick=()=>camZoom(+b.dataset.cz>0?1.2:1/1.2));
  const cb=n.querySelector("#camWheelBox");if(cb)cb.onchange=()=>{PREF.camWheel=cb.checked;savePrefs();const m=$("#mCamWheel");if(m)m.checked=cb.checked}}
/* zoom, keeping the spot under the pointer (or the middle of the frame) where it is */
function camZoom(f,cx,cy){const w=camWrap();if(!w||!isLarge())return;const r=w.getBoundingClientRect(),x=cx==null?r.width/2:cx-r.left,y=cy==null?r.height/2:cy-r.top;
  const z0=CAM.z,z1=Math.max(CAM.ZMIN,Math.min(CAM.ZMAX,z0*f));if(z1===z0)return;
  const px=(w.scrollLeft+x)/z0,py=(w.scrollTop+y)/z0;CAM.z=z1;$("#board").style.setProperty("--tw",Math.round(CAM.TILE*z1)+"px");
  w.scrollLeft=px*z1-x;w.scrollTop=py*z1-y}
function camPan(dx,dy){const w=camWrap();if(!w||!isLarge())return;w.scrollBy({left:dx,top:dy,behavior:"auto"})}
function camWire(w){
  w.addEventListener("wheel",e=>{if(!isLarge()||e.ctrlKey)return;
    if(PREF.camWheel!==true){   // the page scrolls, not the field's frame: the mouse over the field never traps the page
      if(Math.abs(e.deltaX)>Math.abs(e.deltaY))return;e.preventDefault();const k=e.deltaMode===1?16:e.deltaMode===2?innerHeight:1;scrollBy(0,e.deltaY*k);return}
    e.preventDefault();const dir=(e.deltaY<0?1:-1)*(PREF.camInvWheel?-1:1);camZoom(dir>0?1.12:1/1.12,e.clientX,e.clientY)},{passive:false});
  let drag=null,moved=false;
  w.addEventListener("pointerdown",e=>{if(!isLarge()||e.pointerType!=="mouse"||e.button!==0)return;if(e.target.closest(".stack,button,.ci,input,select,a"))return;
    drag={x:e.clientX,y:e.clientY,l:w.scrollLeft,t:w.scrollTop};moved=false});
  addEventListener("pointermove",e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>5){moved=true;w.classList.add("dragging")}
    if(moved){w.scrollLeft=drag.l-dx;w.scrollTop=drag.t-dy}});
  addEventListener("pointerup",()=>{if(!drag)return;drag=null;w.classList.remove("dragging");if(moved)setTimeout(()=>{moved=false},0)});
  w.addEventListener("click",e=>{if(moved){e.stopPropagation();e.preventDefault();moved=false}},true)}   // a drag is not a click on a tile
const typing=t=>!!(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)));
document.addEventListener("keydown",e=>{if(!isLarge()||e.ctrlKey||e.metaKey||e.altKey||typing(e.target))return;
  if(document.querySelector("#ov:not([hidden]) .ovbox, #menu:not([hidden]), #facfg:not([hidden])"))return;
  const k=e.key.toLowerCase(),step=46*camSpeed()*(e.shiftKey?2.2:1),inv=PREF.camInvKeys?-1:1;
  const pan={w:[0,-1],arrowup:[0,-1],s:[0,1],arrowdown:[0,1],a:[-1,0],arrowleft:[-1,0],d:[1,0],arrowright:[1,0]}[k];
  if(pan){e.preventDefault();camPan(pan[0]*step,pan[1]*step);return}
  const zin=k==="q"||k==="c",zout=k==="e"||k==="v";if(zin||zout){e.preventDefault();camZoom((zin?1:-1)*inv>0?1.15:1/1.15)}});
/* the Menu: Large Map Controls */
{const _om=openMenu;openMenu=function(){_om.apply(this,arguments);const m=$("#menu");if(!m||m.querySelector("#mCam"))return;const anchor=m.querySelector("#mParts")||m.querySelector(".mgrid");if(!anchor)return;
  const on=isLarge(),c=(id,t,v)=>`<label class="farow"><span class="fal"><b>${t}</b></span><input type="checkbox" id="${id}" ${v?"checked":""} ${on?"":"disabled"}></label>`;
  anchor.insertAdjacentHTML("afterend",`<details id="mCam" class="sub${on?"":" faded"}"><summary>Large Map Controls${on?"":" <small>(large maps only)</small>"}</summary>
<p class="dim">The mouse wheel scrolls the page unless zooming with it is on; drag an empty spot of the field to move it; WASD or the arrow keys move it (Shift: faster); Q and E, or C and V, zoom in and out.</p><div class="facats">
${c("mCamWheel","Zoom with the mouse wheel",PREF.camWheel===true)}${c("mCamInvW","Reverse the wheel's zoom",!!PREF.camInvWheel)}${c("mCamInvK","Reverse the keys' zoom",!!PREF.camInvKeys)}</div>
<label class="f mslide">Moving speed <input type="range" id="mCamSpd" min="40" max="300" step="10" value="${Math.round(camSpeed()*100)}" ${on?"":"disabled"}><b id="mCamSpdV">${Math.round(camSpeed()*100)}%</b></label></details>`);
  const set=(k,v)=>{PREF[k]=v;savePrefs()};
  $("#mCamWheel").onchange=e=>{set("camWheel",e.target.checked);const n=$("#camnote");if(n)n.dataset.k="";camNote()};$("#mCamInvW").onchange=e=>set("camInvWheel",e.target.checked);$("#mCamInvK").onchange=e=>set("camInvKeys",e.target.checked);
  $("#mCamSpd").oninput=e=>{set("camSpeed",+e.target.value/100);$("#mCamSpdV").textContent=e.target.value+"%"}}}

/* the crit seal over a card on a zoomed-out field is no bigger than its tile allows */
{const _cb=critBanner;critBanner=function(){_cb.apply(this,arguments);const b=$("#critfx");if(!b)return;b.style.setProperty("--fxs",isLarge()?Math.max(.5,Math.min(1,CAM.TILE*CAM.z/64)).toFixed(2):"1")}}
if(window.__EC)Object.assign(window.__EC,{camZoom,camPan,isLarge,CAM});
