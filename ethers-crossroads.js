/* Ether's Crossroads: local 1v1, versus the computer, and Survival.
   Rules follow the written rules; where they leave a gap, the digital reading is listed on the
   All Rules page under "How the digital table reads the rules". */
(function(){
"use strict";
/* ---------------- basics ---------------- */
const $=s=>document.querySelector(s);
const R=n=>1+Math.floor(Math.random()*n);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const sleep=ms=>{const g=G;return new Promise(r=>setTimeout(()=>{if(G===g)r()},G&&G.opts.fast?0:ms))}; // a new game silently ends the old game's waits
const SUITS={S:"♠",H:"♥",D:"♦",C:"♣"};
const SUITNAME={S:"Spades",H:"Hearts",D:"Diamonds",C:"Clubs"};
const COLS=5, SOUL_CAP=6, HAND_CAP=6;
const pick=a=>a[Math.floor(Math.random()*a.length)];
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

/* ---------------- tribes, colors, symbols ---------------- */
const TRIBES={binah:{name:"Binah",sub:"the Southern tribe of the Euclids"},tiph:{name:"Tiphareth",sub:"the Northern tribe of the Euclids"}};
const COLORS=[["Ember","#ee7a3c"],["Gold","#e3b944"],["Verdigris","#45b89c"],["Azure","#4c92e6"],["Violet","#a77de8"],["Rose","#e4648f"],["Bone","#e9dfc4"],["Crimson","#d7333b"]];
const SOLIDS={tetra:"Tetrahedron",cube:"Cube",octa:"Octahedron",dodeca:"Dodecahedron",icosa:"Icosahedron"};
const HORDE_COLOR="#97a487";

/* ---------------- cards ---------------- */
let uid=0;
function mk(rank,suit,color){return{id:++uid,rank,suit,color:color||(suit==="H"||suit==="D"?"red":"black"),owner:null}}
function freshDeck(){const d=[];for(const s of "SHDC")for(const r of ["2","3","4","5","6","7","8","9","10","J","Q","K","A"])d.push(mk(r,s));d.push(mk("JK",null,"red"),mk("JK",null,"black"));return shuffle(d)}
const num=c=>/^\d+$/.test(c.rank)?+c.rank:0;
const kind=c=>c.rank==="JK"?"joker":c.rank==="A"?"ace":c.rank==="K"?"king":c.rank==="Q"?"queen":c.rank==="J"?"jack":num(c)<=6?"grunt":"infantry";
const nat=c=>({joker:0,ace:11,king:11,queen:0,jack:10}[kind(c)]??num(c));
const die=c=>({grunt:6,infantry:8,jack:12,king:20,ace:20,queen:0,joker:0}[kind(c)]);
const DM=c=>({grunt:6,infantry:8,jack:12,king:20,queen:0,joker:0,ace:0}[kind(c)]);
const MSV=c=>({grunt:24,infantry:24,jack:24,king:28}[kind(c)]||0);
const soulOf=c=>({ace:3,king:2,queen:2}[kind(c)]||1);
const COST={jack:1,joker:2,queen:2,king:2,ace:3,grunt:1,infantry:1};
const costOf=c=>COST[kind(c)];
const TYPEWORD={grunt:"Grunt",infantry:"Infantry",jack:"Knight",queen:"Queen",king:"King",ace:"Ace",joker:"Necromancer"};
const KNAME={grunt:"Grunt",infantry:"Infantry",jack:"Jack",queen:"Queen",king:"King",ace:"Ace",joker:"Joker"};
const short=c=>c.rank==="JK"?"JK":c.rank+SUITS[c.suit];
const nameOf=c=>c.rank==="JK"?`${c.color==="red"?"Red":"Black"} Joker`:({J:"Jack",Q:"Queen",K:"King",A:"Ace"}[c.rank]||c.rank)+" of "+SUITNAME[c.suit];
const rate=c=>nat(c)+(die(c)||0);                 // point rating: best possible score of a card
const stackRate=st=>Math.max(0,...st.cards.map(rate))+(st.cards.length-1)*.5;

/* ---------------- stacks ---------------- */
function stackLegal(cards){
  if(!cards.length)return false;
  const aces=cards.filter(c=>kind(c)==="ace");
  if(aces.length>1)return false;
  if(aces.length===1){
    const inside=cards.filter(c=>kind(c)!=="ace");
    if(inside.length>6)return false;
    if(G&&G.opts.aceLock&&inside.some(c=>c.color!==aces[0].color))return false;
    return true;
  }
  if(cards.filter(c=>kind(c)==="queen").length>1)return false;
  if(cards.filter(c=>kind(c)==="joker").length>1)return false;
  const msv=Math.max(0,...cards.map(MSV)),sum=cards.reduce((a,c)=>a+DM(c),0);
  if(msv===0)return cards.length<=2;            // a lone Queen, a lone Joker, or the two together
  return sum<=msv;
}
const hasK=(st,k)=>st.cards.some(c=>kind(c)===k);

/* ---------------- state ---------------- */
let G=null;
function mkPlayer(i,o){return{i,name:o.name,tribe:o.tribe||null,color:o.color,solid:o.solid,cpu:o.cpu||null,
  deck:[],hand:[],souls:[],sevArmed:false,start:0,od:0,shownUntil:0,seen:false,tray:null}}
function newGame(opts){
  uid=0;
  const rows=(opts.mid||opts.mode==="survival")?5:4;
  G={opts,rows,board:Array.from({length:rows},()=>Array(COLS).fill(null)),
     p:opts.players.map((o,i)=>mkPlayer(i,o)),grave:[],ether:[],dark:[],
     turnNo:0,active:0,first:0,phase:"setup",setupStep:"ace",setupDone:[false,false],
     spent:false,spentOther:false,blessed:false,ritual:0,log:[],sel:null,selHand:null,mode:null,over:false,
     moon:{i:0,blood:false,round:0},
     noDraw:false,round:0,busy:false,passing:false};
  G.ether=shuffle([...freshDeck(),...freshDeck()]);
  G.p.forEach((P,i)=>{if(P.cpu!=="horde"){P.deck=freshDeck();P.deck.forEach(c=>c.owner=i)}});
}
const survival=()=>G.opts.mode==="survival";
const isHorde=pl=>G.p[pl].cpu==="horde";
const me=()=>G.p[G.active], foe=()=>G.p[1-G.active];
const human=pl=>!G.p[pl].cpu;
function view(){ // which player sits at the bottom of the screen
  if(G.opts.mode!=="local")return 0;
  return G.active;
}
function backRow(pl){return pl===0?G.rows-1:0}
function frontRow(pl){return pl===0?G.rows-2:1}
const ownLines=(pl,r)=>r===backRow(pl)||r===frontRow(pl);
function stacksOf(pl){const out=[];G.board.forEach((row,r)=>row.forEach((st,c)=>{if(st&&st.owner===pl)out.push({st,r,c})}));return out}
function at(r,c){return r>=0&&r<G.rows&&c>=0&&c<COLS?G.board[r][c]:undefined}
function log(html,cls=""){G.log.unshift({html,cls});G.log=G.log.slice(0,400)}
const plName=pl=>esc(G.p[pl].name);

/* where cards go when they leave play */
function toDark(c){if(c.captured&&c.captured.length){for(const s of c.captured)toDark(s);c.captured=[]}c.darkOwner=c.owner;G.dark.push(c)}
function toGrave(c,cause){
  if(!c)return;
  const m=G.moon;
  if(m.blood&&cause==="death"){toDark(c);return}
  if(c.owner!=null&&G.p[c.owner]&&isHorde(c.owner))return;   // the Horde keeps no grave: its dead simply vanish
  G.grave.push(c);
}

/* ---------------- deck, hand, mana ---------------- */
function draw(pl,n,why,opening){
  const P=G.p[pl];let got=0,burned=0;
  for(let i=0;i<n;i++){const c=P.deck.pop();if(!c)break;
    if(P.hand.length<HAND_CAP){P.hand.push(c);got++}else{toGrave(c,"burn");burned++;if(!opening)P.od++}}
  log(`${plName(pl)} draws ${got} card${got===1?"":"s"}${why?" ("+why+")":""}${burned?`; ${burned} over the hand limit go${burned===1?"es":""} to the grave${opening?"":` (Grave Blessing −${burned}d6 max)`}`:""}${P.deck.length?"":" (deck empty)"}.`);
  return{got,burned};
}
const mana=pl=>G.p[pl].souls.reduce((a,c)=>a+soulOf(c),0);
function pay(pl,n){
  const P=G.p[pl];if(mana(pl)<n)return false;
  P.souls.sort((a,b)=>soulOf(a)-soulOf(b));
  let paid=0;
  while(paid<n&&P.souls.length){const i=P.souls.findIndex(c=>soulOf(c)>=n-paid);const c=i>=0?P.souls.splice(i,1)[0]:P.souls.shift();paid+=soulOf(c);toGrave(c,"spent")}
  if(pl===G.active)G.spent=true;
  return true;
}
function addSoul(pl,c){ // returns false when the pile is full
  if(mana(pl)+soulOf(c)>SOUL_CAP)return false;
  c.owner=pl;G.p[pl].souls.push(c);return true;
}
/* Grave Blessing limit from overdrawing: each burned draw takes 1d6 off this round's maximum of 6; the rest carries on */
const blessCap=pl=>6-Math.min(6,G.p[pl].od);

/* ---------------- sound (synthesized, quiet) ---------------- */
const SND=(()=>{
  let ac=null,master=null,on=true;
  try{on=localStorage.getItem("ec-sound")!=="off"}catch(e){}
  function ctx(){
    if(!on||G&&G.opts.fast)return null;
    try{if(!ac){ac=new (window.AudioContext||window.webkitAudioContext)();master=ac.createGain();master.gain.value=1;master.connect(ac.destination)}
      if(ac.state==="suspended")ac.resume();}catch(e){return null}
    return ac;
  }
  function noise(a,dur){const b=a.createBuffer(1,Math.max(1,Math.floor(a.sampleRate*dur)),a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const s=a.createBufferSource();s.buffer=b;return s}
  function click(a,t,amp,freq){
    const s=noise(a,.03),f=a.createBiquadFilter(),g=a.createGain();
    f.type="bandpass";f.frequency.value=freq;f.Q.value=2.2;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(amp,t+.002);g.gain.exponentialRampToValueAtTime(.0005,t+.028);
    s.connect(f).connect(g).connect(master);s.start(t);s.stop(t+.035);
  }
  return{
    get on(){return on},
    toggle(){on=!on;try{localStorage.setItem("ec-sound",on?"on":"off")}catch(e){}return on},
    dice(n){const a=ctx();if(!a)return;let t=a.currentTime+.01;const k=Math.min(9,3+Math.ceil(n*.8));
      for(let i=0;i<k;i++){click(a,t,.2*(1-i/(k+1))+.04,1800+Math.random()*2600);t+=.035+Math.random()*.07*(1+i/k)}},
    gun(){const a=ctx();if(!a)return;const t=a.currentTime+.01;
      const s=noise(a,.45),f=a.createBiquadFilter(),g=a.createGain();f.type="lowpass";f.frequency.setValueAtTime(2600,t);f.frequency.exponentialRampToValueAtTime(300,t+.35);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.32,t+.003);g.gain.exponentialRampToValueAtTime(.001,t+.42);
      s.connect(f).connect(g).connect(master);s.start(t);s.stop(t+.45);
      const o=a.createOscillator(),og=a.createGain();o.type="sine";o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(38,t+.22);
      og.gain.setValueAtTime(.28,t);og.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(og).connect(master);o.start(t);o.stop(t+.26)}
  };
})();

/* ---------------- dice ---------------- */
function rollN(n,s){const out=[];for(let i=0;i<n;i++)out.push({s,v:R(s)});return out}
const sum=d=>d.reduce((a,x)=>a+(x.x?0:x.v),0);
/* show a roll in a player's dice box. dice: [{s,v,x?}] (x = discarded by advantage/disadvantage) */
function tray(pl,label,dice,line,quiet){
  G.p[pl].tray={label,dice,line:line||"",t:Date.now()};
  if(!quiet&&dice.length)SND.dice(dice.length);
}
function rollStack(st,mode,enemy,fx){ // mode: "atk" | "def"
  const once=()=>{
    const parts=[],dice=[];let best=-1,kingRoll=null,aceRoll=null;
    const soloJoker=st.cards.length===1&&kind(st.cards[0])==="joker";
    if(soloJoker&&enemy){ // copies score and dice of the enemy's leading card
      const lead=leadCard(enemy);
      if(lead){const d=die(lead),r=d&&(mode==="atk"||hasK(st,"queen"))?R(d):0;if(r)dice.push({s:d,v:r});best=nat(lead)+r;parts.push(`Joker copies ${short(lead)}: ${nat(lead)}${r?"+"+r+" (d"+d+")":""}`)}
      else{best=0;parts.push("Joker: 0")}
      return{total:best,parts,dice,kingRoll};
    }
    const queen=hasK(st,"queen"),ace=hasK(st,"ace");
    for(const c of st.cards){
      const k=kind(c);
      if(mode==="def"&&k==="jack"){parts.push(`${short(c)} cannot defend`);continue}
      if(k==="queen"||k==="joker")continue;
      let useDie;
      if(mode==="atk")useDie=k!=="ace";
      else useDie=ace?k==="ace":queen;
      const d=die(c),r=useDie&&d?R(d):0;
      if(r)dice.push({s:d,v:r});
      if(k==="king"&&useDie)kingRoll=r;
      if(k==="ace"&&useDie)aceRoll=r;
      const t=nat(c)+r;parts.push(`${short(c)} ${nat(c)}${r?"+"+r:""}`);
      if(t>best)best=t;
    }
    return{total:Math.max(0,best),parts,dice,kingRoll,aceRoll};
  };
  const a=once();
  if(fx){const b=once();const takeB=fx==="adv"?b.total>a.total:b.total<a.total;const pick=takeB?b:a,other=takeB?a:b;
    pick.dice=[...pick.dice,...other.dice.map(d=>({...d,x:true}))];pick.parts.push(fx==="adv"?"(advantage)":"(disadvantage)");return pick}
  return a;
}
function leadCard(st){let best=null;for(const c of st.cards){if(kind(c)==="joker"||kind(c)==="queen")continue;if(!best||nat(c)>nat(best))best=c}return best}

/* ---------------- combat ---------------- */
function adjacent(r1,c1,r2,c2,diag){const dr=Math.abs(r1-r2),dc=Math.abs(c1-c2);return diag?(dr<=1&&dc<=1&&(dr||dc)):dr+dc===1}
const jackOnly=st=>st.cards.every(c=>kind(c)==="jack");
function canAttackFrom(st){
  if(st.attacked||st.hypo)return false;
  if(hasK(st,"ace"))return false;
  if(st.cards.length===1&&kind(st.cards[0])==="king")return false;
  if(st.cards.every(c=>kind(c)==="queen"))return false;
  return true;
}
const cmpSign=(a,b)=>a>b?">":a<b?"<":"=";
function attack(r1,c1,r2,c2){
  const A=G.board[r1][c1],D=G.board[r2][c2],atkPl=A.owner,defPl=D.owner;
  const fxA=A.odds||null,fxD=D.odds||null;
  const bothSoloJokers=A.cards.length===1&&D.cards.length===1&&kind(A.cards[0])==="joker"&&kind(D.cards[0])==="joker";
  const ra=rollStack(A,"atk",D,fxA),rd=rollStack(D,"def",A,fxD);
  A.odds=null;D.odds=null;A.attacked=true;
  if(G.opts.moonBonus!==false&&!bothSoloJokers){   // the moon lends a die: Full Moon to the attacker, New Moon to the defender
    if(G.moon.i===4){const v=R(2);ra.total+=v;ra.dice.push({s:2,v});ra.parts.push(`${G.moon.blood?"Blood":"Full"} Moon +${v}`)}
    if(G.moon.i===0){const v=R(2);rd.total+=v;rd.dice.push({s:2,v});rd.parts.push(`New Moon +${v}`)}
  }
  const queenA=hasK(A,"queen");
  let dmgD=0,dmgA=0,notes=[];
  if(bothSoloJokers){notes.push("Jokers cannot kill Jokers.")}
  else if(ra.total>rd.total){
    dmgD=1;
    if(ra.kingRoll===20){dmgD=2;notes.push("King rolls 20: double damage.")}
    if(ra.kingRoll===1&&!queenA){dmgD=0;notes.push("King rolls 1: no damage.")}
  }else{
    dmgA=1;
    if(ra.kingRoll===20){dmgA=0;notes.push("King rolls 20: takes no damage.")}
    if(ra.kingRoll===1&&!queenA){dmgA=2;notes.push("King rolls 1 on a failed attack: two damage.")}
  }
  if(rd.kingRoll===20&&dmgA>0){dmgA*=2;notes.push("Defending King rolls 20: double damage back.")}
  if(rd.aceRoll===1&&dmgA>0){dmgA=0;notes.push("The Ace rolls 1: it does no damage.")}
  const line=`${ra.total}${cmpSign(ra.total,rd.total)}${rd.total}`;
  tray(atkPl,"Attack",ra.dice,line);tray(defPl,"Defense",rd.dice,line,true);
  log(`<b>${plName(atkPl)}</b> attacks: <span class="dice">${ra.parts.join(", ")}</span> = <b>${ra.total}</b> vs <span class="dice">${rd.parts.join(", ")}</span> = <b>${rd.total}</b> <span class="tot">(${esc(line)})</span>. ${notes.join(" ")} ${dmgD?`Defender takes ${dmgD} damage.`:""}${dmgA?`Attacker takes ${dmgA} damage.`:""}${!dmgA&&!dmgD?"No damage.":""}`,"combat");
  if(dmgD)damage(r2,c2,dmgD,true);
  if(dmgA&&G.board[r1][c1])damage(r1,c1,dmgA,false);
  return{win:dmgD>0,line};
}
function damage(r,c,n,defending){
  const st=G.board[r][c];if(!st)return;
  const dead=[];
  for(let i=0;i<n&&st.cards.length;i++){
    if(hasK(st,"ace")){dead.push(...st.cards.splice(0));log("The Ace falls, and every card inside it is destroyed.");break}
    st.cards.sort((a,b)=>nat(a)-nat(b));
    const c=st.cards.shift();dead.push(c);
    if(kind(c)==="king"&&defending&&st.cards.length){dead.push(...st.cards.splice(0));log("The King is defeated in defense: all units with it die.")}
  }
  if(!st.cards.length)G.board[r][c]=null;
  for(const d of dead)bury(d,r,c,st);
  checkWin();
}
function adjacentJokers(r,c,side){
  const out=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const s=at(r+dr,c+dc);if(s&&s.owner===side){const j=s.cards.find(x=>kind(x)==="joker");if(j)out.push(j)}}
  return out;
}
const capMana=j=>(j.captured||[]).reduce((a,c)=>a+soulOf(c),0);
function bury(card,r,c,st){
  const owner=st.owner,enemy=1-owner;
  if(kind(card)==="joker"&&card.captured&&card.captured.length){
    const souls=card.captured;card.captured=[];let stolen=0;
    for(const s of souls){const j=adjacentJokers(r,c,enemy).find(j=>capMana(j)+soulOf(s)<=SOUL_CAP);
      if(j){(j.captured=j.captured||[]).push(s);stolen++}else toGrave(s,"death")}
    log(`The Joker's ${souls.length} captured soul${souls.length>1?"s are":" is"} released${stolen?`; an enemy Joker steals ${stolen}`:""}.`);
  }
  const j=adjacentJokers(r,c,enemy).find(j=>capMana(j)+soulOf(card)<=SOUL_CAP);
  if(j){
    const P=G.p[enemy];
    if(P.sevArmed&&enemy===G.active){ // half the conjuring price of everything severed this turn, rounded up
      const charge=Math.ceil((G.sevSum+costOf(card))/2)-Math.ceil(G.sevSum/2);
      if(mana(enemy)>=charge){if(charge)pay(enemy,charge);G.sevSum+=costOf(card);card.owner=null;G.ether.push(card);log(`Flesh Severance: ${esc(nameOf(card))} is exiled to the Ether (${charge} mana).`);return}
    }
    (j.captured=j.captured||[]).push(card);log(`Soul Capture: a Joker takes the soul of ${esc(nameOf(card))}.`);return;
  }
  toGrave(card,"death");
}

/* ---------------- win ---------------- */
function checkWin(){
  if(G.over||G.phase==="setup")return;
  if(survival()){if(!stacksOf(0).length)endSurvival();return}
  for(const pl of [0,1]){
    if(!stacksOf(pl).length){end(1-pl,`every card ${plName(pl)} had on the field is destroyed`);return}
  }
}
function checkEconomic(pl){
  if(survival())return;
  const P=G.p[pl];
  if(!P.deck.length&&!P.hand.length&&!P.souls.length)end(1-pl,`${esc(P.name)} has no deck, hand or soul pile left: economic victory`);
}

/* ---------------- choices: a person answers in a box, the computer answers in code ---------------- */
async function ask(pl,spec){
  if(G.p[pl].cpu){await sleep(320);return AI.choose(pl,spec)}
  return askHuman(pl,spec);
}
const order=()=>[G.active,1-G.active].filter(pl=>!isHorde(pl));

/* ---------------- the moon ---------------- */
const MOON=["New Moon","Waxing Crescent","First Quarter","Waxing Gibbous","Full Moon","Waning Gibbous","Last Quarter","Waning Crescent"];
const isFull=()=>G.moon.i===4;
const fullPrices=()=>G.moon.i===4;                       // Full Moon prices also hold under a Blood Moon
const newPrices=()=>G.moon.i===0;
const fullDrawbacks=()=>G.moon.i===4&&!G.moon.blood;
/* the moon turns once every round: after every player has taken a turn */
async function moonStart(){
  const m=G.moon;m.blood=false;
  if(G.turnNo===1&&G.opts.bloodStart){m.i=4;m.blood=true;log("The game opens under a <b>Blood Moon</b>.","event")}
  else if(m.i===4){
    const p=G.forceMoon!=null?G.forceMoon:.05;G.forceMoon=null;
    if(Math.random()<p){m.blood=true;log("The Full Moon turns red: a <b>Blood Moon</b>. Every card killed this round falls into the Outer Darkness.","event")}
  }
  applyMoonTheme();render();
  if(m.blood){await newMoonGift();return}
  if(m.i===4){
    await fullMoonToll();if(G.over)return;
    for(const P of G.p)shuffle(P.deck);
    log("The Full Moon shuffles every deck. No cards are drawn and no necromancy is cast this round.");
    return;
  }
  if(m.i===0)await newMoonGift();
}
async function newMoonGift(){
  for(const pl of order()){
    if(!G.grave.length)break;
    const n=R(2);tray(pl,G.moon.blood?"Blood Moon":"New Moon",[{s:2,v:n}],`${n} from the grave`);
    log(`${plName(pl)} rolls 1d2 under the ${G.moon.blood?"Blood":"New"} Moon: ${n}.`);render();
    await pickGrave(pl,n,G.moon.blood?"Blood Moon":"New Moon");
  }
}
async function pickGrave(pl,n,title){
  let got=0;
  while(got<n&&G.grave.length&&G.p[pl].hand.length<HAND_CAP){
    const i=await ask(pl,{kind:"cards",id:"grave",title:`${title}: ${esc(G.p[pl].name)} raises a card (${n-got} left)`,cards:G.grave,cancel:"Stop",box:"limbo"});
    if(i==null||!G.grave[i])break;
    const c=G.grave.splice(i,1)[0];c.owner=pl;G.p[pl].hand.push(c);got++;
    log(`${plName(pl)} raises ${esc(nameOf(c))} from the grave.`);render();
  }
  if(got<n&&G.grave.length&&G.p[pl].hand.length>=HAND_CAP)log(`${plName(pl)}'s hand is full.`);
  return got;
}
function strongest(pl){const c=stacksOf(pl).filter(x=>!x.st.hypo);c.sort((a,b)=>stackRate(b.st)-stackRate(a.st)||b.st.cards.length-a.st.cards.length);return c[0]}
async function fullMoonToll(){
  for(const pl of order()){
    const t=strongest(pl);if(!t)continue;
    const yes=await ask(pl,{kind:"yesno",id:"fullmoon",target:t,title:`Full Moon: ${esc(G.p[pl].name)}'s toll`,
      text:`The Full Moon asks for your most powerful stack: <b>${t.st.cards.map(c=>esc(nameOf(c))).join(", ")}</b>. Sacrifice it to your soul pile (any mana over ${SOUL_CAP} goes to the grave), or refuse: every soul in your pile is drained and five random cards from your deck go to the grave.`,
      yes:"Sacrifice it",no:"Refuse"});
    if(yes){
      G.board[t.r][t.c]=null;let m=0;
      for(const c of t.st.cards){
        if(c.captured&&c.captured.length){for(const s of c.captured)toGrave(s,"death");c.captured=[]}
        if(addSoul(pl,c))m+=soulOf(c);else toGrave(c,"spent");
      }
      log(`${plName(pl)} sacrifices ${t.st.cards.length} card${t.st.cards.length>1?"s":""} to the Full Moon (+${m} mana).`,"event");
    }else{
      const P=G.p[pl];const lost=P.souls.length;for(const c of P.souls.splice(0))toGrave(c,"spent");
      let burned=0;for(let i=0;i<5&&P.deck.length;i++){const c=P.deck.splice(Math.floor(Math.random()*P.deck.length),1)[0];toGrave(c,"burn");burned++}
      log(`${plName(pl)} refuses the Full Moon: ${lost} soul${lost===1?"":"s"} drained, ${burned} deck card${burned===1?"":"s"} to the grave.`,"event");
    }
    render();checkWin();if(G.over)return;
  }
}
/* ---------------- turns ---------------- */
async function startTurn(){
  G.turnNo++;Object.assign(G,{spent:false,spentOther:false,blessed:false,ritual:0,sel:null,selHand:null,mode:null,noDraw:false,sevSum:0});
  for(const {st} of stacksOf(G.active)){st.moved=false;st.attacked=false;if(st.hypo){st.hypo--;if(!st.hypo)log(`Hypostasis fades from ${plName(G.active)}'s stack.`)}}
  me().sevArmed=false;
  if(survival()&&isHorde(G.active))G.round++;
  const newRound=G.active===G.first;          // the first player's turn opens a new round of the moon
  if(newRound){G.moon.round++;if(G.moon.round>1)G.moon.i=(G.moon.i+1)%8}
  log(`— ${plName(G.active)}'s turn${survival()?` · round ${roman(G.round)}`:""} · ${MOON[G.moon.i]} —`,"turn");
  if(newRound){G.phase="moon";G.busy=true;render();await moonStart();G.busy=false;if(G.over)return}
  G.noDraw=fullDrawbacks();
  G.phase=(G.turnNo===1||G.noDraw)?"prep":"draw";
  G.busy=false;render();
  if(me().cpu)runCpu();
}
async function finishTurn(){
  checkEconomic(G.active);if(G.over)return;
  const P=me();P.od=Math.max(0,P.od-6);
  foe().shownUntil=0;
  G.active=1-G.active;G.sel=null;G.selHand=null;G.mode=null;
  if(G.opts.mode==="local")await passScreen(`${me().name}'s turn`);
  await startTurn();
}
async function nextPhase(){
  if(G.busy||G.over)return;
  if(G.phase==="setup"){
    if(G.setupStep==="ace"){flash("First place your Ace and its Jack on a backline tile.");return}
    if(G.setupResolve){const f=G.setupResolve;G.setupResolve=null;f()}
    return;
  }
  if(G.phase==="draw"){G.phase="prep"}
  else if(G.phase==="prep"){G.phase="attack";G.mode=null;G.selHand=null}
  else if(G.phase==="attack"){G.busy=true;await finishTurn();if(!me().cpu)G.busy=false;return}
  render();
}
function rollDraw(){
  const n=R(4);tray(G.active,"Draw",[{s:4,v:n}],`draw ${n}`);
  log(`${plName(G.active)} rolls d4: ${n}.`);draw(G.active,n);
}

/* ---------------- opening ---------------- */
function startMana(pl,shared){
  const sm=G.opts.startMana||"3d2";if(sm==="none")return;
  let d=shared;
  if(!d)d=sm==="3d2"?rollN(3,2):sm==="1d6"?rollN(1,6):[];
  const n=d.length?sum(d):Math.min(SOUL_CAP,+sm||0);let got=0;
  for(let i=0;i<n&&mana(pl)<SOUL_CAP;i++){const j=G.ether.findIndex(c=>/^\d+$/.test(c.rank));if(j<0)break;const c=G.ether.splice(j,1)[0];addSoul(pl,c);got++}
  if(d.length)tray(pl,"Starting mana",d,`${got} mana`,true);
  log(`${plName(pl)} starts with ${got} mana${d.length?` (${sm}: ${d.map(x=>x.v).join(" + ")})`:""}.`);
}
function deal(){
  const sm=G.opts.startMana||"3d2",shared=!G.opts.manaEach&&(sm==="3d2"||sm==="1d6")?(sm==="3d2"?rollN(3,2):rollN(1,6)):null;
  G.p.forEach((P,pl)=>{
    if(P.cpu==="horde")return;
    const ai=P.deck.findIndex(c=>kind(c)==="ace");const ace=P.deck.splice(ai,1)[0];
    const ji=P.deck.findIndex(c=>kind(c)==="jack");const jack=P.deck.splice(ji,1)[0];
    P.opening=[ace,jack];
    if(G.opts.bloodStart){shuffle(P.deck);const k=Math.floor(P.deck.length*2/3);for(const c of P.deck.splice(0,k))G.grave.push(c);log(`Blood Moon mode: ${k} of ${plName(pl)}'s cards go to the grave.`)}
    if(G.opts.bloodStart){const j=G.ether.findIndex(c=>kind(c)==="joker");if(j>=0){const c=G.ether.splice(j,1)[0];c.owner=pl;P.hand.push(c);log(`A Joker comes from the Ether into ${plName(pl)}'s hand.`)}}
    const d=rollN(2,4);tray(pl,"Opening hand",d,`draw ${sum(d)}`,true);
    log(`${plName(pl)} rolls 2d4: ${d[0].v} + ${d[1].v} = ${sum(d)}.`);draw(pl,sum(d),"opening hand",true);
    startMana(pl,shared);
  });
}
async function opening(){
  deal();
  if(survival()){G.first=1}
  else{
    let a,b;do{a=R(6);b=R(6)}while(a===b);
    tray(0,"Opening roll",[{s:6,v:a}],`${a}${cmpSign(a,b)}${b}`);tray(1,"Opening roll",[{s:6,v:b}],`${b}${cmpSign(b,a)}${a}`);
    G.first=a>b?0:1;
    log(`Opening roll: ${plName(0)} ${a}, ${plName(1)} ${b}. ${plName(G.first)} sets up first and takes the first turn.`);
  }
  const setupOrder=survival()?[0]:[G.first,1-G.first];
  for(const pl of setupOrder){
    G.active=pl;G.phase="setup";G.setupStep="ace";G.sel=null;G.selHand=null;
    if(G.opts.mode==="local")await passScreen(`${G.p[pl].name} sets up`);
    render();
    if(G.p[pl].cpu){G.busy=true;await AI.setup(pl);G.busy=false}
    else await new Promise(res=>{G.setupResolve=res});
    G.setupDone[pl]=true;
  }
  G.p.forEach(P=>P.start=Math.max(1,P.deck.length));
  G.active=G.first;
  if(G.opts.mode==="local"&&!survival())await passScreen(`${me().name} begins`);
  await startTurn();
}
function placeOpening(pl,r,c){
  const P=G.p[pl];
  G.board[r][c]={owner:pl,cards:P.opening.splice(0),moved:true,attacked:false};
  G.setupStep="more";
  log(`${plName(pl)} raises the opening Ace with its Jack on the backline.`);
}

/* ---------------- actions ---------------- */
function canPlace(card,r,c){
  if(!ownLines(G.active,r))return false;
  const st=G.board[r][c],k=kind(card);
  if(k==="ace")return !st&&r===backRow(G.active);
  if(k==="joker"){if(!st||st.owner!==G.active)return false;return st.cards.some(x=>x.color===card.color)&&stackLegal([...st.cards,card])}
  if(!st)return true;
  return st.owner===G.active&&stackLegal([...st.cards,card]);
}
function place(card,r,c){
  const P=me();P.hand.splice(P.hand.indexOf(card),1);card.owner=G.active;
  const st=G.board[r][c];
  if(st)st.cards.push(card);else G.board[r][c]={owner:G.active,cards:[card],moved:G.phase!=="setup",attacked:false};
  log(`${plName(G.active)} places ${esc(nameOf(card))}${st?" onto a stack":""}.`);
  G.selHand=null;
}
function moveGroup(){const s=G.sel;if(!s)return[];const st=G.board[s.r][s.c];return st.cards.filter(c=>s.pick.has(c.id))}
function moveTargets(){
  const s=G.sel,st=G.board[s.r][s.c],grp=moveGroup();
  if(!grp.length||st.moved||grp.some(c=>kind(c)==="ace"))return[];
  const rest=st.cards.filter(c=>!s.pick.has(c.id));
  if(rest.length&&!stackLegal(rest))return[];
  if(!stackLegal(grp))return[];
  const out=[];const jack=grp.every(c=>kind(c)==="jack");const fwd=st.owner===0?-1:1;
  for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++){
    if(r===s.r&&c===s.c)continue;
    if(st.hypo&&(r-s.r)*fwd>0)continue;                 // Hypostasis: no step toward the enemy
    const dr=Math.abs(r-s.r),dc=Math.abs(c-s.c);
    const okStep=(dr+dc===1)||(jack&&((dr+dc===2&&(dr===0||dc===0))||(dr===1&&dc===1)));
    if(!okStep)continue;
    if(jack&&dr+dc===2&&(dr===0||dc===0)){const mr=(r+s.r)/2,mc=(c+s.c)/2,mid=G.board[mr][mc];if(mid&&mid.owner!==st.owner)continue}
    const t=G.board[r][c];
    if(!t)out.push([r,c]);
    else if(t.owner===st.owner&&!t.moved&&!t.hypo&&stackLegal([...t.cards,...grp])&&!(grp.some(x=>kind(x)==="joker")&&!t.cards.some(x=>grp.find(g=>kind(g)==="joker").color===x.color)))out.push([r,c]);
  }
  return out;
}
function doMove(r,c){
  const s=G.sel,st=G.board[s.r][s.c],grp=moveGroup();
  st.cards=st.cards.filter(x=>!s.pick.has(x.id));
  if(!st.cards.length)G.board[s.r][s.c]=null;else st.moved=true;
  const t=G.board[r][c];
  if(t){t.cards.push(...grp);t.moved=true}else G.board[r][c]={owner:st.owner,cards:grp,moved:true,attacked:false,hypo:st.cards.length?0:st.hypo};
  log(`${plName(st.owner)} moves ${grp.map(short).join(" ")}${t?" onto another stack":""}.`);
  G.sel={r,c,pick:new Set(G.board[r][c].cards.filter(x=>kind(x)!=="ace").map(x=>x.id))};G.mode=null;
}
function attackTargets(){
  const s=G.sel,st=G.board[s.r][s.c];if(!canAttackFrom(st))return[];
  const diag=jackOnly(st),out=[];
  for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++){const t=G.board[r][c];if(t&&t.owner!==st.owner&&!t.hypo&&adjacent(s.r,s.c,r,c,diag))out.push([r,c])}
  return out;
}
const sacrificeAllowed=()=>G.phase==="prep"&&!G.spent&&!isHorde(G.active);
function sacrifice(card,from){
  const P=me();
  if(mana(G.active)+soulOf(card)>SOUL_CAP){flash(`The soul pile holds ${SOUL_CAP} mana at most.`);return false}
  if(from==="hand")P.hand.splice(P.hand.indexOf(card),1);
  else{const st=G.board[from.r][from.c];st.cards.splice(st.cards.indexOf(card),1);
    if(card.captured&&card.captured.length){for(const s of card.captured)toGrave(s,"death");card.captured=[]}
    if(!st.cards.length){G.board[from.r][from.c]=null;G.sel=null}else if(G.sel)G.sel.pick.delete(card.id)}
  addSoul(G.active,card);log(`${plName(G.active)} sacrifices ${esc(nameOf(card))} (+${soulOf(card)} mana).`);
  if(from!=="hand")checkWin();
  return true;
}
const canSacOnField=(st,c)=>kind(c)!=="ace"&&!(kind(c)==="king"&&st.cards.length>1);

