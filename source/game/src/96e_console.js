/* ---------- v78f: the command line (and the chat, online) ----------
   T opens it (or the chat, whichever you used last); Shift+T opens the other one. It sits at the bottom of the screen, with
   a faint note above it: Esc closes; so do the commands "close" and "x".
   - As you type, suggestions show above it: the commands, your stacks' tiles when a tile is wanted, then where the
     stack can go (moves, attacks, the eight directions), the hand cards to place and where, the spells to cast. Tab puts
     the highlighted one in; Tab again (or ↑ and ↓) goes through them; Enter runs the line (after ↑ or ↓: the highlighted
     one). With nothing typed it offers the lines you ran last.
   - A tile alone (B2) selects what stands there (in setup: places your Ace there). B2 C3 moves there, or attacks it in
     your attack phase; B2 up left steps one tile that way; attack B2 C3 2 attacks with its second way; place 5♠ B1;
     cast Lightning Strike; end; roll; the windows by name; auto on|off; guard, area, squad, lead, leave (the Field
     Automation groups); advance and retreat (a step toward the nearest enemy, or back toward your base); hold (lock in
     place); ambush; look; info; chat (online). "help" lists them all.
   - In the chat, a line that starts with / runs as a command. */
const CN={open:false,mode:"cmd",sugs:[],sel:0,frozen:false,nav:false,hist:[]};
const CN_DIRS=[["up",[-1,0]],["down",[1,0]],["left",[0,-1]],["right",[0,1]],["up left",[-1,-1]],["up right",[-1,1]],["down left",[1,-1]],["down right",[1,1]]];
const CN_DIRALIAS={u:"up",d:"down",l:"left",r:"right",ul:"up left",ur:"up right",dl:"down left",dr:"down right",upleft:"up left",upright:"up right",downleft:"down left",downright:"down right",
  n:"up",s:"down",w:"left",e:"right",nw:"up left",ne:"up right",sw:"down left",se:"down right",north:"up",south:"down",west:"left",east:"right"};
/* [name, what it does (for help and the suggestions), what it takes] */
const CN_CMDS=[
  ["help","every command"],["close","close the command line (x too)"],
  ["select","select what stands on a tile: select B2, or just B2","tile"],
  ["move","move a stack: move B2 C3, or B2 C3, or B2 up left","from to"],
  ["attack","attack: attack B2 C3; attack B2 C3 2 uses its second way","from atk n"],
  ["place","place a hand card: place 5♠ B1","card spot"],
  ["cast","cast a spell: cast Lightning Strike","spell"],
  ["end","the turn button: Ready, the next phase, End turn"],["roll","roll the draw"],
  ["bank","the Bank"],["ether","the Ether"],["diplomacy","Diplomacy"],["log","the log"],["dice","the dice"],["rules","the Rule book"],["keys","every key"],["menu","the settings"],["fullscreen","fullscreen on and off"],
  ["auto","Field Automation: auto on, auto off","onoff"],
  ["guard","B2 guards the stack on A1: guard B2 A1","mine mine"],["area","B2 guards the area around C4: area B2 C4","mine tile"],["squad","a squadron: squad B2 C2 D2","mine+"],
  ["lead","B2 leads its squadron: lead B2","mine"],["leave","B2 leaves its group: leave B2","mine"],
  ["advance","a step toward the nearest enemy: advance B2","mine"],["retreat","a step back toward your base: retreat B2","mine"],
  ["hold","lock in place (Field Automation leaves it): hold B2","mine"],["ambush","set a stack in ambush (or out of it): ambush B2","mine"],
  ["look","the camera to a tile: look B2","tile"],["info","what stands on a tile: info B2","tile"],["chat","say something to the table (online): chat hello","text"]];
const CN_ALIAS={x:"close",exit:"close",quit:"close","?":"help",next:"end",ready:"end",sel:"select",go:"move",m:"move",a:"attack",p:"place",c:"cast",spell:"cast",
  dip:"diplomacy",rulebook:"rules",settings:"menu",fs:"fullscreen",say:"chat",squadron:"squad",lock:"hold",fwd:"advance",forward:"advance",back:"retreat",fallback:"retreat"};
const cnCmd=w=>{const k=String(w||"").toLowerCase();return CN_CMDS.find(c=>c[0]===k)?k:CN_ALIAS[k]||null};

