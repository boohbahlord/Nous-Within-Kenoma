/* ---------- v77b: the keyboard ----------
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
const KB={mode:null,sc:0,h:0,synth:false,held:new Set(),ace:-1};
const KB_WINS="#pop,#histpop,#rbwin,.fsov,.faov,#cheatq,#clsmenu,#etherpanel,#ov,#menu,#leavebox,.drawer";
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
  el.innerHTML=`<div class="kbtabs"><span class="kbk">C</span>${S.map((x,i)=>`<button type="button" class="kbtab${i===KB.sc?" on":""}" data-kbs="${i}">${esc(sname(x))}</button>`).join("")}<span class="kbk">V</span><button type="button" class="xclose" aria-label="Close the spells">×</button></div>
<div class="kbtiles">${s.items.length?s.items.map(tile).join(""):`<p class="dim">Nothing here.</p>`}</div>
<p class="kbhelp">1–9 and 0 cast · Shift+1 to Shift+0 the next ten · C and V, or Tab, the school before and after · Shift+C the first, Shift+V the piles · X closes</p>`;
  el.querySelectorAll("[data-kbi]").forEach(b=>b.onclick=()=>kbCast(+b.dataset.kbi+1));
  el.querySelectorAll("[data-kbs]").forEach(b=>b.onclick=()=>kbSchool(+b.dataset.kbs));el.querySelector(".xclose").onclick=kbOff}
function kbCast(n){const S=kbSchools(),s=S[KB.sc];if(!s)return;const b=s.items[n-1];if(!b){flash(`${s.piles?"The piles have":"This school has"} no ${n}${n===1?"st":n===2?"nd":n===3?"rd":"th"} entry.`);return}b.click()}
/* the hand */
const kbHand=()=>[...document.querySelectorAll("#hand [data-h]")];
function kbHandOn(on){if(on&&kbSpellMode())kbOff();KB.mode=on?"hand":null;if(on){const H=kbHand();KB.h=Math.max(0,Math.min(H.length-1,KB.h));kbShow($("#handwrap"))}kbPaint()}
/* the marks: the school and its numbers, the card in the hand, and (when chosen) the key letters on the buttons */
const KB_HINTS=[["#bankslot .bankbar","B"],["#openEther","⇧B"],["#dipbar","Ctrl+B"],["#next","Space"],[".fabar .facfgb","⇧Space"],["#fstabSp","⇧F"],[".spellpanel>h3","F · ⇧F"],["#handh","G"],["#d4","R"],
  ["#logwrap>h3","L"],["#fsrowT","⇧L"],["#dicefold>summary","⇧L"],["#fsbtn","⇧⌫"],["#fspauseb","Esc"],[".camnote [data-cz='1']","E"],[".camnote [data-cz='-1']","Q"]];
function kbPaint(){
  document.querySelectorAll(".kbsch").forEach(e=>e.classList.remove("kbsch"));document.querySelectorAll("[data-kbn]").forEach(e=>e.removeAttribute("data-kbn"));
  document.querySelectorAll(".kbon,.kbli").forEach(e=>e.classList.remove("kbon","kbli"));
  kbBarPaint();
  if(KB.mode==="list"){const S=kbSchools();if(!S.length)KB.mode=null;else{KB.sc=Math.min(KB.sc,S.length-1);const s=S[KB.sc];s.el.classList.add("kbsch");
    s.items.forEach((b,i)=>b.setAttribute("data-kbn",kbNum(i)));KB.li=Math.min(KB.li|0,Math.max(0,s.items.length-1));if(s.items[KB.li])s.items[KB.li].classList.add("kbli")}}
  if(KB.mode==="hand"){const H=kbHand();if(!H.length)KB.mode=null;else{KB.h=Math.min(KB.h,H.length-1);H[KB.h].classList.add("kbon")}}
  document.querySelectorAll("[data-kb]").forEach(e=>{e.removeAttribute("data-kb");e.classList.remove("kbrel")});
  if(PREF.keyHints===true&&G)for(const [sel,k] of KB_HINTS)for(const el of document.querySelectorAll(sel)){if(!el.getClientRects().length)continue;el.setAttribute("data-kb",k);if(getComputedStyle(el).position==="static")el.classList.add("kbrel")}
  if(PREF.keyHints===true)document.querySelectorAll(".xclose").forEach(el=>{if(el.getClientRects().length)el.setAttribute("data-kb","X")})}
{const _r=render;render=function(){rSafe(_r,this,arguments);try{kbPaint()}catch(e){console.error(e)}}}
function kbHints(on){PREF.keyHints=!!on;savePrefs();kbPaint();for(const id of ["mKeyHints","fsKeyHints"]){const c=$("#"+id);if(c)c.checked=PREF.keyHints}flash(on?"Key letters on: each button shows its key. Shift+/ (?) hides them.":"Key letters off.")}
/* the log in fullscreen: its own window (the row at the bottom shows one line) */
function kbLog(){if(!fsOn()){const l=$("#logwrap");kbShow(l);return}
  let w=$("#kblog");if(!w){w=document.createElement("div");w.id="kblog";w.className="faov";document.body.appendChild(w)}
  w.innerHTML=`<div class="ovbox wide kblogbox" role="dialog" aria-modal="true" aria-labelledby="kblogh"><button type="button" class="xclose" aria-label="Close">×</button><h2 id="kblogh">Log</h2><ol class="kblog">${$("#log")?$("#log").innerHTML:""}</ol></div>`;
  w.hidden=false;w.querySelector(".xclose").onclick=()=>{w.hidden=true};w.onclick=e=>{if(e.target===w)w.hidden=true}}