/* ---------------- spells ---------------- */
const selStack=()=>G.sel&&G.board[G.sel.r]&&G.board[G.sel.r][G.sel.c];
const selOwn=()=>selStack()&&selStack().owner===G.active;
const selEnemy=()=>selStack()&&selStack().owner!==G.active;
const selOwnJoker=()=>selOwn()&&hasK(selStack(),"joker");
const SCHOOLS=["Necromancy","Enchantment","Curse","Sorcery","Conjuring"];
const SPELLS=[
 {id:"ritual",name:"Ritual Dice",cost:1,school:"Necromancy",text:"+2d6 to this turn's Grave Blessing.",ok:()=>!G.blessed&&G.ritual===0&&blessCap(G.active)>0,run:async()=>{G.ritual=2;log("Ritual Dice: two more dice for the Grave Blessing.")}},
 {id:"bless",name:"Grave Blessing",cost:0,school:"Necromancy",text:"Free, once a turn, before any other mana is spent. Roll 1d6, +1d6 per Ace you have on the field, +2d6 from Ritual Dice, 6 dice at most. Each natural 6 raises a card from the grave. Every card you overdrew to the grave takes 1d6 off the maximum.",ok:()=>!G.blessed&&!G.spentOther&&G.grave.length>0&&blessCap(G.active)>0,run:blessing},
 {id:"suicide",name:"Sacrificial Suicide",cost:0,school:"Necromancy",text:"Select your stack with a Joker. The Joker dies and the souls it captured go to your soul pile (6 mana at most; the surplus goes to the grave). Under a Blood Moon, the Joker and all its souls go to the Outer Darkness instead.",ok:()=>!G.spent&&selOwnJoker(),run:suicideSpell},
 {id:"sever",name:"Flesh Severance",cost:0,school:"Necromancy",text:"Arm for this turn: an enemy killed next to your Joker is exiled to the Ether for its conjuring cost instead of being captured.",ok:()=>true,run:async()=>{me().sevArmed=!me().sevArmed;log(`Flesh Severance ${me().sevArmed?"armed":"disarmed"}.`)}},
 {id:"resur",name:"Resurrection",cost:6,school:"Necromancy",text:"Choose one card from the grave and bring it back into your hand.",ok:()=>G.grave.length>0&&me().hand.length<HAND_CAP,run:async()=>{await pickGrave(G.active,1,"Resurrection")}},
 {id:"divine",name:"Divine Odds",cost:3,school:"Enchantment",text:"Select your stack: advantage on all its dice for its next combat.",ok:()=>selOwn()&&!selStack().odds,run:async()=>{selStack().odds="adv";log("Divine Odds marks a stack.")}},
 {id:"hypo",name:"Hypostasis",cost:3,school:"Enchantment",text:"Select your stack: it cannot be attacked for two turns. While it lasts it cannot attack or step toward the enemy, only sideways or back. Costs 3 for one card, +1 for each more card in the stack. Needs at least two of your stacks on the field.",ok:()=>selOwn()&&!selStack().hypo&&stacksOf(G.active).length>=2,run:async()=>{const st=selStack();st.hypo=2;log(`Hypostasis: ${plName(G.active)}'s stack of ${st.cards.length} becomes untouchable for two turns.`)}},
 {id:"forced",name:"Forced Hand",cost:2,school:"Curse",text:"The other player draws 1d2 cards; any over the hand limit go to the grave (and cut their Grave Blessing).",ok:()=>!survival(),run:async()=>{const n=R(2);tray(G.active,"Forced Hand",[{s:2,v:n}],`draw ${n}`);draw(1-G.active,n,"Forced Hand")}},
 {id:"hexed",name:"Hexed Odds",cost:3,school:"Curse",text:"Select an enemy stack: disadvantage on all its dice for its next combat.",ok:()=>selEnemy()&&!selStack().odds,run:async()=>{selStack().odds="dis";log("Hexed Odds marks an enemy stack.")}},
 {id:"double",name:"Double Edged Sword",cost:1,school:"Curse",text:"Roll 3d6. Each 1 burns a card from your deck; each 6 burns a card from the enemy's deck.",ok:()=>!survival(),run:doubleEdge},
 {id:"three",name:"Three of Swords",cost:3,school:"Curse",text:"Roll 1d2. A 1 destroys one random card in the enemy's hand and one in yours; a 2 destroys two of each. If your hand runs short, the rest comes from your deck. The enemy loses nothing from the deck.",ok:()=>!survival(),run:threeSwords},
 {id:"clair",name:"Clairvoyance",cost:3,school:"Sorcery",text:"Look at 2d6 cards from your deck, take one into your hand, then reshuffle. 6 mana at the New Moon, 2 at the Full Moon.",ok:()=>me().deck.length>0&&me().hand.length<HAND_CAP,run:clairvoyance},
 {id:"tele",name:"Teleport",cost:2,school:"Sorcery",text:"Select your stack in your own two lines with no enemy beside it and leave exactly one card checked; that card returns to your hand.",ok:teleOk,run:teleport},
 {id:"naked",name:"Naked Hand",cost:3,school:"Sorcery",text:"The other player's hand is shown to you for the rest of this turn, and both players are told it has been seen. 6 mana at the New Moon, free at the Full Moon.",ok:()=>!survival()&&foe().hand.length>0,run:nakedHand},
 {id:"cj",name:"Jack Conjure",cost:1,school:"Conjuring",text:"A Jack's soul comes from the Ether into your deck.",ok:()=>etherHas("jack"),run:()=>conjure("jack")},
 {id:"cjk",name:"Joker Conjure",cost:2,school:"Conjuring",text:"A Joker's soul comes from the Ether into your deck.",ok:()=>etherHas("joker"),run:()=>conjure("joker")},
 {id:"cq",name:"Queen Conjure",cost:2,school:"Conjuring",text:"A Queen's soul comes from the Ether into your deck.",ok:()=>etherHas("queen"),run:()=>conjure("queen")},
 {id:"ck",name:"King Conjure",cost:2,school:"Conjuring",text:"A King's soul comes from the Ether into your deck.",ok:()=>etherHas("king"),run:()=>conjure("king")},
 {id:"ca",name:"Ace Conjure",cost:3,school:"Conjuring",text:"An Ace's soul comes from the Ether into your deck.",ok:()=>etherHas("ace"),run:()=>conjure("ace")},
 {id:"cs",name:"Soldier Conjure",cost:1,school:"Conjuring",text:"A soldier's soul (2 to 10) comes from the Ether into your deck.",ok:()=>etherHas("soldier"),run:()=>conjure("soldier")}
];
const SP=id=>SPELLS.find(s=>s.id===id);
function spellCost(sp){
  if(sp.id==="clair")return newPrices()?6:fullPrices()?2:3;
  if(sp.id==="naked")return newPrices()?6:G.moon.blood?1:fullPrices()?0:3;
  if(sp.id==="hypo"){const st=selOwn()?selStack():null;return 3+(st?st.cards.length-1:0)}
  return sp.cost;
}
function spellBlock(sp){ // reason the moon or mode forbids a spell, or ""
  if(fullDrawbacks()&&sp.school==="Necromancy")return "No necromancy under the Full Moon.";
  if(fullDrawbacks()&&sp.id==="forced")return "No one draws under the Full Moon.";
  if(survival()&&["forced","double","three","naked"].includes(sp.id))return "The Horde has no hand or deck.";
  return "";
}
const phaseOk=sp=>G.phase==="prep"||(G.phase==="attack"&&G.opts.atkSpells&&["Enchantment","Curse","Sorcery"].includes(sp.school));
function spellReady(sp){return phaseOk(sp)&&!spellBlock(sp)&&sp.ok()&&mana(G.active)>=spellCost(sp)}
async function cast(sp){
  if(G.busy&&!me().cpu)return;
  if(!phaseOk(sp)){flash(G.opts.atkSpells?"That school is cast in the prep phase.":"Spells are cast in the prep phase.");return}
  const why=spellBlock(sp);if(why){flash(why);return}
  if(!sp.ok()){flash("That spell can't be cast right now.");return}
  const cost=spellCost(sp);
  if(mana(G.active)<cost){flash("Not enough mana.");return}
  const wasBusy=G.busy;G.busy=true;
  if(cost){if(sp.id!=="ritual")G.spentOther=true;pay(G.active,cost)}
  await sp.run();
  G.busy=wasBusy;render();checkWin();
}
const etherHas=k=>G.ether.some(c=>k==="soldier"?/^\d+$/.test(c.rank):kind(c)===k);
async function conjure(k){
  const list=G.ether.filter(c=>k==="soldier"?/^\d+$/.test(c.rank):kind(c)===k);
  const c=pick(list);G.ether.splice(G.ether.indexOf(c),1);
  c.owner=G.active;me().deck.push(c);shuffle(me().deck);log(`A ${KNAME[kind(c)]}'s soul materializes from the Ether into ${plName(G.active)}'s deck.`);
}
async function blessing(){
  const pl=G.active,aces=stacksOf(pl).filter(x=>hasK(x.st,"ace")).length;
  const want=Math.min(6,1+aces+G.ritual),cap=blessCap(pl),n=Math.min(want,cap);
  const d=rollN(n,6),six=d.filter(x=>x.v===6).length;G.blessed=true;
  tray(pl,"Grave Blessing",d,`${six} six${six===1?"":"es"}`);
  log(`Grave Blessing: ${n}d6${cap<want?` (overdraw cap ${cap})`:""} → ${d.map(x=>x.v).join(", ")}. ${six?six+" card"+(six>1?"s":"")+" may rise.":"Nothing rises."}`);
  render();
  if(six)await pickGrave(pl,six,"Grave Blessing");
}
async function suicideSpell(){
  const s=G.sel,st=selStack();await jokerSuicide(s.r,s.c,st,G.active);
}
/* a Joker kills itself. Works for players and for the Horde (survival) */
async function jokerSuicide(r,c,st,pl){
  const j=st.cards.find(x=>kind(x)==="joker");
  st.cards.splice(st.cards.indexOf(j),1);if(!st.cards.length){G.board[r][c]=null;if(G.sel&&G.sel.r===r&&G.sel.c===c)G.sel=null}
  else if(G.sel)G.sel.pick.delete(j.id);
  const souls=j.captured||[];j.captured=[];
  SND.gun();
  if(isHorde(pl)){ // survival: the player's captured souls go to the Outer Darkness, and the player loses 1 mana
    for(const s of souls)toDark(s);j.owner=pl;
    const P=G.p[0];let lost=0;if(mana(0)>=1){pay(0,1);lost=1}else if(P.souls.length){toGrave(P.souls.shift(),"spent");lost=1}
    log(`A Horde Joker shoots itself: ${souls.length} of your souls fall into the Outer Darkness${lost?" and you lose 1 mana":""}.`,"event");
    flash("A Horde Joker shoots itself.");checkWin();return;
  }
  const m=G.moon;
  if(m.blood){
    toDark(j);for(const s of souls)toDark(s);
    log(`Sacrificial Suicide under the Blood Moon: the Joker and its ${souls.length} soul${souls.length===1?"":"s"} fall into the Outer Darkness.`,"event");
  }else{
    let moved=0,lost=0;
    for(const s of souls){if(addSoul(pl,s))moved++;else{toGrave(s,"spent");lost++}}
    toGrave(j,"death");
    log(`Sacrificial Suicide: the Joker goes to the grave; ${moved} soul${moved===1?"":"s"} join the soul pile${lost?`, ${lost} surplus to the grave`:""}.`);
  }
  render();
  checkWin();
}
async function doubleEdge(){
  const d=rollN(3,6);let mine=0,theirs=0;
  for(const x of d){if(x.v===1){const c=me().deck.pop();if(c){toGrave(c,"burn");mine++}}if(x.v===6){const c=foe().deck.pop();if(c){toGrave(c,"burn");theirs++}}}
  tray(G.active,"Double Edged Sword",d,`you −${mine} · them −${theirs}`);
  log(`Double Edged Sword: 3d6 → ${d.map(x=>x.v).join(", ")}. ${plName(G.active)} loses ${mine}, the enemy loses ${theirs} from the deck.`);
}
async function threeSwords(){
  const n=R(2);tray(G.active,"Three of Swords",[{s:2,v:n}],`${n} each`);
  const F=foe(),P=me();let fl=0,ml=0,dl=0;
  for(let i=0;i<n&&F.hand.length;i++){toGrave(F.hand.splice(Math.floor(Math.random()*F.hand.length),1)[0],"death");fl++}
  for(let i=0;i<n;i++){if(P.hand.length){toGrave(P.hand.splice(Math.floor(Math.random()*P.hand.length),1)[0],"death");ml++}else if(P.deck.length){toGrave(P.deck.pop(),"death");dl++}}
  log(`Three of Swords: 1d2 → ${n}. ${esc(F.name)} loses ${fl} from the hand; ${esc(P.name)} loses ${ml} from the hand${dl?` and ${dl} from the deck`:""}.`);
}
async function clairvoyance(){
  const d=rollN(2,6),n=Math.min(sum(d),me().deck.length);const look=me().deck.slice(-n);
  tray(G.active,"Clairvoyance",d,`look at ${n}`);
  log(`Clairvoyance: 2d6 → ${d[0].v} + ${d[1].v} = ${sum(d)}; ${n} cards revealed to ${plName(G.active)}.`);render();
  const i=await ask(G.active,{kind:"cards",id:"clair",title:`Clairvoyance: choose one of ${n} cards`,cards:look,box:"plain"});
  const P=me(),c=look[i==null?look.length-1:i];P.deck.splice(P.deck.indexOf(c),1);P.hand.push(c);shuffle(P.deck);
  log(`${plName(G.active)} takes a card into the hand and reshuffles.`);
}
function teleOk(){
  if(!selOwn())return false;const s=G.sel,st=selStack();
  if(!ownLines(G.active,s.r)||me().hand.length>=HAND_CAP)return false;
  for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const t=at(s.r+dr,s.c+dc);if(t&&t.owner!==G.active)return false}
  return st.cards.filter(c=>s.pick.has(c.id)).length===1;
}
async function teleport(){
  const st=selStack(),c=st.cards.find(x=>G.sel.pick.has(x.id));
  st.cards.splice(st.cards.indexOf(c),1);me().hand.push(c);
  if(!st.cards.length){G.board[G.sel.r][G.sel.c]=null;G.sel=null}else G.sel.pick.delete(c.id);
  log(`Teleport: ${esc(nameOf(c))} returns to the hand.`);checkWin();
}
async function nakedHand(){
  const F=foe();F.shownUntil=G.turnNo;F.seen=true;
  log(`<b>Naked Hand</b>: ${plName(G.active)} sees ${esc(F.name)}'s hand. ${esc(F.name)}, your cards have been seen.`,"event");
  if(!me().cpu&&F.cpu)flash(`You see the computer's hand until your turn ends.`);
  if(me().cpu&&!F.cpu)flash(`The computer has seen your hand.`);
}