/* ---------- tiles, cards and spells by name ---------- */
function cnTile(w){const m=/^([a-z])(\d{1,2})$/i.exec(String(w||""));if(!m||!G)return null;const c=m[1].toUpperCase().charCodeAt(0)-65,r=G.rows-+m[2];
  return r>=0&&r<G.rows&&c>=0&&c<G.board[r].length&&!isVoid(r,c)?{r,c}:null}
const cnName=(r,c)=>coord(r,c);
const cnStackHint=st=>{if(!st)return "empty";const cards=st.cards.filter(x=>!isBase(x)).sort((a,b)=>rate(b)-rate(a));const head=hasBase(st)?"Ace base":cards[0]?short(cards[0]):"";
  return head+(cards.length>(hasBase(st)?0:1)?` +${cards.length-(hasBase(st)?0:1)}`:"")};
const cnMine=()=>stacksOf(view()).filter(o=>!hiddenFrom(view(),o.r,o.c));
const cnCardKey=x=>short(x).replace(/\s+/g,"").toLowerCase();
/* the card in your hand a word names: 5♠, 5s, 5S, j♦, joker, scout… */
function cnHandCard(w){const P=G&&G.p[view()];if(!P||!w)return null;const k=String(w).toLowerCase().replace(/♠/g,"s").replace(/♥/g,"h").replace(/♦/g,"d").replace(/♣/g,"c");
  const key=x=>cnCardKey(x).replace(/♠/g,"s").replace(/♥/g,"h").replace(/♦/g,"d").replace(/♣/g,"c");
  return P.hand.find(x=>key(x)===k)||P.hand.find(x=>nameOf(x).toLowerCase()===k)||P.hand.find(x=>key(x).startsWith(k))||null}
const cnSpells=()=>[...document.querySelectorAll("#spells button.spell")].map(b=>{const sn=b.querySelector(".sn"),c=sn?sn.cloneNode(true):b.cloneNode(true);c.querySelectorAll("small,.bolts,.chips,i,em").forEach(x=>x.remove());
  return {b,name:c.textContent.replace(/\s+/g," ").trim(),off:b.classList.contains("off")||b.disabled}}).filter(s=>s.name);
/* where a stack can go and what it can hit, now */
function cnTargets(r,c){if(!G||!canAct())return {move:[],atk:[]};const was=G.sel,wm=G.mode;const st=G.board[r][c];if(!st||st.owner!==view())return {move:[],atk:[]};
  try{tileSel(r,c);return {move:G.phase==="prep"?moveTargets():[],atk:G.phase==="attack"?attackTargets():[]}}finally{G.sel=was;G.mode=wm}}
/* select a stack the way a click does (without moving the one selected before) */
function tileSel(r,c){const st=G.board[r][c];if(!st)return;let pk=st.cards.filter(x=>!isBase(x)&&!(hasBase(st)&&(x.unit==="miner"||x.unit==="repair")));
  if(hasBase(st)&&pk.length&&!stackLegal(pk)){const g=[];for(const x of [...pk].sort((a,b)=>rate(b)-rate(a)))if(stackLegal([...g,x]))g.push(x);if(g.length)pk=g}
  G.sel={r,c,pick:new Set(pk.map(x=>x.id))};G.mode=autoMode(st)}
/* the visual neighbour in a direction (as the field is drawn: up is up on your screen) */
const cnStep=(r,c,d)=>{const x=fkMove(d[0],d[1],{r,c});return x?{r:x.r,c:x.c}:null};