function kbDice(){if(fsOn()){PREF.fsRow="dice";PREF.fsRowOpen=!PREF.fsRowOpen;savePrefs();fsPaint();return}const d=$("#dicefold");if(d){d.open=true;kbShow(d)}}
const kbDigit=e=>{const m=/^(?:Digit|Numpad)(\d)$/.exec(e.code);return m?(m[1]==="0"?10:+m[1]):0};
document.addEventListener("keyup",e=>{KB.held.delete(e.code)});addEventListener("blur",()=>{KB.held.clear();KB.alone=null});
/* Shift or Ctrl pressed alone (let go without another key or a click in between): the next or the previous section */
document.addEventListener("keydown",e=>{KB.alone=(e.key==="Shift"||e.key==="Control")&&!e.repeat?e.key:e.repeat&&KB.alone===e.key?KB.alone:null},true);
document.addEventListener("pointerdown",()=>{KB.alone=null},true);
document.addEventListener("keyup",e=>{const a=KB.alone;KB.alone=null;if(!a||e.key!==a||typing(e.target)||!G)return;
  if(KB.mode==="list"&&!kbTop())kbSchool(KB.sc+(a==="Control"?1:-1))});
document.addEventListener("keydown",e=>{if(KB.synth||e.defaultPrevented)return;KB.held.add(e.code);
  if(e.metaKey||e.altKey||typing(e.target))return;
  const k=e.key,lk=k.length===1?k.toLowerCase():k,sh=e.shiftKey,ct=e.ctrlKey,stop=()=>{e.preventDefault();e.stopImmediatePropagation()};
  if(G&&!G.over&&!/^(Shift|Control|Alt|Meta|CapsLock)$/.test(k))kbRemind();
  if(lk==="o"&&!sh&&!ct){stop();kbKeysWin();return}
  if(e.code==="Period"&&sh&&KB.held.has("KeyX")&&!ct){stop();if(typeof musicSync==="function"){PREF.music=PREF.music===false;savePrefs();musicSync();flash(PREF.music===false?"Music off.":"Music on.")}return}
  if(lk==="\\"&&!ct&&!sh){stop();rbWin();return}
  /* closing: X, and Esc for the windows that have no Esc of their own */
  if(lk==="x"&&!ct&&!sh){if(kbTop()){stop();kbClose();return}if(KB.mode){stop();KB.mode==="hand"?kbHandOn(false):kbOff()}return}   // the window on top first, then the spells or the hand
  if(k==="Escape"){const w=kbTop();
    if(w){if(w.matches("#ov,.faov,#menu")){const x=[...w.querySelectorAll(".xclose,[data-x],button[aria-label^='Close']")].find(b=>b.getClientRects().length);if(x){stop();x.click()}}return}   // the rest close on their own Esc
    if(KB.mode){stop();KB.mode==="hand"?kbHandOn(false):kbOff()}return}
  if(kbTop()||!G||G.passing)return;   // a window is open, or no game: the rest waits
  if(k==="Backspace"&&sh&&!ct){stop();fsOn()?fsExit():fsEnter();return}
  if(lk==="?"||e.code==="Slash"&&sh){stop();kbHints(PREF.keyHints!==true);return}
  if(ct&&!sh){
    if(lk==="b"){stop();const b=$("#dipbar");if(b)b.click();else flash("Diplomacy is off in this game.");return}
    if((lk==="c"||lk==="v")&&!(getSelection&&String(getSelection()).length)){stop();const V=view(),A=[];
      for(let r=0;r<G.rows;r++)for(let c=0;c<G.board[r].length;c++){const s=G.board[r][c];if(s&&s.owner===V&&hasBase(s))A.push([r,c])}
      if(!A.length){flash("You have no Ace on the field.");return}KB.ace=((KB.ace+(lk==="v"?1:-1))%A.length+A.length)%A.length;kbLook(...A[KB.ace]);return}
    if(e.code==="Digit1"){stop();if(G.sel)kbLook(G.sel.r,G.sel.c);else flash("Nothing is selected on the field.");return}
    return}
  if(ct)return;
  /* the spells */
  if(kbSpellMode()){const n=kbDigit(e);if(n){stop();kbCast(n+(sh?10:0));return}
    if(k==="Tab"){stop();if(KB.mode==="bar")kbSchool(KB.sc+(sh?-1:1));return}
    if((lk==="c"||lk==="v")&&sh){stop();const S=kbSchools();kbSchool(lk==="c"?0:S.length-1);return}
    if(lk==="c"||lk==="v"){stop();if(KB.mode==="bar")kbSchool(KB.sc+(lk==="v"?1:-1));else kbStep(lk==="v"?1:-1);return}
    if(k==="Enter"&&KB.mode==="list"){stop();const s=kbSchools()[KB.sc],b=s&&s.items[KB.li];if(b)b.click();return}}
  /* the hand */
  if(KB.mode==="hand"){const H=kbHand();
    if((lk==="c"||lk==="v")&&!sh){stop();if(H.length){KB.h=(KB.h+(lk==="v"?1:-1)+H.length)%H.length;kbPaint();H[KB.h].scrollIntoView({block:"nearest",inline:"nearest"})}return}
    if(k==="Enter"){stop();if(H[KB.h])H[KB.h].click();kbPaint();return}
    if(lk==="i"&&!sh){stop();const ci=H[KB.h]&&H[KB.h].querySelector(".ci");if(ci)ci.click();return}}
  if(sh&&!ct&&(k===" "||e.code==="Space")){stop();if(typeof faAllowed==="function"&&faAllowed())faWindow();else flash("Field Automation is off in this game.");return}
  if(sh){if(lk==="f"){stop();kbList();return}if(lk==="b"){stop();openEtherShop();return}if(lk==="l"){stop();kbDice();return}return}
  if(lk==="b"){stop();const b=$("#bankslot .bankbar");if(b)b.click();else openBank();return}
  if(lk==="f"){stop();kbBar();return}
  if(lk==="g"){stop();kbHandOn(true);return}
  if(lk==="r"){stop();const d=$("#d4");if(d&&!d.disabled)d.click();else flash("There is nothing to roll now: the draw is in your draw phase.");return}
  if(lk==="l"){stop();kbLog();return}
  if(k==="Backspace"||k==="Delete"){const P=G.p[view()],i=P&&G.selHand?P.hand.indexOf(G.selHand):-1;if(i<0)return;stop();
    const b=document.querySelector(`#hand [data-sh="${i}"]`);if(b)b.click();else flash("That card can't be sacrificed now.");return}
},true);
/* v78a: O shows every key in a window; once a game, the first key pressed brings a note saying so */
function kbKeysWin(){let w=$("#kbkeys");if(!w){w=document.createElement("div");w.id="kbkeys";w.className="faov";document.body.appendChild(w)}
  w.innerHTML=`<div class="ovbox wide kbkeysbox" role="dialog" aria-modal="true" aria-labelledby="kbkh"><button type="button" class="xclose" aria-label="Close">×</button><h2 id="kbkh">Keys</h2>${kbListHTML("kwKeyHints")}<p class="dim">The same list is in the pause menu and the Menu (Keyboard controls).</p></div>`;
  w.hidden=false;w.querySelector(".xclose").onclick=()=>{w.hidden=true};w.onclick=e=>{if(e.target===w)w.hidden=true};$("#kwKeyHints").onchange=e=>kbHints(e.target.checked)}
