/* ---------- v77b: the keyboard ----------
   Shortcuts that work in fullscreen and out of it (outside it the page scrolls to what they open). Not while typing. While a
   window is open only X and Esc work (they close it: its × if it has one).
   - B the Bank · Shift+B the Ether · Ctrl+B Diplomacy · R rolls the draw · Space the turn button · Shift+Space Field
     Automation's settings · L the log · Shift+L the dice · \ the Rule book · Shift+Backspace fullscreen on and off ·
     Backspace or Delete sacrifices the hand card you picked · Ctrl+C and Ctrl+V move the camera to your Aces, back and
     forth · Ctrl+1 to what you selected on the field · Shift+X+. (period) the music on and off · Shift+/ (?) the key letters.
   - F opens the spells (in fullscreen, their drawer): 1 to 9 and 0 cast the first ten of the school shown, Shift+1 to
     Shift+0 the next ten; C and V the school before and after, Shift+C the first, Shift+V the last (the piles: the Grave,
     the Ether, the Outer Darkness, the Auction). While the spells are open the number keys are theirs. X closes them.
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
function kbSpells(on){const fs=fsOn();
  if(!on){KB.mode=null;if(fs&&PREF.fsSp){const t=$("#fstabSp");if(t)t.click()}kbPaint();return}
  KB.mode="spells";if(fs){if(!PREF.fsSp){const t=$("#fstabSp");if(t)t.click()}}else kbShow($(".spellpanel"));kbPaint()}
function kbSchool(i){const S=kbSchools();if(!S.length)return;KB.sc=Math.max(0,Math.min(S.length-1,i));const s=S[KB.sc];if(s.el.tagName==="DETAILS"&&!s.el.open)s.el.open=true;
  kbPaint();s.el.scrollIntoView({block:"nearest",behavior:"smooth"})}
function kbCast(n){const S=kbSchools(),s=S[KB.sc];if(!s)return;const b=s.items[n-1];if(!b){flash(`${s.piles?"The piles have":"This school has"} no ${n}${n===1?"st":n===2?"nd":n===3?"rd":"th"} entry.`);return}b.click()}
/* the hand */
const kbHand=()=>[...document.querySelectorAll("#hand [data-h]")];
function kbHandOn(on){KB.mode=on?"hand":null;if(on){const H=kbHand();KB.h=Math.max(0,Math.min(H.length-1,KB.h));kbShow($("#handwrap"))}kbPaint()}
/* the marks: the school and its numbers, the card in the hand, and (when chosen) the key letters on the buttons */
const KB_HINTS=[["#bankslot .bankbar","B"],["#openEther","⇧B"],["#dipbar","Ctrl+B"],["#next","Space"],[".fabar .facfgb","⇧Space"],["#fstabSp","F"],[".spellpanel>h3","F"],["#handh","G"],["#d4","R"],
  ["#logwrap>h3","L"],["#fsrowT","⇧L"],["#dicefold>summary","⇧L"],["#fsbtn","⇧⌫"],["#fspauseb","Esc"],[".camnote [data-cz='1']","E"],[".camnote [data-cz='-1']","Q"]];
