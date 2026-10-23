/* ---------- v77f: windows, menus and drawers by keys ----------
   Whatever window is open on top (the Menu, the pause menu, the Bank, Field Automation's settings, Diplomacy, the Ether,
   the Heavenly Body shop and the Oaths, the Rule book, a popup, the new-game screen):
   - C and V: the item before and after (buttons, choices, switches, sliders, lists, fields, folds), scrolling to it.
     W A S D: the nearest item up, left, down and right, by where the items sit.
   - Enter uses it: a button is pressed, a box ticked or unticked, a fold opened or shut. On a slider, a list or a number,
     Enter starts adjusting it: W or D (or V) up, S or A (or C) down (Shift: ten at a time), and on a number the number keys
     type it; Enter keeps it, Esc (or X) puts it back. On a text field Enter lets you type; Enter again (or Esc) and the
     keys are back on it. A typed number that doesn't fit is refused, with a note saying what fits.
   - A line of a ranking (Field Automation's priorities): Enter takes hold of it; W or D moves it up, S or A down, Space makes
     it equal to the one above, Enter lets go.
   - Tab and Shift+Tab: the window's tabs (the Bank's, the setup's); nothing where there are none.
   - Ctrl and Shift pressed alone: the next (further down) and the previous section of a long window (the Ether's kinds of
     cards, the Menu's folds, the setup's boxes); nothing where there are none. (v78a: Ctrl forward and Shift back, as on the field.)
   - I: what the item under the keys does (its tip), since there is no hovering with keys. X or Esc closes the window.
   The highlight appears only once a key is used, so the mouse never sees it. */
const WK={el:null,sig:null,win:null,adj:null,typ:null,mv:null};
const WK_ITEMS="button,a[href],input:not([type=hidden]),select,textarea,summary,[role=button],.facol";
const wkSig=el=>{if(el.classList.contains("facol")){const b=el.querySelector("[data-faact]");return "row:"+(b?b.dataset.faact.split(":").slice(1).join(":"):el.textContent.trim().slice(0,24))}
  return el.id?"#"+el.id:[el.tagName,...[...el.attributes].filter(a=>/^data-|^name$|^value$|^for$/.test(a.name)).map(a=>a.name+"="+a.value),el.textContent.trim().slice(0,24)].join("|")};
function wkItems(w){const out=[],seen=new Set();
  for(let el of w.querySelectorAll(WK_ITEMS)){if(el.disabled)continue;
    if(el.matches("input[type=checkbox],input[type=radio]")){const r=el.getBoundingClientRect();if(r.width<4||r.height<4||getComputedStyle(el).opacity==="0"){const l=el.closest("label");if(!l)continue;el=l}}
    if(!el.matches("summary")&&el.closest("summary"))continue;   // the fold's summary stands for what is in it
    if(!el.getClientRects().length||getComputedStyle(el).visibility==="hidden"||seen.has(el))continue;seen.add(el);out.push(el)}
  return out}
function wkCur(w){if(WK.el&&WK.el.isConnected&&w.contains(WK.el))return WK.el;
  if(WK.sig){const it=wkItems(w).find(x=>wkSig(x)===WK.sig);if(it){WK.el=it;return it}}return null}
function wkMark(el){document.querySelectorAll(".kbfoc").forEach(x=>x.classList.remove("kbfoc"));WK.el=el;if(!el)return;WK.sig=wkSig(el);el.classList.add("kbfoc");el.scrollIntoView({block:"nearest",inline:"nearest"})}
function wkRemark(){const w=kbTop();if(!w||!WK.sig)return;const c=wkCur(w);if(c&&!c.classList.contains("kbfoc"))c.classList.add("kbfoc")}
const wkLater=()=>{for(const ms of [0,60,200])setTimeout(wkRemark,ms)};
/* the note at the bottom of the screen: what the keys do while adjusting, typing or moving a line */
function wkNote(t){let n=$("#wknote");if(!t){if(n)n.hidden=true;return}if(!n){n=document.createElement("div");n.id="wknote";n.setAttribute("role","status");document.body.appendChild(n)}n.textContent=t;n.hidden=false}
/* the nearest item in a direction */
function wkNear(items,cur,dx,dy){const r=cur.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let best=null,bs=1e9;
  for(const it of items){if(it===cur)continue;const q=it.getBoundingClientRect(),ex=q.left+q.width/2-cx,ey=q.top+q.height/2-cy,along=dx?ex*dx:ey*dy,across=dx?Math.abs(ey):Math.abs(ex);
    if(along<=4)continue;const sc=along+across*2.5;if(sc<bs){bs=sc;best=it}}return best}
