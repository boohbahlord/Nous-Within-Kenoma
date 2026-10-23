/* ---------- v78d: the keys, and rebinding them ----------
   Every key the game answers to is an action with up to two bindings. A binding is one key, or up to four pressed together
   (Shift+X+.: Shift and X held, then the period); Ctrl or Shift alone (pressed and let go with nothing else) is one too.
   The actions sit in five groups, by where they work:
   - Everywhere; The table (the shortcuts, the camera and the field); Windows (while one is open); the Spells (the bar and
     the list, while open) and the Hand (while picking from it). The Spells and the Hand take their keys first while they
     are open, and Windows while a window is open.
   - In a group a key does one thing, and a key used Everywhere is used nowhere else: binding a key that is taken asks
     whether to move it. Esc always closes too, and is never bound.
   Presets (the Controls tab of the settings): Default and Alternative Controls are fixed; a change to either is an unsaved
   set, kept with Save as. Your own presets, and the ones others sent you, can be changed (saved at once while Auto-save is
   on, as it is at first), deleted, and sent to another person at the table, who finds them behind a "!" in the Menu. */

/* [id, group, heading in its group, what it does, the default bindings, 1: Shift may be held too (it does more)] */
const KM_ACTS=[
  ["close","any","","Close what is open (Esc always does too)",["X"]],
  ["keys","any","","Every key, in a window",["O"]],
  ["rulebook","any","","The Rule book",["\\"]],
  ["music","any","","The music on and off",["Shift+X+."]],
  ["turn","table","Shortcuts","The turn button: Ready, the next phase, End turn",["Space"]],
  ["roll","table","Shortcuts","Roll the draw",["R"]],
  ["spellbar","table","Shortcuts","The spell bar at the bottom",["F"]],
  ["spelllist","table","Shortcuts","The spell list",["Shift+F"]],
  ["hand","table","Shortcuts","Pick from the hand",["G"]],
  ["sacrifice","table","Shortcuts","Sacrifice the hand card you picked",["Backspace","Delete"]],
  ["bank","table","Shortcuts","The Bank",["B"]],
  ["ether","table","Shortcuts","The Ether",["Shift+B"]],
  ["dip","table","Shortcuts","Diplomacy",["Ctrl+B"]],
  ["faset","table","Shortcuts","Field Automation's settings",["Shift+Space"]],
  ["log","table","Shortcuts","The log",["L"]],
  ["dice","table","Shortcuts","The dice",["Shift+L"]],
  ["fullscreen","table","Shortcuts","Fullscreen on and off",["Shift+Backspace"]],
  ["hints","table","Shortcuts","Show or hide the key letters on the buttons",["Shift+/"]],
  ["bfsOn","table","Shortcuts","The browser's own fullscreen on (the + key)",["Shift+=","NumPlus"]],["bfsOff","table","Shortcuts","The browser's own fullscreen off (the − key)",["-","Num-"]],
  ["pageUp","table","Shortcuts","Scroll the page up (hold Alt; Shift: faster); in fullscreen, the open drawer",["Alt+C"],1],
  ["pageDown","table","Shortcuts","Scroll the page down",["Alt+V"],1],
  ["console","table","Shortcuts","The command line (online: or the chat, whichever you used last)",["T"]],
  ["consoleSwap","table","Shortcuts","The other one of the two: the chat, or the command line",["Shift+T"]],
  ["camUp","table","Camera","Move the camera up (Shift: faster; two at once: diagonally)",["W"],1],
  ["camLeft","table","Camera","Move the camera left",["A"],1],
  ["camDown","table","Camera","Move the camera down",["S"],1],
  ["camRight","table","Camera","Move the camera right",["D"],1],
  ["zoomIn","table","Camera","Zoom in, around the middle of the screen",["E"]],
  ["zoomOut","table","Camera","Zoom out",["Q"]],
  ["aceBack","table","Camera","The camera to your previous Ace",["Ctrl+C"]],
  ["aceNext","table","Camera","The camera to your next Ace",["Ctrl+V"]],
  ["lookSel","table","Camera","The camera to what you selected",["Ctrl+1"]],
  ["selUp","table","The field","The selector up (two at once: diagonally)",["Up"]],
  ["selLeft","table","The field","The selector left",["Left"]],
  ["selDown","table","The field","The selector down",["Down"]],
  ["selRight","table","The field","The selector right",["Right"]],
  ["rowNext","table","The field","Along the row to your next card",["Tab"]],
  ["rowPrev","table","The field","Along the row to your previous card",["Shift+Tab"]],
  ["rowDown","table","The field","Down to the next row with your cards",["Ctrl"]],
  ["rowUp","table","The field","Up to the previous row with your cards",["Shift"]],
  ["foeSwap","table","The field","Step through the enemy's cards instead (again: yours)",["`"]],
  ["foeNext","table","The field","The enemy's next card",["N"]],
  ["foePrev","table","The field","The enemy's previous card",["Shift+N"]],
  ["act","table","The field","On the selector: select, place, move or attack, as a click",["Enter"]],
  ["move","table","The field","Move there (or attack) only",["M"]],
  ["attack","table","The field","The default attack",["1"]],
  ["aimUp","table","The field","Aim the selected stack's target up (two at once: diagonally)",["U","Alt+W"]],
  ["aimLeft","table","The field","Aim it left",["H","Alt+A"]],
  ["aimDown","table","The field","Aim it down",["J","Alt+S"]],
  ["aimRight","table","The field","Aim it right",["K","Alt+D"]],
  ["acts","table","The field","What you can do with what you selected, numbered for the number keys",["Y"]],
  ["menu","table","The field","The right-click menu under the selector",["Shift+Enter"]],
  ["plNext","table","The field","The next player's box (C and V read it, Enter its history)",["P"]],
  ["plPrev","table","The field","The previous player's box",["Shift+P"]],
  ["info","table","The field","What stands under the selector",["I"]],
  ["winUp","win","","The nearest item up (in a slider, a list or a number: up)",["W"],1],
  ["winLeft","win","","The nearest item left (there: down)",["A"],1],
  ["winDown","win","","The nearest item down (there: down)",["S"],1],
  ["winRight","win","","The nearest item right (there: up)",["D"],1],
  ["winPrev","win","","The item before",["C"],1],
  ["winNext","win","","The item after",["V"],1],
  ["winScrollUp","win","","Scroll the window up (hold Alt; Shift: faster)",["Alt+W","Alt+C"],1],
  ["winScrollDown","win","","Scroll the window down",["Alt+S","Alt+V"],1],
  ["winScrollLeft","win","","Scroll the window left",["Alt+A"],1],
  ["winScrollRight","win","","Scroll the window right",["Alt+D"],1],
  ["winUse","win","","Use it; a slider, a list, a number or a text field: change it, and again to keep it",["Enter"]],
  ["tabNext","win","","The window's next tab",["Tab"]],
  ["tabPrev","win","","The window's previous tab",["Shift+Tab"]],
  ["secNext","win","","The next section of a long window",["Ctrl"]],
  ["secPrev","win","","The previous section",["Shift"]],
  ["winInfo","win","","What the item does",["I"]],
  ["rbNext","win","","In the Rule book: the next rule",["Space"]],
  ["rbPrev","win","","In the Rule book: the rule before",["Shift+Space"]],
  ["spPrev","spell","","The school before (the bar); the spell before (the list)",["C"]],
  ["spNext","spell","","The school after (the bar); the spell after (the list)",["V"]],
  ["spFirst","spell","","The first school",["Shift+C"]],
  ["spLast","spell","","The last: the piles",["Shift+V"]],
  ["spSchoolNext","spell","","The next school",["Tab","Ctrl"]],
  ["spSchoolPrev","spell","","The previous school",["Shift+Tab","Shift"]],
  ["spCast","spell","","Cast the spell (the list)",["Enter"]],
  ["hPrev","hand","","The card before",["C"]],
  ["hNext","hand","","The card after",["V"]],
  ["hPick","hand","","Pick the card (again: let it go)",["Enter"]],
  ["hInfo","hand","","The card's info",["I"]]];
