/* ---------- v77b: the keyboard ----------
   v78d: every key below is the default binding of an action (96c_keymap.js); the settings' Controls tab rebinds them.
   Shortcuts that work in fullscreen and out of it (outside it the page scrolls to what they open). Not while typing. While a
   window is open only X and Esc work (they close it: its × if it has one).
   - B the Bank · Shift+B the Ether · Ctrl+B Diplomacy · R rolls the draw · Space the turn button · Shift+Space Field
     Automation's settings · L the log · Shift+L the dice · \ the Rule book · Shift+Backspace fullscreen on and off ·
     Backspace or Delete sacrifices the hand card you picked · Ctrl+C and Ctrl+V move the camera to your Aces, back and
     forth · Ctrl+1 to what you selected on the field · Shift+X+. (period) the music on and off · Shift+/ (?) the key letters.
   - v77d: F opens the spell bar at the bottom of the screen (made for the keys): the schools as tabs and the school's
     spells as numbered tiles. 1 to 9 and 0 cast the first ten, Shift+1 to Shift+0 the next ten; C and V (or Tab and
     Shift+Tab) the school before and after, Shift+C the first, Shift+V the last (the piles: the Grave, the Ether, the
     Outer Darkness, the Auction). Shift+F opens the spell list as it is (in fullscreen, its drawer), worked by the keys:
     C and V move from spell to spell, Ctrl and Shift (pressed alone) to the next and the previous school (its sections),
     Enter casts, and the numbers work there too. (Tab is for tabs: the bar's schools are tabs, the list's are sections.)
     One of the two at a time; while one is open the number keys are its own. X closes it.
   - G picks from the hand: C and V move, Enter picks the card (again: lets it go), I its info. X or Esc stops. */
