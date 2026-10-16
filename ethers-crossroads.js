/* Ether's Crossroads: local play for 2 to 4, versus the computer, and Survival.
   Rules follow the written rules; where they leave a gap, the digital reading is listed on the
   All Rules page under "How the digital table reads the rules". */
(function(){
"use strict";
/* ---------------- basics ---------------- */
const $=s=>document.querySelector(s);
const R=n=>1+Math.floor(Math.random()*n);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const SPEED={slow:1.7,normal:1,fast:.4};
const sleep=ms=>{const g=G;return new Promise(r=>setTimeout(()=>{if(G===g)r()},G&&G.opts.fast?0:ms*(SPEED[G&&G.opts.cpuSpeed]||1)*(G&&G.speedMul||1)))}; // a new game silently ends the old game's waits
const SUITS={S:"♠",H:"♥",D:"♦",C:"♣"};
const SUITNAME={S:"Spades",H:"Hearts",D:"Diamonds",C:"Clubs"};
let COLS=5;const SOUL_CAP=6, HAND_CAP=6;   // COLS is set by the map for each game; SOUL_CAP is also what a Joker can hold
/* a Substance can raise a player's own limits */
const handCap=pl=>G&&G.p[pl]?({jester:7,beginner:8}[G.p[pl].tribe]||HAND_CAP):HAND_CAP;
const soulCap=pl=>G&&G.p[pl]?({jester:7,beginner:8}[G.p[pl].tribe]||SOUL_CAP):SOUL_CAP;
const pick=a=>a[Math.floor(Math.random()*a.length)];
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

/* ---------------- Substances, colors, symbols ----------------
   A Substance is what a player plays as. Some fix the color and the symbol (the Angel Machine is always Bone and the mask,
   Satan always his dark crimson and the claw); the rest leave both to the player. "soon" ones arrive in the next update. */
const BONE="#e9dfc4",SATAN_RED="#9c1428";
const TRIBES={
 random:{name:"Random",sub:"One of the Substances below, picked when the game starts."},
 beginner:{name:"Beginner",sub:"Eight starting cards, eight mana and an eight-card hand, a second Ace and a Joker in hand, three Grunts already on the field, and Please Don't Hurt Me once a game."},
 angel:{name:"Angel Machine",sub:"Antony's Substance. Always Bone white with the cracked mask. Samson in the deck, Lightning Strike from three bolts, and Three of Swords for 1 mana.",color:BONE,solid:"mask"},
 satan:{name:"Satan",sub:"Always dark crimson with the claw. The Satan card (three hearts, 6d12, stands alone) and the curse Hate.",color:SATAN_RED,solid:"claw"},
 binah:{name:"Binah",sub:"The Southern tribe of the Euclids. Three Slavemasters capture the soldiers they defeat, and the captured come back as armed Slaves. Jokers hit for +3."},
 jester:{name:"Jester Fool",sub:"The Tree of Neither Life Or Death, Puppets for every soldier, the BullGoat, and Deck of Cards. Seven-card hand, seven mana."},
 tiph:{name:"Tiphareth of Kether",sub:"The Northern tribe of the Euclids. Its Traffickers, Auction and Blindfold come in the next update; until then it plays by the plain rules."},
 lucifer:{name:"Lucifer & Ouroboros",sub:"The two Delusions, Deconjured, and Pleasure and Joy. Coming in the next update.",soon:true},
 leviathan:{name:"The Leviathan",sub:"The black serpent on the New Moon. Coming in the next update.",soon:true},
 yald:{name:"Yaldabaoth",sub:"Night's Judgement, God Hunger and Saturn. Coming in the next update.",soon:true}
};
const PLAYABLE=Object.keys(TRIBES).filter(k=>k!=="random"&&!TRIBES[k].soon);
const COLORS=[["Ember","#ee7a3c"],["Gold","#e3b944"],["Verdigris","#45b89c"],["Azure","#4c92e6"],["Violet","#a77de8"],["Rose","#e4648f"],["Crimson","#d7333b"]];   // Bone belongs to the Angel Machine
const SOLIDS={tetra:"Tetrahedron",cube:"Cube",octa:"Octahedron",dodeca:"Dodecahedron",icosa:"Icosahedron"};
const HORDE_COLOR="#97a487";

/* ---------------- cards ---------------- */
let uid=0;
function mk(rank,suit,color){return{id:++uid,rank,suit,color:color||(suit==="H"||suit==="D"?"red":"black"),owner:null}}
/* Substance cards ("wildcards" and special units). solo: stands alone ("ace": alone or inside an Ace); base: holds cards like an Ace.
   atk: attack options; def: defense score; hp: hearts. */
const UNIT={
 samson:{name:"Samson",word:"Mech",hp:2,nat:12,solo:"ace",soul:2,cost:3,diag2:true,
   weapons:[{id:"slug",name:"Slugshot Cannon",text:"3d20, from two tiles away in a straight line or one diagonal; from two away a miss costs him nothing",roll:()=>rollN(3,20),fixed:0,reach:"gun"},
            {id:"blade",name:"Arm Blade",text:"12 + 3d8, up close",roll:()=>rollN(3,8),fixed:12,reach:"melee"},
            {id:"slam",name:"Mech Slam",text:"16 + 1d4, up close",roll:()=>rollN(1,4),fixed:16,reach:"melee"}]},
 antony:{name:"Antony",word:"Angel",hp:2,nat:12,solo:"ace",soul:2,cost:3,diag2:true,
   weapons:[{id:"angel",name:"Antony",text:"12 + 6d4",roll:()=>rollN(6,4),fixed:12,reach:"melee"}]},
 satan:{name:"Satan",word:"Devil",hp:3,nat:0,solo:"alone",soul:3,cost:3,pure:true,defRoll:()=>rollN(6,12),
   weapons:[{id:"satan",name:"Satan",text:"6d12, no modifiers",roll:()=>rollN(6,12),fixed:0,reach:"melee"}]},
 tree:{name:"Tree of Neither Life Or Death",short:"Tree",word:"Tree",hp:3,nat:0,base:true,soul:3,cost:3},
 bullgoat:{name:"BullGoat",word:"Beast",hp:2,nat:10,solo:"alone",soul:2,cost:3,
   weapons:[{id:"gore",name:"Gore",text:"10 + 1d20, up close",roll:()=>rollN(1,20),fixed:10,reach:"melee"},
            {id:"charge",name:"Charge",text:"10 + 2d20, two or three tiles away in a straight, empty line; the BullGoat closes the gap",roll:()=>rollN(2,20),fixed:10,reach:"charge"}]},
 slavemaster:{name:"Slavemaster",word:"Slavemaster",nat:8,die:8,dm:8,msv:24,soul:1,cost:1},
 slave:{name:"Slave",word:"Slave",nat:10,solo:"alone",soul:1,cost:1,noDef:true,
   weapons:[{id:"gun",name:"Rifle",text:"10 + 1d12, from two tiles away in a straight line or one diagonal; from two away a miss costs nothing",roll:()=>rollN(1,12),fixed:10,reach:"gun"}]}
};
const unitOf=c=>c&&c.unit?UNIT[c.unit]:null;
function mkUnit(u,owner){const c=mk(u.toUpperCase(),null,"black");c.unit=u;c.owner=owner;if(UNIT[u].hp){c.hp=UNIT[u].hp;c.maxHp=UNIT[u].hp}return c}
function freshDeck(){const d=[];for(const s of "SHDC")for(const r of ["2","3","4","5","6","7","8","9","10","J","Q","K","A"])d.push(mk(r,s));d.push(mk("JK",null,"red"),mk("JK",null,"black"));return shuffle(d)}
const num=c=>/^\d+$/.test(c.rank)?+c.rank:0;
const kind=c=>c.unit?c.unit:c.rank==="JK"?"joker":c.rank==="A"?"ace":c.rank==="K"?"king":c.rank==="Q"?"queen":c.rank==="J"?"jack":num(c)<=6?"grunt":"infantry";
const nat=c=>c.unit?UNIT[c.unit].nat:({joker:0,ace:11,king:11,queen:0,jack:10}[kind(c)]??num(c));
const die=c=>c.unit?(UNIT[c.unit].die||0):({grunt:6,infantry:8,jack:12,king:20,ace:20,queen:0,joker:0}[kind(c)]);
const DM=c=>c.unit?(UNIT[c.unit].dm||0):({grunt:6,infantry:8,jack:12,king:20,queen:0,joker:0,ace:0}[kind(c)]);
const MSV=c=>c.unit?(UNIT[c.unit].msv||0):({grunt:24,infantry:24,jack:24,king:28}[kind(c)]||0);
const soulOf=c=>c.unit?UNIT[c.unit].soul:({ace:3,king:2,queen:2}[kind(c)]||1);
const COST={jack:1,joker:2,queen:2,king:2,ace:3,grunt:1,infantry:1};
const costOf=c=>c.unit?UNIT[c.unit].cost:COST[kind(c)];
const TYPEWORD={grunt:"Grunt",infantry:"Infantry",jack:"Knight",queen:"Queen",king:"King",ace:"Ace",joker:"Necromancer"};
for(const k in UNIT)TYPEWORD[k]=UNIT[k].word;
const typeWord=c=>c.puppet?"Puppet":TYPEWORD[kind(c)];
const KNAME={grunt:"Grunt",infantry:"Infantry",jack:"Jack",queen:"Queen",king:"King",ace:"Ace",joker:"Joker"};
for(const k in UNIT)KNAME[k]=UNIT[k].short||UNIT[k].name;
const isBase=c=>kind(c)==="ace"||kind(c)==="tree";             // holds other cards inside it
const isHero=c=>!!(c.unit&&UNIT[c.unit].solo);                  // stands alone (or only inside an Ace)
const short=c=>c.unit?(UNIT[c.unit].short||UNIT[c.unit].name):c.rank==="JK"?"JK":c.rank+SUITS[c.suit]+(c.puppet?"p":"");
const nameOf=c=>c.unit?(c.unit==="slave"?`Slave (once the ${({J:"Jack",Q:"Queen",K:"King",A:"Ace"}[c.rank]||c.rank)} of ${SUITNAME[c.suit]})`:UNIT[c.unit].name):c.rank==="JK"?`${c.color==="red"?"Red":"Black"} Joker`:(c.puppet?"Puppet ":"")+(({J:"Jack",Q:"Queen",K:"King",A:"Ace"}[c.rank]||c.rank)+" of "+SUITNAME[c.suit]);
for(const k in UNIT){const U=UNIT[k];U.rt=U.weapons?Math.max(...U.weapons.map(w=>{const d=w.roll();return w.fixed+d.length*d[0].s*.6})):U.nat+(U.die||0)}
const rate=c=>c.unit?UNIT[c.unit].rt+(c.hp||0)*3:nat(c)+(die(c)||0);                 // point rating: best possible score of a card
const stackRate=st=>Math.max(0,...st.cards.map(rate))+(st.cards.length-1)*.5;

/* ---------------- stacks ---------------- */
function stackLegal(cards){
  if(!cards.length)return false;
  if(cards.some(c=>c.unit&&UNIT[c.unit].solo==="alone"))return cards.length===1;   // Satan, the BullGoat and Slaves stand alone
  const aces=cards.filter(isBase);
  if(aces.length>1)return false;
  if(aces.length===1){
    const inside=cards.filter(c=>!isBase(c));
    if(inside.length>6)return false;
    if(kind(aces[0])==="tree"&&inside.some(c=>kind(c)==="king"||c.rank==="10"))return false;   // the Jester doesn't like how Kings and tens taste
    if(kind(aces[0])==="ace"&&G&&G.opts.aceLock&&inside.some(c=>c.color!==aces[0].color))return false;
    return true;
  }
  if(cards.some(isHero))return cards.length===1;   // Samson and Antony stack with nothing but an Ace
  if(cards.filter(c=>kind(c)==="queen").length>1)return false;
  if(cards.filter(c=>kind(c)==="joker").length>1)return false;
  const msv=Math.max(0,...cards.map(MSV)),sum=cards.reduce((a,c)=>a+DM(c),0);
  if(msv===0)return cards.length<=2;            // a lone Queen, a lone Joker, or the two together
  return sum<=msv;
}
const hasK=(st,k)=>st.cards.some(c=>kind(c)===k);
const hasBase=st=>st.cards.some(isBase);

/* ---------------- state ---------------- */
let G=null;
function mkPlayer(i,o){return{i,name:o.name,tribe:o.tribe||null,color:o.color,solid:o.solid,cpu:o.cpu||null,team:o.team!=null?o.team:i,
  deck:[],hand:[],souls:[],sevArmed:false,start:0,od:0,shownUntil:0,seen:false,tray:null,out:false,ctx:null,hist:[],lastSpell:null}}
function newGame(opts){
  uid=0;
  resolveSubstances(opts);
  const M=mapPlan(opts);COLS=M.cols;const rows=M.rows;
  G={opts,rows,map:M,void:M.void,board:Array.from({length:rows},()=>Array(COLS).fill(null)),
     p:opts.players.map((o,i)=>mkPlayer(i,o)),grave:[],ether:[],dark:[],limbo:[],unknown:[],journal:[],
     turnNo:0,active:0,first:0,phase:"setup",setupStep:"ace",
     spent:false,spentOther:false,blessed:false,ritual:0,log:[],sel:null,selHand:null,mode:null,over:false,
     moon:{i:0,blood:false,round:0},
     noDraw:false,round:0,busy:false,passing:false,lastView:null};
  M.teams.forEach((t,i)=>G.p[i].team=t);
  G.zone=Array.from({length:rows},()=>Array(COLS).fill(-1));G.backz=Array.from({length:rows},()=>Array(COLS).fill(-1));
  M.seats.forEach((S,pl)=>{for(const [r,c] of S.zone)G.zone[r][c]=pl;for(const [r,c] of S.back)G.backz[r][c]=pl});
  buildDecks();
}
/* ---------------- decks and the Ether ----------------
   decks: 1 (the two players split one deck: one red and one black suit each), 2 (a full deck each), 3 (a full deck each and a whole third deck in the Ether)
   With more players: a full deck or half a deck each (free-for-all), one deck per team split two suits to a teammate (2v2), or one deck a team shares.
   specials (J Q K A Joker): none (only the opening Ace; the rest wait in the Ether), half (the specials of half your suits), all
   Every player keeps at least one Joker unless that option is off. Whatever specials a player does not start with go to the Ether. */
const RED=["H","D"],BLACK=["S","C"],RANKS=["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
const isSpecial=c=>["jack","queen","king","ace","joker"].includes(kind(c));
const ALL4=["S","H","D","C"];
function deckPlan(o,pls){
  const L=o.layout||"duel",n=o.decks||2,N=pls.length;
  const half=()=>[pick(RED),pick(BLACK)];
  if(L==="duel"){
    let suits;
    if(n===1){
      if(o.suits&&o.suits.length===2){const a=o.suits,b=[RED.find(s=>!a.includes(s)),BLACK.find(s=>!a.includes(s))];suits=[a,b]}
      else{const r=shuffle([...RED]),b=shuffle([...BLACK]);suits=[[r[0],b[0]],[r[1],b[1]]]}
    }else suits=[ALL4,ALL4];
    return{n,suits:suits.slice(0,N),jokers:n===1?shuffle(["red","black"]).map(c=>[c]):[["red","black"],["red","black"]],spare:n===1&&N<2?suits[1]:null};
  }
  if(L.startsWith("team")){ // one deck per team: each teammate gets one red and one black suit
    const suits=[],jokers=[];const byTeam={};
    pls.forEach(pl=>{const t=G.p[pl].team;(byTeam[t]=byTeam[t]||[]).push(pl)});
    const map={};for(const t in byTeam){const r=shuffle([...RED]),b=shuffle([...BLACK]),j=shuffle(["red","black"]);byTeam[t].forEach((pl,k)=>{map[pl]=[[r[k%2],b[k%2]],[j[k%2]]]})}
    pls.forEach(pl=>{suits.push(map[pl][0]);jokers.push(map[pl][1])});
    return{n,suits,jokers,spare:null};
  }
  const full=o.ffaDeck!=="half";   // free-for-all and co-op Survival
  return{n,suits:pls.map(()=>full?ALL4:half()),jokers:pls.map(()=>full?["red","black"]:[pick(["red","black"])]),spare:null};
}
function buildDecks(){
  const o=G.opts,pls=G.p.map((P,i)=>i).filter(i=>!isHorde(i)),plan=deckPlan(o,pls),sp=o.specials||"none";
  G.ether=[];
  pls.forEach((pl,k)=>{
    const P=G.p[pl],mySuits=plan.suits[k];
    let cards=[];for(const s of mySuits)for(const r of RANKS)cards.push(mk(r,s));
    for(const col of plan.jokers[k])cards.push(mk("JK",null,col));
    let keepSuits=sp==="all"?mySuits:sp==="half"?(mySuits.length===4?[pick(RED),pick(BLACK)]:[pick(mySuits)]):[];
    const keepJokers=sp==="all"?9:sp==="half"?Math.floor(plan.jokers[k].length/2):0;let jk=0;
    const deck=[],out=[];
    for(const c of cards){
      if(!isSpecial(c)){deck.push(c);continue}
      if(kind(c)==="joker"){if(jk<keepJokers){deck.push(c);jk++}else out.push(c);continue}
      (keepSuits.includes(c.suit)?deck:out).push(c);
    }
    const take=(list,k2)=>{const i=list.findIndex(c=>kind(c)===k2);return i<0?null:list.splice(i,1)[0]};
    const ace=take(deck,"ace")||take(out,"ace")||mk("A",mySuits[0]);
    const jack=take(deck,"jack")||take(out,"jack")||mk("J",mySuits[0]);
    if(o.jokerSure!==false&&!deck.some(c=>kind(c)==="joker"))deck.push(take(out,"joker")||mk("JK",null,pick(["red","black"])));
    P.opening=[ace,jack];P.opening2=[];
    if(o.hq&&o.mode!=="survival"){const a2=take(deck,"ace")||take(out,"ace")||mk("A",mySuits[mySuits.length-1]);a2.owner=pl;P.opening2=[a2]}
    for(const c of [...deck,ace,jack])c.owner=pl;
    P.deck=shuffle(deck);G.ether.push(...out);
  });
  // a team that shares its deck shares one deck and one soul pile; the hands stay separate
  if(o.shareDeck&&(o.layout||"").startsWith("team")){
    const byTeam={};pls.forEach(pl=>{const t=G.p[pl].team;(byTeam[t]=byTeam[t]||[]).push(pl)});
    for(const t in byTeam){const m=byTeam[t];const d=shuffle(m.flatMap(pl=>G.p[pl].deck)),sl=[];for(const pl of m){G.p[pl].deck=d;G.p[pl].souls=sl}}
  }
  if(plan.spare)for(const s of plan.spare)for(const r of RANKS)G.ether.push(mk(r,s));   // one deck in Survival: the other half waits in the Ether
  if(plan.n===3)G.ether.push(...freshDeck());
  substanceDecks(pls);
  for(const c of G.ether)c.owner=null;
  shuffle(G.ether);
}
const survival=()=>G.opts.mode==="survival";
const isHorde=pl=>G.p[pl]&&G.p[pl].cpu==="horde";
const hordeIx=()=>G.p.findIndex(P=>P.cpu==="horde");
const alive=()=>G.p.filter(P=>!P.out).map(P=>P.i);
const isEnemy=(a,b)=>a!=null&&b!=null&&a!==b&&G.p[a].team!==G.p[b].team;
const enemiesOf=pl=>alive().filter(i=>isEnemy(pl,i));
const alliesOf=pl=>alive().filter(i=>i!==pl&&!isEnemy(pl,i));
const me=()=>G.p[G.active], foe=()=>G.p[enemiesOf(G.active)[0]??(G.active===0?1:0)];
const human=pl=>!G.p[pl].cpu;
const humans=()=>G.p.filter(P=>!P.cpu&&!P.out).map(P=>P.i);
function view(){ // which player sits at the bottom of the screen
  const hs=G.p.filter(P=>!P.cpu).map(P=>P.i);
  if(!hs.length)return G.lastView??0;
  if(hs.length===1)return hs[0];
  if(!G.p[G.active].cpu)G.lastView=G.active;   // several people on one device: whoever is playing
  return G.lastView??hs[0];
}
const seat=pl=>G.map.seats[pl];
const canSpawn=(pl,r,c)=>G.zone[r][c]===pl;
const isBack=(pl,r,c)=>G.backz[r][c]===pl;
const backTiles=pl=>seat(pl).back.filter(([r,c])=>!isVoid(r,c));
const zoneTiles=pl=>seat(pl).zone.filter(([r,c])=>!isVoid(r,c));
const isFront=(pl,r,c)=>canSpawn(pl,r,c)&&!isBack(pl,r,c);
/* kept for the two-player field: the rows of player 0 (bottom) and player 1 (top) */
function backRow(pl){return seat(pl).back[0][0]}
function frontRow(pl){const z=seat(pl).zone.find(([r,c])=>!isBack(pl,r,c));return z?z[0]:backRow(pl)}
const ownLines=(pl,r,c)=>c==null?G.zone[r].includes(pl):canSpawn(pl,r,c);
function stacksOf(pl){const out=[];G.board.forEach((row,r)=>row.forEach((st,c)=>{if(st&&st.owner===pl)out.push({st,r,c})}));return out}
function at(r,c){return r>=0&&r<G.rows&&c>=0&&c<COLS?G.board[r][c]:undefined}
const isVoid=(r,c)=>!!(G.void&&G.void[r]&&G.void[r][c]);
const hq=()=>!!G.opts.hq&&!survival();
const centerOut=()=>{const m=(COLS-1)/2;return [...Array(COLS).keys()].sort((a,b)=>Math.abs(a-m)-Math.abs(b-m)||a-b)};
/* per-player turn state: in phases everyone plays at once, each player keeps their own */
const TURNKEYS=["spent","spentOther","blessed","ritual","sevSum","prices","sel","selHand","mode","noDraw"];
function setActive(pl){
  if(pl===G.active&&G.p[pl].ctx)return;
  const P=G.p[G.active];if(P){P.ctx={};for(const k of TURNKEYS)P.ctx[k]=G[k]}
  G.active=pl;const Q=G.p[pl];if(Q.ctx)for(const k of TURNKEYS)G[k]=Q.ctx[k];
}
/* every action a player takes goes through here: it is recorded, so a later online version can send it to the table */
/* tile names, like chess squares: columns A, B, C… from the left of the field, rows 1, 2, 3… from the bottom */
const coord=(r,c)=>"ABCDEFGHIJ"[c]+(G.rows-r);
/* each player's history of rolls and spells, for the dice box */
function hist(pl,e){const P=G.p[pl];if(!P)return;e.t=Date.now();e.round=G.moon.round;(P.hist=P.hist||[]).unshift(e);if(P.hist.length>80)P.hist.length=80;if(e.kind==="spell")P.lastSpell=e}
function journal(type,args){G.journal.push({t:G.turnNo,pl:G.active,type,args});if(G.journal.length>2000)G.journal.shift()}
/* every log line carries its time to the second, and the color of the first player it names */
function log(html,cls=""){const m=/data-pl="(\d+)"/.exec(html);
  const pl=m?+m[1]:(!cls||cls==="cast")&&["draw","prep","attack"].includes(G.phase)?G.active:null;   // a line that names no one belongs to whoever is acting
  G.log.unshift({html,cls,t:Date.now(),pl});G.log=G.log.slice(0,600)}
const plName=pl=>`<span class="pn" data-pl="${pl}" style="--pc:${G.p[pl].color}">${esc(G.p[pl].name)}</span>`;

/* where cards go when they leave play */
function toDark(c){if(c.captured&&c.captured.length){for(const s of c.captured)toDark(s);c.captured=[]}c.darkOwner=c.owner;G.dark.push(c)}
function toGrave(c,cause){
  if(!c)return;
  if(c.unit&&c.unit!=="slave"){   // Substance cards never lie in the grave
    if(c.hp!=null)c.hp=c.maxHp;c.hate=false;
    if(c.unit==="samson"){G.limbo.push(c);G.p.forEach(Q=>Q.readLimbo=false);return}
    if(c.unit==="antony"){G.unknown.push(c);G.p.forEach(Q=>Q.readUnknown=false);return}
    toDark(c);return;
  }
  if(c.unit==="slave")delete c.unit;
  const m=G.moon;
  if(m.blood&&cause==="death"){toDark(c);return}
  if(c.owner!=null&&G.p[c.owner]&&isHorde(c.owner))return;   // the Horde keeps no grave: its dead simply vanish
  G.grave.push(c);
}

/* ---------------- deck, hand, mana ---------------- */
function draw(pl,n,why,opening){
  const P=G.p[pl];let got=0,burned=0;
  for(let i=0;i<n;i++){const c=P.deck.pop();if(!c)break;
    if(P.hand.length<handCap(pl)){P.hand.push(c);got++}else{toGrave(c,"burn");burned++;if(!opening)P.od++}}
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
  if(mana(pl)+soulOf(c)>soulCap(pl))return false;
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
    zap(){const a=ctx();if(!a)return;const t=a.currentTime+.01;
      const s=noise(a,.5),f=a.createBiquadFilter(),g=a.createGain();f.type="highpass";f.frequency.value=1800;
      g.gain.setValueAtTime(0,t);for(let i=0;i<5;i++){g.gain.linearRampToValueAtTime(.22*(1-i/6),t+i*.07+.004);g.gain.linearRampToValueAtTime(.02,t+i*.07+.05)}g.gain.exponentialRampToValueAtTime(.001,t+.45);
      s.connect(f).connect(g).connect(master);s.start(t);s.stop(t+.5)},
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
  hist(pl,{kind:"roll",name:label,dice:dice.map(d=>d.v!=null?`d${d.s}:${d.v}`:"").filter(Boolean),line:line||"",tile:G.histTile||null});
  if(!quiet&&dice.length)SND.dice(dice.length);
}
/* the weapon a lone Substance card fights with (Samson picks one; the rest have one) */
const soloUnit=st=>st&&st.cards.length===1&&st.cards[0].unit&&UNIT[st.cards[0].unit].weapons?st.cards[0]:null;
function weaponOf(st,mode){const u=soloUnit(st);if(!u)return null;const W=UNIT[u.unit].weapons;return W.find(w=>w.id===mode)||W[0]}
function rollStack(st,mode,enemy,fx,weapon){ // mode: "atk" | "def"
  const once=()=>{
    const parts=[],dice=[];let best=-1,kingRoll=null,aceRoll=null;
    const u=st.cards.length===1&&st.cards[0].unit?st.cards[0]:null;
    if(u&&UNIT[u.unit].weapons){   // Samson, Antony, Satan, the BullGoat, Slaves
      const U=UNIT[u.unit];
      if(mode==="atk"){const w=weapon&&U.weapons.find(x=>x.id===weapon.id)||U.weapons[0],d=w.roll();dice.push(...d);best=w.fixed+sum(d);parts.push(`${U.name} (${w.name}) ${w.fixed?w.fixed+"+":""}${d.map(x=>x.v).join("+")}`)}
      else if(U.defRoll){const d=U.defRoll();dice.push(...d);best=sum(d);parts.push(`${U.name} ${d.map(x=>x.v).join("+")}`)}
      else if(U.noDef){best=0;parts.push(`${U.name} cannot defend`)}
      else{best=U.nat;parts.push(`${U.name} ${U.nat}`)}
      return{total:best,parts,dice,kingRoll};
    }
    if(mode==="def"&&hasK(st,"tree")){parts.push("the Tree cannot defend");return{total:0,parts,dice,kingRoll}}
    const soloJoker=st.cards.length===1&&kind(st.cards[0])==="joker";
    if(soloJoker&&enemy){ // copies score and dice of the enemy's leading card
      const lead=leadCard(enemy);
      if(lead){const d=die(lead),r=d&&(mode==="atk"||hasK(st,"queen"))?R(d):0;if(r)dice.push({s:d,v:r});best=nat(lead)+r;parts.push(`Joker copies ${short(lead)}: ${nat(lead)}${r?"+"+r+" (d"+d+")":""}`)}
      else{best=0;parts.push("Joker: 0")}
      if(mode==="atk"&&st.owner!=null&&G.p[st.owner].tribe==="binah"){best+=3;parts.push("Binah Joker +3")}
      return{total:best,parts,dice,kingRoll};
    }
    const queen=hasK(st,"queen"),ace=hasK(st,"ace");
    for(const c of st.cards){
      const k=kind(c);
      if(mode==="def"&&(k==="jack"||k==="slave")){parts.push(`${short(c)} cannot defend`);continue}
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
    if(mode==="atk"&&hasK(st,"joker")&&st.owner!=null&&G.p[st.owner]&&G.p[st.owner].tribe==="binah"){best+=3;parts.push("Binah Joker +3")}
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
const near8=(r1,c1,r2,c2)=>Math.abs(r1-r2)<=1&&Math.abs(c1-c2)<=1;
const jackOnly=st=>st.cards.every(c=>kind(c)==="jack");
const shielded=pl=>pl!=null&&G.p[pl]&&!!G.p[pl].shield;          // Please Don't Hurt Me
const hated=st=>st.cards.some(c=>c.hate);
function canAttackFrom(st){
  if(st.attacked||st.hypo||st.stun)return false;
  if(hasBase(st))return false;
  const horde=G&&st.owner!=null&&G.p[st.owner]&&isHorde(st.owner);   // the Horde ignores the lone-King and lone-Queen limits
  if(!horde&&st.cards.length===1&&kind(st.cards[0])==="king")return false;
  if(!horde&&st.cards.every(c=>kind(c)==="queen"))return false;
  return true;
}
/* where a weapon reaches from r1,c1: melee (next to it, straight), gun (two away in a straight line, or one diagonal),
   charge (two or three away in a straight line with every tile between empty) */
function reaches(reach,r1,c1,r2,c2){
  const dr=Math.abs(r1-r2),dc=Math.abs(c1-c2);
  if(reach==="melee")return dr+dc===1;
  if(reach==="gun")return dr===1&&dc===1||(dr===2&&dc===0)||(dc===2&&dr===0);
  if(reach==="charge"){
    if(!(dr===0&&(dc===2||dc===3))&&!(dc===0&&(dr===2||dr===3)))return false;
    const sr=Math.sign(r2-r1),sc=Math.sign(c2-c1);
    for(let k=1;k<Math.max(dr,dc);k++){const r=r1+sr*k,c=c1+sc*k;if(isVoid(r,c)||G.board[r][c])return false}
    return true;
  }
  return false;
}
/* every attack the stack on r,c can make: {r,c,mode,ranged} */
function attackOptions(r,c){
  const st=G.board[r][c];if(!st||!canAttackFrom(st))return[];
  const u=soloUnit(st),diag=jackOnly(st),out=[];
  for(let r2=0;r2<G.rows;r2++)for(let c2=0;c2<COLS;c2++){
    const t=G.board[r2][c2];if(!t||!isEnemy(t.owner,st.owner)||t.hypo||shielded(t.owner))continue;
    if(u){for(const w of UNIT[u.unit].weapons)if(reaches(w.reach,r,c,r2,c2))out.push({r:r2,c:c2,mode:w.id,ranged:w.reach==="gun"&&!near8(r,c,r2,c2),w})}
    else if(adjacent(r,c,r2,c2,diag))out.push({r:r2,c:c2,mode:null,ranged:false});
  }
  return out;
}
/* advantage and disadvantage from Divine/Hexed Odds and Hate cancel out pairwise */
function netFx(...fx){let n=0;for(const f of fx){if(f==="adv")n++;if(f==="dis")n--}return n>0?"adv":n<0?"dis":null}
const cmpSign=(a,b)=>a>b?">":a<b?"<":"=";
function attack(r1,c1,r2,c2,mode){
  const A=G.board[r1][c1],D=G.board[r2][c2],atkPl=A.owner,defPl=D.owner;
  const opt=attackOptions(r1,c1).find(o=>o.r===r2&&o.c===c2&&(mode==null||o.mode===mode))||{mode:null,ranged:false};
  const w=weaponOf(A,opt.mode);
  const pureA=hasK(A,"satan"),pureD=hasK(D,"satan");   // Satan fights with no modifiers
  const fxA=pureA?null:netFx(A.odds,hated(A)?"dis":null,hated(D)&&!pureD?"adv":null),fxD=pureD?null:netFx(D.odds,hated(D)?"dis":null);
  const bothSoloJokers=A.cards.length===1&&D.cards.length===1&&kind(A.cards[0])==="joker"&&kind(D.cards[0])==="joker";
  const ra=rollStack(A,"atk",D,fxA,w),rd=rollStack(D,"def",A,fxD);
  G.histTile=`${coord(r1,c1)} → ${coord(r2,c2)}`;
  A.odds=null;D.odds=null;A.attacked=true;G.lastAttack=G.turnNo;
  if(G.opts.moonBonus!==false&&!bothSoloJokers){   // the moon lends a die: Full Moon to the attacker, New Moon to the defender
    if(G.moon.i===4&&!pureA){const v=R(2);ra.total+=v;ra.dice.push({s:2,v});ra.parts.push(`${G.moon.blood?"Blood":"Full"} Moon +${v}`)}
    if(G.moon.i===0&&!pureD){const v=R(2);rd.total+=v;rd.dice.push({s:2,v});rd.parts.push(`New Moon +${v}`)}
  }
  const queenA=hasK(A,"queen");
  let dmgD=0,dmgA=0,notes=[];
  if(w)notes.push(`${w.name}.`);
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
  if(opt.ranged&&dmgA>0){dmgA=0;notes.push("Fired from range: a miss costs the shooter nothing.")}
  const line=`${ra.total}${cmpSign(ra.total,rd.total)}${rd.total}`;
  tray(atkPl,"Attack",ra.dice,line);tray(defPl,"Defense",rd.dice,line,true);G.histTile=null;
  log(`<b>${plName(atkPl)}</b> attacks from ${coord(r1,c1)} to ${coord(r2,c2)}: <span class="dice">${ra.parts.join(", ")}</span> = <b>${ra.total}</b> vs <span class="dice">${rd.parts.join(", ")}</span> = <b>${rd.total}</b> <span class="tot">(${esc(line)})</span>. ${notes.join(" ")} ${dmgD?`Defender takes ${dmgD} damage.`:""}${dmgA?`Attacker takes ${dmgA} damage.`:""}${!dmgA&&!dmgD?"No damage.":""}`,"combat");
  G.fight={A,D,atkPl,defPl};
  if(dmgD){const n=damage(r2,c2,dmgD,true);if(hasK(A,"antony")&&n)addBolts(atkPl,n,"Antony's kill")}
  if(dmgA&&G.board[r1][c1])damage(r1,c1,dmgA,false);
  G.fight=null;
  // the BullGoat's charge carries it up to its target
  if(opt.mode==="charge"&&G.board[r1][c1]===A){const sr=Math.sign(r2-r1),sc=Math.sign(c2-c1),tr=r2-sr,tc=c2-sc;
    if(!G.board[tr][tc]&&!isVoid(tr,tc)){G.board[tr][tc]=A;G.board[r1][c1]=null;A.moved=true;log(`The BullGoat closes the gap to ${coord(tr,tc)}.`)}}
  return{win:dmgD>0,line};
}
/* returns how many cards died */
function damage(r,c,n,defending){
  const st=G.board[r][c];if(!st)return 0;
  const dead=[];
  for(let i=0;i<n&&st.cards.length;i++){
    const base=st.cards.find(isBase);
    if(base&&kind(base)==="ace"){dead.push(...st.cards.splice(0));log("The Ace falls, and every card inside it is destroyed.");break}
    if(base){base.hp--;if(base.hp>0){log(`The Tree of Neither Life Or Death loses a heart (${base.hp} left).`);continue}
      dead.push(...st.cards.splice(0));log("The Tree of Neither Life Or Death falls, and every card in it dies with it.");break}
    st.cards.sort((a,b)=>nat(a)-nat(b));
    const low=st.cards[0];
    if(low.hp>1){low.hp--;log(`${esc(nameOf(low))} loses a heart (${low.hp} left).`);continue}
    const c0=st.cards.shift();dead.push(c0);
    if(kind(c0)==="king"&&defending&&st.cards.length){dead.push(...st.cards.splice(0));log("The King is defeated in defense: all units with it die.")}
  }
  if(!st.cards.length)G.board[r][c]=null;
  if(defending&&dead.length&&G.p[st.owner].tribe==="angel")addBolts(st.owner,dead.length,"a card lost in defense");
  for(const d of dead)bury(d,r,c,st);
  checkWin();
  return dead.length;
}
/* Jokers beside r,c that belong to an enemy of player `of` */
function adjacentJokers(r,c,of){
  const out=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const s=at(r+dr,c+dc);if(s&&isEnemy(s.owner,of)){const j=s.cards.find(x=>kind(x)==="joker");if(j)out.push({j,pl:s.owner})}}
  return out;
}
const capMana=j=>(j.captured||[]).reduce((a,c)=>a+soulOf(c),0);
function bury(card,r,c,st){
  const owner=st.owner;
  if(card.hp!=null)card.hp=card.maxHp;
  if(card.hate)card.hate=false;
  if(card.unit&&buryUnit(card,r,c,owner))return;   // Substance cards have their own fates
  // a Binah Slavemaster takes the soldiers it defeats
  const F=G.fight;
  if(F&&(kind(card)==="grunt"||kind(card)==="infantry")){
    const opp=st===F.D?F.A:st===F.A?F.D:null,op=opp&&opp.owner;
    if(opp&&hasK(opp,"slavemaster")&&isEnemy(op,owner)&&G.p[op].tribe==="binah"&&(G.p[op].thralls||[]).length<10){
      card.owner=op;(G.p[op].thralls=G.p[op].thralls||[]).push(card);
      log(`${plName(op)}'s Slavemaster takes ${esc(nameOf(card))} as a thrall (${G.p[op].thralls.length}/10).`);return}
  }
  if(kind(card)==="joker"&&card.captured&&card.captured.length){
    const souls=card.captured;card.captured=[];let stolen=0;
    for(const s of souls){const f=adjacentJokers(r,c,owner).find(x=>capMana(x.j)+soulOf(s)<=SOUL_CAP);
      if(f){(f.j.captured=f.j.captured||[]).push(s);stolen++}else toGrave(s,"death")}
    log(`The Joker's ${souls.length} captured soul${souls.length>1?"s are":" is"} released${stolen?`; an enemy Joker steals ${stolen}`:""}.`);
  }
  const f=adjacentJokers(r,c,owner).find(x=>capMana(x.j)+soulOf(card)<=SOUL_CAP);
  if(f){
    const taker=f.pl,P=G.p[taker];
    if(P.sevArmed&&taker===G.active){ // half the conjuring price of everything severed this turn, rounded up
      const charge=Math.ceil((G.sevSum+costOf(card))/2)-Math.ceil(G.sevSum/2);
      if(mana(taker)>=charge){if(charge)pay(taker,charge);G.sevSum+=costOf(card);card.owner=null;G.ether.push(card);log(`Flesh Severance: ${esc(nameOf(card))} is exiled to the Ether (${charge} mana).`);return}
    }
    (f.j.captured=f.j.captured||[]).push(card);log(`Soul Capture: ${plName(taker)}'s Joker takes the soul of ${esc(nameOf(card))}.`);return;
  }
  toGrave(card,"death");
}

/* ---------------- win and elimination ---------------- */
function fallen(pl){return hq()?!stacksOf(pl).some(x=>hasK(x.st,"ace")):!stacksOf(pl).length}
function checkWin(){
  if(G.over||G.phase==="setup")return;
  for(const pl of alive()){
    if(isHorde(pl))continue;
    if(fallen(pl))eliminate(pl,hq()?`every base ${plName(pl)} had is destroyed`:`every card ${plName(pl)} had on the field is destroyed`);
    if(G.over)return;
  }
}
function checkEconomic(pl){
  if(survival()||G.p[pl].out)return;
  const P=G.p[pl];
  if(!P.deck.length&&!P.hand.length&&!P.souls.length)eliminate(pl,`${esc(P.name)} has no deck, hand or soul pile left: economic victory`);
}
/* a player is out: their cards leave play, then the game ends if one side is left */
function eliminate(pl,why){
  const P=G.p[pl];if(P.out)return;P.out=true;
  if(survival()){
    log(`<b>${plName(pl)} falls</b>: ${why}.`,"event");
    if(!G.p.some(Q=>!Q.out&&!isHorde(Q.i))){endSurvival();return}
  }else{
    const teams=new Set(alive().map(i=>G.p[i].team));
    if(teams.size<=1){const w=alive()[0];end(w,why);return}
    log(`<b>${plName(pl)} is eliminated</b>: ${why}.`,"event");
  }
  // what is left of them leaves the table
  const toOD=G.opts.elimDark;const dump=c=>{if(toOD)toDark(c);else{c.owner=pl;G.grave.push(c)}};
  for(const {st,r,c} of stacksOf(pl)){for(const x of st.cards){for(const s of x.captured||[])dump(s);x.captured=[];dump(x)}G.board[r][c]=null}
  const shared=alliesOf(pl).some(a=>G.p[a].deck===P.deck);
  for(const c of P.hand.splice(0))dump(c);
  if(!shared){for(const c of P.deck.splice(0))dump(c);for(const c of P.souls.splice(0))dump(c)}
  if(!toOD)shuffle(G.grave);
  log(toOD?`${plName(pl)}'s hand and deck fall into the Outer Darkness.`:`${plName(pl)}'s hand and deck go to the grave, and the grave is shuffled.`);
}

/* ---------------- choices: a person answers in a box, the computer answers in code ---------------- */
async function ask(pl,spec){
  if(G.p[pl].cpu){await sleep(320);return AI.choose(pl,spec)}
  return askHuman(pl,spec);
}
/* the order of play this round, starting with the first player; the Horde moves first in Survival */
function roundOrder(){const n=G.p.length,o=[];for(let k=0;k<n;k++){const pl=(G.first+k)%n;if(!G.p[pl].out)o.push(pl)}return o}
const order=()=>roundOrder().filter(pl=>!isHorde(pl));

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
  while(got<n&&G.grave.length&&G.p[pl].hand.length<handCap(pl)){
    const i=await ask(pl,{kind:"cards",id:"grave",title:`${title}: ${esc(G.p[pl].name)} raises a card (${n-got} left)`,cards:G.grave,cancel:"Stop",box:"limbo"});
    if(i==null||!G.grave[i])break;
    const c=G.grave.splice(i,1)[0];c.owner=pl;G.p[pl].hand.push(c);got++;
    log(`${plName(pl)} raises ${esc(nameOf(c))} from the grave.`);render();
  }
  if(got<n&&G.grave.length&&G.p[pl].hand.length>=handCap(pl))log(`${plName(pl)}'s hand is full.`);
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
        if(c.unit&&buryUnit(c,t.r,t.c,pl))continue;   // Substance cards keep their own fates
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
/* ---------------- turns ----------------
   Turn modes: "classic" (each player takes the whole turn in order), "prep" (everyone draws and preps at the same time,
   then attacks go one player at a time), "all" (every phase at the same time). A phase that is played together ends when
   everyone has pressed Ready. With more than one person on the device, play is always classic. */
function turnMode(){if(G.p.filter(P=>!P.cpu).length>1)return "classic";return G.opts.turns||"classic"}
async function gameLoop(){
  const g=G;
  while(G===g&&!G.over){
    await newRound();if(G!==g||G.over)return;
    const ord=roundOrder(),mode=turnMode(),side=ord.filter(pl=>!isHorde(pl)),horde=ord.filter(isHorde);
    if(mode==="classic"){for(const pl of ord){if(G.p[pl].out)continue;await playerTurn(pl,["draw","prep","attack"]);if(G!==g||G.over)return}continue}
    for(const pl of horde){await playerTurn(pl,["draw","prep","attack"]);if(G!==g||G.over)return}
    await together(side,mode==="all"?["draw","prep","attack"]:["draw","prep"]);if(G!==g||G.over)return;
    if(mode!=="all")for(const pl of side){if(G.p[pl].out)continue;await playerTurn(pl,["attack"],true);if(G!==g||G.over)return}
  }
}
async function newRound(){
  G.moon.round++;if(G.moon.round>1)G.moon.i=(G.moon.i+1)%8;
  if(survival())G.round++;
  log(`— Round ${G.moon.round}${survival()?` (${roman(G.round)})`:""} · ${MOON[G.moon.i]} —`,"turn");
  rollPrices();   // dice prices are rolled once a round, behind the scenes, and hold for every player this round
  log(`Spell prices this round: ${SPELLS.filter(s=>s.dice).map(s=>`${s.name} ${G.roundPrices[s.id]}`).join(", ")} (before the moon's prices).`,"ai");
  G.phase="moon";G.busy=true;render();
  await moonStart();if(G.over)return;
  substanceRound();
  G.busy=false;
}
function beginTurn(pl){
  setActive(pl);G.turnNo++;
  Object.assign(G,{spent:false,spentOther:false,blessed:false,ritual:0,sel:null,selHand:null,mode:null,noDraw:false,sevSum:0});
  G.prices={...(G.roundPrices||{})};
  for(const {st} of stacksOf(pl)){st.moved=false;st.attacked=false;if(st.hypo){st.hypo--;if(!st.hypo)log(`Hypostasis fades from ${plName(pl)}'s stack.`)}}
  G.p[pl].sevArmed=false;
  substanceTurn(pl);
  G.noDraw=fullDrawbacks()||G.moon.round===1&&(turnMode()!=="classic"||pl===G.first);   // the very first turn of the game has no draw
}
function endTurn(pl){
  setActive(pl);substanceEnd(pl);checkEconomic(pl);if(G.over)return;
  const P=G.p[pl];P.od=Math.max(0,P.od-6);
  for(const Q of G.p)if(Q.shownBy===pl){Q.shownUntil=0;Q.shownBy=null}
}
const PHASE_LABEL={draw:"To prep phase →",prep:"To attack phase →",attack:"End turn →"};
async function playerTurn(pl,phases,continuing){
  const g=G;
  if(!continuing)beginTurn(pl);else setActive(pl);
  if(!continuing&&!isHorde(pl))log(`— ${plName(pl)}'s turn —`,"turn");
  if(human(pl)&&G.p.filter(P=>!P.cpu).length>1&&G.lastView!==pl)await passScreen(`${G.p[pl].name}'s turn`);
  for(let k=0;k<phases.length;k++){
    const ph=phases[k];if(ph==="draw"&&G.noDraw)continue;
    G.phase=ph;G.nextLabel=k===phases.length-1?"End turn →":PHASE_LABEL[ph];
    await actPhase(pl,ph);if(G!==g||G.over)return;
  }
  if(phases.includes("attack"))endTurn(pl);
}
async function together(players,phases){
  const g=G;players=players.filter(pl=>!G.p[pl].out);
  for(const pl of players)beginTurn(pl);
  log(`— ${players.map(plName).join(", ")} play ${phases.includes("attack")?"the whole turn":"draw and prep"} together —`,"turn");
  for(let k=0;k<phases.length;k++){
    const ph=phases[k];G.phase=ph;
    const cpus=players.filter(pl=>G.p[pl].cpu&&!G.p[pl].out),hs=players.filter(pl=>!G.p[pl].cpu&&!G.p[pl].out);
    G.speedMul=.5;
    for(const pl of cpus){setActive(pl);if(ph==="draw"&&G.noDraw)continue;await actPhase(pl,ph);if(G!==g||G.over)return}
    G.speedMul=1;
    for(const pl of hs){setActive(pl);if(ph==="draw"&&G.noDraw)continue;G.nextLabel="Ready →";await actPhase(pl,ph);if(G!==g||G.over)return}
  }
  if(phases.includes("attack"))for(const pl of players)endTurn(pl);
}
/* one player plays one phase: the computer in code, a person until they press the button (or the timer runs out) */
async function actPhase(pl,ph){
  setActive(pl);G.phase=ph;
  if(G.p[pl].cpu){G.busy=true;render();try{await AI.phase(pl,ph)}catch(e){console.error(e);log("The computer stumbles: "+esc(e.message))}G.busy=false;render();return}
  G.busy=false;render();
  await new Promise(res=>{G.waiter=res;startTimer(ph)});
  stopTimer();
}
async function nextPhase(){
  if(G.busy||G.over||G.passing)return;
  if(G.phase==="setup"){
    if(G.setupStep==="ace"){flash("First place your Ace and its Jack on a backline tile.");return}
    if(G.setupResolve){const f=G.setupResolve;G.setupResolve=null;stopTimer();f()}
    return;
  }
  journal("next",{phase:G.phase});
  if(G.placing)cancelPlacing();
  if(G.waiter){const f=G.waiter;G.waiter=null;G.mode=null;G.selHand=null;f()}
}
function rollDraw(){
  const n=R(4);tray(G.active,"Draw",[{s:4,v:n}],`draw ${n}`);
  log(`${plName(G.active)} rolls d4: ${n}.`);draw(G.active,n);
}
/* phase timer (off by default): 30, 60 or 90 seconds; the draw phase is 30 under the longer timers */
let timerIv=null;
function startTimer(ph){
  stopTimer();const T=+G.opts.timer||0;if(!T)return;
  const dur=ph==="draw"&&T>30?30:T;G.deadline=Date.now()+dur*1000;
  const g=G;timerIv=setInterval(()=>{
    if(G!==g){stopTimer();return}
    const left=Math.max(0,Math.ceil((G.deadline-Date.now())/1000));const el=$("#timer");if(el){el.textContent=left+"s";el.classList.toggle("low",left<=10)}
    if(left<=0){stopTimer();timeUp()}
  },250);
}
function stopTimer(){if(timerIv)clearInterval(timerIv);timerIv=null;if(G)G.deadline=0;const el=$("#timer");if(el)el.textContent=""}
async function timeUp(){
  log(`Time runs out for ${plName(G.active)}.`,"event");flash("Time's up.");
  if(G.phase==="setup"&&G.setupResolve){const pl=G.active,f=G.setupResolve;G.setupResolve=null;G.busy=true;await AI.setup(pl);G.busy=false;f();return}
  if(G.placing)cancelPlacing();
  if(G.waiter){const f=G.waiter;G.waiter=null;G.mode=null;G.selHand=null;f()}
}

/* ---------------- opening ---------------- */
function startMana(pl,shared){
  const sm=G.opts.startMana||"3d2";if(sm==="none")return;
  let d=shared;
  if(!d)d=sm==="3d2"?rollN(3,2):sm==="1d6"?rollN(1,6):[];
  const n=d.length?sum(d):Math.min(soulCap(pl),+sm||0);let got=0;
  for(let i=0;i<n&&mana(pl)<soulCap(pl);i++){const j=G.ether.findIndex(c=>/^\d+$/.test(c.rank));const c=j>=0?G.ether.splice(j,1)[0]:mk(String(1+R(9)),pick(["S","H","D","C"]));addSoul(pl,c);got++}
  if(d.length)tray(pl,"Starting mana",d,`${got} mana`,true);
  log(`${plName(pl)} starts with ${got} mana${d.length?` (${sm}: ${d.map(x=>x.v).join(" + ")})`:""}.`);
}
function deal(){
  const sm=G.opts.startMana||"3d2",shared=!G.opts.manaEach&&(sm==="3d2"||sm==="1d6")?(sm==="3d2"?rollN(3,2):rollN(1,6)):null;
  G.p.forEach((P,pl)=>{
    if(P.cpu==="horde")return;
    if(G.opts.bloodStart){shuffle(P.deck);const k=Math.floor(P.deck.length*2/3);for(const c of P.deck.splice(0,k))G.grave.push(c);log(`Blood Moon mode: ${k} of ${plName(pl)}'s cards go to the grave.`)}
    if(G.opts.bloodStart){let c=null,from="the Ether";const j=G.ether.findIndex(c=>kind(c)==="joker");if(j>=0)c=G.ether.splice(j,1)[0];else{const d=P.deck.findIndex(c=>kind(c)==="joker");if(d>=0){c=P.deck.splice(d,1)[0];from="the deck"}else{c=mk("JK",null,pick(["red","black"]));from="the moon"}}
      c.owner=pl;P.hand.push(c);log(`A Joker comes from ${from} into ${plName(pl)}'s hand.`)}
    if(P.tribe==="beginner")draw(pl,6,"the Beginner's opening hand",true);
    else{const d=rollN(2,4);tray(pl,"Opening hand",d,`draw ${sum(d)}`,true);
      log(`${plName(pl)} rolls 2d4: ${d[0].v} + ${d[1].v} = ${sum(d)}.`);draw(pl,sum(d),"opening hand",true)}
    dealExtras(pl);
    startMana(pl,shared);
  });
}
async function opening(){
  deal();
  const pls=G.p.map(P=>P.i).filter(i=>!isHorde(i));
  if(survival()){G.first=hordeIx()}
  else{ // everyone rolls a d6; ties at the top roll again
    let pool=pls,rolls={};
    for(;;){for(const pl of pool)rolls[pl]=R(6);const top=Math.max(...pool.map(pl=>rolls[pl]));const best=pool.filter(pl=>rolls[pl]===top);if(best.length===1){G.first=best[0];break}pool=best}
    for(const pl of pls)tray(pl,"Opening roll",[{s:6,v:rolls[pl]}],`${rolls[pl]}`,pl!==pls[0]);
    log(`Opening roll: ${pls.map(pl=>`${plName(pl)} ${rolls[pl]}`).join(", ")}. ${plName(G.first)} sets up first and takes the first turn.`);
  }
  const n=G.p.length,setupOrder=[];for(let k=0;k<n;k++){const pl=(G.first+k)%n;if(!isHorde(pl))setupOrder.push(pl)}
  const many=G.p.filter(P=>!P.cpu).length>1;
  for(const pl of setupOrder){
    setActive(pl);G.phase="setup";G.setupStep="ace";G.sel=null;G.selHand=null;
    if(many&&human(pl))await passScreen(`${G.p[pl].name} sets up`);
    render();
    if(G.p[pl].cpu){G.busy=true;await AI.setup(pl);G.busy=false}
    else await new Promise(res=>{G.setupResolve=res;startTimer("setup")});
  }
  G.p.forEach(P=>P.start=Math.max(1,P.deck.length));
  await gameLoop();
}
function placeOpening(pl,r,c){
  const P=G.p[pl];
  if(P.opening.length){G.board[r][c]={owner:pl,cards:P.opening.splice(0),moved:true,attacked:false};log(`${plName(pl)} raises the opening Ace with its Jack on ${coord(r,c)}.`)}
  else{G.board[r][c]={owner:pl,cards:P.opening2.splice(0),moved:true,attacked:false};log(`${plName(pl)} raises a second Ace as a base on ${coord(r,c)}.`)}
  G.setupStep=P.opening.length||(P.opening2&&P.opening2.length)?"ace":"more";
  if(G.setupStep==="more")setupDone(pl);   // Substances that start with cards on the field
}

/* ---------------- actions ---------------- */
function canPlace(card,r,c){
  if(!canSpawn(G.active,r,c)||isVoid(r,c))return false;
  const st=G.board[r][c],k=kind(card);
  if(k==="ace")return !st&&isBack(G.active,r,c);
  if(k==="tree"||(card.unit&&UNIT[card.unit].solo==="alone"))return !st;   // the Tree, Satan, the BullGoat and Slaves take an empty tile
  if(hq()&&!(st&&st.owner===G.active&&hasK(st,"ace")))return false;   // Headquarters: troops spawn only inside your Aces
  if(k==="joker"){if(!st||st.owner!==G.active)return false;return st.cards.some(x=>x.color===card.color)&&stackLegal([...st.cards,card])}
  if(!st)return true;
  return st.owner===G.active&&stackLegal([...st.cards,card]);
}
function place(card,r,c){
  const P=me(),hi=P.hand.indexOf(card);if(hi>=0)P.hand.splice(hi,1);card.owner=G.active;if(G.placing===card)G.placing=null;
  const st=G.board[r][c];
  if(st)st.cards.push(card);else G.board[r][c]={owner:G.active,cards:[card],moved:G.phase!=="setup",attacked:false};
  log(`${plName(G.active)} places ${esc(nameOf(card))} on ${coord(r,c)}${st?", onto a stack":""}.`);
  G.selHand=null;
}
function moveGroup(){const s=G.sel;if(!s)return[];const st=G.board[s.r][s.c];return st.cards.filter(c=>s.pick.has(c.id))}
function moveTargets(){
  const s=G.sel,st=G.board[s.r][s.c],grp=moveGroup();
  if(!grp.length||st.moved||st.stun||grp.some(isBase))return[];
  const rest=st.cards.filter(c=>!s.pick.has(c.id));
  if(rest.length&&!stackLegal(rest))return[];
  if(!stackLegal(grp))return[];
  const out=[];const jack=grp.every(c=>kind(c)==="jack");const fwd=seat(st.owner).fwd;
  const d2=grp.length===1&&grp[0].unit&&UNIT[grp[0].unit].diag2;   // Samson and Antony: one straight, or one or two diagonal
  for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++){
    if(r===s.r&&c===s.c||isVoid(r,c))continue;
    if(st.hypo&&(r-s.r)*fwd[0]+(c-s.c)*fwd[1]>0)continue;   // Hypostasis: no step toward the enemy
    const dr=Math.abs(r-s.r),dc=Math.abs(c-s.c);
    const okStep=(dr+dc===1)||(jack&&((dr+dc===2&&(dr===0||dc===0))||(dr===1&&dc===1)))||(d2&&dr===dc&&dr<=2);
    if(!okStep)continue;
    if(d2&&dr===2){const mr=(r+s.r)/2,mc=(c+s.c)/2,mid=G.board[mr][mc];if(isVoid(mr,mc)||mid&&isEnemy(mid.owner,st.owner))continue}
    if(jack&&dr+dc===2&&(dr===0||dc===0)){const mr=(r+s.r)/2,mc=(c+s.c)/2,mid=G.board[mr][mc];if(isVoid(mr,mc)||mid&&isEnemy(mid.owner,st.owner))continue}
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
  log(`${plName(st.owner)} moves ${grp.map(short).join(" ")} from ${coord(s.r,s.c)} to ${coord(r,c)}${t?", onto another stack":""}.`);
  G.sel={r,c,pick:new Set(G.board[r][c].cards.filter(x=>!isBase(x)).map(x=>x.id))};G.mode=null;
}
function attackTargets(){
  const s=G.sel;if(!s)return[];const seen=new Set(),out=[];
  for(const o of attackOptions(s.r,s.c)){const k=o.r*16+o.c;if(!seen.has(k)){seen.add(k);out.push([o.r,o.c])}}
  return out;
}
const sacrificeAllowed=()=>G.phase==="prep"&&!G.spent&&!isHorde(G.active);
function sacrifice(card,from){
  const P=me();
  if(mana(G.active)+soulOf(card)>soulCap(G.active)){flash(`The soul pile holds ${soulCap(G.active)} mana at most.`);return false}
  if(from==="hand")P.hand.splice(P.hand.indexOf(card),1);
  else{const st=G.board[from.r][from.c];st.cards.splice(st.cards.indexOf(card),1);
    if(card.captured&&card.captured.length){for(const s of card.captured)toGrave(s,"death");card.captured=[]}
    if(!st.cards.length){G.board[from.r][from.c]=null;G.sel=null}else if(G.sel)G.sel.pick.delete(card.id)}
  addSoul(G.active,card);log(`${plName(G.active)} sacrifices ${esc(nameOf(card))} (+${soulOf(card)} mana).`);
  if(from!=="hand")checkWin();
  return true;
}
const canSacCard=c=>!isBase(c)&&!(c.unit&&UNIT[c.unit].hp);   // the Substance cards with hearts can't be sacrificed
const canSacOnField=(st,c)=>kind(c)!=="ace"&&canSacCard(c)&&!(kind(c)==="king"&&st.cards.length>1);

/* ---------------- spells ---------------- */
const selStack=()=>G.sel&&G.board[G.sel.r]&&G.board[G.sel.r][G.sel.c];
const selOwn=()=>selStack()&&selStack().owner===G.active;
const selEnemy=()=>selStack()&&isEnemy(selStack().owner,G.active);
/* spells aimed at another player: with several enemies, the caster picks one */
async function pickFoe(id,title){const es=enemiesOf(G.active).filter(pl=>!isHorde(pl));const t=es.length<=1?es[0]:await ask(G.active,{kind:"player",id,title,players:es});G.histTarget=t;return t}
const selOwnJoker=()=>selOwn()&&hasK(selStack(),"joker");
const SCHOOLS=["Necromancy","Enchantment","Curse","Sorcery","Conjuring"];
const SPELLS=[
 {id:"ritual",name:"Ritual Dice",cost:1,school:"Necromancy",text:"+2d6 to this turn's Grave Blessing.",ok:()=>!G.blessed&&G.ritual===0&&blessCap(G.active)>0,run:async()=>{G.ritual=2;log("Ritual Dice: two more dice for the Grave Blessing.")}},
 {id:"bless",name:"Grave Blessing",cost:0,school:"Necromancy",text:"Free, once a turn, before any other mana is spent. Roll 1d6, +1d6 per Ace you have on the field, +2d6 from Ritual Dice, 6 dice at most. Each natural 6 raises a card from the grave. Every card you overdrew to the grave takes 1d6 off the maximum.",ok:()=>!G.blessed&&!G.spentOther&&G.grave.length>0&&blessCap(G.active)>0,run:blessing},
 {id:"suicide",name:"Sacrificial Suicide",cost:0,school:"Necromancy",text:"Select your stack with a Joker. The Joker dies and the souls it captured go to your soul pile (6 mana at most; the surplus goes to the grave). Under a Blood Moon, the Joker and all its souls go to the Outer Darkness instead.",ok:()=>!G.spent&&selOwnJoker(),run:suicideSpell},
 {id:"sever",name:"Flesh Severance",cost:0,school:"Necromancy",text:"Arm for this turn: an enemy killed next to your Joker is exiled to the Ether for its conjuring cost instead of being captured.",ok:()=>true,run:async()=>{me().sevArmed=!me().sevArmed;log(`Flesh Severance ${me().sevArmed?"armed":"disarmed"}.`)}},
 {id:"resur",dice:"1d2+1",name:"Resurrection",cost:6,school:"Necromancy",text:"Choose one card from the grave and bring it back into your hand.",ok:()=>G.grave.length>0&&me().hand.length<handCap(G.active),run:async()=>{await pickGrave(G.active,1,"Resurrection")}},
 {id:"divine",dice:"1d2+1",name:"Divine Odds",cost:3,school:"Enchantment",text:"Select your stack: advantage on all its dice for its next combat.",ok:()=>selOwn()&&!selStack().odds,run:async()=>{selStack().odds="adv";log("Divine Odds marks a stack.")}},
 {id:"hypo",name:"Hypostasis",cost:3,school:"Enchantment",text:"Select your stack: it cannot be attacked for two turns. While it lasts it cannot attack or step toward the enemy, only sideways or back. Costs 3 for one card, +1 for each more card in the stack. Needs at least two of your stacks on the field.",ok:()=>selOwn()&&!selStack().hypo&&stacksOf(G.active).length>=2,run:async()=>{const st=selStack();st.hypo=2;log(`Hypostasis: ${plName(G.active)}'s stack of ${st.cards.length} becomes untouchable for two turns.`)}},
 {id:"forced",dice:"1d2",name:"Forced Hand",cost:2,school:"Curse",text:"The other player draws 1d2 cards; any over the hand limit go to the grave (and cut their Grave Blessing).",ok:()=>!survival(),run:async()=>{const t=await pickFoe("forced","Forced Hand: who draws?");const n=R(2);tray(G.active,"Forced Hand",[{s:2,v:n}],`draw ${n}`);draw(t,n,"Forced Hand")}},
 {id:"hexed",dice:"1d2+1",name:"Hexed Odds",cost:3,school:"Curse",text:"Select an enemy stack: disadvantage on all its dice for its next combat.",ok:()=>selEnemy()&&!selStack().odds,run:async()=>{selStack().odds="dis";log("Hexed Odds marks an enemy stack.")}},
 {id:"double",name:"Double Edged Sword",cost:1,school:"Curse",text:"Roll 3d6. Each 1 burns a card from your deck; each 6 burns a card from the enemy's deck.",ok:()=>!survival(),run:doubleEdge},
 {id:"three",dice:"1d3",name:"Three of Swords",cost:3,school:"Curse",text:"Roll 1d2. A 1 destroys one random card in the enemy's hand and one in yours; a 2 destroys two of each. If your hand runs short, the rest comes from your deck. The enemy loses nothing from the deck.",ok:()=>!survival(),run:threeSwords},
 {id:"clair",dice:"2+1d2",name:"Clairvoyance",cost:3,school:"Sorcery",text:"Look at 2d6 cards from your deck, take one into your hand, then reshuffle. 6 mana at the New Moon, 2 at the Full Moon.",ok:()=>me().deck.length>0&&me().hand.length<handCap(G.active),run:clairvoyance},
 {id:"tele",name:"Teleport",cost:2,school:"Sorcery",text:"Select your stack in your own two lines with no enemy beside it and leave exactly one card checked; that card returns to your hand.",ok:teleOk,run:teleport},
 {id:"naked",dice:"1d2",name:"Naked Hand",cost:3,school:"Sorcery",text:"The other player's hand is shown to you for the rest of this turn, and both players are told it has been seen. 6 mana at the New Moon, free at the Full Moon.",ok:()=>!survival()&&enemiesOf(G.active).some(pl=>G.p[pl].hand.length>0),run:nakedHand},
 {id:"cj",name:"Jack Conjure",cost:1,school:"Conjuring",text:"A Jack's soul comes from the Ether into your deck.",ok:()=>etherHas("jack"),run:()=>conjure("jack")},
 {id:"cjk",name:"Joker Conjure",cost:2,school:"Conjuring",text:"A Joker's soul comes from the Ether into your deck.",ok:()=>etherHas("joker"),run:()=>conjure("joker")},
 {id:"cq",name:"Queen Conjure",cost:2,school:"Conjuring",text:"A Queen's soul comes from the Ether into your deck.",ok:()=>etherHas("queen"),run:()=>conjure("queen")},
 {id:"ck",name:"King Conjure",cost:2,school:"Conjuring",text:"A King's soul comes from the Ether into your deck.",ok:()=>etherHas("king"),run:()=>conjure("king")},
 {id:"ca",name:"Ace Conjure",cost:3,school:"Conjuring",text:"An Ace's soul comes from the Ether into your deck.",ok:()=>etherHas("ace"),run:()=>conjure("ace")},
 {id:"cs",name:"Soldier Conjure",cost:1,school:"Conjuring",text:"A soldier's soul (2 to 10) comes from the Ether into your deck.",ok:()=>etherHas("soldier"),run:()=>conjure("soldier")}
];
const SP=id=>SPELLS.find(s=>s.id===id);
/* spells with a dice price roll it once at the start of each round (the same price for everyone that round); the moon's prices replace the roll while that phase lasts */
const PRICE={resur:()=>R(2)+1,divine:()=>R(2)+1,hexed:()=>R(2)+1,forced:()=>R(2),three:()=>R(3),clair:()=>2+R(2),naked:()=>R(2)};
function rollPrices(){G.roundPrices={};for(const k in PRICE)G.roundPrices[k]=PRICE[k]();G.prices={...G.roundPrices}}
function spellCost(sp){
  if(sp.id==="three"&&G.p[G.active]&&G.p[G.active].tribe==="angel")return 1;   // the Angel Machine's Three of Swords
  if(sp.id==="clair"&&newPrices())return 6;
  if(sp.id==="clair"&&fullPrices())return 2;
  if(sp.id==="naked")return newPrices()?6:G.moon.blood?1:fullPrices()?0:(G.prices?G.prices.naked:2);
  if(G.prices&&G.prices[sp.id]!=null)return G.prices[sp.id];
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
const spellMine=sp=>!sp.tribe||G.p[G.active].tribe===sp.tribe;   // Substance spells belong to their Substance
function spellReady(sp){return spellMine(sp)&&phaseOk(sp)&&!spellBlock(sp)&&sp.ok()&&mana(G.active)>=spellCost(sp)}
async function cast(sp){
  if(G.busy&&!me().cpu)return;
  if(!phaseOk(sp)){flash(G.opts.atkSpells?"That school is cast in the prep phase.":"Spells are cast in the prep phase.");return}
  if(!spellMine(sp))return;
  const why=spellBlock(sp);if(why){flash(why);return}
  if(!sp.ok()){flash("That spell can't be cast right now.");return}
  const cost=spellCost(sp);
  if(mana(G.active)<cost){flash("Not enough mana.");return}
  const wasBusy=G.busy;G.busy=true;const caster=G.active;
  const tile=G.sel&&["suicide","divine","hypo","hexed","tele"].includes(sp.id)?coord(G.sel.r,G.sel.c):null;G.histTarget=null;G.histTile=tile;
  if(cost){if(sp.id!=="ritual")G.spentOther=true;pay(G.active,cost)}
  try{await sp.run()}finally{G.histTile=null}
  hist(caster,{kind:"spell",name:sp.name,tile,cost,target:G.histTarget!=null?G.p[G.histTarget].name:null});
  log(`${plName(caster)} casts <b>${esc(sp.name)}</b>${tile?" on "+tile:""}${G.histTarget!=null?" at "+plName(G.histTarget):""}${cost?` (${cost} mana)`:""}.`,"cast");G.histTarget=null;
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
  const why=`1${aces?` + ${aces} for Ace${aces>1?"s":""} on the field`:""}${G.ritual?` + ${G.ritual} from Ritual Dice`:""}${1+aces+G.ritual>6?", 6 at most":""}${cap<want?`, cut to ${cap} by overdrawing`:""}`;
  const d=rollN(n,6),six=d.filter(x=>x.v===6).length;G.blessed=true;
  tray(pl,"Grave Blessing",d,`${six} six${six===1?"":"es"}`);
  log(`Grave Blessing: ${n}d6 (${why}) → ${d.map(x=>x.v).join(", ")}. ${six?six+" card"+(six>1?"s":"")+" may rise.":"Nothing rises."}`);
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
    const victims=[...new Set(souls.map(x=>x.darkOwner).filter(v=>v!=null&&!isHorde(v)))];
    for(const v of victims){const P=G.p[v];if(mana(v)>=1)pay(v,1);else if(P.souls.length)toGrave(P.souls.shift(),"spent")}
    log(`A Horde Joker shoots itself: ${souls.length} captured soul${souls.length===1?"":"s"} fall into the Outer Darkness${victims.length?`; ${victims.map(plName).join(" and ")} lose${victims.length===1?"s":""} 1 mana`:""}.`,"event");
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
  const t=await pickFoe("double","Double Edged Sword: whose deck?"),F=G.p[t];
  const d=rollN(3,6);let mine=0,theirs=0;
  for(const x of d){if(x.v===1){const c=me().deck.pop();if(c){toGrave(c,"burn");mine++}}if(x.v===6){const c=F.deck.pop();if(c){toGrave(c,"burn");theirs++}}}
  tray(G.active,"Double Edged Sword",d,`you −${mine} · them −${theirs}`);
  log(`Double Edged Sword: 3d6 → ${d.map(x=>x.v).join(", ")}. ${plName(G.active)} loses ${mine}, the enemy loses ${theirs} from the deck.`);
}
async function threeSwords(){
  const t=await pickFoe("three","Three of Swords: whose hand?");
  const n=R(2);tray(G.active,"Three of Swords",[{s:2,v:n}],`${n} each`);
  const F=G.p[t],P=me();let fl=0,ml=0,dl=0;
  for(let i=0;i<n&&F.hand.length;i++){toGrave(F.hand.splice(Math.floor(Math.random()*F.hand.length),1)[0],"death");fl++}
  for(let i=0;i<n;i++){if(P.hand.length){toGrave(P.hand.splice(Math.floor(Math.random()*P.hand.length),1)[0],"death");ml++}else if(P.deck.length){toGrave(P.deck.pop(),"death");dl++}}
  log(`Three of Swords (${plName(P.i)}): 1d2 → ${n}. ${plName(F.i)} loses ${fl} from the hand; ${plName(P.i)} loses ${ml} from the hand${dl?` and ${dl} from the deck`:""}.`);
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
  if(!canSpawn(G.active,s.r,s.c)||me().hand.length>=handCap(G.active))return false;
  for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const t=at(s.r+dr,s.c+dc);if(t&&isEnemy(t.owner,G.active))return false}
  return st.cards.filter(c=>s.pick.has(c.id)).length===1;
}
async function teleport(){
  const st=selStack(),c=st.cards.find(x=>G.sel.pick.has(x.id));
  st.cards.splice(st.cards.indexOf(c),1);me().hand.push(c);
  if(!st.cards.length){G.board[G.sel.r][G.sel.c]=null;G.sel=null}else G.sel.pick.delete(c.id);
  log(`Teleport: ${esc(nameOf(c))} returns to the hand.`);checkWin();
}
async function nakedHand(){
  const t=await pickFoe("naked","Naked Hand: whose hand?"),F=G.p[t];F.shownUntil=G.turnNo;F.shownBy=G.active;F.seen=true;
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
  const PUSH={atk:1.5,def:.2,dist:1.1,ally:0},OFF={atk:1.3,def:.7,dist:.35,ally:.1},DEF={atk:.8,def:1.35,dist:.06,ally:.35},HORDE={atk:1.5,def:.35,dist:.7,ally:.05};
  let cache=new Map();
  const key=st=>st.cards.map(c=>c.id+(c.hp||"")).join(".")+(st.odds||"");
  function winP(A,D,n,mode){
    const k=key(A)+"|"+key(D)+"|"+(mode||"");if(cache.has(k))return cache.get(k);
    const w0=weaponOf(A,mode),fa=hasK(A,"satan")?null:netFx(A.odds,hated(A)?"dis":null,hated(D)?"adv":null),fd=hasK(D,"satan")?null:netFx(D.odds,hated(D)?"dis":null);
    let w=0;for(let i=0;i<n;i++){const a=rollStack(A,"atk",D,fa,w0),d=rollStack(D,"def",A,fd);if(a.total>d.total)w++}
    const p=w/n;cache.set(k,p);return p;
  }
  function value(st){let v=0;for(const c of st.cards){v+=1+soulOf(c)*.8+rate(c)/7;if(kind(c)==="joker")v+=2+capMana(c)*1.4;if(kind(c)==="ace")v+=3;if(c.hp)v+=c.hp*2.2;if(kind(c)==="tree")v+=4}return v}
  function killsOnHit(st){const b=st.cards.find(isBase);if(b)return !(b.hp>1);if(st.cards.length===1)return !(st.cards[0].hp>1);const low=[...st.cards].sort((a,b)=>nat(a)-nat(b))[0];return kind(low)==="king"}
  function threat(st){
    if(hasBase(st))return 1+(hasK(st,"joker")?3:0);
    let t=Math.max(0,...st.cards.map(c=>kind(c)==="joker"?7:rate(c)))/4+st.cards.length*.4;
    const j=st.cards.find(c=>kind(c)==="joker");if(j)t+=2.5+capMana(j);
    return t;
  }
  const gain=E=>((killsOnHit(E)?value(E):value(E)/E.cards.length)+threat(E)*.35)*(hq()&&hasK(E,"ace")?3:1);   // in Headquarters the enemy bases are the prize
  const loss=S=>killsOnHit(S)?value(S):value(S)/S.cards.length;
  const dist=(r1,c1,r2,c2)=>Math.abs(r1-r2)+Math.abs(c1-c2);
  /* walking distance around the river and cut corners (straight steps over open tiles) */
  let pcache=new Map();
  function walk(r1,c1,r2,c2){
    if(!G.void||!G.void.some(row=>row.some(Boolean)))return dist(r1,c1,r2,c2);
    const key=r2*16+c2;let F=pcache.get(key);
    if(!F){F=Array.from({length:G.rows},()=>Array(COLS).fill(99));const q=[[r2,c2]];F[r2][c2]=0;
      while(q.length){const [r,c]=q.shift();for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=r+dr,b=c+dc;if(a<0||b<0||a>=G.rows||b>=COLS||isVoid(a,b)||F[a][b]<=F[r][c]+1)continue;F[a][b]=F[r][c]+1;q.push([a,b])}}
      pcache.set(key,F)}
    return F[r1][c1];
  }
  function enemyStacks(pl){return enemiesOf(pl).flatMap(stacksOf)}
  /* how good it is for stack S (owned by pl) to stand at r,c */
  function tileScore(pl,S,r,c,W,canHit){
    const n=L(pl).mc;let opp=0,risk=0,allies=0;
    const diag=jackOnly(S),hits=canHit&&canAttackFrom({cards:S.cards,attacked:false,hypo:S.hypo});
    const su=S.cards.length===1&&S.cards[0].unit&&UNIT[S.cards[0].unit].weapons?UNIT[S.cards[0].unit].weapons:null;
    const inReach=(er,ec)=>su?su.some(w=>w.reach==="charge"?(r===er&&Math.abs(c-ec)<=3&&Math.abs(c-ec)>=2)||(c===ec&&Math.abs(r-er)<=3&&Math.abs(r-er)>=2):reaches(w.reach,r,c,er,ec)):adjacent(r,c,er,ec,diag);
    let near=99;
    for(const e of enemyStacks(pl)){
      const E=e.st,d=walk(r,c,e.r,e.c);near=Math.min(near,d);
      if(hits&&!E.hypo&&!shielded(E.owner)&&inReach(e.r,e.c)){
        const p=winP(S,E,n);let sc=p*gain(E)-(1-p)*loss(S);
        const ring=stacksOf(pl).filter(x=>x.st!==S&&adjacent(x.r,x.c,e.r,e.c,false)).length;sc+=ring*.3;
        if(sc>opp)opp=sc;
      }
      const reach=jackOnly(E)||soloUnit(E)?3:2;
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
    if(G.turnNo-(G.lastAttack||0)>10)return PUSH;   // nobody has fought for five rounds: break the stalemate
    const es=enemiesOf(pl),my=stacksOf(pl).reduce((a,x)=>a+value(x.st),0),th=enemyStacks(pl).reduce((a,x)=>a+value(x.st),0)/Math.max(1,es.length);
    const eDeck=es.length?Math.min(...es.map(e=>G.p[e].deck.length)):0,deckAdv=(G.p[pl].deck.length-eDeck)/40;
    let o=my/(th+1)+deckAdv+L(pl).bias;
    if(lvl(pl)==="easy")o+=Math.random()*.6-.3;
    if(!G.p[pl].deck.length||!eDeck||G.turnNo>90*Math.max(1,G.p.length/2)||hq()&&G.turnNo>8)return OFF;   // a dry deck ends the waiting game
    return o>1?OFF:DEF;
  }
  function withSel(r,c,ids,fn){const old=G.sel;G.sel={r,c,pick:new Set(ids)};try{return fn()}finally{G.sel=old}}
  const step=()=>{render();return sleep(G.p[G.active].cpu==="horde"?260:420)};

  /* ---------- placement ---------- */
  function placeScore(pl,card,r,c,W){
    const t=G.board[r][c];const S={cards:t?[...t.cards,card]:[card],owner:pl,hypo:t?t.hypo:0};
    const k=kind(card);
    if(k==="tree")return (t?-9:(isBack(pl,r,c)?4:3)-tileScore(pl,{cards:[card],owner:pl},r,c,DEF,false)*.1)*jit(pl);
    if(t&&hasBase(t)&&k!=="ace")return (hq()?1.2+rate(card)/12-t.cards.length*.15:(W===DEF?.7:.2)-t.cards.length*.3)*jit(pl);   // cards inside an Ace cannot fight, and die with it
    let s=tileScore(pl,S,r,c,W,false)-(t?tileScore(pl,t,r,c,W,false):0)+value(S)-(t?value(t):0);
    if(k==="ace")s+=lvl(pl)==="hard"?4:2;
    if(k==="queen"&&t&&hasK(t,"king"))s+=W===DEF?3:1.5;
    if(k==="king"&&t&&hasK(t,"queen"))s+=W===DEF?3:1.5;
    if(k==="joker")s+=enemyStacks(pl).some(e=>dist(e.r,e.c,r,c)<=2)?2:.5;
    if(isFront(pl,r,c)&&W===OFF)s+=.4;
    if(isBack(pl,r,c)&&W===DEF)s+=.3;
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
    const order=isHorde(pl)?stacksOf(pl).sort((a,b)=>stackRate(b.st)-stackRate(a.st)):stacksOf(pl).sort((a,b)=>{const na=Math.min(99,...enemyStacks(pl).map(e=>dist(a.r,a.c,e.r,e.c))),nb=Math.min(99,...enemyStacks(pl).map(e=>dist(b.r,b.c,e.r,e.c)));return na-nb});
    for(const o of order){
      if(G.over)return;
      const st=G.board[o.r][o.c];if(!st||st!==o.st||st.owner!==pl||st.moved)continue;
      if(Math.random()<lv.skipMove)continue;
      let grp=st.cards.filter(c=>!isBase(c));if(!grp.length||st.stun)continue;
      if(!stackLegal(grp)){ // too many to leave together (a full Ace): send out the strongest group that can stand on its own
        const g2=[];for(const c of [...grp].sort((a,b)=>rate(b)-rate(a)))if(stackLegal([...g2,c]))g2.push(c);grp=g2;if(!grp.length)continue}
      const inAce=hasBase(st);const S={cards:grp,owner:pl,hypo:st.hypo};
      let stay=inAce?tileScore(pl,S,o.r,o.c,W,false)+(hq()?-1:W===DEF?.6:0):tileScore(pl,S,o.r,o.c,W,true);
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
      for(const o of attackOptions(r,c)){
        const r2=o.r,c2=o.c,E=G.board[r2][c2],p0=winP(st,E,lv.mc,o.mode),p=o.ranged?Math.min(1,p0+(1-p0)*.6):p0;   // a ranged miss costs nothing
        const sc=(p*gain(E)-(1-p)*loss(st))*jit(pl);
        const late=isHorde(pl)?0:G.turnNo>90?Math.min(.25,.1+(G.turnNo-90)/200):!G.p[pl].deck.length?.1:0;
  
        const go=p>=(lv.thr-late)*(lvl(pl)==="easy"?(.7+Math.random()*.6):1)||(lvl(pl)!=="easy"&&sc>.4)||isHorde(pl);   // the Horde never holds back: whatever it can reach, it hits
        if(go&&(!best||sc>best.sc))best={r,c,r2,c2,sc,p,mode:o.mode};
      }
    }
    return best;
  }
  async function attacks(pl){
    for(let guard=0;guard<24;guard++){
      if(G.over)return;cache.clear();pcache.clear();
      const b=bestAttack(pl);if(!b)return;
      attack(b.r,b.c,b.r2,b.c2,b.mode);await sleep(isHorde(pl)?420:650);render();
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
      const cm=capMana(j),room=soulCap(pl)-mana(pl);
      let danger=0;for(const e of enemyStacks(pl))if(dist(e.r,e.c,r,c)<=2&&canAttackFrom({cards:e.st.cards,attacked:false}))danger=Math.max(danger,winP(e.st,st,24));
      const want=(cm>=4&&room>=cm-1)||(cm>=2&&danger>.55)||(lv==="hard"&&cm>=3&&mana(pl)<=2);
      if(want&&!G.moon.blood){await tryCast("suicide",r,c,[]);return}
    }
  }
  async function sacrifices(pl,target,keep){
    const P=G.p[pl];
    while(mana(pl)<target&&P.hand.length>keep){
      const c=[...P.hand].filter(c=>mana(pl)+soulOf(c)<=soulCap(pl)&&kind(c)!=="ace"&&kind(c)!=="joker"&&canSacCard(c)).sort((a,b)=>rate(a)-rate(b))[0];
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
    const es=enemiesOf(pl).filter(e=>!isHorde(e));if(!es.length)return;
    const lv=lvl(pl),F=G.p[es.reduce((a,b)=>G.p[b].hand.length>G.p[a].hand.length?b:a)],P=G.p[pl],sp=L(pl).spell;
    if(Math.random()>sp)return;
    // shield the most exposed valuable stack
    if((W===DEF||lv==="hard")&&stacksOf(pl).length>=2){
      let best=null;
      for(const x of stacksOf(pl)){if(x.st.hypo)continue;let rk=0;
        for(const e of enemyStacks(pl))if(dist(e.r,e.c,x.r,x.c)<=2&&canAttackFrom({cards:e.st.cards,attacked:false}))rk=Math.max(rk,winP(e.st,x.st,24));
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
        for(const [r2,c2] of withSel(r,c,[],attackTargets)){const E=G.board[r2][c2],p=winP(st,E,lv.mc,(attackOptions(r,c).find(o=>o.r===r2&&o.c===c2)||{}).mode);
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
    if(!P.deck.length||P.hand.length>handCap(pl)-4+(lv==="easy"?1:0))return false;
    if(lv==="hard")return P.hand.length<=1||(P.hand.length<=2&&P.deck.length>P.start*.5);
    return P.hand.length<=2;
  }
  /* ---------- whole turns ---------- */
  /* one phase of a computer's turn */
  async function phase(pl,ph){
    cache.clear();pcache.clear();
    if(isHorde(pl))return hordePhase(pl,ph);
    if(ph==="draw"){for(let n=0;n<3&&shouldDraw(pl);n++){rollDraw();await step()}return}
    if(ph==="prep"){
      const W=stance(pl),lv=lvl(pl);
      log(`${plName(pl)} ${W===PUSH?"pushes to break the standoff":"leans to "+(W===DEF?"defense":"offense")}.`,"ai");
      await suicides(pl);
      await sacrifices(pl,lv==="hard"?5:lv==="medium"?4:2,lv==="hard"?2:1);
      await necro(pl);
      await aiSubstance(pl,W);
      await curses(pl,W);
      await placements(pl,W,lv==="hard"?1:0);
      await moves(pl,W);
      await odds(pl);
      await conjures(pl,W);
      G.sel=null;await step();return;
    }
    if(ph==="attack"){await attacks(pl);G.sel=null}
  }
  async function setup(pl){
    const W=DEF,cx=(COLS-1)/2,cy=(G.rows-1)/2;
    while(G.setupStep==="ace"){
      const free=backTiles(pl).filter(([r,c])=>!G.board[r][c]).sort((a,b)=>Math.hypot(a[0]-cy,a[1]-cx)-Math.hypot(b[0]-cy,b[1]-cx));
      if(!free.length)break;
      const pool=lvl(pl)==="easy"?free:free.slice(0,3),[r,c]=pick(pool);
      await sleep(300);placeOpening(pl,r,c);render();await sleep(200);
    }
    const prev=G.phase;G.phase="setup";
    await placements(pl,W,lvl(pl)==="hard"?2:1);
    G.phase=prev;
  }
  async function hordePhase(pl,ph){
    if(ph==="draw")return;
    if(ph==="prep"){
      hordeSpawn();await sleep(700);render();await step();
      // Horde Jokers: shoot themselves once they hold souls
      for(const {st,r,c} of stacksOf(pl)){const j=st.cards.find(x=>kind(x)==="joker");
        if(j&&j.captured&&j.captured.length&&(j.captured.length>=2||Math.random()<.35)){await jokerSuicide(r,c,st,pl);await step();if(G.over)return}}
      await moves(pl,HORDE);return;
    }
    await attacks(pl);
  }
  const cardVal=c=>({ace:9,king:8,joker:7.5,jack:6,queen:5.5}[kind(c)]||(num(c)/2+1));
  function choose(pl,spec){
    const lv=lvl(pl);
    if(spec.kind==="choice")return spec.options[0].id;
    if(spec.kind==="player"){const ps=spec.players;const by=f=>ps.reduce((a,b)=>f(b)>f(a)?b:a);
      if(spec.id==="double")return by(x=>G.p[x].deck.length);
      if(spec.id==="naked")return pick(ps);
      return by(x=>G.p[x].hand.length)}
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
  /* the best tile for a card that has to go down now (a deployed Slave) */
  function bestSpot(pl,card){
    const W=stance(pl);let best=null;const old=G.active;
    for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++){if(!canPlace(card,r,c))continue;const s=placeScore(pl,card,r,c,W);if(!best||s>best.s)best={r,c,s}}
    return best?[best.r,best.c]:null;
  }
  return{phase,setup,choose,winP,value,LV,bestSpot};
})();

/* ---------------- Survival ---------------- */
function roman(n){if(n<=0)return "0";const T=[[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];let s="";for(const [v,l] of T)while(n>=v){s+=l;n-=v}return s}
const spawnRank=c=>({joker:100,king:90,jack:80,queen:70}[kind(c)]||num(c));
/* the Horde spawns once for every player still standing */
function hordeSpawn(){const n=Math.max(1,G.p.filter(P=>!P.out&&!isHorde(P.i)).length);for(let k=0;k<n;k++)hordeSpawnOne(k,n)}
function hordeSpawnOne(k,n){
  const r=G.round,pl=hordeIx(),dice=[];
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
  tray(pl,`Round ${roman(r)} spawn${n>1?` ${k+1}/${n}`:""}`,dice,`${placed} spawn${placed===1?"":"s"}`);
  log(`Round ${roman(r)}${n>1?`, spawn ${k+1} of ${n}`:""}: the Horde rolls ${dice.map(x=>"d"+x.s+":"+x.v).join(" ")}; ${g} grunts, ${inf} infantry${sp?`, ${sp} royals`:""}${jk?`, ${jk} Joker${jk>1?"s":""}`:""}, cap ${cap}. ${placed} spawn${lost?`, ${lost} find no room`:""}.`,"event");
}
function hordePlace(c){
  const pl=hordeIx(),zone=zoneTiles(pl),front=zone.filter(([r,cc])=>!isBack(pl,r,cc)),back=zone.filter(([r,cc])=>isBack(pl,r,cc));
  const mid=(COLS-1)/2,byCenter=t=>[...t].sort((a,b)=>Math.abs(a[1]-mid)-Math.abs(b[1]-mid));
  // stack onto its own stacks when it can, front line first
  for(const [r,col] of [...byCenter(front),...byCenter(back)]){const st=G.board[r][col];
    if(st&&st.owner===pl&&!hasK(st,"ace")&&stackLegal([...st.cards,c])){st.cards.push(c);return true}}
  const foes=enemiesOf(pl).flatMap(stacksOf);
  for(const line of [front,back]){const free=line.filter(([r,col])=>!G.board[r][col]);if(free.length){
    // lean toward the columns where the players' stacks are
    free.sort((a,b)=>Math.min(99,...foes.map(x=>Math.abs(x.c-a[1])))-Math.min(99,...foes.map(x=>Math.abs(x.c-b[1]))));
    const [r,col]=free[0];G.board[r][col]={owner:pl,cards:[c],moved:false,attacked:false};return true}}
  // no room: a stronger soul replaces the weakest stack still standing on the Horde's lines, which fades back into the Ether
  let weak=null;for(const [r,col] of zone){const st=G.board[r][col];if(st&&st.owner===pl&&!st.cards.some(x=>x.captured&&x.captured.length)&&(!weak||stackRate(st)<stackRate(weak.st)))weak={st,r,col}}
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
  if(s==="mask"){   // Antony's white mask: the dark smile gap and the cracked corners
    return "M0,-10C6,-10 8.5,-6 8.5,-1C8.5,5 5,9.5 0,9.5C-5,9.5 -8.5,5 -8.5,-1C-8.5,-6 -6,-10 0,-10Z"+"M-5.5,-2.5L-2,-3.2 M2,-3.2L5.5,-2.5"+"M-5,3.2C-2.5,6 2.5,6 5,3.2C2.5,4.6 -2.5,4.6 -5,3.2Z"+"M-8.5,-3L-6,-5.5L-6.8,-8 M8.5,-3L6.4,-4.4L7.4,-7.4 M-7.5,5L-5.6,6.6 M7.6,4.8L5.4,6.8"}
  if(s==="claw"){   // the demon's clawed hand
    return "M-6,10C-7,5 -7.5,1 -6.5,-2L-9,-9 M-6.5,-2C-5,-4 -3.5,-5 -2,-5.5L-3,-11 M-2,-5.5C0,-5.8 1.6,-5.4 2.8,-4.6L3.6,-10.5 M2.8,-4.6C4.5,-3.5 5.6,-2 6,0L9.5,-5 M6,0C6.8,3 6.2,7 5,10 M-3,10C-2.2,6 -1,3.6 0.5,2.6"}
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
  if(c.unit){   // a Substance card: its own symbol and its hearts
    const U=UNIT[c.unit],nm=U.short||U.name;
    return `<span class="cf unit u-${c.unit}${c.hate?" hated":""} ${o.cls||""}" style="--pc:${col}" title="${esc(nameOf(c))}"><span class="cx"><b class="rk un">${esc(sm?nm.slice(0,4):nm)}</b></span><span class="uic">${unitSVG(c.unit,c.unit==="tree"?"#2d6b3a":c.unit==="satan"?"#8e1426":"#15100b",sm?18:30)}</span>${c.maxHp&&!sm?heartsHTML(c):""}${P?`<span class="so">${solidSVG(P.solid,col,sm?12:17)}</span>`:""}${sm?"":`<em class="ty">${esc(U.word)}</em>`}${o.price?`<span class="price">${costOf(c)} mana</span>`:""}</span>`;
  }
  const rk=c.rank==="JK"?"Joker":c.rank,su=c.rank==="JK"?"✶":SUITS[c.suit];
  return `<span class="cf ${c.color}${c.hate?" hated":""} ${o.cls||""}" style="--pc:${col}" title="${esc(nameOf(c))}"><span class="cx"><b class="rk${c.rank==="JK"?" jk":""}">${rk}</b>${c.rank==="JK"?"":`<i>${su}</i>`}</span><i class="su">${su}</i>${P?`<span class="so">${solidSVG(P.solid,col,sm?12:17)}</span>`:""}${c.puppet&&!sm?`<span class="pup">${unitSVG("puppet","#15100b",16)}</span>`:""}${sm?"":`<em class="ty">${typeWord(c)}</em>`}${o.price?`<span class="price">${costOf(c)} mana</span>`:""}</span>`;
}
function back(pl){const P=G.p[pl];return `<span class="cb" style="--pc:${P.color}">${solidSVG(P.solid,P.color,18)}</span>`}
const clock=t=>new Date(t).toLocaleTimeString([],{hour:"numeric",minute:"2-digit",second:"2-digit"});
function lastSpellNote(P){const e=P.lastSpell;if(!e)return "";return `<span class="lastsp">(last spell: ${esc(e.name)}${e.tile?" on "+e.tile:""}${e.target?" at "+esc(e.target):""}, ${e.round?"round "+e.round:"setup"}, ${clock(e.t)})</span>`}
function trayHTML(P,pl){
  const t=P.tray,head=`<span class="tl">${t?esc(t.label):esc(P.name)+"'s dice"} ${lastSpellNote(P)}</span>`;
  const body=!t?'<span class="dim">No rolls yet.</span>':t.dice.length?t.dice.map(d=>dieSVG(d,P.color)).join(""):'<span class="dim">No dice.</span>';
  return `<button type="button" class="tray${t?"":" empty"}" data-hist="${pl}" style="--pc:${P.color}" title="Show the history of rolls and spells" aria-label="${esc(P.name)}'s dice box: show history">${head}<span class="dice">${body}</span><span class="hhint">history ▾</span></button>${t&&t.line?`<p class="tline">${esc(t.line)}</p>`:""}`;
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
    if(spec.kind==="choice"){
      ovShow(`<div class="ovbox"><h2>${esc(spec.title)}</h2>${who}<div class="choices">${spec.options.map(o=>`<button class="btn ghost choice" data-o="${esc(o.id)}"><b>${esc(o.label)}</b>${o.sub?`<small>${esc(o.sub)}</small>`:""}</button>`).join("")}</div>${spec.cancel?`<p><button class="btn ghost" id="mcancel">${esc(spec.cancel)}</button></p>`:""}</div>`);
      $("#ov").querySelectorAll("[data-o]").forEach(b=>b.onclick=()=>{ovHide();res(b.dataset.o)});
      if(spec.cancel)$("#mcancel").onclick=()=>{ovHide();res(null)};return;
    }
    if(spec.kind==="player"){
      ovShow(`<div class="ovbox"><h2>${esc(spec.title)}</h2>${who}<div class="pickrow">${spec.players.map(pl=>`<button class="btn ghost pbtn" data-p="${pl}" style="--pc:${G.p[pl].color}">${solidSVG(G.p[pl].solid,G.p[pl].color,16)} ${esc(G.p[pl].name)} <small>hand ${G.p[pl].hand.length} · deck ${G.p[pl].deck.length}</small></button>`).join("")}</div></div>`);
      $("#ov").querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{ovHide();res(+b.dataset.p)});return;
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
  G.over=true;G.busy=false;stopTimer();
  const team=G.p.filter(P=>P.team===G.p[w].team).map(P=>P.i),names=team.map(plName).join(" and ");
  log(`<b>${names} win${team.length>1?"":"s"}</b>: ${why}.`,"win");render();
  const hs=G.p.filter(P=>!P.cpu);const title=hs.length===1?(team.includes(hs[0].i)?(team.length>1?"Your side wins":"You win"):"The computer wins"):`${names} win${team.length>1?"":"s"}`;
  ovShow(`<div class="ovbox"><h2>${title}</h2><p>${why}.</p><p><button class="btn" id="again">New game</button></p></div>`);$("#again").onclick=showStart;
}
const PHASES=[["draw","Draw","roll d4s to draw, or skip"],["prep","Prep","sacrifice, cast, place, move"],["attack","Attack","each stack may attack once"]];
function canAct(){return G&&!G.over&&!G.busy&&!G.passing&&!me().cpu&&!me().out&&G.active===view()}
function bars(P){
  const N=Math.max(1,P.start||P.deck.length||1),n=P.deck.length,fill=Math.min(n,N),extra=Math.max(0,n-N);
  const blocks=Array.from({length:N},(_,i)=>`<i class="${i<fill?"f":""}"></i>`).join("");
  const over=extra?`<span class="surplus" style="width:calc(${Math.min(100,extra/N*100).toFixed(2)}% - 4px);grid-template-columns:repeat(${Math.min(extra,N)},1fr)">${"<i></i>".repeat(Math.min(extra,N))}</span>`:"";
  const m=mana(P.i);
  return `<div class="meters"><div class="meter"><span class="bk">Deck</span><div class="deckbar" style="--pc:${P.color};grid-template-columns:repeat(${N},1fr)" role="img" aria-label="Deck ${n} cards of ${N}">${blocks}${over}</div><b class="mv">${n}${extra?` <small>+${extra}</small>`:""}</b></div>
<div class="meter mana"><span class="bk">Mana</span><div class="manabar" role="img" aria-label="Mana ${m} of ${soulCap(P.i)}">${Array.from({length:soulCap(P.i)},(_,i)=>`<i class="${i<m?"f":""}"></i>`).join("")}</div><b class="mv">${m}/${soulCap(P.i)}</b></div></div>`;
}
function pboxHTML(pl,top){
  const P=G.p[pl],act=pl===G.active&&G.phase!=="setup";
  const tag=P.cpu==="horde"?"the Horde":(P.cpu?`computer · ${P.cpu} · `:"")+(TRIBES[P.tribe]?TRIBES[P.tribe].name:"");
  const V=view(),rel=pl===V?"":isEnemy(pl,V)?"":'<span class="ally">ally</span>';
  let h=`<div class="ph" style="--pc:${P.color}">${solidSVG(P.solid,P.color,18)}<b>${esc(P.name)}</b><span class="dim">${esc(tag)}</span>${rel}${P.out?'<span class="outmark">out</span>':act?'<span class="turnmark">to play</span>':""}</div>`;
  if(P.out)return h;
  if(P.cpu==="horde"){
    const units=stacksOf(pl).reduce((a,x)=>a+x.st.cards.length,0);
    h+=`<p class="stats"><span>On the field <b>${units}</b> card${units===1?"":"s"} in <b>${stacksOf(pl).length}</b> stack${stacksOf(pl).length===1?"":"s"}</span></p>`;
  }else{
    h+=bars(P);
    const sl=[];
    if(P.tribe==="angel")sl.push(`<span class="bolts" title="Bolts for Lightning Strike">Bolts ${[0,1,2].map(i=>`<i class="${i<(P.bolts||0)?"f":""}">${unitSVG("bolt",i<(P.bolts||0)?"#8fd0ff":"#4a5a66",13)}</i>`).join("")}</span>`);
    if(P.tribe==="binah")sl.push(`<span>Thralls <b>${(P.thralls||[]).length}/10</b></span>`);
    if(P.shield)sl.push(`<span class="pinktag">Please Don't Hurt Me</span>`);
    if(sl.length)h+=`<p class="stats subline">${sl.join("")}</p>`;
    const showHand=top;
    if(showHand){
      const open=P.shownBy!=null&&!G.passing&&(P.shownBy===V||!isEnemy(P.shownBy,V))||!isEnemy(pl,V)&&G.p.filter(Q=>!Q.cpu).length===1&&!G.passing;
      h+=`<div class="handrow"><span class="bk">Hand ${P.hand.length}/${handCap(pl)}</span>${P.hand.map(c=>open?face(c,{cls:"sm"}):back(pl)).join("")}${open?'<span class="seenmark">seen</span>':""}</div>`;
    }else h+=`<p class="stats"><span>Hand <b>${P.hand.length}/${handCap(pl)}</b></span>${P.od?`<span class="odn">overdrawn <b>${P.od}</b></span>`:""}</p>`;
  }
  if(top)h+=`<div class="traywrap">${trayHTML(P,pl)}</div>`;
  return h;
}
function render(){
  if(!G)return;
  const V=view(),T=enemiesOf(V)[0]??(V===0?1:0);
  if(G.placing&&G.selHand!==G.placing)G.selHand=G.placing;
  const K=G.rows===COLS?seat(V).rot:(seat(V).rot%2?0:seat(V).rot),duel=G.map.layout==="duel"&&K%2===0;
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
  if(G.phase==="setup")$("#phases").innerHTML=`<span class="ph-c on"><b>Setup</b><em>${G.setupStep==="ace"?(hq()&&!G.p[G.active].opening.length?"click a backline tile for your second base Ace":"click a backline tile for your Ace and Jack"):"place any opening cards, then press Done"}</em></span>`;
  else if(G.phase==="moon")$("#phases").innerHTML=`<span class="ph-c on"><b>Moon</b><em>the ${MOON[m.i]} takes effect</em></span>`;
  else $("#phases").innerHTML=PHASES.map(([id,n,help])=>`<span class="ph-c ${G.phase===id?"on":""}${id==="draw"&&(G.turnNo===1||G.noDraw)?" skip":""}"><b>${n}</b><em>${help}</em></span>`).join('<i>→</i>');
  const who=me();
  $("#who").innerHTML=G.over?"Game over.":G.passing?"Passing the device…":who.cpu?`<b>${esc(who.name)}</b> is playing…`:`<b>${esc(who.name)}</b>${G.p.filter(P=>!P.cpu).length>1?"":" (you)"} to play${G.nextLabel==="Ready →"&&G.phase!=="setup"?" · everyone plays this phase together":""}`;
  // board: turned so the viewer's side is at the bottom
  const DR=G.rows,DC=COLS;
  const toBoard=(i,j)=>K===0?[i,j]:K===2?[DR-1-i,DC-1-j]:K===1?[j,DC-1-i]:[DR-1-j,i];
  let tgt=[];const live=canAct();
  if(live&&G.sel&&G.mode==="move")tgt=moveTargets();
  if(live&&G.sel&&G.mode==="attack")tgt=attackTargets();
  const placeT=[];
  if(live&&G.phase==="setup"&&G.setupStep==="ace"){for(const [r,c] of backTiles(G.active))if(!G.board[r][c])placeT.push([r,c])}
  else if(live&&G.selHand)for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++)if(canPlace(G.selHand,r,c))placeT.push([r,c]);
  const isT=(r,c,list)=>list.some(([a,b])=>a===r&&b===c);
  const B=$("#board");B.style.setProperty("--rows",DR);B.style.setProperty("--cols",DC);B.classList.toggle("mapped",G.map.theme!=="none");B.classList.toggle("nolabels",!duel);B.dataset.map=G.map.theme;
  if(!G.map.ground)G.map.ground=mapGround();G.map.art=G.map.art||{};
  const river=G.map.theme==="river";
  B.innerHTML=`<div class="mapbg">${G.map.ground}</div>`+[...Array(DR).keys()].map(i=>{
    const r0=toBoard(i,0)[0];
    let lineName="",nm="";
    if(duel){
      lineName=r0===backRow(V)?"your backline":r0===frontRow(V)?"your frontline":r0===backRow(T)?"enemy backline":r0===frontRow(T)?"enemy frontline":river?"river":"midline";
      nm=G.opts.mode==="cpu"||survival()?lineName.replace("enemy",survival()?"Horde":"computer's"):lineName;
      if(river&&lineName==="river")nm=`river · bridge on the ${G.map.bridge}`;
    }
    return `<div class="row ${lineName.replace(/\s/g,"-")}">${duel?`<span class="rl">${nm}</span>`:""}`+[...Array(DC).keys()].map(j=>{
      const [r,c]=toBoard(i,j);
      const st=G.board[r][c],role=tileRole(r,c),edge=outerEdge(r,c,K),key=r+"."+c+"."+edge;
      const art=G.map.art[key]||(G.map.art[key]=tileArt(r,c,role,edge));
      if(role==="void"||role==="water")return `<div class="tile ${role}" aria-hidden="true">${art}</div>`;
      const cls=["tile"];if(G.sel&&G.sel.r===r&&G.sel.c===c)cls.push("sel");
      if(isT(r,c,tgt))cls.push(G.mode==="attack"?"tatk":"tmove");if(isT(r,c,placeT))cls.push("tplace");
      const z=G.zone[r][c];if(!duel&&z>=0)cls.push("zone");
      let inner="";
      if(st){
        const lead=st.cards.find(isBase)||st.cards.find(x=>x.unit&&UNIT[x.unit].hp)||[...st.cards].sort((a,b)=>nat(b)-nat(a)||kind(b).localeCompare(kind(a)))[0];
        const P=G.p[st.owner],mine=st.owner===V;
        const cap=st.cards.reduce((a,x)=>a+capMana(x),0);
        const ic=lead.unit?unitSVG(lead.unit,lead.unit==="tree"||lead.unit==="slave"?"#2d6b3a":"#15100b",26):lead.puppet?unitSVG("puppet","#15100b",20):"";
        const leadHTML=lead.unit?`<span class="lead ulead">${ic}<b class="uname">${esc(short(lead))}</b></span>`:`<span class="lead"><b class="rk${lead.rank==="JK"?" jk":""}">${lead.rank==="JK"?"Joker":lead.rank}</b><i>${lead.rank==="JK"?"✶":SUITS[lead.suit]}</i>${lead.puppet?ic:""}</span>`;
        inner=`<div class="stack ${mine?"mine":isEnemy(st.owner,V)?"theirs":"ally"} ${lead.color}${hated(st)?" hated":""}${shielded(st.owner)?" pink":""}${lead.unit?" u-"+lead.unit:""}" style="--pc:${P.color}"><span class="so">${solidSVG(P.solid,P.color,16)}</span>${st.cards.length>1?`<span class="cnt">×${st.cards.length}</span>`:""}${leadHTML}<span class="mini">${st.cards.length>1?st.cards.map(short).join(" "):heartsHTML(lead)}</span>${st.cards.length>1&&lead.maxHp?`<span class="bhp">${heartsHTML(lead)}</span>`:""}<em class="ty">${esc(typeWord(lead))}</em>${st.stun?`<span class="stun" title="Immobilized by lightning for ${st.stun} more turn${st.stun>1?"s":""}">${unitSVG("bolt","#6fb8ff",14)}${st.stun}</span>`:""}${st.odds?`<span class="odds ${st.odds}">${st.odds==="adv"?"▲":"▼"}</span>`:""}${st.hypo?`<span class="hypo" title="Hypostasis: untouchable">◈${st.hypo}</span>`:""}${cap?`<span class="souls" title="captured souls">✦${cap}</span>`:""}${st.owner===G.active&&(st.moved||st.attacked)&&G.phase!=="setup"?`<span class="used">${st.attacked?"atk":"mv"}</span>`:""}</div>`;
      }
      const zc=!duel&&z>=0?` style="--zc:${G.p[z].color}"`:"";
      return `<button class="${cls.join(" ")}${role==="bridge"?" bridge":""}"${zc} data-r="${r}" data-c="${c}" aria-label="${coord(r,c)}, ${lineName||(z>=0?G.p[z].name+"'s ground":"open ground")}${role==="bridge"?" bridge":""}${st?", "+st.cards.map(nameOf).join(", "):", empty"}">${art}${PREF.coords?`<span class="coord">${coord(r,c)}</span>`:""}${inner}</button>`;
    }).join("")+"</div>";
  }).join("");
  $("#board").querySelectorAll("button.tile").forEach(b=>b.onclick=()=>tileClick(+b.dataset.r,+b.dataset.c));
  // player boxes
  const others=G.p.map(P=>P.i).filter(i=>i!==V);
  if(others.length===1){$("#foe").classList.remove("multi");$("#foe").innerHTML=pboxHTML(others[0],true);$("#foe").style.setProperty("--pc",G.p[others[0]].color)}
  else{$("#foe").classList.add("multi");$("#foe").innerHTML=others.map(o=>`<div class="pbox sub" style="--pc:${G.p[o].color}">${pboxHTML(o,true)}</div>`).join("")}
  $("#me").innerHTML=pboxHTML(V,false);$("#me").style.setProperty("--pc",G.p[V].color);
  $("#shared").innerHTML=`<button class="link limbo-l" id="seegrave">Grave <b>${G.grave.length}</b></button><button class="link" id="seeether">Ether <b>${G.ether.length}</b></button><button class="link dark-l" id="seedark">Outer Darkness <b>${G.dark.length}</b></button>`;
  $("#seegrave").onclick=()=>viewBox("The Grave",G.grave,"limbo","Shared by every player. The dead sleep here until something raises them.");
  $("#seeether").onclick=showEther;
  $("#seedark").onclick=()=>viewDark("dark");
  const PV=G.p[V];
  if(G.limbo.length&&!PV.readLimbo)$("#shared").insertAdjacentHTML("beforeend",`<button class="link notice limbo-n" id="nlimbo">Limbo: Samson is wandering <b>new</b></button>`);
  if(G.unknown.length&&!PV.readUnknown)$("#shared").insertAdjacentHTML("beforeend",`<button class="link notice unk-n" id="nunk">Unknown: Antony went missing <b>new</b></button>`);
  if($("#nlimbo"))$("#nlimbo").onclick=()=>{PV.readLimbo=true;viewDark("limbo");render()};
  if($("#nunk"))$("#nunk").onclick=()=>{PV.readUnknown=true;viewDark("unknown");render()};
  // hand
  const P=G.p[V];
  $("#handh").textContent=G.p.filter(Q=>!Q.cpu).length>1?`${P.name}'s hand`:"Your hand";
  const hidden=G.passing;
  $("#hand").innerHTML=P.hand.length?P.hand.map((c,i)=>hidden?back(V):`<div class="hc"><button class="cardbtn ${G.selHand===c?"on":""}" data-h="${i}" aria-label="${esc(nameOf(c))}">${face(c)}</button>${live&&sacrificeAllowed()&&canSacCard(c)?`<button class="mini-btn" data-sh="${i}" title="Sacrifice to your soul pile (+${soulOf(c)} mana)">sac +${soulOf(c)}</button>`:""}</div>`).join(""):'<p class="dim">No cards in hand.</p>';
  $("#hand").querySelectorAll("[data-h]").forEach(b=>b.onclick=()=>{
    if(!canAct())return;
    if(!(G.phase==="setup"&&G.setupStep==="more"||G.phase==="prep")){flash(G.phase==="setup"?"Place your Ace and Jack first.":"Cards are placed during setup or the prep phase.");return}
    if(G.placing){flash("Put the Slave down first.");return}
    const c=P.hand[+b.dataset.h];G.selHand=G.selHand===c?null:c;G.mode=null;render()});
  $("#hand").querySelectorAll("[data-sh]").forEach(b=>b.onclick=()=>{if(!canAct())return;sacrifice(P.hand[+b.dataset.sh],"hand");render()});
  $("#mytray").innerHTML=hidden?"":trayHTML(P,V);
  // controls
  const ctl=[];
  if(live&&G.phase==="draw")ctl.push(`<button class="btn" id="d4" ${P.deck.length?"":"disabled"}>Roll d4 and draw</button>`);
  if(live&&G.phase!=="moon")ctl.push(`<button class="btn ghost" id="next">${G.phase==="setup"?"Done setting up":G.nextLabel||"Next →"}</button>`);
  if(+G.opts.timer&&!G.over)ctl.push(`<span id="timer" class="timer" aria-live="off" title="time left in this phase">${G.deadline?Math.max(0,Math.ceil((G.deadline-Date.now())/1000))+"s":""}</span>`);
  ctl.push(`<button class="btn ghost sm" id="snd" aria-pressed="${SND.on}">sound: ${SND.on?"on":"off"}</button>`);
  $("#controls").innerHTML=ctl.join("");
  const ap=$("#actph");if(ap)ap.innerHTML=G.over?"Game over":G.passing?"":me().cpu?`${esc(me().name)} is playing…`:G.phase==="setup"?"<b>Setup</b>":G.phase==="moon"?"<b>Moon</b>":`<b>${({draw:"Draw",prep:"Prep",attack:"Attack"})[G.phase]||""}</b> · ${esc(me().name)}`;
  if($("#d4"))$("#d4").onclick=()=>{if(!canAct())return;rollDraw();render()};
  if($("#next"))$("#next").onclick=nextPhase;
  $("#snd").onclick=()=>{SND.toggle();render()};
  renderSel(live);
  renderSpells(live);
  document.querySelectorAll("[data-hist]").forEach(b=>b.onclick=e=>{e.stopPropagation();openHist(+b.dataset.hist,b)});
  if(histOpen!=null)fillHist();
  $("#log").innerHTML=G.log.map(l=>`<li class="${l.cls}"${l.pl!=null&&G.p[l.pl]?` style="--pc:${G.p[l.pl].color}"`:""}>${l.t?`<time>${clock(l.t)}</time>`:""}<span class="lt">${l.html}</span></li>`).join("");
  mountTimerOff();
}
function renderSpells(live){
  const box=$("#spells");
  if(survival()&&false)return;
  const m=G.moon;
  box.classList.toggle("bloodmoon",!!m.blood);
  const P=me(),od=G.p[G.active].od;
  const head=!live?`<p class="dim">${G.passing?"":me().cpu?"The computer is casting.":"Spells are cast during your prep phase."}</p>`:G.phase==="prep"?"":G.opts.atkSpells&&G.phase==="attack"?'<p class="dim">Enchantments, curses and sorcery can be cast now.</p>':'<p class="dim">Spells are cast during the prep phase.</p>';
  box.innerHTML=head+SCHOOLS.map(sc=>`<h4>${sc}</h4>`+SPELLS.filter(s=>s.school===sc&&(!s.tribe||s.tribe===G.p[view()].tribe)&&!(survival()&&["forced","double","three","naked"].includes(s.id))).map(s=>{
    const ok=live&&spellReady(s),cost=spellCost(s);
    let moon="";if((s.id==="clair"||s.id==="naked")){if(newPrices())moon="moon-dark";else if(fullPrices())moon="moon-bright"}
    let extra="";
    if(s.id==="bless"){const aces=stacksOf(G.active).filter(x=>hasK(x.st,"ace")).length,n=Math.min(6,1+aces+G.ritual,blessCap(G.active));extra=`<small class="dc">${n}d6</small>`+(od?`<small class="odpen ${od>6?"big":""}">−${od}d6 max</small>`:"")}
    const moonPrice=(s.id==="clair"&&(newPrices()||fullPrices()))||(s.id==="naked"&&(newPrices()||fullPrices()));
    if(s.dice)extra+=`<small class="dc" title="${moonPrice?"moon price this phase":"rolled at the start of this round"}">${moonPrice?"moon":s.dice}</small>`;
    if(s.id==="bolt"){const b=G.p[G.active].bolts||0;extra+=`<span class="bolts" aria-label="${b} of 3 bolts">${[0,1,2].map(i=>`<i class="${i<b?"f":""}">${unitSVG("bolt",i<b?"#8fd0ff":"#4a5a66",13)}</i>`).join("")}</span>`}
    if(s.id==="slaves"){const n=(G.p[G.active].thralls||[]).length;extra+=`<span class="chips" aria-label="${n} of 10 thralls">${Array.from({length:10},(_,i)=>`<i class="${i<n?"f":""}">${unitSVG("chip",i<n?"#9fe8b4":"#3d4a40",11)}</i>`).join("")}</span>`}
    if(s.once)extra+=`<small class="dc once">${G.p[G.active].once&&G.p[G.active].once[s.id]?"used":"once a game"}</small>`;
    if(s.tribe)extra+=`<small class="dc subtag">${esc(TRIBES[s.tribe].name)}</small>`;
    const block=spellBlock(s);
    return `<button class="spell${s.tribe?" subsp":""} ${ok?"":"off"} ${moon} ${s.school==="Necromancy"?"nec":""} ${s.id==="sever"&&P.sevArmed?"armed":""}" data-s="${s.id}" title="${esc(block||s.text)}"><span>${esc(s.name)}${extra}</span><em>${s.id==="hypo"&&!selOwn()?"3+":cost?cost+" mana":"free"}</em></button>`}).join("")+(sc==="Conjuring"?`<button class="link souls-l" id="showsouls">show available souls</button>`:"")).join("");
  box.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{if(!canAct())return;cast(SP(b.dataset.s))});
  $("#showsouls").onclick=showEther;
}
function showEther(){viewBox("The Ether: Souls to Materially Conjure",G.ether,"ether",`${G.ether.length} souls wait in the Ether for a conjuring. Flesh Severance sends exiled souls back here.`)}
function renderSel(live){
  const box=$("#selbox"),st=selStack();
  if(G.phase==="setup"&&G.setupStep==="ace"&&live){box.innerHTML=`<p>Your Ace rises with a Jack inside it. Click a highlighted tile on your backline.</p>`;return}
  if(G.placing&&live){box.innerHTML=`<p><b>A Slave</b> is ready. Click an empty highlighted tile of your ground to put it down.</p>${unitInfo(G.placing)}`;return}
  if(G.selHand){box.innerHTML=`${G.selHand.unit?unitInfo(G.selHand):""}<p><b>${esc(nameOf(G.selHand))}</b> selected. Click a highlighted tile in your two lines to place it${kind(G.selHand)==="ace"?" (Aces go on an empty backline tile)":kind(G.selHand)==="joker"?" (Jokers spawn onto your stack holding a card of the same color)":""}.</p>`;return}
  if(!st){box.innerHTML='<p class="dim">Select a stack on the board, or a card in your hand.</p>';return}
  const mine=st.owner===G.active&&live,s=G.sel;
  const rows=st.cards.map(c=>{
    const k=kind(c),cap=capMana(c);
    const chk=mine&&!isBase(c)&&G.phase==="prep"?`<input type="checkbox" data-pk="${c.id}" ${s.pick.has(c.id)?"checked":""} aria-label="include ${esc(nameOf(c))} in the moving group">`:"";
    const sac=mine&&sacrificeAllowed()&&canSacOnField(st,c)?`<button class="mini-btn" data-sc="${c.id}">sac +${soulOf(c)}</button>`:"";
    const stat=c.unit&&UNIT[c.unit].weapons?UNIT[c.unit].weapons.map(w=>w.name+": "+w.text).join("; "):`${nat(c)}${die(c)?" + d"+die(c):""}`;
    return `<li>${chk}${face(c,{cls:"sm"})} ${esc(typeWord(c))} · ${esc(stat)}${c.maxHp?" · "+heartsHTML(c):""}${c.hate?' · <span class="hatetag">Hate</span>':""}${cap?` · ✦${cap} captured`:""} ${sac}</li>`}).join("");
  const acts=[];
  const owner=G.p[st.owner].name;
  box.innerHTML=`<p><b>${st.owner===G.active?"Your":esc(owner)+"'s"} stack</b> · ${st.cards.length} card${st.cards.length>1?"s":""}${st.odds?` · ${st.odds==="adv"?"Divine Odds":"Hexed Odds"}`:""}${st.hypo?` · Hypostasis (${st.hypo})`:""}${st.stun?` · immobilized by lightning (${st.stun})`:""}${shielded(st.owner)?" · Please Don't Hurt Me":""}${st.moved?" · moved":""}${st.attacked?" · attacked":""}</p><ul class="cards">${rows}</ul><div class="acts">${acts.join("")}</div>${mine&&G.phase==="prep"?`<p class="dim">${st.moved?"This stack has moved this turn.":"Highlighted tiles show where it can go: click one to move. Uncheck any card you want to leave behind. Click the stack again to let go."}</p>`:""}${mine&&G.phase==="attack"?`<p class="dim">${canAttackFrom(st)?(attackTargets().length?"Click a highlighted enemy stack to attack it.":"No enemy stack is in reach."):"This stack can't attack now."}</p>`:""}`;
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
    if(isBack(G.active,r,c)&&!G.board[r][c]&&!isVoid(r,c)){placeOpening(G.active,r,c);render()}else flash("Your Ace goes on an empty highlighted tile of your back line.");return}
  if(live&&G.selHand){if(canPlace(G.selHand,r,c)){place(G.selHand,r,c);render()}else flash("That card can't be placed there.");return}
  if(live&&G.sel&&G.mode==="move"&&moveTargets().some(([a,b])=>a===r&&b===c)){doMove(r,c);render();return}
  if(live&&G.sel&&G.mode==="attack"&&attackTargets().some(([a,b])=>a===r&&b===c)){chooseAttack(G.sel.r,G.sel.c,r,c);return}
  if(G.busy)return;
  const st=G.board[r][c];
  if(!st||(G.sel&&G.sel.r===r&&G.sel.c===c)){G.sel=null;G.mode=null;render();return}
  G.sel={r,c,pick:new Set(st.cards.filter(x=>kind(x)!=="ace").map(x=>x.id))};G.mode=autoMode(st);render();
}

/* the history behind a dice box: every roll and spell, with the tile and the time on this computer */
let histOpen=null;
function histLine(e){
  const bits=[];
  if(e.kind==="spell"){if(e.tile)bits.push(e.tile);if(e.target)bits.push("at "+esc(e.target));if(e.cost)bits.push(`${e.cost} mana`)}
  else{if(e.tile)bits.push(e.tile);if(e.dice&&e.dice.length)bits.push(e.dice.map(d=>d.replace(":"," ")).join(" "));if(e.line)bits.push(esc(e.line))}
  return `<li class="${e.kind}"><b>${esc(e.name)}</b>${bits.length?": "+bits.join(", "):""}, <time>${clock(e.t)}</time> <small>${e.round?"round "+e.round:"setup"}</small></li>`;
}
function fillHist(){
  const box=$("#histpop");if(!box||!G||histOpen==null){if(box)box.hidden=true;return}
  const P=G.p[histOpen],list=(P.hist||[]);
  box.innerHTML=`<div class="hhead"><div class="htabs">${G.p.map(Q=>`<button type="button" class="htab ${Q.i===histOpen?"on":""}" data-ht="${Q.i}" style="--pc:${Q.color}">${solidSVG(Q.solid,Q.color,13)} ${esc(Q.name)}</button>`).join("")}</div><button type="button" class="hx" aria-label="Close the history">×</button></div>
<ol class="hlist">${list.length?list.map(histLine).join(""):'<li class="dim">Nothing yet.</li>'}</ol>`;
  box.querySelectorAll("[data-ht]").forEach(b=>b.onclick=e=>{e.stopPropagation();histOpen=+b.dataset.ht;fillHist()});
  box.querySelector(".hx").onclick=closeHist;
}
function openHist(pl,anchor){
  let box=$("#histpop");
  if(!box){box=document.createElement("div");box.id="histpop";box.setAttribute("role","dialog");box.setAttribute("aria-label","History of rolls and spells");document.body.appendChild(box);
    box.addEventListener("click",e=>e.stopPropagation());
    document.addEventListener("click",()=>{if(histOpen!=null)closeHist()});
    document.addEventListener("keydown",e=>{if(e.key==="Escape"&&histOpen!=null)closeHist()})}
  if(histOpen===pl&&!box.hidden){closeHist();return}
  histOpen=pl;box.hidden=false;fillHist();
  const r=anchor.getBoundingClientRect(),w=Math.min(420,innerWidth-20);
  box.style.width=w+"px";box.style.left=Math.max(10,Math.min(r.left,innerWidth-w-10))+scrollX+"px";box.style.top=r.bottom+scrollY+4+"px";
}
function closeHist(){histOpen=null;const b=$("#histpop");if(b)b.hidden=true}

/* the quote box carries a switch that turns the phase timer off for the rest of the game */
function mountTimerOff(){
  const box=$("#quotes");if(!box)return;let b=$("#timeroff");
  if(!b){b=document.createElement("button");b.id="timeroff";b.type="button";b.className="btn ghost sm";$("#qnext").after(" ",b);
    b.onclick=()=>{if(!G||!+G.opts.timer)return;G.opts.timer=0;stopTimer();log("The phase timer is switched off for the rest of the game.","event");flash("Phase timer off. Take your time.");render()}}
  const on=G&&!G.over&&+G.opts.timer;b.hidden=!on;b.textContent=on?`Turn the ${G.opts.timer}s phase timer off`:"";
}

/* a stack with several weapons asks which one to use on this target */
async function chooseAttack(r1,c1,r2,c2){
  const opts=attackOptions(r1,c1).filter(o=>o.r===r2&&o.c===c2);
  let mode=opts[0]?opts[0].mode:null;
  if(opts.length>1){G.busy=true;
    mode=await askHuman(G.active,{kind:"choice",title:"Which attack?",options:opts.map(o=>({id:o.mode,label:o.w.name,sub:o.w.text+(o.ranged?" From here a miss costs nothing.":"")})),cancel:"Cancel"});
    G.busy=false;if(mode==null){render();return}}
  attack(r1,c1,r2,c2,mode);G.mode=null;if(G.sel&&!G.board[G.sel.r][G.sel.c])G.sel=null;render();
}
/* the Outer Darkness, with Limbo and Unknown once Samson and Antony have gone there */
function viewDark(tab){
  const tabs=[["dark","Outer Darkness",G.dark]];if(G.limbo.length)tabs.push(["limbo","Limbo",G.limbo]);if(G.unknown.length)tabs.push(["unknown","Unknown",G.unknown]);
  if(!tabs.some(t=>t[0]===tab))tab="dark";
  const note={dark:"Nothing here returns. Each card bears the symbol of the player who held it when it fell.",limbo:"Samson is wandering through Limbo. His card does not return from here.",unknown:"Antony went missing. His card does not return from here."}[tab];
  const list=tabs.find(t=>t[0]===tab)[2];
  ovShow(`<div class="ovbox outer"><h2>The Outer Darkness</h2>${tabs.length>1?`<div class="odtabs">${tabs.map(([k,n,l])=>`<button type="button" class="odtab ${k===tab?"on":""}" data-od="${k}">${n} <b>${l.length}</b></button>`).join("")}</div>`:""}<p class="dim">${note}</p><div class="pickrow">${list.length?list.map(c=>face(c,{owner:tab==="dark"?c.darkOwner:c.owner,cls:c.unit==="satan"?"satan-od":""})).join(""):'<p class="dim">Empty.</p>'}</div><p><button class="btn ghost" id="mcancel">Close</button></p></div>`);
  $("#mcancel").onclick=ovHide;
  $("#ov").querySelectorAll("[data-od]").forEach(b=>b.onclick=()=>{const k=b.dataset.od,V=view();if(k==="limbo")G.p[V].readLimbo=true;if(k==="unknown")G.p[V].readUnknown=true;viewDark(k);render()});
}

function unitInfo(c){const U=UNIT[c.unit];if(!U)return "";
  const w=U.weapons?U.weapons.map(x=>`<li><b>${esc(x.name)}</b>: ${esc(x.text)}</li>`).join(""):"";
  return `<div class="uinfo">${unitSVG(c.unit,"var(--amber-hi)",30)}<div><b>${esc(U.name)}</b>${c.maxHp?" "+heartsHTML(c):""}${w?`<ul>${w}</ul>`:""}</div></div>`}

/* ---------------- card and spell info ---------------- */
const INFO={
 grunt:["Grunt","2 to 6",[["Score","its number + 1d6 on attack; its number alone on defense (+1d6 with a Queen)"],["Dice Max / MSV","6 / 24: four Grunts stack together"],["Soul","1 mana"],["Conjure","Soldier Conjure, 1 mana"],["Moves","one tile straight per turn"]],"The foot soldiers. Every card in a stack is one more hit it can take, and damage always removes the lowest card first."],
 infantry:["Infantry","7 to 10",[["Score","its number + 1d8 on attack; its number alone on defense (+1d8 with a Queen)"],["Dice Max / MSV","8 / 24: three Infantry stack together"],["Soul","1 mana"],["Conjure","Soldier Conjure, 1 mana"],["Moves","one tile straight per turn"]],"Heavier soldiers. They mix with Grunts, Jacks, Kings and Queens as long as the stacking formula holds."],
 jack:["Jack (Knight)","J",[["Score","10 + 1d12 on attack"],["Defense","cannot defend: a Jack adds nothing to its stack's defense"],["Dice Max / MSV","12 / 24: stacks with two Grunts or one Infantry"],["Moves","two tiles straight, or one diagonal, when only Jacks move"],["Attacks","a stack of only Jacks may also attack diagonally"],["Soul","1 mana · Jack Conjure, 1 mana"]],"Every player opens the game with a Jack inside their Ace. Move it out to fight."],
 queen:["Queen","Q",[["Score","0, no die of her own"],["Gift","everyone stacked with her rolls their dice on defense as well as attack"],["King","a King stacked with her takes no penalty for rolling a 1"],["Limits","one Queen per stack; no Dice Max or MSV; she cannot attack alone"],["Soul","2 mana · Queen Conjure, 2 mana"]],"The heart of a defensive stack. Pair her with a King to bunker down."],
 king:["King","K",[["Score","11 + 1d20 on attack"],["Rolls","a 20 deals double damage (or takes none on a failed attack); a 1 deals no damage on a win and takes two on a loss, unless a Queen is with him"],["Alone","cannot attack"],["Defeated in defense","every card stacked with him dies"],["Dice Max / MSV","20 / 28: lower cards adopt his MSV"],["Soul","2 mana · King Conjure, 2 mana · can't be sacrificed from a stack"]],"The strongest attacker, and the most dangerous to lose."],
 ace:["Ace","A",[["Defense","11 + 1d20 when attacked; cards inside it don't roll on defense"],["Limits","cannot move or attack; only on an empty backline tile; holds up to six cards"],["Falls","if the Ace takes damage, it and every card inside it are destroyed; on a roll of 1 it deals no damage back"],["Grave Blessing","+1d6 for each Ace you have on the field"],["Soul","3 mana · Ace Conjure, 3 mana · can't be sacrificed on the field, except to the Full Moon"],["Opening","each player starts with an Ace from their deck on a backline tile of their choice, holding a Jack"]],"A fortress and a grave-caller. Hard computers stack Aces to roll more Grave Blessing dice."],
 joker:["Joker (Necromancer)","Joker",[["Score","alone, copies the score and die of the enemy's leading card; Jokers can't kill Jokers"],["Spawns","only onto your stack holding a card of the same color (red or black)"],["Soul Capture","enemies that die on the 8 tiles around it, or its own tile, are held inside it, up to 6 mana of souls"],["Held souls","it keeps them until it dies (it and its souls go to the grave, unless an enemy Joker beside it steals them) or until Sacrificial Suicide moves them to your soul pile"],["Blood Moon","a Joker that shoots itself under a Blood Moon sends itself and every soul it held to the Outer Darkness"],["Survival","Horde Jokers capture your souls; when one shoots itself those cards go to the Outer Darkness and you lose 1 mana"],["Soul","1 mana · Joker Conjure, 2 mana"]],"The necromancer of the deck, and the only way to turn kills into mana."],
 samson:["Samson (Angel Machine)","Samson",[["Hearts","two: he loses one each time he takes damage, and falls at none"],["Slugshot Cannon","3d20, at an enemy two tiles away in a straight line or one diagonal; from two away a miss costs him nothing"],["Arm Blade","12 + 3d8, up close"],["Mech Slam","16 + 1d4, up close"],["Defense","12"],["Moves","one tile straight, or one or two diagonal"],["Stacks","with nothing but an Ace"],["Falls","Antony rises from his heart on the same tile, and Samson wanders through Limbo"]],"The Angel Machine's mech suit. Its deck holds one."],
 antony:["Antony (Angel Machine)","Antony",[["Hearts","two"],["Score","12 + 6d4 on attack, 12 on defense"],["Moves","like Samson"],["Bolts","every card he kills charges a bolt for Lightning Strike"],["Falls","he goes missing: his card is found under Unknown in the Outer Darkness"]],"The angel who was lodged in Samson's heart."],
 satan:["Satan","Satan",[["Hearts","three"],["Score","6d12 on attack and on defense, with no modifiers: no moon bonus, no odds, no Hate"],["Stacks","never"],["Falls","into the Outer Darkness"]],"Satan's own card, one in his deck."],
 tree:["Tree of Neither Life Or Death (Jester Fool)","Tree",[["Hearts","three; it cannot defend itself"],["Holds","up to six cards, like an Ace, but never Kings or tens"],["Gives","+2 mana at the start of each of your turns, and a free Puppet inside it every two rounds"],["Falls","into the Outer Darkness, with every card in it"]],"In the Jester's starting hand. Place it on an empty tile of your ground."],
 puppet:["Puppet (Jester Fool)","6",[["Score","a 6 Grunt: 6 + 1d6 on attack"],["Deck","every soldier in the Jester's deck is a Puppet"]],"Strings and wood."],
 bullgoat:["BullGoat (Jester Fool)","BullGoat",[["Hearts","two"],["Gore","10 + 1d20, up close"],["Charge","10 + 2d20 at an enemy two or three tiles away in a straight line with nothing between; the BullGoat ends next to its target"],["Defense","10"],["Stacks","never"],["Conjure","3 mana, into your hand"]],"The Jester's beast."],
 slavemaster:["Slavemaster (Binah)","SM",[["Score","8 + 1d8 on attack, stacks like an Infantry"],["Capture","enemy soldiers killed in its fights become your thralls, ten at most"]],"Three in Binah's deck."],
 slave:["Slave (Binah)","Slave",[["Rifle","10 + 1d12, at an enemy two tiles away in a straight line or one diagonal; from two away a miss costs nothing"],["Defense","none"],["Moves","one tile straight"],["Stacks","never"],["Deploy","the free Slaves spell (Necromancy) puts one thrall down on an empty tile of your ground"]],"A captured soldier with a chip in its head."]
};
function infoHTML(){
  const tabs=Object.keys(INFO).map((k,i)=>`<button class="itab ${i===0?"on":""}" data-k="${k}">${INFO[k][0]}</button>`).join("");
  const spells=SCHOOLS.map(sc=>`<h4>${sc}</h4><dl>`+SPELLS.filter(s=>s.school===sc).map(s=>`<dt>${esc(s.name)} <span>${s.id==="hypo"?"3 + 1 per extra card":s.dice?s.dice+" mana, rolled each round":s.cost?s.cost+" mana":"free"}</span></dt><dd>${esc(s.text)}</dd>`).join("")+"</dl>").join("");
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
 ["local","Local","2 to 4 players on one device, taking turns. The board turns to whoever is playing, and the screen goes dark while you pass it. Any seat can be a computer."],
 ["cpu","Versus Computer","You against 1 to 3 computers at Easy, Medium or Hard: one on one, free-for-all, or two against two with a computer at your side."],
 ["survival","Survival","1 to 4 players hold the line against a Horde that grows every round. Count the rounds you last."]];
let startMode=null;
const ORD=["One","Two","Three","Four"],SEATCOL=[0,3,2,5],SEATSOL=["tetra","icosa","cube","octa"];
const LAYOUTS={
 duel:["One on one","Two players, one army at each end of the field. Needs exactly 2 players."],
 ffa:["Free-for-all","Everyone for themselves, one player to each edge of the field. Needs 3 or 4 players."],
 "team-side":["2v2, side by side","Teammates hold two neighboring edges. Needs 4 players."],
 "team-across":["2v2, across","Teammates face each other from opposite edges, with the enemy on both flanks. Needs 4 players."],
 "team-same":["2v2, same side","Laid out like one on one: each team shares one end of the field, half its columns each. Needs 4 players."]};
const LAYNEED={duel:[2],ffa:[3,4],"team-side":[4],"team-across":[4],"team-same":[4]};
const LAYDEF={2:"duel",3:"ffa",4:"ffa"};
function seatForm(i,S,mode,L){
  const n=i+1,tm=L.startsWith("team"),team=tm?`<span class="sidetag s${S.team}">${S.team?"Side B":"Side A"}</span>`:"";
  let type;
  if(mode==="survival"||mode==="cpu"&&i===0)type=`<span class="dim">${mode==="cpu"?"You":"Human"}</span>`;
  else type=`<label class="f">Plays as <select data-seat="${i}" data-k="type">${(mode==="cpu"?[]:[["human","Human"]]).concat([["easy","Computer · Easy"],["medium","Computer · Medium"],["hard","Computer · Hard"]]).map(([v,t])=>`<option value="${v}" ${S.type===v?"selected":""}>${t}</option>`).join("")}</select></label>`;
  return `<fieldset class="pf seat" style="--pc:${TRIBES[S.tribe]&&TRIBES[S.tribe].color||S.color}"><legend>Player ${ORD[i]} ${team}</legend>
<div class="srow"><label class="f">Name <input data-seat="${i}" data-k="name" value="${esc(S.name)}" maxlength="20"></label>${type}</div>
<details class="look" ${S.type==="human"||tm||S.open?"open":""}><summary>${tm?"Team, Substance, color and symbol":"Substance, color and symbol"}</summary>
${tm?`<div class="f"><span>Team</span><div class="opts">${[0,1].map(t=>`<label class="opt"><input type="radio" name="tm${n}" data-seat="${i}" data-k="team" value="${t}" ${S.team===t?"checked":""}><span>${t?"Side B":"Side A"}<small>${t?"Plays against Side A.":"Plays against Side B."} Each side needs two players.</small></span></label>`).join("")}</div></div>`:""}
<div class="f"><span>Substance</span><div class="opts subs">${Object.entries(TRIBES).map(([k,t])=>`<label class="opt${t.soon?" off":""}"><input type="radio" name="tr${n}" data-seat="${i}" data-k="tribe" value="${k}" ${k===S.tribe?"checked":""} ${t.soon?"disabled":""}><span>${t.color?`<i class="subsym">${solidSVG(t.solid,t.color,18)}</i>`:""}${t.name}<small>${t.sub}</small></span></label>`).join("")}</div></div>
${TRIBES[S.tribe]&&TRIBES[S.tribe].color?`<p class="dim fixednote">${esc(TRIBES[S.tribe].name)} always plays in its own color and symbol: ${solidSVG(TRIBES[S.tribe].solid,TRIBES[S.tribe].color,20)}</p>`:`<div class="f"><span>Color</span><div class="opts swatches">${COLORS.map(([nm,hex])=>`<label class="sw" title="${nm}"><input type="radio" name="co${n}" data-seat="${i}" data-k="color" value="${hex}" ${hex===S.color?"checked":""}><span style="--pc:${hex}"></span><em>${nm}</em></label>`).join("")}</div></div>
<div class="f"><span>Symbol</span><div class="opts solids">${Object.entries(SOLIDS).map(([k,nm])=>`<label class="so-opt" title="${nm}"><input type="radio" name="so${n}" data-seat="${i}" data-k="solid" value="${k}" ${k===S.solid?"checked":""}><span>${solidSVG(k,"#f3d6a6",28)}<em>${nm}</em></span></label>`).join("")}</div></div>`}
</details></fieldset>`;
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
  const seatsS=[0,1,2,3].map(i=>({name:mode==="survival"&&i===0?"Survivor":`Player ${ORD[i]}`,type:mode==="survival"||i===0?"human":mode==="cpu"?"medium":"human",
    tribe:i===0?"binah":"random",color:COLORS[SEATCOL[i]][1],solid:SEATSOL[i],team:i%2,named:false}));
  let curLayout=null;
  const counts=mode==="survival"?[1,2,3,4]:[2,3,4];
  const forms=`<fieldset class="pf"><legend>Table</legend>
<label class="f">${mode==="survival"?"Players against the Horde":"Players"} <select id="pcount">${counts.map(c=>`<option value="${c}" ${c===counts[0]?"selected":""}>${c}</option>`).join("")}</select></label>
<div class="f" id="layoutf" ${mode==="survival"?"hidden":""}><span>Layout</span><div class="opts">${Object.entries(LAYOUTS).map(([k,[t,d]],i)=>`<label class="opt" data-lay="${k}"><input type="radio" name="olayout" value="${k}" ${i===0?"checked":""}><span>${t}<small>${d}</small></span></label>`).join("")}</div></div>
<p class="dim" id="laynote"></p></fieldset><div id="seats"></div>`;
  const diff="";
  const rules=`<fieldset class="pf"><legend>Turns</legend>
<label class="f">Turn order <select id="oturns"><option value="classic">Classic: each player takes every phase in turn</option><option value="prep">Draw and prep together, then attacks in turns</option><option value="all">Every phase together</option></select></label>
<p class="dim" id="turnnote"></p>
<label class="f">Phase timer <select id="otimer"><option value="0" selected>Off (default)</option><option value="30">30 seconds</option><option value="60">60 seconds (draw phase 30)</option><option value="90">90 seconds (draw phase 30)</option></select></label>
<p class="dim">When the timer runs out the game moves on to the next phase. During setup it places your cards for you, the way a Medium computer would.</p>
<label class="f">Computer speed <select id="ospeed"><option value="slow">Slow</option><option value="normal" selected>Normal (default)</option><option value="fast">Fast</option></select></label>
</fieldset>
<fieldset class="pf" id="elimset" hidden><legend>When a player falls</legend><div class="opts">
<label class="opt"><input type="radio" name="oelim" value="grave" checked><span>To the grave (default)<small>Their deck and hand go to the grave, and the grave is shuffled.</small></span></label>
<label class="opt"><input type="radio" name="oelim" value="dark"><span>To the Outer Darkness<small>Their deck and hand are gone for good.</small></span></label></div></fieldset>
<fieldset class="pf"><legend>Field</legend>
${chk("olock","Optional Ace rule","Cards inside an Ace must match its color.",false)}
</fieldset>
<fieldset class="pf"><legend>Mana</legend>
<label class="f">Starting mana <select id="omana"><option value="3d2" selected>3d2 (default)</option><option value="1d6">1d6</option><option value="none">None</option>${[1,2,3,4,5,6].map(n=>`<option value="${n}">${n}</option>`).join("")}</select></label>
${chk("oeach","Each player rolls their own","On by default with one deck; off by default otherwise, when one roll sets the same starting mana for everyone.",false)}
<p class="dim">Starting souls come from the Ether as soldier souls, worth 1 mana each.</p>
</fieldset>
<fieldset class="pf"><legend>Moon and spells</legend>
${chk("omoon","Moon combat bonus","Every attack adds 1d2 at the Full Moon, and every defense adds 1d2 at the New Moon.",true)}
${chk("oatk","Spells in the attack phase","Enchantments, curses and sorcery can also be cast while attacking. Necromancy, conjuring and sacrifices stay in prep.",false)}
${chk("oblood","Blood Moon mode","The game opens on a Blood Moon. Each deck is shuffled and two thirds of it go to the grave; each player starts with a Joker in hand.",false)}
</fieldset>`;
  const display=`<fieldset class="pf"><legend>Your hand</legend><div class="opts">
<label class="opt"><input type="radio" name="dhand" value="below" ${PREF.hand!=="side"?"checked":""}><span>Under your deck and mana (default)<small>Right below your own bars, with your dice box.</small></span></label>
<label class="opt"><input type="radio" name="dhand" value="side" ${PREF.hand==="side"?"checked":""}><span>Beside the field<small>In the right-hand column, above the spells.</small></span></label></div></fieldset>
<fieldset class="pf"><legend>Selected stack box</legend><div class="opts">
<label class="opt"><input type="radio" name="dsel" value="bottom" ${PREF.sel!=="top"?"checked":""}><span>Below the spells (default)<small>Under "show available souls".</small></span></label>
<label class="opt"><input type="radio" name="dsel" value="top" ${PREF.sel==="top"?"checked":""}><span>Above the spells<small>At the top of the right-hand column.</small></span></label></div></fieldset>
<fieldset class="pf"><legend>Turn buttons</legend><div class="opts">
<label class="opt"><input type="radio" name="dctl" value="bottom" ${PREF.ctl!=="top"?"checked":""}><span>Under the field (default)<small>Roll, next phase and end turn sit in a bar right below the board, on the page.</small></span></label>
<label class="opt"><input type="radio" name="dctl" value="top" ${PREF.ctl==="top"?"checked":""}><span>At the top, under the moon<small>Beside the moon and the phases.</small></span></label></div></fieldset>
<fieldset class="pf"><legend>Tile names</legend><div class="opts">
<label class="opt"><input type="radio" name="dcoord" value="0" ${PREF.coords?"":"checked"}><span>Off (default)<small>Like a chessboard without its letters and numbers.</small></span></label>
<label class="opt"><input type="radio" name="dcoord" value="1" ${PREF.coords?"checked":""}><span>On<small>Each tile shows its name in a corner: columns A, B, C from the left, rows 1, 2, 3 from the bottom.</small></span></label></div>
<p class="dim">Tile names are always used in the dice box history, either way.</p></fieldset>
<fieldset class="pf pc-only"><legend>Page width</legend><div class="opts">
<label class="opt"><input type="radio" name="dfull" value="0" ${PREF.full?"":"checked"}><span>Standard (default)<small>The page keeps the width of the rest of the site.</small></span></label>
<label class="opt"><input type="radio" name="dfull" value="1" ${PREF.full?"checked":""}><span>Full width<small>The page fills the whole width of a wide screen, and the field grows with it.</small></span></label></div></fieldset>
<fieldset class="pf"><legend>Page theme</legend><div class="opts">${Object.entries(THEMES).map(([k,[n]])=>`<label class="opt"><input type="radio" name="dtheme" value="${k}" ${PREF.theme===k?"checked":""}><span>${n}<small>${({"":"The burnt amber of the site.",jester:"Black, after chapter 26.",ten:"White on indigo, after chapters 1–4.",satan:"Crimson, after chapter 23."})[k]}</small></span></label>`).join("")}</div><p class="dim">A Blood Moon overrides the theme while it lasts. Card icon size, interface size, text size, hand position, tile names, page width and theme can also be changed at the bottom of the screen during play.</p></fieldset>`;
  const suitSel=`<div id="suitpick" hidden><p class="dim">${mode==="local"?"Player One picks; Player Two gets the other two suits.":mode==="cpu"?"You pick; the computer gets the other two suits.":"You pick; the other two suits wait in the Ether."}</p>
<label class="f">Red suit <select id="osuitR"><option value="H">♥ Hearts</option><option value="D">♦ Diamonds</option></select></label>
<label class="f">Black suit <select id="osuitB"><option value="S">♠ Spades</option><option value="C">♣ Clubs</option></select></label></div>`;
  const deckTab=`<fieldset class="pf" id="ffadecks" hidden><legend>Decks</legend><div class="opts">
<label class="opt"><input type="radio" name="offa" value="full" checked><span>A whole deck each (default)<small>Every player has all four suits.</small></span></label>
<label class="opt"><input type="radio" name="offa" value="half"><span>Half a deck each<small>One red and one black suit each; the rest wait in the Ether.</small></span></label></div></fieldset>
<fieldset class="pf" id="teamdecks" hidden><legend>Decks</legend><p class="dim">Each team has one deck: every teammate takes one red and one black suit of it, and one of its Jokers.</p>
${chk("oshare","Shared team deck","Teammates draw from one deck and spend from one soul pile, but keep their own hands.",false)}</fieldset>
<fieldset class="pf" id="dueldecks"><legend>Decks</legend><div class="opts">
${[["1","One deck",mode==="survival"?"You take one red and one black suit; the other half of the deck waits in the Ether.":"Both players split one deck: each takes one red and one black suit."],["2","Two decks (default)","Each player has a full deck of all four suits."],["3","Three decks","A full deck each, and a whole third deck waits in the Ether."]].map(([v,t,d])=>`<label class="opt"><input type="radio" name="odecks" value="${v}" ${v==="2"?"checked":""}><span>${t}<small>${d}</small></span></label>`).join("")}</div>
<div class="f" id="suitmode" hidden><span>Suits (one deck)</span><div class="opts"><label class="opt"><input type="radio" name="osuitmode" value="random" checked><span>Random (default)<small>Each player is dealt one red and one black suit at random.</small></span></label><label class="opt"><input type="radio" name="osuitmode" value="choose"><span>Choose<small>Pick the two suits below.</small></span></label></div>${suitSel}</div>
</fieldset>
<fieldset class="pf"><legend>Specials (Jacks, Queens, Kings, Aces, Jokers)</legend><div class="opts">
${[["none","None (default)","Only your opening Ace and its Jack. Every other special waits in the Ether to be conjured."],["half","Half","The specials of half your suits; the rest wait in the Ether."],["all","All","Every special of your suits is in your deck."]].map(([v,t,d])=>`<label class="opt"><input type="radio" name="ospecials" value="${v}" ${v==="none"?"checked":""}><span>${t}<small>${d}</small></span></label>`).join("")}</div>
${chk("ojoker","At least one Joker","Every player's deck holds at least one Joker, taken from the Ether if needed.",true)}
<p class="dim" id="decksum"></p>
</fieldset>`;
  const mapTab=`<fieldset class="pf"><legend>Battle map</legend><div class="opts">
<label class="opt"><input type="radio" name="omap" value="random"><span>Random<small>One of the four maps below, picked at the start.</small></span></label>
${["keep","sahel","forest","dungeon"].map(k=>`<label class="opt"><input type="radio" name="omap" value="${k}"><span>${MAPS[k].name}<small>${MAPS[k].sub}</small></span></label>`).join("")}
<span class="optgroup">Special Maps</span>
${["river","none"].filter(k=>!(mode==="survival"&&k==="river")).map(k=>`<label class="opt"><input type="radio" name="omap" value="${k}" ${k==="none"?"checked":""}><span>${MAPS[k].name}${k==="none"?" (default)":""}<small>${MAPS[k].sub}</small></span></label>`).join("")}</div>
<div class="f" id="bridgeopt" hidden><span>Bridge</span><div class="opts"><label class="opt"><input type="radio" name="obridge" value="left" checked><span>Left<small>Two tiles wide, on the left of the river.</small></span></label><label class="opt"><input type="radio" name="obridge" value="right"><span>Right<small>Two tiles wide, on the right.</small></span></label></div></div>
</fieldset>
<fieldset class="pf" id="sizeset"><legend>Size</legend>
<div id="sizeduel"><p class="dim">On a phone, 5 wide is the largest size that stays easy to read.</p><div class="f"><span>Width</span><div class="opts">${[5,6,7].map(w=>`<label class="opt"><input type="radio" name="ocols" value="${w}" ${w===5?"checked":""}><span>${w} wide${w===5?" (default)":""}</span></label>`).join("")}</div></div>
${mode==="survival"?'<p class="dim">Survival always uses the midline: the field is 5 tall.</p>':chk("omid","Use the midline","An empty line between the two armies: 5 tall with it, 4 without.",true)}
</div>${chk("ocorners","Cut off the corners","The four corner tiles are removed from play. On by default for free-for-all and the 2v2 layouts on the edges.",false)}
<div id="sizeother" class="sizesel" hidden></div>
<p class="dim mapnote" id="rivernote" hidden>The River map is always 7 wide and 5 tall with the midline, and keeps its corners.</p>

</fieldset>
${mode==="survival"?"":`<fieldset class="pf"><legend>Victory</legend>${chk("ohq","Headquarters","Each side opens with two Aces as bases, and troops can only be spawned inside your Aces. The only ways to win are destroying every enemy base or an economic victory.",false)}</fieldset>`}`;
  const tabs=[["players","Players",forms],["map","Map",mapTab],["deck","Deck",deckTab],["rules","Rules",rules],["display","Display",display]];
  ovShow(`<div class="ovbox setup"><div class="shead"><h2>${M[1]}</h2><p class="dim">${M[2]}</p></div>
<div class="stabs" role="tablist">${tabs.map(([k,t],i)=>`<button type="button" role="tab" class="stab ${i?"":"on"}" data-t="${k}" aria-selected="${!i}">${t}</button>`).join("")}</div>
${tabs.map(([k,,h],i)=>`<div class="spanel" data-p="${k}" role="tabpanel" ${i?"hidden":""}>${h}</div>`).join("")}
<p class="acts sfoot"><button class="btn" id="go">${mode==="survival"?"Raise your Ace":"Roll for the opening"}</button> <button class="btn ghost" id="back">← Other modes</button> <a class="dim" href="ethers-crossroads-rules.html#modes">How the modes work</a></p></div>`);
  document.querySelectorAll(".stab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".stab").forEach(x=>{x.classList.toggle("on",x===b);x.setAttribute("aria-selected",x===b)});document.querySelectorAll(".spanel").forEach(p=>p.hidden=p.dataset.p!==b.dataset.t)});
  const count=()=>+$("#pcount").value;
  const layout=()=>{const n=count();if(mode==="survival")return n===1?"duel":"coop";const v=val("olayout");return v&&LAYNEED[v].includes(n)?v:LAYDEF[n]};
  const humans=()=>mode==="survival"?count():seatsS.slice(0,count()).filter(S=>S.type==="human").length;
  const drawSeats=()=>{
    const n=count(),L=layout();
    if(mode!=="survival"){
      document.querySelectorAll("#layoutf [data-lay]").forEach(o=>{const ok=LAYNEED[o.dataset.lay].includes(n);o.classList.toggle("off",!ok);const inp=o.querySelector("input");inp.disabled=!ok;inp.checked=o.dataset.lay===L})}
    const key=L+(L==="coop"?n:"");if(key!==curLayout){curLayout=key;sizeUp()}
    $("#laynote").textContent=mode==="survival"?(n===1?"One survivor on the usual field.":`${n} survivors share the bottom of the field, and the Horde spawns once for each of you. You take your turns one after another on this device, and the Horde moves first each round.`):"";
    $("#seats").innerHTML=seatsS.slice(0,n).map((S,i)=>seatForm(i,S,mode,L)).join("");
    $("#seats").querySelectorAll("[data-seat]").forEach(el=>el.addEventListener(el.tagName==="INPUT"&&el.type==="text"?"input":"change",()=>{
      const S=seatsS[+el.dataset.seat],k=el.dataset.k;S[k]=el.value;if(k==="name")S.named=true;
      if(k==="color")el.closest(".seat").style.setProperty("--pc",el.value);
      if(k==="type"){el.closest(".seat").querySelector(".look").open=el.value==="human";turnUp()}
      if(k==="team"){S.team=+el.value;drawSeats()}
      if(k==="tribe"){S.open=true;drawSeats()}
    }));
    const big=["ffa","team-side","team-across"].includes(L);
    $("#sizeduel").hidden=L!=="duel";
    if(!$("#ocorners").dataset.touched)$("#ocorners").checked=big;
    $("#ocorners").disabled=L==="coop";
    document.querySelectorAll('input[name=omap][value=river]').forEach(i=>{i.disabled=L!=="duel";i.closest(".opt").classList.toggle("off",i.disabled);if(i.disabled&&i.checked)document.querySelector('input[name=omap][value=none]').checked=true});
    $("#dueldecks").hidden=L!=="duel";$("#ffadecks").hidden=!(L==="ffa"||L==="coop");$("#teamdecks").hidden=!L.startsWith("team");
    $("#elimset").hidden=(mode==="survival"?n:n)<(mode==="survival"?2:3);
    turnUp();mapUp&&mapUp();sumUp();
  };
  const turnUp=()=>{
    const t=$("#oturns"),many=humans()>1;
    if(many){t.value="classic";t.disabled=true;$("#turnnote").textContent="With more than one person on this device, play is always turn by turn."}
    else{t.disabled=false;if(!t.dataset.touched)t.value=mode==="local"?"classic":"prep";
      $("#turnnote").textContent=t.value==="classic"?"Each player takes the draw, prep and attack phases before the next player goes.":t.value==="prep"?"Everyone draws and preps at once; a shared phase ends when every player is Ready. Then each player attacks in turn.":"Every phase is played at once; each phase ends when every player is Ready."}
  };
  $("#oturns").addEventListener("change",()=>{$("#oturns").dataset.touched=1;turnUp()});
  $("#ocorners").addEventListener("change",()=>$("#ocorners").dataset.touched=1);
  $("#pcount").addEventListener("change",drawSeats);
  document.querySelectorAll('input[name=olayout]').forEach(i=>i.addEventListener("change",drawSeats));
  let mapUp=null;
  function sizeUp(){
    const L=layout(),box=$("#sizeother"),n=count();box.hidden=L==="duel";if(L==="duel"){box.innerHTML="";return}
    const sel=(id,label,opts,def)=>`<label class="f">${label} <select id="${id}">${opts.map(v=>`<option value="${v}" ${v===def?"selected":""}>${v}${v===def?" (default)":""}</option>`).join("")}</select></label>`;
    const rng=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
    if(L==="ffa"||L==="team-side"||L==="team-across")box.innerHTML=sel("osize","Size (tiles on each side)",rng(5,9),7)+'<p class="dim">The field is square so every edge is the same. On a phone, 7 is the largest size that stays easy to read.</p>';
    else if(L==="team-same")box.innerHTML=sel("ocols2","Width",[6,7,8],6)+sel("orows2","Height",[4,5,6],6)+'<p class="dim">Each team holds two lines at one end. Height 4 has no midline, 5 has one line between the teams, and 6 has two.</p>';
    else{const h=n,dc=h===2?6:h===3?9:8,dr=h===2?5:6;box.innerHTML=sel("ocols2","Width",rng(Math.max(5,h*2),9),dc)+sel("orows2","Height",[5,6],dr)+'<p class="dim">The survivors split the bottom two lines; the Horde holds the top two.</p>'}
  }
  const sumUp=()=>{
    const d=+val("odecks"),sp=val("ospecials"),js=$("#ojoker").checked,np=mode==="survival"?1:2;
    if(layout()!=="duel"){$("#decksum").textContent="";return}
    if(!$("#oeach").dataset.touched)$("#oeach").checked=d===1;
    $("#suitmode").hidden=d!==1;$("#suitpick").hidden=d!==1||val("osuitmode")!=="choose";
    const s=d===1?2:4,j=d===1?1:2,keptSp=sp==="all"?4*s+j:sp==="half"?4*s/2+Math.floor(j/2):0;
    const keptJ=sp==="all"?j:sp==="half"?Math.floor(j/2):0;
    const deck=9*s+keptSp-(keptSp?2:0)+(js&&!keptJ?1:0);
    const outPer=4*s+j-keptSp-(keptSp?0:2)-(js&&!keptJ?1:0);
    const ether=outPer*np+(d===3?54:0)+(d===1&&np===1?26:0);
    $("#decksum").textContent=`Each deck starts with ${deck} cards, plus the opening Ace and Jack on the field. The Ether starts with ${ether} souls to conjure.`;
  };
  $("#oeach").addEventListener("change",()=>$("#oeach").dataset.touched=1);
  document.querySelectorAll('input[name=odecks],input[name=ospecials],input[name=osuitmode],#ojoker').forEach(i=>i.addEventListener("change",sumUp));sumUp();
  mapUp=()=>{const rv=val("omap")==="river";$("#bridgeopt").hidden=!rv;$("#rivernote").hidden=!rv;
    document.querySelectorAll('#sizeduel input').forEach(i=>i.disabled=rv);};
  document.querySelectorAll('input[name=omap]').forEach(i=>i.addEventListener("change",mapUp));drawSeats();
  $("#back").onclick=()=>{startMode=null;history.replaceState(null,"",location.pathname);showStart()};
  $("#go").onclick=()=>{
    const n=count(),L=layout();
    const used={};
    let players=seatsS.slice(0,n).map((S,i)=>{
      const cpu=S.type==="human"?null:S.type;
      let name=(S.name.trim()||`Player ${ORD[i]}`).slice(0,20);
      if(cpu&&!S.named){name=S.tribe==="random"?`Computer ${ORD[i]}`:`The ${TRIBES[S.tribe].name} computer`;used[name]=(used[name]||0)+1;if(used[name]>1)name+=` ${["","","II","III","IV"][used[name]]}`}
      return{name,tribe:S.tribe,color:S.color,solid:S.solid,cpu};
    });
    for(const t of ["angel","satan"])if(players.filter(p=>p.tribe===t).length>1){flash(`Only one player can be ${TRIBES[t].name}: it has a color of its own.`);return}
    if(new Set(players.filter(p=>!TRIBES[p.tribe].color).map(p=>p.color)).size<players.filter(p=>!TRIBES[p.tribe].color).length){flash("Every player needs a different color.");return}
    if(L.startsWith("team")){ // seats alternate sides: A, B, A, B
      const A=players.filter((p,i)=>!seatsS[i].team),B=players.filter((p,i)=>seatsS[i].team);
      if(A.length!==2){flash("Each side needs two players.");return}
      players=[A[0],B[0],A[1],B[1]];
    }
    if(mode==="survival")players.push({name:"The Horde",color:HORDE_COLOR,solid:pick(Object.keys(SOLIDS).filter(s=>!players.some(p=>p.solid===s)))||"dodeca",cpu:"horde"});
    PREF.hand=val("dhand")||PREF.hand;PREF.sel=val("dsel")||PREF.sel;PREF.ctl=val("dctl")||PREF.ctl;PREF.theme=val("dtheme")??PREF.theme;PREF.coords=val("dcoord")==="1";PREF.full=val("dfull")==="1";savePrefs();applyPrefs();
    startGame({mode,players,mid:mode==="survival"||!!($("#omid")&&$("#omid").checked),aceLock:$("#olock").checked,bloodStart:$("#oblood").checked,
      map:val("omap"),cols:L==="duel"?+val("ocols"):$("#ocols2")?+$("#ocols2").value:undefined,rows:$("#orows2")?+$("#orows2").value:undefined,size:$("#osize")?+$("#osize").value:undefined,corners:$("#ocorners").checked,bridge:val("obridge"),hq:!!($("#ohq")&&$("#ohq").checked),
      decks:+val("odecks"),specials:val("ospecials"),jokerSure:$("#ojoker").checked,suits:+val("odecks")===1&&val("osuitmode")==="choose"?[$("#osuitR").value,$("#osuitB").value]:null,
      startMana:$("#omana").value,manaEach:$("#oeach").checked,moonBonus:$("#omoon").checked,atkSpells:$("#oatk").checked,
      layout:L,turns:$("#oturns").value,timer:+$("#otimer").value,cpuSpeed:$("#ospeed").value,elimDark:val("oelim")==="dark",ffaDeck:val("offa"),shareDeck:$("#oshare").checked});
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
  force(o){G.forceMoon=o},jokerSuicide,mk,damage,mkUnit,attack,attackOptions};

/* ---------------- display preferences, page themes, leave warning, quotes ---------------- */
const PREF=(()=>{let p={};try{p=JSON.parse(localStorage.getItem("ec-prefs2")||"{}")}catch(e){}return Object.assign({hand:"below",sel:"bottom",ctl:"bottom",ci:1,ui:1,tz:1,coords:false,full:false,theme:""},p)})();
function savePrefs(){try{localStorage.setItem("ec-prefs2",JSON.stringify(PREF))}catch(e){}}
const THEMES={"":["Kenoma",[]],jester:["Jester",["th-black","th-jester"]],ten:["Ten",["th-indigo","th-blue"]],satan:["Disturbed Satan",["th-crimson"]]};
function applyMoonTheme(){
  const h=document.documentElement,b=!!(G&&G.moon.blood&&!G.over);
  for(const k in THEMES)for(const c of THEMES[k][1])h.classList.remove(c);
  h.classList.remove("bloodglitch");
  if(b)h.classList.add("th-crimson","bloodglitch");        // a Blood Moon overrides every page theme
  else for(const c of THEMES[PREF.theme]?THEMES[PREF.theme][1]:[])h.classList.add(c);
  if(window.nwkStatic)window.nwkStatic.level(b?3:1);
}
/* Text Size scales the words only: every font size in the stylesheets is multiplied, except on cards, stacks and dice */
const TZ_SKIP=/\.(card|cf|cx|stack|die|pk|cback|ecount|mini|gbar|gctl|gtog)\b|svg|#board \.rl|#gbar/;
let tzRules=null;
function applyTextScale(f){
  if(!tzRules){tzRules=[];
    for(const sh of document.styleSheets){let rs;try{rs=sh.cssRules}catch(e){continue}
      const walk=list=>{for(const r of list){if(r.cssRules&&!r.style)walk(r.cssRules);else if(r.style&&r.style.fontSize&&!TZ_SKIP.test(r.selectorText||"")&&/px|rem|vw|vh/.test(r.style.fontSize)&&!/em|%/.test(r.style.fontSize.replace(/rem/g,"")))tzRules.push([r,r.style.fontSize])}};
      walk(rs)}}
  for(const [r,orig] of tzRules)r.style.fontSize=f===1?orig:`calc(${orig} * ${f})`;
}
function applyPrefs(){
  const h=document.documentElement;
  applyTextScale(PREF.tz);
  document.body.classList.toggle("fullw",!!PREF.full);
  h.style.setProperty("--ci",PREF.ci);h.style.setProperty("--uiz",PREF.ui);
  const wrap=$("#handwrap"),slot=$("#handslot"),side=$("#sidehand");
  if(wrap&&slot&&side){const dest=PREF.hand==="below"?slot:side;if(wrap.parentNode!==dest)dest.appendChild(wrap)}
  document.body.classList.toggle("hand-below",PREF.hand==="below");
  const mv=(el,dest)=>{if(el&&dest&&el.parentNode!==dest)dest.appendChild(el)};
  mv($("#selwrap"),PREF.sel==="bottom"?$("#selbottom"):$("#seltop"));
  mv($("#controls"),PREF.ctl==="bottom"?$("#ctlbottom"):$("#ctltop"));
  if($("#actbar"))$("#actbar").hidden=PREF.ctl!=="bottom";
  document.body.classList.toggle("ctl-bottom",PREF.ctl==="bottom");
  const bar=$("#gbar");
  if(bar){$("#ciV").textContent=Math.round(PREF.ci*100)+"%";$("#uiV").textContent=Math.round(PREF.ui*100)+"%";$("#tzV").textContent=Math.round(PREF.tz*100)+"%";
    $("#pHand").textContent="Hand: "+(PREF.hand==="below"?"Under your deck":"Side");$("#pTheme").value=PREF.theme;
    $("#pCoord").textContent="Tile names: "+(PREF.coords?"On":"Off");$("#pCoord").setAttribute("aria-pressed",PREF.coords);
    $("#pFull").textContent="Page: "+(PREF.full?"Full width":"Standard");$("#pFull").setAttribute("aria-pressed",PREF.full)}
  applyMoonTheme();
}
function mountBar(){
  const L=document.createElement("div");L.id="gbarL";L.className="gbar";
  L.innerHTML=`<label>Theme <select id="pTheme">${Object.entries(THEMES).map(([k,[n]])=>`<option value="${k}">${n}</option>`).join("")}</select></label>`;
  const Rb=document.createElement("div");Rb.id="gbar";Rb.className="gbar";
  Rb.innerHTML=`<span class="gctl">Card Icons <button type="button" data-z="ci" data-d="-1" aria-label="Smaller card icons">−</button><b id="ciV"></b><button type="button" data-z="ci" data-d="1" aria-label="Bigger card icons">+</button></span><span class="gctl">UI Size <button type="button" data-z="ui" data-d="-1" aria-label="Smaller interface">−</button><b id="uiV"></b><button type="button" data-z="ui" data-d="1" aria-label="Bigger interface">+</button></span><span class="gctl">Text Size <button type="button" data-z="tz" data-d="-1" aria-label="Smaller text">−</button><b id="tzV"></b><button type="button" data-z="tz" data-d="1" aria-label="Bigger text">+</button></span><button type="button" id="pHand" class="gtog"></button><button type="button" id="pCoord" class="gtog"></button><button type="button" id="pFull" class="gtog pc-only"></button>`;
  document.body.append(L,Rb);
  $("#pTheme").onchange=e=>{PREF.theme=e.target.value;savePrefs();applyPrefs()};
  Rb.querySelectorAll("[data-z]").forEach(b=>b.onclick=()=>{const k=b.dataset.z,lim=k==="ci"?[.8,1.8]:k==="tz"?[.8,1.8]:[.8,1.4];PREF[k]=Math.round(Math.min(lim[1],Math.max(lim[0],PREF[k]+ +b.dataset.d*.1))*10)/10;savePrefs();applyPrefs()});
  $("#pHand").onclick=()=>{PREF.hand=PREF.hand==="below"?"side":"below";savePrefs();applyPrefs()};
  $("#pCoord").onclick=()=>{PREF.coords=!PREF.coords;savePrefs();applyPrefs();if(G)render()};
  $("#pFull").onclick=()=>{PREF.full=!PREF.full;savePrefs();applyPrefs()};
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

/* ---------------- maps: size, shape and battle-map art (all drawn in code, all at night) ---------------- */
const MAPS={
  keep:  {name:"Keep",           sub:"A stone keep, a graveyard on the midline and the enemy's barracks."},
  sahel: {name:"Sahel",          sub:"Red laterite and dry grass of the far north at night, with mud-brick walls and thatched huts."},
  forest:{name:"Forest",         sub:"A clearing in deep woods, with a palisade keep and a camp of tents."},
  dungeon:{name:"Dungeon",       sub:"Flagstones, pillars and torchlight, with no castle and no barracks."},
  river: {name:"River",          sub:"A wide brown river like the Ogun near Lagos, crossed by one bridge. Always 7 wide with the midline, and one on one only."},
  none:  {name:"No map",         sub:"Plain tiles."}
};
/* layouts: duel (two sides), ffa (3 or 4 players, one to each edge), team-side / team-across (2v2 on the edges),
   team-same (2v2, teammates side by side on one side), coop (Survival with several players on one side) */
const SIDES={bottom:{rot:0,fwd:[-1,0]},left:{rot:1,fwd:[0,1]},top:{rot:2,fwd:[1,0]},right:{rot:3,fwd:[0,-1]}};
function edgeTiles(side,rows,cols){const o=[];if(side==="bottom")for(let c=0;c<cols;c++)o.push([rows-1,c]);if(side==="top")for(let c=0;c<cols;c++)o.push([0,c]);if(side==="left")for(let r=0;r<rows;r++)o.push([r,0]);if(side==="right")for(let r=0;r<rows;r++)o.push([r,cols-1]);return o}
function mapPlan(o){
  const n=o.players.length,L=o.layout||"duel";
  let theme=o.map||"random";
  if(theme==="random")theme=pick(["keep","sahel","forest","dungeon"]);   // the special maps (River, no map) are only played when chosen
  if((o.mode==="survival"||L!=="duel")&&theme==="river")theme="keep";   // the river needs a two-sided field with every midline tile in play
  let cols=Math.max(5,Math.min(7,+o.cols||5)),mid=o.mode==="survival"||o.mid!==false,corners=!!o.corners,bridge=o.bridge==="right"?"right":"left",rows;
  if(theme==="river"){cols=7;mid=true;corners=false}
  const clamp=(v,a,b,d)=>{v=+v;return v>=a&&v<=b?Math.round(v):d};
  if(L==="ffa"||L==="team-side"||L==="team-across"){cols=rows=clamp(o.size,5,9,7);corners=o.corners!==false;mid=true}
  else if(L==="team-same"){cols=clamp(o.cols,6,8,6);rows=clamp(o.rows,4,6,6);mid=rows>4}
  else if(L==="coop"){const h=n-1;cols=clamp(o.cols,Math.max(5,h*2),9,h===2?6:h===3?9:8);rows=clamp(o.rows,5,6,h===2?5:6);mid=true;corners=false}
  else rows=mid?5:4;
  const V=Array.from({length:rows},()=>Array(cols).fill(false));
  if(corners)for(const r of [0,rows-1])for(const c of [0,cols-1])V[r][c]=true;
  if(theme==="river"){const r=2;for(let c=0;c<cols;c++)V[r][c]=!(bridge==="left"?c<2:c>=cols-2)}
  // seats: where each player spawns (zone), where their Aces go (back), which way is forward, how the view turns for them
  const seats=[],teams=[];
  const mk2=(side,cs,lines)=>{const S=SIDES[side],back=[],zone=[];
    for(let k=0;k<lines;k++)for(const c of cs){const r=side==="bottom"?rows-1-k:k;(k===0?back:zone).push([r,c]);zone.push([r,c])}
    return{side,rot:S.rot,fwd:S.fwd,back,zone:[...new Map(zone.map(t=>[t.join(),t])).values()]}};
  const allc=[...Array(cols).keys()];
  if(L==="duel"){seats.push(mk2("bottom",allc,2),mk2("top",allc,2));teams.push(0,1)}
  else if(L==="ffa"||L==="team-side"||L==="team-across"){
    const sides=L==="ffa"?(n===3?["bottom","left","right"]:["bottom","left","top","right"]):L==="team-side"?["bottom","right","left","top"]:["bottom","left","top","right"];
    sides.slice(0,n).forEach((sd,i)=>{const t=edgeTiles(sd,rows,cols);seats.push({side:sd,rot:SIDES[sd].rot,fwd:SIDES[sd].fwd,back:t,zone:t});teams.push(L==="ffa"?i:i%2)});
  }else if(L==="team-same"){
    const half=Math.floor(cols/2),lo=allc.slice(0,half),hi=allc.slice(half);
    seats.push(mk2("bottom",lo,2),mk2("top",hi,2),mk2("bottom",hi,2),mk2("top",lo,2));teams.push(0,1,0,1);
  }else if(L==="coop"){
    const h=n-1,w=Math.floor(cols/h);
    for(let i=0;i<h;i++){seats.push(mk2("bottom",allc.slice(i*w,i===h-1?cols:(i+1)*w),2));teams.push(0)}
    seats.push(mk2("top",allc,2));teams.push(1);
  }
  return{theme,cols,rows,mid,corners,bridge,void:V,seed:(Math.random()*1e9)|0,layout:L,seats,teams};
}
function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const PAL={
  keep:  {ground:"#26321e",patch:["#2d3a23","#1f2a18","#34432a"],tuft:"#5c703e",stone:"#6a6962",stone2:"#4f4e48",wood:"#5e4328",wood2:"#3e2c1a",tent:"#7a6646",dirt:"#3a2e20",grave:"#8a897f"},
  sahel: {ground:"#4c2d1b",patch:["#573421","#3f2516","#62402a"],tuft:"#8a7746",stone:"#8f5a33",stone2:"#6a4026",wood:"#7a5530",wood2:"#55391e",tent:"#937a45",dirt:"#52331e",grave:"#9a856c"},
  forest:{ground:"#1d3020",patch:["#233a26","#172719","#2a452c"],tuft:"#46683e",stone:"#57604f",stone2:"#3f463a",wood:"#5e4228",wood2:"#3e2b19",tent:"#66603f",dirt:"#2f2619",grave:"#7c8276"},
  dungeon:{ground:"#232229",patch:["#2a2931","#1b1a20","#323039"],tuft:"#3b3a42",stone:"#4f4e58",stone2:"#3b3a43",wood:"#4a3622",wood2:"#2f2216",tent:"#4a443c",dirt:"#28252a",grave:"#77757f"},
  river: {ground:"#4a2819",patch:["#55301e","#3d2114",""+"#5e3a24"],tuft:"#55783a",stone:"#6e4a30",stone2:"#503420",wood:"#6e4c2a",wood2:"#4a3018",tent:"#6e5c3a",dirt:"#4a2a1a",grave:"#86745e",water:"#3b3622",water2:"#6a6040"}
};
const f1=n=>n.toFixed(1);
/* the ground under the whole board, seen through the gaps between tiles */
function mapGround(){
  const M=G.map;if(M.theme==="none")return "";
  const P=PAL[M.theme],W=COLS*100,H=G.rows*100,rnd=rng(M.seed);let s=`<rect width="${W}" height="${H}" fill="${P.ground}"/>`;
  for(let i=0;i<COLS*G.rows*5;i++)s+=`<ellipse cx="${f1(rnd()*W)}" cy="${f1(rnd()*H)}" rx="${f1(14+rnd()*40)}" ry="${f1(8+rnd()*26)}" fill="${P.patch[Math.floor(rnd()*P.patch.length)]}" opacity=".7"/>`;
  if(M.theme==="dungeon")for(let x=0;x<W;x+=25)s+=`<path d="M${x},0V${H}" stroke="#0c0b0e" stroke-width="1.2"/>`;
  return `<svg class="mapground" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${s}<rect width="${W}" height="${H}" fill="#14204a" opacity=".14"/></svg>`;
}
/* the art inside one tile. role: fort | barracks | field | grave | water | bridge | void ; edge: "top" | "bottom" (the outer side of a backline) */
function tileArt(r,c,role,edge){
  const M=G.map;if(M.theme==="none")return "";
  const P=PAL[M.theme],T=M.theme,rnd=rng(M.seed+r*131+c*17);let s="";
  const rr=(a,b)=>a+rnd()*(b-a);
  const tufts=n=>{for(let i=0;i<n;i++){const x=rr(6,94),y=rr(6,84);s+=`<path d="M${f1(x)},${f1(y)}l-2,-5M${f1(x)},${f1(y)}l0,-6M${f1(x)},${f1(y)}l2,-5" stroke="${P.tuft}" stroke-width="1.1" stroke-linecap="round"/>`}};
  const rocks=n=>{for(let i=0;i<n;i++)s+=`<ellipse cx="${f1(rr(8,92))}" cy="${f1(rr(8,82))}" rx="${f1(rr(2,5))}" ry="${f1(rr(1.5,4))}" fill="${P.stone2}"/>`};
  const flags=(col1,col2)=>{for(let y=0;y<90;y+=18)for(let x=-(y/18%2)*12;x<100;x+=24)s+=`<rect x="${f1(x+1)}" y="${f1(y+1)}" width="22" height="16" rx="1.5" fill="${rnd()<.5?col1:col2}" stroke="#0008" stroke-width=".8"/>`};
  const tree=(x,y,R,col)=>{s+=`<circle cx="${f1(x+2)}" cy="${f1(y+3)}" r="${f1(R)}" fill="#0007"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(R)}" fill="${col}"/><circle cx="${f1(x-R*.3)}" cy="${f1(y-R*.3)}" r="${f1(R*.45)}" fill="#ffffff0d"/>`};
  const palm=(x,y,R)=>{for(let k=0;k<7;k++){const a=k/7*Math.PI*2+rnd()*.4;s+=`<path d="M${f1(x)},${f1(y)}q${f1(Math.cos(a+.4)*R*.6)},${f1(Math.sin(a+.4)*R*.6)} ${f1(Math.cos(a)*R)},${f1(Math.sin(a)*R)}" stroke="#2f4a22" stroke-width="2.4" fill="none" stroke-linecap="round"/>`}s+=`<circle cx="${f1(x)}" cy="${f1(y)}" r="2.2" fill="#3a2a18"/>`};
  const acacia=(x,y,R)=>{s+=`<ellipse cx="${f1(x+2)}" cy="${f1(y+2)}" rx="${f1(R)}" ry="${f1(R*.7)}" fill="#0006"/><ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(R)}" ry="${f1(R*.7)}" fill="#3a3a1e"/><ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(R*.55)}" ry="${f1(R*.38)}" fill="#47462a"/>`};
  let turn=0;if(edge==="left"){turn=90;edge="bottom"}else if(edge==="right"){turn=-90;edge="bottom"}
  const wallY=edge==="top"?0:78;
  if(role==="void"){
    if(T==="forest"||T==="river")for(let i=0;i<4;i++)tree(rr(10,90),rr(10,80),rr(10,18),T==="river"?"#203a1c":"#173018");
    else{s+=`<rect width="100" height="90" fill="#0006"/>`;rocks(9)}
  }else if(role==="water"){
    s+=`<rect width="100" height="90" fill="${P.water}"/>`;
    for(let i=0;i<7;i++){const y=rr(8,82),x=rr(-10,70);s+=`<path d="M${f1(x)},${f1(y)}q8,-3 16,0t16,0" stroke="${P.water2}" stroke-width="1.4" fill="none"/>`}
    for(let i=0;i<2;i++){const x=rr(10,90),y=rr(15,75);s+=`<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rr(8,16))}" ry="2" fill="#c8d4ff" opacity=".06"/>`}
    s+=`<path d="M0,2Q50,${f1(rr(5,10))} 100,2" stroke="#5a3a22" stroke-width="3" fill="none" opacity=".7"/><path d="M0,88Q50,${f1(rr(80,85))} 100,88" stroke="#5a3a22" stroke-width="3" fill="none" opacity=".7"/>`;
  }else if(role==="bridge"){
    s+=`<rect width="100" height="90" fill="${P.water}"/>`;
    for(let x=6;x<94;x+=11)s+=`<rect x="${x}" y="0" width="10" height="90" fill="${rnd()<.5?P.wood:P.wood2}" stroke="#0008" stroke-width=".8"/>`;
    s+=`<path d="M3,0V90M97,0V90" stroke="#2a1a0e" stroke-width="3"/>`;
  }else if(role==="fort"&&T!=="dungeon"&&T!=="river"){
    if(T==="sahel"){flags("#5a3520","#4f2e1b");s+=`<rect x="0" y="${wallY}" width="100" height="12" fill="${P.stone}"/>`;for(let x=2;x<100;x+=12)s+=`<path d="M${x},${edge==="top"?12:78}l5,${edge==="top"?5:-5}l5,${edge==="top"?-5:5}z" fill="${P.stone}"/>`}
    else if(T==="forest"){for(let y=0;y<90;y+=12)s+=`<rect x="0" y="${y}" width="100" height="11" fill="${rnd()<.5?P.wood:P.wood2}" opacity=".85"/>`;s+=`<rect x="0" y="${wallY}" width="100" height="12" fill="#3a2614"/>`;for(let x=3;x<100;x+=9)s+=`<circle cx="${x}" cy="${wallY+6}" r="4" fill="#4a3220" stroke="#0007"/>`}
    else{flags(P.stone,P.stone2);s+=`<rect x="0" y="${wallY}" width="100" height="12" fill="#5a5a55" stroke="#0009"/>`;for(let x=0;x<100;x+=14)s+=`<rect x="${x+2}" y="${edge==="top"?12:72}" width="8" height="6" fill="#5a5a55" stroke="#0009" stroke-width=".8"/>`}
    if(c===0||c===COLS-1){const x=c===0?14:86;s+=`<circle cx="${x}" cy="${edge==="top"?14:76}" r="12" fill="${T==="sahel"?P.stone:"#5f5f59"}" stroke="#000a" stroke-width="1.2"/><circle cx="${x}" cy="${edge==="top"?14:76}" r="6" fill="#0006"/>`}
  }else if(role==="barracks"&&T!=="dungeon"&&T!=="river"){
    s+=`<rect width="100" height="90" fill="${P.dirt}" opacity=".7"/>`;
    if(T==="sahel"){for(let i=0;i<2;i++){const x=rr(25,75),y=rr(25,65),R=rr(12,16);s+=`<circle cx="${f1(x+2)}" cy="${f1(y+2)}" r="${f1(R)}" fill="#0007"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(R)}" fill="${P.tent}"/>`;for(let k=0;k<12;k++){const a=k/12*Math.PI*2;s+=`<path d="M${f1(x)},${f1(y)}L${f1(x+Math.cos(a)*R)},${f1(y+Math.sin(a)*R)}" stroke="#4a3a1e" stroke-width=".8"/>`}}}
    else{const n=rnd()<.5?1:2;for(let i=0;i<n;i++){const R=n===1?rr(20,24):rr(14,17),x=n===1?rr(38,62):(i?rr(66,78):rr(22,34)),y=rr(34,56);
      s+=`<circle cx="${f1(x+3)}" cy="${f1(y+3)}" r="${f1(R)}" fill="#0008"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(R)}" fill="${P.tent}" stroke="#000a" stroke-width="1"/>`;
      for(let k=0;k<8;k++){const a=k/8*Math.PI*2;s+=`<path d="M${f1(x)},${f1(y)}L${f1(x+Math.cos(a)*R)},${f1(y+Math.sin(a)*R)}" stroke="#0005" stroke-width="1"/>`}
      s+=`<circle cx="${f1(x)}" cy="${f1(y)}" r="2.2" fill="#2a1e12"/>`;
      for(let k=0;k<4;k++){const a=k/4*Math.PI*2+.4;s+=`<path d="M${f1(x+Math.cos(a)*R)},${f1(y+Math.sin(a)*R)}l${f1(Math.cos(a)*6)},${f1(Math.sin(a)*6)}" stroke="#a89878" stroke-width=".7"/>`}}
      for(let i=0;i<2;i++){const x=rr(8,88),y=rr(72,84);s+=`<rect x="${f1(x)}" y="${f1(y)}" width="9" height="6" fill="${P.wood}" stroke="#0008" stroke-width=".7"/>`}}
    if(rnd()<.4){const x=rr(70,88),y=rr(60,80);s+=`<circle cx="${f1(x)}" cy="${f1(y)}" r="7" fill="#ff8a2a" opacity=".18"/><circle cx="${f1(x)}" cy="${f1(y)}" r="2.6" fill="#ffb24a" opacity=".8"/>`}
  }else if(role==="grave"&&T!=="river"){
    s+=`<rect width="100" height="90" fill="${P.dirt}" opacity=".55"/>`;
    const n=2+Math.floor(rnd()*3);
    for(let i=0;i<n;i++){const x=rr(10,82),y=rr(10,70);
      if(T==="sahel")s+=`<circle cx="${f1(x)}" cy="${f1(y)}" r="5" fill="${P.grave}"/><circle cx="${f1(x+4)}" cy="${f1(y+3)}" r="4" fill="#5d4c3c"/><circle cx="${f1(x+1)}" cy="${f1(y+6)}" r="3.5" fill="#6a5848"/>`;
      else if(rnd()<.3)s+=`<path d="M${f1(x+4)},${f1(y)}v14M${f1(x)},${f1(y+4)}h8" stroke="${P.grave}" stroke-width="2.2"/>`;
      else s+=`<rect x="${f1(x+1.5)}" y="${f1(y+1.5)}" width="10" height="14" rx="4" fill="#0008"/><rect x="${f1(x)}" y="${f1(y)}" width="10" height="14" rx="4" fill="${P.grave}"/><rect x="${f1(x+2)}" y="${f1(y+16)}" width="6" height="7" fill="#1a140e" opacity=".7"/>`}
    if(T==="dungeon")s+=`<path d="M${f1(rr(10,40))},${f1(rr(40,80))}l12,-4m-6,-3l3,8" stroke="#a8a294" stroke-width="1.6"/>`;
    else rocks(2);
  }else if(T==="dungeon"){
    flags(P.stone,P.stone2);
    if(rnd()<.35)s+=`<path d="M${f1(rr(10,60))},${f1(rr(10,40))}l9,7l-3,8l10,6" stroke="#0b0a0d" stroke-width="1.2" fill="none"/>`;
    if((role==="fort"||role==="barracks")&&rnd()<.5){const x=c%2?84:16;s+=`<circle cx="${x}" cy="45" r="9" fill="#2a292f" stroke="#000" stroke-width="1.2"/>`}
    if(rnd()<.18){const x=rr(10,90);s+=`<circle cx="${f1(x)}" cy="${edge==="top"?6:84}" r="14" fill="#ff9a3a" opacity=".12"/><circle cx="${f1(x)}" cy="${edge==="top"?6:84}" r="2.4" fill="#ffc06a"/>`}
  }else{ // open ground: frontlines, and the backlines of the river map
    if(T==="sahel"){tufts(5);for(let i=0;i<3;i++){const y=rr(10,80);s+=`<path d="M${f1(rr(0,40))},${f1(y)}q12,-3 24,0" stroke="#4a2c1a" stroke-width="1.2" fill="none"/>`}if(rnd()<.3)acacia(rr(18,82),rr(18,72),rr(9,13))}
    else if(T==="forest"){tufts(4);if(rnd()<.5)tree(c%2?rr(78,92):rr(8,22),rr(10,80),rr(8,13),"#173018");rocks(1)}
    else if(T==="river"){tufts(4);rocks(1);if(rnd()<.45)palm(rr(15,85),rr(15,75),rr(12,17));if(role!=="field"&&rnd()<.5)tree(rr(10,90),rr(10,80),rr(7,11),"#203a1c")}
    else{tufts(6);rocks(2);if(rnd()<.25)s+=`<path d="M0,${f1(rr(30,60))}q50,${f1(rr(-10,10))} 100,0" stroke="#2c2618" stroke-width="5" fill="none" opacity=".6"/>`}
  }
  if(turn)s=`<g transform="rotate(${turn} 50 45) scale(1.12) translate(-5.4,-4.8)">${s}</g>`;
  return `<svg class="tart" viewBox="0 0 100 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${s}<rect width="100" height="90" fill="#14204a" opacity=".12"/></svg>`;
}
function tileRole(r,c){
  if(G.map.theme==="river"&&r===2)return isVoid(r,c)?"water":"bridge";
  if(isVoid(r,c))return "void";
  const b=G.backz[r][c];
  if(b>=0){if(G.map.layout==="duel"||G.map.layout==="coop"||G.map.layout==="team-same")return seat(b).side==="bottom"?"fort":"barracks";return b%2?"barracks":"fort"}
  if(G.zone[r][c]>=0)return "field";
  if(G.map.layout==="duel")return G.rows===5&&r===2?"grave":"field";
  if(G.rows===G.map.cols&&G.rows>=7)return Math.max(Math.abs(r-(G.rows-1)/2),Math.abs(c-(COLS-1)/2))<=1?"grave":"field";
  return r>=2&&r<=G.rows-3?"grave":"field";
}
/* which side of a tile is the outer edge, as the viewer sees it */
function outerEdge(r,c,rot){
  const b=G.backz[r][c];if(b<0)return "bottom";
  const order=["bottom","left","top","right"],i=order.indexOf(seat(b).side);
  return order[(i-rot+4)%4];
}

/* ---------------- Substances: what each one adds to the game ----------------
   Random, Beginner, Angel Machine, Satan, Binah, Jester Fool (and Tiphareth of Kether, plain for now).
   Lucifer & Ouroboros, The Leviathan and Yaldabaoth come in the next update. */

/* Random becomes a real Substance before the game starts; fixed colors and symbols are applied */
function resolveSubstances(opts){
  const taken=new Set();
  for(const p of opts.players)if(p.tribe&&TRIBES[p.tribe]&&TRIBES[p.tribe].color&&!TRIBES[p.tribe].soon)taken.add(p.tribe);
  for(const p of opts.players){
    if(p.cpu==="horde")continue;
    if(!p.tribe||!TRIBES[p.tribe]||p.tribe==="random"||TRIBES[p.tribe].soon){
      const pool=PLAYABLE.filter(k=>!(TRIBES[k].color&&taken.has(k)));
      p.tribe=pick(pool);p.randomSub=true;if(TRIBES[p.tribe].color)taken.add(p.tribe);
    }
    const T=TRIBES[p.tribe];if(T.color)p.color=T.color;if(T.solid)p.solid=T.solid;
  }
  // a fixed color can collide with a color someone picked: the one who picked moves to a free color
  const used=new Set(opts.players.filter(p=>p.cpu!=="horde"&&TRIBES[p.tribe].color).map(p=>p.color));
  for(const p of opts.players){
    if(p.cpu==="horde"||TRIBES[p.tribe].color)continue;
    if(used.has(p.color))p.color=COLORS.map(c=>c[1]).find(c=>!used.has(c))||p.color;
    used.add(p.color);
  }
}
const subOf=pl=>G.p[pl]?G.p[pl].tribe:null;
const usedOnce=id=>!!(me().once&&me().once[id]);
const treeOf=pl=>stacksOf(pl).find(x=>hasK(x.st,"tree"));

/* the cards each Substance brings into its deck */
function substanceDecks(pls){
  for(const pl of pls){
    const P=G.p[pl];P.once={};
    if(P.tribe==="angel"){P.deck.push(mkUnit("samson",pl));P.bolts=0}
    if(P.tribe==="satan")P.deck.push(mkUnit("satan",pl));
    if(P.tribe==="binah"){for(let i=0;i<3;i++)P.deck.push(mkUnit("slavemaster",pl));P.thralls=[]}
    if(P.tribe==="jester"){
      for(const c of P.deck)if(kind(c)==="grunt"||kind(c)==="infantry"){c.rank="6";c.puppet=true}   // every soldier is a Puppet: a 6 Grunt
      P.startSpec=P.deck.map(c=>({rank:c.rank,suit:c.suit,color:c.color,puppet:!!c.puppet}));
    }
    shuffle(P.deck);
  }
}
/* after the opening hand is drawn */
function dealExtras(pl){
  const P=G.p[pl];
  const take=k=>{let i=P.deck.findIndex(c=>kind(c)===k);if(i>=0)return P.deck.splice(i,1)[0];i=G.ether.findIndex(c=>kind(c)===k);if(i>=0)return G.ether.splice(i,1)[0];return null};
  if(P.tribe==="jester"){const t=mkUnit("tree",pl);P.hand.push(t);log(`${plName(pl)} holds the Tree of Neither Life Or Death.`)}
  if(P.tribe==="beginner"){
    const a=take("ace")||mk("A",pick(["S","H","D","C"])),j=take("joker")||mk("JK",null,pick(["red","black"]));
    a.owner=pl;j.owner=pl;P.hand.push(a,j);log(`${plName(pl)} starts with a second Ace and a Joker in hand.`);
  }
}
/* when a player's Ace is down at setup */
function setupDone(pl){
  const P=G.p[pl];
  if(P.tribe!=="beginner"||P.gruntsDown)return;P.gruntsDown=true;
  const cx=(COLS-1)/2,cy=(G.rows-1)/2;
  let tiles=zoneTiles(pl).filter(([r,c])=>isFront(pl,r,c)&&!G.board[r][c]);
  if(!tiles.length)tiles=zoneTiles(pl).filter(([r,c])=>!G.board[r][c]);
  if(!tiles.length)return;
  tiles.sort((a,b)=>Math.hypot(a[0]-cy,a[1]-cx)-Math.hypot(b[0]-cy,b[1]-cx));
  const [r,c]=pick(tiles.slice(0,3));   // the center, or just left or right of it
  const gs=[];
  for(let i=0;i<3;i++){let k=P.deck.findIndex(x=>kind(x)==="grunt");let g=k>=0?P.deck.splice(k,1)[0]:null;
    if(!g){k=G.ether.findIndex(x=>kind(x)==="grunt");g=k>=0?G.ether.splice(k,1)[0]:mk(String(2+Math.floor(Math.random()*5)),pick(["S","H","D","C"]))}
    g.owner=pl;gs.push(g)}
  G.board[r][c]={owner:pl,cards:gs,moved:true,attacked:false};
  log(`${plName(pl)}'s three Grunts are already standing on ${coord(r,c)}.`);
}
/* the start of each round, after the moon */
function substanceRound(){
  for(const P of G.p){
    if(P.out||P.tribe!=="jester"||G.moon.round%2)continue;
    const t=treeOf(P.i);if(!t)continue;
    if(t.st.cards.length>6){log(`The Tree is full: no Puppet grows for ${plName(P.i)}.`);continue}
    const c=mk("6",pick(["S","H","D","C"]));c.puppet=true;c.owner=P.i;t.st.cards.push(c);
    log(`A free Puppet grows in ${plName(P.i)}'s Tree on ${coord(t.r,t.c)}.`);notify(P.i,`A Puppet grows in ${esc(P.name)}'s Tree.`);
  }
}
/* the start of a player's own turn */
function substanceTurn(pl){
  const P=G.p[pl];
  if(P.shield){P.shield=false;log(`${plName(pl)}'s Please Don't Hurt Me wears off.`)}
  if(P.tribe==="jester"&&treeOf(pl)){
    let got=0;for(let i=0;i<2&&mana(pl)<soulCap(pl);i++){const j=G.ether.findIndex(c=>/^\d+$/.test(c.rank));const c=j>=0?G.ether.splice(j,1)[0]:mk(String(2+Math.floor(Math.random()*9)),pick(["S","H","D","C"]));addSoul(pl,c);got++}
    if(got)log(`The Tree of Neither Life Or Death gives ${plName(pl)} ${got} mana.`);
  }
}
/* the end of a player's own turn */
function substanceEnd(pl){
  for(const {st} of stacksOf(pl))if(st.stun){st.stun--;if(!st.stun)log(`${plName(pl)}'s stack can move again: the lightning wears off.`)}
}
function addBolts(pl,n,why){
  const P=G.p[pl];if(P.tribe!=="angel"||!n)return;
  const before=P.bolts||0;P.bolts=Math.min(3,before+n);
  if(P.bolts>before){log(`${plName(pl)} gains ${P.bolts-before} bolt${P.bolts-before>1?"s":""} from ${why} (${P.bolts}/3).`);
    if(P.bolts===3&&before<3)notify(pl,`${esc(P.name)}'s three bolts are charged: Lightning Strike is ready.`)}
}
/* where Substance cards go when they die; true when handled */
function buryUnit(card,r,c,owner){
  const u=card.unit,P=G.p[owner];
  if(u==="samson"){
    G.limbo.push(card);G.p.forEach(Q=>Q.readLimbo=false);
    const a=mkUnit("antony",owner);let placed=null;
    const here=G.board[r][c];
    if(!here){G.board[r][c]={owner,cards:[a],moved:true,attacked:true,hypo:0};placed=[r,c]}
    else if(here.owner===owner&&stackLegal([...here.cards,a])){here.cards.push(a);placed=[r,c]}
    else for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const rr=r+dr,cc=c+dc;if(at(rr,cc)===null&&!isVoid(rr,cc)){G.board[rr][cc]={owner,cards:[a],moved:true,attacked:true,hypo:0};placed=[rr,cc];break}}
    if(!placed)P.hand.push(a);
    log(`<b>Samson falls.</b> ${plName(owner)}'s Antony rises from his heart${placed?` on ${coord(placed[0],placed[1])}`:", into the hand"}. Samson wanders through Limbo.`,"event");
    popup("Antony rises",`<p>The angel Antony was sharing Samson's form, lodged into his heart, and has resurrected his corpse with himself.</p><p class="dim">Samson's card is not in the grave or the Outer Darkness: he wanders through Limbo. Look for the Limbo tab in the Outer Darkness.</p>`,owner);
    return true;
  }
  if(u==="antony"){
    G.unknown.push(card);G.p.forEach(Q=>Q.readUnknown=false);
    log(`<b>Antony is gone.</b> ${plName(owner)}'s Antony went missing.`,"event");
    popup("Antony went missing",`<p>The card leaves no body behind. Antony went missing.</p><p class="dim">Look for the Unknown tab in the Outer Darkness.</p>`,owner);
    return true;
  }
  if(u==="satan"){toDark(card);log(`<b>Satan falls into the Outer Darkness.</b>`,"event");notify(owner,`Satan falls into the Outer Darkness.`);return true}
  if(u==="tree"){toDark(card);notify(owner,`${esc(P.name)}'s Tree of Neither Life Or Death falls into the Outer Darkness.`);return true}
  if(u==="slave"){delete card.unit;return false}   // the Slave dies as the soldier it once was
  return false;
}

/* ---------------- popups and notifications ---------------- */
const POPQ=[];
function popup(title,html,pl){
  if(!G||G.opts.fast)return;
  POPQ.push({title,html,col:pl!=null&&G.p[pl]?G.p[pl].color:"var(--amber)"});if(POPQ.length===1)showPop();
}
function showPop(){
  let el=$("#pop");if(!el){el=document.createElement("div");el.id="pop";document.body.appendChild(el)}
  const q=POPQ[0];el.hidden=false;
  el.innerHTML=`<div class="popbox" role="alertdialog" aria-labelledby="popt" style="--pc:${q.col}"><h2 id="popt">${esc(q.title)}</h2>${q.html}<p class="acts"><button class="btn" id="popok">Okay</button></p></div>`;
  $("#popok").focus({preventScroll:true});
  $("#popok").onclick=()=>{POPQ.shift();if(POPQ.length)showPop();else el.hidden=true};
}
function notify(pl,html){
  if(!G||G.opts.fast)return;
  let box=$("#notes");if(!box){box=document.createElement("div");box.id="notes";box.setAttribute("aria-live","polite");document.body.appendChild(box)}
  const n=document.createElement("div");n.className="note";n.style.setProperty("--pc",pl!=null&&G.p[pl]?G.p[pl].color:"#e6d6bd");n.innerHTML=html;
  n.onclick=()=>n.remove();box.prepend(n);while(box.children.length>4)box.lastChild.remove();
  setTimeout(()=>{n.classList.add("out");setTimeout(()=>n.remove(),700)},5600);
}

/* ---------------- Substance spells ---------------- */
SPELLS.push(
 {id:"bolt",tribe:"angel",name:"Lightning Strike",cost:0,school:"Sorcery",text:"Free, with three bolts. Select an enemy stack: lightning immobilizes it for 1d2 + 1d2 − 1 of its turns, so it can't move or attack. You earn a bolt for every card you lose while defending against an enemy's attack, and for every card Antony kills.",
  ok:()=>(me().bolts||0)>=3&&selEnemy()&&!shielded(selStack().owner),run:async()=>{
   const st=selStack(),d=rollN(2,2),n=sum(d)-1;st.stun=Math.max(st.stun||0,n);me().bolts=0;
   tray(G.active,"Lightning Strike",d,`immobile ${n}`);SND.zap();
   log(`<b>Lightning Strike</b>: ${plName(G.active)} strikes ${plName(st.owner)}'s stack on ${coord(G.sel.r,G.sel.c)}; it is immobilized for ${n} of its turns (1d2 + 1d2 − 1: ${d[0].v} + ${d[1].v} − 1).`,"event");
   notify(G.active,`Lightning strikes ${esc(G.p[st.owner].name)}'s stack on ${coord(G.sel.r,G.sel.c)}: immobile for ${n} turn${n>1?"s":""}.`)}},
 {id:"hate",tribe:"satan",name:"Hate",cost:3,school:"Curse",text:"Select an enemy stack: its strongest card takes a red tinge. While that card lives, its stack has disadvantage on every attack and defense, and everyone attacking it has advantage.",
  ok:()=>selEnemy()&&!hated(selStack()),run:async()=>{
   const st=selStack(),c=leadCard(st)||st.cards[0];c.hate=true;
   log(`<b>Hate</b>: ${plName(G.active)} turns ${esc(nameOf(c))} on ${coord(G.sel.r,G.sel.c)} red with hatred.`,"event");notify(G.active,`Hate falls on ${esc(nameOf(c))}.`)}},
 {id:"slaves",tribe:"binah",name:"Slaves",cost:0,school:"Necromancy",text:"Free. Deploy one thrall your Slavemasters captured as a Slave: a rifle of 10 + 1d12 that fires two tiles away in a straight line or one diagonal (from two away a miss costs it nothing), one straight step a turn, no defense, and it stands alone. Place it on an empty tile of your own ground. Ten thralls can wait at most.",
  ok:()=>(me().thralls||[]).length>0&&!G.placing&&zoneTiles(G.active).some(([r,c])=>!G.board[r][c]),run:deploySlave},
 {id:"deckcards",tribe:"jester",name:"Deck of Cards",cost:6,school:"Conjuring",once:true,text:"Once a game, while your Tree of Neither Life Or Death stands: your deck becomes full again, as it was at the start of the game. The cards still in it go to the grave; your hand stays.",
  ok:()=>!usedOnce("deckcards")&&!!treeOf(G.active),run:async()=>{
   const P=me();const old=P.deck.length;for(const c of P.deck.splice(0))toGrave(c,"burn");
   for(const s of P.startSpec||[]){const c=mk(s.rank,s.suit,s.color);if(s.puppet)c.puppet=true;c.owner=G.active;P.deck.push(c)}
   shuffle(P.deck);P.once.deckcards=true;
   log(`<b>Deck of Cards</b>: ${plName(G.active)}'s deck is full again (${P.deck.length} cards; ${old} went to the grave).`,"event");
   popup("Deck of Cards",`<p>${plName(G.active)} shuffles a whole new deck out of the Tree: ${P.deck.length} cards, as at the start of the game.</p><p class="dim">This is a one-time spell.</p>`,G.active)}},
 {id:"bull",tribe:"jester",name:"BullGoat",cost:3,school:"Conjuring",text:"A BullGoat comes into your hand: two hearts, 10 + 1d20 up close, or a charge of 10 + 2d20 at an enemy two or three tiles away in a straight, empty line, which carries it up to its target. It stands alone.",
  ok:()=>true,run:async()=>{const P=me(),c=mkUnit("bullgoat",G.active);if(P.hand.length<handCap(G.active))P.hand.push(c);else{P.deck.push(c);shuffle(P.deck)}
   log(`A BullGoat answers ${plName(G.active)}'s call${P.hand.includes(c)?" and comes into the hand":"; the hand is full, so it goes into the deck"}.`)}},
 {id:"pdhm",tribe:"beginner",name:"Please Don't Hurt Me",cost:0,school:"Enchantment",once:true,text:"Once a game, free: none of your stacks can be attacked until your next turn begins. Your cards turn pink, and everyone is told.",
  ok:()=>!usedOnce("pdhm"),run:async()=>{const P=me();P.shield=true;P.once.pdhm=true;
   log(`<b>${plName(G.active)} used the Please Don't Hurt Me spell.</b> Shame on them.`,"event");
   popup("Please Don't Hurt Me",`<p>${plName(G.active)} used the Please Don't Hurt Me spell. Shame on them.</p><p>None of their stacks can be attacked until their next turn.</p><p class="dim">This is a one-time spell.</p>`,G.active)}}
);
async function deploySlave(){
  const pl=G.active,P=me(),c=P.thralls.shift();c.unit="slave";c.owner=pl;
  if(P.cpu){const t=AI.bestSpot(pl,c);if(t)place(c,t[0],t[1]);else{delete c.unit;P.thralls.unshift(c)}return}
  G.placing=c;G.selHand=c;G.mode=null;flash("Click an empty highlighted tile of your ground for the Slave.");
}
/* a Slave that was never put down goes back to the thralls */
function cancelPlacing(){const c=G.placing;if(!c)return;G.placing=null;if(G.selHand===c)G.selHand=null;delete c.unit;(G.p[c.owner].thralls=G.p[c.owner].thralls||[]).unshift(c)}

/* ---------------- the computer playing a Substance ---------------- */
async function aiSubstance(pl,W){
  const P=G.p[pl],lv=P.cpu;if(G.over)return;
  const cast1=async(id,r,c)=>{const sp=SP(id);const old=G.sel;G.sel=r==null?null:{r,c,pick:new Set()};
    const ok=spellReady(sp);if(!ok){G.sel=old;return false}await cast(sp);G.sel=null;render();await sleep(420);return true};
  const foes=enemiesOf(pl).flatMap(stacksOf),mine=stacksOf(pl);
  const near=(e,k)=>mine.some(m=>Math.abs(m.r-e.r)+Math.abs(m.c-e.c)<=k);
  if(P.tribe==="angel"&&(P.bolts||0)>=3){
    const t=foes.filter(e=>!e.st.stun&&!shielded(e.st.owner)&&near(e,3)).sort((a,b)=>AI.value(b.st)-AI.value(a.st))[0];
    if(t)await cast1("bolt",t.r,t.c);
  }
  if(P.tribe==="satan"&&mana(pl)>=(lv==="hard"?3:4)&&Math.random()<(lv==="easy"?.4:.85)){
    const t=foes.filter(e=>!hated(e.st)&&near(e,3)).sort((a,b)=>AI.value(b.st)-AI.value(a.st))[0];
    if(t&&AI.value(t.st)>5)await cast1("hate",t.r,t.c);
  }
  if(P.tribe==="binah")for(let i=0;i<10&&(P.thralls||[]).length;i++){if(!await cast1("slaves"))break}
  if(P.tribe==="jester"){
    if(!P.once.deckcards&&treeOf(pl)&&P.deck.length<Math.max(6,P.start*.3)&&mana(pl)>=6)await cast1("deckcards");
    const bulls=[...P.hand,...stacksOf(pl).flatMap(x=>x.st.cards)].filter(c=>kind(c)==="bullgoat").length;
    if(bulls<(lv==="hard"?2:1)&&mana(pl)>=(W&&W.atk>1?3:5)&&P.hand.length<handCap(pl))await cast1("bull");
  }
  if(P.tribe==="beginner"&&!P.once.pdhm){
    let risk=0;for(const m of mine)for(const e of foes)if(Math.abs(m.r-e.r)+Math.abs(m.c-e.c)<=2&&canAttackFrom({cards:e.st.cards,attacked:false}))risk+=AI.winP(e.st,m.st,16)*AI.value(m.st);
    const total=mine.reduce((a,m)=>a+AI.value(m.st),0);
    if(risk>Math.max(6,total*.45))await cast1("pdhm");
  }
}

/* ---------------- symbols for the Substance cards ---------------- */
const UNIT_ICON={
 samson:`<path d="M-6,-8h12v6h-12z M-4,-6h3v2h-3z M1,-6h3v2h-3z M-8,-1h16v8h-16z M-8,7v3 M8,7v3 M-3,-2v-1 M3,-2v-1 M-11,0v5 M11,0v5"/>`,
 antony:`<path d="M0,9C-6,4 -9,0 -9,-3C-9,-7 -5,-8 -2.5,-6C-1,-5 0,-3.5 0,-3.5C0,-3.5 1,-5 2.5,-6C5,-8 9,-7 9,-3C9,0 6,4 0,9Z M-2.5,-6L-3,-10 M2.5,-6L3.5,-10 M0,-3.5V2 M-4,0L0,2L4,-1"/>`,
 satan:`<path d="M-7,9C-8,3 -7,-2 -5,-5L-7,-10 M-5,-5C-3,-7 -1,-8 1,-8L0,-12 M1,-8C3,-8 5,-7 6,-5L9,-9 M6,-5C8,-2 8,4 6,9 M-4,9C-3,4 -2,1 0,0C2,1 3,4 4,9"/>`,
 tree:`<path d="M0,10V-2 M0,2L-6,-3 M0,0L5,-5 M-6,-3L-8,-7 M-6,-3L-3,-8 M5,-5L3,-9 M5,-5L8,-8 M0,-2L0,-10 M-5,10H5"/>`,
 bullgoat:`<path d="M-4,-4C-8,-6 -10,-9 -9,-11C-7,-8 -5,-7 -3,-6 M4,-4C8,-6 10,-9 9,-11C7,-8 5,-7 3,-6 M-4,-5H4L5,2L2,8H-2L-5,2Z M-2,0h0.1 M2,0h0.1 M-1,8L0,11L1,8"/>`,
 slavemaster:`<path d="M0,-8C-5,-8 -8,-5 -8,-1C-8,3 -6,5 -4,6V9H4V6C6,5 8,3 8,-1C8,-5 5,-8 0,-8Z M0,-8V6 M-8,-1H-3 M3,-1H8 M-6,-5L-3,-3 M6,-5L3,-3 M-5,4L-2,2 M5,4L2,2"/>`,
 slave:`<path d="M-11,1H5L8,-1H11V2H8L6,4H-1L-3,8H-6L-5,4H-11Z M-2,4L-1,6"/>`,
 puppet:`<path d="M-8,-11H8 M-6,-11L-5,-1 M6,-11L5,-1 M0,-11V-7 M0,-4a2.5,2.5 0 1,0 0.1,0Z M0,-1V5 M-5,-1L0,1L5,-1 M0,5L-3,10 M0,5L3,10"/>`,
 bolt:`<path d="M2,-11L-6,1H0L-3,11L6,-2H0Z"/>`,
 chip:`<path d="M-5,-5H5V5H-5Z M-2,-2H2V2H-2Z M-3,-5V-8 M0,-5V-8 M3,-5V-8 M-3,5V8 M0,5V8 M3,5V8 M-5,-3H-8 M-5,0H-8 M-5,3H-8 M5,-3H8 M5,0H8 M5,3H8"/>`
};
function unitSVG(u,color,size){const d=UNIT_ICON[u]||"";return `<svg class="usym" viewBox="-12 -12 24 24" width="${size||22}" height="${size||22}" aria-hidden="true"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="#000" stroke-opacity=".5" stroke-width="3.2">${d}</g><g stroke="${color}" stroke-width="1.5">${d}</g></g></svg>`}
const heartsHTML=c=>c.maxHp?`<span class="hearts" aria-label="${c.hp} of ${c.maxHp} hearts">${"♥".repeat(c.hp)}<s>${"♥".repeat(Math.max(0,c.maxHp-c.hp))}</s></span>`:"";

})();