const KM_GROUPS=[["any","Everywhere"],["table","The table"],["win","Windows"],["spell","The spells: the bar and the list"],["hand","The hand"]];
/* tap: Ctrl or Shift alone may be bound (the actions that step through rows, sections and schools) */
const KM_ACT={};for(const [id,g,sub,name,def,sh] of KM_ACTS)KM_ACT[id]={id,g,sub,name,def,shift:!!sh,tap:def.some(s=>s==="Ctrl"||s==="Shift")};
const kmGroupName=g=>(KM_GROUPS.find(x=>x[0]===g)||["",""])[1];
/* v79b: each action's short name, said to the left of its key wherever a key is shown (the lists, the notes, the
   letters on the buttons), and the same name heads its line in the settings' Key bindings, so it can be found there */
const KM_LABEL={close:"Close",keys:"Every key",rulebook:"Open Rule book",music:"Music on/off",
  turn:"Next phase / End turn",roll:"Roll the draw",spellbar:"Open spell bar",spelllist:"Open spell list",hand:"Pick from hand",sacrifice:"Sacrifice card",
  bank:"Open Bank",ether:"Open Ether",dip:"Open Diplomacy",faset:"Automation settings",log:"Open log",dice:"Open dice",fullscreen:"Fullscreen on/off",
  hints:"Key letters on/off",bfsOn:"Browser fullscreen on",bfsOff:"Browser fullscreen off",pageUp:"Scroll page up",pageDown:"Scroll page down",
  console:"Open command line",consoleSwap:"Chat / command line",
  camUp:"Camera up",camLeft:"Camera left",camDown:"Camera down",camRight:"Camera right",zoomIn:"Zoom in",zoomOut:"Zoom out",
  aceBack:"Previous Ace",aceNext:"Next Ace",lookSel:"Look at selection",
  selUp:"Selector up",selLeft:"Selector left",selDown:"Selector down",selRight:"Selector right",
  rowNext:"Next own card",rowPrev:"Previous own card",rowDown:"Next row",rowUp:"Previous row",
  foeSwap:"Own / enemy cards",foeNext:"Next enemy card",foePrev:"Previous enemy card",
  act:"Select / place / move",move:"Move only",attack:"Default attack",aimUp:"Aim up",aimLeft:"Aim left",aimDown:"Aim down",aimRight:"Aim right",
  acts:"Actions menu",menu:"Right-click menu",plNext:"Next player's box",plPrev:"Previous player's box",info:"Tile info",
  winUp:"Item up",winLeft:"Item left",winDown:"Item down",winRight:"Item right",winPrev:"Previous item",winNext:"Next item",
  winScrollUp:"Scroll up",winScrollDown:"Scroll down",winScrollLeft:"Scroll left",winScrollRight:"Scroll right",
  winUse:"Use item",tabNext:"Next tab",tabPrev:"Previous tab",secNext:"Next section",secPrev:"Previous section",winInfo:"Item info",
  rbNext:"Next rule",rbPrev:"Previous rule",
  spPrev:"Previous school / spell",spNext:"Next school / spell",spFirst:"First school",spLast:"The piles",spSchoolNext:"Next school",spSchoolPrev:"Previous school",spCast:"Cast spell",
  hPrev:"Previous card",hNext:"Next card",hPick:"Pick card",hInfo:"Card info"};