/* adjusting a slider, a list or a number */
function wkAdjStart(el){WK.adj={el,old:el.value};el.classList.add("kbadj");
  wkNote(el.tagName==="SELECT"?"Choosing: W or D (or V) the next, S or A (or C) the one before · Enter keeps it · Esc puts it back":
    el.type==="number"?"Setting a number: W or D (or V) up, S or A (or C) down, Shift for ten · or type it with the number keys · Enter keeps it · Esc puts it back":
    "Sliding: W or D (or V) up, S or A (or C) down, Shift for ten steps · Enter keeps it · Esc puts it back")}
const wkFire=(el,...ev)=>ev.forEach(t=>el.dispatchEvent(new Event(t,{bubbles:true})));
function wkAdjStep(d,big){const el=WK.adj.el;
  if(el.tagName==="SELECT"){const o=[...el.options].filter(x=>!x.disabled);let i=o.indexOf(el.selectedOptions[0]);i=Math.max(0,Math.min(o.length-1,i+d));if(o[i]&&el.value!==o[i].value){el.value=o[i].value;wkFire(el,"input","change")}return}
  const st=+el.step||1,mn=el.min!==""?+el.min:-Infinity,mx=el.max!==""?+el.max:Infinity;let v=(+el.value||0)+d*st*(big?10:1);v=+Math.max(mn,Math.min(mx,v)).toFixed(6);
  el.value=v;wkFire(el,"input")}
function wkAdjEnd(keep){const a=WK.adj;if(!a)return;WK.adj=null;a.el.classList.remove("kbadj");if(!keep&&a.el.value!==a.old){a.el.value=a.old;wkFire(a.el,"input","change")}else if(a.el.tagName!=="SELECT")wkFire(a.el,"change");wkNote("");wkLater()}
/* typing in a field */
function wkType(el,first){WK.adj=null;el.classList.remove("kbadj");WK.typ=el;el.focus({preventScroll:true});if(first!=null)el.value=first;else try{el.select()}catch(e){}
  wkNote("Typing · Enter when done · Esc to stop")}
function wkTypeEnd(){const el=WK.typ;WK.typ=null;wkNote("");if(el){el.blur();wkMark(el)}}
function wkBad(el){const v=el.value.trim();if(el.type!=="number")return "";const n=+v,mn=el.min!==""?+el.min:null,mx=el.max!==""?+el.max:null;
  if(v===""||isNaN(n))return `“${v}” is not a number.`;if(mn!=null&&n<mn||mx!=null&&n>mx)return `${n} doesn't fit: a number from ${mn??"any"} to ${mx??"any"}.`;
  if(el.step&&el.step!=="any"&&Math.abs((n-(mn||0))/(+el.step)-Math.round((n-(mn||0))/(+el.step)))>1e-6)return `${n} doesn't fit: steps of ${el.step}.`;return ""}
/* a line of a ranking */
function wkMove(d){const row=WK.mv&&wkCur(kbTop()||document.body);if(!row)return;const b=row.querySelector(`[data-faact*="${d}:"]`);if(b&&!b.disabled)b.click();wkLater()}
/* tabs and sections */
function wkTab(w,d){const T=[...w.querySelectorAll(".stab,[role=tab]")].filter(t=>t.getClientRects().length&&!t.disabled);if(T.length<2)return;
  let i=T.findIndex(t=>t.classList.contains("on")||t.getAttribute("aria-selected")==="true");i=((i<0?0:i+d)%T.length+T.length)%T.length;T[i].click();
  setTimeout(()=>{const t=[...w.querySelectorAll(".stab,[role=tab]")].filter(x=>x.getClientRects().length)[i];if(t)wkMark(t)},0)}
function wkSection(w,d){const H=[...w.querySelectorAll("h3,h4,summary,legend,.dsec>h4,.dhead")].filter(h=>h.getClientRects().length&&getComputedStyle(h).visibility!=="hidden");if(H.length<2)return;
  const cur=wkCur(w),y=cur?cur.getBoundingClientRect().top+1:-1e9;let at=-1;H.forEach((h,i)=>{if(h.getBoundingClientRect().top<=y)at=i});
  const j=Math.max(0,Math.min(H.length-1,at+d));if(j===at&&cur)return;const h=H[j];h.scrollIntoView({block:"start",behavior:"smooth"});
  const items=wkItems(w),hy=h.getBoundingClientRect().top-1;
  const it=h.matches("summary")?h:items.find(x=>x.getBoundingClientRect().top>=hy&&(h.compareDocumentPosition(x)&Node.DOCUMENT_POSITION_FOLLOWING));wkMark(it||null)}