function kbRemind(){const g=G&&G.map?G.map.seed:null;if(g==null||KB.reminded===g)return;KB.reminded=g;
  let n=$("#kbremind");if(!n){n=document.createElement("div");n.id="kbremind";n.setAttribute("role","status");document.body.appendChild(n)}
  n.innerHTML=`Press <kbd>O</kbd> any time to see every key.`;n.hidden=false;clearTimeout(kbRemind.t);kbRemind.t=setTimeout(()=>{n.hidden=true},7000)}
/* v78a: Tab never leaves the game for the browser's own bar: where it means nothing, it does nothing */
document.addEventListener("keydown",e=>{if(e.key==="Tab")e.preventDefault()});
/* the list of keys: in the pause menu and the Menu, each in a fold like the others, with the key letters' switch */
const KB_LIST=[["Space","the turn button: Ready, the next phase, End turn"],["E · Q","zoom in · zoom out, around the middle of the screen"],["WASD","move the camera over the field; two at once go diagonally (Shift: faster)"],
  ["Arrow keys","the selector on the field (two at once: diagonally); the camera keeps it in the middle"],["Tab · Shift+Tab","along the row to your next · previous card"],
  ["Ctrl · Shift (pressed alone)","down · up to the next row with your cards"],["` (left of 1)","Tab, Ctrl and Shift step through the enemy's cards instead (again: yours)"],["N · Shift+N","the enemy's next · previous card"],
  ["Enter","on the selector: select, place, move or attack, as a click"],["M · 1","move there (or attack) · the default attack"],
  ["U H J K, or Alt+W A S D","the target of the stack you selected, a tile at a time (two at once: diagonally); then Enter or M"],
  ["Y","what you can do with what you selected, numbered: the number keys use it"],["Shift+Enter","the right-click menu of what is under the selector"],
  ["P · Shift+P","the other players' boxes: C and V read one, Enter its history"],["I","what stands on the tile under the selector"],
  ["F","the spell bar at the bottom: 1–9 and 0 cast the first ten of the school, Shift+1 to Shift+0 the next ten; C and V (or Tab) the school before and after, Shift+C the first, Shift+V the last (the piles); X closes"],
  ["Shift+F","the spell list: C and V move from spell to spell, Ctrl and Shift (alone) to the next and the previous school, Enter casts; X closes"],
  ["G","the hand: C and V move, Enter picks (again: lets go), I the card's info"],["Backspace or Delete","sacrifice the hand card you picked"],["R","roll the draw"],
  ["B · Shift+B · Ctrl+B","the Bank · the Ether · Diplomacy"],["Shift+Space","Field Automation's settings"],["L · Shift+L","the log · the dice"],["\\","the Rule book"],
  ["Ctrl+C · Ctrl+V","the camera to your Aces, back and forth"],["Ctrl+1","the camera to what you selected"],["X or Esc","close what is open (Esc with nothing open: the pause menu in fullscreen)"],
  ["In any window","C and V the item before and after, W A S D the nearest one up, left, down and right; Enter uses it; Tab the window's tabs; Ctrl and Shift (alone) the next and the previous section; I what the item does"],
  ["A slider, a list or a number","Enter, then W or D up and S or A down (Shift: ten), the number keys type a number; Enter keeps it, Esc puts it back"],
  ["A text field","Enter to type; Enter again (or Esc) when done"],["A line of a ranking","Enter takes hold: W or D up, S or A down, Space equal to the one above, Enter lets go"],
  ["O","every key, in a window"],["Shift+Backspace","fullscreen on and off"],["Shift+X+. (period)","the music on and off"],["Shift+/ (?)","show or hide the key letters on the buttons"]];