const kmLabel=id=>String(id).includes(",")?String(id).split(",").map(kmLabel).join(" / "):KM_LABEL[id]||(KM_ACT[id]?KM_ACT[id].name:id);   // one button, two actions: both names
/* "Open Bank B": the action, then its key; as HTML (a note on the screen) or as words (a flash) */
const kmTip=(id,what)=>`<span class="ktip"><span class="kact">${esc(what||kmLabel(id))}</span> <kbd>${esc(kmShow(id))}</kbd></span>`;
const kmTipT=(id,what)=>`${what||kmLabel(id)}: ${kmShow(id)}`;
/* v79b: the key lists can show a preset other than yours (Show Default: yours, then Default, then Alternative Controls) */
let KM_VIEW=null;
const kmViewMap=()=>KM_VIEW?(kmPreset(KM_VIEW)||KM_LOCKED[0]).map:kmState().map;
const kmBindsV=id=>{const m=kmViewMap()[id];return Array.isArray(m)?m:KM_ACT[id]?KM_ACT[id].def:[]};
const kmShowV=(id,all)=>{const B=kmBindsV(id).filter(Boolean);return B.length?(all?B.map(kmPretty).join(" or "):kmPretty(B[0])):"(no key)"};
const kmShow4V=ids=>{const B=ids.map(id=>kmBindsV(id).filter(Boolean)[0]||"");return B.every(b=>/^[A-Z]$/.test(b))?B.join(""):B.map(kmPretty).join(" ")};
function kmViewNext(){KM_VIEW=KM_VIEW===null?"default":KM_VIEW==="default"?"alt":null}
function kmViewBar(){const S=kmState(),P=kmPreset(S.preset)||KM_LOCKED[0],now=KM_VIEW?(kmPreset(KM_VIEW)||KM_LOCKED[0]).name:`yours (${P.name}${S.dirty?", unsaved changes":""})`;
  const next=KM_VIEW===null?"default":KM_VIEW==="default"?"alt":null,lab=next===null?"Show mine":next==="default"?"Show Default":"Show Alternative Controls";
  return `<p class="kmview"><span class="dim">Showing: <b>${esc(now)}</b></span> <button type="button" class="btn ghost sm" data-kmview>${lab}</button></p>`}
/* v79b: the search: an action's name or what it does, or a key ("b", "shift", "ctrl", "space"). One letter looks at keys only */
const KM_ALIAS={control:"ctrl",ctl:"ctrl",option:"alt",escape:"esc",return:"enter",spacebar:"space",del:"delete",bksp:"backspace",up:"↑",down:"↓",left:"←",right:"→","arrow up":"↑","arrow down":"↓","arrow left":"←","arrow right":"→",tilde:"`",backtick:"`",plus:"+",minus:"-"};
const KM_KEYWORDS=new Set(["shift","ctrl","alt","meta","space","enter","esc","tab","backspace","delete","insert","home","end","pageup","pagedown","↑","↓","←","→","`","\\","num+","num-"]);
function kmMatch(q,words,keys){q=String(q||"").trim().toLowerCase();if(!q)return true;const k=String(keys||"").toLowerCase(),toks=k.split(/[\s+]+| or /).filter(Boolean);
  if(/.\+./.test(q))return k.split(" or ").map(x=>x.trim()).includes(q.replace(/\s+/g,""));   // a combination (shift+b): that one exactly
  const qa=KM_ALIAS[q]||q;if(toks.includes(qa)||toks.includes(q))return true;if(q.length===1||KM_KEYWORDS.has(qa))return false;   // a letter or a key's name: the keys only
  return String(words||"").toLowerCase().includes(q)||k.includes(qa)}

/* ---------- keys and their names ---------- */
const KM_MODS=["Ctrl","Alt","Shift","Meta"];
const KM_MODKEY={Control:"Ctrl",Shift:"Shift",Alt:"Alt",Meta:"Meta"};
const KM_CODE={Space:"Space",Enter:"Enter",NumpadEnter:"Enter",Tab:"Tab",Escape:"Esc",Backspace:"Backspace",Delete:"Delete",Insert:"Insert",Home:"Home",End:"End",
  PageUp:"PageUp",PageDown:"PageDown",ArrowUp:"Up",ArrowDown:"Down",ArrowLeft:"Left",ArrowRight:"Right",Backquote:"`",Backslash:"\\",IntlBackslash:"\\",
  Slash:"/",Period:".",Comma:",",Semicolon:";",Quote:"'",BracketLeft:"[",BracketRight:"]",Minus:"-",Equal:"=",
  NumpadAdd:"NumPlus",NumpadSubtract:"Num-",NumpadMultiply:"Num*",NumpadDivide:"Num/",NumpadDecimal:"Num."};