/* Ctrl or Shift pressed alone (as bound): the next or the previous section */
addEventListener("keyup",e=>{if(typing(e.target)||WK.adj||WK.mv)return;const w=kbTop();if(!w)return;
  if(kmTap(e,"secNext"))wkSection(w,1);else if(kmTap(e,"secPrev"))wkSection(w,-1)},true);
/* the keys (as bound: the Windows group of 96c_keymap.js) */
addEventListener("keydown",e=>{if(KB.synth)return;const k=e.key,is=id=>kmIs(e,id),stop=()=>{e.preventDefault();e.stopImmediatePropagation()};
  if(WK.typ){if(e.target!==WK.typ){WK.typ=null;wkNote("")}else{
    if(k==="Escape"){stop();wkTypeEnd();return}
    if(k==="Enter"){const bad=wkBad(WK.typ);if(bad){stop();wkNote(bad+" Type another, or Esc to stop.");return}wkFire(WK.typ,"input","change");const el=WK.typ;setTimeout(()=>{if(WK.typ===el)wkTypeEnd()},0)}
    return}}
  if(typing(e.target))return;
  const w=kbTop();if(!w){if(WK.adj)wkAdjEnd(false);WK.mv=null;return}
  const plain=!e.ctrlKey&&!e.altKey&&!e.metaKey,up=is("winUp")||is("winRight")||is("winNext"),dn=is("winDown")||is("winLeft")||is("winPrev");
  if(WK.adj){const au=up||plain&&(k==="ArrowUp"||k==="ArrowRight"),ad=dn||plain&&(k==="ArrowDown"||k==="ArrowLeft");
    if(au||ad){stop();wkAdjStep(au?1:-1,e.shiftKey);return}
    if(is("winUse")){stop();wkAdjEnd(true);return}if(k==="Escape"||is("close")){stop();wkAdjEnd(false);return}
    const dg=kbDigit(e);if(dg&&plain&&WK.adj.el.type==="number"){stop();const el=WK.adj.el;WK.adj=null;wkType(el,String(dg%10))}return}
  if(WK.mv){if(up){stop();wkMove("up");return}if(dn){stop();wkMove("down");return}
    if(k===" "&&plain){stop();wkMove("eq");return}if(is("winUse")||k==="Escape"||is("close")){stop();WK.mv=null;wkNote("");return}return}
  if(is("tabNext")||is("tabPrev")){stop();wkTab(w,is("tabNext")?1:-1);return}
  if(is("secNext")||is("secPrev")){stop();wkSection(w,is("secNext")?1:-1);return}   // bound to a key (alone, Ctrl and Shift act on letting go)
  const items=wkItems(w);if(!items.length)return;let cur=wkCur(w);
  const dir=is("winUp")?[0,-1]:is("winDown")?[0,1]:is("winLeft")?[-1,0]:is("winRight")?[1,0]:null,seq=is("winNext")?1:is("winPrev")?-1:0;
  if(dir||seq){stop();
    if(!cur){const f=document.activeElement&&items.includes(document.activeElement)?document.activeElement:items[0];wkMark(f);return}
    if(dir){const n=wkNear(items,cur,dir[0],dir[1]);if(n)wkMark(n);return}
    const i=items.indexOf(cur);wkMark(items[((i<0?0:i+seq)%items.length+items.length)%items.length]);return}
  if(is("winUse")&&cur){stop();
    if(cur.matches("input[type=range],select,input[type=number]")){wkAdjStart(cur);return}
    if(cur.matches("textarea,input:not([type]),input[type=text],input[type=search],input[type=email],input[type=password]")){wkType(cur);return}
    if(cur.classList.contains("facol")){WK.mv=true;wkNote(`Moving a line: ${kmShow("winUp")} up · ${kmShow("winDown")} down · Space makes it equal to the one above · ${kmShow("winUse")} when done`);return}
    cur.click();wkLater();return}
  if(is("winInfo")&&cur){stop();const t=cur.getAttribute("data-tip")||cur.title||cur.getAttribute("aria-label")||(cur.closest("[data-tip],[title]")||{}).title||"";flash(t||cur.textContent.trim().slice(0,140)||"No more to say about this.");return}
},true);
{const _r=render;render=function(){rSafe(_r,this,arguments);if(WK.sig)try{wkRemark()}catch(e){}}}

if(window.__EC)Object.assign(window.__EC,{WK,wkItems:w=>wkItems(w)});
