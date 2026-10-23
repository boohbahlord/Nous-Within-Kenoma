/* ---------- v78b: the field by keys ----------
   - The arrow keys move a tile selector freely (two at once: diagonally); the camera keeps it in the middle.
   - Tab and Shift+Tab: along the row (as you see it) to your next and previous card, back to the row's first after its
     last. Ctrl pressed alone: down to the next row that holds your cards; Shift pressed alone: up to the previous one.
     ` (left of 1) switches these between your cards and the enemy's (a label says which). N and Shift+N step through the
     enemy's cards, row by row, either way.
   - Enter acts on the tile under the selector as a click does: it selects a stack, places the hand card you picked, and
     with a stack of yours selected, moves there or attacks it. M moves or attacks only; 1 is the default attack.
   - U H J K (up, left, down, right), or Alt+W A S D: the target of the stack you selected, one tile at a time away from it,
     drawn as an arrow; two at once go diagonally. Enter or M then moves there, or attacks.
   - Y: what you can do with what you selected (the Selected box: which cards move, sacrifice, ambush, siege, compare,
     Soft Automate, its right-click menu), numbered: the number keys use them.
   - Shift+Enter: the right-click menu of the stack under the selector (or of the hand card under the keys).
   - P and Shift+P: the other players' boxes, one after another; C and V go through what a box tells, Enter opens its
     history. X or Esc stops.
   - I: what stands on the tile under the selector.
   A stack selected by keys is brought to the middle of the camera. A click on the field hides the selector. */
const FK={on:false,cur:null,tgt:null,foe:false,pm:false,p:0,pi:0,dir:null,tdir:null,t:0,tt:0};
const fkTile=(r,c)=>document.querySelector(`#board .tile[data-r="${r}"][data-c="${c}"]`);
function fkGrid(){return [...document.querySelectorAll("#board>.row")].map(row=>[...row.querySelectorAll(":scope>.tile")].map(t=>t.dataset.r!=null?{r:+t.dataset.r,c:+t.dataset.c}:null))}
function fkAt(grid,r,c){for(let i=0;i<grid.length;i++){const j=grid[i].findIndex(x=>x&&x.r===r&&x.c===c);if(j>=0)return [i,j]}return null}
/* the camera on a tile: the large map's frame keeps it in the middle; a small field just keeps it in sight */
function fkCenter(r,c){const t=fkTile(r,c);if(!t)return;const w=camWrap();
  if(w&&isLarge()){const [mx,my]=camMid(w),q=t.getBoundingClientRect();w.scrollLeft+=q.left+q.width/2-mx;w.scrollTop+=q.top+q.height/2-my;if(!fsOn())w.scrollIntoView({block:"nearest"})}
  else t.scrollIntoView({block:"nearest",inline:"nearest"})}
function fkSet(r,c){FK.on=true;FK.cur={r,c};fkCenter(r,c);fkPaint()}
const fkMine=st=>st.owner===view(),fkFoe=st=>isEnemy(st.owner,view());
/* the cards Tab, Ctrl and Shift step through, by row and column as seen */
function fkCands(foe){const grid=fkGrid(),V=view(),out=[];
  grid.forEach((row,i)=>row.forEach((x,j)=>{if(!x||hiddenFrom(V,x.r,x.c))return;const st=G.board[x.r][x.c];if(st&&(foe?fkFoe(st):fkMine(st)))out.push({i,j,r:x.r,c:x.c})}));
  return out}
function fkHere(){const grid=fkGrid();const p=FK.cur&&fkAt(grid,FK.cur.r,FK.cur.c);return p||[-1,-1]}
function fkRowStep(d){const C=fkCands(FK.foe);if(!C.length){flash(FK.foe?"No enemy card in sight.":"You have no card on the field.");return}
  const [i,j]=fkHere(),row=C.filter(x=>x.i===i).sort((a,b)=>a.j-b.j);
  if(!row.length){const n=C.filter(x=>x.i>=i)[0]||C[0];fkSet(n.r,n.c);return}
  const k=row.findIndex(x=>x.j===j),n=d>0?(row.find(x=>x.j>j)||row[0]):([...row].reverse().find(x=>x.j<j)||row[row.length-1]);
  if(k<0&&d<0){fkSet(row[row.length-1].r,row[row.length-1].c);return}fkSet(n.r,n.c)}
function fkColStep(d){const C=fkCands(FK.foe);if(!C.length)return;const [i,j]=fkHere(),rows=[...new Set(C.map(x=>x.i))].sort((a,b)=>a-b);
  const ni=d>0?(rows.find(x=>x>i)??rows[0]):([...rows].reverse().find(x=>x<i)??rows[rows.length-1]);
  const n=C.filter(x=>x.i===ni).sort((a,b)=>Math.abs(a.j-j)-Math.abs(b.j-j))[0];if(n)fkSet(n.r,n.c)}