const KB={mode:null,sc:0,h:0,synth:false,ace:-1};
const KB_WINS="#pop,#histpop,#rbwin,.fsov,.faov,#cheatq,#clsmenu,#etherpanel,#ov,#menu,#leavebox,.drawer,#animask";
const kbVis=el=>!el.hidden&&el.getClientRects().length>0&&el.innerHTML.trim()!=="";
function kbTop(){let best=null,bz=-1e9;for(const el of document.querySelectorAll(KB_WINS)){if(!kbVis(el))continue;const z=+getComputedStyle(el).zIndex||0;if(z>=bz){bz=z;best=el}}return best}
function kbEsc(){KB.synth=true;try{document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",code:"Escape",bubbles:true,cancelable:true}))}finally{KB.synth=false}}
/* close the window on top: its × when it has one, else what Esc does for it */
function kbClose(){const w=kbTop();if(!w)return false;const x=[...w.querySelectorAll(".xclose,[data-x],[data-rbclose],button[aria-label^='Close']")].find(b=>b.getClientRects().length);
  if(x)x.click();else kbEsc();return true}
const kbShow=el=>{if(!el)return;if(!fsOn())el.scrollIntoView({block:"center",behavior:"smooth"});el.classList.add("spping");setTimeout(()=>el.classList.remove("spping"),1600)};
/* the camera on a tile: the large map's frame, or the page */
function kbLook(r,c){const t=document.querySelector(`#board .tile[data-r="${r}"][data-c="${c}"]`);if(!t)return;const w=camWrap();
  if(w&&isLarge()){const [mx,my]=camMid(w),tr=t.getBoundingClientRect();w.scrollLeft+=tr.left+tr.width/2-mx;w.scrollTop+=tr.top+tr.height/2-my;if(!fsOn())w.scrollIntoView({block:"nearest"})}
  else t.scrollIntoView({block:"center",behavior:"smooth"});t.classList.add("kbping");setTimeout(()=>t.classList.remove("kbping"),1200)}
/* the spells: their schools, and the piles last */
const kbSchools=()=>{const box=$("#spells");const out=box?[...box.querySelectorAll("details.school")].map(d=>({el:d,items:[...d.querySelectorAll("button.spell")]})):[];
  const piles=["#seegrave","#seeether","#seedark","#seeauct"].map(s=>$(s)).filter(Boolean);if(piles.length)out.push({el:piles[0].parentNode,items:piles,piles:true});return out};
const kbSpellMode=()=>KB.mode==="bar"||KB.mode==="list";
function kbOff(){const was=KB.mode;KB.mode=null;if(was==="list"&&KB.fsOpened&&fsOn()&&PREF.fsSp){const t=$("#fstabSp");if(t)t.click()}KB.fsOpened=false;kbPaint()}
function kbBar(){if(KB.mode&&KB.mode!=="bar")kbOff();KB.mode="bar";kbPaint()}
function kbList(){if(KB.mode&&KB.mode!=="list")kbOff();KB.mode="list";KB.li=KB.li|0;
  if(fsOn()){if(!PREF.fsSp){const t=$("#fstabSp");if(t){t.click();KB.fsOpened=true}}}else kbShow($(".spellpanel"));kbPaint();kbLiShow()}
function kbSchool(i){const S=kbSchools();if(!S.length)return;KB.sc=(i%S.length+S.length)%S.length;KB.li=0;const s=S[KB.sc];if(s.el.tagName==="DETAILS"&&!s.el.open)s.el.open=true;
  kbPaint();if(KB.mode==="list")kbLiShow()}
/* the list: one spell after another, through the schools (an empty or folded school is opened on the way) */
function kbStep(d){const S=kbSchools();if(!S.length)return;let sc=KB.sc,li=(KB.li|0)+d;
  for(let n=0;n<=S.length;n++){const L=S[sc].items.length;if(li>=0&&li<L)break;sc=(sc+(li<0?-1:1)+S.length)%S.length;li=li<0?S[sc].items.length-1:0}
  KB.sc=sc;KB.li=Math.max(0,li);const s=S[sc];if(s.el.tagName==="DETAILS"&&!s.el.open)s.el.open=true;kbPaint();kbLiShow()}
function kbLiShow(){const s=kbSchools()[KB.sc],b=s&&s.items[KB.li];if(b)b.scrollIntoView({block:"nearest",behavior:"smooth"})}
/* the bar: the schools as tabs, and the school's spells (or the piles) as numbered tiles that click the real ones */
const kbNum=i=>i<9?String(i+1):i===9?"0":i<19?"⇧"+(i-9):i===19?"⇧0":"";
function kbBarPaint(){let el=$("#kbbar");if(KB.mode!=="bar"||!G){if(el)el.remove();return}
  const S=kbSchools();if(!S.length){if(el)el.remove();KB.mode=null;return}KB.sc=Math.min(KB.sc,S.length-1);const s=S[KB.sc];
  if(!el){el=document.createElement("div");el.id="kbbar";el.setAttribute("role","dialog");el.setAttribute("aria-label","Spells");document.body.appendChild(el)}
  const sname=x=>x.piles?"Piles":((x.el.querySelector("summary")||{}).textContent||"").trim();
  const tile=(b,i)=>{let nm="",dt="",cost="";
    if(s.piles){nm=b.textContent.trim()}
    else{const sn=b.querySelector(".sn");if(sn){const c=sn.cloneNode(true);c.querySelectorAll("small,.bolts,.chips,i").forEach(x=>x.remove());nm=c.textContent.trim();dt=[...sn.querySelectorAll("small")].map(x=>x.textContent.trim()).filter(Boolean).join(" · ")}else nm=b.textContent.trim();
      const em=b.querySelector("em");cost=em?em.textContent.trim():""}
    return `<button type="button" class="kbtile${b.classList.contains("off")?" off":""}" data-kbi="${i}"><span class="kn">${kbNum(i)}</span><span class="kt"><b>${esc(nm)}</b>${dt?`<small>${esc(dt)}</small>`:""}</span>${cost?`<em>${esc(cost)}</em>`:""}</button>`};
  const kk=id=>esc(kmShow(id));
  el.innerHTML=`<div class="kbtabs"><span class="kbk">${kk("spPrev")}</span>${S.map((x,i)=>`<button type="button" class="kbtab${i===KB.sc?" on":""}" data-kbs="${i}">${esc(sname(x))}</button>`).join("")}<span class="kbk">${kk("spNext")}</span><button type="button" class="xclose" aria-label="Close the spells">×</button></div>
<div class="kbtiles">${s.items.length?s.items.map(tile).join(""):`<p class="dim">Nothing here.</p>`}</div>
<p class="kbhelp">1–9 and 0 cast · Shift+1 to Shift+0 the next ten · ${kk("spPrev")} and ${kk("spNext")}, or ${kk("spSchoolNext")}, the school before and after · ${kk("spFirst")} the first, ${kk("spLast")} the piles · ${kk("close")} closes</p>`;
  el.querySelectorAll("[data-kbi]").forEach(b=>b.onclick=()=>kbCast(+b.dataset.kbi+1));
  el.querySelectorAll("[data-kbs]").forEach(b=>b.onclick=()=>kbSchool(+b.dataset.kbs));el.querySelector(".xclose").onclick=kbOff}
function kbCast(n){const S=kbSchools(),s=S[KB.sc];if(!s)return;const b=s.items[n-1];if(!b){flash(`${s.piles?"The piles have":"This school has"} no ${n}${n===1?"st":n===2?"nd":n===3?"rd":"th"} entry.`);return}b.click()}
/* the hand */
const kbHand=()=>[...document.querySelectorAll("#hand [data-h]")];
function kbHandOn(on){if(on&&kbSpellMode())kbOff();KB.mode=on?"hand":null;if(on){const H=kbHand();KB.h=Math.max(0,Math.min(H.length-1,KB.h));kbShow($("#handwrap"))}kbPaint()}
/* the marks: the school and its numbers, the card in the hand, and (when chosen) the key letters on the buttons */
const KB_HINTS=[["#bankslot .bankbar","bank"],["#openEther","ether"],["#dipbar","dip"],["#next","turn"],[".fabar .facfgb","faset"],["#fstabSp","spelllist"],[".spellpanel>h3",["spellbar","spelllist"]],["#handh","hand"],["#d4","roll"],
  ["#logwrap>h3","log"],["#fsrowT","dice"],["#dicefold>summary","dice"],["#fsbtn","fullscreen"],["#fspauseb",null],[".camnote [data-cz='1']","zoomIn"],[".camnote [data-cz='-1']","zoomOut"]];
/* a button's letters: its action's first binding, short ("⇧B"); the pause button's is Esc */
const kbHintOf=a=>a==null?"Esc":(Array.isArray(a)?a:[a]).map(id=>{const s=kmBinds(id).filter(Boolean)[0];return s?kmShort(s):""}).filter(Boolean).join(" · ");
function kbPaint(){
  document.querySelectorAll(".kbsch").forEach(e=>e.classList.remove("kbsch"));document.querySelectorAll("[data-kbn]").forEach(e=>e.removeAttribute("data-kbn"));
  document.querySelectorAll(".kbon,.kbli").forEach(e=>e.classList.remove("kbon","kbli"));
  kbBarPaint();
  if(KB.mode==="list"){const S=kbSchools();if(!S.length)KB.mode=null;else{KB.sc=Math.min(KB.sc,S.length-1);const s=S[KB.sc];s.el.classList.add("kbsch");
    s.items.forEach((b,i)=>b.setAttribute("data-kbn",kbNum(i)));KB.li=Math.min(KB.li|0,Math.max(0,s.items.length-1));if(s.items[KB.li])s.items[KB.li].classList.add("kbli")}}
  if(KB.mode==="hand"){const H=kbHand();if(!H.length)KB.mode=null;else{KB.h=Math.min(KB.h,H.length-1);H[KB.h].classList.add("kbon")}}
  document.querySelectorAll("[data-kb]").forEach(e=>{e.removeAttribute("data-kb");e.classList.remove("kbrel")});
  if(PREF.keyHints===true&&G)for(const [sel,a] of KB_HINTS){const k=kbHintOf(a);if(k)for(const el of document.querySelectorAll(sel)){if(!el.getClientRects().length)continue;el.setAttribute("data-kb",k);if(getComputedStyle(el).position==="static")el.classList.add("kbrel")}}
  const x=kbHintOf("close");if(PREF.keyHints===true&&x)document.querySelectorAll(".xclose").forEach(el=>{if(el.getClientRects().length)el.setAttribute("data-kb",x)})}
{const _r=render;render=function(){rSafe(_r,this,arguments);try{kbPaint()}catch(e){console.error(e)}}}
function kbHints(on){PREF.keyHints=!!on;savePrefs();kbPaint();for(const id of ["mKeyHints","fsKeyHints"]){const c=$("#"+id);if(c)c.checked=PREF.keyHints}flash(on?`Key letters on: each button shows its key. ${kmShow("hints")} hides them.`:"Key letters off.")}
/* the log in fullscreen: its own window (the row at the bottom shows one line) */
function kbLog(){if(!fsOn()){const l=$("#logwrap");kbShow(l);return}
  let w=$("#kblog");if(!w){w=document.createElement("div");w.id="kblog";w.className="faov";document.body.appendChild(w)}
  w.innerHTML=`<div class="ovbox wide kblogbox" role="dialog" aria-modal="true" aria-labelledby="kblogh"><button type="button" class="xclose" aria-label="Close">×</button><h2 id="kblogh">Log</h2><ol class="kblog">${$("#log")?$("#log").innerHTML:""}</ol></div>`;
  w.hidden=false;w.querySelector(".xclose").onclick=()=>{w.hidden=true};w.onclick=e=>{if(e.target===w)w.hidden=true}}
function kbDice(){if(fsOn()){PREF.fsRow="dice";PREF.fsRowOpen=!PREF.fsRowOpen;savePrefs();fsPaint();return}const d=$("#dicefold");if(d){d.open=true;kbShow(d)}}
const kbDigit=e=>{const m=/^(?:Digit|Numpad)(\d)$/.exec(e.code);return m?(m[1]==="0"?10:+m[1]):0};
const kbModeOff=()=>KB.mode==="hand"?kbHandOn(false):kbOff();
/* the camera to your Aces, one after another (not while text is selected: Ctrl+C copies it) */
function kbAce(d){if(getSelection&&String(getSelection()).length)return false;const V=view(),A=[];
  for(let r=0;r<G.rows;r++)for(let c=0;c<G.board[r].length;c++){const s=G.board[r][c];if(s&&s.owner===V&&hasBase(s))A.push([r,c])}
  if(!A.length){flash("You have no Ace on the field.");return}KB.ace=((KB.ace+d)%A.length+A.length)%A.length;kbLook(...A[KB.ace])}
/* the table's shortcuts: [action, what it does]; one that returns false leaves the key to the browser */
const KB_DO=[
  ["fullscreen",()=>fsOn()?fsExit():fsEnter()],["hints",()=>kbHints(PREF.keyHints!==true)],
  ["dip",()=>{const b=$("#dipbar");if(b)b.click();else flash("Diplomacy is off in this game.")}],
  ["aceBack",()=>kbAce(-1)],["aceNext",()=>kbAce(1)],["lookSel",()=>{if(G.sel)kbLook(G.sel.r,G.sel.c);else flash("Nothing is selected on the field.")}],
  ["faset",()=>{if(typeof faAllowed==="function"&&faAllowed())faWindow();else flash("Field Automation is off in this game.")}],
  ["spelllist",()=>kbList()],["spellbar",()=>kbBar()],["ether",()=>openEtherShop()],["bank",()=>{const b=$("#bankslot .bankbar");if(b)b.click();else openBank()}],
  ["dice",()=>kbDice()],["log",()=>kbLog()],["hand",()=>kbHandOn(true)],["console",()=>cnOpen()],["consoleSwap",()=>cnSwap()],
  ["roll",()=>{const d=$("#d4");if(d&&!d.disabled)d.click();else flash("There is nothing to roll now: the draw is in your draw phase.")}],
  ["sacrifice",()=>{const P=G.p[view()],i=P&&G.selHand?P.hand.indexOf(G.selHand):-1;if(i<0)return false;
    const b=document.querySelector(`#hand [data-sh="${i}"]`);if(b)b.click();else flash("That card can't be sacrificed now.")}]];
/* Ctrl or Shift pressed alone in the spells: the next or the previous school */
document.addEventListener("keyup",e=>{if(!G||!kbSpellMode()||kbTop()||typing(e.target))return;
  if(kmTap(e,"spSchoolNext"))kbSchool(KB.sc+1);else if(kmTap(e,"spSchoolPrev"))kbSchool(KB.sc-1)});
document.addEventListener("keydown",e=>{if(KB.synth||e.defaultPrevented||typing(e.target))return;
  const is=id=>kmIs(e,id),stop=()=>{e.preventDefault();e.stopImmediatePropagation()};
  if(G&&!G.over&&!kmModOnly(e))kbRemind();
  if(is("keys")){stop();kbKeysWin();return}
  if(is("music")){stop();if(typeof musicSync==="function"){PREF.music=PREF.music===false;savePrefs();musicSync();flash(PREF.music===false?"Music off.":"Music on.")}return}
  if(is("rulebook")){stop();rbWin();return}
  /* closing: the window on top first (its ×), then the spells or the hand; Esc for the windows that have no Esc of their own */
  if(is("close")){if(kbTop()){stop();kbClose()}else if(KB.mode){stop();kbModeOff()}return}
  if(e.key==="Escape"){const w=kbTop();
    if(w){if(w.matches("#ov,.faov,#menu,#animask,#leavebox")){const x=[...w.querySelectorAll(".xclose,[data-x],button[aria-label^='Close']")].find(b=>b.getClientRects().length);if(x){stop();x.click()}}return}   // the rest close on their own Esc
    if(KB.mode){stop();kbModeOff()}return}
  if(kbTop()||!G||G.passing)return;   // a window is open, or no game: the rest waits
  /* the spells and the hand, while open, before the rest */
  if(kbSpellMode()){const n=kbDigit(e);if(n&&!e.ctrlKey&&!e.altKey&&!e.metaKey){stop();kbCast(n+(e.shiftKey?10:0));return}
    if(is("spSchoolNext")||is("spSchoolPrev")){stop();kbSchool(KB.sc+(is("spSchoolNext")?1:-1));return}
    if(is("spFirst")||is("spLast")){stop();kbSchool(is("spFirst")?0:kbSchools().length-1);return}
    if(is("spNext")||is("spPrev")){stop();const d=is("spNext")?1:-1;if(KB.mode==="bar")kbSchool(KB.sc+d);else kbStep(d);return}
    if(is("spCast")&&KB.mode==="list"){stop();const s=kbSchools()[KB.sc],b=s&&s.items[KB.li];if(b)b.click();return}}
  if(KB.mode==="hand"){const H=kbHand();
    if(is("hNext")||is("hPrev")){stop();if(H.length){KB.h=(KB.h+(is("hNext")?1:-1)+H.length)%H.length;kbPaint();H[KB.h].scrollIntoView({block:"nearest",inline:"nearest"})}return}
    if(is("hPick")){stop();if(H[KB.h])H[KB.h].click();kbPaint();return}
    if(is("hInfo")){stop();const ci=H[KB.h]&&H[KB.h].querySelector(".ci");if(ci)ci.click();return}}
  const a=KB_DO.find(([id])=>is(id));if(a&&a[1]()!==false)stop();
},true);
/* v78a: O shows every key in a window; once a game, the first key pressed brings a note saying so */
function kbKeysWin(){let w=$("#kbkeys");if(!w){w=document.createElement("div");w.id="kbkeys";w.className="faov";document.body.appendChild(w)}
  w.innerHTML=`<div class="ovbox wide kbkeysbox" role="dialog" aria-modal="true" aria-labelledby="kbkh"><button type="button" class="xclose" aria-label="Close">×</button><h2 id="kbkh">Keys</h2>${kbListHTML("kwKeyHints")}<p class="dim">The same list is in the pause menu and the Menu (Keyboard controls).</p></div>`;
  w.hidden=false;w.querySelector(".xclose").onclick=()=>{w.hidden=true};w.onclick=e=>{if(e.target===w)w.hidden=true};$("#kwKeyHints").onchange=e=>kbHints(e.target.checked)}
function kbRemind(){const g=G&&G.map?G.map.seed:null;if(g==null||KB.reminded===g)return;KB.reminded=g;
  let n=$("#kbremind");if(!n){n=document.createElement("div");n.id="kbremind";n.setAttribute("role","status");document.body.appendChild(n)}
  n.innerHTML=`Press <kbd>${esc(kmShow("keys"))}</kbd> any time to see every key.`;n.hidden=false;clearTimeout(kbRemind.t);kbRemind.t=setTimeout(()=>{n.hidden=true},7000)}
/* v78a: Tab never leaves the game for the browser's own bar: where it means nothing, it does nothing */
document.addEventListener("keydown",e=>{if(e.key==="Tab")e.preventDefault()});
/* the list of keys, as bound now: in the pause menu, the settings' Controls tab and the O window, with the key letters' switch */
function kbListHTML(id){const row=(k,t)=>`<li><kbd>${esc(k)}</kbd> ${esc(t)}</li>`,K=x=>kmShow(x),out=[];
  for(const [g,gname] of KM_GROUPS){out.push(`<li class="kbgrp"><b>${esc(gname)}</b></li>`);for(const a of KM_ACTS)if(a[1]===g)out.push(row(kmShow(a[0],true),a[3]))}
  out.push(`<li class="kbgrp"><b>And always</b></li>`,row("Esc","close what is open (with nothing open in fullscreen: the pause menu)"),
    row("1–9 and 0","in the spell bar and the list: cast the school's first ten (Shift+1 to Shift+0 the next ten); in the actions window: use them"),
    row("A slider, a list or a number",`${K("winUse")}, then ${K("winUp")} or ${K("winRight")} up, ${K("winDown")} or ${K("winLeft")} down (Shift: ten), or type a number; ${K("winUse")} keeps it, Esc puts it back`),
    row("A text field",`${K("winUse")} to type; Enter again (or Esc) when done`),
    row("A line of a ranking",`${K("winUse")} takes hold: ${K("winUp")} up, ${K("winDown")} down, Space equal to the one above, Enter lets go`),
    row("A player's box",`after ${K("plNext")}: C and V read it, Enter opens its history`),
    row("The command line",`after ${K("console")}: type a command or a tile (help lists them); Tab completes, Tab again or ↑ ↓ choose, Enter runs, Esc closes (or type x)`));
  return `<ul class="mklist kblist">${out.join("")}</ul><p class="dim">Every one of them can be changed: the settings, Controls, Key bindings.</p><label class="farow"><span class="fal"><b>Key letters on the buttons</b><small>Each button shows its key. ${esc(kmShow("hints"))} switches them too.</small></span><input type="checkbox" id="${id}" ${PREF.keyHints===true?"checked":""}></label>`}
{const _fp=fsPause;fsPause=function(){_fp.apply(this,arguments);const o=$("#fspause"),box=o&&o.querySelector(".fspbox");if(!box||box.querySelector(".kbfold"))return;
  const d=document.createElement("details");d.className="sub kbfold";d.innerHTML=`<summary>Keyboard controls</summary>${kbListHTML("fsKeyHints")}`;
  const q=box.querySelector(".fsqlink");q?box.insertBefore(d,q):box.appendChild(d);$("#fsKeyHints").onchange=e=>kbHints(e.target.checked)}}
{const _om=openMenu;openMenu=function(){_om.apply(this,arguments);const m=$("#menu"),box=m&&m.querySelector(".ovbox");if(!box||box.querySelector(".kbfold"))return;
  const d=document.createElement("details");d.className="sub kbfold";d.innerHTML=`<summary>Keyboard controls</summary>${kbListHTML("mKeyHints")}`;
  const a=box.querySelector("#mCam")||box.querySelector(".maccess")||box.querySelector(".mgrid");if(a)a.after(d);else box.appendChild(d);$("#mKeyHints").onchange=e=>kbHints(e.target.checked)}}

if(window.__EC)Object.assign(window.__EC,{KB,kbClose:()=>kbClose(),kbSchools:()=>kbSchools()});