/* ---------------- the computer opponent (plain code, no language model) ----------------
   Each turn it weighs offense against defense from the board and the decks:
   offense pushes stacks forward, surrounds enemies and casts curses; defense bunkers
   (Kings with Queens, Aces in the back), shields threatened stacks and keeps the deck full.
   Easy adds noise and mistakes; Medium balances; Hard plays every edge it can find. */
const AI=(()=>{
  const LV={
    easy:  {mc:14,noise:.45,thr:.5, spell:.45,skipMove:.35,bias:-.15,draw:3},
    medium:{mc:30,noise:.1, thr:.5, spell:.9, skipMove:.04,bias:0,  draw:2},
    hard:  {mc:48,noise:0,  thr:.46,spell:1,  skipMove:0,  bias:.12,draw:2},
    horde: {mc:36,noise:0,  thr:.4, spell:0,  skipMove:0,  bias:1,  draw:0}
  };
  const L=pl=>LV[G.p[pl].cpu]||LV.medium;
  const lvl=pl=>G.p[pl].cpu;
  const jit=pl=>1+(Math.random()*2-1)*L(pl).noise;
  const OFF={atk:1.3,def:.7,dist:.35,ally:.1},DEF={atk:.8,def:1.35,dist:.06,ally:.35},HORDE={atk:1.5,def:.35,dist:.7,ally:.05};
  let cache=new Map();
  const key=st=>st.cards.map(c=>c.id).join(".")+(st.odds||"");
  function winP(A,D,n){
    const k=key(A)+"|"+key(D);if(cache.has(k))return cache.get(k);
    let w=0;for(let i=0;i<n;i++){const a=rollStack(A,"atk",D,A.odds),d=rollStack(D,"def",A,D.odds);if(a.total>d.total)w++}
    const p=w/n;cache.set(k,p);return p;
  }
  function value(st){let v=0;for(const c of st.cards){v+=1+soulOf(c)*.8+rate(c)/7;if(kind(c)==="joker")v+=2+capMana(c)*1.4;if(kind(c)==="ace")v+=3}return v}
  function killsOnHit(st){if(st.cards.length===1||hasK(st,"ace"))return true;const low=[...st.cards].sort((a,b)=>nat(a)-nat(b))[0];return kind(low)==="king"}
  function threat(st){
    if(hasK(st,"ace"))return 1+(hasK(st,"joker")?3:0);
    let t=Math.max(0,...st.cards.map(c=>kind(c)==="joker"?7:rate(c)))/4+st.cards.length*.4;
    const j=st.cards.find(c=>kind(c)==="joker");if(j)t+=2.5+capMana(j);
    return t;
  }
  const gain=E=>(killsOnHit(E)?value(E):value(E)/E.cards.length)+threat(E)*.35;
  const loss=S=>killsOnHit(S)?value(S):value(S)/S.cards.length;
  const dist=(r1,c1,r2,c2)=>Math.abs(r1-r2)+Math.abs(c1-c2);
  function enemiesOf(pl){return stacksOf(1-pl)}
  /* how good it is for stack S (owned by pl) to stand at r,c */
  function tileScore(pl,S,r,c,W,canHit){
    const n=L(pl).mc;let opp=0,risk=0,allies=0;
    const diag=jackOnly(S),hits=canHit&&canAttackFrom({cards:S.cards,attacked:false,hypo:S.hypo});
    let near=99;
    for(const e of enemiesOf(pl)){
      const E=e.st,d=dist(r,c,e.r,e.c);near=Math.min(near,d);
      if(hits&&!E.hypo&&adjacent(r,c,e.r,e.c,diag)){
        const p=winP(S,E,n);let sc=p*gain(E)-(1-p)*loss(S);
        const ring=stacksOf(pl).filter(x=>x.st!==S&&adjacent(x.r,x.c,e.r,e.c,false)).length;sc+=ring*.3;
        if(sc>opp)opp=sc;
      }
      const reach=jackOnly(E)?3:2;
      if(d<=reach&&canAttackFrom({cards:E.cards,attacked:false,hypo:E.hypo})&&!S.hypo){
        const p=winP(E,S,n);const rk=p*loss(S)*(d===1?1:.7);if(rk>risk)risk=rk;
      }
    }
    for(const x of stacksOf(pl))if(x.st!==S&&dist(x.r,x.c,r,c)===1)allies++;
    if(near===99)near=0;
    // the Horde and offense push toward the enemy's back line too
    return W.atk*opp-W.def*risk-W.dist*near+W.ally*allies;
  }
  function stance(pl){
    if(isHorde(pl))return HORDE;
    const my=stacksOf(pl).reduce((a,x)=>a+value(x.st),0),th=stacksOf(1-pl).reduce((a,x)=>a+value(x.st),0);
    const deckAdv=(G.p[pl].deck.length-G.p[1-pl].deck.length)/40;
    let o=my/(th+1)+deckAdv+L(pl).bias;
    if(lvl(pl)==="easy")o+=Math.random()*.6-.3;
    if(!G.p[pl].deck.length||!G.p[1-pl].deck.length||G.turnNo>90)return OFF;   // a dry deck ends the waiting game
    return o>1?OFF:DEF;
  }
  function withSel(r,c,ids,fn){const old=G.sel;G.sel={r,c,pick:new Set(ids)};try{return fn()}finally{G.sel=old}}
  const step=()=>{render();return sleep(G.p[G.active].cpu==="horde"?260:420)};

  /* ---------- placement ---------- */
  function placeScore(pl,card,r,c,W){
    const t=G.board[r][c];const S={cards:t?[...t.cards,card]:[card],owner:pl,hypo:t?t.hypo:0};
    const k=kind(card);
    if(t&&hasK(t,"ace")&&k!=="ace")return ((W===DEF?.7:.2)-t.cards.length*.3)*jit(pl);   // cards inside an Ace cannot fight, and die with it
    let s=tileScore(pl,S,r,c,W,false)-(t?tileScore(pl,t,r,c,W,false):0)+value(S)-(t?value(t):0);
    if(k==="ace")s+=lvl(pl)==="hard"?4:2;
    if(k==="queen"&&t&&hasK(t,"king"))s+=W===DEF?3:1.5;
    if(k==="king"&&t&&hasK(t,"queen"))s+=W===DEF?3:1.5;
    if(k==="joker")s+=enemiesOf(pl).some(e=>dist(e.r,e.c,r,c)<=2)?2:.5;
    if(r===frontRow(pl)&&W===OFF)s+=.4;
    if(r===backRow(pl)&&W===DEF)s+=.3;
    return s*jit(pl);
  }
  async function placements(pl,W,keep){
    for(let guard=0;guard<8;guard++){
      const P=G.p[pl];if(P.hand.length<=keep+(P.deck.length?0:1))return;
      let best=null;
      for(const card of P.hand)for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++){
        if(!canPlace(card,r,c))continue;
        const s=placeScore(pl,card,r,c,W);if(!best||s>best.s)best={card,r,c,s};
      }
      if(!best||best.s<.6)return;
      place(best.card,best.r,best.c);cache.clear();await step();
    }
  }
  /* ---------- movement ---------- */
  async function moves(pl,W){
    const lv=L(pl);
    const order=isHorde(pl)?stacksOf(pl).sort((a,b)=>stackRate(b.st)-stackRate(a.st)):stacksOf(pl).sort((a,b)=>{const na=Math.min(99,...enemiesOf(pl).map(e=>dist(a.r,a.c,e.r,e.c))),nb=Math.min(99,...enemiesOf(pl).map(e=>dist(b.r,b.c,e.r,e.c)));return na-nb});
    for(const o of order){
      if(G.over)return;
      const st=G.board[o.r][o.c];if(!st||st!==o.st||st.owner!==pl||st.moved)continue;
      if(Math.random()<lv.skipMove)continue;
      const grp=st.cards.filter(c=>kind(c)!=="ace");if(!grp.length)continue;
      const inAce=hasK(st,"ace");const S={cards:grp,owner:pl,hypo:st.hypo};
      let stay=inAce?(W===DEF?.6:0):tileScore(pl,S,o.r,o.c,W,true);
      const tg=withSel(o.r,o.c,grp.map(c=>c.id),moveTargets);
      let best=null;
      for(const [r,c] of tg){
        const t=G.board[r][c];
        let s;
        if(t){const M={cards:[...t.cards,...grp],owner:pl,hypo:0};s=tileScore(pl,M,r,c,W,true)-tileScore(pl,t,r,c,W,true)+.2}
        else s=tileScore(pl,S,r,c,W,true);
        s*=jit(pl);
        if(!best||s>best.s)best={r,c,s};
      }
      if(best&&best.s>stay+.15){
        G.sel={r:o.r,c:o.c,pick:new Set(grp.map(c=>c.id))};doMove(best.r,best.c);G.sel=null;cache.clear();await step();
      }
    }
  }
  /* ---------- attacks ---------- */
  function bestAttack(pl){
    const lv=L(pl);let best=null;
    for(const {st,r,c} of stacksOf(pl)){
      if(!canAttackFrom(st))continue;
      const tg=withSel(r,c,[],attackTargets);
      for(const [r2,c2] of tg){
        const E=G.board[r2][c2],p=winP(st,E,lv.mc);
        const sc=(p*gain(E)-(1-p)*loss(st))*jit(pl);
        const late=isHorde(pl)?0:G.turnNo>90?Math.min(.25,.1+(G.turnNo-90)/200):!G.p[pl].deck.length?.1:0;
        const jam=isHorde(pl)&&!withSel(r,c,st.cards.filter(x=>kind(x)!=="ace").map(x=>x.id),moveTargets).length;
        const go=p>=(lv.thr-late)*(lvl(pl)==="easy"?(.7+Math.random()*.6):1)||(lvl(pl)!=="easy"&&sc>.4)||(isHorde(pl)&&(killsOnHit(E)&&p>=.2||jam));
        if(go&&(!best||sc>best.sc))best={r,c,r2,c2,sc,p};
      }
    }
    return best;
  }
  async function attacks(pl){
    for(let guard=0;guard<24;guard++){
      if(G.over)return;cache.clear();
      const b=bestAttack(pl);if(!b)return;
      attack(b.r,b.c,b.r2,b.c2);await sleep(isHorde(pl)?420:650);render();
    }
  }
  /* ---------- spells ---------- */
  async function tryCast(id,r,c,ids){
    const sp=SP(id),P=G.p[G.active];
    if(!P.deck.length&&!P.hand.length&&mana(G.active)-spellCost(sp)<=0&&id!=="bless")return false; // never spend the last soul with no deck and no hand
    const ok=()=>r==null?spellReady(sp):withSel(r,c,ids||[],()=>spellReady(sp));
    if(!ok())return false;
    if(r!=null)G.sel={r,c,pick:new Set(ids||[])};
    await cast(sp);G.sel=null;cache.clear();await step();return true;
  }
  async function suicides(pl){
    const lv=lvl(pl);if(lv==="easy"&&Math.random()<.5)return;
    for(const {st,r,c} of stacksOf(pl)){
      const j=st.cards.find(x=>kind(x)==="joker");if(!j||!j.captured||!j.captured.length)continue;
      const cm=capMana(j),room=SOUL_CAP-mana(pl);
      let danger=0;for(const e of enemiesOf(pl))if(dist(e.r,e.c,r,c)<=2&&canAttackFrom({cards:e.st.cards,attacked:false}))danger=Math.max(danger,winP(e.st,st,24));
      const want=(cm>=4&&room>=cm-1)||(cm>=2&&danger>.55)||(lv==="hard"&&cm>=3&&mana(pl)<=2);
      if(want&&!G.moon.blood){await tryCast("suicide",r,c,[]);return}
    }
  }
  async function sacrifices(pl,target,keep){
    const P=G.p[pl];
    while(mana(pl)<target&&P.hand.length>keep){
      const c=[...P.hand].filter(c=>mana(pl)+soulOf(c)<=SOUL_CAP&&kind(c)!=="ace"&&kind(c)!=="joker").sort((a,b)=>rate(a)-rate(b))[0];
      if(!c)break;
      if(rate(c)>14&&mana(pl)>=2)break;
      sacrifice(c,"hand");await step();
    }
  }
  async function necro(pl){
    const lv=lvl(pl),aces=stacksOf(pl).filter(x=>hasK(x.st,"ace")).length;
    if(G.grave.length>=2&&mana(pl)>=(lv==="hard"?1:2)&&(lv!=="easy"||Math.random()<.4)&&(aces>=1||lv==="hard"))await tryCast("ritual");
    if(!(lv==="easy"&&Math.random()<.3))await tryCast("bless");
  }
  async function curses(pl,W){
    const lv=lvl(pl),F=G.p[1-pl],P=G.p[pl],sp=L(pl).spell;
    if(Math.random()>sp)return;
    // shield the most exposed valuable stack
    if((W===DEF||lv==="hard")&&stacksOf(pl).length>=2){
      let best=null;
      for(const x of stacksOf(pl)){if(x.st.hypo)continue;let rk=0;
        for(const e of enemiesOf(pl))if(dist(e.r,e.c,x.r,x.c)<=2&&canAttackFrom({cards:e.st.cards,attacked:false}))rk=Math.max(rk,winP(e.st,x.st,24));
        const v=rk*value(x.st);if(rk>.55&&value(x.st)>7&&(!best||v>best.v))best={...x,v}}
      if(best&&mana(pl)>=3+best.st.cards.length-1)await tryCast("hypo",best.r,best.c,[]);
    }
    if(F.hand.length>=(lv==="hard"?4:5))await tryCast("forced");
    if(F.hand.length>=2&&F.hand.length>=P.hand.length+(lv==="hard"?1:2))await tryCast("three");
    if((P.deck.length>=F.deck.length+(lv==="hard"?5:9))||(F.deck.length<=8&&P.deck.length>F.deck.length))await tryCast("double");
    if(P.hand.length<=1&&P.deck.length>4&&spellCost(SP("clair"))<=3)await tryCast("clair");
    if(lv!=="easy"&&mana(pl)>=6&&G.grave.some(c=>["ace","king","joker"].includes(kind(c))))await tryCast("resur");
  }
  async function odds(pl){
    const lv=L(pl);if(Math.random()>lv.spell)return;
    for(let i=0;i<(lvl(pl)==="hard"?2:1);i++){
      if(mana(pl)<3)return;
      let best=null;
      for(const {st,r,c} of stacksOf(pl)){if(!canAttackFrom(st))continue;
        for(const [r2,c2] of withSel(r,c,[],attackTargets)){const E=G.board[r2][c2],p=winP(st,E,lv.mc);
          if(p>=.28&&p<=.72){const g=gain(E);if(!best||g>best.g)best={r,c,r2,c2,g}}}}
      if(!best)return;
      const E=G.board[best.r2][best.c2];
      if(!E.odds&&await tryCast("hexed",best.r2,best.c2,[]))continue;
      if(!G.board[best.r][best.c].odds)await tryCast("divine",best.r,best.c,[]);
    }
  }
  async function conjures(pl,W){
    const lv=lvl(pl),P=G.p[pl];if(Math.random()>L(pl).spell)return;
    // keep the deck alive with whatever mana is left
    const low=P.deck.length<(lv==="hard"?Math.max(18,P.start*.7):12);
    if(low||mana(pl)>=5){
      const order=lv==="hard"&&stacksOf(pl).filter(x=>hasK(x.st,"ace")).length<2?["ca","ck","cjk","cj","cs"]:W===DEF?["ck","cq","ca","cs"]:["cj","ck","cs","cjk"];
      for(const id of order){if(mana(pl)<(low?1:3))break;await tryCast(id)}
    }
  }
  function shouldDraw(pl){
    const P=G.p[pl],lv=lvl(pl);
    if(!P.deck.length||P.hand.length>HAND_CAP-4+(lv==="easy"?1:0))return false;
    if(lv==="hard")return P.hand.length<=1||(P.hand.length<=2&&P.deck.length>P.start*.5);
    return P.hand.length<=2;
  }
  /* ---------- whole turns ---------- */
  async function turn(pl){
    cache.clear();
    if(G.phase==="draw"){
      for(let n=0;n<3&&shouldDraw(pl);n++){rollDraw();await step()}
      G.phase="prep";await step();
    }
    const W=stance(pl),lv=lvl(pl);
    log(`${plName(pl)} leans to ${W===OFF?"offense":"defense"}.`,"ai");
    await suicides(pl);
    await sacrifices(pl,lv==="hard"?5:lv==="medium"?4:2,lv==="hard"?2:1);
    await necro(pl);
    await curses(pl,W);
    await placements(pl,W,lv==="hard"?1:0);
    await moves(pl,W);
    await odds(pl);
    await conjures(pl,W);
    G.phase="attack";G.sel=null;await step();
    await attacks(pl);
  }
  async function setup(pl){
    const W=DEF,cols=lvl(pl)==="easy"?[0,1,2,3,4]:[1,2,3];
    const c=pick(cols.filter(c=>!G.board[backRow(pl)][c]));
    await sleep(300);placeOpening(pl,backRow(pl),c);render();await sleep(300);
    const prev=G.phase;G.phase="setup";
    await placements(pl,W,lvl(pl)==="hard"?2:1);
    G.phase=prev;
  }
  async function horde(pl){
    cache.clear();
    hordeSpawn();await sleep(700);render();
    G.phase="prep";await step();
    // Horde Jokers: shoot themselves once they hold souls and the player is close
    for(const {st,r,c} of stacksOf(pl)){const j=st.cards.find(x=>kind(x)==="joker");
      if(j&&j.captured&&j.captured.length&&(j.captured.length>=2||Math.random()<.35)){await jokerSuicide(r,c,st,pl);await step();if(G.over)return}}
    await moves(pl,HORDE);
    G.phase="attack";await step();
    await attacks(pl);
  }
  const cardVal=c=>({ace:9,king:8,joker:7.5,jack:6,queen:5.5}[kind(c)]||(num(c)/2+1));
  function choose(pl,spec){
    const lv=lvl(pl);
    if(spec.kind==="cards"){
      const cards=spec.cards;if(!cards.length)return null;
      if(spec.id==="shop"){let b=-1;cards.forEach((c,i)=>{if(costOf(c)<=mana(pl)&&(b<0||cardVal(c)>cardVal(cards[b])))b=i});return b<0||mana(pl)<1?null:b}
      if(lv==="easy"&&Math.random()<.5)return Math.floor(Math.random()*cards.length);
      let b=0;cards.forEach((c,i)=>{if(cardVal(c)>cardVal(cards[b]))b=i});return b;
    }
    if(spec.kind==="yesno"){
      if(spec.id==="fullmoon"){
        if(lv==="easy")return Math.random()<.5;
        const st=spec.target.st,n=stacksOf(pl).length;
        if(n<=1)return false;
        const refuse=mana(pl)*1.1+Math.min(5,G.p[pl].deck.length)*(G.p[pl].deck.length<15?1.4:.7);
        return value(st)<refuse+2;
      }
      return true;
    }
    return null;
  }
  return{turn,setup,horde,choose,winP,value,LV};
})();
async function runCpu(){
  const pl=G.active;G.busy=true;render();
  try{if(isHorde(pl))await AI.horde(pl);else await AI.turn(pl)}catch(e){console.error(e);log("The computer stumbles: "+esc(e.message))}
  if(G.over){G.busy=false;render();return}
  await finishTurn();
}