/* by where the key sits (the code), so Shift doesn't change its name: Shift+/ stays "/" */
function kmName(code,key){if(KM_MODKEY[key])return KM_MODKEY[key];
  if(/^Key[A-Z]$/.test(code))return code.slice(3);if(/^Digit\d$/.test(code))return code.slice(5);if(/^Numpad\d$/.test(code))return "Num"+code.slice(6);
  if(/^F\d\d?$/.test(code))return code;if(KM_CODE[code])return KM_CODE[code];
  return key&&key.length===1?key.toUpperCase():key||code||"?"}
const KM_PRETTY={Up:"↑",Down:"↓",Left:"←",Right:"→",Backspace:"Backspace",Delete:"Delete",NumPlus:"Num+"};
/* a binding: its modifiers, the keys held, and the key that does it (last) */
const kmParsed=new Map();
function kmParse(s){let c=kmParsed.get(s);if(c)return c;const P=String(s||"").split("+").filter(Boolean);
  c={ctrl:false,alt:false,shift:false,meta:false,held:[],key:null,tap:null};
  for(const p of P){if(p==="Ctrl")c.ctrl=true;else if(p==="Alt")c.alt=true;else if(p==="Shift")c.shift=true;else if(p==="Meta")c.meta=true;else c.held.push(p)}
  c.key=c.held.pop()||null;if(!c.key&&P.length===1&&(P[0]==="Ctrl"||P[0]==="Shift"))c.tap=P[0];
  kmParsed.set(s,c);return c}
/* how it is shown: "Shift+B", "Ctrl (alone)", "↑" */
function kmPretty(s){if(!s)return "";const c=kmParse(s);if(c.tap)return c.tap+" (alone)";return String(s).split("+").map(p=>KM_PRETTY[p]||p).join("+")}
const kmShort=s=>kmPretty(s).replace(/^Shift\+/,"⇧").replace(/ \(alone\)$/,"");
/* the bindings in use */
const kmState=()=>{const S=PREF.km&&typeof PREF.km==="object"?PREF.km:(PREF.km={});
  if(typeof S.preset!=="string")S.preset="default";if(!S.map||typeof S.map!=="object")S.map={};if(!Array.isArray(S.mine))S.mine=[];if(S.auto==null)S.auto=true;
  if(S.mine.some(p=>!p||typeof p!=="object"||typeof p.id!=="string"||!p.map||typeof p.map!=="object"))S.mine=S.mine.filter(p=>p&&typeof p==="object"&&typeof p.id==="string"&&p.map&&typeof p.map==="object");   // v78j
  for(const p of S.mine)if(typeof p.name!=="string")p.name="Keys";return S};
const kmBinds=id=>{const m=kmState().map[id];return Array.isArray(m)?m:KM_ACT[id]?KM_ACT[id].def:[]};
/* the first binding as words (or all of them, "X or Esc") */
const kmShow=(id,all)=>{const B=kmBinds(id).filter(Boolean);return B.length?(all?B.map(kmPretty).join(" or "):kmPretty(B[0])):"(no key)"};
/* four directions in one: "WASD" when they are four letters, else each */
const kmShow4=ids=>{const B=ids.map(id=>kmBinds(id).filter(Boolean)[0]||"");return B.every(b=>/^[A-Z]$/.test(b))?B.join(""):B.map(kmPretty).join(" ")};

/* ---------- the keys held, and Ctrl or Shift pressed alone ---------- */
const KM={held:new Map(),alone:null,top:new WeakMap()};
addEventListener("wheel",()=>{KM.alone=null},{capture:true,passive:true});   // v78j
addEventListener("keydown",e=>{const n=kmName(e.code,e.key);KM.held.set(e.code,n);KM.alone=(n==="Ctrl"||n==="Shift")&&!e.repeat?n:e.repeat&&KM.alone===n?n:null},true);
addEventListener("keyup",e=>{KM.held.delete(e.code)},true);
addEventListener("keyup",()=>{KM.alone=null});   // after every handler has read it
addEventListener("pointerdown",()=>{KM.alone=null},true);
addEventListener("blur",()=>{KM.held.clear();KM.alone=null});
const kmHeld=name=>{for(const n of KM.held.values())if(n===name)return true;return false};

/* ---------- does a key press do an action? ---------- */
/* how well one binding fits the press: -1 not at all; more keys held count more, and Shift as written beats Shift allowed */
function kmFit(e,s,act){const c=kmParse(s);if(!c.key||c.key!==kmName(e.code,e.key))return -1;
  if(c.ctrl!==e.ctrlKey||c.alt!==e.altKey||c.meta!==e.metaKey)return -1;
  let q=c.held.length*2;if(c.shift===e.shiftKey)q+=1;else if(!(act.shift&&!c.shift))return -1;
  return c.held.every(kmHeld)?q:-1}
const kmBest=(e,id)=>{const a=KM_ACT[id];let q=-1;if(a)for(const s of kmBinds(id))if(s)q=Math.max(q,kmFit(e,s,a));return q};
/* the best fit among the actions of a group and Everywhere, once a press */
function kmTop(e,g){let T=KM.top.get(e);if(!T){T={};KM.top.set(e,T)}if(T[g]!=null)return T[g];let q=-1;
  for(const a of KM_ACTS)if(a[1]===g||a[1]==="any")q=Math.max(q,kmBest(e,a[0]));return T[g]=q}