function fkFoeStep(d){const C=fkCands(true);if(!C.length){flash("No enemy card in sight.");return}const [i,j]=fkHere(),at=i*1e4+j;
  const n=d>0?(C.find(x=>x.i*1e4+x.j>at)||C[0]):([...C].reverse().find(x=>x.i*1e4+x.j<at)||C[C.length-1]);fkSet(n.r,n.c)}
/* the selector moves by the grid as seen: over holes to the next tile there is, never off the field */
function fkMove(di,dj,from){const grid=fkGrid();if(!grid.length)return null;let p=from&&fkAt(grid,from.r,from.c);
  if(!p){const s=G.sel||{r:-1,c:-1};p=fkAt(grid,s.r,s.c)||[Math.floor(grid.length/2),Math.floor(grid[0].length/2)]}
  let [i,j]=p;for(;;){i+=di;j+=dj;if(i<0||j<0||i>=grid.length||j>=grid[i].length)return null;const x=grid[i][j];if(x)return x}}
/* the directions of the selector's and the target's actions: [row, column] */
const FK_SEL={selUp:[-1,0],selDown:[1,0],selLeft:[0,-1],selRight:[0,1]},FK_AIM={aimUp:[-1,0],aimDown:[1,0],aimLeft:[0,-1],aimRight:[0,1]};
/* keys pressed together (within a moment), or one held while another is pressed, make one diagonal step */
function fkSum(map,pressed){let di=0,dj=0;for(const id of new Set([...pressed,...kmHeldOf(Object.keys(map))])){di+=map[id][0];dj+=map[id][1]}return [Math.sign(di),Math.sign(dj)]}
function fkArrow(id){FK.dir=FK.dir||new Set();FK.dir.add(id);if(FK.t)return;FK.t=setTimeout(()=>{const [di,dj]=fkSum(FK_SEL,FK.dir);FK.dir=null;FK.t=0;
  if(!di&&!dj)return;const x=fkMove(di,dj,FK.cur);if(x){FK.tgt=null;fkSet(x.r,x.c)}},45)}
function fkAim(id){if(!G.sel){flash(`Select a stack first: ${kmShow("act")} on it, or a click.`);return}FK.tdir=FK.tdir||new Set();FK.tdir.add(id);if(FK.tt)return;
  FK.tt=setTimeout(()=>{const [di,dj]=fkSum(FK_AIM,FK.tdir);FK.tdir=null;FK.tt=0;if(!di&&!dj||!G.sel)return;const x=fkMove(di,dj,FK.tgt||G.sel);if(!x)return;FK.tgt={r:x.r,c:x.c};fkSet(x.r,x.c)},45)}
const fkIn=(list,p)=>!!p&&list.some(([a,b])=>a===p.r&&b===p.c);
/* Enter, M and 1 on the selector */
function fkAct(how){const p=FK.tgt||FK.cur;if(!p)return;const live=canAct(),s=G.sel;
  if(live&&s&&(s.r!==p.r||s.c!==p.c)){
    if(G.phase==="attack"&&fkIn(attackTargets(),p)){G.mode="attack";FK.tgt=null;tileClick(p.r,p.c);return}
    if(how!=="atk"&&G.phase==="prep"&&fkIn(moveTargets(),p)){G.mode="move";FK.tgt=null;tileClick(p.r,p.c);fkFollow();return}}
  if(how==="atk"){flash(s?"No attack on that tile.":"Select a stack of yours first.");return}
  if(how==="move"){flash(s?"It can't go there.":"Select a stack of yours first.");return}
  FK.tgt=null;tileClick(p.r,p.c);fkFollow()}
function fkFollow(){if(G.sel){FK.cur={r:G.sel.r,c:G.sel.c};fkCenter(G.sel.r,G.sel.c)}fkPaint()}
/* Y: the actions of what you selected, numbered */
function fkActItems(){const box=$("#selbox");if(!box)return [];return [...box.querySelectorAll("button,input[type=checkbox],summary")].filter(e=>e.getClientRects().length&&!e.disabled)}
const fkLabel=e=>{if(e.matches("input"))return (e.checked?"☑ ":"☐ ")+(e.getAttribute("aria-label")||(e.closest("label,li")||e).textContent).trim().replace(/\s+/g," ").slice(0,70);
  return (e.textContent.trim()||e.getAttribute("aria-label")||e.title||"").replace(/\s+/g," ").slice(0,70)};