/* ---------------- Survival ---------------- */
function roman(n){if(n<=0)return "0";const T=[[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];let s="";for(const [v,l] of T)while(n>=v){s+=l;n-=v}return s}
const spawnRank=c=>({joker:100,king:90,jack:80,queen:70}[kind(c)]||num(c));
function hordeSpawn(){
  const r=G.round,pl=1,dice=[];
  const roll=(n,s)=>{let t=0;for(let i=0;i<n;i++){const v=R(s);dice.push({s,v});t+=v}return t};
  let g=0,inf=0,sp=0,cap=0,jk=0;
  if(r<=5){g=roll(1,4)+r;inf=Math.max(0,roll(1,2)-2+r);cap=Math.min(4,Math.ceil(r/2))}
  else if(r<=10){const k=r-5;g=roll(1,4);inf=roll(1,4)+k;sp=Math.max(0,roll(1,2)-1+Math.floor(k/2));cap=roll(3,2)+Math.floor(k/2)}
  else{const k=r-5;g=roll(1,4);inf=roll(1,4)+k;sp=Math.max(0,roll(1,2)-1+Math.floor(k/2));cap=roll(3,2)+2+Math.floor(Math.max(0,r-11)/5);
    while(jk<2){const v=roll(1,4);if(v===4)jk++;else break}}
  // draw the souls from a fresh deck
  const d=freshDeck(),take=(f,n)=>{const out=[];for(let i=d.length-1;i>=0&&out.length<n;i--)if(f(d[i]))out.push(...d.splice(i,1));return out};
  let pool=[...take(c=>kind(c)==="joker",jk),...take(c=>["jack","queen","king"].includes(kind(c)),sp),...take(c=>kind(c)==="infantry",inf),...take(c=>kind(c)==="grunt",g)];
  pool.sort((a,b)=>spawnRank(b)-spawnRank(a));
  const chosen=pool.slice(0,cap);chosen.forEach(c=>c.owner=pl);
  let placed=0,lost=0;
  for(const c of chosen){if(hordePlace(c))placed++;else lost++}
  tray(pl,`Round ${roman(r)} spawn`,dice,`${placed} spawn${placed===1?"":"s"}`);
  log(`Round ${roman(r)}: the Horde rolls ${dice.map(x=>"d"+x.s+":"+x.v).join(" ")}; ${g} grunts, ${inf} infantry${sp?`, ${sp} royals`:""}${jk?`, ${jk} Joker${jk>1?"s":""}`:""}, cap ${cap}. ${placed} spawn${lost?`, ${lost} find no room`:""}.`,"event");
}
function hordePlace(c){
  const pl=1,rows=[frontRow(pl),backRow(pl)];
  // stack onto its own stacks when it can, front line first
  for(const r of rows)for(const col of [2,1,3,0,4]){const st=G.board[r][col];
    if(st&&st.owner===pl&&!hasK(st,"ace")&&stackLegal([...st.cards,c])){st.cards.push(c);return true}}
  for(const r of rows){const free=[0,1,2,3,4].filter(col=>!G.board[r][col]);if(free.length){
    // lean toward the columns where the player's stacks are
    const mine=stacksOf(0);free.sort((a,b)=>Math.min(9,...mine.map(x=>Math.abs(x.c-a)))-Math.min(9,...mine.map(x=>Math.abs(x.c-b))));
    G.board[r][free[0]]={owner:pl,cards:[c],moved:false,attacked:false};return true}}
  // no room: a stronger soul replaces the weakest stack still standing on the Horde's lines, which fades back into the Ether
  let weak=null;for(const r of rows)for(let col=0;col<COLS;col++){const st=G.board[r][col];if(st&&st.owner===pl&&!st.cards.some(x=>x.captured&&x.captured.length)&&(!weak||stackRate(st)<stackRate(weak.st)))weak={st,r,col}}
  if(weak&&stackRate(weak.st)<rate(c)){G.board[weak.r][weak.col]={owner:pl,cards:[c],moved:false,attacked:false};return true}
  return false;
}
function endSurvival(){
  G.over=true;const n=Math.max(0,G.round-1);
  log(`<b>The Horde takes the field.</b> You survived ${n} round${n===1?"":"s"}.`,"win");render();
  $("#ov").className="";
  $("#ov").innerHTML=`<div class="ovbox"><p class="bl roundbig">${roman(n)}</p><h2>You survived ${n} round${n===1?"":"s"}</h2><p class="dim">Your last card on the field fell in round ${roman(Math.max(1,G.round))}.</p><p><button class="btn" id="again">Play again</button></p></div>`;
  $("#ov").hidden=false;$("#again").onclick=showStart;
}

/* ---------------- drawings: platonic solids, dice, moon, cards ---------------- */
const poly=(n,r,rot,cx=0,cy=0)=>Array.from({length:n},(_,i)=>{const a=rot*Math.PI/180+i*2*Math.PI/n;return[+(cx+r*Math.cos(a)).toFixed(2),+(cy+r*Math.sin(a)).toFixed(2)]});
const ring=p=>"M"+p.map(q=>q.join(",")).join("L")+"Z";
const seg=(a,b)=>`M${a.join(",")}L${b.join(",")}`;
function solidPath(s){
  if(s==="tetra"){const t=poly(3,9,-90,0,1.5),m=[0,3.2];return ring(t)+t.map(v=>seg(m,v)).join("")}
  if(s==="cube"){const h=poly(6,9,-90);return ring(h)+[1,3,5].map(i=>seg([0,0],h[i])).join("")}
  if(s==="octa"){const T=[0,-9.5],Rt=[7,0],B=[0,9.5],Lf=[-7,0],F=[1.6,1.4];return ring([T,Rt,B,Lf])+seg(Lf,F)+seg(F,Rt)+seg(T,F)+seg(B,F)}
  if(s==="dodeca"){const o=poly(10,9.5,-90),i=poly(5,4.4,-90);return ring(o)+ring(i)+i.map((v,k)=>seg(v,o[2*k])).join("")}
  if(s==="icosa"){const h=poly(6,9.5,-90),t=poly(3,4.6,-90);let d=ring(h)+ring(t);t.forEach((v,k)=>{const j=2*k;d+=seg(v,h[j])+seg(v,h[(j+1)%6])+seg(v,h[(j+5)%6])});return d}
  return "";
}
function solidSVG(s,color,size){const d=solidPath(s);return `<svg class="sol" viewBox="-11 -11 22 22" width="${size||14}" height="${size||14}" aria-hidden="true"><path d="${d}" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="3.4" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/></svg>`}
function dieSVG(d,col){
  const s=d.s,st=col||"#c9a274",hi=d.v===s,lo=d.v===1&&s>2;
  const fill=hi?"#3a2a14":"#1a120b",A=`fill="${fill}" stroke="${st}" stroke-width="1.3" stroke-linejoin="round"`,I=`fill="none" stroke="${st}" stroke-opacity=".45" stroke-width=".7"`;
  let shape;
  if(s===2)shape=`<circle r="10" ${A}/><circle r="7.4" ${I}/>`;
  else if(s===4)shape=`<path d="${ring(poly(3,12,-90,0,2.5))}" ${A}/>`;
  else if(s===6)shape=`<rect x="-9.5" y="-9.5" width="19" height="19" rx="2" ${A}/>`;
  else if(s===8)shape=`<path d="${ring(poly(4,11.4,-90))}" ${A}/><path d="${seg([-8,0],[8,0])}" ${I}/>`;
  else if(s===12)shape=`<path d="${ring(poly(5,11.2,-90,0,.6))}" ${A}/><path d="${ring(poly(5,6.4,-90,0,.6))}" ${I}/>`;
  else if(s===20){const h=poly(6,11.4,-90),t=poly(3,7,-90,0,.8);let k="";t.forEach((v,i)=>{k+=seg(v,h[2*i])});shape=`<path d="${ring(h)}" ${A}/><path d="${ring(t)+k}" ${I}/>`}
  else shape=`<path d="${ring(poly(4,11,-90))}" ${A}/>`;
  const ty=s===4?5.2:s===12?1.2:s===20?1.4:0,fs=d.v>=10?7.6:9;
  return `<svg class="die${d.x?" x":""}" viewBox="-13 -13 26 26" width="36" height="36" role="img" aria-label="d${s} rolled ${d.v}"${d.x?' opacity=".32"':""}>${shape}<text x="0" y="${ty}" dominant-baseline="central" text-anchor="middle" font-family="Cascadia Code,Consolas,monospace" font-size="${fs}" font-weight="400" fill="${hi?"#ffffff":lo?"#ff8f86":"#f3d6a6"}">${d.v}</text></svg>`;
}
function moonPath(i,r){
  const f=i/8;if(i===0)return "";if(i===4)return `<circle r="${r}"/>`;
  const rx=(r*Math.abs(Math.cos(2*Math.PI*f))).toFixed(2);
  if(f<.5)return `<path d="M0,${-r}A${r},${r} 0 0 1 0,${r}A${rx},${r} 0 0 ${f<.25?0:1} 0,${-r}Z"/>`;
  return `<path d="M0,${-r}A${r},${r} 0 0 0 0,${r}A${rx},${r} 0 0 ${f>.75?1:0} 0,${-r}Z"/>`;
}
function moonSVG(){
  const m=G.moon,r=30,red=m.blood,lit=red?"#d3171e":"#f2ebd8",dark=red?"#3b0608":"#1f1913",glow=red?"#ff2a2a":"#fff2cf";
  return `<svg class="moon${red?" red":""}" viewBox="-44 -44 88 88" width="88" height="88" aria-hidden="true">
<defs><radialGradient id="mglow"><stop offset="50%" stop-color="${glow}" stop-opacity=".42"/><stop offset="100%" stop-color="${glow}" stop-opacity="0"/></radialGradient><filter id="mblur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".9"/></filter></defs>
<circle r="${r+13}" fill="url(#mglow)"/>
<g filter="url(#mblur)"><circle r="${r}" fill="${dark}" stroke="${red?"#8a1418":"#8a7a66"}" stroke-width="1"/><g fill="${lit}">${moonPath(m.i,r)}</g></g></svg>`;
}
function moonStrip(){
  const m=G.moon;
  return `<div class="mstrip" aria-label="Moon phases">${MOON.map((n,i)=>`<span class="${i===m.i?"on":""}" title="${n}"><svg viewBox="-9 -9 18 18" width="18" height="18"><circle r="7" fill="${m.blood&&i===4?"#3b0608":"#1f1913"}" stroke="#5a4a3a" stroke-width=".6"/><g fill="${m.blood&&i===4?"#d3171e":"#e9e1cc"}">${moonPath(i,7)}</g></svg></span>`).join("")}</div>`;
}
function face(c,o={}){
  const own=o.owner!==undefined?o.owner:c.owner,P=own!=null&&G.p[own]?G.p[own]:null;
  const col=P?P.color:"#8a8a8a",k=kind(c),sm=o.cls==="sm";
  const rk=c.rank==="JK"?"Joker":c.rank,su=c.rank==="JK"?"✶":SUITS[c.suit];
  return `<span class="cf ${c.color} ${o.cls||""}" style="--pc:${col}" title="${esc(nameOf(c))}"><span class="cx"><b class="rk${c.rank==="JK"?" jk":""}">${rk}</b>${c.rank==="JK"?"":`<i>${su}</i>`}</span><i class="su">${su}</i>${P?`<span class="so">${solidSVG(P.solid,col,sm?12:17)}</span>`:""}${sm?"":`<em class="ty">${TYPEWORD[k]}</em>`}${o.price?`<span class="price">${costOf(c)} mana</span>`:""}</span>`;
}
function back(pl){const P=G.p[pl];return `<span class="cb" style="--pc:${P.color}">${solidSVG(P.solid,P.color,18)}</span>`}
function trayHTML(P,pl){
  const t=P.tray;
  if(!t)return `<div class="tray empty" style="--pc:${P.color}"><span class="tl">${esc(P.name)}'s dice</span><div class="dice"><span class="dim">no rolls yet</span></div></div>`;
  return `<div class="tray" style="--pc:${P.color}"><span class="tl">${esc(t.label)}</span><div class="dice">${t.dice.length?t.dice.map(d=>dieSVG(d,P.color)).join(""):'<span class="dim">no dice</span>'}</div></div>${t.line?`<p class="tline">${esc(t.line)}</p>`:""}`;
}

/* ---------------- UI ---------------- */
let flashT;
function flash(t){const f=$("#flash");if(!f)return;f.textContent=t;f.hidden=false;clearTimeout(flashT);flashT=setTimeout(()=>f.hidden=true,2800)}
function ovShow(html,cls){const o=$("#ov");o.className=cls||"";o.innerHTML=html;o.hidden=false;const f=o.querySelector("button");if(f)f.focus({preventScroll:true})}
function ovHide(){const o=$("#ov");o.hidden=true;o.className="";o.innerHTML=""}
const BOXNAME={limbo:"limbo",outer:"outer",ether:"etherbox",plain:""};
function askHuman(pl,spec){
  return new Promise(res=>{
    const who=G.opts.mode==="local"?`<p class="dim">${esc(G.p[pl].name)} chooses.</p>`:"";
    if(spec.kind==="yesno"){
      ovShow(`<div class="ovbox"><h2>${spec.title}</h2>${who}<p>${spec.text}</p><p class="acts"><button class="btn" id="qy">${esc(spec.yes)}</button> <button class="btn ghost" id="qn">${esc(spec.no)}</button></p></div>`);
      $("#qy").onclick=()=>{ovHide();res(true)};$("#qn").onclick=()=>{ovHide();res(false)};return;
    }
    const cards=spec.cards;
    ovShow(`<div class="ovbox ${BOXNAME[spec.box]||""}"><h2>${spec.title}</h2>${who}${spec.sub?`<p class="dim">${esc(spec.sub)}</p>`:""}<div class="pickrow">${cards.map((c,i)=>`<button class="pk" data-i="${i}" aria-label="${esc(nameOf(c))}">${face(c,{owner:spec.box==="outer"?c.darkOwner:c.owner,price:spec.price})}</button>`).join("")}</div>${spec.cancel?`<p><button class="btn ghost" id="mcancel">${esc(spec.cancel)}</button></p>`:""}</div>`);
    $("#ov").querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{ovHide();res(+b.dataset.i)});
    if(spec.cancel)$("#mcancel").onclick=()=>{ovHide();res(null)};
  });
}
function viewBox(title,cards,box,note,owners){
  const groups={};
  if(box==="ether"){for(const c of cards){const k=/^\d+$/.test(c.rank)?(kind(c)==="grunt"?"Grunts (2–6)":"Infantry (7–10)"):KNAME[kind(c)]+"s";(groups[k]=groups[k]||[]).push(c)}}
  const body=box==="ether"?Object.keys(groups).map(k=>`<h3>${k} <span class="dim">${groups[k].length}</span></h3><div class="pickrow">${(()=>{const by={};for(const c of groups[k]){const key=c.rank+(c.rank==="JK"?c.color:"");(by[key]=by[key]||[]).push(c)}return Object.values(by).sort((a,b)=>num(a[0])-num(b[0])).map(l=>`<span class="ecount">${face(l[0],{owner:null})}<b>×${l.length}</b></span>`).join("")})()}</div>`).join("")
    :`<div class="pickrow">${cards.length?cards.map(c=>face(c,{owner:owners?c.darkOwner:c.owner})).join(""):'<p class="dim">Empty.</p>'}</div>`;
  ovShow(`<div class="ovbox ${BOXNAME[box]||""}"><h2>${title}</h2>${note?`<p class="dim">${note}</p>`:""}${body}<p><button class="btn ghost" id="mcancel">Close</button></p></div>`);
  $("#mcancel").onclick=ovHide;
}
function passScreen(msg){
  return new Promise(res=>{
    G.passing=true;render();
    const P=me();const seen=P.seen;P.seen=false;
    ovShow(`<div class="ovbox"><h2>${esc(msg)}</h2><p>Pass the device to <b>${esc(P.name)}</b>. The cards stay dark until they confirm.</p>${seen?`<p class="seen">Your hand was seen by Naked Hand.</p>`:""}<p><button class="btn" id="ready">I'm ${esc(P.name)}: show my cards</button></p></div>`,"blackout");
    $("#ready").onclick=()=>{ovHide();G.passing=false;render();res()};
  });
}
function end(w,why){
  G.over=true;G.busy=false;log(`<b>${plName(w)} wins</b>: ${why}.`,"win");render();
  const vsCpu=G.opts.mode==="cpu";const title=vsCpu?(w===0?"You win":"The computer wins"):`${esc(G.p[w].name)} wins`;
  ovShow(`<div class="ovbox"><h2>${title}</h2><p>${why}.</p><p><button class="btn" id="again">New game</button></p></div>`);$("#again").onclick=showStart;
}
const PHASES=[["draw","Draw","roll d4s to draw, or skip"],["prep","Prep","sacrifice, cast, place, move"],["attack","Attack","each stack may attack once"]];
function canAct(){return G&&!G.over&&!G.busy&&!G.passing&&!me().cpu&&G.active===view()}
function bars(P){
  const N=Math.max(1,P.start||P.deck.length||1),n=P.deck.length,fill=Math.min(n,N),extra=Math.max(0,n-N);
  const blocks=Array.from({length:N},(_,i)=>`<i class="${i<fill?"f":""}"></i>`).join("");
  const over=extra?`<span class="surplus" style="width:calc(${Math.min(100,extra/N*100).toFixed(2)}% - 4px);grid-template-columns:repeat(${Math.min(extra,N)},1fr)">${"<i></i>".repeat(Math.min(extra,N))}</span>`:"";
  const m=mana(P.i);
  return `<div class="meters"><div class="meter"><span class="bk">Deck</span><div class="deckbar" style="--pc:${P.color};grid-template-columns:repeat(${N},1fr)" role="img" aria-label="Deck ${n} cards of ${N}">${blocks}${over}</div><b class="mv">${n}${extra?` <small>+${extra}</small>`:""}</b></div>
<div class="meter mana"><span class="bk">Mana</span><div class="manabar" role="img" aria-label="Mana ${m} of ${SOUL_CAP}">${Array.from({length:SOUL_CAP},(_,i)=>`<i class="${i<m?"f":""}"></i>`).join("")}</div><b class="mv">${m}/${SOUL_CAP}</b></div></div>`;
}
function pboxHTML(pl,top){
  const P=G.p[pl],act=pl===G.active&&G.phase!=="setup";
  const tag=P.cpu==="horde"?"the Horde":P.cpu?`computer · ${P.cpu}`:TRIBES[P.tribe]?TRIBES[P.tribe].name:"";
  let h=`<div class="ph" style="--pc:${P.color}">${solidSVG(P.solid,P.color,18)}<b>${esc(P.name)}</b><span class="dim">${esc(tag)}</span>${act?'<span class="turnmark">to play</span>':""}</div>`;
  if(P.cpu==="horde"){
    const units=stacksOf(pl).reduce((a,x)=>a+x.st.cards.length,0);
    h+=`<p class="stats"><span>On the field <b>${units}</b> card${units===1?"":"s"} in <b>${stacksOf(pl).length}</b> stack${stacksOf(pl).length===1?"":"s"}</span></p>`;
  }else{
    h+=bars(P);
    const showHand=top;
    if(showHand){
      const open=P.shownUntil&&P.shownUntil===G.turnNo&&!G.passing;
      h+=`<div class="handrow"><span class="bk">Hand ${P.hand.length}/${HAND_CAP}</span>${P.hand.map(c=>open?face(c,{cls:"sm"}):back(pl)).join("")}${open?'<span class="seenmark">seen</span>':""}</div>`;
    }else h+=`<p class="stats"><span>Hand <b>${P.hand.length}/${HAND_CAP}</b></span>${P.od?`<span class="odn">overdrawn <b>${P.od}</b></span>`:""}</p>`;
  }
  if(top)h+=`<div class="traywrap">${trayHTML(P,pl)}</div>`;
  return h;
}
function render(){
  if(!G)return;
  const V=view(),T=1-V,flip=V===1;
  document.body.classList.toggle("passing",!!G.passing);
  // moon
  const m=G.moon,tags=[];
  if(m.blood)tags.push('<span class="tag blood">Blood Moon</span>');
  const eff=m.blood?"New Moon gifts at Full Moon prices; the dead go to the Outer Darkness":m.i===4?"Toll paid, decks shuffled; no drawing, no necromancy":m.i===0?"1d2 cards from the grave; Clairvoyance and Naked Hand cost 6":"";
  const rn=G.moon.round||1;
  $("#moon").innerHTML=`${moonSVG()}<div class="minfo"><span class="mname">${MOON[m.i]}</span>${tags.join("")}${moonStrip()}<span class="meff">${eff||`moon round ${rn} · the moon turns when every player has had a turn`}</span></div>`;
  // round (survival)
  const rd=$("#round");rd.hidden=!survival();if(survival())rd.innerHTML=`<span class="label">Round</span><b class="bl">${roman(Math.max(1,G.round))}</b>`;
  // phases
  if(G.phase==="setup")$("#phases").innerHTML=`<span class="ph-c on"><b>Setup</b><em>${G.setupStep==="ace"?"click a backline tile for your Ace and Jack":"place any opening cards, then press Done"}</em></span>`;
  else if(G.phase==="moon")$("#phases").innerHTML=`<span class="ph-c on"><b>Moon</b><em>the ${MOON[m.i]} takes effect</em></span>`;
  else $("#phases").innerHTML=PHASES.map(([id,n,help])=>`<span class="ph-c ${G.phase===id?"on":""}${id==="draw"&&(G.turnNo===1||G.noDraw)?" skip":""}"><b>${n}</b><em>${help}</em></span>`).join('<i>→</i>');
  const who=me();
  $("#who").innerHTML=G.over?"Game over.":G.passing?"Passing the device…":who.cpu?`<b>${esc(who.name)}</b> is playing…`:`<b>${esc(who.name)}</b>${G.opts.mode==="local"?"":" (you)"} to play`;
  // board
  const rows=[...Array(G.rows).keys()];if(flip)rows.reverse();
  const cols=[...Array(COLS).keys()];if(flip)cols.reverse();
  let tgt=[];const live=canAct();
  if(live&&G.sel&&G.mode==="move")tgt=moveTargets();
  if(live&&G.sel&&G.mode==="attack")tgt=attackTargets();
  const placeT=[];
  if(live&&G.phase==="setup"&&G.setupStep==="ace"){for(let c=0;c<COLS;c++)if(!G.board[backRow(G.active)][c])placeT.push([backRow(G.active),c])}
  else if(live&&G.selHand)for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++)if(canPlace(G.selHand,r,c))placeT.push([r,c]);
  const isT=(r,c,list)=>list.some(([a,b])=>a===r&&b===c);
  $("#board").style.setProperty("--rows",G.rows);
  $("#board").innerHTML=rows.map(r=>{
    const lineName=r===backRow(V)?"your backline":r===frontRow(V)?"your frontline":r===backRow(T)?"enemy backline":r===frontRow(T)?"enemy frontline":"midline";
    const nm=G.opts.mode==="cpu"||survival()?lineName.replace("enemy",survival()?"Horde":"computer's").replace("your","your"):lineName;
    return `<div class="row ${lineName.replace(/\s/g,"-")}"><span class="rl">${nm}</span>`+cols.map(c=>{
      const st=G.board[r][c];
      const cls=["tile"];if(G.sel&&G.sel.r===r&&G.sel.c===c)cls.push("sel");
      if(isT(r,c,tgt))cls.push(G.mode==="attack"?"tatk":"tmove");if(isT(r,c,placeT))cls.push("tplace");
      let inner="";
      if(st){
        const lead=st.cards.find(x=>kind(x)==="ace")||[...st.cards].sort((a,b)=>nat(b)-nat(a)||kind(b).localeCompare(kind(a)))[0];
        const P=G.p[st.owner],mine=st.owner===V;
        const cap=st.cards.reduce((a,x)=>a+capMana(x),0);
        inner=`<div class="stack ${mine?"mine":"theirs"} ${lead.color}" style="--pc:${P.color}"><span class="so">${solidSVG(P.solid,P.color,16)}</span>${st.cards.length>1?`<span class="cnt">×${st.cards.length}</span>`:""}<span class="lead"><b class="rk${lead.rank==="JK"?" jk":""}">${lead.rank==="JK"?"Joker":lead.rank}</b><i>${lead.rank==="JK"?"✶":SUITS[lead.suit]}</i></span><span class="mini">${st.cards.length>1?st.cards.map(short).join(" "):""}</span><em class="ty">${TYPEWORD[kind(lead)]}</em>${st.odds?`<span class="odds ${st.odds}">${st.odds==="adv"?"▲":"▼"}</span>`:""}${st.hypo?`<span class="hypo" title="Hypostasis: untouchable">◈${st.hypo}</span>`:""}${cap?`<span class="souls" title="captured souls">✦${cap}</span>`:""}${st.owner===G.active&&(st.moved||st.attacked)&&G.phase!=="setup"?`<span class="used">${st.attacked?"atk":"mv"}</span>`:""}</div>`;
      }
      return `<button class="${cls.join(" ")}" data-r="${r}" data-c="${c}" aria-label="${lineName} column ${c+1}${st?", "+st.cards.map(nameOf).join(", "):", empty"}">${inner}</button>`;
    }).join("")+"</div>";
  }).join("");
  $("#board").querySelectorAll(".tile").forEach(b=>b.onclick=()=>tileClick(+b.dataset.r,+b.dataset.c));
  // player boxes
  $("#foe").innerHTML=pboxHTML(T,true);$("#me").innerHTML=pboxHTML(V,false);
  $("#me").style.setProperty("--pc",G.p[V].color);$("#foe").style.setProperty("--pc",G.p[T].color);
  $("#shared").innerHTML=`<button class="link limbo-l" id="seegrave">Grave <b>${G.grave.length}</b></button><button class="link" id="seeether">Ether <b>${G.ether.length}</b></button><button class="link dark-l" id="seedark">Outer Darkness <b>${G.dark.length}</b></button>`;
  $("#seegrave").onclick=()=>viewBox("The Grave",G.grave,"limbo","Shared by both players. The dead sleep here until something raises them.");
  $("#seeether").onclick=showEther;
  $("#seedark").onclick=()=>viewBox("The Outer Darkness",G.dark,"outer","Nothing here returns. Each card bears the symbol of the player who held it when it fell.",true);
  // hand
  const P=G.p[V];
  $("#handh").textContent=G.opts.mode==="local"?`${P.name}'s hand`:"Your hand";
  const hidden=G.passing;
  $("#hand").innerHTML=P.hand.length?P.hand.map((c,i)=>hidden?back(V):`<div class="hc"><button class="cardbtn ${G.selHand===c?"on":""}" data-h="${i}" aria-label="${esc(nameOf(c))}">${face(c)}</button>${live&&sacrificeAllowed()?`<button class="mini-btn" data-sh="${i}" title="Sacrifice to your soul pile (+${soulOf(c)} mana)">sac +${soulOf(c)}</button>`:""}</div>`).join(""):'<p class="dim">No cards in hand.</p>';
  $("#hand").querySelectorAll("[data-h]").forEach(b=>b.onclick=()=>{
    if(!canAct())return;
    if(!(G.phase==="setup"&&G.setupStep==="more"||G.phase==="prep")){flash(G.phase==="setup"?"Place your Ace and Jack first.":"Cards are placed during setup or the prep phase.");return}
    const c=P.hand[+b.dataset.h];G.selHand=G.selHand===c?null:c;G.mode=null;render()});
  $("#hand").querySelectorAll("[data-sh]").forEach(b=>b.onclick=()=>{if(!canAct())return;sacrifice(P.hand[+b.dataset.sh],"hand");render()});
  $("#mytray").innerHTML=hidden?"":trayHTML(P,V);
  // controls
  const ctl=[];
  if(live&&G.phase==="draw")ctl.push(`<button class="btn" id="d4" ${P.deck.length?"":"disabled"}>Roll d4 and draw</button>`);
  if(live&&G.phase!=="moon")ctl.push(`<button class="btn ghost" id="next">${G.phase==="setup"?"Done setting up":G.phase==="draw"?"To prep phase →":G.phase==="prep"?"To attack phase →":"End turn →"}</button>`);
  ctl.push(`<button class="btn ghost sm" id="snd" aria-pressed="${SND.on}">sound: ${SND.on?"on":"off"}</button>`);
  $("#controls").innerHTML=ctl.join("");
  if($("#d4"))$("#d4").onclick=()=>{if(!canAct())return;rollDraw();render()};
  if($("#next"))$("#next").onclick=nextPhase;
  $("#snd").onclick=()=>{SND.toggle();render()};
  renderSel(live);
  renderSpells(live);
  $("#log").innerHTML=G.log.map(l=>`<li class="${l.cls}">${l.html}</li>`).join("");
}
function renderSpells(live){
  const box=$("#spells");
  if(survival()&&false)return;
  const m=G.moon;
  box.classList.toggle("bloodmoon",!!m.blood);
  const P=me(),od=G.p[G.active].od;
  const head=!live?`<p class="dim">${G.passing?"":me().cpu?"The computer is casting.":"Spells are cast during your prep phase."}</p>`:G.phase==="prep"?"":G.opts.atkSpells&&G.phase==="attack"?'<p class="dim">Enchantments, curses and sorcery can be cast now.</p>':'<p class="dim">Spells are cast during the prep phase.</p>';
  box.innerHTML=head+SCHOOLS.map(sc=>`<h4>${sc}</h4>`+SPELLS.filter(s=>s.school===sc&&!(survival()&&["forced","double","three","naked"].includes(s.id))).map(s=>{
    const ok=live&&spellReady(s),cost=spellCost(s);
    let moon="";if((s.id==="clair"||s.id==="naked")){if(newPrices())moon="moon-dark";else if(fullPrices())moon="moon-bright"}
    let extra="";if(s.id==="bless"&&od)extra=`<small class="odpen ${od>6?"big":""}">−${od}d6 max</small>`;
    const block=spellBlock(s);
    return `<button class="spell ${ok?"":"off"} ${moon} ${s.school==="Necromancy"?"nec":""} ${s.id==="sever"&&P.sevArmed?"armed":""}" data-s="${s.id}" title="${esc(block||s.text)}"><span>${esc(s.name)}${extra}</span><em>${s.id==="hypo"&&!selOwn()?"3+":cost?cost+" mana":"free"}</em></button>`}).join("")+(sc==="Conjuring"?`<button class="link souls-l" id="showsouls">show available souls</button>`:"")).join("");
  box.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{if(!canAct())return;cast(SP(b.dataset.s))});
  $("#showsouls").onclick=showEther;
}
function showEther(){viewBox("The Ether: Souls to Materially Conjure",G.ether,"ether",`${G.ether.length} souls wait in the Ether for a conjuring. Flesh Severance sends exiled souls back here.`)}
function renderSel(live){
  const box=$("#selbox"),st=selStack();
  if(G.phase==="setup"&&G.setupStep==="ace"&&live){box.innerHTML=`<p>Your Ace rises with a Jack inside it. Click a highlighted tile on your backline.</p>`;return}
  if(G.selHand){box.innerHTML=`<p><b>${esc(nameOf(G.selHand))}</b> selected. Click a highlighted tile in your two lines to place it${kind(G.selHand)==="ace"?" (Aces go on an empty backline tile)":kind(G.selHand)==="joker"?" (Jokers spawn onto your stack holding a card of the same color)":""}.</p>`;return}
  if(!st){box.innerHTML='<p class="dim">Select a stack on the board, or a card in your hand.</p>';return}
  const mine=st.owner===G.active&&live,s=G.sel;
  const rows=st.cards.map(c=>{
    const k=kind(c),cap=capMana(c);
    const chk=mine&&k!=="ace"&&G.phase==="prep"?`<input type="checkbox" data-pk="${c.id}" ${s.pick.has(c.id)?"checked":""} aria-label="include ${esc(nameOf(c))} in the moving group">`:"";
    const sac=mine&&sacrificeAllowed()&&canSacOnField(st,c)?`<button class="mini-btn" data-sc="${c.id}">sac +${soulOf(c)}</button>`:"";
    return `<li>${chk}${face(c,{cls:"sm"})} ${esc(TYPEWORD[k])} · ${nat(c)}${die(c)?" + d"+die(c):""}${cap?` · ✦${cap} captured`:""} ${sac}</li>`}).join("");
  const acts=[];
  const owner=G.p[st.owner].name;
  box.innerHTML=`<p><b>${st.owner===G.active?"Your":esc(owner)+"'s"} stack</b> · ${st.cards.length} card${st.cards.length>1?"s":""}${st.odds?` · ${st.odds==="adv"?"Divine Odds":"Hexed Odds"}`:""}${st.hypo?` · Hypostasis (${st.hypo})`:""}${st.moved?" · moved":""}${st.attacked?" · attacked":""}</p><ul class="cards">${rows}</ul><div class="acts">${acts.join("")}</div>${mine&&G.phase==="prep"?`<p class="dim">${st.moved?"This stack has moved this turn.":"Highlighted tiles show where it can go: click one to move. Uncheck any card you want to leave behind. Click the stack again to let go."}</p>`:""}${mine&&G.phase==="attack"?`<p class="dim">${canAttackFrom(st)?(attackTargets().length?"Click a highlighted enemy stack to attack it.":"No enemy stack is in reach."):"This stack can't attack now."}</p>`:""}`;
  box.querySelectorAll("[data-pk]").forEach(i=>i.onchange=()=>{const id=+i.dataset.pk;i.checked?s.pick.add(id):s.pick.delete(id);G.mode=autoMode(st);render()});
  box.querySelectorAll("[data-sc]").forEach(b=>b.onclick=()=>{const c=st.cards.find(x=>x.id===+b.dataset.sc);sacrifice(c,{r:s.r,c:s.c});render()});
}
/* selecting your own stack shows where it can go (prep) or what it can hit (attack) straight away */
function autoMode(st){
  if(!st||st.owner!==G.active||!canAct())return null;
  if(G.phase==="prep"&&!st.moved)return "move";
  if(G.phase==="attack"&&canAttackFrom(st))return "attack";
  return null;
}
function tileClick(r,c){
  if(!G||G.over||G.passing)return;
  const live=canAct();
  if(live&&G.phase==="setup"&&G.setupStep==="ace"){
    if(r===backRow(G.active)&&!G.board[r][c]){placeOpening(G.active,r,c);render()}else flash("Your Ace goes on an empty tile of your backline.");return}
  if(live&&G.selHand){if(canPlace(G.selHand,r,c)){place(G.selHand,r,c);render()}else flash("That card can't be placed there.");return}
  if(live&&G.sel&&G.mode==="move"&&moveTargets().some(([a,b])=>a===r&&b===c)){doMove(r,c);render();return}
  if(live&&G.sel&&G.mode==="attack"&&attackTargets().some(([a,b])=>a===r&&b===c)){attack(G.sel.r,G.sel.c,r,c);G.mode=null;if(G.sel&&!G.board[G.sel.r][G.sel.c])G.sel=null;render();return}
  if(G.busy)return;
  const st=G.board[r][c];
  if(!st||(G.sel&&G.sel.r===r&&G.sel.c===c)){G.sel=null;G.mode=null;render();return}
  G.sel={r,c,pick:new Set(st.cards.filter(x=>kind(x)!=="ace").map(x=>x.id))};G.mode=autoMode(st);render();
}