const kbListHTML=id=>`<ul class="mklist kblist">${KB_LIST.map(([a,b])=>`<li><kbd>${esc(a)}</kbd> ${esc(b)}</li>`).join("")}</ul><label class="farow"><span class="fal"><b>Key letters on the buttons</b><small>Each button shows its key. Shift+/ (?) switches them too.</small></span><input type="checkbox" id="${id}" ${PREF.keyHints===true?"checked":""}></label>`;
{const _fp=fsPause;fsPause=function(){_fp.apply(this,arguments);const o=$("#fspause"),box=o&&o.querySelector(".fspbox");if(!box||box.querySelector(".kbfold"))return;
  const d=document.createElement("details");d.className="sub kbfold";d.innerHTML=`<summary>Keyboard controls</summary>${kbListHTML("fsKeyHints")}`;
  const q=box.querySelector(".fsqlink");q?box.insertBefore(d,q):box.appendChild(d);$("#fsKeyHints").onchange=e=>kbHints(e.target.checked)}}
{const _om=openMenu;openMenu=function(){_om.apply(this,arguments);const m=$("#menu"),box=m&&m.querySelector(".ovbox");if(!box||box.querySelector(".kbfold"))return;
  const d=document.createElement("details");d.className="sub kbfold";d.innerHTML=`<summary>Keyboard controls</summary>${kbListHTML("mKeyHints")}`;
  const a=box.querySelector("#mCam")||box.querySelector(".maccess")||box.querySelector(".mgrid");if(a)a.after(d);else box.appendChild(d);$("#mKeyHints").onchange=e=>kbHints(e.target.checked)}}

if(window.__EC)Object.assign(window.__EC,{KB,kbClose:()=>kbClose(),kbSchools:()=>kbSchools()});