function kmIs(e,id){const a=KM_ACT[id];if(!a)return false;const q=kmBest(e,id);return q>=0&&q===kmTop(e,a.g)}
/* any action of a group */
const kmIn=(e,g)=>KM_ACTS.some(a=>a[1]===g&&kmIs(e,a[0]));
/* on letting go: Ctrl or Shift pressed alone, bound to the action */
function kmTap(e,id){const m=KM.alone;if(!m||kmName(e.code,e.key)!==m)return false;return kmBinds(id).some(s=>s&&kmParse(s).tap===m)}
/* on letting go: the key that does the action (for the held ones: the camera) */
const kmRel=(e,id)=>{const n=kmName(e.code,e.key);return kmBinds(id).some(s=>s&&kmParse(s).key===n)};
/* the actions among these whose binding is held down right now, modifiers and all (two arrows at once: a diagonal) */
const kmHeldOf=ids=>ids.filter(id=>kmBinds(id).some(s=>{const c=s&&kmParse(s);if(!c||!c.key||!kmHeld(c.key)||!c.held.every(kmHeld))return false;
  return c.ctrl===kmHeld("Ctrl")&&c.alt===kmHeld("Alt")&&c.meta===kmHeld("Meta")&&(c.shift===kmHeld("Shift")||KM_ACT[id].shift&&!c.shift)}));
const kmModOnly=e=>!!KM_MODKEY[e.key]||e.key==="CapsLock";

/* ---------- presets ---------- */
const KM_ALT={camUp:["Up"],camLeft:["Left"],camDown:["Down"],camRight:["Right"],zoomIn:["E","PageUp"],zoomOut:["Q","PageDown"],
  selUp:["W"],selLeft:["A"],selDown:["S"],selRight:["D"],aimUp:["Shift+W","U"],aimLeft:["Shift+A","H"],aimDown:["Shift+S","J"],aimRight:["Shift+D","K"]};