/* ---------------- card and spell info ---------------- */
const INFO={
 grunt:["Grunt","2 to 6",[["Score","its number + 1d6 on attack; its number alone on defense (+1d6 with a Queen)"],["Dice Max / MSV","6 / 24: four Grunts stack together"],["Soul","1 mana"],["Conjure","Soldier Conjure, 1 mana"],["Moves","one tile straight per turn"]],"The foot soldiers. Every card in a stack is one more hit it can take, and damage always removes the lowest card first."],
 infantry:["Infantry","7 to 10",[["Score","its number + 1d8 on attack; its number alone on defense (+1d8 with a Queen)"],["Dice Max / MSV","8 / 24: three Infantry stack together"],["Soul","1 mana"],["Conjure","Soldier Conjure, 1 mana"],["Moves","one tile straight per turn"]],"Heavier soldiers. They mix with Grunts, Jacks, Kings and Queens as long as the stacking formula holds."],
 jack:["Jack (Knight)","J",[["Score","10 + 1d12 on attack"],["Defense","cannot defend: a Jack adds nothing to its stack's defense"],["Dice Max / MSV","12 / 24: stacks with two Grunts or one Infantry"],["Moves","two tiles straight, or one diagonal, when only Jacks move"],["Attacks","a stack of only Jacks may also attack diagonally"],["Soul","1 mana · Jack Conjure, 1 mana"]],"Every player opens the game with a Jack inside their Ace. Move it out to fight."],
 queen:["Queen","Q",[["Score","0, no die of her own"],["Gift","everyone stacked with her rolls their dice on defense as well as attack"],["King","a King stacked with her takes no penalty for rolling a 1"],["Limits","one Queen per stack; no Dice Max or MSV; she cannot attack alone"],["Soul","2 mana · Queen Conjure, 2 mana"]],"The heart of a defensive stack. Pair her with a King to bunker down."],
 king:["King","K",[["Score","11 + 1d20 on attack"],["Rolls","a 20 deals double damage (or takes none on a failed attack); a 1 deals no damage on a win and takes two on a loss, unless a Queen is with him"],["Alone","cannot attack"],["Defeated in defense","every card stacked with him dies"],["Dice Max / MSV","20 / 28: lower cards adopt his MSV"],["Soul","2 mana · King Conjure, 2 mana · can't be sacrificed from a stack"]],"The strongest attacker, and the most dangerous to lose."],
 ace:["Ace","A",[["Defense","11 + 1d20 when attacked; cards inside it don't roll on defense"],["Limits","cannot move or attack; only on an empty backline tile; holds up to six cards"],["Falls","if the Ace takes damage, it and every card inside it are destroyed; on a roll of 1 it deals no damage back"],["Grave Blessing","+1d6 for each Ace you have on the field"],["Soul","3 mana · Ace Conjure, 3 mana · can't be sacrificed on the field, except to the Full Moon"],["Opening","each player starts with an Ace from their deck on a backline tile of their choice, holding a Jack"]],"A fortress and a grave-caller. Hard computers stack Aces to roll more Grave Blessing dice."],
 joker:["Joker (Necromancer)","Joker",[["Score","alone, copies the score and die of the enemy's leading card; Jokers can't kill Jokers"],["Spawns","only onto your stack holding a card of the same color (red or black)"],["Soul Capture","enemies that die on the 8 tiles around it, or its own tile, are held inside it, up to 6 mana of souls"],["Held souls","it keeps them until it dies (it and its souls go to the grave, unless an enemy Joker beside it steals them) or until Sacrificial Suicide moves them to your soul pile"],["Blood Moon","a Joker that shoots itself under a Blood Moon sends itself and every soul it held to the Outer Darkness"],["Survival","Horde Jokers capture your souls; when one shoots itself those cards go to the Outer Darkness and you lose 1 mana"],["Soul","1 mana · Joker Conjure, 2 mana"]],"The necromancer of the deck, and the only way to turn kills into mana."]
};
function infoHTML(){
  const tabs=Object.keys(INFO).map((k,i)=>`<button class="itab ${i===0?"on":""}" data-k="${k}">${INFO[k][0]}</button>`).join("");
  const spells=SCHOOLS.map(sc=>`<h4>${sc}</h4><dl>`+SPELLS.filter(s=>s.school===sc).map(s=>`<dt>${esc(s.name)} <span>${s.id==="hypo"?"3 + 1 per extra card":s.cost?s.cost+" mana":"free"}</span></dt><dd>${esc(s.text)}</dd>`).join("")+"</dl>").join("");
  return `<details class="cinfo"><summary>Card info</summary><div class="itabs">${tabs}</div><div id="ibody"></div></details>
<details class="cinfo"><summary>Spells explained</summary><div class="spellinfo">${spells}<p class="dim">New Moon: Clairvoyance and Naked Hand cost 6. Full Moon: Clairvoyance costs 2, Naked Hand is free, and no necromancy is cast. Blood Moon: Full Moon prices with no Full Moon drawbacks; necromancy is allowed. The moon turns one phase per round, once every player has had a turn.</p></div></details>`;
}
function infoBody(k){const [t,rk,rows,note]=INFO[k];return `<h4>${t} <span class="bl">${rk}</span></h4><table>${rows.map(([a,b])=>`<tr><th>${a}</th><td>${b}</td></tr>`).join("")}</table><p class="dim">${note}</p>`}
function mountInfo(){
  const box=$("#info");if(!box)return;box.innerHTML=infoHTML();$("#ibody").innerHTML=infoBody("grunt");
  box.querySelectorAll(".itab").forEach(b=>b.onclick=()=>{box.querySelectorAll(".itab").forEach(x=>x.classList.toggle("on",x===b));$("#ibody").innerHTML=infoBody(b.dataset.k)});
}