function fkActs(){if(!G.sel&&!G.selHand){flash("Select a stack or a hand card first.");return}let w=$("#kbacts");
  if(!w){w=document.createElement("div");w.id="kbacts";w.className="faov";document.body.appendChild(w)}
  const L=fkActItems(),num=i=>i<9?String(i+1):i===9?"0":i<19?"⇧"+(i-9):i===19?"⇧0":"";
  w.innerHTML=`<div class="ovbox kbactbox" role="dialog" aria-modal="true" aria-labelledby="kbah"><button type="button" class="xclose" aria-label="Close">×</button><h2 id="kbah">Actions</h2>
<ol class="kbacts">${L.map((e,i)=>`<li><button type="button" data-ka="${i}"><kbd>${num(i)}</kbd> ${esc(fkLabel(e))}</button></li>`).join("")}<li><button type="button" data-ka="rc"><kbd>${esc(kmShort(kmBinds("menu").filter(Boolean)[0]||""))}</kbd> Its right-click menu</button></li></ol>
<p class="dim">The number keys use them (Shift+1 for the eleventh). ${esc(kmShow("close"))} closes.</p></div>`;w.hidden=false;
  w.querySelector(".xclose").onclick=()=>{w.hidden=true};w.onclick=e=>{if(e.target===w)w.hidden=true};
  w.querySelectorAll("[data-ka]").forEach(b=>b.onclick=()=>fkActUse(b.dataset.ka))}
function fkActUse(k){const w=$("#kbacts");if(k==="rc"){if(w)w.hidden=true;fkMenu();return}const e=fkActItems()[+k];if(!e){flash("Nothing there.");return}e.click();setTimeout(()=>{if(w&&!w.hidden&&(G.sel||G.selHand))fkActs();else if(w)w.hidden=true},60)}
/* Shift+Enter: the right-click menu */
function fkMenu(){let el=null;if(KB.mode==="hand"){el=kbHand()[KB.h]}else{const p=FK.cur||G.sel;if(p)el=fkTile(p.r,p.c);if(!el&&G.selHand){const i=G.p[view()].hand.indexOf(G.selHand);el=document.querySelector(`#hand [data-h="${i}"]`)}}
  if(!el){flash("Nothing under the selector.");return}const q=el.getBoundingClientRect(),x=q.left+q.width/2,y=q.top+q.height/2;
  const t=el.querySelector(".stack")||el;t.dispatchEvent(new MouseEvent("contextmenu",{bubbles:true,cancelable:true,clientX:x,clientY:y,view:window}))}
/* P: the other players' boxes */
const fkBoxes=()=>[...document.querySelectorAll(fsOn()?".fsfoe":"#foe>.pbox,#foe>div[style*='--pc']")].filter(e=>e.getClientRects().length);
function fkPlayers(d){const B=fkBoxes();if(!B.length){flash("No other player's box to read.");return}FK.pm=true;FK.p=FK.pm&&FK.p!=null?((FK.p+d)%B.length+B.length)%B.length:0;FK.pi=-1;fkPaint();
  B[FK.p].scrollIntoView({block:"nearest"});
  wkNote(`${B[FK.p].getAttribute("title")||B[FK.p].textContent.trim().split(/\s{2,}|\n/)[0].slice(0,60)} · C and V read the box, Enter its history, ${kmShow("plNext")} the next player, ${kmShow("close")} stops`)}
function fkPart(d){const b=fkBoxes()[FK.p];if(!b)return;const parts=[...b.children].filter(e=>e.getClientRects().length&&e.textContent.trim());if(!parts.length)return;
  FK.pi=((FK.pi+d)%parts.length+parts.length)%parts.length;fkPaint();const e=parts[FK.pi];
  wkNote((e.getAttribute("title")?e.getAttribute("title")+" · ":"")+e.textContent.trim().replace(/\s+/g," ").slice(0,160))}