const KM_LOCKED=[{id:"default",name:"Default",map:{},locked:true},{id:"alt",name:"Alternative Controls",map:KM_ALT,locked:true}];
const kmPresets=()=>[...KM_LOCKED,...kmState().mine];
const kmPreset=id=>kmPresets().find(p=>p.id===id)||null;
const kmCopy=m=>JSON.parse(JSON.stringify(m||{}));
const kmNorm=(m,id)=>JSON.stringify([...((m||{})[id]||KM_ACT[id].def),"",""].slice(0,2));
const kmSame=(a,b)=>KM_ACTS.every(([id])=>kmNorm(a,id)===kmNorm(b,id));
/* what comes from another person is only data: known actions, at most two bindings of at most four known-looking keys */
function kmClean(m){const out={};if(!m||typeof m!=="object")return out;
  for(const id in m){if(!KM_ACT[id]||!Array.isArray(m[id]))continue;
    const B=m[id].slice(0,2).map(s=>typeof s==="string"&&s.length<=40&&s.split("+").length<=4&&/^[\w`\\\/.,;'\[\]=*+-]*$/.test(s)&&!/(^|\+)Esc$/.test(s)&&(KM_ACT[id].tap||!kmParse(s).tap)?s:"");
    while(B.length<2)B.push("");out[id]=B}
  return out}
function kmLoad(id){const P=kmPreset(id)||KM_LOCKED[0],S=kmState();S.preset=P.id;S.map=kmCopy(P.map);S.dirty=false;savePrefs();kmPaint();kbPaint()}
/* after a change: saved at once into your own preset with Auto-save; otherwise (or in a fixed one) unsaved */
function kmChanged(){const S=kmState(),P=kmPreset(S.preset);
  if(P&&!P.locked&&S.auto){P.map=kmCopy(S.map);S.dirty=false}else S.dirty=!kmSame(S.map,P?P.map:{});
  savePrefs();kmPaint();kbPaint()}
function kmPut(id,i,s){const S=kmState(),B=[...kmBinds(id)];while(B.length<2)B.push("");B[i]=s||"";
  if(B[0]===""&&B[1]){B[0]=B[1];B[1]=""}   // the first column is never empty while the second is not
  if(JSON.stringify(B)===kmNorm(null,id))delete S.map[id];else S.map[id]=B}
/* two bindings meet when one press would do both */
function kmMeet(a,b,shA,shB){const x=kmParse(a),y=kmParse(b);if(x.tap||y.tap)return x.tap===y.tap&&!!x.tap;
  if(x.key!==y.key||x.ctrl!==y.ctrl||x.alt!==y.alt||x.meta!==y.meta||x.held.join("+")!==y.held.join("+"))return false;
  return x.shift===y.shift||!x.shift&&shA||!y.shift&&shB}
/* the binding a new one would take from: same group, or Everywhere against any other */
function kmClashes(id,s){const A=KM_ACT[id],out=[];for(const B of KM_ACTS){const b=KM_ACT[B[0]];if(b.id===id||!(b.g===A.g||b.g==="any"||A.g==="any"))continue;
    const L=kmBinds(b.id);for(let j=0;j<L.length;j++)if(L[j]&&kmMeet(s,L[j],A.shift,b.shift))out.push({id:b.id,i:j})}
  return out}   // v78j: all of them
/* a binding chosen: one that is taken asks first */
function kmSet(id,i,s){if(s){if(kmBinds(id).some((x,j)=>j!==i&&x===s)){kmPaint();return}
    if(kmParse(s).tap&&!KM_ACT[id].tap){flash("Ctrl or Shift alone steps through rows, sections and schools only: add a key to it.");kmPaint();return}const C=kmClashes(id,s);
    const what=c=>`“${esc(KM_ACT[c.id].name)}” (${esc(kmGroupName(KM_ACT[c.id].g))}${KM_ACT[c.id].sub?": "+esc(KM_ACT[c.id].sub):""})`;
    if(C.length){kmAsk(`<b>${esc(kmPretty(s))}</b> already does ${C.map(what).join(" and ")}. Move it here?`,
      ()=>{for(const c of C)kmPut(c.id,c.i,"");kmPut(id,i,s);kmChanged()},()=>kmPaint());return}}
  kmPut(id,i,s);kmChanged()}

/* ---------- a question with Yes and No ---------- */
function kmAsk(html,yes,no){let w=$("#kmq");if(!w){w=document.createElement("div");w.id="kmq";w.className="faov";document.body.appendChild(w)}
  w.innerHTML=`<div class="ovbox kmqbox" role="alertdialog" aria-labelledby="kmqp"><p id="kmqp">${html}</p><p class="acts"><button type="button" class="btn" id="kmqY">Yes</button> <button type="button" class="btn ghost" id="kmqN" data-x>No</button></p></div>`;
  w.hidden=false;const done=f=>{w.hidden=true;if(f)f()};$("#kmqY").onclick=()=>done(yes);$("#kmqN").onclick=()=>done(no);w.onclick=e=>{if(e.target===w)done(no)};
  setTimeout(()=>{const b=$("#kmqY");if(b)b.focus()},0)}

/* ---------- listening for a new binding ----------
   Press the keys together (up to four) and let go; Ctrl or Shift alone is a binding too. Esc stops listening. */
let kmCap=null;
function kmListen(id,i){kmCap={id,i,keys:[]};kmPaint()}
function kmCapDone(s){const c=kmCap;kmCap=null;if(c&&s)kmSet(c.id,c.i,s);else kmPaint()}
function kmCombo(keys){const mods=KM_MODS.filter(m=>keys.includes(m)),rest=keys.filter(k=>!KM_MODS.includes(k));
  if(!rest.length)return mods.length===1&&(mods[0]==="Ctrl"||mods[0]==="Shift")?mods[0]:null;return [...mods,...rest].join("+")}
addEventListener("keydown",e=>{if(!kmCap)return;e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;const n=kmName(e.code,e.key);
  if(n==="Esc"){kmCapDone(null);return}if(n==="CapsLock")return;if(kmCap.keys.length<4&&!kmCap.keys.includes(n))kmCap.keys.push(n);kmPaint()},true);
addEventListener("keyup",e=>{if(!kmCap)return;e.preventDefault();e.stopImmediatePropagation();if(!kmCap.keys.length)return;const s=kmCombo(kmCap.keys);
  if(!s){kmCap.keys=[];flash("A binding needs a key besides Ctrl, Alt and Shift (Ctrl or Shift alone is one too).");kmPaint();return}kmCapDone(s)},true);
addEventListener("pointerdown",e=>{if(kmCap&&!(e.target.closest&&e.target.closest(".kmb.kmlisten")))kmCapDone(null)},true);

/* ---------- sending a preset to another person at the table ---------- */
function kmSend(from,to,name,map){if(!G||!G.p[from]||!G.p[to]||G.p[to].cpu||isNPC(to)||from===to||NET.ctx!=null&&NET.ctx!==from)return false;
  const P=G.p[to];P.kmInbox=(P.kmInbox||[]).slice(-4);P.kmInbox.push({from,name:String(name||"Keys").replace(/\s+/g," ").trim().slice(0,40)||"Keys",map:kmClean(map)});
  log(`${plName(from)} sends ${plName(to)} their key bindings, “${esc(P.kmInbox[P.kmInbox.length-1].name)}”.`);
  notify(to,`${esc(G.p[from].name)} sent you key bindings: the Menu's Controls tab installs them.`);render();return true}
function kmTake(pl,i){if(!G||!G.p[pl]||NET.ctx!=null&&NET.ctx!==pl)return false;const L=G.p[pl].kmInbox||[];if(i<0||i>=L.length)return false;L.splice(i,1);render();return true}
for(const [name,get,set] of [["kmSend",()=>kmSend,f=>kmSend=f],["kmTake",()=>kmTake,f=>kmTake=f]])netAny(name,get,set);
const kmInbox=()=>G&&G.p[view()]&&G.p[view()].kmInbox||[];
function kmInstall(i){const it=kmInbox()[i];if(!it)return;const S=kmState(),names=kmPresets().map(p=>p.name);let name=it.name;if(names.includes(name))name=copyName(name,names);
  S.mine.push({id:"k"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),name,map:kmClean(it.map),from:G.p[it.from]?G.p[it.from].name:""});
  kmTake(view(),i);savePrefs();kmLoad(S.mine[S.mine.length-1].id);flash(`Installed “${name}”: it is in use now.`)}

/* ---------- the panel in the settings' Controls tab ---------- */
let kmUI={box:null,mode:null,open:{}};
function kmPanelHTML(){const S=kmState(),P=kmPreset(S.preset)||KM_LOCKED[0],own=!P.locked,V=G?view():null,inbox=kmInbox(),m=kmUI.mode;
  const people=G&&V!=null?G.p.filter(Q=>Q.i!==V&&!Q.cpu&&!isNPC(Q.i)&&!Q.out):[];
  const opt=p=>`<option value="${p.id}" ${p.id===P.id?"selected":""}>${esc(p.name)}${p.locked?" (fixed)":p.from?` (from ${esc(p.from)})`:""}${p.id===P.id&&S.dirty?" · unsaved changes":""}</option>`;
  let form="";
  if(m==="saveas")form=`<p class="kmform"><input type="text" class="kmname" maxlength="40" aria-label="The new preset's name" value="${esc(`My keys ${S.mine.length+1}`)}"> <button type="button" class="btn sm" data-kmdo="saveasok">Save</button> <button type="button" class="btn ghost sm" data-kmdo="cancel">Cancel</button></p>`;
  else if(m==="send")form=`<p class="kmform">Send “${esc(P.name)}” to ${people.map(Q=>`<button type="button" class="btn ghost sm" data-kmto="${Q.i}">${esc(Q.name)}</button>`).join(" ")} <button type="button" class="btn ghost sm" data-kmdo="cancel">Cancel</button></p>`;
  const row=id=>{const a=KM_ACT[id],B=kmBinds(id);
    const cell=i=>{const s=B[i]||"",on=kmCap&&kmCap.id===id&&kmCap.i===i;
      return `<span class="kmcell"><button type="button" class="kmb${on?" kmlisten":""}${s?"":" kmnone"}" data-kmb="${id}|${i}" aria-label="${esc(a.name)}: binding ${i+1}${s?", "+esc(kmPretty(s)):", none"}">${on?(kmCap.keys.length?esc(kmCombo(kmCap.keys)||kmCap.keys.join("+")):"Press the keys…"):s?esc(kmPretty(s)):"—"}</button>${s&&!on?`<button type="button" class="kmx" data-kmx="${id}|${i}" aria-label="Clear it">×</button>`:""}</span>`};
    return `<div class="kmrow${kmNorm(null,id)!==kmNorm(S.map,id)?" kmmoved":""}" data-kq="${esc((kmLabel(id)+" "+a.name).toLowerCase())}" data-kk="${esc(B.filter(Boolean).map(kmPretty).join(" or ").toLowerCase())}"><span class="kmwhat"><b>${esc(kmLabel(id))}</b><small>${esc(a.name)}</small></span>${cell(0)}${cell(1)}</div>`};   // v79b: the short name first
  const group=([g,gname])=>{const acts=KM_ACTS.filter(a=>a[1]===g);let sub=null,out="";
    for(const a of acts){if(a[2]&&a[2]!==sub){sub=a[2];out+=`<h4 class="kmsub">${esc(sub)}</h4>`}out+=row(a[0])}
    return `<details class="sub kmgrp" data-kmg="${g}" ${kmUI.open[g]?"open":""}><summary>${esc(gname)}</summary>${out}</details>`};
  return `<h3 class="sethead">Key bindings</h3>
${inbox.map((it,i)=>`<p class="kminbox"><i class="bang">!</i> ${esc(G.p[it.from]?G.p[it.from].name:"Someone")} sent you key bindings, “${esc(it.name)}”. <button type="button" class="btn sm" data-kmin="${i}">Install</button> <button type="button" class="btn ghost sm" data-kmno="${i}">No thanks</button></p>`).join("")}
<div class="kmbar"><label class="f">Preset <select id="kmPreset">${kmPresets().map(opt).join("")}</select></label>
<span class="kmacts"><button type="button" class="btn ghost sm" data-kmdo="save" ${own&&S.dirty?"":"disabled"}>Save</button><button type="button" class="btn ghost sm" data-kmdo="saveas">Save as…</button><button type="button" class="btn ghost sm" data-kmdo="del" ${own?"":"disabled"}>Delete</button>${people.length?`<button type="button" class="btn ghost sm" data-kmdo="send" ${own?"":"disabled"}>Send…</button>`:""}<button type="button" class="btn ghost sm" data-kmdo="def" ${P.id==="default"&&!S.dirty?"disabled":""}>Switch to default</button></span></div>
<label class="farow kmauto"><span class="fal"><b>Auto-save</b><small>Changes to your own presets are saved at once. Default and Alternative Controls never change: a change to them is kept with Save as.</small></span><input type="checkbox" id="kmAuto" ${S.auto?"checked":""}></label>
${form}
<p class="dim">Click a binding (or Enter on it), then press the keys together, up to four, and let go; Ctrl or Shift alone is a binding too, and Esc stops. A key does one thing in its group; a taken one asks whether to move it.</p>
<p class="kmfind"><input type="search" class="kmq" placeholder="Search: an action (Open Bank), what it does, or a key (B, shift, ctrl, space)" aria-label="Search the key bindings" value="${esc(kmUI.q||"")}"></p><p class="kmnone dim" hidden>No key matches that.</p>
${KM_GROUPS.map(group).join("")}`}
/* v79b: the search over the bindings: the groups with a match open, the others hide */
function kmFilter(box){const v=kmUI.q||"";let shown=0;
  box.querySelectorAll("details.kmgrp").forEach(d=>{let n=0;d.querySelectorAll(".kmrow").forEach(r=>{const ok=kmMatch(v,r.dataset.kq,r.dataset.kk);r.hidden=!ok;if(ok)n++});
    d.querySelectorAll(".kmsub").forEach(h=>{let x=h.nextElementSibling,any=false;while(x&&!x.classList.contains("kmsub")){if(x.classList.contains("kmrow")&&!x.hidden)any=true;x=x.nextElementSibling}h.hidden=!any});
    d.hidden=!!v&&!n;if(v&&n)d.open=true;else if(!v)d.open=!!kmUI.open[d.dataset.kmg];shown+=n});
  const none=box.querySelector(".kmnone");if(none)none.hidden=!v||!!shown}
function kmPaint(){const box=kmUI.box;if(!box||!box.isConnected)return;const y=box.closest(".ovbox")?box.closest(".ovbox").scrollTop:0;box.innerHTML=kmPanelHTML();kmWire(box);
  const ob=box.closest(".ovbox");if(ob)ob.scrollTop=y;const cap=kmCap&&box.querySelector(".kmb.kmlisten");if(cap)cap.focus()}
function kmMount(box){kmUI.box=box;kmUI.mode=null;box.innerHTML=kmPanelHTML();kmWire(box)}   // the pane isn't on the page yet
function kmWire(box){const S=kmState(),P=kmPreset(S.preset)||KM_LOCKED[0],leave=go=>{if(S.dirty)kmAsk("Your changes to these keys aren't saved. Leave them?",go,()=>kmPaint());else go()};
  const q=box.querySelector(".kmq");if(q){q.addEventListener("input",()=>{kmUI.q=q.value;kmFilter(box)});kmFilter(box)}
  box.querySelectorAll("details.kmgrp").forEach(d=>d.addEventListener("toggle",()=>{kmUI.open[d.dataset.kmg]=d.open}));
  box.querySelectorAll("[data-kmb]").forEach(b=>b.onclick=()=>{const [id,i]=b.dataset.kmb.split("|");if(kmCap&&kmCap.id===id&&kmCap.i===+i)return;kmListen(id,+i)});
  box.querySelectorAll("[data-kmx]").forEach(b=>b.onclick=()=>{const [id,i]=b.dataset.kmx.split("|");kmPut(id,+i,"");kmChanged()});
  const sel=box.querySelector("#kmPreset");if(sel)sel.onchange=()=>{const id=sel.value;leave(()=>kmLoad(id))};
  const au=box.querySelector("#kmAuto");if(au)au.onchange=()=>{S.auto=au.checked;if(S.auto&&!P.locked&&S.dirty){P.map=kmCopy(S.map);S.dirty=false}savePrefs();kmPaint()};
  box.querySelectorAll("[data-kmdo]").forEach(b=>b.onclick=()=>{const d=b.dataset.kmdo;
    if(d==="save"&&!P.locked){P.map=kmCopy(S.map);S.dirty=false;savePrefs();kmPaint();flash(`Saved “${P.name}”.`)}
    else if(d==="saveas"){kmUI.mode="saveas";kmPaint();const t=box.querySelector(".kmname");if(t){t.focus();t.select()}}
    else if(d==="saveasok"){const t=box.querySelector(".kmname"),name=(t&&t.value||"").replace(/\s+/g," ").trim().slice(0,40);if(!name){flash("Give it a name.");return}
      const names=kmPresets().map(p=>p.name),id="k"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
      S.mine.push({id,name:names.includes(name)?copyName(name,names):name,map:kmCopy(S.map)});S.preset=id;S.dirty=false;kmUI.mode=null;savePrefs();kmPaint();
      flash(`Saved as “${S.mine[S.mine.length-1].name}”.`)}
    else if(d==="del"&&!P.locked)kmAsk(`Delete the preset “${esc(P.name)}”?`,()=>{S.mine=S.mine.filter(p=>p.id!==P.id);kmLoad("default")},()=>kmPaint());
    else if(d==="send"){kmUI.mode="send";kmPaint()}
    else if(d==="def")leave(()=>kmLoad("default"));
    else if(d==="cancel"){kmUI.mode=null;kmPaint()}});
  box.querySelectorAll("[data-kmto]").forEach(b=>b.onclick=()=>{if(!G)return;kmSend(view(),+b.dataset.kmto,P.name,S.map);kmUI.mode=null;kmPaint();flash(`Sent “${P.name}” to ${G.p[+b.dataset.kmto].name}.`)});
  box.querySelectorAll("[data-kmin]").forEach(b=>b.onclick=()=>kmInstall(+b.dataset.kmin));
  box.querySelectorAll("[data-kmno]").forEach(b=>b.onclick=()=>{kmTake(view(),+b.dataset.kmno);setTimeout(kmPaint,0)});
  const t=box.querySelector(".kmname");
  if(t)t.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();const ok=box.querySelector('[data-kmdo="saveasok"]');if(ok)ok.click()}}}
/* the "!" for key bindings sent to you: on the Menu, the pause button in fullscreen, and the Controls tab */
function kmBang(){const n=G?kmInbox().length:0;
  for(const el of document.querySelectorAll("#menubtn,#fspauseb,#menu .settabs .stab[data-st='ctl']")){let b=el.querySelector(":scope>.kmbang");
    if(n&&!b){b=document.createElement("i");b.className="bang kmbang";b.textContent="!";el.appendChild(b)}else if(!n&&b)b.remove()}
  if(kmUI.box&&kmUI.box.isConnected&&!kmCap&&kmUI.box.querySelectorAll(".kminbox").length!==n)kmPaint()}
{const _r=render;render=function(){rSafe(_r,this,arguments);kmBang()}}

if(window.__EC)Object.assign(window.__EC,{KM,kmMountW:b=>kmMount(b),kmMatch:(...a)=>kmMatch(...a),kmBinds:id=>kmBinds(id),kmLoad:id=>kmLoad(id),kmSet:(...a)=>kmSet(...a),kmSend:(...a)=>kmSend(...a),kmState:()=>kmState(),kmPresets:()=>kmPresets(),kmShow:(...a)=>kmShow(...a)});