/* ---------- suggestions ---------- */
function cnSuggest(text){const t=text.replace(/^\s+/,""),parts=t.split(/\s+/),last=parts[parts.length-1]||"",words=parts.slice(0,-1),lc=last.toLowerCase(),out=[];
  const add=(full,label,hint,final)=>{if(out.length<40)out.push({text:full,label,hint:hint||"",final:!!final})};
  const pre=words.length?words.join(" ")+" ":"";
  if(!t){for(const h of CN.hist.slice(-6).reverse())add(h,h,"run again",true);if(!CN.hist.includes("help"))add("help","help","every command",true);return out}
  if(CN.mode==="chat"&&!t.startsWith("/"))return out;
  const mine=cnMine(),tileSug=(list,final,hintOf)=>{for(const o of list){const n=cnName(o.r,o.c);if(n.toLowerCase().startsWith(lc))add(pre+n+(final?"":" "),n,hintOf?hintOf(o):cnStackHint(G.board[o.r][o.c]),final)}};
  const w0=(words[0]||"").replace(/^\//,""),cmd=cnCmd(w0),from=cnTile(cmd?words[1]:w0);
  if(!words.length){const lw=lc.replace(/^\//,"");for(const [k,d,takes] of CN_CMDS)if(k.startsWith(lw))add((t.startsWith("/")?"/":"")+k+(takes?" ":""),k,d,!takes);
    if(!t.startsWith("/"))tileSug(mine,false);return out}
  const moves=(f,n)=>{const T=cnTargets(f.r,f.c);for(const [a,b] of T.move){const nm=cnName(a,b);if(nm.toLowerCase().startsWith(lc))add(pre+nm,nm,G.board[a][b]?"join "+cnStackHint(G.board[a][b]):"move",true)}
    for(const [a,b] of T.atk){const nm=cnName(a,b);if(nm.toLowerCase().startsWith(lc))add(pre+nm,nm,"attack "+cnStackHint(G.board[a][b]),true)}
    if(n)for(const [d] of CN_DIRS)if(d.startsWith(lc)||d.replace(" ","").startsWith(lc))add(pre+d,d,"one step",true)};
  if(!cmd&&from&&words.length===1){moves(from,true);return out}   // B2 …
  if(!cmd)return out;
  const at=words.length-1,spec=(CN_CMDS.find(x=>x[0]===cmd)||[])[2]||"";
  if(cmd==="move"){if(at===0)tileSug(mine,false);else if(at===1&&cnTile(words[1]))moves(cnTile(words[1]),true);return out}
  if(cmd==="attack"){if(at===0)tileSug(mine,false);else if(at===1&&cnTile(words[1])){const f=cnTile(words[1]);for(const [a,b] of cnTargets(f.r,f.c).atk){const nm=cnName(a,b);if(nm.toLowerCase().startsWith(lc))add(pre+nm,nm,"attack "+cnStackHint(G.board[a][b]),true)}}
    else if(at===2){const f=cnTile(words[1]),to=cnTile(words[2]);if(f&&to)attackOptions(f.r,f.c).filter(o=>o.r===to.r&&o.c===to.c).forEach((o,i)=>add(pre+(i+1),String(i+1),o.w?o.w.name:o.mode||"attack",true))}return out}
  if(cmd==="place"){const P=G.p[view()];if(at===0){for(const x of P.hand){const k=short(x);if(cnCardKey(x).startsWith(lc.replace(/\s/g,""))||nameOf(x).toLowerCase().startsWith(lc))add(pre+k+" ",k,nameOf(x))}}
    else if(at===1){const card=cnHandCard(words[1]);if(card)for(let r=0;r<G.rows;r++)for(let c=0;c<G.board[r].length;c++)if(canAct()&&canPlace(card,r,c)){const nm=cnName(r,c);if(nm.toLowerCase().startsWith(lc))add(pre+nm,nm,G.board[r][c]?"join "+cnStackHint(G.board[r][c]):"place",true)}}return out}
  if(cmd==="cast"){const q=parts.slice(1).join(" ").toLowerCase();for(const s of cnSpells())if(s.name.toLowerCase().startsWith(q)||s.name.toLowerCase().includes(" "+q))add(words[0]+" "+s.name,s.name,s.off?"not now":"cast",true);return out}
  if(cmd==="auto"){for(const v of ["on","off"])if(v.startsWith(lc))add(pre+v,v,"",true);return out}
  /* the rest take tiles: your stacks (mine), or any tile (tile: yours are offered first); "mine+" takes as many as you like */
  const S=spec.split(" "),multi=spec==="mine+",kind=multi?"mine":S[at]||"",final=!multi&&at===S.length-1,used=words.slice(1).map(cnTile).filter(Boolean);
  if(kind==="mine"||kind==="tile"&&at===0)tileSug(mine.filter(o=>!used.some(x=>x.r===o.r&&x.c===o.c)),final);
  return out}

/* ---------- running a line ---------- */
function cnSay(t,bad){const o=$("#cmdline .cnout");if(o){o.textContent=t;o.classList.toggle("bad",!!bad)}if(bad){CN.err=true;AUD.ui()}}
function cnRun(line){line=String(line||"").trim();if(!line)return;
  if(CN.mode==="chat"&&!line.startsWith("/")){if(NET.role){chatSend(line);cnSay("Sent.")}else cnSay("The chat is for online games.",true);return}
  line=line.replace(/^\//,"");if(CN.hist[CN.hist.length-1]!==line){CN.hist.push(line);if(CN.hist.length>30)CN.hist.shift()}
  const w=line.split(/\s+/),cmd=cnCmd(w[0]),arg=w.slice(1);
  if(!G||G.over){if(cmd==="close"){cnClose();return}cnSay("No game is on.",true);return}
  const need=(x,what)=>{if(!x)cnSay(`Which ${what}? (a tile like B2)`,true);return x};
  if(!cmd){const f=cnTile(w[0]);if(!f){cnSay(`“${w[0]}” isn't a command or a tile. Type help.`,true);return}
    if(w.length===1){cnSelect(f);return}cnMove(f,w.slice(1).join(" "));return}
  switch(cmd){
    case "help":cnSay("Commands: "+CN_CMDS.map(c=>c[0]).join(", ")+". A tile alone selects; a tile then a tile or a direction moves.");return;
    case "close":cnClose();return;
    case "select":{const f=need(cnTile(arg[0]),"tile");if(f)cnSelect(f);return}
    case "move":{const f=need(cnTile(arg[0]),"stack");if(f)cnMove(f,arg.slice(1).join(" "));return}
    case "attack":{const f=need(cnTile(arg[0]),"stack"),to=f&&need(cnTile(arg[1]),"target");if(!to)return;cnAttack(f,to,+arg[2]||0);return}
    case "place":{const card=cnHandCard(arg[0]),to=cnTile(arg[1]);if(!card){cnSay(`No “${arg[0]||""}” in your hand.`,true);return}if(!need(to,"tile"))return;
      if(!canAct()){cnSay("Not your move now.",true);return}if(!canPlace(card,to.r,to.c)){cnSay(`${short(card)} can't be placed on ${cnName(to.r,to.c)}.`,true);return}
      place(card,to.r,to.c);render();cnSay(`${short(card)} placed on ${cnName(to.r,to.c)}.`);return}
    case "cast":{const q=arg.join(" ").toLowerCase();const S=cnSpells(),s=S.find(x=>x.name.toLowerCase()===q)||S.find(x=>x.name.toLowerCase().startsWith(q));
      if(!q||!s){cnSay(q?`No spell “${arg.join(" ")}” here.`:"Which spell?",true);return}if(s.off){cnSay(`${s.name} can't be cast now.`,true);return}s.b.click();cnSay(`${s.name}.`);return}
    case "end":{const n=$("#next");if(n&&!n.disabled){n.click();cnSay(n.textContent.trim()||"Done.")}else cnSay("The turn button can't be pressed now.",true);return}
    case "roll":{const d=$("#d4");if(d&&!d.disabled){d.click();cnSay("Rolled.")}else cnSay("There is nothing to roll now.",true);return}
    case "bank":cnClose();{const b=$("#bankslot .bankbar");if(b)b.click();else openBank()}return;
    case "ether":cnClose();openEtherShop();return;
    case "diplomacy":{const b=$("#dipbar");if(b){cnClose();b.click()}else cnSay("Diplomacy is off in this game.",true);return}
    case "log":cnClose();kbLog();return;
    case "dice":cnClose();kbDice();return;
    case "rules":cnClose();rbWin();return;
    case "keys":cnClose();kbKeysWin();return;
    case "menu":cnClose();openMenu();return;
    case "fullscreen":fsOn()?fsExit():fsEnter();cnSay(fsOn()?"Fullscreen.":"Fullscreen off.");return;
    case "auto":{const want=arg[0]==="on"?true:arg[0]==="off"?false:null,V=view(),on=faOn(V),b=document.querySelector(".fabar .fatog");
      if(want==null){cnSay(`Field Automation is ${on?"on":"off"}: auto on, or auto off.`);return}if(!faAllowed()){cnSay("Field Automation is off in this game.",true);return}
      if(want===on){cnSay(`Field Automation is already ${on?"on":"off"}.`);return}if(want)cnClose();if(b)b.click();else setFieldAuto(V,want,faMine());return}
    case "guard":case "area":case "squad":case "lead":case "leave":{const V=view();if(!fgFull(V)){cnSay("Groups need Field Automation playing your whole field (auto on).",true);return}
      const T=arg.map(cnTile);if(!T[0]){cnSay("Which stack? (a tile like B2)",true);return}const p=T.map(x=>x&&[x.r,x.c]);
      const ok=cmd==="guard"?T[1]&&fgDo(V,"guard",p[0],p[1]):cmd==="area"?T[1]&&fgDo(V,"area",p[0],p[1]):cmd==="squad"?fgDo(V,"squad",p.filter(Boolean)):fgDo(V,cmd,p[0]);
      cnSay(ok?({guard:"It guards it.",area:"It guards the area.",squad:"A squadron.",lead:"It leads its squadron.",leave:"Out of its group."})[cmd]:"That can't be done (one of your stacks? a full group?).",!ok);return}
    case "advance":case "retreat":{const f=need(cnTile(arg[0]),"stack");if(f)cnLean(f,cmd==="advance");return}
    case "hold":{const f=need(cnTile(arg[0]),"stack");if(!f)return;const st=G.board[f.r][f.c],V=view();if(!st||st.owner!==V){cnSay("That isn't your stack.",true);return}
      if(!faOn(V)){cnSay("Locking in place is for Field Automation (auto on).",true);return}const ids=st.cards.filter(x=>lockable(x,st)).map(x=>x.id);
      if(!ids.length){const L=st.cards.filter(x=>x.faLock).map(x=>x.id);if(L.length){setFaLock(V,f.r,f.c,L,false);cnSay("Unlocked.")}else cnSay("Nothing there can be locked.",true);return}
      setFaLock(V,f.r,f.c,ids,true);cnSay("Locked in place.");return}
    case "ambush":{const f=need(cnTile(arg[0]),"stack");if(!f)return;const st=G.board[f.r][f.c];if(!st||st.owner!==view()||!canAct()){cnSay("Not now, or not your stack.",true);return}
      if(!canAmbush(st)&&!st.ambush){cnSay("That stack can't lie in ambush (face-down cards or an Assassin can).",true);return}ambushToggle(f.r,f.c);render();cnSay(G.board[f.r][f.c].ambush?"In ambush.":"Out of ambush.");return}
    case "look":{const f=need(cnTile(arg[0]),"tile");if(f){kbLook(f.r,f.c);cnSay(cnName(f.r,f.c)+".")}return}
    case "info":{const f=need(cnTile(arg[0]),"tile");if(!f)return;const t=document.querySelector(`#board .tile[data-r="${f.r}"][data-c="${f.c}"]`);cnSay(t?t.getAttribute("aria-label")||cnName(f.r,f.c):cnName(f.r,f.c));return}
    case "chat":{const msg=line.replace(/^\S+\s*/,"");if(!msg){cnMode("chat");return}if(NET.role){chatSend(msg);cnSay("Sent.")}else cnSay("The chat is for online games.",true);return}}}
function cnSelect(f){if(G.sel&&G.sel.r===f.r&&G.sel.c===f.c){cnSay(`${cnName(f.r,f.c)} is selected.`);return}
  if(G.phase==="setup"||G.selHand){tileClick(f.r,f.c);cnSay(cnName(f.r,f.c)+".");return}
  G.sel=null;G.mode=null;tileClick(f.r,f.c);if(typeof fkSet==="function")fkSet(f.r,f.c);
  const st=G.board[f.r][f.c];cnSay(st?`${cnName(f.r,f.c)}: ${cnStackHint(st)}${st.owner===view()?"":" (not yours)"}.`:`${cnName(f.r,f.c)} is empty.`)}
function cnMove(f,rest){const st=G.board[f.r][f.c];if(!st||st.owner!==view()){cnSay(`No stack of yours on ${cnName(f.r,f.c)}.`,true);return}if(!canAct()){cnSay("Not your move now.",true);return}
  const k=rest.toLowerCase().trim(),dn=CN_DIRS.find(d=>d[0]===(CN_DIRALIAS[k.replace(/\s+/g,"")]||k));let to=cnTile(rest.trim());
  if(!to&&dn){to=cnStep(f.r,f.c,dn[1]);if(!to){cnSay("The field ends that way.",true);return}}
  if(!to){cnSay(`Where to? A tile, or up, down, left, right, up left…`,true);return}
  const T=cnTargets(f.r,f.c),inT=L=>L.some(([a,b])=>a===to.r&&b===to.c);
  if(inT(T.atk)){tileSel(f.r,f.c);render();chooseAttack(f.r,f.c,to.r,to.c);cnSay(`${cnName(f.r,f.c)} attacks ${cnName(to.r,to.c)}.`);return}
  if(inT(T.move)){tileSel(f.r,f.c);G.mode="move";tileClick(to.r,to.c);if(typeof fkSet==="function"&&G.sel)fkSet(G.sel.r,G.sel.c);cnSay(`${cnName(f.r,f.c)} to ${cnName(to.r,to.c)}.`);return}
  cnSay(`${cnName(f.r,f.c)} can't go to ${cnName(to.r,to.c)} now${G.phase==="prep"?"":` (moves are in your prep phase, attacks in your attack phase)`}.`,true)}
function cnAttack(f,to,n){const T=cnTargets(f.r,f.c);if(!T.atk.some(([a,b])=>a===to.r&&b===to.c)){cnSay(`${cnName(f.r,f.c)} can't attack ${cnName(to.r,to.c)} now.`,true);return}
  const opts=attackOptions(f.r,f.c).filter(o=>o.r===to.r&&o.c===to.c);tileSel(f.r,f.c);
  if(n&&opts[n-1]){attack(f.r,f.c,to.r,to.c,opts[n-1].mode);G.mode=null;if(G.sel&&!G.board[G.sel.r][G.sel.c])G.sel=null;render();cnSay(`${cnName(f.r,f.c)} attacks ${cnName(to.r,to.c)} (${opts[n-1].w?opts[n-1].w.name:"way "+n}).`);return}
  if(n){cnSay(`It has ${opts.length} way${opts.length>1?"s":""} to attack there.`,true);return}
  render();chooseAttack(f.r,f.c,to.r,to.c);cnSay(`${cnName(f.r,f.c)} attacks ${cnName(to.r,to.c)}.`)}
/* a step toward the nearest enemy, or back toward your base (or your own ground) */
function cnLean(f,fwd){const st=G.board[f.r][f.c],V=view();if(!st||st.owner!==V){cnSay(`No stack of yours on ${cnName(f.r,f.c)}.`,true);return}
  const T=cnTargets(f.r,f.c).move.filter(([a,b])=>!G.board[a][b]);if(!T.length){cnSay("It can't move now.",true);return}
  const goal=fwd?AI.enemyStacks(V).map(e=>[e.r,e.c]):stacksOf(V).filter(o=>hasBase(o.st)&&o.st!==st).map(o=>[o.r,o.c]);const g=goal.length?goal:zoneTiles(V);
  const d=(a,b)=>Math.min(...g.map(([x,y])=>Math.max(Math.abs(a-x),Math.abs(b-y))));const now=d(f.r,f.c);
  const best=T.reduce((x,y)=>d(y[0],y[1])<d(x[0],x[1])?y:x);if(d(best[0],best[1])>=now){cnSay(fwd?"No step brings it nearer.":"It is as far back as it goes.",true);return}
  cnMove(f,cnName(best[0],best[1]))}

/* ---------- the bar ---------- */
function cnBar(){let el=$("#cmdline");if(el)return el;el=document.createElement("div");el.id="cmdline";el.hidden=true;el.setAttribute("role","dialog");el.setAttribute("aria-label","Command line");
  el.innerHTML=`<p class="cnnote"></p><ul class="cnsug" role="listbox" aria-label="Suggestions"></ul><ol class="cnchat"></ol><p class="cnout" aria-live="polite"></p>
<form class="cnform"><button type="button" class="cnmode" title="Switch between the command line and the chat"></button><input class="cnin" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Command"></form>`;
  document.body.appendChild(el);const inp=el.querySelector(".cnin");
  el.querySelector("form").onsubmit=e=>{e.preventDefault();const s=CN.sugs[CN.sel];let line=inp.value;
    if(CN.nav&&s){line=s.text;if(!s.final){inp.value=s.text;CN.nav=false;CN.frozen=false;cnFill();return}}   // a part chosen: the next part's suggestions; Enter again runs what is typed
    inp.value="";CN.nav=false;CN.frozen=false;CN.err=false;cnRun(line);if(CN.err&&CN.open)inp.value=line;if(CN.open)cnFill()};   // a line that can't be done stays, to be mended
  el.querySelector(".cnmode").onclick=()=>{cnMode(CN.mode==="cmd"?"chat":"cmd");inp.focus()};
  inp.addEventListener("input",()=>{CN.frozen=false;CN.nav=false;cnFill()});
  inp.addEventListener("keydown",e=>{
    if(e.key==="Escape"){e.preventDefault();e.stopPropagation();cnClose();return}
    if(e.key==="Tab"){e.preventDefault();e.stopPropagation();const n=CN.sugs.length;if(!n)return;
      if(CN.frozen)CN.sel=((CN.sel+(e.shiftKey?-1:1))%n+n)%n;CN.frozen=true;inp.value=CN.sugs[CN.sel].text;cnPaintSugs();return}
    if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();const n=CN.sugs.length;if(!n)return;CN.sel=((CN.sel+(e.key==="ArrowDown"?1:-1))%n+n)%n;CN.nav=true;cnPaintSugs()}});
  return el}
function cnFill(){if(CN.frozen)return;CN.sugs=cnSuggest($("#cmdline .cnin").value);CN.sel=0;cnPaintSugs()}
function cnPaintSugs(){const el=$("#cmdline");if(!el)return;const ul=el.querySelector(".cnsug"),n=CN.sugs.length,top=Math.max(0,Math.min(CN.sel-3,n-8)),show=CN.sugs.slice(top,top+8);
  ul.innerHTML=show.map((s,i)=>`<li role="option" aria-selected="${top+i===CN.sel}" class="${top+i===CN.sel?"on":""}" data-cn="${top+i}"><b>${esc(s.label)}</b>${s.hint?` <small>${esc(s.hint)}</small>`:""}</li>`).join("")+(n>8?`<li class="cnmore dim">${n} in all</li>`:"");
  ul.hidden=!n;ul.querySelectorAll("[data-cn]").forEach(li=>li.onmousedown=e=>{e.preventDefault();const s=CN.sugs[+li.dataset.cn],inp=el.querySelector(".cnin");inp.value=s.text;CN.frozen=false;if(s.final){inp.value="";cnRun(s.text)}cnFill();inp.focus()})}
function cnPaint(){const el=cnBar(),chat=CN.mode==="chat",inp=el.querySelector(".cnin");
  el.classList.toggle("chat",chat);el.querySelector(".cnmode").textContent=chat?"Chat":"›";inp.placeholder=chat?"Say something (a line starting with / is a command)":"A command, or a tile like B2 (help lists them)";
  inp.setAttribute("aria-label",chat?"Chat message":"Command");
  el.querySelector(".cnnote").textContent=`Esc closes · ${chat?"":"Tab completes, ↑ ↓ choose · "}${kmShow("consoleSwap")} opens the ${chat?"command line":"chat"} instead`;
  const log=el.querySelector(".cnchat");log.hidden=!chat;if(chat)log.innerHTML=(NET.chat||[]).slice(-6).map(m=>`<li><b>${esc(m.from)}</b> ${esc(m.text)}</li>`).join("")||'<li class="dim">Nothing yet.</li>'}
function cnOpen(mode){if(!G)return;if(mode)CN.mode=mode;if(CN.mode==="chat"&&!NET.role){CN.mode="cmd";flash("The chat is for online games: here is the command line.")}
  const el=cnBar(),ht=$("#helptoast");if(ht)ht.hidden=true;CN.open=true;el.hidden=false;cnPaint();el.querySelector(".cnout").textContent="";const inp=el.querySelector(".cnin");inp.value="";CN.frozen=false;CN.nav=false;cnFill();setTimeout(()=>inp.focus(),0);
  if(CN.mode==="chat"){NET.unread=0;if(typeof chatPaint==="function")chatPaint()}}
function cnMode(m){CN.mode=m;cnOpen()}
function cnClose(){const el=$("#cmdline");CN.open=false;if(el){el.hidden=true;const i=el.querySelector(".cnin");if(i)i.blur()}}
function cnSwap(){cnOpen(CN.mode==="cmd"?"chat":"cmd")}
/* the chat's new lines show while it is open */
{const _ca=chatAdd;chatAdd=function(){const out=_ca.apply(this,arguments);if(CN.open&&CN.mode==="chat"){NET.unread=0;cnPaint()}return out}}
{const _r=render;render=function(){rSafe(_r,this,arguments);if(CN.open&&(!G||G.over))cnClose()}}

if(window.__EC)Object.assign(window.__EC,{CN,cnRun:l=>cnRun(l),cnSuggest:t=>cnSuggest(t),cnOpen:m=>cnOpen(m)});