/* ---------------- start screen ---------------- */
const MODES=[
 ["local","Local 1v1","Two players share one device. The board turns to whoever is playing, and the screen goes dark while you pass it."],
 ["cpu","Versus Computer","Play a coded opponent at Easy, Medium or Hard. It weighs offense against defense every turn."],
 ["survival","Survival","Hold the line alone against a Horde that grows every round. Count the rounds you last."]];
let startMode=null;
function playerForm(n,label,defColor,defSolid,defTribe){
  return `<fieldset class="pf"><legend>${label}</legend>
<label class="f">Name <input id="nm${n}" value="${label}" maxlength="20"></label>
<div class="f"><span>Substance</span><div class="opts">${Object.entries(TRIBES).map(([k,t])=>`<label class="opt"><input type="radio" name="tr${n}" value="${k}" ${k===defTribe?"checked":""}><span>${t.name}<small>${t.sub}</small></span></label>`).join("")}</div></div>
<div class="f"><span>Color</span><div class="opts swatches">${COLORS.map(([nm,hex],i)=>`<label class="sw" title="${nm}"><input type="radio" name="co${n}" value="${hex}" ${i===defColor?"checked":""}><span style="--pc:${hex}"></span><em>${nm}</em></label>`).join("")}</div></div>
<div class="f"><span>Symbol</span><div class="opts solids">${Object.entries(SOLIDS).map(([k,nm])=>`<label class="so-opt" title="${nm}"><input type="radio" name="so${n}" value="${k}" ${k===defSolid?"checked":""}><span>${solidSVG(k,"#f3d6a6",28)}<em>${nm}</em></span></label>`).join("")}</div></div>
</fieldset>`;
}
const val=name=>{const e=document.querySelector(`input[name="${name}"]:checked`);return e&&e.value};
const chk=(id,label,sub,on)=>`<label class="chk"><input type="checkbox" id="${id}" ${on?"checked":""}> <span><b>${label}</b>${sub?`<small>${sub}</small>`:""}</span></label>`;
function showStart(){
  if(G)G.over=true;
  applyMoonTheme();
  const q=new URLSearchParams(location.search).get("mode");
  if(!startMode&&MODES.some(m=>m[0]===q))startMode=q;
  if(!startMode){
    ovShow(`<div class="ovbox setup"><h2>New game</h2><p class="dim">Choose how to play.</p><div class="modes">${MODES.map(([k,t,s])=>`<button class="mode" data-m="${k}"><b>${t}</b><span>${s}</span></button>`).join("")}</div><p class="dim">Online play is not here yet.</p></div>`);
    document.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{startMode=b.dataset.m;showStart()});return;
  }
  const mode=startMode,M=MODES.find(m=>m[0]===mode);
  const forms=mode==="local"?`<div class="pgrid">${playerForm(1,"Player One",0,"tetra","binah")+playerForm(2,"Player Two",3,"icosa","tiph")}</div>`:playerForm(1,mode==="survival"?"Survivor":"Player One",0,"tetra","binah");
  const diff=mode==="cpu"?`<fieldset class="pf"><legend>Computer</legend><div class="opts">${[["easy","Easy","an easier version: it plays loosely and misses chances"],["medium","Medium","balanced, and a real fight"],["hard","Hard","goes all out on your field and your deck"]].map(([k,t,s],i)=>`<label class="opt"><input type="radio" name="diff" value="${k}" ${i===1?"checked":""}><span>${t}<small>${s}</small></span></label>`).join("")}</div></fieldset>`:"";
  const rules=`<fieldset class="pf"><legend>Field</legend>
${mode==="survival"?'<p class="dim">Survival always uses the midline.</p>':chk("omid","Use the midline","An empty line between the two armies.",true)}
${chk("olock","Optional Ace rule","Cards inside an Ace must match its color.",false)}
</fieldset>
<fieldset class="pf"><legend>Mana</legend>
<label class="f">Starting mana <select id="omana"><option value="3d2" selected>3d2 (default)</option><option value="1d6">1d6</option><option value="none">None</option>${[1,2,3,4,5,6].map(n=>`<option value="${n}">${n}</option>`).join("")}</select></label>
${chk("oeach","Each player rolls their own","Off: one roll sets the same starting mana for everyone.",false)}
<p class="dim">Starting souls come from the Ether as soldier souls, worth 1 mana each.</p>
</fieldset>
<fieldset class="pf"><legend>Moon and spells</legend>
${chk("omoon","Moon combat bonus","+1d2 to every attack at the Full Moon, +1d2 to every defense at the New Moon.",true)}
${chk("oatk","Spells in the attack phase","Enchantments, curses and sorcery can also be cast while attacking. Necromancy, conjuring and sacrifices stay in prep.",false)}
${chk("oblood","Blood Moon mode","The game opens on a Blood Moon. Each deck is shuffled and two thirds of it go to the grave; each player starts with a Joker in hand.",false)}
</fieldset>`;
  const display=`<fieldset class="pf"><legend>Your hand</legend><div class="opts">
<label class="opt"><input type="radio" name="dhand" value="side" ${PREF.hand!=="below"?"checked":""}><span>Beside the field<small>In the right-hand column, above the spells.</small></span></label>
<label class="opt"><input type="radio" name="dhand" value="below" ${PREF.hand==="below"?"checked":""}><span>Under your deck and mana<small>Right below your own bars, with your dice box.</small></span></label></div></fieldset>
<fieldset class="pf"><legend>Page theme</legend><div class="opts">${Object.entries(THEMES).map(([k,[n]])=>`<label class="opt"><input type="radio" name="dtheme" value="${k}" ${PREF.theme===k?"checked":""}><span>${n}<small>${({"":"the burnt amber of the site",jester:"black, after chapter 26",ten:"white on indigo, after chapters 1–4",satan:"crimson, after chapter 23"})[k]}</small></span></label>`).join("")}</div><p class="dim">A Blood Moon overrides the theme while it lasts. Card icon size, interface size, hand position and theme can also be changed at the bottom of the screen during play.</p></fieldset>`;
  const tabs=[["players",mode==="cpu"?"Players":"Player",forms+diff],["rules","Rules",rules],["display","Display",display]];
  ovShow(`<div class="ovbox setup"><div class="shead"><h2>${M[1]}</h2><p class="dim">${M[2]}</p></div>
<div class="stabs" role="tablist">${tabs.map(([k,t],i)=>`<button type="button" role="tab" class="stab ${i?"":"on"}" data-t="${k}" aria-selected="${!i}">${t}</button>`).join("")}</div>
${tabs.map(([k,,h],i)=>`<div class="spanel" data-p="${k}" role="tabpanel" ${i?"hidden":""}>${h}</div>`).join("")}
<p class="acts sfoot"><button class="btn" id="go">${mode==="survival"?"Raise your Ace":"Roll for the opening"}</button> <button class="btn ghost" id="back">← Other modes</button> <a class="dim" href="ethers-crossroads-rules.html#modes">How the modes work</a></p></div>`);
  document.querySelectorAll(".stab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".stab").forEach(x=>{x.classList.toggle("on",x===b);x.setAttribute("aria-selected",x===b)});document.querySelectorAll(".spanel").forEach(p=>p.hidden=p.dataset.p!==b.dataset.t)});
  $("#back").onclick=()=>{startMode=null;history.replaceState(null,"",location.pathname);showStart()};
  $("#go").onclick=()=>{
    const pl=n=>({name:($("#nm"+n).value.trim()||(n===1?"Player One":"Player Two")).slice(0,20),tribe:val("tr"+n),color:val("co"+n),solid:val("so"+n)});
    let players;
    if(mode==="local"){players=[pl(1),pl(2)];if(players[0].color===players[1].color){flash("Pick two different colors.");return}}
    else if(mode==="cpu"){const a=pl(1),d=val("diff");
      const tribe=a.tribe==="binah"?"tiph":"binah",color=pick(COLORS.map(c=>c[1]).filter(c=>c!==a.color)),solid=pick(Object.keys(SOLIDS).filter(s=>s!==a.solid));
      players=[a,{name:`The ${TRIBES[tribe].name} computer`,tribe,color,solid,cpu:d}]}
    else{const a=pl(1);players=[a,{name:"The Horde",color:HORDE_COLOR,solid:pick(Object.keys(SOLIDS).filter(s=>s!==a.solid)),cpu:"horde"}]}
    PREF.hand=val("dhand")||PREF.hand;PREF.theme=val("dtheme")??PREF.theme;savePrefs();applyPrefs();
    startGame({mode,players,mid:mode==="survival"||!!($("#omid")&&$("#omid").checked),aceLock:$("#olock").checked,bloodStart:$("#oblood").checked,
      startMana:$("#omana").value,manaEach:$("#oeach").checked,moonBonus:$("#omoon").checked,atkSpells:$("#oatk").checked});
  };
}
function startGame(opts){
  ovHide();newGame(opts);applyMoonTheme();render();
  opening().catch(e=>{console.error(e);log("Error: "+esc(e.message))});
}
document.addEventListener("DOMContentLoaded",()=>{
  mountInfo();mountBar();applyPrefs();guardLinks();mountQuotes();showStart();
  $("#newgame").onclick=()=>confirmLeave(()=>{startMode=null;showStart()});
});
window.__EC={get G(){return G},startGame,stackLegal,canPlace,nextPhase,render,AI,SP,cast,SPELLS,hordeSpawn,roman,moonSVG,
  force(o){G.forceMoon=o},runCpu,jokerSuicide,mk};