function fkPlayersOff(){FK.pm=false;wkNote("");fkPaint()}
/* the marks: the selector, the arrow to the target, a player's box; the label of what Tab steps through */
function fkPaint(){document.querySelectorAll(".kbcur,.kbpl,.kbplp").forEach(e=>e.classList.remove("kbcur","kbpl","kbplp"));const old=$("#fkarrow");if(old)old.remove();
  let lab=$("#fkmode");
  if(FK.pm){const b=fkBoxes()[FK.p];if(b){b.classList.add("kbpl");const parts=[...b.children].filter(e=>e.getClientRects().length&&e.textContent.trim());if(parts[FK.pi])parts[FK.pi].classList.add("kbplp")}}
  if(!FK.on||!G||!FK.cur){if(lab)lab.hidden=true;return}
  const t=fkTile(FK.cur.r,FK.cur.c);if(t)t.classList.add("kbcur");
  if(!lab){lab=document.createElement("div");lab.id="fkmode";lab.setAttribute("aria-live","polite");document.body.appendChild(lab)}
  lab.hidden=false;
  lab.innerHTML=`${esc(kmShow("rowNext"))} steps through: <b>${FK.foe?"the enemy's cards":"your cards"}</b> <kbd>${esc(kmShow("foeSwap"))}</kbd> switches`;
  if(FK.tgt&&G.sel){const B=$("#board"),a=fkTile(G.sel.r,G.sel.c),b=fkTile(FK.tgt.r,FK.tgt.c);if(!B||!a||!b)return;const br=B.getBoundingClientRect(),ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect();
    const x1=ra.left+ra.width/2-br.left,y1=ra.top+ra.height/2-br.top,x2=rb.left+rb.width/2-br.left,y2=rb.top+rb.height/2-br.top;
    B.insertAdjacentHTML("beforeend",`<svg id="fkarrow" aria-hidden="true" width="${Math.ceil(br.width)}" height="${Math.ceil(br.height)}"><defs><marker id="fkhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0L10,5L0,10z" fill="#f1d27a"/></marker></defs><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f1d27a" stroke-width="4" stroke-linecap="round" marker-end="url(#fkhead)"/></svg>`)}}
{const _r=render;render=function(){rSafe(_r,this,arguments);if(FK.on||FK.pm)try{fkPaint()}catch(e){console.error(e)}}}
{const _z=camZoom;camZoom=function(){const out=_z.apply(this,arguments);if(FK.on)fkPaint();return out}}
document.addEventListener("pointerdown",e=>{if(FK.on&&e.target.closest&&e.target.closest("#board")){FK.on=false;FK.tgt=null;fkPaint()}},true);
/* the keys (as bound: the table's field keys in 96c_keymap.js) */
addEventListener("keydown",e=>{if(KB.synth||typing(e.target)||!G||G.passing)return;const is=id=>kmIs(e,id),stop=()=>{e.preventDefault();e.stopImmediatePropagation()},top=kbTop();
  const plain=!e.ctrlKey&&!e.altKey&&!e.metaKey;
  if(top){if(top.id==="kbacts"&&plain){const n=kbDigit(e);if(n){stop();fkActUse(String(n-1+(e.shiftKey?10:0)))}}return}   // a window: its own keys (98_winkeys.js)
  if(FK.pm){if(is("plNext")||is("plPrev")){stop();fkPlayers(is("plNext")?1:-1);return}
    const n=kmName(e.code,e.key);if(plain&&!e.shiftKey&&(n==="C"||n==="V")){stop();fkPart(n==="V"?1:-1);return}
    if(plain&&!e.shiftKey&&n==="Enter"){stop();const b=fkBoxes()[FK.p],h=b&&b.querySelector("[data-hist]");if(h)h.click();return}
    if(is("close")||e.key==="Escape"){stop();fkPlayersOff();return}}
  if(KB.mode&&(kmIn(e,KB.mode==="hand"?"hand":"spell")||kbSpellMode()&&kbDigit(e)||is("close")||e.key==="Escape"))return;   // the spells and the hand keep their keys
  const sel=Object.keys(FK_SEL).find(is);if(sel){stop();fkArrow(sel);return}
  const aim=Object.keys(FK_AIM).find(is);if(aim){stop();fkAim(aim);return}
  if(is("menu")){stop();fkMenu();return}
  if(is("rowNext")||is("rowPrev")){stop();FK.on=true;fkRowStep(is("rowNext")?1:-1);return}
  if(is("foeSwap")){stop();FK.foe=!FK.foe;FK.on=true;if(!FK.cur)fkRowStep(1);else fkPaint();return}
  if(is("foeNext")||is("foePrev")){stop();fkFoeStep(is("foeNext")?1:-1);return}
  if(is("plNext")||is("plPrev")){stop();fkPlayers(is("plNext")?1:-1);return}
  if(is("acts")){stop();fkActs();return}
  if(FK.on&&(is("rowDown")||is("rowUp"))){stop();fkColStep(is("rowDown")?1:-1);return}   // bound to a key (alone, Ctrl and Shift act on letting go)
  if(!FK.on||!FK.cur)return;   // the rest acts on the selector, once the keys have put it on the field
  if(is("act")){stop();fkAct("any");return}
  if(is("move")){stop();fkAct("move");return}
  if(is("attack")){stop();fkAct("atk");return}
  if(is("info")){stop();const t=fkTile(FK.cur.r,FK.cur.c);flash(t?t.getAttribute("aria-label")||"":"");return}
},true);
/* Ctrl or Shift pressed alone on the field (as bound): the next row down or up (only once the keys are on the field) */
addEventListener("keyup",e=>{if(typing(e.target)||!G||!FK.on||KB.mode||kbTop())return;if(kmTap(e,"rowDown"))fkColStep(1);else if(kmTap(e,"rowUp"))fkColStep(-1)},true);

if(window.__EC)Object.assign(window.__EC,{FK,fkCands:f=>fkCands(f)});