function kbPaint(){
  document.querySelectorAll(".kbsch").forEach(e=>e.classList.remove("kbsch"));document.querySelectorAll("[data-kbn]").forEach(e=>e.removeAttribute("data-kbn"));
  document.querySelectorAll(".kbon").forEach(e=>e.classList.remove("kbon"));
  if(KB.mode==="spells"){const S=kbSchools();if(!S.length)KB.mode=null;else{KB.sc=Math.min(KB.sc,S.length-1);const s=S[KB.sc];s.el.classList.add("kbsch");
    s.items.forEach((b,i)=>b.setAttribute("data-kbn",i<9?String(i+1):i===9?"0":i<19?"⇧"+(i-9):i===19?"⇧0":""))}}
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
document.addEventListener("keyup",e=>{KB.held.delete(e.code)});addEventListener("blur",()=>KB.held.clear());
document.addEventListener("keydown",e=>{if(KB.synth||e.defaultPrevented)return;KB.held.add(e.code);
  if(e.metaKey||e.altKey||typing(e.target))return;
  const k=e.key,lk=k.length===1?k.toLowerCase():k,sh=e.shiftKey,ct=e.ctrlKey,stop=()=>{e.preventDefault();e.stopImmediatePropagation()};
  if(e.code==="Period"&&sh&&KB.held.has("KeyX")&&!ct){stop();if(typeof musicSync==="function"){PREF.music=PREF.music===false;savePrefs();musicSync();flash(PREF.music===false?"Music off.":"Music on.")}return}
  if(lk==="\\"&&!ct&&!sh){stop();rbWin();return}
  /* closing: X, and Esc for the windows that have no Esc of their own */
  if(lk==="x"&&!ct&&!sh){if(kbTop()){stop();kbClose();return}if(KB.mode){stop();KB.mode==="spells"?kbSpells(false):kbHandOn(false)}return}   // the window on top first, then the spells or the hand
  if(k==="Escape"){const w=kbTop();
    if(w){if(w.matches("#ov,.faov,#menu")){const x=[...w.querySelectorAll(".xclose,[data-x],button[aria-label^='Close']")].find(b=>b.getClientRects().length);if(x){stop();x.click()}}return}   // the rest close on their own Esc
    if(KB.mode){stop();KB.mode==="spells"?kbSpells(false):kbHandOn(false)}return}
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
  if(KB.mode==="spells"){const n=kbDigit(e);if(n){stop();kbCast(n+(sh?10:0));return}
    if(lk==="c"||lk==="v"){stop();const S=kbSchools();kbSchool(sh?(lk==="c"?0:S.length-1):KB.sc+(lk==="v"?1:-1));return}}
  /* the hand */
  if(KB.mode==="hand"){const H=kbHand();
    if((lk==="c"||lk==="v")&&!sh){stop();if(H.length){KB.h=(KB.h+(lk==="v"?1:-1)+H.length)%H.length;kbPaint();H[KB.h].scrollIntoView({block:"nearest",inline:"nearest"})}return}
    if(k==="Enter"){stop();if(H[KB.h])H[KB.h].click();kbPaint();return}
    if(lk==="i"&&!sh){stop();const ci=H[KB.h]&&H[KB.h].querySelector(".ci");if(ci)ci.click();return}}
  if(sh&&!ct&&(k===" "||e.code==="Space")){stop();if(typeof faAllowed==="function"&&faAllowed())faWindow();else flash("Field Automation is off in this game.");return}
  if(sh){if(lk==="b"){stop();openEtherShop();return}if(lk==="l"){stop();kbDice();return}return}
  if(lk==="b"){stop();const b=$("#bankslot .bankbar");if(b)b.click();else openBank();return}
  if(lk==="f"){stop();kbSpells(true);return}
  if(lk==="g"){stop();kbHandOn(true);return}
  if(lk==="r"){stop();const d=$("#d4");if(d&&!d.disabled)d.click();else flash("There is nothing to roll now: the draw is in your draw phase.");return}
  if(lk==="l"){stop();kbLog();return}
  if(k==="Backspace"||k==="Delete"){const P=G.p[view()],i=P&&G.selHand?P.hand.indexOf(G.selHand):-1;if(i<0)return;stop();
    const b=document.querySelector(`#hand [data-sh="${i}"]`);if(b)b.click();else flash("That card can't be sacrificed now.");return}
},true);
/* the list of keys: in the pause menu and the Menu, each in a fold like the others, with the key letters' switch */
const KB_LIST=[["Space","the turn button: Ready, the next phase, End turn"],["E · Q","zoom in · zoom out, around the middle of the screen"],["WASD or the arrow keys","move the field; two at once go diagonally (Shift: faster)"],
  ["F","the spells: 1–9 and 0 cast the first ten of the school, Shift+1 to Shift+0 the next ten; C and V the school before and after, Shift+C the first, Shift+V the last (the piles); X closes"],
  ["G","the hand: C and V move, Enter picks (again: lets go), I the card's info"],["Backspace or Delete","sacrifice the hand card you picked"],["R","roll the draw"],
  ["B · Shift+B · Ctrl+B","the Bank · the Ether · Diplomacy"],["Shift+Space","Field Automation's settings"],["L · Shift+L","the log · the dice"],["\\","the Rule book"],
  ["Ctrl+C · Ctrl+V","the camera to your Aces, back and forth"],["Ctrl+1","the camera to what you selected"],["X or Esc","close what is open (Esc with nothing open: the pause menu in fullscreen)"],
  ["Shift+Backspace","fullscreen on and off"],["Shift+X+. (period)","the music on and off"],["Shift+/ (?)","show or hide the key letters on the buttons"]];
const kbListHTML=id=>`<ul class="mklist kblist">${KB_LIST.map(([a,b])=>`<li><kbd>${esc(a)}</kbd> ${esc(b)}</li>`).join("")}</ul><label class="farow"><span class="fal"><b>Key letters on the buttons</b><small>Each button shows its key. Shift+/ (?) switches them too.</small></span><input type="checkbox" id="${id}" ${PREF.keyHints===true?"checked":""}></label>`;
{const _fp=fsPause;fsPause=function(){_fp.apply(this,arguments);const o=$("#fspause"),box=o&&o.querySelector(".fspbox");if(!box||box.querySelector(".kbfold"))return;
  const d=document.createElement("details");d.className="sub kbfold";d.innerHTML=`<summary>Keyboard controls</summary>${kbListHTML("fsKeyHints")}`;
  const q=box.querySelector(".fsqlink");q?box.insertBefore(d,q):box.appendChild(d);$("#fsKeyHints").onchange=e=>kbHints(e.target.checked)}}
{const _om=openMenu;openMenu=function(){_om.apply(this,arguments);const m=$("#menu"),box=m&&m.querySelector(".ovbox");if(!box||box.querySelector(".kbfold"))return;
  const d=document.createElement("details");d.className="sub kbfold";d.innerHTML=`<summary>Keyboard controls</summary>${kbListHTML("mKeyHints")}`;
  const a=box.querySelector("#mCam")||box.querySelector(".maccess")||box.querySelector(".mgrid");if(a)a.after(d);else box.appendChild(d);$("#mKeyHints").onchange=e=>kbHints(e.target.checked)}}

if(window.__EC)Object.assign(window.__EC,{KB,kbClose:()=>kbClose(),kbSchools:()=>kbSchools()});