/* ---------------- display preferences, page themes, leave warning, quotes ---------------- */
const PREF=(()=>{let p={};try{p=JSON.parse(localStorage.getItem("ec-prefs")||"{}")}catch(e){}return Object.assign({hand:"side",ci:1,ui:1,theme:""},p)})();
function savePrefs(){try{localStorage.setItem("ec-prefs",JSON.stringify(PREF))}catch(e){}}
const THEMES={"":["Kenoma",[]],jester:["Jester",["th-black","th-jester"]],ten:["Ten",["th-indigo","th-blue"]],satan:["Disturbed Satan",["th-crimson"]]};
function applyMoonTheme(){
  const h=document.documentElement,b=!!(G&&G.moon.blood&&!G.over);
  for(const k in THEMES)for(const c of THEMES[k][1])h.classList.remove(c);
  h.classList.remove("bloodglitch");
  if(b)h.classList.add("th-crimson","bloodglitch");        // a Blood Moon overrides every page theme
  else for(const c of THEMES[PREF.theme]?THEMES[PREF.theme][1]:[])h.classList.add(c);
  if(window.nwkStatic)window.nwkStatic.level(b?3:1);
}
function applyPrefs(){
  const h=document.documentElement;
  h.style.setProperty("--ci",PREF.ci);h.style.setProperty("--uiz",PREF.ui);
  const wrap=$("#handwrap"),slot=$("#handslot"),side=$("#sidehand");
  if(wrap&&slot&&side){const dest=PREF.hand==="below"?slot:side;if(wrap.parentNode!==dest)dest.appendChild(wrap)}
  document.body.classList.toggle("hand-below",PREF.hand==="below");
  const bar=$("#gbar");
  if(bar){$("#ciV").textContent=Math.round(PREF.ci*100)+"%";$("#uiV").textContent=Math.round(PREF.ui*100)+"%";$("#pHand").textContent="Hand: "+(PREF.hand==="below"?"under your deck":"side");$("#pTheme").value=PREF.theme}
  applyMoonTheme();
}
function mountBar(){
  const L=document.createElement("div");L.id="gbarL";L.className="gbar";
  L.innerHTML=`<label>Theme <select id="pTheme">${Object.entries(THEMES).map(([k,[n]])=>`<option value="${k}">${n}</option>`).join("")}</select></label>`;
  const Rb=document.createElement("div");Rb.id="gbar";Rb.className="gbar";
  Rb.innerHTML=`<span class="gctl">Card Icons <button type="button" data-z="ci" data-d="-1" aria-label="Smaller card icons">−</button><b id="ciV"></b><button type="button" data-z="ci" data-d="1" aria-label="Bigger card icons">+</button></span><span class="gctl">UI Size <button type="button" data-z="ui" data-d="-1" aria-label="Smaller interface">−</button><b id="uiV"></b><button type="button" data-z="ui" data-d="1" aria-label="Bigger interface">+</button></span><button type="button" id="pHand" class="gtog"></button>`;
  document.body.append(L,Rb);
  $("#pTheme").onchange=e=>{PREF.theme=e.target.value;savePrefs();applyPrefs()};
  Rb.querySelectorAll("[data-z]").forEach(b=>b.onclick=()=>{const k=b.dataset.z,lim=k==="ci"?[.8,1.8]:[.8,1.4];PREF[k]=Math.round(Math.min(lim[1],Math.max(lim[0],PREF[k]+ +b.dataset.d*.1))*10)/10;savePrefs();applyPrefs()});
  $("#pHand").onclick=()=>{PREF.hand=PREF.hand==="below"?"side":"below";savePrefs();applyPrefs()};
}
/* leaving mid-game asks first */
const inGame=()=>G&&!G.over;
function confirmLeave(go){
  if(!inGame()){go();return}
  let box=$("#leavebox");if(!box){box=document.createElement("div");box.id="leavebox";document.body.appendChild(box)}
  box.innerHTML=`<div class="ovbox" role="alertdialog" aria-labelledby="lvq"><h2 id="lvq">Are you sure you want to end your game session?</h2><p class="dim">The game in progress will be lost.</p><p class="acts"><button class="btn" id="lvy">End the session</button> <button class="btn ghost" id="lvn">Keep playing</button></p></div>`;
  box.hidden=false;$("#lvn").focus();
  $("#lvy").onclick=()=>{box.hidden=true;go()};$("#lvn").onclick=()=>{box.hidden=true};
}
function guardLinks(){
  document.querySelectorAll(".game .crumbs a").forEach(a=>a.addEventListener("click",e=>{if(!inGame())return;e.preventDefault();confirmLeave(()=>{location.href=a.href})}));
}
/* passages from the book, for whoever is waiting */
function mountQuotes(){
  const Q=window.EC_QUOTES||[],box=$("#quotes");if(!box||!Q.length)return;
  let last=-1;
  const show=()=>{let i;do{i=Math.floor(Math.random()*Q.length)}while(Q.length>1&&i===last);last=i;const q=Q[i];
    $("#qtext").textContent=q.t;$("#qsrc").textContent=`Chapter ${q.n} · ${q.title}`;$("#qtext").parentNode.scrollTop=0};
  $("#qnext").onclick=show;show();setInterval(()=>{if(!document.hidden)show()},75000);
}

})();
