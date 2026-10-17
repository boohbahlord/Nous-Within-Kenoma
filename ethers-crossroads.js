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
const sleep=ms=>{const g=G;return new Promise(r=>{const go=()=>{if(G!==g)return;if(G.paused){setTimeout(go,200);return}r()};setTimeout(go,G&&G.opts.fast?0:ms*(SPEED[G&&G.opts.cpuSpeed]||1)*(G&&G.speedMul||1))})}; // a new game silently ends the old game's waits; the menu pauses them
const SUITS={S:"♠",H:"♥",D:"♦",C:"♣"};
const SUITNAME={S:"Spades",H:"Hearts",D:"Diamonds",C:"Clubs"};
let COLS=5;const SOUL_CAP=6, HAND_CAP=6;   // COLS is set by the map for each game; SOUL_CAP is also what a Joker can hold
/* a Substance can raise a player's own limits. Mana can go up to three times the maximum for a round (the surplus);
   anything over the maximum fades at the start of the next round */
const surCap=pl=>Math.min(54,soulCap(pl)*3);
const handCap=pl=>G&&G.p[pl]?({jester:7,beginner:8}[G.p[pl].tribe]||HAND_CAP):HAND_CAP;
function soulCap(pl){
  if(!G||!G.p[pl])return SOUL_CAP;const P=G.p[pl];
  let cap={jester:7,beginner:8}[P.tribe]||SOUL_CAP;
  cap=Math.max(1,Math.min(18,cap+(P.maxAdd||0)+skyCapMod(P)));   // bought maximum mana (18 at most), or lost to Gambling and the Bank's collapse
  if(P.delu&&P.delu.turns>0)cap=Math.max(3,9-(P.delu.maxCut||0));                       // a Delusion: nine mana at most, less what Lucifer paid to stifle
  if(G.moonLev&&G.moonLev.owner===pl)cap=Math.min(12,cap+G.dark.length);               // the Leviathan on the moon: +1 for every card in the Outer Darkness
  return cap;
}
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
 tiph:{name:"Tiphareth of Kether",sub:"The Northern tribe of the Euclids. Three Traffickers chain the souls that die beside them and sell them at the Auction. The Blindfold, immunity to the Leviathan on the moon, and Jokers that hit for +1."},
 lucifer:{name:"Lucifer & Ouroboros",sub:"Always the ink and scroll. The Delusions of Ouroboros and of Lucifer, Deconjured, and Pleasure and Joy.",solid:"scroll"},
 leviathan:{name:"The Leviathan",sub:"The black serpent in the deck: three hearts, 6d4 + 1d2 + 6. On a New Moon it can rise onto the moon and tax every New Moon after. Its Jokers can exile souls to the Outer Darkness."},
 firm:{name:"The Firmament",sub:"Always the six-pointed star. Untouched by the Moon's and Saturn's harms and by meteors; a Miner on the moon; Blood Moon, Rain, Asteroid, Fog, and Mars in the sky.",solid:"hexa"},
 yald:{name:"Yaldabaoth",sub:"Always the symbol of Saturn. Night's Judgement eats the moon, God Hunger eats cards, and seven eaten bring Saturn and its Debt Collectors.",solid:"saturn"}
};
const PLAYABLE=Object.keys(TRIBES).filter(k=>k!=="random"&&!TRIBES[k].soon);
const COLORS=[["Ember","#ee7a3c"],["Gold","#e3b944"],["Verdigris","#45b89c"],["Azure","#4c92e6"],["Violet","#a77de8"],["Rose","#e4648f"],["Crimson","#d7333b"]];   // Bone belongs to the Angel Machine
const SOLIDS={tetra:"Tetrahedron",cube:"Cube",octa:"Octahedron",dodeca:"Dodecahedron",icosa:"Icosahedron"};
const HORDE_COLOR="#97a487";

/* ---------------- cards ---------------- */
let uid=0;
function mk(rank,suit,color){const c={id:++uid,rank,suit,color:color||(suit==="H"||suit==="D"?"red":"black"),owner:null};if(rank==="A"){c.hp=2;c.maxHp=2}return c}   // every Ace is a base with two hearts
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
 goatbull:{name:"Goatbull",word:"Beast",hp:2,nat:10,solo:"alone",soul:2,cost:3,
   weapons:[{id:"horns",name:"Horns",text:"10d2 + 1d10, up close",roll:()=>[...rollN(10,2),...rollN(1,10)],fixed:0,reach:"melee"},
            {id:"charge2",name:"Charge",text:"10 + 2d20 at an enemy exactly two tiles away in a straight line with nothing between; the Goatbull closes the gap",roll:()=>rollN(2,20),fixed:10,reach:"charge2"},
            {id:"stomp",name:"Stomp",text:"an ability check: the Goatbull's 1d20 with advantage against the target's 1d20 with disadvantage (Samson rolls plain). Win and the stack is Behooved, pinned for 2d2 turns (1d2 on a tie); a 16 or more also deals 1 damage, and each pinned round after needs 5 less",roll:()=>[],fixed:0,reach:"melee",special:"stomp"}]},
 bullgoat:{name:"BullGoat",word:"Beast",hp:2,nat:10,solo:"alone",soul:2,cost:3,
   weapons:[{id:"gore",name:"Gore",text:"10 + 1d20, up close",roll:()=>rollN(1,20),fixed:10,reach:"melee"},
            {id:"charge",name:"Charge",text:"10 + 2d20, two or three tiles away in a straight, empty line; the BullGoat closes the gap",roll:()=>rollN(2,20),fixed:10,reach:"charge"}]},
 slavemaster:{name:"Slavemaster",word:"Slavemaster",nat:8,die:8,dm:8,msv:24,soul:1,cost:1},
 leviathan:{name:"The Leviathan",short:"Leviathan",word:"Serpent",hp:3,nat:0,solo:"alone",soul:3,cost:3,defRoll:()=>[...rollN(6,4),...rollN(1,2)],defFixed:6,
   weapons:[{id:"lev",name:"The Leviathan",text:"6d4 + 1d2 + 6",roll:()=>[...rollN(6,4),...rollN(1,2)],fixed:6,reach:"melee"}]},
 trafficker:{name:"Trafficker",word:"Trafficker",nat:8,die:8,dm:8,msv:24,soul:1,cost:1},
 debt:{name:"Debt Collector",short:"Collector",word:"Collector",nat:0,solo:"alone",soul:1,cost:1,copy:true,
   weapons:[{id:"debt",name:"Debt Collector",text:"copies the score of the card it fights, without its advantage",roll:()=>[],fixed:0,reach:"melee"}]},
 scout:{name:"Scout",word:"Scout",nat:0,solo:"ace",soul:1,cost:1,noDef:true,noAtk:true,move:"assassin",vision:3,kind:"Support",ether:true},
 assassin:{name:"Assassin",word:"Assassin",hp:2,nat:8,solo:"pair",soul:2,cost:3,move:"assassin",ambush:true,kind:"Special",ether:true,
   weapons:[{id:"dagger",name:"Dagger",text:"10 + 1d12, up close (the roll of a Jack)",roll:()=>rollN(1,12),fixed:10,reach:"melee"}]},
 slave:{name:"Slave",word:"Slave",nat:10,solo:"alone",soul:1,cost:1,noDef:true,
   weapons:[{id:"gun",name:"Rifle",text:"10 + 1d12, from two tiles away in a straight line or one diagonal; from two away a miss costs nothing",roll:()=>rollN(1,12),fixed:10,reach:"gun"}]},
 /* Prompt 8: siege, support and mining cards, bought from the Ether */
 archer:{name:"Archer",word:"Archer",nat:0,soul:1,cost:1,noDef:true,noAtk:true,shooter:true,kind:"Standard",ether:true,
   desc:"shoots two tiles away; no defense",
   weapons:[{id:"bow",name:"Bow",text:"1d20 + 1d10 at a stack exactly two tiles away, straight or diagonal; a miss costs the Archer nothing",roll:()=>[...rollN(1,20),...rollN(1,10)],fixed:0,reach:"bow"},
            {id:"suppress",name:"Suppress",text:"no damage: the target has disadvantage on its next attack (or waits 1d2 of its turns for it to pass), and the Archer rests for 1d2 turns",roll:()=>[],fixed:0,reach:"bow",special:"suppress"}]},
 cannon:{name:"Cannon",word:"Cannon",nat:0,soul:2,cost:6,noDef:true,noAtk:true,shooter:true,capt:true,kind:"Standard",ether:true,
   desc:"fires up to three tiles away, once every 1d2 + 2 turns; no defense",
   weapons:[{id:"cannon",name:"Cannon",text:"2d20 at a stack up to three tiles away in any direction; once every 1d2 + 2 turns; a miss costs nothing; two damage to a Wall; it can't take an Ace's last heart or harm the Tree",roll:()=>rollN(2,20),fixed:0,reach:"cannon"}]},
 healer:{name:"Healer",word:"Healer",nat:0,soul:1,cost:3,noDef:true,noAtk:true,sup:true,attach:true,kind:"Support",ether:true,desc:"a blue shield that turns one blow, or one heart healed"},
 repair:{name:"Repairman",short:"Repairman",word:"Repairman",nat:0,soul:1,cost:2,noDef:true,noAtk:true,sup:true,attach:true,kind:"Support",ether:true,desc:"repairs Walls, Aces and the Tree"},
 ram:{name:"Battering Ram",short:"Ram",word:"Ram",nat:0,soul:1,cost:3,noDef:true,noAtk:true,sup:true,kind:"Support",ether:true,desc:"two damage to a Wall, worked by one or two soldiers"},
 miner:{name:"Miner",word:"Miner",nat:0,soul:1,cost:2,noDef:true,noAtk:true,sup:true,attach:true,kind:"Support",ether:true,desc:"mana from an Ace's miner slot, or from a crystal"},
 wall:{name:"Wall",word:"Wall",hp:5,nat:10,base:true,soul:3,cost:4,kind:"Base",ether:true,desc:"five hearts, defense 10; holds six cards; only ranged cards fire from it"}
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
const isBase=c=>kind(c)==="ace"||kind(c)==="tree"||kind(c)==="wall";             // holds other cards inside it
const isHero=c=>!!(c.unit&&UNIT[c.unit].solo&&UNIT[c.unit].solo!=="pair");   // stands alone (or only inside an Ace)
const short=c=>c.unit?(UNIT[c.unit].short||UNIT[c.unit].name):c.rank==="JK"?"JK":c.rank+SUITS[c.suit]+(c.puppet?"p":"");
const nameOf=c=>c.unit?(c.unit==="slave"?`Slave (once the ${({J:"Jack",Q:"Queen",K:"King",A:"Ace"}[c.rank]||c.rank)} of ${SUITNAME[c.suit]})`:UNIT[c.unit].name):c.rank==="JK"?`${c.color==="red"?"Red":"Black"} Joker`:(c.puppet?"Puppet ":"")+(({J:"Jack",Q:"Queen",K:"King",A:"Ace"}[c.rank]||c.rank)+" of "+SUITNAME[c.suit]);
for(const k in UNIT){const U=UNIT[k];U.rt=U.copy?12:U.weapons?Math.max(...U.weapons.map(w=>{const d=w.roll();return w.fixed+(d.length?d.length*d[0].s*.6:0)})):U.nat+(U.die||0)}
const rate=c=>c.unit?UNIT[c.unit].rt+(c.hp||0)*3:nat(c)+(die(c)||0);                 // point rating: best possible score of a card
const stackRate=st=>Math.max(0,...st.cards.map(rate))+(st.cards.length-1)*.5;

/* ---------------- stacks ---------------- */
const isAttach=c=>!!(c.unit&&UNIT[c.unit].attach);   // Healers, Repairmen and Miners ride along with almost anything
function stackLegal(cards){
  if(!cards.length)return false;
  const att=cards.filter(isAttach);
  if(att.length){
    const rest=cards.filter(c=>!isAttach(c)),n=u=>att.filter(c=>c.unit===u).length;
    if(n("healer")>1||n("repair")>1)return false;
    if(n("healer")&&rest.some(c=>kind(c)==="queen"))return false;   // the Healer won't stand with a Queen
    if(n("miner")>(rest.some(c=>kind(c)==="ace")?2:1))return false;   // two miner slots in an Ace, one Miner anywhere else
    if(rest.some(c=>c.unit==="ram"))return false;
    if(!rest.length)return true;
    cards=rest;
  }
  const cnt=u=>cards.filter(c=>c.unit===u).length;
  if(cnt("ram")){if(cnt("ram")>1||cards.length>3)return false;return cards.every(c=>c.unit==="ram"||!c.unit&&(kind(c)==="grunt"||kind(c)==="infantry"))}   // the Ram, with two soldiers at most
  if(cnt("archer")>1||cnt("cannon")>1)return false;
  if(!cards.some(isBase)){
    if(cnt("cannon"))return cards.length===1;   // a Cannon stands alone, or inside a base
    if(cnt("archer"))return cards.length<=2&&cards.every(c=>c.unit==="archer"||kind(c)==="queen");   // an Archer: alone, with a Queen, or inside a base
  }
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
  if(cards.some(c=>c.unit==="assassin"))return cards.length<=2&&cards.every(c=>c.unit==="assassin");   // two Assassins at most, and nothing else
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
     p:opts.players.map((o,i)=>mkPlayer(i,o)),grave:[],ether:[],dark:[],limbo:[],unknown:[],auction:[],journal:[],moonLev:null,
     turnNo:0,active:0,first:0,phase:"setup",setupStep:"ace",
     spent:false,spentOther:false,blessed:false,ritual:0,log:[],sel:null,selHand:null,mode:null,over:false,
     moon:{i:0,blood:false,round:0},
     noDraw:false,round:0,busy:false,passing:false,lastView:null};
  M.teams.forEach((t,i)=>G.p[i].team=t);
  if(opts.moon==="off"){G.moon.gone="off";G.moon.i=-1}
  if(opts.moon==="saturn"){G.moon.gone="saturn";G.moon.i=-1;G.saturnBy=null;G.saturnDebt=0}   // Saturn from the start: its favors go to the Bank
  if(["mars","sun","venus","jupiter","mercury"].includes(opts.moon)){G.moon.gone=opts.moon;G.moon.i=-1;G.planetBy=null;G.sunTears=0}
  G.zone=Array.from({length:rows},()=>Array(COLS).fill(-1));G.backz=Array.from({length:rows},()=>Array(COLS).fill(-1));
  M.seats.forEach((S,pl)=>{for(const [r,c] of S.zone)G.zone[r][c]=pl;for(const [r,c] of S.back)G.backz[r][c]=pl});
  buildDecks();
  addNPCs();
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
  substanceDecks(pls);fogDecks(pls);siegeDecks(pls);
  for(const c of G.ether)c.owner=null;
  shuffle(G.ether);
}
const survival=()=>G.opts.mode==="survival";
const isHorde=pl=>!!(G.p[pl]&&(G.p[pl].cpu==="horde"||G.p[pl].cpu==="npc"));   // the Horde, and the Barbarians and the Bank (no deck, no hand, no mana)
const hordeIx=()=>G.p.findIndex(P=>P.cpu==="horde");
const alive=()=>G.p.filter(P=>!P.out).map(P=>P.i);
const isEnemy=(a,b)=>a!=null&&b!=null&&a!==b&&G.p[a].team!==G.p[b].team;
const enemiesOf=pl=>alive().filter(i=>isEnemy(pl,i));
const alliesOf=pl=>alive().filter(i=>i!==pl&&!isEnemy(pl,i));
const me=()=>G.p[G.active], foe=()=>G.p[enemiesOf(G.active).filter(i=>!isNPC(i))[0]??(G.active===0?1:0)];
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
const TURNKEYS=["spent","spentOther","blessed","ritual","sevSum","prices","sel","selHand","mode","noDraw","libation"];
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
  G.log.unshift({html,cls,t:Date.now(),pl});if(log.fog){G.log[0].fog=log.fog;log.fog=null}G.log=G.log.slice(0,600)}
const plName=pl=>`<span class="pn" data-pl="${pl}" style="--pc:${G.p[pl].color}">${esc(G.p[pl].name)}</span>`;

/* where cards go when they leave play */
function toDark(c){if(c.captured&&c.captured.length){for(const s of c.captured)toDark(s);c.captured=[]}c.darkOwner=c.owner;G.dark.push(c)}
function toGrave(c,cause){
  if(!c)return;
  if(c.unit&&UNIT[c.unit].ether){if(c.hp!=null)c.hp=c.maxHp;c.hate=false;c.readyAt=0;c.shieldAt=0;c.shieldOff=0;c.healAt=0;c.repAt=0;c.inSlot=null}   // Ether cards lie in the grave like any card
  else if(c.unit&&c.unit!=="slave"){   // Substance cards never lie in the grave
    if(c.hp!=null)c.hp=c.maxHp;c.hate=false;
    if(c.unit==="bullgoat"&&c.owner!=null&&G.p[c.owner]){const g=mkUnit("goatbull",c.owner);G.p[c.owner].deck.push(g);shuffle(G.p[c.owner].deck);log(`The BullGoat goes back into ${plName(c.owner)}'s deck, and will come out as the Goatbull.`);return}
    if(c.unit==="samson"){G.limbo.push(c);G.p.forEach(Q=>Q.readLimbo=false);return}
    if(c.unit==="antony"){G.unknown.push(c);G.p.forEach(Q=>Q.readUnknown=false);return}
    toDark(c);return;
  }
  if(c.unit==="slave")delete c.unit;
  const m=G.moon;
  if((m.blood||warOD())&&cause==="death"&&!(c.owner!=null&&G.p[c.owner]&&G.p[c.owner].tribe==="firm")){toDark(c);return}   // the Firmament's dead keep to the grave
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
  const P=G.p[pl];
  if(P.debt>0){const v=soulOf(c);c.owner=pl;P.debt=Math.max(0,P.debt-v);if(!P.debt)P.debtAt=null;toGrave(c,"spent");if(G.bank)G.bank.mana+=v;return true}   // in debt: every soul that comes in pays the Bank first
  if(mana(pl)+soulOf(c)>surCap(pl))return false;
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
const soloUnit=st=>st&&st.cards.length&&st.cards[0].unit&&UNIT[st.cards[0].unit].weapons&&st.cards.every(c=>c.unit===st.cards[0].unit)?st.cards[0]:null;   // one Substance card, or a pair of Assassins
function weaponOf(st,mode){const u=soloUnit(st);if(!u)return null;const W=UNIT[u.unit].weapons;return W.find(w=>w.id===mode)||W[0]}
function rollStack(st,mode,enemy,fx,weapon){ // mode: "atk" | "def"
  const once=()=>{
    const parts=[],dice=[];let best=-1,kingRoll=null,aceRoll=null;
    const u=st.cards[0]&&st.cards[0].unit&&st.cards.every(c=>c.unit===st.cards[0].unit)?st.cards[0]:null;
    if(u&&UNIT[u.unit].weapons){   // Samson, Antony, Satan, the BullGoat, Slaves
      const U=UNIT[u.unit];
      if(U.copy){   // the Debt Collector copies the enemy's leading card, without its advantage
        const lead=enemy&&leadCard(enemy);if(!lead){best=0;parts.push("Debt Collector: nothing to copy");return{total:0,parts,dice,kingRoll}}
        const d=die(lead),r=d?R(d):0;if(r)dice.push({s:d,v:r});best=nat(lead)+r;parts.push(`Debt Collector copies ${short(lead)}: ${nat(lead)}${r?"+"+r:""}`);return{total:best,parts,dice,kingRoll}}
      if(mode==="atk"){const w=weapon&&U.weapons.find(x=>x.id===weapon.id)||U.weapons[0],d=w.roll();dice.push(...d);best=w.fixed+sum(d);parts.push(`${U.name} (${w.name}) ${w.fixed?w.fixed+"+":""}${d.map(x=>x.v).join("+")}`)}
      else if(U.defRoll){const d=U.defRoll();dice.push(...d);best=sum(d)+(U.defFixed||0);parts.push(`${U.name} ${U.defFixed?U.defFixed+"+":""}${d.map(x=>x.v).join("+")}`)}
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
      const jb=mode==="atk"&&st.owner!=null&&G.p[st.owner]?JOKER_BONUS[G.p[st.owner].tribe]:0;if(jb){best+=jb;parts.push(`${TRIBES[G.p[st.owner].tribe].name} Joker +${jb}`)}
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
    const jb=mode==="atk"&&hasK(st,"joker")&&st.owner!=null&&G.p[st.owner]?JOKER_BONUS[G.p[st.owner].tribe]:0;if(jb){best+=jb;parts.push(`${TRIBES[G.p[st.owner].tribe].name} Joker +${jb}`)}
    return{total:Math.max(0,best),parts,dice,kingRoll,aceRoll};
  };
  const a=once();
  const n=typeof fx==="number"?fx:fx==="adv"?1:fx==="dis"?-1:0,f=n>0?"adv":n<0?"dis":null,bonus=Math.abs(n)>=2?n:0;
  if(f){const b=once();const takeB=f==="adv"?b.total>a.total:b.total<a.total;const pick=takeB?b:a,other=takeB?a:b;
    pick.dice=[...pick.dice,...other.dice.map(d=>({...d,x:true}))];pick.parts.push(f==="adv"?"(advantage)":"(disadvantage)");
    if(bonus){pick.total=Math.max(0,pick.total+bonus);pick.parts.push(`${bonus>0?"+":""}${bonus} stacked ${f==="adv"?"advantage":"disadvantage"}`)}
    return pick}
  return a;
}
const JOKER_BONUS={binah:3,tiph:1};
function leadCard(st){let best=null;for(const c of st.cards){if(kind(c)==="joker"||kind(c)==="queen")continue;if(!best||nat(c)>nat(best))best=c}return best}

/* ---------------- combat ---------------- */
function adjacent(r1,c1,r2,c2,diag){const dr=Math.abs(r1-r2),dc=Math.abs(c1-c2);return diag?(dr<=1&&dc<=1&&(dr||dc)):dr+dc===1}
const near8=(r1,c1,r2,c2)=>Math.abs(r1-r2)<=1&&Math.abs(c1-c2)<=1;
const jackOnly=st=>st.cards.every(c=>kind(c)==="jack");
const shielded=pl=>pl!=null&&G.p[pl]&&!!G.p[pl].shield;          // Please Don't Hurt Me
const hated=st=>st.cards.some(c=>c.hate);
function canAttackFrom(st){
  if(st.attacked||st.hypo||st.stun||st.pin)return false;
  if(st.cards.every(c=>c.unit&&UNIT[c.unit].noAtk||kind(c)==="queen"))return false;   // Scouts, support cards and Archers don't fight up close
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
  if(reach==="bow")return (dr===2&&dc===0)||(dr===0&&dc===2)||(dr===2&&dc===2);   // the tile after the next, straight or diagonal
  if(reach==="cannon")return Math.max(dr,dc)<=3&&dr+dc>0;
  if(reach==="charge"||reach==="charge2"){
    const okD=reach==="charge2"?[2]:[2,3];
    if(!(dr===0&&okD.includes(dc))&&!(dc===0&&okD.includes(dr)))return false;
    const sr=Math.sign(r2-r1),sc=Math.sign(c2-c1);
    for(let k=1;k<Math.max(dr,dc);k++){const r=r1+sr*k,c=c1+sc*k;if(isVoid(r,c)||G.board[r][c])return false}
    return true;
  }
  return false;
}
/* every attack the stack on r,c can make: {r,c,mode,ranged} */
function attackOptions(r,c){
  const st=G.board[r][c];if(!st||st.attacked||st.hypo||st.stun||st.pin||choked(st.owner))return[];
  const out=[],tg=[];
  for(let r2=0;r2<G.rows;r2++)for(let c2=0;c2<COLS;c2++){
    const t=G.board[r2][c2];if(!t||!(isEnemy(t.owner,st.owner)||warFoe(st.owner,t.owner))||peaceBlock(st.owner,t.owner)||t.hypo||shielded(t.owner)||!seesTile(st.owner,r2,c2))continue;   // you can't strike what you can't see
    tg.push([r2,c2,t]);
  }
  // Archers and Cannons shoot from any stack they stand in, bases too (unless a Repairman is at work on that base)
  if(!(hasBase(st)&&repLocked(st)))for(const card of st.cards){const U=card.unit&&UNIT[card.unit];if(!U||!U.shooter||!shotReady(card,st.owner))continue;
    const A={owner:st.owner,cards:[card],odds:st.odds,down:st.down};
    for(const [r2,c2] of tg)for(const w of U.weapons)if(reaches(w.reach,r,c,r2,c2))out.push({r:r2,c:c2,mode:w.id,ranged:true,w,A,card});
  }
  if(!canAttackFrom(st))return out;
  const u=soloUnit(st),diag=jackOnly(st);
  for(const [r2,c2,t] of tg){
    if(adjacent(r,c,r2,c2,diag)&&lonely(t)){   // support cards standing alone: take one, or destroy one
      if(canCapture(st,t))out.push({r:r2,c:c2,mode:"capture",ranged:false,w:{name:"Capture",text:`take ${nameOf(captureCard(t))} into this stack's capture slot`}});
      out.push({r:r2,c:c2,mode:"destroy",ranged:false,w:{name:"Destroy",text:`destroy ${nameOf(captureCard(t))}`}});
      continue}
    if(hasK(st,"ram")&&st.cards.length>1&&hasK(t,"wall")&&adjacent(r,c,r2,c2,false))out.push({r:r2,c:c2,mode:"ram",ranged:false,w:{name:"Battering Ram",text:"two damage to the Wall, no roll"}});
    if(u){for(const w of UNIT[u.unit].weapons)if(reaches(w.reach,r,c,r2,c2))out.push({r:r2,c:c2,mode:w.id,ranged:w.reach==="gun"&&!near8(r,c,r2,c2),w})}
    else if(adjacent(r,c,r2,c2,diag))out.push({r:r2,c:c2,mode:null,ranged:false});
  }
  return out;
}
/* advantage and disadvantage from Divine/Hexed Odds and Hate cancel out pairwise */
/* advantage and disadvantage cancel one for one; two of the same kind add +2 (or −2) on top, and each one more adds 1 */
function netFx(...fx){let n=0;for(const f of fx){if(f==="adv")n++;if(f==="dis")n--}return n}
const cmpSign=(a,b)=>a>b?">":a<b?"<":"=";
function attack(r1,c1,r2,c2,mode){
  const A=G.board[r1][c1],D=G.board[r2][c2],atkPl=A.owner,defPl=D.owner;
  const opt=attackOptions(r1,c1).find(o=>o.r===r2&&o.c===c2&&(mode==null||o.mode===mode))||{mode:null,ranged:false};
  const w=opt.A?opt.w:weaponOf(A,opt.mode);
  if(w&&w.special==="stomp")return stomp(r1,c1,r2,c2);
  if(opt.mode==="suppress")return suppress(r1,c1,r2,c2,opt);
  if(opt.mode==="capture"||opt.mode==="destroy")return takeSupport(r1,c1,r2,c2,opt.mode);
  if(opt.mode==="ram")return ramWall(r1,c1,r2,c2);
  for(const g of D.cards)if(g.unit==="goatbull"&&G.board.flat().some(s=>s&&s.pin&&s.pin.by===g.id))g.lostAdv=true;   // attacking a pinning Goatbull costs it its advantage
  const pureA=hasK(A,"satan"),pureD=hasK(D,"satan");   // Satan fights with no modifiers
  const fxA=pureA?null:netFx(A.odds,hated(A)?"dis":null,hated(D)&&!pureD?"adv":null,A.down?"dis":null,A.down?"dis":null,A.ambushing?"adv":null,A.supp?"dis":null,A.mars?"adv":null),fxD=pureD?null:netFx(D.odds,hated(D)?"dis":null,D.down?"adv":null);   // face-down: double disadvantage to attack, advantage to defend
  const bothSoloJokers=A.cards.length===1&&D.cards.length===1&&kind(A.cards[0])==="joker"&&kind(D.cards[0])==="joker";
  const ra=rollStack(opt.A||A,"atk",D,fxA,w),rd=rollStack(D,"def",A,fxD);
  if(A.supp){ra.parts.push("suppressed");A.supp=null}
  if(A.mars){ra.parts.push("Mars");A.mars=false}
  if(opt.card&&opt.card.unit==="cannon")opt.card.readyAt=(G.p[atkPl].tn||0)+R(2)+2;   // the Cannon reloads
  G.histTile=`${coord(r1,c1)} → ${coord(r2,c2)}`;
  A.odds=null;D.odds=null;A.attacked=true;G.lastAttack=G.turnNo;venusAttack(atkPl,defPl);
  if(A.down)ra.parts=["a face-down card "+ra.total];
  const wasDown=D.down;if(D.down){D.down=false}   // a face-down stack that is attacked turns face up
  if(A.ambush)A.ambush=false;A.ambushing=false;
  if(G.opts.moonBonus!==false&&!bothSoloJokers){   // the moon lends a die: Full Moon to the attacker, New Moon to the defender
    if(G.moon.i===4&&!pureA){const v=R(2);ra.total+=v;ra.dice.push({s:2,v});ra.parts.push(`${G.moon.blood?"Blood":"Full"} Moon +${v}`)}
    if(G.moon.i===0&&!pureD){const v=R(2);rd.total+=v;rd.dice.push({s:2,v});rd.parts.push(`New Moon +${v}`)}
  }
  const queenA=hasK(A,"queen");
  let dmgD=0,dmgA=0,notes=[];
  if(wasDown)notes.push("The face-down stack turns face up.");
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
  if(w&&["gun","bow","cannon"].includes(w.reach)&&dmgD>0&&hasK(D,"tree")){dmgD=0;notes.push("The Tree of Neither Life Or Death takes no damage from ranged attacks.")}
  if(dmgD>0&&hasK(D,"wall")){
    if(opt.mode==="charge"||opt.mode==="charge2"){dmgD*=2;notes.push("A charge hits a Wall twice as hard.")}
    if(w&&w.id==="cannon"){dmgD=Math.max(dmgD,2);notes.push("Cannon fire: two damage to the Wall.")}
  }
  if(dmgD>0&&w&&w.id==="cannon"){const ace=D.cards.find(x=>kind(x)==="ace");if(ace&&(ace.hp||1)<=1&&!D.cards.some(x=>x.unit==="miner")){dmgD=0;notes.push("A Cannon can't take an Ace's last heart.")}}
  const line=`${ra.total}${cmpSign(ra.total,rd.total)}${rd.total}`;
  tray(atkPl,"Attack",ra.dice,line);tray(defPl,"Defense",rd.dice,line,true);G.histTile=null;
  log(`<b>${plName(atkPl)}</b> attacks from ${coord(r1,c1)} to ${coord(r2,c2)}: <span class="dice">${ra.parts.join(", ")}</span> = <b>${ra.total}</b> vs <span class="dice">${rd.parts.join(", ")}</span> = <b>${rd.total}</b> <span class="tot">(${esc(line)})</span>. ${notes.join(" ")} ${dmgD?`Defender takes ${dmgD} damage.`:""}${dmgA?`Attacker takes ${dmgA} damage.`:""}${!dmgA&&!dmgD?"No damage.":""}`,"combat");
  G.fight={A,D,atkPl,defPl,ranged:!!opt.ranged};
  if(dmgD)warDamagePay(atkPl,defPl,dmgD,D);
  if(dmgD){const n=damage(r2,c2,dmgD,true);if(hasK(A,"antony")&&n)addBolts(atkPl,n,"Antony's kill")}
  if(dmgA&&G.board[r1][c1])damage(r1,c1,dmgA,false);
  G.fight=null;
  // the BullGoat's charge carries it up to its target
  if((opt.mode==="charge"||opt.mode==="charge2")&&G.board[r1][c1]===A){const sr=Math.sign(r2-r1),sc=Math.sign(c2-c1),tr=r2-sr,tc=c2-sc;
    if(!G.board[tr][tc]&&!isVoid(tr,tc)){G.board[tr][tc]=A;G.board[r1][c1]=null;A.moved=true;log(`The BullGoat closes the gap to ${coord(tr,tc)}.`)}}
  return{win:dmgD>0,line};
}
/* returns how many cards died */
function damage(r,c,n,defending){
  const st=G.board[r][c];if(!st)return 0;
  if(n>0&&shieldUp(st)){breakShield(st,r,c);return 0}   // the Healer's shield turns the whole blow
  const dead=[],F=G.fight;
  for(let i=0;i<n&&st.cards.length;i++){
    // a Miner is the first to go: an attacker beside it with a free capture slot takes it (and the blow still lands), or it dies
    const mi=st.cards.findIndex(x=>x.unit==="miner");
    if(mi>=0&&st.cards.some(x=>x.unit!=="miner")){const m=st.cards[mi],A=F&&F.D===st&&!F.ranged?F.A:null;
      if(A&&!A.captive&&G.board.flat().includes(A)){st.cards.splice(mi,1);takeCaptive(A,m);log(`${plName(A.owner)} captures a Miner from ${coord(r,c)}, and the blow still lands.`)}
      else{st.cards.splice(mi,1);dead.push(m);log(`The Miner on ${coord(r,c)} is the first to fall.`);continue}}
    if(!st.cards.length)break;
    const base=st.cards.find(isBase);
    if(base){stealOnDamage(st);base.hp=(base.hp||1)-1;const nm=kind(base)==="ace"?"The Ace":kind(base)==="wall"?"The Wall":"The Tree of Neither Life Or Death";
      if(base.hp>0){log(`${nm} loses a heart (${base.hp} left); the cards inside are safe.`);continue}
      dead.push(...st.cards.splice(0));log(`${nm} falls, and every card inside it dies with it.`);break}
    // support cards hide behind the fighters; the Battering Ram can't be killed by blows at all
    const fighters=st.cards.filter(x=>!(x.unit&&UNIT[x.unit].sup)),pool=fighters.length?fighters:st.cards.filter(x=>x.unit!=="ram");
    if(!pool.length){log(`The Battering Ram on ${coord(r,c)} can't be harmed by blows: it has to be captured or destroyed.`);break}
    pool.sort((a,b)=>nat(a)-nat(b));
    const low=pool[0];stealOnDamage(st);
    if(low.hp>1){low.hp--;log(`${esc(nameOf(low))} loses a heart (${low.hp} left).`);continue}
    st.cards.splice(st.cards.indexOf(low),1);const c0=low;dead.push(c0);
    if(kind(c0)==="king"&&defending&&st.cards.length){dead.push(...st.cards.splice(0));log("The King is defeated in defense: all units with it die.")}
  }
  if(!st.cards.length){G.board[r][c]=null;freeCaptive(st,r,c)}
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
  if(econBury(card,r,c,st))return;   // Barbarian kills are counted; what the Bank's Debt Collectors kill goes to the Ether
  if(card.upgraded){card.maxHp=2;card.upgraded=false}   // an upgraded Ace loses the extra heart when it falls
  if(card.hp!=null)card.hp=card.maxHp;
  if(card.hate)card.hate=false;
  if((card.unit==="samson"||card.unit==="antony")&&buryUnit(card,r,c,owner))return;   // Samson and Antony keep their own fates
  if(buryHook(card,r,c,st))return;                     // Traffickers, Pleasure and Joy, the Leviathan's kills
  if(card.unit&&buryUnit(card,r,c,owner))return;       // the other Substance cards have their own fates
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
    const teams=new Set(alive().filter(i=>!isNPC(i)).map(i=>G.p[i].team));
    if(teams.size<=1){const w=alive()[0];end(w,why);return}
    log(`<b>${plName(pl)} is eliminated</b>: ${why}.`,"event");
  }
  // what is left of them leaves the table
  const toOD=G.opts.elimDark;const dump=c=>{if(toOD)toDark(c);else{c.owner=pl;G.grave.push(c)}};
  for(const {st,r,c} of stacksOf(pl)){for(const x of st.cards){for(const s of x.captured||[])dump(s);x.captured=[];dump(x)}if(st.captive){dump(st.captive);st.captive=null}G.board[r][c]=null}
  const shared=alliesOf(pl).some(a=>G.p[a].deck===P.deck);
  for(const c of P.hand.splice(0))dump(c);
  if(!shared){for(const c of P.deck.splice(0))dump(c);for(const c of P.souls.splice(0))dump(c)}
  if(!toOD)shuffle(G.grave);
  log(toOD?`${plName(pl)}'s hand and deck fall into the Outer Darkness.`:`${plName(pl)}'s hand and deck go to the grave, and the grave is shuffled.`);
}

/* ---------------- choices: a person answers in a box, the computer answers in code ---------------- */
async function ask(pl,spec){
  if(G.p[pl].cpu){await sleep(320);return spec.ai?spec.ai():AI.choose(pl,spec)}
  return askHuman(pl,spec);
}
/* the order of play this round, starting with the first player; the Horde moves first in Survival */
function roundOrder(){const n=G.p.length,o=[];for(let k=0;k<n;k++){const pl=(G.first+k)%n;if(!G.p[pl].out&&!isNPC(pl))o.push(pl)}return o}
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
  if(m.blood){G.bloodCalled=false;await newMoonGift();return}
  if(m.i===4){
    await fullMoonToll();if(G.over)return;
    for(const P of G.p)shuffle(P.deck);
    log("The Full Moon shuffles every deck. No cards are drawn and no necromancy is cast this round.");
    return;
  }
  if(m.i===0)await newMoonGift();
}
async function newMoonGift(){
  if(G.noGraveNext&&!G.moon.blood){G.noGraveNext=false;log("<b>Deconjured</b>: the grave gives nothing at this New Moon.","event");return}
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
    if(G.p[pl].tribe==="firm"){log(`${plName(pl)} owes the Full Moon nothing: the Firmament is above its toll.`);continue}
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
  G.moon.round++;if(G.moon.round>1&&G.moon.i>=0)G.moon.i=(G.moon.i+1)%8;   // an eaten moon (or Saturn in its place) no longer turns
  for(const P of G.p){const cap=soulCap(P.i);if(mana(P.i)<=cap||P.out)continue;let lost=0;P.souls.sort((a,b)=>soulOf(b)-soulOf(a));   // the surplus fades
    while(mana(P.i)>cap&&P.souls.length){const c=P.souls.find(x=>mana(P.i)-soulOf(x)>=cap)||P.souls[P.souls.length-1];P.souls.splice(P.souls.indexOf(c),1);lost+=soulOf(c);toGrave(c,"spent")}
    if(lost)log(`${plName(P.i)}'s surplus fades: ${lost} mana over the maximum goes to the grave.`)}
  if(survival())G.round++;
  log(`— Round ${G.moon.round}${survival()?` (${roman(G.round)})`:""} · ${moonName()} —`,"turn");
  rollPrices();   // dice prices are rolled once a round, behind the scenes, and hold for every player this round
  log(`Spell prices this round: ${SPELLS.filter(s=>s.dice).map(s=>`${s.name} ${priceLabel(s,true)}`).join(", ")} (before the moon's prices).`,"ai");
  G.phase="moon";G.busy=true;render();
  await moonStart();if(G.over)return;
  substanceRound();
  await econRound();if(G.over)return;
  G.voted=false;await eclipseRound();if(G.over)return;
  G.busy=false;
}
function beginTurn(pl){
  setActive(pl);G.turnNo++;
  Object.assign(G,{spent:false,spentOther:false,blessed:false,ritual:0,sel:null,selHand:null,mode:null,noDraw:false,sevSum:0,libation:false});
  G.p[pl].tn=(G.p[pl].tn||0)+1;   // the player's own turn count, for cooldowns
  G.prices={...(G.roundPrices||{})};
  if(G.inflation&&G.turnNo<=G.inflation.until)G.inflation.add=R(2)-1;
  skyPrices(pl);   // after the Bank's collapse every price wobbles up, turn by turn
  for(const {st} of stacksOf(pl)){st.moved=false;st.attacked=false;if(st.hypo){st.hypo--;if(!st.hypo)log(`Hypostasis fades from ${plName(pl)}'s stack.`)}}
  G.p[pl].sevArmed=false;
  substanceTurn(pl);
  G.noDraw=fullDrawbacks()&&G.p[pl].tribe!=="firm"||G.moon.round===1&&(turnMode()!=="classic"||pl===G.first);   // the very first turn of the game has no draw
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
  if(!continuing){await turnAsync(pl);if(G!==g||G.over)return}
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
  for(const pl of players){setActive(pl);await turnAsync(pl);if(G!==g||G.over)return}
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
    if(G.paused){G.deadline+=250;return}
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
    if(isHorde(pl))return;
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
  if(P.opening.length){G.board[r][c]={owner:pl,cards:P.opening.splice(0),moved:true,attacked:false};log(`${plName(pl)} raises the opening Ace with its Jack on ${coord(r,c)}.`);aceScout(pl,r,c,true)}
  else{G.board[r][c]={owner:pl,cards:P.opening2.splice(0),moved:true,attacked:false};log(`${plName(pl)} raises a second Ace as a base on ${coord(r,c)}.`);aceScout(pl,r,c)}
  G.setupStep=P.opening.length||(P.opening2&&P.opening2.length)?"ace":"more";
  if(G.setupStep==="more")setupDone(pl);   // Substances that start with cards on the field
}

/* ---------------- actions ---------------- */
function canPlace(card,r,c){
  if(!canSpawn(G.active,r,c)||isVoid(r,c))return false;
  const st=G.board[r][c],k=kind(card);
  if(k==="ace")return !st&&isBack(G.active,r,c);
  if(k==="tree"||k==="wall"||(card.unit&&UNIT[card.unit].solo==="alone"))return !st;   // a Wall goes up on any empty tile of your two lines   // the Tree, Satan, the BullGoat and Slaves take an empty tile
  if(hq()&&!(st&&st.owner===G.active&&hasK(st,"ace")))return false;   // Headquarters: troops spawn only inside your Aces
  if(k==="joker"){if(!st||st.owner!==G.active)return false;return st.cards.some(x=>x.color===card.color)&&stackLegal([...st.cards,card])}
  if(!st)return true;
  return st.owner===G.active&&stackLegal([...st.cards,card]);
}
function place(card,r,c){
  const P=me(),hi=P.hand.indexOf(card);if(hi>=0)P.hand.splice(hi,1);card.owner=G.active;if(G.placing===card)G.placing=null;
  const st=G.board[r][c];
  const fd=!!G.faceDown&&(!st||st.down);
  if(st){if(st.cards.some(x=>x.unit==="assassin")&&card.unit==="assassin"){card.hp=Math.min(card.hp,1);log("A second Assassin joins: one more heart for the pair.")}st.cards.push(card);if(!fd)st.down=false}
  else G.board[r][c]={owner:G.active,cards:[card],moved:G.phase!=="setup",attacked:false,down:fd};
  if(fd){fogLog(G.active,r,c,`${plName(G.active)} places a card face down.`);log(`${plName(G.active)} places a card face down on ${coord(r,c)}.`);G.selHand=null;G.faceDown=false;if(G.placing===card)G.placing=null;return}
  fogLog(G.active,r,c,`${plName(G.active)} places a card out of sight.`);log(`${plName(G.active)} places ${esc(nameOf(card))} on ${coord(r,c)}${st?", onto a stack":""}.`);
  if(kind(card)==="ace"&&!st)aceScout(G.active,r,c);
  G.selHand=null;
}
function moveGroup(){const s=G.sel;if(!s)return[];const st=G.board[s.r][s.c];return st.cards.filter(c=>s.pick.has(c.id))}
function moveTargets(){
  const s=G.sel,st=G.board[s.r][s.c],grp=moveGroup();
  if(!grp.length||st.moved||st.stun||st.pin||grp.some(isBase)||choked(st.owner))return[];
  if(grp.every(c=>c.unit==="ram"))return[];   // a Battering Ram doesn't move without soldiers to push it
  const rest=st.cards.filter(c=>!s.pick.has(c.id));
  if(rest.length&&!stackLegal(rest))return[];
  if(!stackLegal(grp))return[];
  const out=[];const jack=grp.every(c=>kind(c)==="jack");const fwd=seat(st.owner).fwd;
  const d2=grp.length===1&&grp[0].unit&&UNIT[grp[0].unit].diag2;   // Samson and Antony: one straight, or one or two diagonal
  const sneak=grp.every(c=>c.unit&&UNIT[c.unit].move==="assassin");   // Assassins and Scouts: two diagonal, or two forward or back
  for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++){
    if(r===s.r&&c===s.c||isVoid(r,c))continue;
    if(st.hypo&&(r-s.r)*fwd[0]+(c-s.c)*fwd[1]>0)continue;   // Hypostasis: no step toward the enemy
    if(peaceOn()&&G.zone[r][c]>=0&&isEnemy(st.owner,G.zone[r][c]))continue;   // Peace: nobody steps into another player's lines
    const dr=Math.abs(r-s.r),dc=Math.abs(c-s.c);
    const fb=(r-s.r)*fwd[1]===0&&(c-s.c)*fwd[0]===0;   // along the forward/back line
    const okStep=(dr+dc===1)||(jack&&((dr+dc===2&&(dr===0||dc===0))||(dr===1&&dc===1)))||(d2&&dr===dc&&dr<=2)||(sneak&&(dr===dc&&dr<=2||fb&&dr+dc===2));
    if(!okStep)continue;
    if(sneak&&dr+dc===4||sneak&&fb&&dr+dc===2){const mr=(r+s.r)/2,mc=(c+s.c)/2,mid=G.board[mr][mc];if(isVoid(mr,mc)||mid&&isEnemy(mid.owner,st.owner))continue}
    if(d2&&dr===2){const mr=(r+s.r)/2,mc=(c+s.c)/2,mid=G.board[mr][mc];if(isVoid(mr,mc)||mid&&isEnemy(mid.owner,st.owner))continue}
    if(jack&&dr+dc===2&&(dr===0||dc===0)){const mr=(r+s.r)/2,mc=(c+s.c)/2,mid=G.board[mr][mc];if(isVoid(mr,mc)||mid&&isEnemy(mid.owner,st.owner))continue}
    const t=G.board[r][c];
    if(!t)out.push([r,c]);
    else if(t.owner===st.owner&&!t.moved&&!t.hypo&&!(t.captive&&st.captive&&!rest.length)&&stackLegal([...t.cards,...grp])&&!(grp.some(x=>kind(x)==="joker")&&!t.cards.some(x=>grp.find(g=>kind(g)==="joker").color===x.color)))out.push([r,c]);
  }
  return out;
}
function doMove(r,c){
  const s=G.sel,st=G.board[s.r][s.c],grp=moveGroup();
  st.cards=st.cards.filter(x=>!s.pick.has(x.id));
  if(!st.cards.length)G.board[s.r][s.c]=null;else st.moved=true;
  const t=G.board[r][c];
  const wasDown=!!st.down;if(st.ambush)st.ambush=false;   // moving breaks an ambush
  const cap=!st.cards.length&&st.captive?st.captive:null;if(cap)st.captive=null;   // a captive goes with the whole stack
  if(t){if(t.cards.some(x=>x.unit==="assassin")&&grp.some(x=>x.unit==="assassin")){for(const a of grp)if(a.unit==="assassin")a.hp=Math.min(a.hp,1);log("A second Assassin joins: one more heart for the pair.")}
    t.cards.push(...grp);t.moved=true;if(!(t.down&&wasDown))t.down=false}
  else G.board[r][c]={owner:st.owner,cards:grp,moved:true,attacked:false,hypo:st.cards.length?0:st.hypo,down:wasDown&&!st.cards.length?true:wasDown};
  if(!st.cards.length)st.down=false;
  if(cap)G.board[r][c].captive=cap;
  fogLog(st.owner,r,c,`${plName(st.owner)} moves a stack out of sight.`);log(G.board[r][c].down?`${plName(st.owner)} moves a face-down stack from ${coord(s.r,s.c)} to ${coord(r,c)}.`:`${plName(st.owner)} moves ${grp.map(short).join(" ")} from ${coord(s.r,s.c)} to ${coord(r,c)}${t?", onto another stack":""}.`);
  G.sel={r,c,pick:new Set(G.board[r][c].cards.filter(x=>!isBase(x)).map(x=>x.id))};G.mode=null;
  ambushCheck(r,c);
}
function attackTargets(){
  const s=G.sel;if(!s)return[];const seen=new Set(),out=[];
  for(const o of attackOptions(s.r,s.c)){const k=o.r*16+o.c;if(!seen.has(k)){seen.add(k);out.push([o.r,o.c])}}
  return out;
}
const sacrificeAllowed=()=>G.phase==="prep"&&!G.spent&&!isHorde(G.active);
function sacrifice(card,from){
  const P=me();
  if(mana(G.active)+soulOf(card)>surCap(G.active)){flash(`The soul pile holds ${surCap(G.active)} mana at most, counting the surplus.`);return false}
  if(from==="hand")P.hand.splice(P.hand.indexOf(card),1);
  else{const st=G.board[from.r][from.c];st.cards.splice(st.cards.indexOf(card),1);
    if(card.captured&&card.captured.length){for(const s of card.captured)toGrave(s,"death");card.captured=[]}
    if(!st.cards.length){G.board[from.r][from.c]=null;G.sel=null}else if(G.sel)G.sel.pick.delete(card.id)}
  addSoul(G.active,card);log(`${plName(G.active)} sacrifices ${esc(nameOf(card))} (+${soulOf(card)} mana).`);rainSac(G.active);
  if(from!=="hand")checkWin();
  return true;
}
const canSacCard=c=>!(c.unit&&(UNIT[c.unit].hp||UNIT[c.unit].base));   // the Substance cards with hearts (and the Tree) can't be sacrificed
const canSacOnField=(st,c)=>kind(c)!=="ace"&&canSacCard(c)&&!(kind(c)==="king"&&st.cards.length>1);

/* ---------------- spells ---------------- */
const selStack=()=>G.sel&&G.board[G.sel.r]&&G.board[G.sel.r][G.sel.c];
const selOwn=()=>selStack()&&selStack().owner===G.active;
const selEnemy=()=>selStack()&&isEnemy(selStack().owner,G.active);
/* spells aimed at another player: with several enemies, the caster picks one */
async function pickFoe(id,title){const es=enemiesOf(G.active).filter(pl=>!isHorde(pl));const t=es.length<=1?es[0]:await ask(G.active,{kind:"player",id,title,players:es});G.histTarget=t;return t}
const selOwnJoker=()=>selOwn()&&hasK(selStack(),"joker");
const SCHOOLS=["Necromancy","Enchantment","Curse","Sorcery","Illusion","Conjuring"];
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
 {id:"tele",dice:"1d2−1",name:"Teleport",cost:1,school:"Sorcery",text:"Select your stack in your own two lines with no enemy beside it and leave exactly one card checked; that card leaves the field now and comes back into your hand at the start of your next turn.",ok:teleOk,run:teleport},
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
const PRICE={tele:()=>R(2)-1,deconj:()=>2+R(2),joyA:()=>1+R(2),joyB:()=>R(3)-1,ouro:()=>R(2),hunger:()=>R(2),resur:()=>R(2)+1,divine:()=>R(2)+1,hexed:()=>R(2)+1,forced:()=>R(2),three:()=>R(3),clair:()=>2+R(2),naked:()=>R(2)};
function rollPrices(){G.roundPrices={};for(const k in PRICE)G.roundPrices[k]=PRICE[k]();G.prices={...G.roundPrices}}
function baseCost(sp){
  if(sp.id==="three"&&G.p[G.active]&&G.p[G.active].tribe==="angel")return 1;
  if(sp.id==="carch"&&G.p[G.active]&&G.p[G.active].tribe==="beginner")return 1;   // Archers come cheap to the Beginner   // the Angel Machine's Three of Swords
  if(sp.id==="lucifer"&&me().ouroRound===G.moon.round)return 0;                   // free in a round you cast Ouroboros on yourself
  const firm=G.p[G.active]&&G.p[G.active].tribe==="firm";   // the Firmament pays no moon surcharges
  if(sp.id==="clair"&&newPrices()&&!firm)return 6;
  if(sp.id==="clair"&&fullPrices())return 2;
  if(sp.id==="naked")return newPrices()&&firm?(G.prices?G.prices.naked:2):newPrices()?6:G.moon.blood?1:fullPrices()?0:(G.prices?G.prices.naked:2);
  if(sp.id==="deconj")return 2;   // the full curse pays the rest when it is chosen
  if(sp.id==="joy")return 0;      // both options pay when chosen
  if(G.prices&&G.prices[sp.id]!=null)return G.prices[sp.id];
  if(sp.id==="hypo"){const st=selOwn()?selStack():null;return 3+(st?st.cards.length-1:0)}
  return sp.cost;
}
function spellBlock(sp){ // reason the moon or mode forbids a spell, or ""
  if(sp.school==="Necromancy"&&G.p[G.active]&&oathOf(G.active)==="earth")return "The Earth Oath forbids necromancy.";
  if(G.bank&&G.bank.dead&&sp.school==="Conjuring")return "The Ether is closed: the Banker is dead.";
  if(fullDrawbacks()&&sp.school==="Necromancy"&&me().tribe!=="firm")return "No necromancy under the Full Moon.";
  if(fullDrawbacks()&&sp.id==="forced")return "No one draws under the Full Moon.";
  if(survival()&&["forced","double","three","naked"].includes(sp.id))return "The Horde has no hand or deck.";
  if(G.noConjure&&sp.school==="Conjuring")return "Deconjured: no one can conjure this Full Moon.";
  if(G.noConjureRound===G.moon.round&&sp.school==="Conjuring")return "Deconjured: no one can conjure this round.";
  return "";
}
const phaseOk=sp=>G.phase==="prep"||(G.phase==="attack"&&G.opts.atkSpells&&["Enchantment","Curse","Sorcery","Illusion"].includes(sp.school));
const spellMine=sp=>!sp.tribe||G.p[G.active].tribe===sp.tribe;   // Substance spells belong to their Substance
function spellReady(sp){return spellMine(sp)&&phaseOk(sp)&&!spellBlock(sp)&&sp.ok()&&canAfford(G.active,spellCost(sp))}
async function cast(sp){
  if(G.busy&&!me().cpu)return;
  if(!phaseOk(sp)){flash(G.opts.atkSpells?"That school is cast in the prep phase.":"Spells are cast in the prep phase.");return}
  if(!spellMine(sp))return;
  const why=spellBlock(sp);if(why){flash(why);return}
  if(!sp.ok()){flash("That spell can't be cast right now.");return}
  const cost=spellCost(sp);
  if(!canAfford(G.active,cost)){flash(me().credit?"Not even the Bank will cover that.":"Not enough mana. (The Bank can let you spend on credit.)");return}
  const wasBusy=G.busy;G.busy=true;const caster=G.active;
  const tile=G.sel&&["suicide","divine","hypo","hexed","tele"].includes(sp.id)?coord(G.sel.r,G.sel.c):null;G.histTarget=null;G.histTile=tile;
  if(cost){if(sp.id!=="ritual")G.spentOther=true;spend(G.active,cost);noteBuy(sp.id)}
  const paidCost=cost;   // spell mana goes to the Bank
  try{await sp.run()}finally{G.histTile=null}
  skyBought(sp,paidCost);mercuryBought(sp);
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
    if(G.p[pl].tribe==="jester"&&G.moon.gone==="jupiter"){const v=R(2)-1;if(v){giveMana(pl,v);log(`Jupiter adds ${v} mana to the Jester's Sacrificial Suicide.`)}}
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
  st.cards.splice(st.cards.indexOf(c),1);(me().returning=me().returning||[]).push(c);
  if(!st.cards.length){G.board[G.sel.r][G.sel.c]=null;G.sel=null}else G.sel.pick.delete(c.id);
  log(`Teleport: ${esc(nameOf(c))} leaves the field and will be back in the hand at the start of the next turn.`);checkWin();
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
  function enemyStacks(pl){return enemiesOf(pl).flatMap(stacksOf).filter(x=>seesTile(pl,x.r,x.c))}   // a deluded computer is as blind as a person
  /* how good it is for stack S (owned by pl) to stand at r,c */
  function tileScore(pl,S,r,c,W,canHit){
    const n=L(pl).mc;let opp=0,risk=0,allies=0;
    const diag=jackOnly(S),shot=S.cards.find(isShooter),hits=canHit&&(!!shot||canAttackFrom({cards:S.cards,attacked:false,hypo:S.hypo}));
    const su=shot?UNIT[shot.unit].weapons.filter(w=>!w.special):S.cards.length===1&&S.cards[0].unit&&UNIT[S.cards[0].unit].weapons?UNIT[S.cards[0].unit].weapons:null;
    const SA=shot?{cards:[shot],owner:pl}:S;
    const inReach=(er,ec)=>su?su.some(w=>w.reach==="charge"?(r===er&&Math.abs(c-ec)<=3&&Math.abs(c-ec)>=2)||(c===ec&&Math.abs(r-er)<=3&&Math.abs(r-er)>=2):reaches(w.reach,r,c,er,ec)):adjacent(r,c,er,ec,diag);
    let near=99;
    for(const e of enemyStacks(pl)){
      const E=e.st,d=walk(r,c,e.r,e.c);near=Math.min(near,d);
      if(hits&&!E.hypo&&!shielded(E.owner)&&inReach(e.r,e.c)){
        const p=winP(SA,E,n);let sc=shot?p*gain(E):p*gain(E)-(1-p)*loss(S);
        const ring=stacksOf(pl).filter(x=>x.st!==S&&adjacent(x.r,x.c,e.r,e.c,false)).length;sc+=ring*.3;
        if(sc>opp)opp=sc;
      }
      const esh=E.cards.find(isShooter),reach=esh?(esh.unit==="cannon"?4:3):jackOnly(E)||soloUnit(E)?3:2;
      if(d<=reach&&(esh||canAttackFrom({cards:E.cards,attacked:false,hypo:E.hypo}))&&!S.hypo){
        const p=winP(esh?{cards:[esh],owner:E.owner}:E,S,n);const rk=p*loss(S)*(d===1?1:.7);if(rk>risk)risk=rk;
      }
    }
    for(const x of stacksOf(pl))if(x.st!==S&&dist(x.r,x.c,r,c)===1)allies++;
    if(near===99){   // nothing in sight (fog of war): head for the enemy's ground
      let d=99;for(const e of enemiesOf(pl))for(const [er,ec] of zoneTiles(e))d=Math.min(d,walk(r,c,er,ec));near=d===99?0:d*.8}
    // the Horde and offense push toward the enemy's back line too
    return W.atk*opp-W.def*risk-W.dist*near+W.ally*allies;
  }
  function stance(pl){
    if(isHorde(pl))return HORDE;
    if(G.turnNo-(G.lastAttack||0)>10)return PUSH;   // nobody has fought for five rounds: break the stalemate
    const es=enemiesOf(pl).filter(e=>!isNPC(e)),my=stacksOf(pl).reduce((a,x)=>a+value(x.st),0),th=enemyStacks(pl).reduce((a,x)=>a+value(x.st),0)/Math.max(1,es.length);
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
    const k=kind(card),u=card.unit;
    if(u==="wall")return ((isFront(pl,r,c)?3:1.5)+(enemyStacks(pl).some(e=>dist(e.r,e.c,r,c)<=3)?1:0)-stacksOf(pl).filter(x=>hasK(x.st,"wall")).length*1.5)*jit(pl);
    if(u==="miner"){if(t&&hasK(t,"ace"))return 4.5*jit(pl);if(t)return -1;
      const cr=(G.crystals||[]).filter(x=>!G.board[x.r][x.c]||G.board[x.r][x.c].owner===pl);if(!cr.length)return -1;
      return (3.2-Math.min(...cr.map(x=>dist(x.r,x.c,r,c)))*.25-(enemyStacks(pl).some(e=>dist(e.r,e.c,r,c)<=1)?2:0))*jit(pl)}
    if(u==="archer"||u==="cannon")return (t?(hasBase(t)?4+(enemyStacks(pl).some(e=>Math.max(Math.abs(e.r-r),Math.abs(e.c-c))<=3)?1:0):2):(isBack(pl,r,c)?2.2:1.4))*jit(pl);
    if(u==="healer")return (t?2+value(t)/6:-.5)*jit(pl);
    if(u==="repair"){const b=t&&t.cards.find(isBase);return (b?3+((b.hp||1)<(b.maxHp||1)?2:0):t?.8:-.5)*jit(pl)}
    if(u==="ram")return (t&&enemyWalls(pl)?3:t?.3:-1)*jit(pl);
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
      if(st.cards.every(c=>c.unit==="miner"))continue;   // lone Miners have their own errands
      let grp=st.cards.filter(c=>!isBase(c)&&!(hasBase(st)&&c.unit&&(c.unit==="miner"||c.unit==="repair"||UNIT[c.unit].shooter)));   // Miners, Repairmen and shooters stay in their baseif(!grp.length||st.stun)continue;
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
      for(const o of attackOptions(r,c)){
        const r2=o.r,c2=o.c,E=G.board[r2][c2];
        if(o.mode==="capture"||o.mode==="destroy"||o.mode==="ram"){const sc=(o.mode==="capture"?value(E)+2:o.mode==="ram"?3.5:value(E)*.8+.5)*jit(pl);if(!best||sc>best.sc)best={r,c,r2,c2,sc,p:1,mode:o.mode};continue}
        if(o.mode==="suppress"){if(lvl(pl)!=="easy"&&canAttackFrom({cards:E.cards,attacked:false})&&Math.random()<.12){const sc=.45;if(!best||sc>best.sc)best={r,c,r2,c2,sc,p:1,mode:o.mode}}continue}
        const p0=o.mode==="stomp"?(E.pin?0:.62):winP(o.A||st,E,lv.mc,o.mode),p=o.ranged||o.mode==="stomp"?Math.min(1,p0+(1-p0)*.6):p0;   // a ranged miss (or a failed Stomp) costs nothing
        const sc=(p*gain(E)*(o.mode==="stomp"?.6:1)-(1-p)*loss(st))*jit(pl);
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
      const c=[...P.hand].filter(c=>mana(pl)+soulOf(c)<=soulCap(pl)&&kind(c)!=="ace"&&kind(c)!=="joker"&&canSacCard(c)&&!(c.unit==="scout"&&fogOn()&&scoutsOf(pl).length<2)&&!keepSupport(pl,c)).sort((a,b)=>rate(a)-rate(b))[0];
      if(!c)break;
      if(rate(c)>14&&mana(pl)>=2)break;
      sacrifice(c,"hand");await step();
    }
  }
  async function necro(pl){
    const lv=lvl(pl),aces=stacksOf(pl).filter(x=>hasK(x.st,"ace")).length;
    if(G.p[pl].tribe!=="firm"&&G.grave.length>=2&&mana(pl)>=(lv==="hard"?1:2)&&(lv!=="easy"||Math.random()<.4)&&(aces>=1||lv==="hard"))await tryCast("ritual");
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
    if(ph==="attack"){await attacks(pl);await aiMoonAttack(pl);G.sel=null}
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
  if(s==="scroll"){   // Lucifer's ink and scroll
    return "M-8,-8H5C7,-8 8,-7 8,-5V7C8,9 7,10 5,10H-6 M-8,-8C-10,-8 -10,-4 -8,-4H-5V8C-5,10 -8,10 -8,8 M-2,-3H3 M-2,0H5 M-2,3H3 M3,-1L10,-10 M3,-1L2.4,1.6L5,0.6Z"}
  if(s==="saturn"){   // Saturn and its ring
    return "M0,-6.5A6.5,6.5 0 1,1 -0.1,-6.5Z M-10.5,4C-12,1 -5,-3 2,-5C8,-7 12,-6 10.5,-3 M-10.5,4C-9,6 -2,5 4,2C8,0 11,-2 10.5,-3"}
  if(s==="hexa")return ring(poly(3,9.8,-90))+ring(poly(3,9.8,90));   // the Firmament's six-pointed star
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
  if(G.moon.gone)return goneMoonSVG();
  const m=G.moon,r=30,red=m.blood,lit=red?"#d3171e":"#f2ebd8",dark=red?"#3b0608":"#1f1913",glow=red?"#ff2a2a":"#fff2cf";
  return `<svg class="moon${red?" red":""}" viewBox="-44 -44 88 88" width="88" height="88" aria-hidden="true">
<defs><radialGradient id="mglow"><stop offset="50%" stop-color="${glow}" stop-opacity=".42"/><stop offset="100%" stop-color="${glow}" stop-opacity="0"/></radialGradient><filter id="mblur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".9"/></filter></defs>
<circle r="${r+13}" fill="url(#mglow)"/>
<g filter="url(#mblur)"><circle r="${r}" fill="${dark}" stroke="${red?"#8a1418":"#8a7a66"}" stroke-width="1"/><g fill="${lit}">${moonPath(m.i,r)}</g></g>${G.moonLev?levOnMoon():""}${G.moonMiner?minerOnMoon():""}</svg>`;
}
function moonStrip(){
  const m=G.moon;if(m.gone)return "";
  return `<div class="mstrip" aria-label="Moon phases">${MOON.map((n,i)=>`<span class="${i===m.i?"on":""}" title="${n}"><svg viewBox="-9 -9 18 18" width="18" height="18"><circle r="7" fill="${m.blood&&i===4?"#3b0608":"#1f1913"}" stroke="#5a4a3a" stroke-width=".6"/><g fill="${m.blood&&i===4?"#d3171e":"#e9e1cc"}">${moonPath(i,7)}</g></svg></span>`).join("")}</div>`;
}
function face(c,o={}){
  const own=o.owner!==undefined?o.owner:c.owner,P=own!=null&&G.p[own]?G.p[own]:null;
  const col=P?P.color:"#8a8a8a",k=kind(c),sm=o.cls==="sm";
  if(c.unit){   // a Substance card: its own symbol and its hearts
    const U=UNIT[c.unit],nm=U.short||U.name;
    return `<span class="cf unit u-${c.unit}${c.hate?" hated":""}${isBase(c)?" basecard":""} ${o.cls||""}" style="--pc:${col}" title="${esc(nameOf(c))}"><span class="cx"><b class="rk un">${esc(sm?nm.slice(0,4):nm)}</b></span><span class="uic">${unitSVG(c.unit,c.unit==="tree"?"#2d6b3a":c.unit==="satan"?"#8e1426":"#15100b",sm?18:30)}</span>${c.maxHp&&!sm?heartsHTML(c):""}${P?`<span class="so">${solidSVG(P.solid,col,sm?12:17)}</span>`:""}${sm?"":`<em class="ty">${esc(U.word)}</em>`}${o.price?`<span class="price">${costOf(c)} mana</span>`:""}${o.noci?"":`<span class="ci" data-cid="${c.id}" role="button" title="Card info"></span>`}</span>`;
  }
  const rk=c.rank==="JK"?"Joker":c.rank,su=c.rank==="JK"?"✶":SUITS[c.suit];
  return `<span class="cf ${c.color}${c.hate?" hated":""}${isBase(c)?" basecard":""} ${o.cls||""}" style="--pc:${col}" title="${esc(nameOf(c))}"><span class="cx"><b class="rk${c.rank==="JK"?" jk":""}">${rk}</b>${c.rank==="JK"?"":`<i>${su}</i>`}</span><i class="su">${su}</i>${P?`<span class="so">${solidSVG(P.solid,col,sm?12:17)}</span>`:""}${c.puppet&&!sm?`<span class="pup">${unitSVG("puppet","#15100b",16)}</span>`:""}${c.maxHp&&!sm?heartsHTML(c):""}${sm?"":`<em class="ty">${typeWord(c)}</em>`}${o.price?`<span class="price">${costOf(c)} mana</span>`:""}${o.noci?"":`<span class="ci" data-cid="${c.id}" role="button" title="Card info"></span>`}</span>`;
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
  const m=mana(P.i)-(P.debt||0);   // negative when the player owes the Bank
  return `<div class="meters"><div class="meter"><span class="bk">Deck</span><div class="deckbar" style="--pc:${P.color};grid-template-columns:repeat(${N},1fr)" role="img" aria-label="Deck ${n} cards of ${N}">${blocks}${over}</div><b class="mv">${n}${extra?` <small>+${extra}</small>`:""}</b></div>
<div class="meter mana"><span class="bk">Mana</span><div class="manabar" role="img" aria-label="Mana ${m} of ${soulCap(P.i)}">${Array.from({length:soulCap(P.i)},(_,i)=>`<i class="${i<m?"f":""}"></i>`).join("")}${m>soulCap(P.i)?`<span class="msur" title="surplus: fades at the next round">${"<i></i>".repeat(Math.min(12,m-soulCap(P.i)))}</span>`:""}</div><b class="mv${m<0?" neg":""}">${m<0?"−"+(-m):m}/${soulCap(P.i)}${m>soulCap(P.i)?` <small>surplus</small>`:""}</b></div></div>`;
}
function pboxHTML(pl,top){
  const P=G.p[pl],act=pl===G.active&&G.phase!=="setup";
  const tag=P.cpu==="horde"?"the Horde":(P.cpu?`computer · ${P.cpu} · `:"")+(TRIBES[P.tribe]?TRIBES[P.tribe].name:"");
  const V=view(),rel=pl===V?"":isEnemy(pl,V)?"":'<span class="ally">ally</span>';
  let h=`<div class="ph" style="--pc:${P.color}"><button type="button" class="subst" data-stat="${pl}" title="Status: hover or click">${solidSVG(P.solid,P.color,18)}</button><b>${esc(P.name)}</b><span class="dim">${esc(tag)}</span>${rel}${P.out?'<span class="outmark">out</span>':act?'<span class="turnmark">to play</span>':""}</div>`;
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
    if(deluded(pl))sl.push(`<span class="delutag">Deluded ${P.delu.turns} turn${P.delu.turns>1?"s":""} · ${3-(P.delu.diceCut||0)}d2 free a turn${P.delu.blindfold?" · Blindfold":""}${P.delu.extended?" · extended":""}</span>`);
    if(P.joy)sl.push(`<span class="joytag">Pleasure and Joy</span>`);
    sl.push(...econTags(P));
    if(P.tribe==="yald")sl.push(`<span>Hunger <b>${P.hunger||0}/7</b></span>`);
    if(P.tribe==="tiph"){const n=stacksOf(pl).reduce((a,x)=>a+x.st.cards.reduce((b,c)=>b+((c.prisoners||[]).length),0),0);sl.push(`<span>Prisoners <b>${n}</b></span>`)}
    if(sl.length)h+=`<p class="stats subline">${sl.join("")}</p>`;
    const showHand=top;
    if(showHand){
      const open=eclipseOn("sun")&&!G.passing||P.shownBy!=null&&!G.passing&&(P.shownBy===V||!isEnemy(P.shownBy,V))||!isEnemy(pl,V)&&G.p.filter(Q=>!Q.cpu).length===1&&!G.passing;
      h+=`<div class="handrow"><span class="bk">Hand ${P.hand.length}/${handCap(pl)}</span>${P.hand.map(c=>open?face(c,{cls:"sm"}):back(pl)).join("")}${open?'<span class="seenmark">seen</span>':""}</div>`;
    }else h+=`<p class="stats"><span>Hand <b>${P.hand.length}/${handCap(pl)}</b></span>${P.od?`<span class="odn">overdrawn <b>${P.od}</b></span>`:""}</p>`;
  }
  if(top)h+=`<div class="traywrap">${trayHTML(P,pl)}</div>`;
  return h;
}
function render(){
  if(!G)return;if(G.moonMiner)checkMoonMiner();
  const V=view(),T=enemiesOf(V).filter(i=>!isNPC(i))[0]??(V===0?1:0);
  if(G.placing&&G.selHand!==G.placing)G.selHand=G.placing;
  const K=G.rows===COLS?seat(V).rot:(seat(V).rot%2?0:seat(V).rot),duel=G.map.layout==="duel"&&K%2===0;
  document.body.classList.toggle("passing",!!G.passing);
  // moon
  const m=G.moon,tags=[];
  if(m.blood)tags.push('<span class="tag blood">Blood Moon</span>');
  const eff=m.gone||G.moonLev?moonNote():m.blood?"New Moon gifts at Full Moon prices; the dead go to the Outer Darkness":m.i===4?"Toll paid, decks shuffled; no drawing, no necromancy":m.i===0?"1d2 cards from the grave; Clairvoyance and Naked Hand cost 6":"";
  const rn=G.moon.round||1;
  $("#moon").classList.toggle("eclipsed",!!G.eclipse);$("#moon").classList.toggle("peacetime",peaceOn());$("#moon").classList.toggle("wartime",warOn());
  $("#moon").classList.toggle("moontarget",canAct()&&G.phase==="attack"&&!!G.sel&&moonAttackable(selStack()));
  $("#moon").innerHTML=`${moonSVG()}<div class="minfo"><span class="mname">${moonName()}</span>${tags.join("")}${moonStrip()}<span class="meff">${eff||`moon round ${rn} · the moon turns when every player has had a turn`}</span></div>`;
  // round (survival)
  const rd=$("#round");rd.hidden=!survival();if(survival())rd.innerHTML=`<span class="label">Round</span><b class="bl">${roman(Math.max(1,G.round))}</b>`;
  // phases
  if(G.phase==="setup")$("#phases").innerHTML=`<span class="ph-c on"><b>Setup</b><em>${G.setupStep==="ace"?(hq()&&!G.p[G.active].opening.length?"click a backline tile for your second base Ace":"click a backline tile for your Ace and Jack"):"place any opening cards, then press Done"}</em></span>`;
  else if(G.phase==="moon")$("#phases").innerHTML=`<span class="ph-c on"><b>Moon</b><em>${m.i<0?"no moon turns":"the "+MOON[m.i]+" takes effect"}</em></span>`;
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
  const B=$("#board");B.style.setProperty("--rows",DR);B.style.setProperty("--cols",DC);B.classList.toggle("mapped",G.map.theme!=="none");B.classList.toggle("nolabels",!duel);B.dataset.map=G.map.theme;B.classList.toggle("sunlit",G.moon.gone==="sun");B.classList.toggle("blacksun",G.moon.gone==="blacksun");B.style.setProperty("--tears",G.sunTears||0);
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
      const st=hiddenFrom(V,r,c)?null:G.board[r][c],role=tileRole(r,c),edge=outerEdge(r,c,K),key=r+"."+c+"."+edge;   // a Delusion hides what lies beyond your reach
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
        inner=`<div class="stack ${hasBase(st)?"base ":""}${mine?"mine":isEnemy(st.owner,V)?"theirs":"ally"} ${lead.color}${hated(st)?" hated":""}${shielded(st.owner)?" pink":""}${G.p[st.owner].joy?" joy":""}${lead.unit?" u-"+lead.unit:""}" style="--pc:${P.color}"><span class="so">${solidSVG(P.solid,P.color,16)}</span><span class="ci" title="Card info: click it, or drag it onto another stack to compare"></span>${st.cards.length>1?`<span class="cnt">×${st.cards.length}</span>`:""}${leadHTML}<span class="mini">${st.cards.length>1?st.cards.map(short).join(" "):heartsHTML(lead)}</span>${st.cards.length>1&&lead.maxHp?`<span class="bhp">${heartsHTML(lead)}</span>`:""}<em class="ty">${esc(typeWord(lead))}</em>${st.stun?`<span class="stun" title="Immobilized by lightning for ${st.stun} more turn${st.stun>1?"s":""}">${unitSVG("bolt","#6fb8ff",14)}${st.stun}</span>`:""}${st.odds?`<span class="odds ${st.odds}">${st.odds==="adv"?"▲":"▼"}</span>`:""}${st.hypo?`<span class="hypo" title="Hypostasis: untouchable">◈${st.hypo}</span>`:""}${cap?`<span class="souls" title="captured souls">✦${cap}</span>`:""}${st.owner===G.active&&(st.moved||st.attacked)&&G.phase!=="setup"?`<span class="used">${st.attacked?"atk":"mv"}</span>`:""}</div>`;
      }
      if(st&&showsBack(V,r,c)){const P=G.p[st.owner];inner=`<div class="stack theirs facedown" style="--pc:${P.color}"><span class="so">${solidSVG(P.solid,P.color,16)}</span><span class="fdback">${solidSVG(P.solid,P.color,30)}</span><em class="ty">face down</em></div>`}
      else if(st){if(st.down)inner=inner.replace('class="stack ','class="stack down ');if(st.ambush&&!isEnemy(st.owner,V))inner=inner.replace('class="stack ','class="stack ambush ');inner=siegeDecor(inner,st,V,r,c)}
      inner=crystalHTML(r,c,!!st)+inner;
      if(fogTile(V,r,c))cls.push("fog");if(fireAt(r,c))cls.push("fire");
      const zc=!duel&&z>=0?` style="--zc:${G.p[z].color}"`:"";
      return `<button class="${cls.join(" ")}${role==="bridge"?" bridge":""}"${zc} data-r="${r}" data-c="${c}" aria-label="${coord(r,c)}, ${lineName||(z>=0?G.p[z].name+"'s ground":"open ground")}${role==="bridge"?" bridge":""}${st?", "+st.cards.map(nameOf).join(", "):", empty"}">${art}${PREF.coords?`<span class="coord">${coord(r,c)}</span>`:""}${inner}</button>`;
    }).join("")+"</div>";
  }).join("");
  $("#board").querySelectorAll("button.tile").forEach(b=>b.onclick=()=>tileClick(+b.dataset.r,+b.dataset.c));
  // player boxes
  const others=G.p.map(P=>P.i).filter(i=>i!==V&&!isNPC(i));
  if(others.length===1){$("#foe").classList.remove("multi");$("#foe").innerHTML=pboxHTML(others[0],true);$("#foe").style.setProperty("--pc",G.p[others[0]].color)}
  else{$("#foe").classList.add("multi");$("#foe").innerHTML=others.map(o=>`<div class="pbox sub" style="--pc:${G.p[o].color}">${pboxHTML(o,true)}</div>`).join("")}
  $("#me").innerHTML=pboxHTML(V,false);$("#me").style.setProperty("--pc",G.p[V].color);
  $("#shared").innerHTML=`<button class="link limbo-l" id="seegrave">Grave <b>${G.grave.length}</b></button><button class="link" id="seeether">Ether <b>${G.ether.length}</b></button><button class="link dark-l" id="seedark">Outer Darkness <b>${G.dark.length}</b></button>`;
  $("#seegrave").onclick=()=>viewBox("The Grave",G.grave,"limbo","Shared by every player. The dead sleep here until something raises them.");
  $("#seeether").onclick=showEther;
  $("#seedark").onclick=()=>viewDark("dark");
  const bl=$("#blindnote");if(bl)bl.hidden=!blindFor(V);
  const PV=G.p[V];
  if(G.limbo.length&&!PV.readLimbo)$("#shared").insertAdjacentHTML("beforeend",`<button class="link notice limbo-n" id="nlimbo">Limbo: Samson is wandering <b>new</b></button>`);
  if(G.unknown.length&&!PV.readUnknown)$("#shared").insertAdjacentHTML("beforeend",`<button class="link notice unk-n" id="nunk">Unknown: Antony went missing <b>new</b></button>`);
  if(!survival()||(G.auction||[]).length){$("#shared").insertAdjacentHTML("beforeend",`<button class="link auct-l" id="seeauct">Auction <b>${G.auction.length}</b></button>`);$("#seeauct").onclick=viewAuction}
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
  wireCorners();wireMoon();wireStatus();
  if(histOpen!=null)fillHist();
  $("#log").innerHTML=G.log.map(l=>`<li class="${l.cls}"${l.pl!=null&&G.p[l.pl]?` style="--pc:${G.p[l.pl].color}"`:""}>${l.t?`<time>${clock(l.t)}</time>`:""}<span class="lt">${l.fog&&!l.fog.seen[view()]&&isEnemy(l.fog.by,view())?l.fog.alt:l.html}</span></li>`).join("");
  mountTimerOff();
}
function renderSpells(live){
  const box=$("#spells");
  if(survival()&&false)return;
  const m=G.moon;
  box.classList.toggle("bloodmoon",!!m.blood);
  const P=me(),od=G.p[G.active].od;
  const head=!live?`<p class="dim">${G.passing?"":me().cpu?"The computer is casting.":"Spells are cast during your prep phase."}</p>`:G.phase==="prep"?"":G.opts.atkSpells&&G.phase==="attack"?'<p class="dim">Enchantments, curses and sorcery can be cast now.</p>':'<p class="dim">Spells are cast during the prep phase.</p>';
  box.innerHTML=head+SCHOOLS.filter(sc=>SPELLS.some(s=>s.school===sc&&(!s.tribe||s.tribe===G.p[view()].tribe))).map(sc=>`<details class="school" data-sc="${sc}" ${(PREF.shut||[]).includes(sc)?"":"open"}><summary>${sc}</summary>`+SPELLS.filter(s=>s.school===sc&&(!s.tribe||s.tribe===G.p[view()].tribe)&&!(survival()&&["forced","double","three","naked"].includes(s.id))).map(s=>{
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
    return `<button class="spell${s.tribe?" subsp":""} ${ok?"":"off"} ${moon} ${s.school==="Necromancy"?"nec":""} ${s.id==="sever"&&P.sevArmed?"armed":""}" data-s="${s.id}" title="${esc(block||s.text)}"><span>${esc(s.name)}${extra}</span><em>${s.id==="hypo"&&!selOwn()?"3+":priceLabel(s)}</em></button>`}).join("")+(sc==="Conjuring"?`<button class="link souls-l" id="showsouls">show available souls</button>${bankBarHTML()}`:"")+"</details>").join("");
  box.querySelectorAll("details.school").forEach(d=>d.ontoggle=()=>{const sc=d.dataset.sc,S=new Set(PREF.shut||[]);d.open?S.delete(sc):S.add(sc);PREF.shut=[...S];savePrefs()});
  box.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{if(!canAct())return;cast(SP(b.dataset.s))});
  if($("#showsouls"))$("#showsouls").onclick=showEther;
  if($("#openBank"))$("#openBank").onclick=openBank;
}
function showEther(){viewBox("The Ether: Souls to Materially Conjure",G.ether,"ether",`${G.ether.length} souls wait in the Ether for a conjuring. Flesh Severance sends exiled souls back here.`)}
function renderSel(live){
  const box=$("#selbox"),st=selStack();
  if(G.phase==="setup"&&G.setupStep==="ace"&&live){box.innerHTML=`<p>Your Ace rises with a Jack inside it. Click a highlighted tile on your backline.</p>`;return}
  if(G.placing&&live){box.innerHTML=`<p><b>A Slave</b> is ready. Click an empty highlighted tile of your ground to put it down.</p>${unitInfo(G.placing)}`;return}
  if(G.selHand){box.innerHTML=`${G.selHand.unit?unitInfo(G.selHand):""}<p><b>${esc(nameOf(G.selHand))}</b> selected. Click a highlighted tile in your two lines to place it${kind(G.selHand)==="ace"?" (Aces go on an empty backline tile)":kind(G.selHand)==="joker"?" (Jokers spawn onto your stack holding a card of the same color)":""}.</p>${!isBase(G.selHand)&&kind(G.selHand)!=="joker"&&!G.placing?`<label class="fdtog"><input type="checkbox" id="fdChk" ${G.faceDown?"checked":""}> Place it face down <small>Only you see it. Double disadvantage to attack, advantage to defend; it turns face up when attacked. Face-down stacks can ambush.</small></label>`:""}`;
    if($("#fdChk"))$("#fdChk").onchange=e=>{G.faceDown=e.target.checked;render()};return}
  if(!st){box.innerHTML='<p class="dim">Select a stack on the board, or a card in your hand.</p>';return}
  if(showsBack(view(),G.sel.r,G.sel.c)){box.innerHTML=`<p><b>${esc(G.p[st.owner].name)}'s face-down stack</b> on ${coord(G.sel.r,G.sel.c)}. Its face is hidden; a Scout within two tiles would show it.</p>`;return}
  const mine=st.owner===G.active&&live,s=G.sel;
  const rows=st.cards.map(c=>{
    const k=kind(c),cap=capMana(c);
    const chk=mine&&!isBase(c)&&G.phase==="prep"?`<input type="checkbox" data-pk="${c.id}" ${s.pick.has(c.id)?"checked":""} aria-label="include ${esc(nameOf(c))} in the moving group">`:"";
    const sac=mine&&sacrificeAllowed()&&canSacOnField(st,c)?`<button class="mini-btn" data-sc="${c.id}">sac +${soulOf(c)}</button>`:"";
    const stat=c.unit&&UNIT[c.unit].desc&&!UNIT[c.unit].shooter?UNIT[c.unit].desc:c.unit&&UNIT[c.unit].weapons?UNIT[c.unit].weapons.map(w=>w.name+": "+w.text).join("; "):`${nat(c)}${die(c)?" + d"+die(c):""}`;
    return `<li>${chk}${face(c,{cls:"sm"})} ${esc(typeWord(c))} · ${esc(stat)}${c.maxHp?" · "+heartsHTML(c):""}${c.hate?' · <span class="hatetag">Hate</span>':""}${(c.prisoners||[]).length?` · ⛓ ${c.prisoners.length} prisoner${c.prisoners.length>1?"s":""}`:""}${cap?` · ✦${cap} captured`:""} ${sac}</li>`}).join("");
  const acts=siegeActs(st,mine,s);
  const owner=G.p[st.owner].name;
  box.innerHTML=`<p><b>${st.owner===G.active?"Your":esc(owner)+"'s"} stack</b> · ${st.cards.length} card${st.cards.length>1?"s":""}${st.odds?` · ${st.odds==="adv"?"Divine Odds":"Hexed Odds"}`:""}${st.hypo?` · Hypostasis (${st.hypo})`:""}${st.stun?` · immobilized by lightning (${st.stun})`:""}${shielded(st.owner)?" · Please Don't Hurt Me":""}${st.moved?" · moved":""}${st.attacked?" · attacked":""}</p><ul class="cards">${rows}</ul><div class="acts">${acts.join("")}</div>${mine&&G.phase==="prep"?`<p class="dim">${st.moved?"This stack has moved this turn.":"Highlighted tiles show where it can go: click one to move. Uncheck any card you want to leave behind. Click the stack again to let go."}</p>`:""}${mine&&G.phase==="attack"?`<p class="dim">${attackTargets().length?"Click a highlighted enemy stack to attack it.":canAttackFrom(st)||st.cards.some(x=>x.unit&&UNIT[x.unit].shooter)?"No enemy stack is in reach.":"This stack can't attack now."}</p>`:""}${mine&&G.phase==="attack"&&moonAttackable(st)?`<p><button class="btn ghost" id="atkmoon">Attack the Leviathan on the moon</button></p>`:""}`;
  if($("#atkmoon"))$("#atkmoon").onclick=()=>{if(!canAct())return;attackMoon(s.r,s.c);G.mode=null;if(G.sel&&!G.board[G.sel.r][G.sel.c])G.sel=null;render()};
  box.insertAdjacentHTML("beforeend",`<details class="selinfo" ${PREF.selInfo===false?"":"open"}><summary>Stats</summary>${infoHTML1(st,st.cards.length>1?`Stack of ${st.cards.length}`:nameOf(st.cards[0]))}</details>${mine&&G.phase==="prep"&&canAmbush(st)&&!st.moved&&!st.attacked?`<p><button class="btn ghost sm" id="ambBtn">${st.ambush?"Leave the ambush":"Set an ambush"}</button> <small class="dim">${st.ambush?"Moving or attacking also breaks it.":"Hidden and still: it strikes, with advantage, any enemy that steps beside it."}</small></p>`:""}<p class="cmpbtns"><button class="btn ghost sm" id="cmpField">${G.comparePick?"Click a stack… (cancel)":"Compare with a stack"}</button> <button class="btn ghost sm" id="cmpType">Compare with a kind of card</button></p>`);
  box.querySelector(".selinfo").ontoggle=e=>{PREF.selInfo=e.target.open;savePrefs()};
  $("#cmpField").onclick=()=>{G.comparePick=!G.comparePick;render()};
  if($("#ambBtn"))$("#ambBtn").onclick=()=>{st.ambush=!st.ambush;log(st.ambush?`${plName(st.owner)} sets a stack in ambush.`:`${plName(st.owner)} leaves the ambush.`,"ai");G.mode=null;render()};
  $("#cmpType").onclick=()=>openBrowser(st,st.cards.length>1?`Stack of ${st.cards.length}`:nameOf(st.cards[0]));
  box.querySelectorAll("[data-pk]").forEach(i=>i.onchange=()=>{const id=+i.dataset.pk;i.checked?s.pick.add(id):s.pick.delete(id);G.mode=autoMode(st);render()});
  box.querySelectorAll("[data-sc]").forEach(b=>b.onclick=()=>{const c=st.cards.find(x=>x.id===+b.dataset.sc);sacrifice(c,{r:s.r,c:s.c});render()});
  wireSiege(st,s);
}
/* selecting your own stack shows where it can go (prep) or what it can hit (attack) straight away */
function autoMode(st){
  if(!st||st.owner!==G.active||!canAct())return null;
  if(G.phase==="prep"&&!st.moved)return "move";
  if(G.phase==="attack"&&G.sel&&attackOptions(G.sel.r,G.sel.c).length)return "attack";
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
  if(G.comparePick&&G.sel){const a=selStack(),b=hiddenFrom(view(),r,c)?null:G.board[r][c];G.comparePick=false;
    if(a&&b&&a!==b){const t=document.querySelector(`.tile[data-r="${r}"][data-c="${c}"]`).getBoundingClientRect();pop(`<div class="cih"><b>Compare</b></div>`+compareHTML(a,b,stackTitle(a,G.sel.r,G.sel.c),stackTitle(b,r,c)),t.left,t.bottom,"info wide")}render();return}
  if(G.busy)return;
  const st=hiddenFrom(view(),r,c)?null:G.board[r][c];
  if(!st||(G.sel&&G.sel.r===r&&G.sel.c===c)){G.sel=null;G.mode=null;render();return}
  G.sel={r,c,pick:new Set(st.cards.filter(x=>!isBase(x)).map(x=>x.id))};G.mode=autoMode(st);render();
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
  box.innerHTML=`<div class="hhead"><div class="htabs">${G.p.filter(Q=>!isNPC(Q.i)).map(Q=>`<button type="button" class="htab ${Q.i===histOpen?"on":""}" data-ht="${Q.i}" style="--pc:${Q.color}">${solidSVG(Q.solid,Q.color,13)} ${esc(Q.name)}</button>`).join("")}</div><button type="button" class="hx" aria-label="Close the history">×</button></div>
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
 ace:["Ace","A",[["Defense","11 + 1d20 when attacked; cards inside it don't roll on defense"],["Hearts","two: the first hit takes a heart and the cards inside are safe; when the last heart goes, the Ace and every card inside it are destroyed. On a roll of 1 it deals no damage back"],["Limits","cannot move or attack; only on an empty backline tile; holds up to six cards"],["Grave Blessing","+1d6 for each Ace you have on the field"],["Soul","3 mana · Ace Conjure, 3 mana · can't be sacrificed on the field, except to the Full Moon"],["Opening","each player starts with an Ace from their deck on a backline tile of their choice, holding a Jack"]],"A fortress and a grave-caller. Hard computers stack Aces to roll more Grave Blessing dice."],
 joker:["Joker (Necromancer)","Joker",[["Score","alone, copies the score and die of the enemy's leading card; Jokers can't kill Jokers"],["Spawns","only onto your stack holding a card of the same color (red or black)"],["Soul Capture","enemies that die on the 8 tiles around it, or its own tile, are held inside it, up to 6 mana of souls"],["Held souls","it keeps them until it dies (it and its souls go to the grave, unless an enemy Joker beside it steals them) or until Sacrificial Suicide moves them to your soul pile"],["Blood Moon","a Joker that shoots itself under a Blood Moon sends itself and every soul it held to the Outer Darkness"],["Survival","Horde Jokers capture your souls; when one shoots itself those cards go to the Outer Darkness and you lose 1 mana"],["Soul","1 mana · Joker Conjure, 2 mana"]],"The necromancer of the deck, and the only way to turn kills into mana."],
 samson:["Samson (Angel Machine)","Samson",[["Hearts","two: he loses one each time he takes damage, and falls at none"],["Slugshot Cannon","3d20, at an enemy two tiles away in a straight line or one diagonal; from two away a miss costs him nothing"],["Arm Blade","12 + 3d8, up close"],["Mech Slam","16 + 1d4, up close"],["Defense","12"],["Moves","one tile straight, or one or two diagonal"],["Stacks","with nothing but an Ace"],["Falls","Antony rises from his heart on the same tile, and Samson wanders through Limbo"]],"The Angel Machine's mech suit. Its deck holds one."],
 antony:["Antony (Angel Machine)","Antony",[["Hearts","two"],["Score","12 + 6d4 on attack, 12 on defense"],["Moves","like Samson"],["Bolts","every card he kills charges a bolt for Lightning Strike"],["Falls","he goes missing: his card is found under Unknown in the Outer Darkness"]],"The angel who was lodged in Samson's heart."],
 satan:["Satan","Satan",[["Hearts","three"],["Score","6d12 on attack and on defense, with no modifiers: no moon bonus, no odds, no Hate"],["Stacks","never"],["Falls","into the Outer Darkness"]],"Satan's own card, one in his deck."],
 tree:["Tree of Neither Life Or Death (Jester Fool)","Tree",[["Hearts","three; it cannot defend itself"],["Holds","up to six cards, like an Ace, but never Kings or tens"],["Gives","+2 mana at the start of each of your turns, and a free Puppet inside it every two rounds"],["Falls","into the Outer Darkness, with every card in it"]],"In the Jester's starting hand. Place it on an empty tile of your ground."],
 puppet:["Puppet (Jester Fool)","6",[["Score","a 6 Grunt: 6 + 1d6 on attack"],["Deck","every soldier in the Jester's deck is a Puppet"]],"Strings and wood."],
 bullgoat:["BullGoat (Jester Fool)","BullGoat",[["Hearts","two"],["Gore","10 + 1d20, up close"],["Charge","10 + 2d20 at an enemy two or three tiles away in a straight line with nothing between; the BullGoat ends next to its target"],["Defense","10"],["Stacks","never"],["Conjure","3 mana, into your hand"]],"The Jester's beast."],
 slavemaster:["Slavemaster (Binah)","SM",[["Score","8 + 1d8 on attack, stacks like an Infantry"],["Capture","enemy soldiers killed in its fights become your thralls, ten at most"]],"Three in Binah's deck."],
 slave:["Slave (Binah)","Slave",[["Rifle","10 + 1d12, at an enemy two tiles away in a straight line or one diagonal; from two away a miss costs nothing"],["Defense","none"],["Moves","one tile straight"],["Stacks","never"],["Deploy","the free Slaves spell (Necromancy) puts one thrall down on an empty tile of your ground"]],"A captured soldier with a chip in its head."],
 leviathan:["The Leviathan","Leviathan",[["Hearts","three"],["Score","6d4 + 1d2 + 6 on attack and on defense; no Queen bonus"],["Stacks","never"],["Kills","whatever it kills falls into the Outer Darkness"],["The moon","Rise to the Moon (free, New Moon only) lifts it onto the moon: a toll on every enemy each New Moon after, and +1 mana cap for you per card in the Outer Darkness (twelve at most)"],["On the moon","any enemy unit can attack it, but only at the New Moon, and it defends with advantage"],["Lightning","Antony's lightning needs no roll: it takes one heart"],["Falls","into the Outer Darkness, forever"]],"The black serpent, one in the Leviathan's deck."],
 trafficker:["Trafficker (Tiphareth of Kether)","Trafficker",[["Score","8 + 1d8 on attack, stacks like an Infantry"],["Chains","any enemy card that dies on the eight tiles around it, three prisoners at most"],["Life for Sell","puts a prisoner up at the Auction"],["Falls","its prisoners go free into the grave"]],"Three in Tiphareth of Kether's deck."],
 debt:["Debt Collector (Yaldabaoth)","Collector",[["Score","copies the leading card of whatever it fights, natural value and die, without its advantage"],["Rises","when an enemy refuses to pay Saturn"],["Price","each one still standing at a new round raises Saturn's price by 1"]],"Saturn's warden."],
 goatbull:["Goatbull (Jester Fool)","Goatbull",[["Comes back","when the BullGoat dies it goes back into the deck, and is drawn again as the Goatbull"],["Hearts","two"],["Horns","10d2 + 1d10, up close"],["Charge","10 + 2d20 at an enemy exactly two tiles away in a straight line with nothing between; it closes the gap"],["Stomp","an ability check: its 1d20 with advantage against the target's 1d20 with disadvantage (Samson rolls plain). Win: the stack is Behooved, pinned for 2d2 of its turns (1d2 on a tie), and can't move or attack. A 16 or more that the target doesn't match deals 1 damage; each later pinned round checks again and needs 5 less (11, then 6…)"],["Attacked","a Goatbull attacked while it pins loses its advantage in every later check"],["Falls","into the Outer Darkness"]],"The BullGoat, turned around."],
 scout:["Scout (support)","Scout",[["Sight","three tiles through the fog of war; it uncovers Assassins, ambushers and face-down cards within a round two tiles, and enemy Scouts within three"],["Hidden","enemies see it only from right beside it, or with their own Scout within three"],["Fights","never: no attack and no defense"],["Moves","one tile straight, two diagonal, or two forward or back"],["Comes","two in every deck; one with every Ace you put down (two with the Beginner's first), except for Lucifer & Ouroboros; the rest wait in the Ether for 1 mana"]],"A horse and a rider who sees far."],
 assassin:["Assassin (special)","Assassin",[["Hearts","two (a pair of Assassins has three)"],["Attack","10 + 1d12, the roll of a Jack"],["Defense","8, like an Infantry"],["Hidden","enemies see it only from right beside it, or with a Scout within two tiles"],["Moves","one tile straight, two diagonal, or two forward or back"],["Ambush","it can wait in ambush and strike, with advantage, any enemy that steps beside it"],["Stacks","with one other Assassin, nothing else"],["Conjure","2d2 + 1 mana; four per deck wait in the Ether"]],"The dagger in the dark."],
 archer:["Archer (standard)","Archer",[["Bow","1d20 + 1d10 at a stack exactly two tiles away, straight or diagonal (not the tiles right beside it); a miss costs it nothing"],["Suppress","instead of a shot: the target has disadvantage on its next attack, unless it waits out 1d2 of its turns; the Archer then rests 1d2 turns"],["Defense","none"],["Stacks","alone, with a Queen, or inside an Ace, the Tree or a Wall; never with another Archer"],["Conjure","1d2 mana (1 for the Beginner); eight per deck wait in the Ether"]],"A bow and an arrow."],
 cannon:["Cannon (standard)","Cannon",[["Fire","2d20 at a stack up to three tiles away in any direction, once every 1d2 + 2 turns; a miss costs it nothing"],["Against bases","two damage to a Wall; it can't take an Ace's last heart, and the Tree takes nothing from it"],["Defense","none; it can be captured when it stands alone"],["Moves","one step"],["Stacks","alone, or inside a base, where it still fires"],["Conjure","6 mana; one per deck"]],"Slow, loud and heavy."],
 healer:["Healer (support)","Healer",[["Shield","a blue shield over its stack turns one whole blow without anyone dying, then comes back in 1d4 rounds"],["Heal","one heart back to a card in its stack or beside it (not a base); then it waits 1d2 + 2 turns, and the shield is down for 3 turns"],["Either or","while the shield is broken it can't heal"],["Fights","never; it dies last in its stack, and can be captured when it stands alone"],["Stacks","with anything but a Queen; one per stack"],["Conjure","2 + 1d3 mana; four per deck"]],"The medical cross."],
 repair:["Repairman (support)","Repairman",[["Repair","one heart back to a Wall, an Ace or the Tree in his stack or beside it; then he rests 1d3 + 1 turns, and while he rests nothing fires from that base and it can't be repaired again"],["Strengthen","the Tree at full hearts goes up one, five at most"],["Upgrade","an Ace gets one more heart, once; he gives his life for it and goes to the grave"],["Fights","never; he dies last in his stack and can be captured when he stands alone"],["Conjure","2 mana; four per deck"]],"A hammer."],
 ram:["Battering Ram (support)","Ram",[["Ram","two damage to an enemy Wall right beside it, no roll; useless against Aces and the Tree"],["Crew","needs one or two Grunts, Infantry or Puppets in its stack; with nobody to push it, it can't move or ram"],["Can't die","blows never kill it: an enemy beside a lone Ram captures it (it joins a stack of soldiers that has room) or destroys it"],["Conjure","3 mana; four per deck"]],"A log on a frame."],
 miner:["Miner (support)","Miner",[["Miner slots","every Ace has two: a Miner there brings 1d2 − 1 mana at the start of every turn, from the round after it moves in"],["Crystal","on a crystal tile it digs: 1d2 each turn, and on a 2 it takes 1 + 1d3 of the crystal's 12 mana"],["In the open","1d6 − 5: one mana on a 6"],["First to fall","when its stack takes damage, the Miner goes first; an attacker beside it with a free capture slot takes it instead, and the blow still lands"],["Moves","one step"],["Stacks","two in an Ace, one with any other stack"],["Conjure","2 mana; four per deck; the Beginner's first Ace comes with one"]],"A pickaxe."],
 wall:["Wall (base)","Wall",[["Hearts","five; the cards inside are safe until it falls, then they all die with it"],["Defense","10"],["Holds","six cards, like an Ace; only ranged cards (Archers, Cannons) fire from it, one shot a turn"],["Moves","never; it goes up on any empty tile of your two lines"],["Hard hits","charges do double damage to it; Battering Rams and Cannons two; Lightning Strike two"],["Healing","a Healer can't heal it; a Repairman can"],["Conjure","4 mana; four per deck"]],"A fort wall."]
};
function infoHTML(){
  const tabs=Object.keys(INFO).map((k,i)=>`<button class="itab ${i===0?"on":""}" data-k="${k}">${INFO[k][0]}</button>`).join("");
  const spells=SCHOOLS.map(sc=>`<h4>${sc}</h4><dl>`+SPELLS.filter(s=>s.school===sc).map(s=>`<dt>${esc(s.name)} <span>${s.id==="hypo"?"3 + 1 per extra card":s.dice?s.dice+" mana, rolled each round":s.cost?s.cost+" mana":"free"}</span></dt><dd>${esc(s.text)}</dd>`).join("")+"</dl>").join("");
  const subs=Object.entries(TRIBES).filter(([k])=>k!=="random").map(([k,t])=>`<dt>${esc(t.name)}</dt><dd>${esc(t.sub)}</dd>`).join("");
  return `<details class="cinfo basics"><summary>Basics explained</summary>
<details class="sub"><summary>What am I doing?</summary><p>You command an army of cards on a small field. Each of your turns has three phases: <b>draw</b> (roll a d4 and draw that many, or skip), <b>prep</b> (place cards from your hand on your own two lines, move each stack one step, sacrifice cards for mana, cast spells) and <b>attack</b> (each of your stacks may attack an enemy stack next to it once). A fight compares two scores: the attacker's best card plus its die against the defender's best card. The loser takes a damage, which removes its lowest card. You win when the enemy has nothing left on the field, or no deck, hand or mana at all.</p><p>Your Ace starts on your back line with a Jack inside it. Aces are bases: they can't move or attack, they hold up to six cards, and they have two hearts. When an Ace falls, everything in it falls too.</p></details>
<details class="sub"><summary>What matters on the screen?</summary><ul>
<li><b>The field.</b> Your cards are at the bottom. Click one of your stacks to see where it can go (prep) or what it can hit (attack); the highlighted tiles are your options. The little line in a card's top-right corner opens its stats; drag it onto another stack to compare them.</li>
<li><b>Your deck and mana bars.</b> The deck bar is your army in reserve; the mana bar (indigo) pays for spells. Sacrificing a card gives you its soul as mana.</li>
<li><b>The turn bar under the field.</b> It says which phase you're in and has the buttons to roll or move on.</li>
<li><b>The moon.</b> It turns once a round and changes prices and rules; hover over it to see what it means for you.</li>
<li><b>The spells</b> on the right, grouped by school. Greyed out means you can't cast it right now; hover a spell for why.</li>
<li><b>The log</b> at the bottom: every action, with its time, in the color of the player who took it.</li></ul></details>
<details class="sub"><summary>What are some good ways to play?</summary><ul>
<li><b>Bunker:</b> a King with a Queen in the same stack defends hard, and keeping Aces back gives you more Grave Blessing dice. Good while your deck is bigger than theirs.</li>
<li><b>Push:</b> stack soldiers up to the limit, surround an enemy stack with two of yours, and use Divine Odds or Hexed Odds on the fight that matters.</li>
<li><b>Starve them:</b> Forced Hand, Three of Swords and Double Edged Sword wear down the enemy's hand and deck; an empty deck, hand and soul pile loses the game.</li>
<li><b>The Joker:</b> it captures the souls of enemies dying around it; shoot it (Sacrificial Suicide) for a burst of mana.</li>
<li>Each Substance pushes one of these further: see Substances explained, and the Card info tabs for every card.</li></ul></details>
</details>
<details class="cinfo"><summary>Card info</summary><div class="itabs">${tabs}</div><div id="ibody"></div></details>
<details class="cinfo"><summary>Spells explained</summary><div class="spellinfo">${spells}<p class="dim">New Moon: Clairvoyance and Naked Hand cost 6. Full Moon: Clairvoyance costs 2, Naked Hand is free, and no necromancy is cast. Blood Moon: Full Moon prices with no Full Moon drawbacks; necromancy is allowed. The moon turns one phase per round, once every player has had a turn.</p></div></details>
<details class="cinfo"><summary>Further explanations</summary>
<details class="sub"><summary>Substances explained</summary><dl class="spellinfo">${subs}</dl><p class="dim">Only the Beginner can be played by more than one player in a game. The full rules for each are on the All Rules page.</p></details>
<details class="sub"><summary>Fog of war and stealth explained</summary><dl class="spellinfo"><dt>Fog of war</dt><dd>On by default (Rules tab). Each of your cards sees two tiles around it, a Scout three. Shaded tiles are out of sight: enemy cards there stay hidden, and the log only says that something moved out of sight.</dd><dt>Scouts</dt><dd>Never attack or defend. They uncover Assassins, ambushers and face-down cards within a round two tiles, and enemy Scouts within three. Every Ace you put down brings one from the Ether.</dd><dt>Assassins</dt><dd>Hidden from enemies unless one of their cards stands right beside it (straight, not diagonal) or a Scout is near. Two hearts; 10 + 1d12 to attack, 8 to defend. Only another Assassin stacks with one.</dd><dt>Face down</dt><dd>Tick "Place it face down" before putting a card down. Enemies see only its back. Double disadvantage to attack, advantage to defend; it turns face up once it attacks or is attacked.</dd><dt>Ambush</dt><dd>Select an Assassin or face-down stack in your prep phase and press "Set an ambush": it turns sideways, hides like an Assassin, and strikes with advantage, out of turn, at the first enemy that steps beside it (diagonals too for a Jack's reach). Moving it ends the ambush.</dd><dt>Quiet Eyes and Bird's Eye</dt><dd>Quiet Eyes (Illusion) blinds enemies without a Scout to all but what is right beside them, 2 mana a round for 1d2 + 1 rounds. Bird's Eye (Sorcery) lifts the fog for your side for a round, but not a Delusion.</dd></dl></details>
<details class="sub"><summary>Siege, support and mining explained</summary><dl class="spellinfo"><dt>Bought from the Ether</dt><dd>Archers, Cannons, Healers, Walls, Repairmen, Battering Rams and Miners all wait in the Ether, a set for every deck, and come into your deck with their Conjure spells. The Beginner starts with two Archers, a Wall, two Repairmen and a Battering Ram in the deck, and a Miner in the first Ace.</dd><dt>Shooting</dt><dd>Archers and Cannons fire from wherever they stand, inside an Ace, the Tree or a Wall too, where the rest can't fight. Select the stack in the attack phase and click a highlighted target; a miss costs the shooter nothing. Only one shot a turn leaves a base.</dd><dt>Support cards</dt><dd>Healers, Repairmen, Battering Rams and Miners never fight. In a stack they die last (Miners first). Standing alone they can't defend: an enemy beside them chooses Capture or Destroy instead of an attack. A captured card rides in the stack's capture slot (one per stack) until you set it to work beside the stack; then it is yours.</dd><dt>Heal and Repair</dt><dd>Select the stack in your prep phase and press Heal a heart or Repair. The status line under the cards shows every cooldown.</dd><dt>Crystals</dt><dd>A crystal rises in the middle of the field every 1d6 + 4 turns. A Miner on it digs 1 + 1d3 mana on a 2 of 1d2 each turn, until the crystal's 12 mana are gone.</dd><dt>Field Libation</dt><dd>Necromancy, free, not under the Full Moon: pour out cards from your field; each one is worth its mana on a 2 of 1d2, and goes to the grave for nothing on a 1.</dd></dl></details>
<details class="sub"><summary>The Bank, Barbarians and meteors explained</summary><dl class="spellinfo"><dt>The Bank</dt><dd>The gold bar under the Conjuring spells. Every mana spent on a spell goes to the Bank, and it lends only what it holds. A loan is due in 4 of your turns and grows 20% every 1d2 turns; whatever you can't turn in then becomes mana debt, and your mana shows below zero. Every soul you gain pays the debt first. Fall below −3 × your maximum and you lose.</dd><dt>Credit and selling</dt><dd>Tick Spend on credit to cast spells you can't afford. Sell cards from your hand or deck for their conjuring price. Binah can sell thralls.</dd><dt>When the Bank goes wrong</dt><dd>A broke Bank puts the Ether on sale and asks the richest player for a loan. Deep debtors are hunted by the Bank's Debt Collectors. If the Bank and everyone sink far enough, it collapses and everyone starts again with three maximum mana.</dd><dt>Barbarians</dt><dd>A crimson band takes the middle every 4 + 1d12 turns and with every Blood Moon, and fights anyone beside it. The best killer of a band gets an Ether sale; a big band can earn debt forgiveness; a band that holds the middle for 7d2 turns makes the Banker raise every price.</dd><dt>Meteor</dt><dd>One round in a hundred: damage where it lands and maybe around it, then fire for two rounds.</dd><dt>Gambling, max mana, Mystery Generation</dt><dd>Gambling (Sorcery, 1): a 10 on 1d10 wins 7d2, a 1 costs a maximum mana, 7d2 of debt and a deck card. Buy Max Mana (Conjuring, 6): +1, eighteen at most. Mystery Generation (in the Auction): 1d3 brand-new cards.</dd></dl></details>
<details class="sub"><summary>Planets explained</summary><dl class="spellinfo"><dt>The Moon · “Fate”</dt><dd>Turns one phase each round. The New Moon gives 1d2 cards from the grave and makes Clairvoyance and Naked Hand cost 6; the Full Moon takes its toll, shuffles every deck and forbids drawing and necromancy; 5% of Full Moons turn into a Blood Moon. It can be switched off before a game.</dd><dt>Saturn · “No”</dt><dd>Brought by Yaldabaoth once the moon is out of the sky: every enemy pays at the start of each turn, or a Debt Collector rises.</dd></dl><p class="dim">More planets come with the Firmament.</p></details>
</details>`;
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
function seatForm(i,S,mode,L,taken){taken=taken||new Set();
  const n=i+1,tm=L.startsWith("team"),team=tm?`<span class="sidetag s${S.team}">${S.team?"Side B":"Side A"}</span>`:"";
  let type;
  if(mode==="survival"||mode==="cpu"&&i===0)type=`<span class="dim">${mode==="cpu"?"You":"Human"}</span>`;
  else type=`<label class="f">Plays as <select data-seat="${i}" data-k="type">${(mode==="cpu"?[]:[["human","Human"]]).concat([["easy","Computer · Easy"],["medium","Computer · Medium"],["hard","Computer · Hard"]]).map(([v,t])=>`<option value="${v}" ${S.type===v?"selected":""}>${t}</option>`).join("")}</select></label>`;
  return `<fieldset class="pf seat" style="--pc:${TRIBES[S.tribe]&&TRIBES[S.tribe].color||S.color}"><legend>Player ${ORD[i]} ${team}</legend>
<div class="srow"><label class="f">Name <input data-seat="${i}" data-k="name" value="${esc(S.name)}" maxlength="20"></label>${type}</div>
<details class="look" ${S.type==="human"||tm||S.open?"open":""}><summary>${tm?"Team, Substance, color and symbol":"Substance, color and symbol"}</summary>
${tm?`<div class="f"><span>Team</span><div class="opts">${[0,1].map(t=>`<label class="opt"><input type="radio" name="tm${n}" data-seat="${i}" data-k="team" value="${t}" ${S.team===t?"checked":""}><span>${t?"Side B":"Side A"}<small>${t?"Plays against Side A.":"Plays against Side B."} Each side needs two players.</small></span></label>`).join("")}</div></div>`:""}
<div class="f"><span>Substance</span><div class="opts subs">${Object.entries(TRIBES).map(([k,t])=>{const off=t.soon||taken.has(k)&&k!==S.tribe;return `<label class="opt${off?" off":""}"><input type="radio" name="tr${n}" data-seat="${i}" data-k="tribe" value="${k}" ${k===S.tribe?"checked":""} ${off?"disabled":""}><span>${t.solid?`<i class="subsym">${solidSVG(t.solid,t.color||"#f3d6a6",18)}</i>`:""}${t.name}<small>${taken.has(k)&&k!==S.tribe?"Another player has it: only the Beginner can be played by more than one player.":t.sub}</small></span></label>`}).join("")}</div></div>
${(()=>{const T=TRIBES[S.tribe]||{};
  if(T.color)return `<p class="dim fixednote">${esc(T.name)} always plays in its own color and symbol: ${solidSVG(T.solid,T.color,20)}</p>`;
  const colors=`<div class="f"><span>Color</span><div class="opts swatches">${COLORS.map(([nm,hex])=>`<label class="sw" title="${nm}"><input type="radio" name="co${n}" data-seat="${i}" data-k="color" value="${hex}" ${hex===S.color?"checked":""}><span style="--pc:${hex}"></span><em>${nm}</em></label>`).join("")}</div></div>`;
  if(T.solid)return colors+`<p class="dim fixednote">${esc(T.name)} always bears its own symbol: ${solidSVG(T.solid,S.color,20)}</p>`;
  return colors+`<div class="f"><span>Symbol</span><div class="opts solids">${Object.entries(SOLIDS).map(([k,nm])=>`<label class="so-opt" title="${nm}"><input type="radio" name="so${n}" data-seat="${i}" data-k="solid" value="${k}" ${k===S.solid?"checked":""}><span>${solidSVG(k,"#f3d6a6",28)}<em>${nm}</em></span></label>`).join("")}</div></div>`;
})()}
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
${chk("ocrys","Crystals (default)","A crystal cluster rises in the middle of the field every 1d6 + 4 turns (Headquarters opens with one). A Miner standing on it digs out its 12 mana.",true)}
${chk("ofog","Fog of war (default)","You see enemy cards only within two tiles of your own (three for a Scout). Assassins, ambushers and Scouts stay hidden until you stand right beside them.",true)}
${chk("obarb","Barbarians (default)","Every 4 + 1d12 turns a crimson band of Grunts, Infantry or Jacks (sometimes with an Ace) takes the middle of the field and fights everyone. Whoever kills the most earns an Ether sale; a big band can earn debt forgiveness.",true)}
<label class="f">Hole in the middle <select id="ohole"><option value="0" selected>None (default)</option><option value="1">One or two tiles</option><option value="2">Doubled</option><option value="3">Tripled</option></select></label>
<p class="dim">An empty pit in the center of the field, never on the River map and never in anyone's lines; it only grows where there is room.</p>
${chk("olock","Optional Ace rule","Cards inside an Ace must match its color.",false)}
</fieldset>
<fieldset class="pf"><legend>Mana</legend>
<label class="f">Starting mana <select id="omana"><option value="3d2" selected>3d2 (default)</option><option value="1d6">1d6</option><option value="none">None</option>${[1,2,3,4,5,6].map(n=>`<option value="${n}">${n}</option>`).join("")}</select></label>
${chk("obank","The Bank opens with mana","The Bank starts with (2 × players)d2 mana to lend. Off by default: it fills up from the mana spent on spells.",false)}
${chk("oeach","Each player rolls their own","On by default with one deck; off by default otherwise, when one roll sets the same starting mana for everyone.",false)}
<p class="dim">Starting souls come from the Ether as soldier souls, worth 1 mana each.</p>
</fieldset>
<fieldset class="pf"><legend>The sky and spells</legend>
<div class="opts skyopts"><label class="opt"><input type="radio" name="omoonon" value="on" checked><span>The moon (default)<small>It turns through its eight phases, one each round.</small></span></label><label class="opt"><input type="radio" name="omoonon" value="off"><span>No moon<small>No phases, no gifts, no tolls and no Blood Moon. The Leviathan has nowhere to rise; Yaldabaoth can bring Saturn once his hunger is full.</small></span></label><label class="opt"><input type="radio" name="omoonon" value="saturn"><span>Saturn, “No”<small>Saturn hangs in the sky from the start: every player but Binah and the Firmament pays it 1 a turn (a hand card, the top deck card or 1 mana) to the Bank, or the Bank sends a Debt Collector. Yaldabaoth can't be played.</small></span></label><label class="opt"><input type="radio" name="omoonon" value="mars"><span>Mars, “Strife”<small>Mars hangs in the sky from the start: every turn, stacks of only Grunts and Infantry get advantage on their next attack on 1–5 of 1d8. The Firmament can't be played.</small></span></label><label class="opt"><input type="radio" name="omoonon" value="sun"><span>The Second Sun, “King”<small>An indigo sun from the start: no fog of war; every 2d2 turns each player pays it (to the Bank) or is blinded for a turn; the Earth Oath. The Firmament can't be played.</small></span></label><label class="opt"><input type="radio" name="omoonon" value="venus"><span>Venus, “Harmony”<small>From the start: the Oath of Venus rewards turns without attacking. The Firmament can't be played.</small></span></label><label class="opt"><input type="radio" name="omoonon" value="mercury"><span>Mercury, “Guile”<small>From the start: votes for Peace or Total War, Buy Peace, and the Oath of Mercury (Betrayal, Declare War, Bribe the Banker). The Firmament can't be played.</small></span></label><label class="opt"><input type="radio" name="omoonon" value="jupiter"><span>Jupiter, “Fortune”<small>From the start: Ace miners bring 1d2, two conjurings on sale each round, trades at the Auction, the Oath of Jupiter. The Firmament can't be played.</small></span></label></div>
${chk("omoon","Moon combat bonus","Every attack adds 1d2 at the Full Moon, and every defense adds 1d2 at the New Moon.",true)}
${chk("oatk","Spells in the attack phase","Enchantments, curses and sorcery can also be cast while attacking. Necromancy, conjuring and sacrifices stay in prep.",false)}
${chk("oblood","Eclipse mode (the Blood Moon for the moon)","With the moon: the game opens on a Blood Moon; each deck is shuffled and two thirds of it go to the grave; each player starts with a Joker in hand. With a planet in the sky: the game opens under that planet's eclipse.",false)}
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
    const blk=skyBlocked(val("omoonon"));
    $("#seats").innerHTML=seatsS.slice(0,n).map((S,i)=>seatForm(i,S,mode,L,new Set([...blk,...seatsS.slice(0,n).filter((Q,j)=>j!==i&&Q.tribe!=="random"&&Q.tribe!=="beginner").map(Q=>Q.tribe)]))).join("");
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
  document.querySelectorAll('input[name=omap]').forEach(i=>i.addEventListener("change",mapUp));
  document.querySelectorAll('input[name=omoonon]').forEach(i=>i.addEventListener("change",()=>{for(const S of seatsS)if(skyBlocked(val("omoonon")).includes(S.tribe))S.tribe="random";drawSeats()}));drawSeats();
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
    const blk=skyBlocked(val("omoonon")),bad=players.find(p=>blk.includes(p.tribe));if(bad){flash(`${TRIBES[bad.tribe].name} can't be played with that planet in the sky.`);return}
    for(const t of Object.keys(TRIBES))if(t!=="random"&&t!=="beginner"&&players.filter(p=>p.tribe===t).length>1){flash(`Only one player can be ${TRIBES[t].name}. The Beginner is the only Substance more than one player can share.`);return}
    if(new Set(players.filter(p=>!TRIBES[p.tribe].color).map(p=>p.color)).size<players.filter(p=>!TRIBES[p.tribe].color).length){flash("Every player needs a different color.");return}
    if(L.startsWith("team")){ // seats alternate sides: A, B, A, B
      const A=players.filter((p,i)=>!seatsS[i].team),B=players.filter((p,i)=>seatsS[i].team);
      if(A.length!==2){flash("Each side needs two players.");return}
      players=[A[0],B[0],A[1],B[1]];
    }
    if(mode==="survival")players.push({name:"The Horde",color:HORDE_COLOR,solid:pick(Object.keys(SOLIDS).filter(s=>!players.some(p=>p.solid===s)))||"dodeca",cpu:"horde"});
    PREF.hand=val("dhand")||PREF.hand;PREF.sel=val("dsel")||PREF.sel;PREF.ctl=val("dctl")||PREF.ctl;PREF.theme=val("dtheme")??PREF.theme;PREF.coords=val("dcoord")==="1";PREF.full=val("dfull")==="1";savePrefs();applyPrefs();
    startGame({mode,players,mid:mode==="survival"||!!($("#omid")&&$("#omid").checked),aceLock:$("#olock").checked,fog:$("#ofog").checked,crystals:$("#ocrys").checked,barbarians:$("#obarb").checked,hole:+$("#ohole").value,bankStart:$("#obank").checked,bloodStart:$("#oblood").checked&&(val("omoonon")||"on")==="on",eclipseStart:$("#oblood").checked&&!["on","off","saturn"].includes(val("omoonon")||"on"),
      map:val("omap"),cols:L==="duel"?+val("ocols"):$("#ocols2")?+$("#ocols2").value:undefined,rows:$("#orows2")?+$("#orows2").value:undefined,size:$("#osize")?+$("#osize").value:undefined,corners:$("#ocorners").checked,bridge:val("obridge"),hq:!!($("#ohq")&&$("#ohq").checked),
      decks:+val("odecks"),specials:val("ospecials"),jokerSure:$("#ojoker").checked,suits:+val("odecks")===1&&val("osuitmode")==="choose"?[$("#osuitR").value,$("#osuitB").value]:null,
      startMana:$("#omana").value,manaEach:$("#oeach").checked,moonBonus:$("#omoon").checked,moon:val("omoonon")||"on",atkSpells:$("#oatk").checked,
      layout:L,turns:$("#oturns").value,timer:+$("#otimer").value,cpuSpeed:$("#ospeed").value,elimDark:val("oelim")==="dark",ffaDeck:val("offa"),shareDeck:$("#oshare").checked});
  };
}
function startGame(opts){
  ovHide();newGame(opts);applyMoonTheme();render();
  opening().catch(e=>{console.error(e);log("Error: "+esc(e.message))});
}
document.addEventListener("DOMContentLoaded",()=>{
  mountInfo();mountBar();applyPrefs();guardLinks();mountQuotes();showStart();
  $("#moon").addEventListener("click",()=>{if(G&&canAct()&&G.phase==="attack"&&G.sel&&moonAttackable(selStack())){attackMoon(G.sel.r,G.sel.c);G.mode=null;if(G.sel&&!G.board[G.sel.r][G.sel.c])G.sel=null;render()}});
  if($("#menubtn"))$("#menubtn").onclick=()=>{if(G&&!G.over)openMenu();else flash("Start a game first.")};
  $("#newgame").onclick=()=>confirmLeave(()=>{startMode=null;showStart()});
});
window.__EC={get G(){return G},startGame,stackLegal,canPlace,nextPhase,render,AI,SP,cast,SPELLS,hordeSpawn,roman,moonSVG,
  force(o){G.forceMoon=o},jokerSuicide,mk,damage,mkUnit,attack,attackOptions,doMove,seesTile,fogTile,ambushCheck,siegeTurn,siegeEnd,spawnCrystal,spawnBarbarians,meteor,collapse,takeLoan,repay,bankTurn,econRound,effMana:p=>effMana(p),spend,openBank,mysteryGen,skyTurn,firmFog,setPlanet,sunFall,planetTurn,skyAsync,tradeCard,eclipse:k=>eclipse(k),startPeace:(a,b)=>startPeace(a,b),startWar:(a,b)=>startWar(a,b)};

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
  h.classList.toggle("mirage",!!(G&&G.eclipse&&G.eclipse.k==="sun"&&!G.over));   // the suns aligned: a mirage over the page
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
  // the hole in the middle (off by default; never with the river): one or two tiles each way, doubled or tripled where there's room
  const hole=+o.hole||0;
  if(hole&&theme!=="river"&&o.mode!=="survival"){
    const inZone=new Set(seats.flatMap(S=>S.zone.map(t=>t.join())));
    const rs=rows%2?[(rows-1)/2]:[rows/2-1,rows/2],cs=cols%2?[(cols-1)/2]:[cols/2-1,cols/2],g=hole-1;
    for(let r=rs[0]-g;r<=rs[rs.length-1]+g;r++)for(let c=cs[0]-g;c<=cs[cs.length-1]+g;c++){
      if(r<0||c<1||r>=rows||c>=cols-1||inZone.has(r+","+c))continue;   // never in anyone's lines, and the outer columns stay open
      if(hole===2&&!rs.includes(r)&&!cs.includes(c))continue;   // doubled: a cross; tripled: the full square
      V[r][c]=true}
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
  const taken=new Set(skyBlocked(opts.moon));   // a planet in the sky from the start keeps out the Substance it would serve
  // every Substance but the Beginner is played by one player at most
  for(const p of opts.players)if(p.tribe&&TRIBES[p.tribe]&&p.tribe!=="random"&&p.tribe!=="beginner"&&!TRIBES[p.tribe].soon)taken.add(p.tribe);
  for(const p of opts.players){
    if(p.cpu==="horde")continue;
    if(!p.tribe||!TRIBES[p.tribe]||p.tribe==="random"||TRIBES[p.tribe].soon){
      const pool=PLAYABLE.filter(k=>k==="beginner"||!taken.has(k));
      p.tribe=pick(pool);p.randomSub=true;if(p.tribe!=="beginner")taken.add(p.tribe);
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
    if(P.tribe==="tiph")for(let i=0;i<3;i++)P.deck.push(mkUnit("trafficker",pl));
    if(P.tribe==="leviathan")P.deck.push(mkUnit("leviathan",pl));
    if(P.tribe==="yald")P.hunger=0;
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
  if(P.tribe==="firm"&&!G.moon.gone){const j=G.ether.findIndex(x=>x.unit==="miner");const m=j>=0?G.ether.splice(j,1)[0]:mkUnit("miner",pl);m.owner=pl;G.moonMiner={owner:pl,card:m};log(`${plName(pl)}'s Miner climbs onto the moon.`)}
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
  round2();
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
  const P=G.p[pl];turn2(pl);siegeTurn(pl);bankTurn(pl);skyTurn(pl);planetTurn(pl);
  if(P.shield){P.shield=false;log(`${plName(pl)}'s Please Don't Hurt Me wears off.`)}
  if(P.tribe==="jester"&&treeOf(pl)){
    let got=0;for(let i=0;i<2&&mana(pl)<soulCap(pl);i++){const j=G.ether.findIndex(c=>/^\d+$/.test(c.rank));const c=j>=0?G.ether.splice(j,1)[0]:mk(String(2+Math.floor(Math.random()*9)),pick(["S","H","D","C"]));addSoul(pl,c);got++}
    if(got)log(`The Tree of Neither Life Or Death gives ${plName(pl)} ${got} mana.`);
  }
}
/* the end of a player's own turn */
function substanceEnd(pl){
  end2(pl);siegeEnd(pl);
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
  if(u==="bullgoat"){toGrave(card,"death");return true}   // it comes back into the deck as the Goatbull
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
 {id:"bolt",tribe:"angel",name:"Lightning Strike",cost:0,school:"Sorcery",text:"Free, with three bolts. Select an enemy stack: lightning immobilizes it for 1d2 + 1d2 − 1 of its turns, so it can't move or attack. Against the Leviathan it rolls nothing and simply takes one heart; with nothing selected it strikes a Leviathan on the moon. You earn a bolt for every card you lose while defending against an enemy's attack, and for every card Antony kills.",
  ok:()=>(me().bolts||0)>=3&&(selEnemy()&&!shielded(selStack().owner)||!selStack()&&!!G.moonLev&&isEnemy(G.moonLev.owner,G.active)),run:async()=>{
   if(await lightningLeviathan())return;
   const st=selStack(),d=rollN(2,2),n=sum(d)-1;st.stun=Math.max(st.stun||0,n);me().bolts=0;
   if(hasK(st,"wall")){const{r,c}=G.sel;wallHit(r,c,2,"Lightning");if(!G.board[r][c])return}
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
  await aiSubstance2(pl,W,cast1,foes,mine,near);
  await aiFog(pl,W,cast1);
  await aiSiege(pl,W,cast1);
  await aiBank(pl,W,cast1);
  await aiPlanets(pl,W,cast1);
  await aiMercury(pl,W,cast1);
  await aiSky(pl,W,cast1);
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

/* ---------------- Substances, second part: Lucifer & Ouroboros, The Leviathan, Yaldabaoth, Tiphareth of Kether ---------------- */

/* ---------- the moon when it is eaten, replaced by Saturn, or carries the Leviathan ---------- */
const moonName=()=>G.moon.gone==="saturn"?"Saturn":G.moon.gone==="mars"?"Mars":PLANETS[G.moon.gone]?PLANETS[G.moon.gone].name:G.moon.gone==="fallen"?"Empty sky":G.moon.gone?"No moon":MOON[G.moon.i];
const saturnOwner=()=>G.saturnBy==null?"the Bank":esc(G.p[G.saturnBy].name);
function moonNote(){
  const m=G.moon,L=G.moonLev;
  if(PNOTE[m.gone])return PNOTE[m.gone]();
  if(m.gone==="mars")return `Mars hangs where the moon was: each turn, a stack of only Grunts and Infantry gets advantage on its next attack on 1–5 of 1d8${L?"; the Leviathan coils on it":""}`;
  if(m.gone==="saturn")return `Saturn hangs where the moon was: every ${G.saturnBy==null?"player":"enemy of "+saturnOwner()} pays ${1+(G.saturnDebt||0)} at the start of each turn (Binah is exempt)`;
  if(m.gone==="eaten")return "Yaldabaoth ate the moon: the phases have stopped";
  if(m.gone==="off")return "The moon is off for this game";
  if(L)return `The Leviathan (${L.card.hp} heart${L.card.hp===1?"":"s"}) lies on the moon: a toll at every New Moon; attackable only at the New Moon`;
  return "";
}
function goneMoonSVG(){
  if(G.moon.gone==="mars")return marsSVG();
  if(planetSVG(G.moon.gone))return planetSVG(G.moon.gone);
  if(G.moon.gone==="saturn")return `<svg class="moon saturn" viewBox="-44 -44 88 88" width="88" height="88" aria-hidden="true"><defs><radialGradient id="sat" cx="40%" cy="35%"><stop offset="0" stop-color="#e8d29a"/><stop offset="1" stop-color="#7a5c2a"/></radialGradient></defs><ellipse rx="40" ry="9" fill="none" stroke="#c9a96a" stroke-width="2.4" transform="rotate(-18)" opacity=".55"/><circle r="22" fill="url(#sat)" stroke="#3a2a12"/><path d="M-36,4A40,9 0 0 0 36,-4" transform="rotate(-18)" fill="none" stroke="#e6cf96" stroke-width="2.4"/><path d="M-16,-6H16M-20,3H20" stroke="#5a4320" stroke-width="1.4" opacity=".5"/></svg>`;
  return `<svg class="moon eaten" viewBox="-44 -44 88 88" width="88" height="88" aria-hidden="true"><circle r="30" fill="none" stroke="#5a4a3a" stroke-width="1" stroke-dasharray="3 4"/><path d="M-9,-6C-4,-12 4,-12 9,-6" fill="none" stroke="#5a4a3a" stroke-width="1"/></svg>`;
}
function levOnMoon(){const c=G.moonLev.card;return `<g transform="translate(-15,-15) scale(1.25)">${`<g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="#000" stroke-width="3.6">${UNIT_ICON.leviathan}</g><g stroke="${G.p[G.moonLev.owner].color}" stroke-width="1.8">${UNIT_ICON.leviathan}</g></g>`}</g><text y="38" text-anchor="middle" font-size="9" fill="#ff5a64" font-family="Cascadia Code,Consolas,monospace">${"♥".repeat(c.hp)}</text>`}

/* ---------- Delusions: blindness beyond your own cards' reach ---------- */
const deluded=pl=>!!(G.p[pl]&&G.p[pl].delu&&G.p[pl].delu.turns>0);
const blindFor=V=>V!=null&&G.p[V]&&[V,...alliesOf(V)].some(deluded);      // the deluded player and their teammates
function deluSees(V,r,c){   // the Delusion's own rule: only what your cards can reach
  if(!blindFor(V))return true;
  for(const {r:a,c:b} of stacksOf(V)){const dr=Math.abs(a-r),dc=Math.abs(b-c);if(dr<=1&&dc<=1||dr===0&&dc===2||dc===0&&dr===2)return true}
  return false;
}
const hiddenFrom=(V,r,c)=>{const st=G.board[r][c];return !!(st&&isEnemy(st.owner,V)&&!seesTile(V,r,c))};
function applyDelusion(t,by){
  const d=rollN(2,2),n=sum(d);G.p[t].delu={turns:n,maxCut:0,diceCut:0,by};
  tray(by,by===t?"Delusion of Ouroboros":"Delusion of Lucifer",d,`${n} turns`);
  return n;
}

/* ---------- start, end and round hooks ---------- */
function turn2(pl){
  const P=G.p[pl];
  if(P.joy){P.joy=false;log(`${plName(pl)}'s Pleasure and Joy fades.`)}
  if(P.theft){P.theft=false;log(`${plName(pl)}'s Joyful Theft fades.`)}
  turn3(pl);
  P.hungerUses=0;
  if(deluded(pl)){   // a Delusion pays: free mana every turn
    const k=Math.max(0,3-(P.delu.diceCut||0)),d=rollN(k,2);let got=0;
    for(let i=0;i<sum(d)&&mana(pl)<soulCap(pl);i++){const j=G.ether.findIndex(c=>/^\d+$/.test(c.rank));const c=j>=0?G.ether.splice(j,1)[0]:mk(String(2+Math.floor(Math.random()*9)),pick(["S","H","D","C"]));addSoul(pl,c);got++}
    if(k)tray(pl,"Delusion mana",d,`+${got} mana`,true);
    log(`${plName(pl)}'s Delusion gives ${k}d2 free mana: ${got}.`);
  }
}
function end2(pl){
  end3(pl);
  const P=G.p[pl];if(!deluded(pl))return;
  P.delu.turns--;
  if(P.delu.turns>0)return;
  if(P.delu.blindfold&&!P.delu.extended){P.delu={turns:3,maxCut:0,diceCut:0,by:pl,extended:true};log(`<b>The Blindfold</b>: ${plName(pl)} keeps the Delusion three more turns, and Lucifer's stifling is gone.`,"event");notify(pl,`${esc(P.name)} keeps the Delusion three more turns under the Blindfold.`);return}
  P.delu=null;log(`${plName(pl)}'s Delusion lifts: the field is visible again.`);
}
async function turnAsync(pl){   // the start of a turn that may ask something: Saturn's tax, the Second Sun's judgement
  await skyAsync(pl);if(G.over)return;
  const S=G.saturnBy,P=G.p[pl];
  if(G.moon.gone!=="saturn"||S!=null&&(G.p[S].out||!isEnemy(pl,S))||isHorde(pl)||P.out)return;
  if(P.tribe==="firm"){log(`${plName(pl)} ignores Saturn's tax: the Firmament stands above it.`);return}
  if(P.tribe==="binah"){log(`${plName(pl)} ignores Saturn's tax: Binah owes the Demiurge nothing.`);return}
  const n=1+(G.saturnDebt||0);let paid=0;
  for(let i=0;i<n;i++){
    const opts=[];
    if(P.hand.length)opts.push({id:"hand",label:"A random card from your hand"});
    if(P.deck.length)opts.push({id:"deck",label:"The top card of your deck"});
    if(mana(pl)>=1)opts.push({id:"mana",label:"1 mana"});
    opts.push({id:"no",label:"Refuse",sub:S==null?"The Bank sends a Debt Collector after you.":"Yaldabaoth regurgitates a Debt Collector onto the field."});
    const ch=opts.length===1?"no":await ask(pl,{kind:"choice",id:"saturn",title:`Saturn: ${esc(P.name)} owes ${n-i} more`,options:opts,
      ai:()=>P.deck.length>8?"deck":mana(pl)>=2?"mana":P.hand.length?"hand":P.deck.length?"deck":"no"});
    if(ch==="no"||ch==null){spawnDebt(pl);break}
    let c=null;
    if(ch==="hand")c=P.hand.splice(Math.floor(Math.random()*P.hand.length),1)[0];
    if(ch==="deck")c=P.deck.pop();
    if(ch==="mana"){P.souls.sort((a,b)=>soulOf(a)-soulOf(b));c=P.souls.shift()}
    if(c){if(S==null){bankAdd(soulOf(c));toGrave(c,"spent")}else if(!(c.unit&&c.unit!=="slave")&&addSoul(S,c));else toGrave(c,"spent");paid++}
  }
  if(paid)log(`${plName(pl)} pays Saturn ${paid} (to ${S==null?"the Bank":plName(S)+"'s soul pile"}).`);
  render();
}
function spawnDebt(pl){
  const S=G.saturnBy;
  if(S==null){const B=npcIx("bank");   // Saturn with no master: the Bank sends a collector after the one who refused
    if(B<0){addDebt(pl,1);log(`${plName(pl)} refuses Saturn: 1 mana of debt to the Bank.`);return}
    const ts=stacksOf(pl),free=[];for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++)if(!G.board[r][c]&&!isVoid(r,c))free.push([r,c,ts.length?Math.min(...ts.map(x=>Math.abs(x.r-r)+Math.abs(x.c-c))):0]);
    free.sort((a,b)=>a[2]-b[2]);const t=free.find(x=>x[2]>=2)||free[0];if(!t)return;
    G.board[t[0]][t[1]]={owner:B,cards:[mkUnit("debt",B)],moved:true,attacked:true,hunt:pl};
    log(`<b>Saturn</b>: ${plName(pl)} refuses, and the Bank sends a Debt Collector after them from ${coord(t[0],t[1])}.`,"event");return}let t=zoneTiles(S).filter(([r,c])=>!G.board[r][c]);
  if(!t.length)for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++)if(!G.board[r][c]&&!isVoid(r,c))t.push([r,c]);
  if(!t.length){log("Saturn finds no room for a Debt Collector.");return}
  const [r,c]=pick(t);G.board[r][c]={owner:S,cards:[mkUnit("debt",S)],moved:true,attacked:true};
  log(`<b>Saturn</b>: ${plName(pl)} refuses, and ${plName(S)} regurgitates a Debt Collector on ${coord(r,c)}.`,"event");
  notify(S,`${esc(G.p[pl].name)} refuses Saturn: a Debt Collector rises on ${coord(r,c)}.`);
}
function round2(){
  quietRound();fullMoonScout();
  // Deconjured takes the next Full Moon
  if(G.noConjure&&G.moon.i!==4)G.noConjure=false;
  if(G.deconjure&&G.moon.i===4){G.deconjure=false;G.noConjure=true;log("<b>Deconjured</b>: no one can conjure under this Full Moon.","event")}
  // every Debt Collector still standing raises Saturn's price
  if(G.moon.gone==="saturn"){const n=G.board.flat().filter(s=>s&&hasK(s,"debt")).length;if(n){G.saturnDebt=(G.saturnDebt||0)+n;log(`Saturn's price rises by ${n}: each enemy now pays ${1+G.saturnDebt} a turn.`)}}
  // the Leviathan's toll at every New Moon
  const L=G.moonLev;
  if(L&&levNew()&&G.moon.round>L.since){
    for(const pl of enemiesOf(L.owner)){const P=G.p[pl];if(isHorde(pl)||P.tribe==="tiph"||P.tribe==="firm"){if(!isHorde(pl))log(`${plName(pl)} is immune to the Leviathan on the moon.`);continue}
      const k=R(4)+R(4);let a=0,b=0,m=0;
      for(let i=0;i<k&&P.deck.length;i++){toDark(P.deck.splice(Math.floor(Math.random()*P.deck.length),1)[0]);a++}
      for(let i=0;i<2&&P.hand.length;i++){toDark(P.hand.splice(Math.floor(Math.random()*P.hand.length),1)[0]);b++}
      if(P.souls.length){P.souls.sort((x,y)=>soulOf(x)-soulOf(y));toDark(P.souls.shift());m=1}
      log(`<b>The Leviathan's toll</b>: ${plName(pl)} loses ${a} deck card${a===1?"":"s"}, ${b} from the hand and ${m} mana to the Outer Darkness.`,"event");
    }
    notify(L.owner,"The New Moon: the Leviathan takes its toll.");
  }
}

/* ---------- where the dead go: Traffickers, Pleasure and Joy, the Leviathan's kills ---------- */
function buryHook(card,r,c,st){
  const owner=st.owner,F=G.fight;
  if(card.unit==="trafficker"&&card.prisoners&&card.prisoners.length){const ps=card.prisoners;card.prisoners=[];for(const p of ps)toGrave(p,"death");log(`The Trafficker's ${ps.length} prisoner${ps.length>1?"s go":" goes"} free into the grave.`)}
  // a Trafficker beside the dead chains its soul
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const s=at(r+dr,c+dc);if(!s||!isEnemy(s.owner,owner)||G.p[s.owner].tribe!=="tiph")continue;
    const t=s.cards.find(x=>x.unit==="trafficker"&&(x.prisoners||[]).length<3);if(!t)continue;
    if(card.unit==="slave")delete card.unit;
    (t.prisoners=t.prisoners||[]).push(card);card.owner=s.owner;
    log(`${plName(s.owner)}'s Trafficker chains ${esc(nameOf(card))} (${t.prisoners.length}/3).`);return true}
  // Pleasure and Joy: the caster's dead go back into the deck
  if(G.p[owner]&&G.p[owner].joy){if(card.unit==="slave")delete card.unit;card.owner=owner;G.p[owner].deck.push(card);shuffle(G.p[owner].deck);log(`Pleasure and Joy: ${esc(nameOf(card))} goes back into ${plName(owner)}'s deck.`);return true}
  // whatever the Leviathan kills falls into the Outer Darkness
  if(F&&(F.moon||(st===F.D?hasK(F.A,"leviathan"):st===F.A?hasK(F.D,"leviathan"):false))&&card.unit!=="leviathan"){if(card.unit==="slave")delete card.unit;toDark(card);log(`The Leviathan sends ${esc(nameOf(card))} into the Outer Darkness.`);return true}
  if(card.unit==="leviathan"){toDark(card);log("<b>The Leviathan falls into the Outer Darkness.</b>","event");notify(owner,"The Leviathan falls into the Outer Darkness.");return true}
  return false;
}
async function lightningLeviathan(){
  const st=selStack();let c=null,onMoon=false;
  if(st&&hasK(st,"leviathan"))c=st.cards.find(x=>x.unit==="leviathan");
  else if(!st&&G.moonLev){c=G.moonLev.card;onMoon=true}
  if(!c)return false;
  me().bolts=0;SND.zap();c.hp--;
  log(`<b>Lightning Strike</b>: the bolt needs no roll against the Leviathan; it loses a heart (${Math.max(0,c.hp)} left).`,"event");
  if(c.hp<=0){
    if(onMoon){const o=G.moonLev.owner;G.moonLev=null;toDark(c);log("<b>The Leviathan falls from the moon into the Outer Darkness.</b>","event");notify(o,"The Leviathan falls from the moon.")}
    else{const r=G.sel.r,cc=G.sel.c;st.cards.splice(st.cards.indexOf(c),1);if(!st.cards.length)G.board[r][cc]=null;c.hp=c.maxHp;toDark(c);checkWin()}
    popup("The Leviathan is struck down","<p>Twelve times did the lightning strike twelve at once, with one hundred and forty-four wounds, plus the lightning that cut his tongue into two permanent halves, even down to his throat.</p>",G.active);
  }
  return true;
}

/* ---------- the Leviathan on the moon can be attacked at the New Moon ---------- */
const moonAttackable=st=>!!(G.moonLev&&levNew()&&st&&canAttackFrom(st)&&isEnemy(st.owner,G.moonLev.owner));
function attackMoon(r,c){
  const A=G.board[r][c],L=G.moonLev,D={owner:L.owner,cards:[L.card]};
  const ra=rollStack(A,"atk",D,hasK(A,"satan")?null:netFx(A.odds,hated(A)?"dis":null),weaponOf(A)),rd=rollStack(D,"def",A,"adv");
  A.attacked=true;A.odds=null;G.lastAttack=G.turnNo;
  const line=`${ra.total}${cmpSign(ra.total,rd.total)}${rd.total}`;
  tray(A.owner,"Attack on the moon",ra.dice,line);tray(L.owner,"The Leviathan defends",rd.dice,line,true);
  log(`<b>${plName(A.owner)}</b> attacks the Leviathan on the moon from ${coord(r,c)}: <span class="dice">${ra.parts.join(", ")}</span> = <b>${ra.total}</b> vs <span class="dice">${rd.parts.join(", ")}</span> = <b>${rd.total}</b> <span class="tot">(${line})</span>.`,"combat");
  if(ra.total>rd.total){L.card.hp--;log(`The Leviathan loses a heart (${L.card.hp} left).`);
    if(L.card.hp<=0){G.moonLev=null;L.card.hp=L.card.maxHp;toDark(L.card);log("<b>The Leviathan falls from the moon into the Outer Darkness.</b>","event");notify(A.owner,"The Leviathan falls from the moon.")}}
  else{G.fight={A,D,atkPl:A.owner,defPl:L.owner,moon:true};damage(r,c,1,false);G.fight=null}
  render();
}

/* ---------- the Auction ---------- */
function viewAuction(){
  const V=view(),live=canAct()&&G.phase==="prep";
  const items=G.auction||[];
  ovShow(`<div class="ovbox"><h2>The Auction</h2><p class="dim">Tiphareth of Kether sells the souls its Traffickers chained. Offer mana or cards from your hand; the seller has to approve.</p>
<div class="auct">${items.length?items.map((it,i)=>`<div class="aitem">${face(it.card,{owner:it.seller})}<div><b>${esc(nameOf(it.card))}</b><br><span class="dim">sold by ${plName(it.seller)}</span>${live&&it.seller!==V?`<br><button class="btn ghost sm" data-buy="${i}">Make an offer</button>`:""}</div></div>`).join(""):'<p class="dim">Nothing is for sale.</p>'}</div>
${mysteryHTML(live)}${planetUp("jupiter")&&live?`<p><button class="btn ghost sm" id="tradeBtn">Trade a card from your hand</button> <small class="dim">Jupiter is up: offer one of your cards for one of another player's.</small></p>`:""}<p><button class="btn ghost" id="mcancel">Close</button></p></div>`);
  $("#mcancel").onclick=ovHide;wireMystery();if($("#tradeBtn"))$("#tradeBtn").onclick=async()=>{ovHide();G.busy=true;try{await tradeCard(G.active)}finally{G.busy=false}render()};
  $("#ov").querySelectorAll("[data-buy]").forEach(b=>b.onclick=()=>{ovHide();makeOffer(G.auction[+b.dataset.buy])});
}
async function makeOffer(it,auto){
  const pl=G.active,P=me();if(!it||!G.auction.includes(it))return false;
  const was=G.busy;G.busy=true;
  try{
    let pay=null;
    if(auto)pay=auto;
    else{
      const opts=[];for(let k=1;k<=Math.min(mana(pl),6);k++)opts.push({id:"m"+k,label:`${k} mana`});
      if(P.hand.length)opts.push({id:"cards",label:"Cards from my hand"});
      const ch=await ask(pl,{kind:"choice",title:`Offer for ${esc(nameOf(it.card))}`,options:opts,cancel:"Cancel"});
      if(ch==null)return false;
      if(ch==="cards"){const cs=[];for(let i=0;i<3&&P.hand.length;i++){const k=await ask(pl,{kind:"cards",id:"offer",title:`Offer: add a card (${cs.length} so far)`,cards:P.hand.filter(c=>!cs.includes(c)),cancel:cs.length?"That's my offer":"Cancel"});if(k==null)break;cs.push(P.hand.filter(c=>!cs.includes(c))[k])}
        if(!cs.length)return false;pay={cards:cs}}
      else pay={mana:+ch.slice(1)};
    }
    const what=pay.mana?`${pay.mana} mana`:pay.cards.map(c=>esc(nameOf(c))).join(", ");
    const worth=pay.mana||pay.cards.reduce((a,c)=>a+soulOf(c),0),need=soulOf(it.card)+(it.card.unit?2:0);
    const ok=await ask(it.seller,{kind:"yesno",id:"auction",title:`The Auction: ${esc(G.p[pl].name)}'s offer`,text:`${plName(pl)} offers <b>${what}</b> for ${esc(nameOf(it.card))}. Approve the sale?`,yes:"Approve",no:"Refuse",ai:()=>worth>=need});
    if(!ok){log(`The Auction: ${plName(it.seller)} refuses ${plName(pl)}'s offer of ${what}.`);notify(it.seller,`${esc(G.p[it.seller].name)} refuses the offer.`);return false}
    const S=G.p[it.seller];
    if(pay.mana){let moved=0;P.souls.sort((a,b)=>soulOf(a)-soulOf(b));while(moved<pay.mana&&P.souls.length){const c=P.souls.shift();moved+=soulOf(c);if(!addSoul(it.seller,c))toGrave(c,"spent")}}
    else for(const c of pay.cards){P.hand.splice(P.hand.indexOf(c),1);c.owner=it.seller;if(S.hand.length<handCap(it.seller))S.hand.push(c);else if(!addSoul(it.seller,c))toGrave(c,"spent")}
    G.auction.splice(G.auction.indexOf(it),1);
    const c=it.card;c.owner=pl;if(c.hp!=null)c.hp=c.maxHp;if(P.hand.length<handCap(pl))P.hand.push(c);else{P.deck.push(c);shuffle(P.deck)}
    log(`<b>The Auction</b>: ${plName(pl)} buys ${esc(nameOf(c))} from ${plName(it.seller)} for ${what}.`,"event");notify(pl,`${esc(P.name)} buys ${esc(nameOf(c))} at the Auction.`);
    return true;
  }finally{G.busy=was;render()}
}

/* ---------- God Hunger ---------- */
async function godHunger(){
  const pl=G.active,P=me(),st=selStack();
  const opts=[];
  if(G.grave.length)opts.push({id:"grave",label:"The grave"});
  if(P.deck.length)opts.push({id:"own",label:"Your own deck"});
  if(st&&st.cards.some(c=>!(c.unit&&UNIT[c.unit].hp)&&!isBase(c)))opts.push({id:"field",label:`The selected stack on ${coord(G.sel.r,G.sel.c)}`});
  for(const e of enemiesOf(pl).filter(e=>!isHorde(e)&&G.p[e].deck.length))opts.push({id:"p"+e,label:`${G.p[e].name}'s deck`,sub:"They roll 1d4 against your 1d4; lose and you pay them 2 mana."});
  if(!opts.length){log("God Hunger finds nothing to eat.");return}
  const src=await ask(pl,{kind:"choice",id:"hunger",title:"God Hunger: what does Yaldabaoth eat?",options:opts,
    ai:()=>(opts.find(o=>o.id==="grave"&&G.grave.length>=2)||opts.find(o=>o.id==="field")||opts.find(o=>o.id[0]==="p")||opts[0]).id});
  const n=R(2);let eaten=[];
  if(src==="grave")for(let i=0;i<n&&G.grave.length;i++)eaten.push(G.grave.splice(Math.floor(Math.random()*G.grave.length),1)[0]);
  else if(src==="own")for(let i=0;i<n&&P.deck.length;i++)eaten.push(P.deck.pop());
  else if(src==="field"){const s=G.sel;for(let i=0;i<n;i++){const ok=st.cards.filter(c=>!(c.unit&&UNIT[c.unit].hp)&&!isBase(c)).sort((a,b)=>nat(a)-nat(b));if(!ok.length)break;const c=ok[0];st.cards.splice(st.cards.indexOf(c),1);if(c.captured&&c.captured.length){for(const x of c.captured)toGrave(x,"death");c.captured=[]}eaten.push(c)}
    if(!st.cards.length){G.board[s.r][s.c]=null;G.sel=null}}
  else if(src&&src[0]==="p"){
    const t=+src.slice(1),a=R(4),b=R(4);tray(pl,"God Hunger",[{s:4,v:a}],`${a} vs ${b}`);tray(t,"God Hunger defense",[{s:4,v:b}],`${b} vs ${a}`,true);
    if(a<=b){let moved=0;P.souls.sort((x,y)=>soulOf(x)-soulOf(y));while(moved<2&&P.souls.length){const c=P.souls.shift();moved+=soulOf(c);if(!addSoul(t,c))toGrave(c,"spent")}
      log(`<b>God Hunger fails</b>: ${plName(pl)} rolls ${a} against ${plName(t)}'s ${b} and loses 2 mana to them.`,"event");
      popup("God Hunger fails",`<p>${plName(pl)} could not eat ${plName(t)}'s deck: ${a} against ${b}. Yaldabaoth loses two mana from the failure, and ${plName(t)} gains two.</p>`,pl);render();return}
    for(let i=0;i<n&&G.p[t].deck.length;i++)eaten.push(G.p[t].deck.pop());
  }
  if(!eaten.length){log("God Hunger finds nothing to eat.");return}
  const room=soulCap(pl)-mana(pl),m=eaten.reduce((a,c)=>a+soulOf(c),0);
  const use=await ask(pl,{kind:"choice",id:"hungeruse",title:`God Hunger: ${eaten.length} card${eaten.length>1?"s":""} eaten`,options:[{id:"hunger",label:`Feed the hunger (${(P.hunger||0)+eaten.length} of 7)`},{id:"mana",label:`Take the mana (+${Math.min(m,room)})`}],
    ai:()=>(P.hunger||0)<7&&mana(pl)>=2?"hunger":"mana"});
  if(use==="mana"){for(const c of eaten){if(c.unit&&c.unit!=="slave"){toDark(c);continue}if(!addSoul(pl,c))toGrave(c,"spent")}log(`<b>God Hunger</b>: ${plName(pl)} eats ${eaten.map(c=>esc(nameOf(c))).join(", ")} for mana.`,"event")}
  else{for(const c of eaten)toDark(c);P.hunger=(P.hunger||0)+eaten.length;log(`<b>God Hunger</b>: ${plName(pl)} eats ${eaten.map(c=>esc(nameOf(c))).join(", ")} (hunger ${P.hunger} of 7).`,"event")}
  checkWin();
}

/* ---------- the spells ---------- */
SPELLS.push(
 {id:"ouro",tribe:"lucifer",dice:"1d2",name:"Delusion of Ouroboros",cost:1,school:"Illusion",text:"Cast on yourself. For 2d2 of your turns you and your teammates cannot see enemy cards beyond your own cards' reach; meanwhile your mana can go up to nine and you get 3d2 free mana at the start of each turn. Casting it makes the Delusion of Lucifer free this round.",
  ok:()=>!deluded(G.active),run:async()=>{const n=applyDelusion(G.active,G.active);me().ouroRound=G.moon.round;
   log(`<b>Delusion of Ouroboros</b>: ${plName(G.active)} blinds themselves for ${n} turns; nine mana at most and 3d2 free mana a turn.`,"event");notify(G.active,`${esc(me().name)} sinks into the Delusion of Ouroboros for ${n} turns.`)}},
 {id:"lucifer",tribe:"lucifer",name:"Delusion of Lucifer",cost:6,school:"Illusion",text:"6 mana, free in a round you cast the Delusion of Ouroboros on yourself. An enemy gets the same Delusion for 2d2 turns: blind beyond their own cards' reach, nine mana at most and 3d2 free mana a turn. Then you can stifle it: every 2 mana, or every 2 cards from your deck, takes one maximum mana or one free die from them while it lasts.",
  ok:()=>!survival()&&enemiesOf(G.active).some(e=>!isHorde(e)),run:async()=>{
   const t=await pickFoe("lucifer","Delusion of Lucifer: on whom?"),T=G.p[t],n=applyDelusion(t,G.active);
   log(`<b>Delusion of Lucifer</b>: ${plName(G.active)} blinds ${plName(t)} for ${n} turns.`,"event");notify(G.active,`${esc(T.name)} is blinded by the Delusion of Lucifer for ${n} turns.`);
   const pl=G.active,P=me();
   for(let guard=0;guard<12;guard++){
     const opts=[];const D=T.delu;
     if(D.maxCut<6&&mana(pl)>=2)opts.push({id:"maxm",label:"Take 1 maximum mana from them (2 mana)"});
     if(D.maxCut<6&&P.deck.length>=2)opts.push({id:"maxd",label:"Take 1 maximum mana from them (2 cards from your deck)"});
     if(D.diceCut<3&&mana(pl)>=2)opts.push({id:"dicem",label:"Take 1 free die from them (2 mana)"});
     if(D.diceCut<3&&P.deck.length>=2)opts.push({id:"diced",label:"Take 1 free die from them (2 cards from your deck)"});
     if(!opts.length)break;opts.push({id:"done",label:"That's enough"});
     const ch=await ask(pl,{kind:"choice",id:"stifle",title:`Stifle ${esc(T.name)}: max ${9-D.maxCut}, ${3-D.diceCut}d2 a turn`,options:opts,ai:()=>mana(pl)>=4&&D.diceCut<3?"dicem":P.deck.length>20&&D.maxCut<3?"maxd":"done"});
     if(ch==null||ch==="done")break;
     if(ch.endsWith("m"))pay(pl,2);else for(let i=0;i<2;i++)toGrave(P.deck.splice(Math.floor(Math.random()*P.deck.length),1)[0],"burn");
     if(ch.startsWith("max"))D.maxCut++;else D.diceCut++;
     log(`${plName(pl)} stifles ${plName(t)}'s Delusion: ${9-D.maxCut} mana at most, ${3-D.diceCut}d2 a turn.`);
   }}},
 {id:"deconj",tribe:"lucifer",name:"Deconjured",cost:2,dice:"2 or 2+1d2",school:"Curse",text:"Choose one. Full curse (2 + 1d2 mana, rolled each round): no one can conjure during the next Full Moon, and the grave gives nothing at the next New Moon. Short curse (2 mana): no one, you included, can conjure during the next round.",
  ok:()=>!G.deconjure&&!G.noConjure&&!G.noConjureRound,run:async()=>{
   const pl=G.active,full=G.prices.deconj||3,extra=full-2,opts=[{id:"short",label:"Short curse (2 mana)",sub:"No one can conjure next round."}];
   if(mana(pl)>=extra&&G.moon.i>=0)opts.unshift({id:"full",label:`Full curse (${full} mana)`,sub:"No conjuring at the next Full Moon, and no grave gift at the next New Moon."});
   const ch=await ask(pl,{kind:"choice",id:"deconj",title:"Deconjured",options:opts,ai:()=>opts[0].id});
   if(ch==="full"){if(extra)pay(pl,extra);G.deconjure=true;G.noGraveNext=true;log(`<b>Deconjured</b>: ${plName(pl)} closes the Ether at the next Full Moon and the grave at the next New Moon.`,"event");notify(pl,"Deconjured: no conjuring at the next Full Moon, no grave gift at the next New Moon.")}
   else{G.noConjureRound=G.moon.round+1;log(`<b>Deconjured</b>: ${plName(pl)} closes the Ether to everyone for the next round.`,"event");notify(pl,"Deconjured: no one can conjure next round.")}}},
 {id:"joy",tribe:"lucifer",name:"Pleasure and Joy",cost:0,dice:"1+1d2 or 1d3−1",school:"Curse",text:"Choose one, until your next turn. Pleasure and Joy (1 + 1d2 mana): your cards glow in your color, and those that are killed go back into your deck instead of the grave. Joyful Theft (1d3 − 1 mana): every damage an enemy deals to your units takes 1 mana from that enemy and gives it to you.",
  ok:()=>!me().joy&&!me().theft&&mana(G.active)>=Math.min(G.prices.joyA||2,G.prices.joyB||1),run:async()=>{
   const pl=G.active,a=G.prices.joyA||2,b=G.prices.joyB||1,opts=[];
   if(mana(pl)>=a)opts.push({id:"joy",label:`Pleasure and Joy (${a} mana)`,sub:"Your killed cards go back into your deck."});
   if(mana(pl)>=b)opts.push({id:"theft",label:`Joyful Theft (${b} mana)`,sub:"Every damage dealt to your units steals 1 mana from whoever dealt it."});
   const ch=await ask(pl,{kind:"choice",id:"joy",title:"Pleasure and Joy",options:opts,cancel:"Cancel",ai:()=>opts[opts.length-1].id});
   if(ch==="joy"){if(a)pay(pl,a);me().joy=true;log(`<b>Pleasure and Joy</b>: ${plName(pl)}'s cards glow; their dead return to the deck until the next turn.`,"event")}
   else if(ch==="theft"){if(b)pay(pl,b);me().theft=true;log(`<b>Joyful Theft</b>: until ${plName(pl)}'s next turn, every damage to their units costs the attacker 1 mana.`,"event")}}},
 {id:"lev",tribe:"leviathan",name:"Rise to the Moon",cost:0,school:"Sorcery",text:"Free, only at the New Moon, while your Leviathan is on the field. The Leviathan leaves the field for the moon. From the next New Moon on, every enemy pays its toll each New Moon: 2d4 random deck cards, 2 random cards from the hand and 1 mana, all into the Outer Darkness. On the moon your mana can rise by one for every card in the Outer Darkness (twelve at most). It can be attacked only at the New Moon, and defends there with advantage.",
  ok:()=>(G.moon.i===0&&!G.moon.gone||G.moon.gone==="mars")&&!G.moonLev&&stacksOf(G.active).some(x=>hasK(x.st,"leviathan")),run:async()=>{
   const x=stacksOf(G.active).find(x=>hasK(x.st,"leviathan")),c=x.st.cards.find(k=>k.unit==="leviathan");
   x.st.cards.splice(x.st.cards.indexOf(c),1);if(!x.st.cards.length)G.board[x.r][x.c]=null;if(G.sel&&G.sel.r===x.r&&G.sel.c===x.c)G.sel=null;
   G.moonLev={card:c,owner:G.active,since:G.moon.round};
   log(`<b>The Leviathan rises onto the New Moon.</b>`,"event");
   popup("The Leviathan on the moon",`<p>“'Spit revelation’s limbo back into the cup of sand,' the serpent says wordlessly to the soul from the moon above.</p><p>Caustic spit, bitter with mouth burns. A favor of spirits, where pillars are seen like windows of reflections of themselves inside; dying memories.</p><p>The boy says to himself, 'The apocryphon said thirteen of twelve eternities. I must brand the soul with burning births. Falling from infinity without beginnings, into four corners of end unleashed onto a new world.'”</p>`,G.active);
   popup("Spit the empty full into",`<p>From the next New Moon until the Leviathan is dead, every enemy of ${plName(G.active)} pays at each New Moon: <b>2d4 random cards from the deck, two random cards from the hand, and one mana</b>, all into the Outer Darkness. Tiphareth of Kether is immune.</p><p>Every unit can attack the Leviathan on the moon, but only at the New Moon, and it defends there with advantage.</p>`,G.active)}},
 {id:"exile",tribe:"leviathan",name:"Exile: the Outer Darkness",cost:0,school:"Necromancy",text:"Free. Select your stack with a Joker: every soul it captured falls into the Outer Darkness.",
  ok:()=>selOwnJoker()&&selStack().cards.some(c=>kind(c)==="joker"&&(c.captured||[]).length),run:async()=>{
   const j=selStack().cards.find(c=>kind(c)==="joker"&&(c.captured||[]).length),n=j.captured.length;for(const s of j.captured.splice(0))toDark(s);
   log(`<b>Exile</b>: ${plName(G.active)}'s Joker casts ${n} soul${n>1?"s":""} into the Outer Darkness.`,"event")}},
 {id:"judge",tribe:"yald",name:"Night's Judgement",cost:0,school:"Sorcery",text:"Free, at the New Moon or the Full Moon: Yaldabaoth eats the moon. It disappears and its phases stop. A Leviathan on it goes back into its player's deck. Take 3 mana, or count the moon as three cards toward the hunger.",
  ok:()=>!G.moon.gone&&(G.moon.i===0||G.moon.i===4)||G.moon.gone==="mars",run:async()=>{
   const pl=G.active,P=me();if(G.moon.gone==="mars")G.marsEaten=true;
   if(G.moonLev){const L=G.moonLev;G.moonLev=null;L.card.hp=L.card.maxHp;G.p[L.owner].deck.push(L.card);shuffle(G.p[L.owner].deck);log(`The Leviathan falls from the eaten moon back into ${plName(L.owner)}'s deck.`)}
   G.moon.gone="eaten";G.moon.i=-1;G.moon.blood=false;applyMoonTheme();
   const use=await ask(pl,{kind:"choice",id:"moonuse",title:"Night's Judgement: the moon is eaten",options:[{id:"hunger",label:`Feed the hunger (${(P.hunger||0)+3} of 7)`},{id:"mana",label:"Take 3 mana"}],ai:()=>"hunger"});
   if(use==="mana"){for(let i=0;i<3&&mana(pl)<soulCap(pl);i++)addSoul(pl,mk(String(2+Math.floor(Math.random()*9)),pick(["S","H","D","C"])))}else P.hunger=(P.hunger||0)+3;
   log(`<b>Night's Judgement</b>: ${plName(pl)} eats the moon${use==="mana"?" for mana":` (hunger ${P.hunger} of 7)`}. The phases stop.`,"event");
   popup("Night's Judgement",`<p>${plName(pl)} eats the moon. It is gone from the sky, and its phases stop until Saturn takes its place.</p>`,pl)}},
 {id:"hunger",tribe:"yald",dice:"1d2",name:"God Hunger",cost:1,school:"Necromancy",text:"Twice a turn. Eat 1d2 cards from the grave, your own deck, the selected stack on the field, or an enemy's deck (they roll 1d4 against your 1d4; if you lose, you pay them 2 mana). Take the eaten as mana, or feed the hunger with them. Seven eaten bring Saturn.",
  ok:()=>(me().hungerUses||0)<2,run:async()=>{me().hungerUses=(me().hungerUses||0)+1;await godHunger()}},
 {id:"saturn",tribe:"yald",name:"Regurgitate Saturn",cost:0,school:"Sorcery",text:"Free, once the hunger reaches seven and the moon is out of the sky. Saturn takes the moon's place: at the start of each of their turns every enemy pays 1 (a hand card, the top deck card or 1 mana) into your soul pile, or refuses and a Debt Collector rises on your ground. Each Debt Collector still standing at a new round raises the price by 1. Binah is exempt.",
  ok:()=>(me().hunger||0)>=7&&!!G.moon.gone&&G.moon.gone!=="saturn",run:async()=>{
   const pl=G.active;if(G.moonLev){const L=G.moonLev;G.moonLev=null;L.card.hp=L.card.maxHp;G.p[L.owner].deck.push(L.card);shuffle(G.p[L.owner].deck)}
   G.moon.gone="saturn";G.moon.i=-1;G.moon.blood=false;G.saturnBy=pl;G.saturnDebt=0;applyMoonTheme();
   log(`<b>Saturn</b>: ${plName(pl)} regurgitates Saturn where the moon used to be.`,"event");
   popup("Saturn",`<p>${plName(pl)} regurgitates Saturn where the moon used to belong. Every enemy now pays the Demiurge at the start of each turn, or a Debt Collector rises.</p><p class="dim">A Debt Collector copies the score of the card it fights, without its advantage.</p>`,pl)}},
 {id:"lifesell",tribe:"tiph",name:"Life for Sell",cost:0,school:"Sorcery",text:"Free. Select your stack with a Trafficker holding prisoners: put one of them up at the Auction, beside the Outer Darkness. Any player can offer mana or cards from the hand for it; you approve the sale.",
  ok:()=>selOwn()&&selStack().cards.some(c=>c.unit==="trafficker"&&(c.prisoners||[]).length),run:async()=>{
   const t=selStack().cards.find(c=>c.unit==="trafficker"&&(c.prisoners||[]).length);
   const i=t.prisoners.length===1?0:await ask(G.active,{kind:"cards",id:"lifesell",title:"Life for Sell: who goes to the Auction?",cards:t.prisoners,box:"plain"});
   const c=t.prisoners.splice(i==null?0:i,1)[0];(G.auction=G.auction||[]).push({card:c,seller:G.active});
   log(`<b>Life for Sell</b>: ${plName(G.active)} puts ${esc(nameOf(c))} up at the Auction.`,"event");notify(G.active,`${esc(nameOf(c))} is up for sale at the Auction.`)}},
 {id:"blindfold",tribe:"tiph",name:"The Blindfold",cost:2,school:"Enchantment",text:"While you are under a Delusion: when it ends, you keep it three more turns, with its blindness, its nine mana and its free dice, and without anything Lucifer paid to stifle it.",
  ok:()=>deluded(G.active)&&!me().delu.blindfold&&!me().delu.extended,run:async()=>{me().delu.blindfold=true;log(`<b>The Blindfold</b>: ${plName(G.active)} will keep the Delusion three turns longer.`,"event")}}
);

/* ---------- the computer ---------- */
async function aiSubstance2(pl,W,cast1,foes,mine,near){
  const P=G.p[pl],lv=P.cpu;
  if(P.tribe==="lucifer"){
    if(!deluded(pl)&&mana(pl)>=spellCost(SP("ouro"))+1)await cast1("ouro");
    if(P.ouroRound===G.moon.round||mana(pl)>=8)await cast1("lucifer");
    if(!G.deconjure&&Math.random()<(lv==="hard"?.25:.12)&&mana(pl)>=6)await cast1("deconj");
    if(W&&W.atk>1&&Math.random()<.3&&mana(pl)>=5)await cast1("joy");
  }
  if(P.tribe==="leviathan"){
    if(G.moon.i===0)await cast1("lev");
    if(G.moonLev&&G.moonLev.owner===pl)for(const m of mine)if(m.st.cards.some(c=>kind(c)==="joker"&&(c.captured||[]).length>=2))await cast1("exile",m.r,m.c);
  }
  if(P.tribe==="yald"){
    if(G.moon.gone==="sun")await cast1("cry");else await cast1("judge");   // a burning Sun is worth more as a Black Sun
    for(let i=0;i<2&&mana(pl)>=spellCost(SP("hunger"))+1;i++){
      const t=foes.filter(e=>e.st.cards.some(c=>!(c.unit&&UNIT[c.unit].hp)&&!isBase(c))).sort((a,b)=>AI.value(b.st)-AI.value(a.st))[0];
      if(!(t?await cast1("hunger",t.r,t.c):await cast1("hunger")))break;
    }
    if((P.hunger||0)>=7)await cast1("saturn");
  }
  if(P.tribe==="tiph"){
    for(const m of mine)if(m.st.cards.some(c=>c.unit==="trafficker"&&(c.prisoners||[]).length))await cast1("lifesell",m.r,m.c);
    if(deluded(pl))await cast1("blindfold");
  }
  // anyone may buy at the Auction
  for(const it of [...(G.auction||[])]){
    if(it.seller===pl||!G.auction.includes(it))continue;
    const need=soulOf(it.card)+(it.card.unit?2:0);
    if(AI.value({cards:[it.card]})>3.5&&mana(pl)>=need+2&&Math.random()<.6){await makeOffer(it,{mana:need});break}
  }
}
async function aiMoonAttack(pl){
  if(!G.moonLev||G.moon.i!==0||!isEnemy(pl,G.moonLev.owner))return;
  for(const {st,r,c} of stacksOf(pl)){
    if(!G.moonLev)return;if(!moonAttackable(st))continue;
    const D={owner:G.moonLev.owner,cards:[G.moonLev.card]};let w=0;
    for(let i=0;i<24;i++){if(rollStack(st,"atk",D,null,weaponOf(st)).total>rollStack(D,"def",st,"adv").total)w++}
    if(w/24>.5){attackMoon(r,c);await sleep(500)}
  }
}

/* ---------- symbols ---------- */
UNIT_ICON.leviathan=`<path d="M-10,6C-6,10 -1,9 1,5C3,1 0,-2 3,-5C6,-8 10,-6 9,-2 M9,-2L11,-1L9,0 M6,-5L7,-9L5,-6 M-10,6C-11,3 -9,1 -7,2C-5,3 -6,6 -3,6C0,6 -1,2 1,0 M-7,2L-8,-1 M-3,6L-3,3"/>`;
UNIT_ICON.trafficker=`<path d="M-8,-9a3,3 0 1,0 0.1,0Z M-6,-6L-3,-3 M-3,-3a2.5,2.5 0 1,0 0.1,0 M-1,-1L1,1 M1,1a2.5,2.5 0 1,0 0.1,0 M3,3L5,5 M7,7a4,4 0 1,0 0.1,0Z"/>`;
UNIT_ICON.debt=`<path d="M-8,-10H6L8,-8V10H-8Z M-5,-6H5 M-5,-3H5 M-5,0H2 M-2,4a3,3 0 1,0 0.1,0 M-2,4V7"/>`;

/* ---------------- Prompt 6: the Goatbull's stomp, Joyful Theft, Teleport's return, prices; card info, comparisons, status, menus ---------------- */

function priceLabel(s,round){
  const P=round?G.roundPrices||{}:G.prices||{};
  if(s.id==="deconj")return `2 / ${P.deconj??"2+1d2"} mana`;
  if(s.id==="joy")return `${P.joyA??"1+1d2"} / ${P.joyB??"1d3−1"} mana`;
  if(round)return P[s.id]!=null?P[s.id]:s.dice;
  const c=spellCost(s);return c?c+" mana":"free";
}

/* ---------- the Goatbull's Stomp: the stack is Behooved (pinned) ---------- */
function abilityRolls(goat,target){
  const gd=goat.lostAdv?rollN(1,20):rollN(2,20),sam=hasK(target,"samson"),vd=sam?rollN(1,20):rollN(2,20);
  const gv=Math.max(...gd.map(d=>d.v)),vv=sam?vd[0].v:Math.min(...vd.map(d=>d.v));
  if(gd.length>1){const k=gd.findIndex(d=>d.v===gv);gd.forEach((d,i)=>{if(i!==k)d.x=true})}
  if(vd.length>1){const k=vd.findIndex(d=>d.v===vv);vd.forEach((d,i)=>{if(i!==k)d.x=true})}
  return{gd,vd,gv,vv};
}
function stomp(r1,c1,r2,c2){
  const A=G.board[r1][c1],D=G.board[r2][c2],g=A.cards[0];
  A.attacked=true;G.lastAttack=G.turnNo;
  const {gd,vd,gv,vv}=abilityRolls(g,D);
  tray(A.owner,"Stomp",gd,`${gv} vs ${vv}`);tray(D.owner,"Ability check",vd,`${vv} vs ${gv}`,true);
  let turns=0;if(gv>vv)turns=sum(rollN(2,2));else if(gv===vv)turns=R(2);
  log(`<b>${plName(A.owner)}</b>'s Goatbull stomps from ${coord(r1,c1)} on ${coord(r2,c2)}: ability check ${gv}${g.lostAdv?"":" (advantage)"} against ${vv}${hasK(D,"samson")?"":" (disadvantage)"}.${turns?` The stack is <b>Behooved</b> for ${turns} of its turns.`:" The stack shakes it off."}`,"combat");
  if(turns){D.pin={turns,by:g.id,k:1};notify(A.owner,`The Goatbull pins ${esc(G.p[D.owner].name)}'s stack on ${coord(r2,c2)}: Behooved for ${turns} turns.`)}
  if(turns&&gv>=16&&vv<gv){G.fight={A,D,atkPl:A.owner,defPl:D.owner};log("The hooves land: 1 damage.");damage(r2,c2,1,true);G.fight=null}
  render();return{win:!!turns,line:`${gv} vs ${vv}`};
}
function findCard(id){for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++){const s=G.board[r][c];if(s&&s.cards.some(x=>x.id===id))return{st:s,r,c}}return null}
/* the start of a player's own turn: pinned stacks, teleported cards */
function turn3(pl){
  const P=G.p[pl];
  if(P.returning&&P.returning.length){for(const c of P.returning.splice(0)){if(P.hand.length<handCap(pl))P.hand.push(c);else{P.deck.push(c);shuffle(P.deck)}}log(`${plName(pl)}'s teleported card${P.hand.length?"":"s"} come back.`)}
  for(const {st,r,c} of stacksOf(pl)){
    if(!st.pin)continue;const g=findCard(st.pin.by);
    if(!g){st.pin=null;log(`${plName(pl)}'s stack on ${coord(r,c)} is free: the Goatbull is gone.`);continue}
    st.pin.k++;const need=16-5*(st.pin.k-1),{gd,vd,gv,vv}=abilityRolls(g.st.cards[0],st);
    tray(g.st.owner,"Behooved check",gd,`${gv} vs ${vv}`,true);
    if(gv>=need&&vv<gv){log(`Behooved: the Goatbull rolls ${gv} (needs ${need}) against ${vv}; ${plName(pl)}'s stack on ${coord(r,c)} takes 1 damage.`);G.fight={A:g.st,D:st,atkPl:g.st.owner,defPl:pl};damage(r,c,1,true);G.fight=null}
    else log(`Behooved: the Goatbull rolls ${gv} (needs ${need}) against ${vv}; no damage.`);
  }
}
function end3(pl){for(const {st,r,c} of stacksOf(pl))if(st.pin){st.pin.turns--;if(st.pin.turns<=0){st.pin=null;log(`${plName(pl)}'s stack on ${coord(r,c)} is no longer Behooved.`)}}}
/* Joyful Theft: each damage to the caster's units takes 1 mana from whoever dealt it */
function stealOnDamage(st){
  const P=G.p[st.owner],F=G.fight;if(!P||!P.theft||!F)return;
  const dealer=st===F.D?F.atkPl:st===F.A?F.defPl:null;if(dealer==null||dealer===st.owner||!G.p[dealer])return;
  const Q=G.p[dealer];if(!Q.souls.length)return;
  Q.souls.sort((a,b)=>soulOf(a)-soulOf(b));const c=Q.souls.shift();if(!addSoul(st.owner,c))toGrave(c,"spent");
  log(`Joyful Theft: ${plName(st.owner)} takes ${soulOf(c)} mana from ${plName(dealer)}.`);
}

/* ---------- what a card or stack can do: the numbers behind the corner info ---------- */
const UNIT_KIND={samson:"Wildcard",antony:"Wildcard",satan:"Wildcard",leviathan:"Wildcard",bullgoat:"Wildcard",goatbull:"Wildcard",debt:"Wildcard",slavemaster:"Wildcard",slave:"Wildcard",trafficker:"Wildcard",tree:"Base"};
function cardClass(c){if(c.barb)return "Barbarian";if(isBase(c))return "Base";if(c.unit)return UNIT_KIND[c.unit]||UNIT[c.unit].kind||"Wildcard";if(isSpecial(c))return "Special";return "Standard"}
function rangeOf(st,mode){   // [min,max] of a stack's score
  const solo=st.cards.length===1&&st.cards[0].unit?st.cards[0]:null;
  if(solo&&UNIT[solo.unit].weapons){const U=UNIT[solo.unit];
    if(U.copy)return null;
    if(mode==="atk"){let lo=0,hi=0;for(const w of U.weapons){if(w.special)continue;const d=w.roll();const a=w.fixed+d.length,b=w.fixed+d.reduce((x,y)=>x+y.s,0);lo=Math.max(lo,a);hi=Math.max(hi,b)}return[lo,hi]}
    if(U.defRoll){const d=U.defRoll();return[(U.defFixed||0)+d.length,(U.defFixed||0)+d.reduce((x,y)=>x+y.s,0)]}
    return U.noDef?[0,0]:[U.nat,U.nat];
  }
  if(mode==="def"&&hasK(st,"tree"))return[0,0];
  if(st.cards.length===1&&kind(st.cards[0])==="joker")return null;
  const queen=hasK(st,"queen"),ace=hasK(st,"ace");let lo=0,hi=0;
  for(const c of st.cards){const k=kind(c);if(k==="queen"||k==="joker")continue;if(mode==="def"&&(k==="jack"||k==="slave"))continue;
    const use=mode==="atk"?k!=="ace":ace?k==="ace":queen,d=use?die(c)||0:0;lo=Math.max(lo,nat(c)+(d?1:0));hi=Math.max(hi,nat(c)+d)}
  const jb=mode==="atk"&&hasK(st,"joker")&&st.owner!=null&&G.p[st.owner]?JOKER_BONUS[G.p[st.owner].tribe]||0:0;
  return[lo+jb,hi+jb];
}
function statsOf(st){
  const n=200;let a=0,d=0;const foe={cards:[mk("8","S")],owner:null};
  for(let i=0;i<n;i++){a+=rollStack(st,"atk",foe).total;d+=rollStack(st,"def",foe).total}
  const hearts=st.cards.filter(c=>c.maxHp).map(c=>`${short(c)} ${c.hp}/${c.maxHp}`);
  const fx=[];
  if(st.odds)fx.push(st.odds==="adv"?"Divine Odds: advantage on its next fight":"Hexed Odds: disadvantage on its next fight");
  if(hated(st))fx.push("Hate: disadvantage, and its attackers have advantage");
  if(st.hypo)fx.push(`Hypostasis: untouchable, ${st.hypo} more turn${st.hypo>1?"s":""}`);
  if(st.stun)fx.push(`Lightning: immobilized, ${st.stun} more turn${st.stun>1?"s":""}`);
  if(st.pin)fx.push(`Behooved: pinned by the Goatbull, ${st.pin.turns} more turn${st.pin.turns>1?"s":""}`);
  if(st.owner!=null&&G.p[st.owner]){const P=G.p[st.owner];if(P.shield)fx.push("Please Don't Hurt Me: can't be attacked");if(P.joy)fx.push("Pleasure and Joy: its dead go back to the deck");if(P.theft)fx.push("Joyful Theft: damage to it costs the attacker mana");if(deluded(st.owner))fx.push("its player is under a Delusion")}
  if(st.moved)fx.push("has moved this turn");if(st.attacked)fx.push("has attacked this turn");
  const cap=[],pri=[];for(const c of st.cards){for(const s of c.captured||[])cap.push(s);for(const s of c.prisoners||[])pri.push(s)}
  const lead=st.cards.find(isBase)||st.cards[0];
  return{atk:{avg:a/n,r:rangeOf(st,"atk")},def:{avg:d/n,r:rangeOf(st,"def")},hearts,fx,soul:st.cards.reduce((x,c)=>x+soulOf(c),0),
    type:[...new Set(st.cards.map(cardClass))].join(" + "),cards:st.cards,cap,pri,lead,canAtk:st.cards.some(isShooter)||canAttackFrom({cards:st.cards,attacked:false})};
}
const rngTxt=r=>r?`${r[0]}–${r[1]}`:"copies its foe";
function infoHTML1(st,title){
  const S=statsOf(st),P=st.owner!=null&&G.p[st.owner]?G.p[st.owner]:null;
  return `<div class="cin" style="--pc:${P?P.color:"#bbb"}"><div class="cih"><b>${esc(title||((st.cards.length>1?`Stack of ${st.cards.length}`:nameOf(S.lead))))}</b>${P?` <span class="dim">· ${esc(P.name)}</span>`:""}</div>
<dl><dt class="k-type">Type</dt><dd>${esc(S.type)}</dd>
<dt class="k-atk">Attack</dt><dd>${S.canAtk?`avg ${S.atk.avg.toFixed(1)} · min–max ${rngTxt(S.atk.r)}`:"cannot attack"}</dd>
<dt class="k-def">Defense</dt><dd>avg ${S.def.avg.toFixed(1)} · min–max ${rngTxt(S.def.r)}</dd>
${S.hearts.length?`<dt class="k-hp">Hearts</dt><dd>${S.hearts.map(esc).join(", ")}</dd>`:""}
<dt class="k-soul">Soul worth</dt><dd>${S.soul} mana</dd>
${S.fx.length?`<dt class="k-fx">Effects</dt><dd>${S.fx.map(esc).join("<br>")}</dd>`:""}
<dt class="k-cards">Cards</dt><dd>${S.cards.map(c=>esc(nameOf(c))).join(", ")}</dd>
${S.cap.length?`<dt class="k-fx">Souls captured</dt><dd>${S.cap.map(c=>esc(nameOf(c))).join(", ")}</dd>`:""}
${S.pri.length?`<dt class="k-fx">Imprisoned</dt><dd>${S.pri.map(c=>esc(nameOf(c))).join(", ")}</dd>`:""}</dl></div>`;
}
function compareHTML(a,b,ta,tb){
  const A=statsOf(a),B=statsOf(b);
  const row=(label,x,y,fmt)=>{const cx=x>y?"gt":x<y?"lt":"eq",cy=y>x?"gt":y<x?"lt":"eq";return `<tr><th>${label}</th><td class="${cx}">${fmt?fmt(x):x}</td><td class="${cy}">${fmt?fmt(y):y}</td></tr>`};
  const hp=s=>s.cards.reduce((t,c)=>t+(c.hp||0),0);
  return `<table class="cmp"><tr><th></th><th>${esc(ta)}</th><th>${esc(tb)}</th></tr>
${row("Attack avg",A.canAtk?A.atk.avg:0,B.canAtk?B.atk.avg:0,v=>v.toFixed(1))}
${row("Attack max",A.canAtk&&A.atk.r?A.atk.r[1]:0,B.canAtk&&B.atk.r?B.atk.r[1]:0)}
${row("Attack min",A.canAtk&&A.atk.r?A.atk.r[0]:0,B.canAtk&&B.atk.r?B.atk.r[0]:0)}
${row("Defense avg",A.def.avg,B.def.avg,v=>v.toFixed(1))}
${row("Defense max",A.def.r?A.def.r[1]:0,B.def.r?B.def.r[1]:0)}
${row("Defense min",A.def.r?A.def.r[0]:0,B.def.r?B.def.r[0]:0)}
${row("Hearts",hp(a),hp(b))}${row("Cards",a.cards.length,b.cards.length)}${row("Soul worth",A.soul,B.soul)}</table>`;
}
/* one small floating box for card info, comparisons, the moon and player status */
function pop(html,x,y,cls){
  let el=$("#cinfo");if(!el){el=document.createElement("div");el.id="cinfo";document.body.appendChild(el);
    el.addEventListener("click",e=>e.stopPropagation());
    document.addEventListener("click",()=>{if(!el.hidden&&!el.dataset.hover&&Date.now()-(el._t||0)>350)el.hidden=true});
    document.addEventListener("keydown",e=>{if(e.key==="Escape")el.hidden=true})}
  el.className=cls||"";el.innerHTML=html;el.hidden=false;delete el.dataset.hover;el._t=Date.now();
  const w=Math.min(380,innerWidth-20);el.style.width=w+"px";
  el.style.left=Math.max(10,Math.min(x,innerWidth-w-10))+scrollX+"px";el.style.top=y+scrollY+8+"px";
  return el;
}
const popHide=()=>{const el=$("#cinfo");if(el)el.hidden=true};
const stackAtTile=t=>{if(!t)return null;const r=+t.dataset.r,c=+t.dataset.c;if(isNaN(r)||hiddenFrom(view(),r,c)||showsBack(view(),r,c))return null;const st=G.board[r][c];return st?{st,r,c}:null};
const stackTitle=(s,r,c)=>`${s.cards.length>1?`Stack of ${s.cards.length}`:nameOf(s.cards[0])} on ${coord(r,c)}`;
/* the corner tab on every stack: click for info, drag onto another stack to compare */
function wireCorners(){
  document.querySelectorAll("#board .ci").forEach(t=>{
    t.onclick=e=>{e.stopPropagation();e.preventDefault()};
    t.onpointerdown=e=>{
      e.stopPropagation();e.preventDefault();const src=stackAtTile(t.closest(".tile"));if(!src)return;
      const ghost=document.createElement("div");ghost.className="ciline";document.body.appendChild(ghost);
      const x0=e.clientX,y0=e.clientY;let moved=false;
      const mv=ev=>{const dx=ev.clientX-x0,dy=ev.clientY-y0;if(Math.abs(dx)+Math.abs(dy)>6)moved=true;
        ghost.style.cssText=`left:${x0+scrollX}px;top:${y0+scrollY}px;width:${Math.hypot(dx,dy)}px;transform:rotate(${Math.atan2(dy,dx)}rad)`};
      const up=ev=>{document.removeEventListener("pointermove",mv);document.removeEventListener("pointerup",up);ghost.remove();
        if(!moved){pop(infoHTML1(src.st,stackTitle(src.st,src.r,src.c)),e.clientX,e.clientY,"info");return}
        const el=document.elementFromPoint(ev.clientX,ev.clientY),dst=stackAtTile(el&&el.closest(".tile"));
        if(dst&&dst.st!==src.st)pop(`<div class="cih"><b>Compare</b></div>`+compareHTML(src.st,dst.st,stackTitle(src.st,src.r,src.c),stackTitle(dst.st,dst.r,dst.c)),ev.clientX,ev.clientY,"info wide");
        else flash("Drop the corner onto another stack on the field to compare.");
      };
      document.addEventListener("pointermove",mv);document.addEventListener("pointerup",up);
    };
  });
  document.querySelectorAll(".cf .ci").forEach(t=>{t.onclick=e=>{e.stopPropagation();e.preventDefault();const c=cardById(+t.dataset.cid);if(!c)return;
    pop(infoHTML1({cards:[c],owner:c.owner},nameOf(c)),e.clientX,e.clientY,"info")}});
}
function cardById(id){
  for(const P of G.p)for(const L of [P.hand,P.deck,P.souls,P.thralls||[],P.returning||[]])for(const c of L)if(c.id===id)return c;
  for(const L of [G.grave,G.dark,G.ether,G.limbo,G.unknown])for(const c of L)if(c.id===id)return c;
  const f=findCard(id);if(f)return f.st.cards.find(c=>c.id===id);
  for(const it of G.auction||[])if(it.card.id===id)return it.card;
  return G.browse&&G.browse.id===id?G.browse:null;
}
/* the card browser: compare the selected stack with any kind of card */
const BROWSE=[["Standard",["2","3","4","5","6","7","8","9","10","puppet","archer","cannon"]],["Special",["J","Q","K","A","JK","assassin"]],["Support",["scout","healer","repair","ram","miner"]],["Wildcard",["samson","antony","satan","leviathan","bullgoat","goatbull","debt","slavemaster","slave","trafficker"]],["Base",["A","tree","wall"]]];
function protoCard(k){if(k==="puppet"){const c=mk("6","S");c.puppet=true;return c}if(UNIT[k])return mkUnit(k,null);if(k==="JK")return mk("JK",null,"black");return mk(k,"S")}
function openBrowser(base,title){
  ovShow(`<div class="ovbox wide"><h2>Compare with a kind of card</h2><p class="dim">The suit doesn't matter here. Pick a category, then a card.</p>
${BROWSE.map(([cat,ks])=>`<h3>${cat}</h3><div class="pickrow">${ks.map(k=>{const c=protoCard(k);return `<button class="pk" data-bk="${k}" aria-label="${esc(nameOf(c))}">${face(c,{owner:null,noci:true})}</button>`}).join("")}</div>`).join("")}
<p><button class="btn ghost" id="mcancel">Close</button></p></div>`);
  $("#mcancel").onclick=ovHide;
  $("#ov").querySelectorAll("[data-bk]").forEach(b=>b.onclick=e=>{const c=protoCard(b.dataset.bk);ovHide();pop(`<div class="cih"><b>Compare</b></div>`+compareHTML(base,{cards:[c],owner:null},title,nameOf(c).replace(/ of Spades/,"")),e.clientX,e.clientY,"info wide")});
}

/* ---------- the moon (or what is in its place), hover or click ---------- */
const SKY_NAME={moon:"Fate",saturn:"No",mars:"Strife",sun:"King",mercury:"Guile",venus:"Harmony",jupiter:"Fortune"};
function moonInfoHTML(){
  const m=G.moon,V=view(),P=G.p[V],L=[];
  if(["sun","blacksun","venus","jupiter","mercury","fallen"].includes(m.gone))return planetInfoHTML(m.gone);
  if(m.gone==="off")L.push("The moon is off for this game: no phases, no gifts, no tolls.");
  else if(m.gone==="mars"){L.push("Mars hangs where the moon was. At the start of each turn, every stack of only Grunts and Infantry (Puppets too) gets advantage on its next attack on 1–5 of 1d8.");
    if(G.moonLev)L.push(`The Leviathan coils on Mars; its toll and its weak spot come every eighth round.`)}
  else if(m.gone==="saturn"){const S=G.saturnBy;L.push(S==null?"Saturn has hung in the sky from the start. Its favors go to the Bank.":`Saturn hangs where the moon was, regurgitated by ${esc(G.p[S].name)}.`);
    if(S===V)L.push(`Every enemy pays you ${1+(G.saturnDebt||0)} at the start of each of their turns.`);
    else if(P.tribe==="binah")L.push("You are Binah: you owe Saturn nothing.");
    else if(P.tribe==="firm")L.push("You are the Firmament: Saturn's tax doesn't touch you.");
    else if(S==null||isEnemy(V,S))L.push(`At the start of each of your turns you pay ${1+(G.saturnDebt||0)} (a hand card, the top deck card or 1 mana), or a Debt Collector rises.`);
    if(G.saturnDebt)L.push(`Debt Collectors still standing have raised the price by ${G.saturnDebt}.`)}
  else if(m.gone==="eaten")L.push("Yaldabaoth ate the moon. Its phases have stopped: no gifts, no tolls, no Blood Moon.");
  else{
    L.push(`<b>${MOON[m.i]}</b>${m.blood?" · <b>Blood Moon</b>":""}. The moon turns once a round, after every player has had a turn.`);
    if(m.blood)L.push("New Moon gifts at Full Moon prices; every card killed falls into the Outer Darkness, and a Joker that shoots itself sends its souls there too.");
    else if(m.i===0)L.push("New Moon: everyone raises 1d2 cards from the grave. Clairvoyance and Naked Hand cost 6."+(G.opts.moonBonus!==false?" Every defense adds 1d2.":""));
    else if(m.i===4)L.push("Full Moon: the toll is paid, decks are shuffled, no one draws and no necromancy is cast. Clairvoyance costs 2, Naked Hand is free."+(G.opts.moonBonus!==false?" Every attack adds 1d2.":""));
    else L.push(`No moon effect this phase. Next: ${MOON[(m.i+1)%8]}.`);
    if(G.moonLev)L.push(`The Leviathan (${G.moonLev.card.hp} heart${G.moonLev.card.hp===1?"":"s"}) lies on the moon. ${G.moonLev.owner===V?"Your mana cap rises with the Outer Darkness.":P.tribe==="tiph"?"You are immune to its toll.":"It takes its toll from you each New Moon: 2d4 deck cards, 2 hand cards and 1 mana."} It can be attacked only at the New Moon.`);
  }
  if(G.deconjure)L.push("Deconjured: no conjuring at the next Full Moon.");
  if(G.noGraveNext)L.push("Deconjured: no grave gift at the next New Moon.");
  if(G.noConjureRound===G.moon.round)L.push("Deconjured: no one can conjure this round.");
  if(G.moonMiner)L.push(`${esc(G.p[G.moonMiner.owner].name)}'s Miner works the moon: 1d2 − 1 mana every turn, until the moon leaves the sky or the Leviathan climbs onto it.`);
  if(G.bloodCalled)L.push("The Firmament has called a Blood Moon: the next Full Moon turns red.");
  const nm=m.gone==="saturn"?"Saturn":m.gone==="mars"?"Mars":m.gone?"No moon":"The Moon",word=m.gone==="saturn"?SKY_NAME.saturn:m.gone==="mars"?SKY_NAME.mars:m.gone?"":SKY_NAME.moon;
  return `<div class="cin sky"><div class="cih"><b>${nm}</b>${word?` <span class="skyword">“${word}”</span>`:""}</div><p>${L.join("</p><p>")}</p></div>`;
}
function wireMoon(){
  const el=$("#moon");if(!el||el.dataset.w)return;el.dataset.w=1;
  const show=e=>{if(!G)return;const r=el.getBoundingClientRect();const p=pop(moonInfoHTML(),r.left,r.bottom-scrollY+scrollY,"info");p.dataset.hover=e.type==="mouseenter"?"1":""};
  el.addEventListener("mouseenter",show);
  el.addEventListener("mouseleave",()=>{const p=$("#cinfo");if(p&&p.dataset.hover)p.hidden=true});
  el.addEventListener("click",e=>{if(G&&canAct()&&G.phase==="attack"&&G.sel&&moonAttackable(selStack()))return;e.stopPropagation();show(e);const p=$("#cinfo");if(p)delete p.dataset.hover});
}

/* ---------- a player's status: hover or click the Substance symbol ---------- */
function statusHTML(pl){
  const P=G.p[pl],T=TRIBES[P.tribe]||{name:"",sub:""},L=[];
  if(P.cpu==="horde")return `<div class="cin"><div class="cih"><b>The Horde</b></div><p>It spawns every round and never holds back.</p></div>`;
  L.push(`<dt class="k-type">Substance</dt><dd>${esc(T.name)}${P.randomSub?" (random)":""}</dd>`);
  L.push(`<dt class="k-soul">Limits</dt><dd>${handCap(pl)}-card hand · ${soulCap(pl)} mana (up to ${surCap(pl)} for a round) · ${P.deck.length} cards in the deck</dd>`);
  const fx=[];
  if(P.bolts)fx.push(`${P.bolts}/3 bolts`);if((P.thralls||[]).length)fx.push(`${P.thralls.length} thralls`);if(P.hunger)fx.push(`hunger ${P.hunger}/7`);
  if(P.shield)fx.push("Please Don't Hurt Me");if(P.joy)fx.push("Pleasure and Joy");if(P.theft)fx.push("Joyful Theft");
  if(deluded(pl))fx.push(`Delusion, ${P.delu.turns} turn${P.delu.turns>1?"s":""} (${3-(P.delu.diceCut||0)}d2 free mana)`);
  if(P.od)fx.push(`overdrawn ${P.od}`);if(P.shownBy!=null)fx.push("hand seen by Naked Hand");
  if((P.returning||[]).length)fx.push(`${P.returning.length} card${P.returning.length>1?"s":""} teleporting home`);
  if(JOKER_BONUS[P.tribe])fx.push(`Jokers +${JOKER_BONUS[P.tribe]} on attack`);
  if(fx.length)L.push(`<dt class="k-fx">Effects</dt><dd>${fx.map(esc).join("<br>")}</dd>`);
  const casts=(P.hist||[]).filter(e=>e.kind==="spell").slice(0,6);
  if(casts.length)L.push(`<dt class="k-atk">Cast</dt><dd>${casts.map(e=>`${esc(e.name)}${e.tile?" on "+e.tile:""}${e.target?" at "+esc(e.target):""} <small>${e.round?"round "+e.round:"setup"}, ${clock(e.t)}</small>`).join("<br>")}</dd>`);
  return `<div class="cin" style="--pc:${P.color}"><div class="cih">${solidSVG(P.solid,P.color,16)} <b>${esc(P.name)}</b></div><dl>${L.join("")}</dl></div>`;
}
function wireStatus(){
  document.querySelectorAll("[data-stat]").forEach(b=>{
    const show=e=>{const r=b.getBoundingClientRect();const p=pop(statusHTML(+b.dataset.stat),r.left,r.bottom,"info");p.dataset.hover=e.type==="mouseenter"?"1":""};
    b.onmouseenter=show;b.onmouseleave=()=>{const p=$("#cinfo");if(p&&p.dataset.hover)p.hidden=true};
    b.onclick=e=>{e.stopPropagation();show(e);const p=$("#cinfo");if(p)delete p.dataset.hover};
  });
}

/* ---------- the menu (it pauses the game) ---------- */
function openMenu(){
  if(!G)return;G.paused=true;
  let m=$("#menu");if(!m){m=document.createElement("div");m.id="menu";document.body.appendChild(m)}
  const sel=(id,label,opts,cur)=>`<label class="f">${label} <select id="${id}">${opts.map(([v,t])=>`<option value="${v}" ${v===cur?"selected":""}>${t}</option>`).join("")}</select></label>`;
  m.innerHTML=`<div class="ovbox"><h2>Paused</h2><p class="dim">The game waits while this menu is open. These settings change how the table looks, not the rules.</p>
<div class="mgrid">
${sel("mTheme","Page theme",Object.entries(THEMES).map(([k,[n]])=>[k,n]),PREF.theme)}
${sel("mHand","Your hand",[["below","Under your deck and mana"],["side","Beside the field"]],PREF.hand)}
${sel("mSel","Selected stack box",[["bottom","Below the spells"],["top","Above the spells"]],PREF.sel)}
${sel("mCtl","Turn buttons",[["bottom","Under the field"],["top","At the top"]],PREF.ctl)}
${sel("mCoord","Tile names",[["0","Off"],["1","On"]],PREF.coords?"1":"0")}
${sel("mFull","Page width",[["0","Standard"],["1","Full width"]],PREF.full?"1":"0")}
${sel("mSpeed","Computer speed",[["slow","Slow"],["normal","Normal"],["fast","Fast"]],G.opts.cpuSpeed||"normal")}
${sel("mSnd","Sound",[["on","On"],["off","Off"]],SND.on?"on":"off")}
</div>
<div class="mgrid">${[["ci","Card icons",.8,1.8],["ui","Interface size",.8,1.4],["tz","Text size",.8,1.8]].map(([k,n])=>`<span class="gctl">${n} <button type="button" data-mz="${k}" data-d="-1">−</button><b id="mz${k}">${Math.round(PREF[k]*100)}%</b><button type="button" data-mz="${k}" data-d="1">+</button></span>`).join("")}</div>
${+G.opts.timer?`<p><button class="btn ghost" id="mTimer">Turn the phase timer off for this game</button></p>`:""}
<p class="acts"><button class="btn" id="mResume">Resume</button></p></div>`;
  m.hidden=false;
  const upd=()=>{savePrefs();applyPrefs();render()};
  $("#mTheme").onchange=e=>{PREF.theme=e.target.value;upd()};$("#mHand").onchange=e=>{PREF.hand=e.target.value;upd()};
  $("#mSel").onchange=e=>{PREF.sel=e.target.value;upd()};$("#mCtl").onchange=e=>{PREF.ctl=e.target.value;upd()};
  $("#mCoord").onchange=e=>{PREF.coords=e.target.value==="1";upd()};$("#mFull").onchange=e=>{PREF.full=e.target.value==="1";upd()};
  $("#mSpeed").onchange=e=>{G.opts.cpuSpeed=e.target.value};$("#mSnd").onchange=e=>{if((e.target.value==="on")!==SND.on)SND.toggle();render()};
  m.querySelectorAll("[data-mz]").forEach(b=>b.onclick=()=>{const k=b.dataset.mz,lim=k==="ui"?[.8,1.4]:[.8,1.8];PREF[k]=Math.round(Math.min(lim[1],Math.max(lim[0],PREF[k]+ +b.dataset.d*.1))*10)/10;$("#mz"+k).textContent=Math.round(PREF[k]*100)+"%";upd()});
  if($("#mTimer"))$("#mTimer").onclick=()=>{G.opts.timer=0;stopTimer();log("The phase timer is switched off for the rest of the game.","event");$("#mTimer").remove()};
  $("#mResume").onclick=closeMenu;
}
function closeMenu(){const m=$("#menu");if(m)m.hidden=true;if(G){G.paused=false;render()}}

UNIT_ICON.goatbull=`<path d="M-9,-8C-11,-4 -9,-1 -6,-2 M9,-8C11,-4 9,-1 6,-2 M-6,-4C-4,-6 4,-6 6,-4L5,4C4,8 -4,8 -5,4Z M-3,5h0.1 M3,5h0.1 M-2,-1L-2.5,0 M2,-1L2.5,0 M-5,-5L-8,-9 M5,-5L8,-9"/>`;

/* ---------------- Prompt 7: fog of war, Scouts, Assassins, face-down cards, ambush, Quiet Eyes, Bird's Eye ---------------- */

/* ---------- who sees what ----------
   Fog of war (on by default): every unit sees two tiles around it, a Scout three. Assassins, ambushers and enemy Scouts
   stay hidden unless one of your cards stands right next to them; your Scouts also uncover Assassins, ambushers and
   face-down cards within a round two tiles, and enemy Scouts within three. Bird's Eye lifts the fog for your side for a
   round. Quiet Eyes, cast by an enemy, hides everything not right beside you unless you have a Scout on the field.
   A Delusion overrides all of this with its own rule, and Scouts can't help against it. */
const fogOn=()=>G.opts.fog!==false&&G.moon.gone!=="sun";   // the Second Sun burns the fog away
const sideOf=V=>[V,...alliesOf(V)];
const scoutsOf=V=>sideOf(V).flatMap(stacksOf).filter(x=>hasK(x.st,"scout"));
const quietOn=V=>(G.quiet||[]).some(q=>q.until>=G.moon.round&&isEnemy(q.by,V));
const birdOn=V=>(G.bird||[]).some(b=>b.round===G.moon.round&&!isEnemy(b.by,V));
const stealthy=st=>st.ambush||st.cards.every(c=>c.unit==="assassin"||c.unit==="scout");
function visionMap(V){   // cached until the board changes: each side's cards and Scouts
  const L0=G.log[0],key=G.turnNo+"|"+G.log.length+"|"+(L0?L0.t+L0.html.length:0)+"|"+G.board.flat().filter(Boolean).length;
  if(!G._vis||G._vis.key!==key)G._vis={key,m:{}};
  return G._vis.m[V]||(G._vis.m[V]={own:sideOf(V).flatMap(stacksOf),sc:scoutsOf(V)});
}
PRICE.bird=()=>R(2);PRICE.cas=()=>R(2)+R(2)+1;
function seesTile(V,r,c){
  if(V==null||!G.p[V])return true;
  const st=G.board[r][c];if(!st||!isEnemy(st.owner,V))return true;
  if(blindFor(V))return deluSees(V,r,c);                       // the Delusion's rule wins, Scouts or not
  if(sunBlind(V)||choked(V))return false;                        // blinded by the Sun: not even what is beside you
  const ff=firmFog(V);if(ff&&ff.blind)return false;            // the Firmament's fog at the New Moon: blind
  const M=visionMap(V);
  const near=M.own.some(x=>Math.abs(x.r-r)+Math.abs(x.c-c)===1);  // right beside one of your cards
  if(stealthy(st)){
    if(near||eclipseOn("sun"))return true;   // the suns' eclipse shows every Assassin
    const scoutR=(hasK(st,"scout")&&st.cards.every(c=>c.unit==="scout")?3:2)-(ff&&ff.cut?1:0);
    return M.sc.some(x=>scoutR===3?Math.max(Math.abs(x.r-r),Math.abs(x.c-c))<=3:Math.hypot(x.r-r,x.c-c)<=2.01);
  }
  if(quietOn(V)&&!M.sc.length)return M.own.some(x=>Math.max(Math.abs(x.r-r),Math.abs(x.c-c))<=1);
  if(!ff&&(!fogOn()||birdOn(V)))return true;
  return M.own.some(x=>Math.max(Math.abs(x.r-r),Math.abs(x.c-c))<=visR(x,ff));
}
/* a tile is foggy for you when none of your cards can see it */
function fogTile(V,r,c){
  if(V==null||!G.p[V]||blindFor(V))return false;
  if(sunBlind(V))return !visionMap(V).own.some(x=>x.r===r&&x.c===c);
  const ff=firmFog(V);
  if(!ff&&(!fogOn()||birdOn(V)))return false;
  const M=visionMap(V);if(ff&&ff.blind)return !M.own.some(x=>x.r===r&&x.c===c);
  return !M.own.some(x=>Math.max(Math.abs(x.r-r),Math.abs(x.c-c))<=visR(x,ff));
}
/* a face-down enemy stack shows only its back, unless your Scout is within two tiles */
function showsBack(V,r,c){
  const st=G.board[r][c];if(!st||!st.down||!isEnemy(st.owner,V)||eclipseOn("sun"))return false;
  return !scoutsOf(V).some(x=>Math.hypot(x.r-r,x.c-c)<=2.01);
}

/* ---------- ambush ---------- */
const canAmbush=st=>st&&(st.down||st.cards.some(c=>c.unit==="assassin"))&&!hasBase(st)&&!st.cards.every(c=>c.unit&&UNIT[c.unit].noAtk);
/* an enemy stack that steps beside an ambusher is struck at once, out of turn, with advantage */
function ambushCheck(r,c){
  const T=G.board[r][c];if(!T)return;
  for(let rr=0;rr<G.rows;rr++)for(let cc=0;cc<COLS;cc++){
    const A=G.board[rr][cc];if(!A||!A.ambush||!isEnemy(A.owner,T.owner)||!G.board[r][c])continue;
    if(!adjacent(rr,cc,r,c,jackOnly(A)))continue;
    const keep={attacked:A.attacked,moved:A.moved};A.attacked=false;A.ambushing=true;
    log(`<b>Ambush!</b> ${plName(A.owner)}'s hidden stack on ${coord(rr,cc)} strikes as ${plName(T.owner)} steps onto ${coord(r,c)}.`,"event");
    notify(A.owner,`Ambush on ${coord(r,c)}.`);
    const opt=attackOptions(rr,cc).find(o=>o.r===r&&o.c===c);
    if(opt)attack(rr,cc,r,c,opt.mode);else{A.ambushing=false;A.ambush=false}
    if(G.board[rr][cc]===A){A.attacked=keep.attacked;A.moved=keep.moved}
    if(G.over)return;
  }
}

/* ---------- Scouts and Assassins in the decks and the Ether ---------- */
function deckCount(){const o=G.opts,L=o.layout||"duel",n=G.p.filter(P=>!isHorde(P.i)).length;
  if(L==="duel")return o.decks||2;if(L.startsWith("team"))return 2;return o.ffaDeck==="half"?Math.ceil(n/2):n}
function fogDecks(pls){
  const n=deckCount();let scouts=8*n,ass=4*n;
  for(const pl of pls){const P=G.p[pl],k=P.tribe==="beginner"?4:2,a=P.tribe==="beginner"?1:0;
    for(let i=0;i<k&&scouts>0;i++){P.deck.push(mkUnit("scout",pl));scouts--}
    for(let i=0;i<a&&ass>0;i++){P.deck.push(mkUnit("assassin",pl));ass--}
    shuffle(P.deck)}
  for(let i=0;i<scouts;i++)G.ether.push(mkUnit("scout",null));
  for(let i=0;i<ass;i++)G.ether.push(mkUnit("assassin",null));
}
/* every Ace that goes down brings a Scout from the Ether (two for the Beginner's first), except for Lucifer & Ouroboros */
function aceScout(pl,r,c,first){
  const P=G.p[pl],st=G.board[r][c];if(!st||P.tribe==="lucifer"||isHorde(pl)||G.bank&&G.bank.dead)return;
  const k=first&&P.tribe==="beginner"?2:1;let got=0;
  for(let i=0;i<k;i++){if(st.cards.length>6)break;const j=G.ether.findIndex(x=>x.unit==="scout");if(j<0)break;const s=G.ether.splice(j,1)[0];s.owner=pl;st.cards.push(s);got++}
  if(first&&P.tribe==="beginner"){const j=G.ether.findIndex(x=>x.unit==="miner");if(j>=0){const m=G.ether.splice(j,1)[0];m.owner=pl;m.inSlot=0;st.cards.push(m);log(`A Miner takes ${plName(pl)}'s first miner slot.`)}}
  if(got)fogLog(pl,r,c,`${got===1?"A Scout rides":"Two Scouts ride"} out of the Ether to ${plName(pl)}.`);
  if(got)log(`${got===1?"A Scout":"Two Scouts"} ride${got===1?"s":""} out of the Ether into ${plName(pl)}'s Ace on ${coord(r,c)}.`);
}
function fullMoonScout(){   // the Beginner's free Scout each Full Moon
  if(G.moon.i!==4)return;
  for(const P of G.p){if(P.out||P.tribe!=="beginner")continue;const j=G.ether.findIndex(x=>x.unit==="scout");if(j<0)continue;
    const s=G.ether.splice(j,1)[0];s.owner=P.i;if(P.hand.length<handCap(P.i))P.hand.push(s);else{P.deck.push(s);shuffle(P.deck)}
    log(`The Full Moon sends ${plName(P.i)} a free Scout from the Ether.`)}
}

/* ---------- spells ---------- */
SPELLS.push(
 {id:"csc",name:"Scout Conjure",cost:1,school:"Conjuring",text:"A Scout's soul comes from the Ether into your deck. Scouts see three tiles through the fog, uncover Assassins, ambushers and face-down cards within two, move like Assassins and don't fight.",ok:()=>etherHasU("scout"),run:()=>conjureU("scout")},
 {id:"cas",dice:"2d2+1",name:"Assassin Conjure",cost:5,school:"Conjuring",text:"An Assassin's soul comes from the Ether into your deck. Two hearts, the defense of an Infantry (8) and the attack of a Jack (10 + 1d12); moves one tile straight, two diagonal, or two forward or back; hidden from enemies until they stand right beside it; can ambush; two can stack together.",ok:()=>etherHasU("assassin"),run:()=>conjureU("assassin")},
 {id:"quiet",name:"Quiet Eyes",cost:2,dice:"2 a round",school:"Illusion",text:"For 1d2 + 1 rounds, enemies without a Scout on the field see only the units right beside their own. 2 mana now and 2 at the start of every round it lasts; it ends when you can't pay. Scouts see through it.",
  ok:()=>!(G.quiet||[]).some(q=>q.by===G.active&&q.until>=G.moon.round),run:async()=>{
   const d=R(2)+1;(G.quiet=G.quiet||[]).push({by:G.active,until:G.moon.round+d-1});tray(G.active,"Quiet Eyes",[{s:2,v:d-1}],`${d} rounds`);
   log(`<b>Quiet Eyes</b>: ${plName(G.active)} hushes the field for ${d} rounds.`,"event");notify(G.active,`Quiet Eyes: enemies without a Scout see only what is right beside them, ${d} rounds.`)}},
 {id:"bird",dice:"1d2",name:"Bird's Eye",cost:1,school:"Sorcery",text:"For the rest of this round the fog of war lifts for you and your teammates. It does nothing against a Delusion.",
  ok:()=>fogOn()&&!birdOn(G.active),run:async()=>{(G.bird=G.bird||[]).push({by:G.active,round:G.moon.round});log(`<b>Bird's Eye</b>: ${plName(G.active)} sees the whole field this round.`,"event")}}
);
const etherHasU=u=>G.ether.some(c=>c.unit===u);
async function conjureU(u){const i=G.ether.findIndex(c=>c.unit===u);const c=G.ether.splice(i,1)[0];c.owner=G.active;if(c.hp!=null)c.hp=c.maxHp;me().deck.push(c);shuffle(me().deck);log(`A${/^[AEIOU]/.test(UNIT[u].name)?"n":""} ${UNIT[u].name}'s soul materializes from the Ether into ${plName(G.active)}'s deck.`)}
/* Quiet Eyes asks 2 mana at the start of each round it lasts */
function quietRound(){
  for(const q of G.quiet||[]){if(q.until<G.moon.round||q.paidRound===G.moon.round)continue;
    if(q.started===undefined){q.started=G.moon.round;q.paidRound=G.moon.round;continue}
    if(mana(q.by)>=2){pay(q.by,2);q.paidRound=G.moon.round;log(`${plName(q.by)} pays 2 mana to keep Quiet Eyes.`)}else{q.until=G.moon.round-1;log(`${plName(q.by)} can't pay: Quiet Eyes ends.`)}}
}

/* ---------- the computer ---------- */
async function aiFog(pl,W,cast1){
  const P=G.p[pl],lv=P.cpu;
  // set ambush with Assassins and face-down stacks that have nothing to hit right now
  for(const {st,r,c} of stacksOf(pl)){if(!canAmbush(st)||st.ambush||st.moved||st.attacked)continue;
    if(!attackOptions(r,c).length&&Math.random()<(lv==="easy"?.3:.7)){st.ambush=true;log(`${plName(pl)} sets a stack in ambush.`,"ai")}}
  if(fogOn()&&!scoutsOf(pl).length&&mana(pl)>=2&&lv!=="easy")await cast1("csc");
  if(lv==="hard"&&mana(pl)>=spellCost(SP("cas"))+1&&Math.random()<.35)await cast1("cas");
  if(fogOn()&&lv!=="easy"&&W&&W.atk>1&&mana(pl)>=3&&Math.random()<.25)await cast1("bird");
  if(lv==="hard"&&mana(pl)>=6&&Math.random()<.15)await cast1("quiet");
}

/* icons */
UNIT_ICON.scout=`<path d="M-8,8L-5,0L-7,-4L-3,-8L2,-7L6,-3L8,-4L7,1L3,0L2,8"/><path d="M-3,-8L-1,-11M2,-7L4,-10"/>`;
UNIT_ICON.assassin=`<path d="M0,-11L2.5,-2L0,4L-2.5,-2Z"/><path d="M-6,4L6,4M0,4L0,10"/>`;

/* the log hides what an enemy couldn't see: a move or placement onto a tile hidden from them shows only a vague line */
function fogLog(by,r,c,alt){
  if(!fogOn()&&!G.ffog&&!G.quiet?.length&&!G.p.some(P=>blindFor(P.i))&&!stealthy(G.board[r][c]||{cards:[]}))return;
  G._vis=null;const seen=G.p.map(P=>!isEnemy(by,P.i)||seesTile(P.i,r,c));
  if(seen.every(Boolean))return;log.fog={by,seen,alt};
}

/* ---------------- Prompt 8: Archers, Cannons, Healers, Walls, Repairmen, Battering Rams, Miners, crystals, Field Libation ----------------
   Every one of these waits in the Ether (counts per deck below) and is bought with a Conjure spell. The Beginner starts with a kit. */

/* ---------- the Ether ---------- */
const SIEGE_PER_DECK={archer:8,healer:4,repair:4,wall:4,ram:4,miner:4,cannon:1};
const BEGINNER_KIT={archer:2,wall:1,repair:2,ram:1};
function siegeDecks(pls){
  const n=deckCount(),pool={};for(const u in SIEGE_PER_DECK)pool[u]=SIEGE_PER_DECK[u]*n;
  for(const pl of pls){const P=G.p[pl];if(P.tribe!=="beginner")continue;
    for(const u in BEGINNER_KIT)for(let i=0;i<BEGINNER_KIT[u]&&pool[u]>0;i++){P.deck.push(mkUnit(u,pl));pool[u]--}
    shuffle(P.deck)}
  for(const u in pool)for(let i=0;i<pool[u];i++)G.ether.push(mkUnit(u,null));
}

/* ---------- small helpers ---------- */
const tnOf=pl=>G.p[pl]?G.p[pl].tn||0:0;                       // a player's own turn count
const shotReady=(card,pl)=>(card.readyAt||0)<=tnOf(pl);
const repLocked=st=>st.repLock!=null&&tnOf(st.owner)<st.repLock;   // a Repairman is at work: nobody fires from the base
const healerOf=st=>st.cards.find(c=>c.unit==="healer");
const repairOf=st=>st.cards.find(c=>c.unit==="repair");
const isShooter=c=>!!(c&&c.unit&&UNIT[c.unit].shooter);
function shieldUp(st){const h=healerOf(st);return !!h&&(h.shieldAt||0)<=G.moon.round&&tnOf(st.owner)>=(h.shieldOff||0)}
function breakShield(st,r,c){const h=healerOf(st),d=R(4);h.shieldAt=G.moon.round+d;
  log(`The Healer's shield on ${coord(r,c)} turns the whole blow and breaks; it comes back in ${d} round${d>1?"s":""} (1d4).`,"event");notify(st.owner,`A Healer's shield breaks on ${coord(r,c)}.`)}
function giveMana(pl,n){let got=0;for(let i=0;i<n&&mana(pl)<surCap(pl);i++){const j=G.ether.findIndex(c=>/^\d+$/.test(c.rank));const c=j>=0?G.ether.splice(j,1)[0]:mk(String(2+Math.floor(Math.random()*9)),pick(["S","H","D","C"]));if(addSoul(pl,c))got++}return got}
const enemyWalls=pl=>enemiesOf(pl).flatMap(stacksOf).some(x=>hasK(x.st,"wall"));

/* ---------- capture slots ---------- */
// support cards standing alone (and a lone Cannon) can't defend themselves: an enemy beside them takes one or destroys one
const lonely=t=>!hasBase(t)&&t.cards.every(c=>c.unit&&(UNIT[c.unit].sup||c.unit==="cannon"));
const CAPT_ORDER=["cannon","healer","repair","ram","miner"];
const captureCard=t=>[...t.cards].sort((a,b)=>CAPT_ORDER.indexOf(a.unit)-CAPT_ORDER.indexOf(b.unit))[0];
function canCapture(A,t){const x=captureCard(t);if(x.unit==="ram")return stackLegal([...A.cards,x]);return !A.captive}
function takeCaptive(A,x){x.capturedFrom=x.owner;x.owner=A.owner;x.inSlot=null;x.readyAt=0;A.captive=x}
function freeCaptive(st,r,c){const x=st.captive;if(!x)return;st.captive=null;const o=x.capturedFrom;
  if(o!=null&&G.p[o]&&!G.p[o].out&&!G.board[r][c]&&!isVoid(r,c)){x.owner=o;x.capturedFrom=null;G.board[r][c]={owner:o,cards:[x],moved:true,attacked:true};log(`The captured ${esc(nameOf(x))} on ${coord(r,c)} breaks free and goes back to ${plName(o)}.`)}
  else{toGrave(x,"death")}}
function takeSupport(r1,c1,r2,c2,mode){
  const A=G.board[r1][c1],T=G.board[r2][c2],x=captureCard(T),from=T.owner;A.attacked=true;G.lastAttack=G.turnNo;
  if(A.ambush)A.ambush=false;
  T.cards.splice(T.cards.indexOf(x),1);if(!T.cards.length)G.board[r2][c2]=null;
  if(mode==="destroy"){log(`<b>${plName(A.owner)}</b> destroys ${plName(from)}'s ${esc(nameOf(x))} on ${coord(r2,c2)}.`,"combat");bury(x,r2,c2,T)}
  else if(x.unit==="ram"){x.owner=A.owner;A.cards.push(x);log(`<b>${plName(A.owner)}</b> captures ${plName(from)}'s Battering Ram on ${coord(r2,c2)}: it joins the stack on ${coord(r1,c1)}.`,"combat")}
  else{takeCaptive(A,x);log(`<b>${plName(A.owner)}</b> captures ${plName(from)}'s ${esc(nameOf(x))} on ${coord(r2,c2)} into the capture slot of the stack on ${coord(r1,c1)}.`,"combat")}
  if(!G.board[r2][c2])freeCaptive(T,r2,c2);
  checkWin();return{win:true,line:""};
}
/* where a captive can be set to work: beside the stack (an empty tile, or a stack of yours it can join) */
function releaseSpots(st,r,c){const x=st.captive,out=[];if(!x)return out;
  for(const [dr,dc] of [[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const rr=r+dr,cc=c+dc;if(rr<0||cc<0||rr>=G.rows||cc>=COLS||isVoid(rr,cc))continue;const t=G.board[rr][cc];
    if(!t&&(dr||dc))out.push([rr,cc]);else if(t&&t.owner===st.owner&&stackLegal([...t.cards,x]))out.push([rr,cc])}
  return out}
function release(r,c,rr,cc){const st=G.board[r][c],x=st.captive;st.captive=null;x.owner=st.owner;x.capturedFrom=null;const t=G.board[rr][cc];
  if(t)t.cards.push(x);else G.board[rr][cc]={owner:st.owner,cards:[x],moved:true,attacked:true};
  log(`${plName(st.owner)} sets the captured ${esc(nameOf(x))} to work on ${coord(rr,cc)}: it is theirs now.`)}

/* ---------- Archers: Suppress ---------- */
function suppress(r1,c1,r2,c2,opt){
  const A=G.board[r1][c1],D=G.board[r2][c2],d=R(2),w=R(2);A.attacked=true;G.lastAttack=G.turnNo;if(A.ambush)A.ambush=false;
  opt.card.readyAt=tnOf(A.owner)+d+1;D.supp={n:w};
  tray(A.owner,"Suppress",[{s:2,v:d},{s:2,v:w}],`rest ${d} · ${w} turns`);
  log(`<b>${plName(A.owner)}</b>'s Archer on ${coord(r1,c1)} suppresses ${plName(D.owner)}'s stack on ${coord(r2,c2)}: disadvantage on its next attack, unless it waits out ${w} of its turns (1d2). The Archer rests for ${d} turn${d>1?"s":""} (1d2).`,"combat");
  return{win:false,line:""};
}

/* ---------- Walls ---------- */
function wallHit(r,c,n,why){const st=G.board[r][c];if(!st)return;const w=st.cards.find(x=>x.unit==="wall");if(!w)return;
  w.hp=Math.max(0,w.hp-n);
  if(w.hp>0){log(`${why}: the Wall on ${coord(r,c)} loses ${n} heart${n>1?"s":""} (${w.hp} left).`,"combat");return}
  const dead=st.cards.splice(0);G.board[r][c]=null;log(`${why}: the Wall on ${coord(r,c)} falls, and every card inside it dies with it.`,"event");
  for(const d of dead)bury(d,r,c,st);freeCaptive(st,r,c);checkWin();
}
function ramWall(r1,c1,r2,c2){const A=G.board[r1][c1];A.attacked=true;G.lastAttack=G.turnNo;if(A.ambush)A.ambush=false;SND.gun();
  log(`<b>${plName(A.owner)}</b>'s Battering Ram on ${coord(r1,c1)} slams into the Wall on ${coord(r2,c2)}.`,"combat");wallHit(r2,c2,2,"The Battering Ram");return{win:true,line:""}}

/* ---------- Healers ---------- */
function healTargets(st,r,c){const out=[];
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const t=at(r+dr,c+dc);if(!t||t.owner!==st.owner)continue;
    for(const x of t.cards)if(x.maxHp&&x.hp<x.maxHp&&!isBase(x))out.push({x,r:r+dr,c:c+dc})}
  return out}
const healReady=st=>{const h=healerOf(st);return !!h&&(h.healAt||0)<=tnOf(st.owner)&&shieldUp(st)};
function healAct(r,c,T){const st=G.board[r][c],h=healerOf(st),d=R(2)+2,n=tnOf(st.owner);T.x.hp++;h.healAt=n+d;h.shieldOff=n+3;
  tray(st.owner,"Heal",[{s:2,v:d-2}],`next heal in ${d}`);
  log(`${plName(st.owner)}'s Healer on ${coord(r,c)} heals ${esc(nameOf(T.x))} on ${coord(T.r,T.c)} (${T.x.hp}/${T.x.maxHp}). The shield is down for 3 turns, and the next heal waits ${d} turns (1d2 + 2).`)}

/* ---------- Repairmen ---------- */
function repairTargets(st,r,c){const out=[];
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const t=at(r+dr,c+dc);if(!t||t.owner!==st.owner||!hasBase(t)||repLocked(t))continue;
    const b=t.cards.find(isBase),k=kind(b),hp=b.hp||1,mx=b.maxHp||hp,R0=r+dr,C0=c+dc;
    if(hp<mx)out.push({t,b,r:R0,c:C0,act:"repair",label:`Repair the ${KNAME[k]} on ${coord(R0,C0)}`,sub:`+1 heart (${hp}/${mx})`});
    else if(k==="tree"&&mx<5)out.push({t,b,r:R0,c:C0,act:"upgrade",label:`Strengthen the Tree on ${coord(R0,C0)}`,sub:`${mx} → ${mx+1} hearts (five at most)`});
    else if(k==="ace"&&!b.upgraded)out.push({t,b,r:R0,c:C0,act:"aceup",label:`Upgrade the Ace on ${coord(R0,C0)}`,sub:`${mx} → ${mx+1} hearts, once; the Repairman gives his life and goes to the grave`})}
  return out}
const repairReady=st=>{const m=repairOf(st);return !!m&&(m.repAt||0)<=tnOf(st.owner)};
function repairAct(r,c,T){const st=G.board[r][c],m=repairOf(st),b=T.b,nm=KNAME[kind(b)];
  if(T.act==="aceup"){b.maxHp=(b.maxHp||2)+1;b.hp=(b.hp||2)+1;b.upgraded=true;st.cards.splice(st.cards.indexOf(m),1);m.owner=st.owner;toGrave(m,"death");
    if(!st.cards.length)G.board[r][c]=null;
    log(`${plName(st.owner)}'s Repairman gives his life to upgrade the Ace on ${coord(T.r,T.c)}: it now has ${b.maxHp} hearts.`,"event");return}
  const d=R(3)+1;if(T.act==="upgrade"){b.maxHp++;b.hp++}else b.hp++;m.repAt=tnOf(st.owner)+d;T.t.repLock=tnOf(T.t.owner)+d;
  tray(st.owner,"Repair",[{s:3,v:d-1}],`busy ${d}`);
  log(`${plName(st.owner)}'s Repairman ${T.act==="upgrade"?"strengthens":"repairs"} the ${nm} on ${coord(T.r,T.c)} (${b.hp}/${b.maxHp}). For ${d} turns (1d3 + 1) nothing fires from that base and it can't be repaired again.`)}

/* ---------- Miners and crystals ---------- */
const crystalAt=(r,c)=>(G.crystals||[]).find(x=>x.r===r&&x.c===c);
function centerTiles(){
  const rs=G.rows%2?[(G.rows-1)/2]:[G.rows/2-1,G.rows/2],cs=COLS%2?[(COLS-1)/2]:[COLS/2-1,COLS/2];
  let t=[];for(const r of rs)for(const c of cs)if(!isVoid(r,c))t.push([r,c]);
  if(!t.length){const all=[];for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++)if(!isVoid(r,c))all.push([r,c,Math.hypot(r-(G.rows-1)/2,c-(COLS-1)/2)]);
    all.sort((a,b)=>a[2]-b[2]);if(all.length)t=all.filter(x=>x[2]<=all[0][2]+.01).map(x=>[x[0],x[1]])}
  return t}
function spawnCrystal(){const free=centerTiles().filter(([r,c])=>!crystalAt(r,c));if(!free.length)return false;
  const [r,c]=pick(free);(G.crystals=G.crystals||[]).push({r,c,left:12,hue:pick([190,265,310,150,40])});
  log(`<b>A crystal cluster</b> rises on ${coord(r,c)}: 12 mana for a Miner to dig.`,"event");notify(null,`A crystal rises on ${coord(r,c)}.`);return true}
function crystalTick(){
  if(G.opts.crystals===false||G.phase==="setup")return;G.crystals=G.crystals||[];
  if(!G.crystalInit){G.crystalInit=true;if(hq())spawnCrystal();G.crystalNext=G.turnNo+R(6)+4;return}   // Headquarters opens with a crystal in the middle
  if(G.turnNo>=G.crystalNext){spawnCrystal();G.crystalNext=G.turnNo+R(6)+4}   // then one every 1d6 + 4 turns
}
/* the start of a player's turn: crystals, then Miners */
function siegeTurn(pl){
  crystalTick();
  if(!G.p[pl]||isHorde(pl))return;
  let got=0;const notes=[];
  for(const {st,r,c} of stacksOf(pl)){
    const ms=st.cards.filter(x=>x.unit==="miner");if(!ms.length)continue;
    const cr=crystalAt(r,c);
    if(hasK(st,"ace")){for(const m of ms)if(m.inSlot!=null&&m.inSlot<G.moon.round)got+=R(2)-(G.moon.gone==="jupiter"?0:1)}   // Jupiter: 1d2 instead of 1d2 − 1   // a miner slot: 1d2 − 1 a turn, from the round after it moves in
    else if(cr){if(R(2)===2){const take=Math.min(cr.left,1+R(3));cr.left-=take;got+=take;notes.push(`${take} from the crystal on ${coord(r,c)}${cr.left?` (${cr.left} left)`:"; the crystal is spent and gone"}`);if(!cr.left)G.crystals.splice(G.crystals.indexOf(cr),1)}}
    else for(const m of ms)if(R(6)===6)got++;   // out in the open: 1d6 − 5
  }
  if(got&&G.p[pl].minerX2!=null&&tnOf(pl)<=G.p[pl].minerX2)got*=2;   // Jupiter's eclipse: miners bring twice as much
  if(got){const n=giveMana(pl,got);log(`${plName(pl)}'s Miners bring in ${n} mana${notes.length?": "+notes.join("; "):""}${n<got?" (the soul pile is full)":""}.`)}
}
/* the end of a player's turn: Miners settle into their slots; suppression wears off */
function siegeEnd(pl){
  for(const {st,r,c} of stacksOf(pl)){
    const ace=hasK(st,"ace");for(const m of st.cards)if(m.unit==="miner"){if(ace){if(m.inSlot==null)m.inSlot=G.moon.round}else m.inSlot=null}
    if(st.supp){st.supp.n--;if(st.supp.n<=0){st.supp=null;log(`${plName(pl)}'s stack on ${coord(r,c)} shakes off the Archer's suppression.`)}}
  }
}

/* ---------- Field Libation ---------- */
function pourLibation(r,c,ids){
  const st=G.board[r][c];if(!st)return;const cards=st.cards.filter(x=>ids.has(x.id)&&canSacOnField(st,x));if(!cards.length)return;
  const d=[];let got=0,lost=0;
  for(const x of cards){st.cards.splice(st.cards.indexOf(x),1);const v=R(2);d.push({s:2,v});
    if(x.captured&&x.captured.length){for(const s of x.captured)toGrave(s,"death");x.captured=[]}
    if(v===2&&addSoul(G.active,x))got+=soulOf(x);else{toGrave(x,"spent");lost++}}
  if(!st.cards.length){G.board[r][c]=null;freeCaptive(st,r,c);G.sel=null}else if(G.sel)for(const x of cards)G.sel.pick.delete(x.id);
  tray(G.active,"Field Libation",d,`+${got} mana`);
  log(`<b>Field Libation</b> on ${coord(r,c)}: ${cards.length} card${cards.length>1?"s":""} poured out (1d2 each: ${d.map(x=>x.v).join(", ")}); +${got} mana, ${lost} to the grave for nothing.`);
  G.libPick=new Set();checkWin();
}

/* ---------- spells ---------- */
PRICE.carch=()=>R(2);PRICE.cheal=()=>2+R(3);
SPELLS.push(
 {id:"libation",name:"Field Libation",cost:0,school:"Necromancy",text:"Free, but not under the Full Moon. Your stacks show an X: select one, check the cards to pour out and press Pour. Each card rolls 1d2: a 2 gives you its soul's mana, a 1 sends it to the grave for nothing. Not a great move.",
  ok:()=>G.moon.i!==4&&!G.libation&&stacksOf(G.active).some(x=>x.st.cards.some(c=>canSacOnField(x.st,c))),run:async()=>{G.libation=true;G.libPick=new Set();log(`${plName(G.active)} prepares a Field Libation.`);if(!me().cpu)flash("Field Libation: select one of your stacks marked with an X, check the cards, then press Pour.")}},
 {id:"carch",dice:"1d2",name:"Archer Conjure",cost:1,school:"Conjuring",text:"An Archer's soul comes from the Ether into your deck. 1d20 + 1d10 at a stack exactly two tiles away (straight or diagonal); a miss costs nothing; no defense. Suppress instead: the target attacks with disadvantage next time. Stacks alone, with a Queen, or inside an Ace, the Tree or a Wall. 1 mana for the Beginner.",ok:()=>etherHasU("archer"),run:()=>conjureU("archer")},
 {id:"ccan",name:"Cannon Conjure",cost:6,school:"Conjuring",text:"A Cannon's soul comes from the Ether into your deck. 2d20 at anything up to three tiles away, once every 1d2 + 2 turns; a miss costs nothing; two damage to a Wall; no defense. Stands alone or inside a base; moves one step.",ok:()=>etherHasU("cannon"),run:()=>conjureU("cannon")},
 {id:"cheal",dice:"2+1d3",name:"Healer Conjure",cost:3,school:"Conjuring",text:"A Healer's soul comes from the Ether into your deck. Its blue shield turns one blow from its stack, then comes back in 1d4 rounds; or it heals one heart of a card in its stack or beside it. Stacks with anything but a Queen.",ok:()=>etherHasU("healer"),run:()=>conjureU("healer")},
 {id:"cwall",name:"Wall Conjure",cost:4,school:"Conjuring",text:"A Wall's soul comes from the Ether into your deck. Five hearts and defense 10; it holds six cards like an Ace, but only ranged cards fire from it (one shot a turn). It never moves.",ok:()=>etherHasU("wall"),run:()=>conjureU("wall")},
 {id:"crep",name:"Repairman Conjure",cost:2,school:"Conjuring",text:"A Repairman's soul comes from the Ether into your deck. He repairs a Wall, an Ace or the Tree in his stack or beside it, then rests 1d3 + 1 turns. He can also upgrade an Ace once, giving his life for it.",ok:()=>etherHasU("repair"),run:()=>conjureU("repair")},
 {id:"cram",name:"Battering Ram Conjure",cost:3,school:"Conjuring",text:"A Battering Ram's soul comes from the Ether into your deck. Worked by one or two Grunts, Infantry or Puppets, it does two damage to a Wall beside it, no roll. It does nothing else.",ok:()=>etherHasU("ram"),run:()=>conjureU("ram")},
 {id:"cmine",name:"Miner Conjure",cost:2,school:"Conjuring",text:"A Miner's soul comes from the Ether into your deck. In one of an Ace's two miner slots it brings 1d2 − 1 mana every turn, from the next round on; on a crystal it digs for 1 + 1d3; anywhere else it finds 1 mana on a 6.",ok:()=>etherHasU("miner"),run:()=>conjureU("miner")}
);

/* ---------- the board ---------- */
function crystalHTML(r,c,under){const x=crystalAt(r,c);if(!x)return "";
  return `<span class="crys${under?" under":""}" style="--ch:${x.hue}" title="Crystal: ${x.left} mana left"><svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M-7,8L-9,-1L-5,-6L-3,8Z M-3,8L-2,-9L2,-11L3,8Z M3,8L4,-4L8,-7L9,8Z" /><path class="cl" d="M-2,-9L0,6 M4,-4L6,6 M-5,-6L-6,6"/></svg><i class="cbar"><b style="width:${Math.round(x.left/12*100)}%"></b></i></span>`}
function siegeDecor(inner,st,V,r,c){
  const cls=[],b=[],mine=st.owner===V;
  if(shieldUp(st))cls.push("hshield");else if(st.mars)cls.push("marsadv");
  if(st.mars)b.push(`<span class="supp" style="color:#c2401c" title="Mars: advantage on its next attack">♂</span>`);
  if(hasBase(st)&&repLocked(st)){cls.push("replock");b.push(`<span class="rlock" title="A Repairman is at work: nothing fires from here for ${st.repLock-tnOf(st.owner)} more turn(s)">${unitSVG("repair","#2a2016",34)}<em>${st.repLock-tnOf(st.owner)}</em></span>`)}
  if(st.captive)b.push(`<span class="capt" title="Captured: ${esc(nameOf(st.captive))}">⛓${unitSVG(st.captive.unit,"#5b3a1a",12)}</span>`);
  if(st.supp)b.push(`<span class="supp" title="Suppressed: disadvantage on its next attack (${st.supp.n} turn${st.supp.n>1?"s":""})">▼${st.supp.n}</span>`);
  if(mine){const sh=st.cards.find(isShooter);if(sh&&!shotReady(sh,st.owner))b.push(`<span class="cd" title="The ${esc(UNIT[sh.unit].name)} rests ${sh.readyAt-tnOf(st.owner)} more turn(s)">⟳${sh.readyAt-tnOf(st.owner)}</span>`)}
  if(G.libation&&st.owner===G.active&&V===G.active&&G.phase==="prep"&&st.cards.some(x=>canSacOnField(st,x))){cls.push("libx");b.push(`<span class="xmark" aria-hidden="true">✕</span>`)}
  if(!cls.length&&!b.length)return inner;
  let h=cls.length?inner.replace('class="stack ',`class="stack ${cls.join(" ")} `):inner;
  if(b.length&&h.endsWith("</div>"))h=h.slice(0,-6)+b.join("")+"</div>";
  return h;
}
/* the selection box: Heal, Repair, Release, Field Libation, and what each support card is waiting for */
function siegeActs(st,mine,s){
  const out=[],prep=mine&&G.phase==="prep",n=tnOf(st.owner),info=[];
  const h=healerOf(st);if(h)info.push(shieldUp(st)?"Healer: shield up":`Healer: shield ${(h.shieldAt||0)>G.moon.round?`back in ${h.shieldAt-G.moon.round} round(s)`:`down for ${(h.shieldOff||0)-n} turn(s)`}`+((h.healAt||0)>n?` · heal in ${h.healAt-n} turn(s)`:""));
  const m=repairOf(st);if(m&&(m.repAt||0)>n)info.push(`Repairman rests ${m.repAt-n} turn(s)`);
  if(hasBase(st)&&repLocked(st))info.push(`Under repair: nothing fires from this base for ${st.repLock-n} turn(s)`);
  const sh=st.cards.find(isShooter);if(sh&&!shotReady(sh,st.owner))info.push(`${UNIT[sh.unit].name} rests ${sh.readyAt-n} turn(s)`);
  if(st.captive)info.push(`Capture slot: ${esc(nameOf(st.captive))}`);
  if(st.supp)info.push(`Suppressed: disadvantage on its next attack (${st.supp.n} turn(s))`);
  const ms=st.cards.filter(x=>x.unit==="miner");if(ms.length)info.push(hasK(st,"ace")?`Miner slots ${ms.length}/2`+(ms.some(x=>x.inSlot==null||x.inSlot>=G.moon.round)?" · mining from next round":""):crystalAt(s.r,s.c)?"Miner on a crystal":"Miner out in the open (1 mana on a 6)");
  if(info.length)out.push(`<p class="sinfo">${info.join(" · ")}</p>`);
  if(prep){
    if(healReady(st)&&healTargets(st,s.r,s.c).length)out.push(`<button class="btn ghost sm" id="healBtn">Heal a heart</button>`);
    if(repairReady(st)&&repairTargets(st,s.r,s.c).length)out.push(`<button class="btn ghost sm" id="repBtn">Repair</button>`);
    if(st.captive&&releaseSpots(st,s.r,s.c).length)out.push(`<button class="btn ghost sm" id="relBtn">Set the captive to work</button>`);
    if(G.libation&&st.cards.some(x=>canSacOnField(st,x))){const L=G.libPick||(G.libPick=new Set());
      out.push(`<div class="libbox"><p><b>Field Libation</b>: check the cards to pour out.</p>${st.cards.filter(x=>canSacOnField(st,x)).map(x=>`<label><input type="checkbox" data-lib="${x.id}" ${L.has(x.id)?"checked":""}> ${esc(nameOf(x))} (${soulOf(x)} mana on a 2)</label>`).join("")}<button class="btn sm" id="pourBtn" ${L.size?"":"disabled"}>Pour</button> <button class="btn ghost sm" id="libDone">Done</button></div>`)}
  }
  return out;
}
function wireSiege(st,s){
  const go=async(spec)=>{G.busy=true;const v=await askHuman(G.active,spec);G.busy=false;return v};
  if($("#healBtn"))$("#healBtn").onclick=async()=>{if(!canAct())return;const ts=healTargets(st,s.r,s.c);
    const id=ts.length===1?"0":await go({kind:"choice",title:"Heal which card?",options:ts.map((t,i)=>({id:String(i),label:`${nameOf(t.x)} on ${coord(t.r,t.c)}`,sub:`${t.x.hp}/${t.x.maxHp} hearts`})),cancel:"Cancel"});
    if(id!=null&&ts[id])healAct(s.r,s.c,ts[id]);render()};
  if($("#repBtn"))$("#repBtn").onclick=async()=>{if(!canAct())return;const ts=repairTargets(st,s.r,s.c);
    const id=await go({kind:"choice",title:"What does the Repairman do?",options:ts.map((t,i)=>({id:String(i),label:t.label,sub:t.sub})),cancel:"Cancel"});
    if(id!=null&&ts[id])repairAct(s.r,s.c,ts[id]);if(G.sel&&!G.board[G.sel.r][G.sel.c])G.sel=null;render()};
  if($("#relBtn"))$("#relBtn").onclick=async()=>{if(!canAct())return;const sp=releaseSpots(st,s.r,s.c);
    const id=await go({kind:"choice",title:`Where does the ${nameOf(st.captive)} go?`,options:sp.map(([r,c],i)=>({id:String(i),label:coord(r,c),sub:G.board[r][c]?"join your stack there":"an empty tile"})),cancel:"Cancel"});
    if(id!=null&&sp[id])release(s.r,s.c,sp[id][0],sp[id][1]);render()};
  document.querySelectorAll("[data-lib]").forEach(i=>i.onchange=()=>{const L=G.libPick||(G.libPick=new Set()),id=+i.dataset.lib;i.checked?L.add(id):L.delete(id);render()});
  if($("#pourBtn"))$("#pourBtn").onclick=()=>{if(!canAct())return;pourLibation(s.r,s.c,G.libPick||new Set());render()};
  if($("#libDone"))$("#libDone").onclick=()=>{G.libation=false;G.libPick=null;render()};
}

/* ---------- the computer ---------- */
async function aiSiege(pl,W,cast1){
  const P=G.p[pl],lv=P.cpu;if(G.over||isHorde(pl))return;
  for(const {st,r,c} of stacksOf(pl)){
    if(G.board[r][c]!==st)continue;
    if(healReady(st)){const t=healTargets(st,r,c).sort((a,b)=>rate(b.x)-rate(a.x))[0];if(t){healAct(r,c,t);render();await sleep(300)}}
    if(G.board[r][c]===st&&repairReady(st)){const ts=repairTargets(st,r,c);const t=ts.find(x=>x.act==="repair")||ts.find(x=>x.act==="upgrade")||(lv==="hard"&&Math.random()<.3?ts.find(x=>x.act==="aceup"):null);if(t){repairAct(r,c,t);render();await sleep(300)}}
    if(G.board[r][c]===st&&st.captive){const sp=releaseSpots(st,r,c);if(sp.length){const x=st.captive;let b=sp.find(([rr,cc])=>!(rr===r&&cc===c))||sp[0];
      if(x.unit==="miner"){const a=sp.find(([rr,cc])=>G.board[rr][cc]&&hasK(G.board[rr][cc],"ace"));if(a)b=a}
      if(x.unit==="ram"){const a=sp.find(([rr,cc])=>G.board[rr][cc]);if(a)b=a;else b=null}
      if(b){release(r,c,b[0],b[1]);render();await sleep(300)}}}
  }
  await aiMiners(pl);
  if(Math.random()>(lv==="easy"?.5:.9))return;
  const all=[...P.hand,...P.deck,...stacksOf(pl).flatMap(x=>x.st.cards)],count=u=>all.filter(c=>c.unit===u).length,m=()=>mana(pl);
  const slots=stacksOf(pl).filter(x=>hasK(x.st,"ace")).length*2-count("miner");
  const hurt=stacksOf(pl).some(x=>{const b=x.st.cards.find(isBase);return b&&(b.hp||1)<(b.maxHp||1)});
  if((slots>0||(G.crystals||[]).length&&count("miner")<slots+3)&&m()>=3&&Math.random()<(lv==="easy"?.2:.45))await cast1("cmine");
  if(count("archer")<(lv==="hard"?3:2)&&m()>=3&&Math.random()<.5)await cast1("carch");
  if(W&&W.def>1&&count("wall")<1&&m()>=5&&Math.random()<.35)await cast1("cwall");
  if(enemyWalls(pl)&&count("ram")<1&&m()>=4)await cast1("cram");
  if(hurt&&count("repair")<1&&m()>=3)await cast1("crep");
  if(count("healer")<1&&m()>=6&&Math.random()<.3)await cast1("cheal");
  if(lv==="hard"&&count("cannon")<1&&m()>=8&&Math.random()<.35)await cast1("ccan");
}
/* the computer keeps the support cards it has a use for */
function keepSupport(pl,c){const u=c.unit;if(!u)return false;const mine=stacksOf(pl);
  if(u==="miner")return mine.some(x=>hasK(x.st,"ace")&&x.st.cards.filter(y=>y.unit==="miner").length<2)||(G.crystals||[]).length>0;
  if(u==="repair")return mine.some(x=>hasBase(x.st));
  if(u==="ram")return enemyWalls(pl);
  return u==="healer"||u==="wall"||u==="cannon"||u==="archer";
}
/* lone Miners walk to a crystal, or home to an Ace with a free slot */
async function aiMiners(pl){
  for(const {st,r,c} of stacksOf(pl)){
    if(G.board[r][c]!==st||st.moved||!st.cards.every(x=>x.unit==="miner")||crystalAt(r,c))continue;
    const goals=[];for(const x of G.crystals||[]){const t=G.board[x.r][x.c];if(!t||t.owner===pl&&stackLegal([...t.cards,...st.cards]))goals.push([x.r,x.c])}
    if(!goals.length)for(const a of stacksOf(pl))if(hasK(a.st,"ace")&&stackLegal([...a.st.cards,...st.cards]))goals.push([a.r,a.c]);
    if(!goals.length)continue;
    G.sel={r,c,pick:new Set(st.cards.map(x=>x.id))};const tg=moveTargets();
    const d=(a,b)=>Math.min(...goals.map(([gr,gc])=>Math.abs(gr-a)+Math.abs(gc-b)));
    const here=d(r,c);let best=null;
    for(const [rr,cc] of tg){const danger=enemiesOf(pl).flatMap(stacksOf).some(e=>Math.abs(e.r-rr)+Math.abs(e.c-cc)===1);const s=d(rr,cc)+(danger?1.5:0);if(s<here&&(!best||s<best.s))best={rr,cc,s}}
    if(best){doMove(best.rr,best.cc);render();await sleep(300)}
    G.sel=null;
  }
}

/* ---------- symbols ---------- */
Object.assign(UNIT_ICON,{
 archer:`<path d="M-5,-10C3,-6 3,6 -5,10 M-5,-10L-5,10 M-10,0H8 M5,-3L8,0L5,3 M-10,0L-12,-2.5 M-10,0L-12,2.5"/>`,
 cannon:`<path d="M-9,1L5,-7L8,-2L-6,5Z M8,-2L10,-4 M-4,6a3,3 0 1,0 0.1,0Z M4,4L4,9"/>`,
 healer:`<path d="M-3,-9H3V-3H9V3H3V9H-3V3H-9V-3H-3Z"/>`,
 repair:`<path d="M-9,-4L-3,-10L1,-6L-5,0Z M-2,-3L9,8 M7,10L11,6"/>`,
 ram:`<path d="M-11,-2H6L10,-4V4L6,2H-11Z M-7,2V7 M2,2V7 M-9,7H4 M-7,-2V-7 M2,-2V-7 M-9,-7H4"/>`,
 miner:`<path d="M-10,-3C-5,-9 5,-9 10,-3 M0,-7V10"/>`,
 wall:`<path d="M-10,9V-3H-7V-7H-4V-3H-1V-7H2V-3H5V-7H8V-3H10V9Z M-10,3H10 M-4,3V9 M4,3V9 M0,-3V3"/>`
});

/* ---------------- Prompt 9: the Bank, loans and mana debt, selling cards, Gambling, max mana, Mystery Generation,
   Barbarians, the meteor and its fire, the Banker's heart ---------------- */

/* ---------- the two sides nobody plays: the Barbarians and the Bank ----------
   They sit at the end of G.p with no seat, no deck and no mana, and act at the start of every round. */
const isNPC=pl=>!!(G&&G.p[pl]&&G.p[pl].cpu==="npc");
const npcIx=k=>G.p.findIndex(P=>P.npc===k);
function addNPCs(){
  G.bank={mana:0,dead:false,owes:[],buys:{},upsell:{},angry:false};
  if(G.opts.bankStart){const d=rollN(2*G.p.length,2);G.bank.mana=sum(d);G.bank.startRoll=d}
  if(survival())return;
  for(const [k,name,color,solid] of [["barb","The Barbarian Band","#b3172c","dodeca"],["bank","The Bank","#d4a72c","octa"]]){
    const i=G.p.length,P=mkPlayer(i,{name,color,solid,cpu:"npc"});P.npc=k;P.team=100+i;G.p.push(P);
    G.map.seats[i]={side:"none",rot:0,fwd:[0,0],back:[],zone:[]};
  }
}

/* ---------- mana that can go below zero ----------
   Souls are mana you hold; debt is mana you owe the Bank. Every soul that comes in pays the debt first.
   Below −3 × your maximum you lose at once. */
const debtOf=pl=>G.p[pl]?G.p[pl].debt||0:0;
const effMana=pl=>mana(pl)-debtOf(pl);
const floorOf=pl=>-3*soulCap(pl);
const bankOpen=()=>!!G.bank&&!G.bank.dead;
function bankAdd(n){if(G.bank)G.bank.mana+=n}
function payQuiet(pl,n){const P=G.p[pl];P.souls.sort((a,b)=>soulOf(a)-soulOf(b));let paid=0;
  while(paid<n&&P.souls.length){const i=P.souls.findIndex(c=>soulOf(c)>=n-paid);const c=i>=0?P.souls.splice(i,1)[0]:P.souls.shift();paid+=soulOf(c);toGrave(c,"spent")}
  return paid}
function addDebt(pl,n){const P=G.p[pl];const paid=payQuiet(pl,Math.min(n,mana(pl)));bankAdd(paid);const rest=n-paid;
  if(rest>0){P.debt=(P.debt||0)+rest;if(P.debtAt==null)P.debtAt=tnOf(pl)+R(2)}
  checkDebt(pl)}
function checkDebt(pl){if(!G||G.over||!G.p[pl]||G.p[pl].out||isHorde(pl))return;
  if(effMana(pl)<floorOf(pl))eliminate(pl,`${esc(G.p[pl].name)} sank below −${-floorOf(pl)} mana, and the Bank takes everything`)}
const creditOn=pl=>!!G.p[pl].credit&&bankOpen();
function canAfford(pl,n){return mana(pl)>=n||creditOn(pl)&&effMana(pl)-n>=floorOf(pl)}
/* spending on a spell: souls first, the rest on credit; whatever is paid goes to the Bank */
function spend(pl,n){const have=mana(pl);
  if(have>=n){pay(pl,n);bankAdd(n);return}
  if(have)pay(pl,have);bankAdd(have);
  const P=G.p[pl];P.debt=(P.debt||0)+(n-have);if(P.debtAt==null)P.debtAt=tnOf(pl)+R(2);if(pl===G.active)G.spent=true;
  log(`${plName(pl)} spends ${n-have} mana on credit (${effMana(pl)}/${soulCap(pl)}).`);checkDebt(pl)}
function noteBuy(id){const B=G.bank;if(!B)return;const r=G.moon.round;(B.buys[r]=B.buys[r]||{})[id]=(B.buys[r][id]||0)+1}

/* ---------- prices: the Bank's upsells, the angry Banker, Ether sales, the collapse ---------- */
function spellCost(sp){
  let c=baseCost(sp);const B=G.bank;if(!B)return c;
  if(c>0){c+=(B.upsell[sp.id]||0)+(B.angry?1:0);if(G.inflation&&G.turnNo<=G.inflation.until)c+=G.inflation.add||0}
  c=jupiterCost(sp,c);c=mercuryCost(sp,c);
  if(sp.school==="Conjuring"&&c>0){
    if(B.mana<0&&!B.dead)c=Math.max(1,c-1);   // the Bank is broke: the Ether goes on sale
    const P=G.p[G.active];if(P&&P.saleUntil!=null&&tnOf(G.active)<=P.saleUntil)c=Math.max(0,c-1);   // a Barbarian-slayer's private sale
  }
  return Math.max(0,c);
}

/* ---------- loans ---------- */
function loanLimit(pl){if(!bankOpen()||isHorde(pl))return 0;const e=effMana(pl),cap=soulCap(pl);
  let lim=e<=-cap?5:e<0?6:12;   // the Bank won't lend seven or more to someone already below zero
  return Math.max(0,Math.min(lim,G.bank.mana,surCap(pl)-mana(pl)+debtOf(pl)))}
const loanRate=pl=>effMana(pl)<=-soulCap(pl)?.3:.2;
function takeLoan(pl,n){const P=G.p[pl];n=Math.min(n,loanLimit(pl));if(n<=0)return 0;
  G.bank.mana-=n;const got=giveMana(pl,n),t=tnOf(pl);
  (P.loans=P.loans||[]).push({owed:n,at:t+R(2),due:t+4});
  log(`<b>The Bank</b> lends ${plName(pl)} ${n} mana (${Math.round(loanRate(pl)*100)}% interest every 1d2 turns; due in 4 turns).`,"event");return got}
function owedOf(pl){return (G.p[pl].loans||[]).reduce((a,L)=>a+L.owed,0)}
function repay(pl,n){const P=G.p[pl];n=Math.min(n,mana(pl),owedOf(pl));if(n<=0)return 0;const paid=payQuiet(pl,n);bankAdd(paid);let left=paid;
  for(const L of [...P.loans]){const k=Math.min(L.owed,left);L.owed-=k;left-=k;if(L.owed<=0)P.loans.splice(P.loans.indexOf(L),1);if(!left)break}
  log(`${plName(pl)} pays the Bank ${paid} mana${P.loans.length?` (${owedOf(pl)} still owed)`:"; every loan is settled"}.`);return paid}
/* selling to the Bank: cards from your hand or deck go to the Ether for their conjuring price */
function sellCards(pl,cards){const P=G.p[pl];let price=0;
  for(const c of cards){const L=P.hand.includes(c)?P.hand:P.deck;L.splice(L.indexOf(c),1);price+=costOf(c)||1;c.owner=null;if(c.hp!=null)c.hp=c.maxHp;G.ether.push(c)}
  shuffle(P.deck);const got=giveMana(pl,price);G.bank.mana-=got;
  log(`${plName(pl)} sells ${cards.length} card${cards.length>1?"s":""} to the Bank for ${got} mana${got<price?` (${price-got} more would not fit in the soul pile)`:""}; the deck is reshuffled.`,"event");return got}
function sellThrall(pl){const P=G.p[pl];const c=(P.thralls||[]).shift();if(!c)return;c.owner=null;G.ether.push(c);const got=giveMana(pl,1);G.bank.mana-=got;
  log(`${plName(pl)} sells a thrall to the Bank (+${got} mana).`)}

/* ---------- the start of a player's turn: interest, loans coming due, fire, Barbarians ---------- */
function bankTurn(pl){
  barbTick();
  const P=G.p[pl];if(!P||isHorde(pl)||!G.bank)return;
  const n=tnOf(pl),rate=loanRate(pl);
  if(bankOpen()){
    for(const L of P.loans||[])if(n>=L.at){const add=Math.max(1,Math.ceil(L.owed*rate));L.owed+=add;L.at=n+R(2);log(`Interest: ${plName(pl)}'s loan grows by ${add} (${Math.round(rate*100)}%) to ${L.owed}.`)}
    if(P.debt>0&&P.debtAt!=null&&n>=P.debtAt){const add=Math.max(1,Math.ceil(P.debt*rate));P.debt+=add;P.debtAt=n+R(2);log(`Interest: ${plName(pl)}'s mana debt grows by ${add} to −${P.debt}.`)}
    for(const L of [...(P.loans||[])])if(n>=L.due){P.loans.splice(P.loans.indexOf(L),1);const take=payQuiet(pl,Math.min(mana(pl),L.owed));bankAdd(take);
      if(take<L.owed){const P2=G.p[pl];P2.debt=(P2.debt||0)+L.owed-take;if(P2.debtAt==null)P2.debtAt=n+R(2)}
      log(`A loan comes due: ${plName(pl)} turns in ${take} of ${L.owed} mana${take<L.owed?`; the other ${L.owed-take} become mana debt (${effMana(pl)})`:""}.`,"event")}
  }
  if(P.saleUntil!=null&&n>P.saleUntil){P.saleUntil=null;log(`${plName(pl)}'s Ether sale ends.`)}
  // the meteor's fire
  if(P.tribe!=="firm")for(const {st,r,c} of stacksOf(pl))if(fireAt(r,c)&&R(20)===20){log(`The meteor's fire on ${coord(r,c)} burns ${plName(pl)}'s stack.`,"event");damage(r,c,1,false)}
  checkDebt(pl);
}

/* ---------- the start of each round ---------- */
async function econRound(){
  const B=G.bank;if(!B||G.over)return;
  // the Banker's heart: one in a thousand
  if(!B.dead&&G.moon.round>1&&Math.random()<.001){B.dead=true;
    log(`<b>The Banker dies of a heart attack.</b> The Bank closes and the Ether shuts its doors: nothing more can be conjured or borrowed.`,"event");
    popup("The Banker is dead",`<p>The Banker clutches his chest and falls over the ledger. A heart attack.</p><p>The Bank is closed and the Ether shuts its doors: no more conjuring, no loans, no selling. What is owed stays owed, but no more interest is charged.</p>`)}
  // upsells: a spell bought more than twice in each of the last two rounds costs 1d2 − 1 more
  const r=G.moon.round,a=B.buys[r-1]||{},b=B.buys[r-2]||{},ups=[];B.upsell={};
  for(const id in a)if(a[id]>2&&(b[id]||0)>2){const v=R(2)-1;if(v){B.upsell[id]=v;const sp=SP(id);if(sp)ups.push(sp.name)}}
  if(ups.length)log(`<b>The Bank upsells</b> what everyone keeps buying: ${ups.join(", ")} cost 1 more this round.`,"event");
  // fire burns out; the meteor, one chance in a hundred
  G.fires=(G.fires||[]).filter(f=>f.until>=r);
  if(r>1&&Math.random()<(G.forceMeteor?1:.01)){G.forceMeteor=false;meteor()}
  if(G.over)return;
  // a Blood Moon brings the Barbarians
  if(G.moon.blood&&G.moon.i===4&&npcIx("barb")>=0&&G.opts.barbarians!==false)spawnBarbarians(true);
  // Saturn taxes the Bank too
  if(G.moon.gone==="saturn"&&G.saturnBy!=null&&!G.p[G.saturnBy].out&&!B.dead){const n=1+(G.saturnDebt||0);B.mana-=n;const got=giveMana(G.saturnBy,n);log(`The Bank pays Saturn's tax: ${n} mana (${plName(G.saturnBy)} gets ${got}).`)}
  // the Bank pays back what it borrowed, with interest
  for(const o of [...B.owes]){if(r>=o.at){o.owed=Math.ceil(o.owed*1.2);o.at=r+2}
    if(B.mana>=o.owed&&!G.p[o.to].out){B.mana-=o.owed;const got=giveMana(o.to,o.owed);B.owes.splice(B.owes.indexOf(o),1);log(`The Bank pays ${plName(o.to)} back ${o.owed} mana (${got} fit in the soul pile).`,"event")}}
  // a broke Bank asks the richest player for a loan
  if(B.mana<0&&!B.dead&&!B.owes.length){
    const need=-B.mana+R(3);
    for(const pl of alive().filter(i=>!isHorde(i)&&mana(i)>=need).sort((x,y)=>mana(y)-mana(x))){
      const yes=await ask(pl,{kind:"yesno",id:"bankloan",title:`The Bank asks ${esc(G.p[pl].name)} for a loan`,text:`The Bank is ${-B.mana} mana in the red and the Ether is on sale. Lend it ${need} mana? It pays back 20% more every two rounds until it can pay, but if the Bank collapses the mana is gone.`,yes:`Lend ${need}`,no:"Refuse",ai:()=>mana(pl)>=need+4&&Math.random()<.6});
      if(yes){const paid=payQuiet(pl,need);B.mana+=paid;B.owes.push({to:pl,owed:paid,at:r+2});log(`${plName(pl)} lends the Bank ${paid} mana.`,"event");break}
    }
  }
  await bankCollectors();if(G.over)return;
  await barbAct();if(G.over)return;
  // the collapse: the Bank 12 in the red and every player 6 in the red
  const pls=alive().filter(i=>!isHorde(i));
  if(!B.dead&&B.mana<=-12&&pls.length&&pls.every(i=>effMana(i)<=-6))collapse();
  render();
}

/* ---------- the collapse ---------- */
function collapse(){
  const B=G.bank;
  log(`<b>The Bank collapses.</b> Everyone starts again from nothing.`,"event");
  for(const pl of alive().filter(i=>!isHorde(i))){const P=G.p[pl];
    for(const c of P.souls.splice(0))toGrave(c,"spent");P.debt=0;P.debtAt=null;P.loans=[];
    P.maxAdd=(P.maxAdd||0)+(3-soulCap(pl));   // the maximum falls to three
    let gone=0;for(let i=0;i<5&&P.deck.length;i++){const c=P.deck.splice(Math.floor(Math.random()*P.deck.length),1)[0];c.owner=null;G.ether.push(c);gone++}
    if(!gone){for(let i=0;i<2;i++){const all=stacksOf(pl).flatMap(x=>x.st.cards.filter(c=>!isBase(c)).map(c=>({c,x})));if(!all.length)break;const {c,x}=pick(all);x.st.cards.splice(x.st.cards.indexOf(c),1);if(!x.st.cards.length)G.board[x.r][x.c]=null;c.owner=null;G.ether.push(c)}}
    const a=stacksOf(pl).find(x=>hasK(x.st,"ace"));if(a){const ace=a.st.cards.find(c=>kind(c)==="ace");a.st.cards.splice(a.st.cards.indexOf(ace),1);if(!a.st.cards.length)G.board[a.r][a.c]=null;ace.owner=null;ace.hp=ace.maxHp=2;G.ether.push(ace)}
  }
  B.mana=0;B.owes=[];G.inflation={until:G.turnNo+sum(rollN(4,2)),add:0};
  popup("The Bank collapses",`<p>The Bank was 12 mana in the red and every player 6 below zero. It all comes down.</p><p>Everyone's mana and debts are wiped to zero, every maximum falls to three, five random cards leave each deck (two from the field if the deck is empty) and each player's Ace on the field goes back into the Ether. For 4d2 turns every price wobbles up by 1d2 − 1 a turn.</p>`);
  checkWin();
}

/* ---------- Gambling, max mana, Mystery Generation ---------- */
PRICE.mystery=()=>R(2)+R(3)+R(3);
SPELLS.push(
 {id:"gamble",name:"Gambling",cost:1,school:"Sorcery",text:"Roll 1d10. A natural 10 turns your mana into 7d2 mana, paid by the Bank. A 1 costs you one maximum mana, puts you 7d2 into mana debt and takes a card from your deck into the Ether. Anything else: the mana is gone.",
  ok:()=>bankOpen(),run:async()=>{const pl=G.active,P=me(),d=R(10);
   if(d===10){const w=rollN(7,2),n=sum(w),got=giveMana(pl,n);G.bank.mana-=got;tray(pl,"Gambling",[{s:10,v:d},...w],`+${got}`);log(`<b>Gambling</b>: ${plName(pl)} rolls a natural 10 and wins ${n} mana (${got} fit).`,"event")}
   else if(d===1){const w=rollN(7,2),n=sum(w);P.maxAdd=(P.maxAdd||0)-1;const c=P.deck.pop();if(c){c.owner=null;G.ether.push(c)}tray(pl,"Gambling",[{s:10,v:d},...w],`−${n}`);
     log(`<b>Gambling</b>: ${plName(pl)} rolls a 1. One maximum mana is lost, ${n} mana of debt (7d2) is owed${c?", and a card leaves the deck for the Ether":""}.`,"event");addDebt(pl,n)}
   else{tray(pl,"Gambling",[{s:10,v:d}],"nothing");log(`Gambling: ${plName(pl)} rolls ${d}. Nothing.`)}}},
 {id:"maxmana",name:"Buy Max Mana",cost:6,school:"Conjuring",text:"Your maximum mana goes up by one for the rest of the game, eighteen at most.",ok:()=>soulCap(G.active)<18,run:async()=>{const P=me();P.maxAdd=(P.maxAdd||0)+1;log(`${plName(G.active)} buys one more maximum mana (${soulCap(G.active)}).`)}}
);
const MYS={common:["2","3","4","5","6","7","8","9","10"],support:["scout","archer","healer","repair","miner","ram"],special:["J","Q","K","assassin"],rare:["A","JK","wall"],legend:["cannon","A"]};
function mysteryCard(pl){const v=R(20),pool=v<=10?MYS.common:v<=15?MYS.support:v<=18?MYS.special:v===19?MYS.rare:MYS.legend,k=pick(pool);
  const c=UNIT[k]?mkUnit(k,pl):k==="JK"?mk("JK",null,pick(["red","black"])):mk(k,pick(["S","H","D","C"]));c.owner=pl;return c}
async function mysteryGen(pl){const P=G.p[pl],cost=G.prices&&G.prices.mystery!=null?G.prices.mystery:PRICE.mystery();
  if(!canAfford(pl,cost))return false;spend(pl,cost);const n=R(3),got=[];
  for(let i=0;i<n;i++){const c=mysteryCard(pl);P.deck.push(c);got.push(c)}shuffle(P.deck);
  tray(pl,"Mystery Generation",[{s:3,v:n}],`${n} new`);
  log(`<b>Mystery Generation</b>: ${plName(pl)} pays ${cost} mana and ${n} brand-new card${n>1?"s are":" is"} made from thin air into the deck${P.cpu?"":`: ${got.map(c=>esc(nameOf(c))).join(", ")}`}.`,"event");return true}
function mysteryHTML(live){const cost=G.prices&&G.prices.mystery!=null?G.prices.mystery:"1d2+2d3";
  return `<div class="mystery"><div class="mhead">${unitSVG("mystery","var(--amber-hi)",34)}<div><b>Mystery Generation</b> · ${cost} mana<br><span class="dim">1d3 new cards of any rarity, from soldiers to Aces, Cannons and Walls, made from thin air into your deck. They don't come from the Ether or the grave.</span></div></div>${live?`<button class="btn sm" id="mysBtn" ${canAfford(G.active,+cost||99)?"":"disabled"}>Generate</button>`:""}</div>`}
function wireMystery(){if($("#mysBtn"))$("#mysBtn").onclick=async()=>{if(!canAct())return;ovHide();await mysteryGen(G.active);render()}}

/* ---------- the Bank's window ---------- */
function bankBarHTML(){if(!G.bank||survival())return "";const B=G.bank;
  return `<button class="bankbar" id="openBank" type="button">${unitSVG("goldbar","#e8c24a",22)}<span>The Bank</span><small>${B.dead?"closed":`${B.mana} mana`}${B.angry?" · angry":""}${B.mana<0&&!B.dead?" · Ether sale":""}</small></button>`}
function openBank(){
  const V=view(),P=G.p[V],B=G.bank,live=canAct()&&G.phase==="prep"&&G.active===V,lim=loanLimit(V),owed=owedOf(V),e=effMana(V);
  const loans=(P.loans||[]).map(L=>`<li>${L.owed} owed · interest in ${Math.max(0,L.at-tnOf(V))} turn(s) · due in ${Math.max(0,L.due-tnOf(V))}</li>`).join("");
  const notes=[];if(B.dead)notes.push("The Banker is dead: the Bank and the Ether are closed.");if(B.angry)notes.push("The Banker is angry about the Barbarians holding the middle: every price +1.");
  if(B.mana<0&&!B.dead)notes.push("The Bank is in the red: everything in the Ether costs 1 less.");const up=Object.keys(B.upsell);if(up.length)notes.push(`Upsold this round: ${up.map(id=>SP(id)?SP(id).name:id).join(", ")}.`);
  if(G.inflation&&G.turnNo<=G.inflation.until)notes.push(`After the collapse, prices wobble up until turn ${G.inflation.until}.`);
  ovShow(`<div class="ovbox bank"><h2>The Bank</h2><div class="bankhead"><span class="banker">${unitSVG("banker","#15100b",56)}</span><div><b>The Banker</b> holds <b>${B.mana}</b> mana.${B.owes.length?` It owes ${B.owes.map(o=>`${plName(o.to)} ${o.owed}`).join(", ")}.`:""}<br><span class="dim">Spell mana goes to the Bank, and it can only lend what it holds.</span>${notes.length?`<p class="bnote">${notes.join("<br>")}</p>`:""}</div></div>
<dl class="bstat"><dt>Your mana</dt><dd class="${e<0?"neg":""}">${e}/${soulCap(V)} · you lose below ${floorOf(V)}</dd><dt>Loans</dt><dd>${loans?`<ul>${loans}</ul>`:"none"}</dd></dl>
${live&&!B.dead?`<div class="bacts">
<p><label>Borrow <select id="bLoan">${Array.from({length:lim},(_,i)=>`<option>${i+1}</option>`).join("")}</select> mana</label> <button class="btn sm" id="bLoanBtn" ${lim?"":"disabled"}>Take the loan</button> <small class="dim">${Math.round(loanRate(V)*100)}% every 1d2 turns, due in 4 turns; what isn't paid then becomes mana debt.${e<0?" Below zero: six at most (five at −"+soulCap(V)+", at 30%).":""}</small></p>
<p><label>Repay <select id="bPay">${Array.from({length:Math.min(mana(V),owed)},(_,i)=>`<option>${i+1}</option>`).join("")}</select> mana</label> <button class="btn sm" id="bPayBtn" ${Math.min(mana(V),owed)?"":"disabled"}>Pay</button></p>
<p><label><input type="checkbox" id="bCredit" ${P.credit?"checked":""}> Spend on credit</label> <small class="dim">Spells you can't afford are paid by the Bank and become mana debt, down to ${floorOf(V)}. Every soul you gain pays the debt first.</small></p>
<p><button class="btn ghost sm" id="bSell">Sell cards from your hand or deck</button>${P.tribe==="binah"&&(P.thralls||[]).length?` <button class="btn ghost sm" id="bThrall">Sell a thrall (1 mana)</button>`:""}</p></div>`:`<p class="dim">${B.dead?"":"Bank business is done in your own prep phase."}</p>`}
<p><button class="btn ghost" id="mcancel">Close</button></p></div>`);
  $("#mcancel").onclick=ovHide;
  if($("#bLoanBtn"))$("#bLoanBtn").onclick=()=>{takeLoan(V,+$("#bLoan").value);render();openBank()};
  if($("#bPayBtn"))$("#bPayBtn").onclick=()=>{repay(V,+$("#bPay").value);render();openBank()};
  if($("#bCredit"))$("#bCredit").onchange=e=>{P.credit=e.target.checked;log(`${plName(V)} ${P.credit?"opens":"closes"} a line of credit at the Bank.`);render()};
  if($("#bThrall"))$("#bThrall").onclick=()=>{sellThrall(V);render();openBank()};
  if($("#bSell"))$("#bSell").onclick=()=>openSell(V);
}
function openSell(V){const P=G.p[V],pick=new Set();
  const draw=()=>{const list=[...P.hand.map(c=>[c,"hand"]),...P.deck.map(c=>[c,"deck"])];
    const tot=list.filter(([c])=>pick.has(c.id)).reduce((a,[c])=>a+(costOf(c)||1),0);
    ovShow(`<div class="ovbox wide"><h2>Sell to the Bank</h2><p class="dim">Each card sells for its conjuring price and goes to the Ether. The deck is reshuffled afterwards. The Bank holds ${G.bank.mana} mana.</p>
<div class="pickrow sell">${list.map(([c,w])=>`<label class="sellc ${pick.has(c.id)?"on":""}"><input type="checkbox" data-sl="${c.id}" ${pick.has(c.id)?"checked":""}>${face(c,{cls:"sm",noci:true})}<small>${w} · ${costOf(c)||1}</small></label>`).join("")}</div>
<p><button class="btn" id="sellGo" ${pick.size?"":"disabled"}>Sell ${pick.size} for ${tot} mana</button> <button class="btn ghost" id="mcancel">Back</button></p></div>`);
    $("#ov").querySelectorAll("[data-sl]").forEach(i=>i.onchange=()=>{const id=+i.dataset.sl;i.checked?pick.add(id):pick.delete(id);draw()});
    $("#mcancel").onclick=openBank;
    $("#sellGo").onclick=()=>{const cs=[...P.hand,...P.deck].filter(c=>pick.has(c.id));sellCards(V,cs);render();openBank()}};
  draw()}
function econTags(P){const t=[];if(!G.bank||isHorde(P.i))return t;
  if(P.debt>0)t.push(`<span class="debttag">Debt −${P.debt}</span>`);
  const o=owedOf(P.i);if(o)t.push(`<span class="loantag">Loans ${o}</span>`);
  if(P.credit)t.push(`<span class="loantag">Credit</span>`);
  if(P.saleUntil!=null&&tnOf(P.i)<=P.saleUntil)t.push(`<span class="saletag">Ether sale</span>`);
  if(oathOf(P.i))t.push(`<span class="oathtag">${P.oath==="earth"?"Earth Oath":P.oath==="venus"?"Oath of Venus":"Oath of Jupiter"}</span>`);
  if(sunBlind(P.i))t.push(`<span class="debttag">Sun-blind</span>`);
  if(choked(P.i))t.push(`<span class="debttag">Choking on the Sun</span>`);
  if(P.freeCurses&&P.freeCurses.left)t.push(`<span class="saletag">${P.freeCurses.left} free curse${P.freeCurses.left>1?"s":""}</span>`);
  if((G.bribes||[]).some(b=>b.target===P.i))t.push(`<span class="debttag">Bribed against</span>`);
  if(P.maxAdd)t.push(`<span>Max ${P.maxAdd>0?"+":""}${P.maxAdd}</span>`);
  return t}

/* ---------- the meteor and its fire ---------- */
const fireAt=(r,c)=>!!(G.fires||[]).some(f=>f.r===r&&f.c===c);
function meteor(){
  const t=[];for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++)if(!isVoid(r,c))t.push([r,c]);if(!t.length)return;
  const [r,c]=pick(t);
  log(`<b>A meteor</b> crashes onto ${coord(r,c)}! Everything around it may burn for two rounds.`,"event");
  popup("A meteor",`<p>A meteor falls out of the sky onto ${coord(r,c)}. The tile takes one damage, every tile around it one damage on a 4 of 1d4, and Walls 1d2 + 1. Fire burns the whole area for two rounds: a stack standing in it takes one damage on a natural 20 at the start of its turn. The Firmament is immune.</p>`);
  skyStrike(r,c,"The meteor");
}
/* a meteor or the Firmament's Asteroid: one damage where it lands, 1d4 = 4 for each tile around, fire for two rounds; the Firmament takes nothing */
function skyStrike(r,c,why){
  const hit=(rr,cc)=>{const st=G.board[rr][cc];if(!st)return;if(G.p[st.owner]&&G.p[st.owner].tribe==="firm"){log(`${why} can't touch the Firmament on ${coord(rr,cc)}.`);return}
    if(hasK(st,"wall"))wallHit(rr,cc,1+R(2),why);else damage(rr,cc,1,false)};
  G.fires=G.fires||[];hit(r,c);
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;const rr=r+dr,cc=c+dc;if(rr<0||cc<0||rr>=G.rows||cc>=COLS||isVoid(rr,cc))continue;if(R(4)===4)hit(rr,cc);
    G.fires.push({r:rr,c:cc,until:G.moon.round+1})}
  G.fires.push({r,c,until:G.moon.round+1});
  checkWin();
}

/* ---------- the Barbarians ---------- */
function barbTick(){
  const B=npcIx("barb");if(B<0||G.opts.barbarians===false||G.phase==="setup")return;
  if(G.barbNext==null){G.barbNext=G.turnNo+4+R(12);return}
  if(G.turnNo>=G.barbNext){G.barbNext=G.turnNo+4+R(12);spawnBarbarians()}
  // the middle held for 7d2 turns angers the Banker
  const held=stacksOf(B).some(x=>centerArea().some(([r,c])=>r===x.r&&c===x.c));
  if(held){if(G.barbHeld==null){G.barbHeld=G.turnNo;G.barbNeed=sum(rollN(7,2))}
    else if(G.bank&&!G.bank.angry&&!G.bank.dead&&G.turnNo-G.barbHeld>=G.barbNeed){G.bank.angry=true;
      log(`<b>The Banker is angry.</b> The Barbarians have held the middle for ${G.barbNeed} turns: every price goes up by 1 until they are gone.`,"event");
      popup("The Banker's justification",`<p>"Trade can't cross the middle of the field while those savages sit on it. Every caravan pays for guards, every guard wants his wage, and somebody has to pay the wage."</p><p>The Barbarians have held the middle for ${G.barbNeed} turns (7d2). Every spell costs 1 more until no Barbarian is left in the middle.</p>`)}}
  else{G.barbHeld=null;if(G.bank&&G.bank.angry){G.bank.angry=false;log("The middle is clear of Barbarians: the Banker calms down and prices go back.","event")}}
}
function centerArea(){const c0=centerTiles(),out=[];for(const [r,c] of c0)for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const rr=r+dr,cc=c+dc;if(rr>=0&&cc>=0&&rr<G.rows&&cc<COLS&&!out.some(t=>t[0]===rr&&t[1]===cc))out.push([rr,cc])}return out}
function spawnBarbarians(blood){
  const B=npcIx("barb");if(B<0)return;
  if(stacksOf(B).length>=6){log("The Barbarians already crowd the field: no new band comes.");return}
  const n=alive().filter(i=>!isHorde(i)).length,zones=new Set(G.p.flatMap((P,i)=>isNPC(i)?[]:seat(i).zone.map(t=>t.join())));
  const mid=[(G.rows-1)/2,(COLS-1)/2];const tiles=[];
  for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++)if(!isVoid(r,c)&&!G.board[r][c]&&!zones.has(r+","+c))tiles.push([r,c]);
  tiles.sort((a,b)=>Math.hypot(a[0]-mid[0],a[1]-mid[1])-Math.hypot(b[0]-mid[0],b[1]-mid[1]));
  if(!tiles.length){log("The Barbarians find no room in the middle.");return}
  const dice=[],roll=(k,s)=>{let t=0;for(let i=0;i<k;i++){const v=R(s);dice.push({s,v});t+=v}return t},SU=["S","H","D","C"];
  const grunts=()=>Array.from({length:roll(1,3)+1},()=>mk(String(1+R(5)),pick(SU)));
  const inf=()=>Array.from({length:roll(1,3)},()=>mk(String(6+R(4)),pick(SU)));
  const jacks=()=>Array.from({length:roll(1,2)},()=>mk("J",pick(SU)));
  const any=()=>pick([grunts,inf,jacks])();
  const stacks=[grunts()];if(n>=3)stacks.push(any());
  if(roll(1,2)===1)stacks.push(grunts());
  else{stacks.push(pick([inf,jacks])());if(roll(1,4)===4)stacks.push(any());if(n>=3&&roll(1,4)===4)stacks.push(any())}
  stacks.length=Math.min(stacks.length,n<=2?3:n===3?4:5);
  let aces=n>=4?2:0;if(roll(1,6)===6)aces++;if(n===3&&aces===1&&roll(1,6)===6)aces++;aces=Math.min(aces,n<=2?1:n===3?2:3);
  const W={id:(G.waveNo=(G.waveNo||0)+1),stacks:0,aces:0,aceKilled:false,kills:{},left:0};(G.waves=G.waves||{})[W.id]=W;
  const put=cards=>{const t=tiles.shift();if(!t)return false;for(const c of cards){c.owner=B;c.wave=W.id;c.barb=true}G.board[t[0]][t[1]]={owner:B,cards,moved:true,attacked:true};W.left+=cards.length;return true};
  for(const s of stacks)if(put(s))W.stacks++;
  for(let i=0;i<aces;i++)if(put([mk("A",pick(SU))]))W.aces++;
  tray(B,"Barbarians",dice,`${W.stacks} band${W.stacks>1?"s":""}${W.aces?` + ${W.aces} Ace${W.aces>1?"s":""}`:""}`,true);
  log(`<b>Barbarians</b>${blood?" come with the Blood Moon and":""} take the middle of the field: ${W.stacks} band${W.stacks>1?"s":""}${W.aces?` and ${W.aces} Ace base${W.aces>1?"s":""}`:""}. They fight everyone.`,"event");
  notify(null,`Barbarians take the middle of the field.`);
}
/* the Barbarians strike at whatever stands beside them; they hold their ground */
async function barbAct(){
  const B=npcIx("barb");if(B<0)return;
  for(const {st,r,c} of stacksOf(B)){if(G.over||G.board[r][c]!==st)continue;st.attacked=false;st.moved=false;
    let best=null;for(const o of attackOptions(r,c)){if(o.mode==="capture"||o.mode==="destroy")continue;const E=G.board[o.r][o.c];if(!E||isNPC(E.owner))continue;const p=AI.winP(st,E,24,o.mode),s=p*AI.value(E);if(p>=.45&&(!best||s>best.s))best={o,s}}
    if(best){attack(r,c,best.o.r,best.o.c,best.o.mode);render();await sleep(380)}
  }
}
/* who killed the Barbarians: the band's best killer gets a sale; a big band also clears their debt */
function econBury(card,r,c,st){
  const F=G.fight,killer=F?(st===F.D?F.atkPl:st===F.A?F.defPl:null):null;
  warKill(killer);
  if(card.wave&&G.waves&&G.waves[card.wave]){const W=G.waves[card.wave];W.left--;if(killer!=null&&!isNPC(killer))W.kills[killer]=(W.kills[killer]||0)+1;if(kind(card)==="ace")W.aceKilled=true;
    delete card.wave;delete card.barb;if(W.left<=0)waveCleared(W)}
  // the Bank's Debt Collectors send what they kill to the Ether and keep its price
  const bk=npcIx("bank");
  if(F&&bk>=0&&killer===bk&&!(card.unit&&!UNIT[card.unit].ether)){card.owner=null;if(card.hp!=null)card.hp=card.maxHp;G.ether.push(card);const v=costOf(card)||1;bankAdd(v);log(`The Bank takes ${esc(nameOf(card))} into the Ether and books ${v} mana.`);return true}
  return false;
}
function waveCleared(W){
  const ks=Object.entries(W.kills).sort((a,b)=>b[1]-a[1]);delete G.waves[W.id];
  if(!ks.length){log("The last Barbarians of the band are gone.");return}
  const top=+ks[0][0],P=G.p[top];if(!P||P.out)return;
  P.saleUntil=tnOf(top)+3;
  log(`<b>${plName(top)}</b> killed the most Barbarians (${ks[0][1]}): the Ether is on sale for them for three turns (every conjuring 1 less).`,"event");
  if((W.aceKilled&&W.stacks>=2)||(W.stacks>=3&&!W.aces)){const d=P.debt||0,o=owedOf(top);P.debt=0;P.debtAt=null;P.loans=[];
    log(`<b>The Banker forgives ${plName(top)}'s debts</b>${d||o?` (${d+o} mana)`:""} for breaking the Barbarians.`,"event");
    popup("Debts forgiven",`<p>${plName(top)} broke a band of Barbarians${W.aceKilled?" and its Ace":""}. The Banker tears up their debts${d||o?`: ${d+o} mana`:""}.</p>`,top)}
  notify(top,`${esc(P.name)} gets an Ether sale for three turns.`);
}

/* ---------- the Bank's own Debt Collectors ---------- */
const debtTargets=()=>alive().filter(i=>!isHorde(i)&&effMana(i)<-soulCap(i)).sort((a,b)=>effMana(a)-effMana(b));
async function bankCollectors(){
  const B=npcIx("bank");if(B<0||!G.bank)return;
  const T=G.bank.dead?[]:debtTargets();
  // the Bank's own collectors go home when nobody is deep in debt; Saturn's hunters (st.hunt) keep on
  const own=stacksOf(B).filter(x=>x.st.hunt==null);
  if(!T.length&&own.length){for(const x of own)G.board[x.r][x.c]=null;log("Nobody is deep in debt any more: the Bank calls its Debt Collectors home.")}
  const tgt=T[0];
  if(tgt!=null&&stacksOf(tgt).length&&(G.collNext==null||G.moon.round>=G.collNext)){const ts=stacksOf(tgt);G.collNext=G.moon.round+R(3);const k=R(3);let put=0;
    const free=[];for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++)if(!G.board[r][c]&&!isVoid(r,c))free.push([r,c,Math.min(...ts.map(x=>Math.abs(x.r-r)+Math.abs(x.c-c)))]);
    free.sort((a,b)=>a[2]-b[2]);for(const [r,c,d] of free){if(put>=k)break;if(d<2)continue;G.board[r][c]={owner:B,cards:[mkUnit("debt",B)],moved:true,attacked:true};put++}
    if(put)log(`<b>The Bank</b> sends ${put} Debt Collector${put>1?"s":""} after ${plName(tgt)} (${effMana(tgt)} mana).`,"event")}
  for(const {st,r,c} of stacksOf(B)){if(G.over||G.board[r][c]!==st)continue;st.attacked=false;st.moved=false;
    const who=st.hunt!=null?st.hunt:tgt;if(who==null||!G.p[who]||G.p[who].out){if(st.hunt!=null)G.board[r][c]=null;continue}
    const mine=o=>{const E=G.board[o.r][o.c];return E&&E.owner===who&&o.mode!=="capture"&&o.mode!=="destroy"};
    let o=attackOptions(r,c).find(mine);
    if(!o){   // one step toward the debtor
      const tl=stacksOf(who);if(!tl.length)continue;const dist=(a,b)=>Math.min(...tl.map(x=>Math.abs(x.r-a)+Math.abs(x.c-b)));let best=null;
      for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const rr=r+dr,cc=c+dc;if(rr<0||cc<0||rr>=G.rows||cc>=COLS||isVoid(rr,cc)||G.board[rr][cc])continue;const d=dist(rr,cc);if(d<dist(r,c)&&(!best||d<best.d))best={rr,cc,d}}
      if(best){G.board[best.rr][best.cc]=st;G.board[r][c]=null;st.moved=true;o=attackOptions(best.rr,best.cc).find(mine);if(o){attack(best.rr,best.cc,o.r,o.c,o.mode);render();await sleep(380)}}
      continue}
    attack(r,c,o.r,o.c,o.mode);render();await sleep(380);
  }
}

/* ---------- the computer at the Bank ---------- */
async function aiBank(pl,W,cast1){
  const P=G.p[pl],lv=P.cpu;if(!G.bank||isHorde(pl))return;
  if(owedOf(pl)&&mana(pl)>=owedOf(pl)+2)repay(pl,owedOf(pl));
  if(lv==="hard"&&effMana(pl)<0&&loanLimit(pl)>=2)takeLoan(pl,Math.min(loanLimit(pl),-effMana(pl)+1));   // borrow out of a hole before the interest bites
  if(lv!=="easy"&&soulCap(pl)<10&&mana(pl)>=8&&Math.random()<.3)await cast1("maxmana");
  if(lv==="easy"&&mana(pl)>=2&&Math.random()<.15)await cast1("gamble");
  const cost=G.prices&&G.prices.mystery;if(cost!=null&&mana(pl)>=cost+3&&P.deck.length<P.start*.6&&Math.random()<.3)await mysteryGen(pl);
}

/* ---------- symbols ---------- */
Object.assign(UNIT_ICON,{
 goldbar:`<path d="M-10,6L-6,-3H6L10,6Z M-6,-3L-4,-7H4L6,-3 M-3,1H3"/>`,
 banker:`<path d="M-6,-4V-11H6V-4 M-10,-4H10 M-6,-6H6 M-6,-3C-6,4 6,4 6,-3 M-3,0h0.1 M3,0h0.1 M-2,2.5C-1,3.5 1,3.5 2,2.5 M-8,11C-7,6 7,6 8,11"/>`,
 mystery:`<path d="M-4,-5C-4,-10 5,-10 5,-5C5,-2 0,-1 0,3 M0,7v0.1 M-10,-10L-7,-7 M10,-10L7,-7 M-10,10L-7,7 M10,10L7,7"/>`
});

/* ---------------- Prompt 10a: the sky and the Firmament ----------------
   The moon's place in the sky can hold Saturn ("No") or Mars ("Strife"); the Sun, Venus, Jupiter and Mercury come next.
   The Firmament is above the moon's and Saturn's harms and meteors, keeps a Miner on the moon, and casts
   Blood Moon, Rain, Asteroid, Fog and Mars. */

/* a planet that starts in the sky keeps out the Substance it would serve */
const skyBlocked=sky=>sky==="saturn"?["yald"]:["mars","sun","venus","jupiter","mercury"].includes(sky)?["firm"]:[];
const isFirm=pl=>!!(G.p[pl]&&G.p[pl].tribe==="firm");
/* the Leviathan's New Moon: the real New Moon, or every eighth round while it coils on Mars */
const levNew=()=>G.moon.i===0&&!G.moon.gone||G.moon.gone==="mars"&&G.moon.round%8===1;

/* ---------- the start of a turn: Mars, the moon's Miner, the end of Rain ---------- */
function skyTurn(pl){
  const P=G.p[pl];if(!P)return;
  // the Miner on the moon dies when the moon leaves the sky or the Leviathan climbs onto it
  checkMoonMiner();const MM=G.moonMiner;
  if(MM&&MM.owner===pl){const v=R(2)-1;if(v){const got=giveMana(pl,v);if(got)log(`${plName(pl)}'s Miner on the moon brings ${got} mana.`)}}
  if(G.rain&&G.rain.by===pl){G.rain=null;log(`The rain over the field stops.`)}
  if(G.ffog&&G.ffog.by===pl&&tnOf(pl)>=G.ffog.until){G.ffog=null;log(`The Firmament's fog lifts.`)}
  // Mars: plain soldiers find their courage
  if(G.moon.gone==="mars"&&!isHorde(pl)){let n=0;for(const {st} of stacksOf(pl)){st.mars=false;if(st.cards.every(c=>!c.unit&&(kind(c)==="grunt"||kind(c)==="infantry"))&&R(8)<=5){st.mars=true;n++}}
    if(n)log(`Mars stirs ${n} of ${plName(pl)}'s soldier stack${n>1?"s":""}: advantage on the next attack.`)}
}
function checkMoonMiner(){const MM=G.moonMiner;
  if(MM&&(G.moon.gone||G.moonLev||G.p[MM.owner].out)){G.moonMiner=null;MM.card.owner=MM.owner;toGrave(MM.card,"death");
    log(`${G.moon.gone?"The moon has left the sky":"The Leviathan is on the moon"}: ${plName(MM.owner)}'s Miner on the moon is gone.`,"event");notify(MM.owner,"The Miner on the moon is lost.")}}
/* Rain: every sacrifice gives one more mana, and one mana to the Firmament */
function rainSac(pl){const Rn=G.rain;if(!Rn||G.p[Rn.by].out)return;
  const a=giveMana(pl,1);let b=0;if(pl!==Rn.by)b=giveMana(Rn.by,1);
  if(a||b)log(`The rain: ${plName(pl)} gets ${a} more${b?`, and ${plName(Rn.by)} 1`:""}.`)}

/* ---------- the Firmament's Fog: enemies see only what is beside them (their Scouts one less); blind at the New Moon ---------- */
function firmFog(V){const F=G.ffog;if(!F||!G.p[F.by]||G.p[F.by].out||tnOf(F.by)>=F.until)return null;
  const nm=G.moon.i===0&&!G.moon.gone;
  if(isEnemy(F.by,V))return nm?{blind:true}:{cut:1};
  return nm?{own:true}:null}
const visR=(x,ff)=>ff&&ff.own?1:(hasK(x.st,"scout")?3:2)-(ff&&ff.cut?1:0);

/* ---------- drawings ---------- */
function marsSVG(){return `<svg class="moon mars" viewBox="-44 -44 88 88" width="88" height="88" aria-hidden="true"><defs><radialGradient id="marsg" cx="38%" cy="34%"><stop offset="0" stop-color="#f08a5a"/><stop offset=".65" stop-color="#b3431f"/><stop offset="1" stop-color="#5a1a0c"/></radialGradient><radialGradient id="marsglow"><stop offset="55%" stop-color="#ff6a3a" stop-opacity=".35"/><stop offset="100%" stop-color="#ff6a3a" stop-opacity="0"/></radialGradient></defs><circle r="40" fill="url(#marsglow)"/><circle r="24" fill="url(#marsg)" stroke="#3a120a"/><circle cx="-7" cy="5" r="3.4" fill="#8a3216" opacity=".7"/><circle cx="8" cy="-6" r="2.2" fill="#8a3216" opacity=".7"/><circle cx="4" cy="10" r="1.6" fill="#8a3216" opacity=".7"/><path d="M-18,-6C-10,-9 4,-2 18,-5" stroke="#7a2a12" stroke-width="1.6" fill="none" opacity=".6"/>${G.moonLev?levOnMoon():""}</svg>`}
function minerOnMoon(){const P=G.p[G.moonMiner.owner];return `<g transform="translate(12,-30) scale(.9)"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="#000" stroke-width="3.4">${UNIT_ICON.miner}</g><g stroke="${P.color}" stroke-width="1.7">${UNIT_ICON.miner}</g></g></g>`}

/* ---------- spells ---------- */
PRICE.bloodcall=()=>R(2)+R(2)+R(3)+R(3);PRICE.rain=()=>1+R(2);PRICE.asteroid=()=>R(2)+R(2)+R(2);PRICE.ffog=()=>R(2)+R(2);PRICE.mars=()=>R(3)+R(3);
SPELLS.push(
 {id:"bloodcall",tribe:"firm",dice:"2d2+2d3",name:"Blood Moon",cost:4,school:"Sorcery",text:"The next Full Moon turns into a Blood Moon. Its harms don't touch the Firmament: your dead still go to the grave.",
  ok:()=>!G.moon.gone&&!G.moon.blood&&!G.bloodCalled,run:async()=>{G.bloodCalled=true;G.forceMoon=1;
   log(`<b>Blood Moon</b>: ${plName(G.active)} calls the blood onto the next Full Moon.`,"event");notify(null,"The next Full Moon will be a Blood Moon.")}},
 {id:"rain",tribe:"firm",dice:"1d2+1",name:"Rain",cost:2,school:"Sorcery",text:"Until your next turn begins, every card anyone sacrifices gives one more mana, and every sacrifice by another player also gives you one mana.",
  ok:()=>!G.rain,run:async()=>{G.rain={by:G.active};log(`<b>Rain</b> falls over the field: sacrifices are worth one more until ${plName(G.active)}'s next turn, and every sacrifice feeds the Firmament.`,"event")}},
 {id:"asteroid",tribe:"firm",dice:"3d2",name:"Asteroid",cost:4,school:"Sorcery",text:"Select a stack: an asteroid falls on it. One damage there, one damage on a 4 of 1d4 on every tile around it (Walls take 1d2 + 1), and fire over the area for two rounds. The Firmament is immune.",
  ok:()=>!!selStack()&&!isFirm(selStack().owner),run:async()=>{const {r,c}=G.sel;SND.gun();
   log(`<b>Asteroid</b>: ${plName(G.active)} brings a rock down on ${coord(r,c)}.`,"event");skyStrike(r,c,"The asteroid");if(G.sel&&!G.board[G.sel.r][G.sel.c])G.sel=null}},
 {id:"ffog",tribe:"firm",dice:"2d2",name:"Fog",cost:4,school:"Illusion",text:"For 1d2 of your turns your enemies see only what is right beside their cards, and their Scouts one tile less. Not under the Full Moon; at the New Moon it blinds them completely, while your own cards see one tile. Once every three turns.",
  ok:()=>G.moon.i!==4&&!G.ffog&&tnOf(G.active)>=(me().fogReady||0),run:async()=>{const pl=G.active,d=R(2);G.ffog={by:pl,until:tnOf(pl)+d};me().fogReady=tnOf(pl)+3;G._vis=null;
   tray(pl,"Fog",[{s:2,v:d}],`${d} turn${d>1?"s":""}`);log(`<b>Fog</b> rolls in from ${plName(pl)}'s Firmament for ${d} turn${d>1?"s":""}.`,"event");notify(pl,"The Firmament's fog rolls over the field.")}},
 {id:"mars",tribe:"firm",dice:"2d3",name:"Mars",cost:4,school:"Sorcery",text:"Mars takes the moon's place in the sky (“Strife”). Each turn every stack of only Grunts and Infantry gets advantage on its next attack on 1–5 of 1d8. The moon's phases stop and your Miner on the moon is lost; a Leviathan on the moon coils on Mars instead. Not while Saturn hangs there, and never again once Mars is eaten.",
  ok:()=>G.moon.gone!=="mars"&&G.moon.gone!=="saturn"&&!G.marsEaten,run:async()=>{G.moon.gone="mars";G.moon.i=-1;G.moon.blood=false;applyMoonTheme();
   log(`<b>Mars</b>: ${plName(G.active)} sets Mars in the sky where the moon was.`,"event");
   popup("Mars, “Strife”",`<p>${plName(G.active)} hangs Mars in the moon's place. The phases stop.</p><p>At the start of each turn, every stack made only of Grunts and Infantry (Puppets too) gets advantage on its next attack on 1–5 of 1d8.</p>`,G.active)}}
);

/* ---------- the computer playing the Firmament ---------- */
async function aiSky(pl,W,cast1){
  const P=G.p[pl],lv=P.cpu;if(P.tribe!=="firm"||G.over)return;
  const foes=enemiesOf(pl).flatMap(stacksOf).filter(e=>seesTile(pl,e.r,e.c));
  // the Asteroid where it hurts the most
  let best=null;for(const e of foes){let s=AI.value(e.st);for(const f of foes)if(f!==e&&Math.max(Math.abs(f.r-e.r),Math.abs(f.c-e.c))===1)s+=AI.value(f.st)*.25;if(!best||s>best.s)best={...e,s}}
  if(best&&best.s>(lv==="hard"?4:6)&&mana(pl)>=(G.prices.asteroid||4)+1)await cast1("asteroid",best.r,best.c);
  const close=foes.some(e=>stacksOf(pl).some(m=>Math.abs(m.r-e.r)+Math.abs(m.c-e.c)<=3));
  if(close&&lv!=="easy"&&mana(pl)>=(G.prices.ffog||4)+1&&Math.random()<(lv==="hard"?.6:.4))await cast1("ffog");
  if(!G.moon.gone&&G.moon.i>=1&&G.moon.i<=3&&mana(pl)>=(G.prices.bloodcall||6)+1&&Math.random()<.25)await cast1("bloodcall");
  const soldiers=pls=>pls.flatMap(stacksOf).filter(x=>x.st.cards.every(c=>!c.unit&&(kind(c)==="grunt"||kind(c)==="infantry"))).length;
  if(G.moon.gone!=="mars"&&soldiers([pl])>soldiers(enemiesOf(pl))+1&&mana(pl)>=(G.prices.mars||4)+1&&Math.random()<.3)await cast1("mars");
  if(mana(pl)>=(G.prices.rain||2)+2&&Math.random()<.2)await cast1("rain");
}

/* ---------------- Prompt 10b: the Second Sun (and the Black Sun), Venus, Jupiter, and Oaths (Astrology) ----------------
   G.moon.gone names what hangs in the moon's place: "mars", "sun", "blacksun", "venus", "jupiter", "saturn", "eaten",
   "fallen" (the Sun came down), "off". Planets the Firmament set up remember who did it in G.planetBy. */

SCHOOLS.push("Astrology");
const sky=()=>G.moon.gone||"moon";
const PLANETS={
  mars:{name:"Mars",word:"Strife",hunger:3},
  sun:{name:"The Second Sun",word:"King",hunger:3},
  blacksun:{name:"The Black Sun",word:"King",hunger:3},
  venus:{name:"Venus",word:"Harmony",hunger:3},
  jupiter:{name:"Jupiter",word:"Fortune",hunger:4}
};
const planetUp=k=>G.moon.gone===k;
const sunUp=()=>G.moon.gone==="sun";
const oathOf=pl=>G.p[pl]&&G.p[pl].oath&&G.p[pl].oath===OATH_SKY[sky()]?G.p[pl].oath:null;
const OATH_SKY={sun:"earth",venus:"venus",jupiter:"jupiter"};
const planetBy=()=>G.planetBy!=null&&G.p[G.planetBy]&&!G.p[G.planetBy].out?G.planetBy:null;

/* ---------- maximum mana from the sky: Venus's gifts and Oath ---------- */
function skyCapMod(P){if(!G||!P)return 0;let m=0;const pl=P.i;
  if(planetUp("venus")){const V=G.venus;
    const x=G.eclipse&&G.eclipse.k==="venus"?2:1;   // an eclipse of Venus doubles its gifts
    if(V&&V.mode==="a"&&V.target===pl)m+=2*x;
    if(V&&V.mode==="b"&&V.by!=null&&isEnemy(V.by,pl))m+=2*x;
    if(P.oath==="venus"){if(P.venusPeace)m+=2;if(P.venusPen&&tnOf(pl)<=P.venusPen)m-=2}}
  if(G.jupMax&&G.jupMax[pl]&&G.moon.round<=G.jupMax.until)m+=G.jupMax[pl];   // a Jupiter eclipse (Prompt 10c)
  return m}

/* ---------- setting a planet in the sky ---------- */
function setPlanet(k,by){
  const old=sky();
  if(G.moonLev&&(k==="sun"||k==="blacksun")){const L=G.moonLev;G.moonLev=null;L.card.hp=L.card.maxHp;G.p[L.owner].deck.push(L.card);shuffle(G.p[L.owner].deck);log(`The Leviathan can't lie on the Sun: it falls back into ${plName(L.owner)}'s deck.`,"event")}
  G.moon.gone=k;G.moon.i=-1;G.moon.blood=false;G.planetBy=by;if(k==="sun"){G.sunTears=0;G.sunJudgeStart=G.turnNo}
  for(const P of G.p)if(P.oath&&P.oath!==OATH_SKY[k]){P.oath=null}
  G._vis=null;applyMoonTheme();checkMoonMiner();
  if(OATH_SKY[k])notify(null,`${PLANETS[k].name} is in the sky: anyone can swear its Oath (Astrology).`);
  if(old==="jupiter"){G.jupSale=null}
}
/* ---------- the Second Sun: judgement every 2d2 turns ---------- */
async function skyAsync(pl){
  const P=G.p[pl];if(!P||isHorde(pl)||P.out)return;
  if(sunUp()&&P.tribe!=="firm"){
    if(P.sunNext==null){P.sunNext=tnOf(pl)+R(2)+R(2);return}
    if(tnOf(pl)<P.sunNext)return;
    P.sunNext=tnOf(pl)+R(2)+R(2);
    const by=planetBy(),opts=[];
    if(mana(pl)>=1)opts.push({id:"mana",label:"Pay 1 mana",sub:by!=null?`It goes to ${G.p[by].name}.`:"It goes to the Bank."});
    if(stacksOf(pl).length)opts.push({id:"hurt",label:"One damage to a random stack of yours"});
    if(P.deck.length>=2)opts.push({id:"deck",label:"Two cards from your deck",sub:"They burn in the Sun (to the grave)."});
    opts.push({id:"no",label:"Refuse",sub:"Blinded by the Sun for this turn: you can't see even what is beside you."});
    const ch=opts.length===1?"no":await ask(pl,{kind:"choice",id:"sunjudge",title:`The Second Sun judges ${esc(P.name)}`,options:opts,
      ai:()=>mana(pl)>=2?"mana":P.deck.length>8?"deck":stacksOf(pl).length>3?"hurt":opts[0].id});
    if(ch==="mana"){payQuiet(pl,1);if(by!=null)giveMana(by,1);else bankAdd(1);log(`${plName(pl)} worships the Earth before the Second Sun: 1 mana${by!=null?` to ${plName(by)}`:" to the Bank"}.`)}
    else if(ch==="hurt"){const x=pick(stacksOf(pl));log(`${plName(pl)} offers the Second Sun a wound on ${coord(x.r,x.c)}.`);damage(x.r,x.c,1,false)}
    else if(ch==="deck"){for(let i=0;i<2;i++)toGrave(P.deck.pop(),"burn");log(`${plName(pl)} burns two deck cards in the Second Sun.`)}
    else{P.sunBlind=tnOf(pl);G._vis=null;log(`<b>The Second Sun</b> blinds ${plName(pl)} for this turn.`,"event");notify(pl,`${esc(P.name)} is blinded by the Sun this turn.`)}
    render();
  }
  // the Black Sun: the Firmament who raised it pays Yaldabaoth every 1d2 of its turns
  if(planetUp("blacksun")&&P.tribe==="firm"&&G.blackBy!=null&&!G.p[G.blackBy].out){
    if(P.blackNext==null)P.blackNext=tnOf(pl)+R(2);
    if(tnOf(pl)>=P.blackNext){P.blackNext=tnOf(pl)+R(2);const Y=G.blackBy,n=R(2);
      const ch=await ask(pl,{kind:"choice",id:"blacksun",title:`The Black Sun: ${esc(P.name)} pays Yaldabaoth`,options:[{id:"mana",label:`${n} mana`},{id:"deck",label:`${n} card${n>1?"s":""} from your deck`}],ai:()=>mana(pl)>=n+2?"mana":"deck"});
      if(ch==="mana"){const p=payQuiet(pl,Math.min(n,mana(pl)));giveMana(Y,p);log(`The Black Sun: ${plName(pl)} pays ${plName(Y)} ${p} mana.`,"event")}
      else{let k=0;for(let i=0;i<n&&P.deck.length;i++){const c=P.deck.pop();c.owner=Y;G.p[Y].deck.push(c);k++}shuffle(G.p[Y].deck);log(`The Black Sun: ${plName(pl)} gives ${plName(Y)} ${k} deck card${k===1?"":"s"}.`,"event")}}
  }
}
const sunBlind=pl=>!!(G.p[pl]&&G.p[pl].sunBlind!=null&&G.p[pl].sunBlind===tnOf(pl));

/* ---------- the start of a turn: Venus and its Oath ---------- */
function planetTurn(pl){
  const P=G.p[pl];if(!P||isHorde(pl))return;
  if(planetUp("venus")){const V=G.venus;
    if(V&&V.target===pl){const n=(V.mode==="a"?2:1)*(eclipseOn("venus")?2:1),got=giveMana(pl,n);if(got)log(`Venus gives ${plName(pl)} ${got} mana.`)}
    if(P.oath==="venus"){P.venusPeace=!P.venusAttacked;P.venusAttacked=false;if(P.venusPeace){const got=giveMana(pl,2);log(`Venus rewards ${plName(pl)}'s peace: ${got} mana and two more maximum this turn.`)}}
  }
  if(planetUp("jupiter")&&(!G.jupSale||G.jupSale.round!==G.moon.round))rollJupSale();
}
/* attacking a player under the Oath of Venus costs 1d2 mana and two maximum for 1d3 turns */
function venusAttack(atk,def){const P=G.p[atk];if(!P||P.oath!=="venus"||!planetUp("venus")||isNPC(def))return;
  P.venusAttacked=true;P.venusPeace=false;const d=R(2),t=R(3);payQuiet(atk,Math.min(d,mana(atk)));P.venusPen=tnOf(atk)+t;
  log(`Venus frowns on ${plName(atk)}'s attack: −${d} mana and two maximum for ${t} turn${t>1?"s":""}.`)}

/* ---------- Jupiter: sales, cheaper conjuring for its Oath, trades ---------- */
function rollJupSale(){const cj=SPELLS.filter(s=>s.school==="Conjuring"&&!s.tribe&&s.id!=="maxmana");G.jupSale={round:G.moon.round,ids:shuffle([...cj]).slice(0,2).map(s=>s.id)};
  log(`Jupiter's sale this round: ${G.jupSale.ids.map(id=>SP(id).name).join(" and ")} (maybe one mana off).`)}
const onJupSale=id=>planetUp("jupiter")&&G.jupSale&&G.jupSale.ids.includes(id);
function jupiterCost(sp,c){
  if(!planetUp("jupiter")||sp.school!=="Conjuring"||c<=1)return c;
  if(oathOf(G.active)==="jupiter")c-=1;   // the Oath of Jupiter: one less, but nothing that costs one already
  return Math.max(1,c)}
/* after a purchase: Jupiter's sale may or may not pay off; the planet's master may get a mana */
function skyBought(sp,cost){
  if(onJupSale(sp.id)&&cost>0){const v=R(2)-1;if(v){giveMana(G.active,v);log(`Jupiter's sale: ${plName(G.active)} gets ${v} mana back on ${esc(sp.name)}.`)}else log(`Jupiter's sale: no luck on ${esc(sp.name)} this time.`);jupKick()}
}
function jupKick(){const by=planetBy();if(by!=null&&G.moon.gone==="jupiter"&&by!==G.active&&R(2)===2){giveMana(by,1);log(`Fortune smiles on ${plName(by)}: 1 mana.`)}}
/* trading hand cards at the Auction while Jupiter is up */
async function tradeCard(pl){
  const P=G.p[pl];if(!P.hand.length)return;
  const others=alive().filter(i=>i!==pl&&!isHorde(i)&&G.p[i].hand.length);if(!others.length){flash("Nobody else has a card to trade.");return}
  const i=await ask(pl,{kind:"cards",id:"trade",title:"Trade: which card do you offer?",cards:P.hand,cancel:"Cancel",box:"plain"});if(i==null)return;
  const give=P.hand[i];
  const to=others.length===1?others[0]:await ask(pl,{kind:"player",id:"trade",title:"Trade with whom?",players:others});if(to==null)return;
  const Q=G.p[to];
  const j=await ask(to,{kind:"cards",id:"tradeback",title:`${esc(P.name)} offers ${esc(nameOf(give))}. Pick a card to give back, or refuse.`,cards:Q.hand,cancel:"Refuse",box:"plain",
    ai:()=>{const k=Q.hand.map((c,ix)=>[rate(c),ix]).sort((a,b)=>a[0]-b[0])[0];return k&&k[0]<=rate(give)?k[1]:null}});
  if(j==null){log(`${plName(to)} turns down ${plName(pl)}'s trade.`);flash("The trade was refused.");return}
  const back=Q.hand[j];P.hand.splice(P.hand.indexOf(give),1);Q.hand.splice(Q.hand.indexOf(back),1);give.owner=to;back.owner=pl;Q.hand.push(give);P.hand.push(back);
  log(`<b>Trade</b> under Jupiter: ${plName(pl)} and ${plName(to)} swap a card each.`,"event");jupKick();render();
}

/* ---------- the Sun's fall ---------- */
function makeVoid(r,c){const st=G.board[r][c];
  if(st){G.board[r][c]=null;for(const x of st.cards){if(x.captured&&x.captured.length){for(const s of x.captured)toGrave(s,"death");x.captured=[]}bury(x,r,c,st)}if(st.captive)toGrave(st.captive,"death")}
  G.void[r][c]=true;for(const k of Object.keys(G.map.art||{}))if(k.startsWith(r+"."+c+"."))delete G.map.art[k];
  G.crystals=(G.crystals||[]).filter(x=>!(x.r===r&&x.c===c));G.fires=(G.fires||[]).filter(x=>!(x.r===r&&x.c===c));
}
function sunFall(r,c){
  const black=planetUp("blacksun"),by=G.active;
  if(black){
    log(`<b>The Black Sun falls</b> on ${coord(r,c)}: the ground there is gone for good.`,"event");makeVoid(r,c);
    if(R(6)===6){log(`The hole tears wider: every tile around ${coord(r,c)} falls in too.`,"event");for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const rr=r+dr,cc=c+dc;if((dr||dc)&&rr>=0&&cc>=0&&rr<G.rows&&cc<COLS&&!isVoid(rr,cc))makeVoid(rr,cc)}}
    popup("The Black Sun falls",`<p>The dead sun crashes onto ${coord(r,c)}. Everything there is destroyed, and the ground becomes a hole for the rest of the game.</p>`,by);
  }else{
    log(`<b>The Second Sun falls</b> on ${coord(r,c)}!`,"event");
    const hit=(rr,cc,n)=>{if(rr<0||cc<0||rr>=G.rows||cc>=COLS||isVoid(rr,cc))return;const st=G.board[rr][cc];if(!st)return;if(hasK(st,"wall"))wallHit(rr,cc,n+1,"The falling Sun");else damage(rr,cc,n,false)};
    hit(r,c,2);
    for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if((dr||dc)&&R(2)===2)hit(r+dr,c+dc,1);
    for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++)if(Math.max(Math.abs(dr),Math.abs(dc))===2&&R(10)===10)hit(r+dr,c+dc,1);
    popup("The Second Sun falls",`<p>The Second Sun crashes onto ${coord(r,c)}: two damage there, one damage on a 2 of 1d2 on every tile around it, and one on a 10 of 1d10 on the ring beyond. Its own troops are not spared.</p>`,by);
  }
  setPlanet("fallen",null);G.moon.gone="fallen";applyMoonTheme();
  // whoever has nowhere left to put a card is out
  for(const pl of alive())if(!isHorde(pl)&&!zoneTiles(pl).length)eliminate(pl,`${esc(G.p[pl].name)} has no ground left to stand on`);
  checkWin();
}

/* ---------- spells ---------- */
PRICE.sun=()=>R(3)+R(3);PRICE.venus=()=>R(3)+R(3);PRICE.jupiter=()=>R(3)+R(3);
const firmPlace=k=>()=>G.moon.gone!==k&&G.moon.gone!=="saturn"&&!(G.eatenP||[]).includes(k);
SP("mars").school="Astrology";
SPELLS.push(
 {id:"sun",tribe:"firm",dice:"2d3",name:"Second Sun",cost:4,school:"Astrology",text:"Select your stack with a Joker: the Joker shoots itself (its souls go to your soul pile) and an indigo Second Sun (“King”) takes the moon's place. The fog of war is gone while it burns (Delusions stay). Every 2d2 turns it judges each other player: 1 mana to you, one damage to one of their stacks, or two deck cards; or blindness for that turn. Others can swear the Earth Oath. The Leviathan can't lie on it.",
  ok:()=>firmPlace("sun")()&&G.moon.gone!=="blacksun"&&selOwnJoker(),run:async()=>{const s=G.sel,st=selStack();await jokerSuicide(s.r,s.c,st,G.active);setPlanet("sun",G.active);
   log(`<b>The Second Sun</b> rises where the moon was, raised by ${plName(G.active)}.`,"event");
   popup("The Second Sun, “King”",`<p>${plName(G.active)}'s Joker shoots itself and an indigo sun rises in the moon's place. The fog of war burns away.</p><p>Every 2d2 turns the Sun judges each player: worship the Earth (1 mana, a wound to one of your stacks, or two deck cards) or be blinded for the turn. Anyone can swear the <b>Earth Oath</b> (Astrology).</p>`,G.active)}},
 {id:"sunfall",tribe:"firm",name:"Second Sun's Fall",cost:0,school:"Astrology",text:"Free. Select a stack: the Sun crashes onto it. Two damage there, one damage on a 2 of 1d2 on every tile around it, one on a 10 of 1d10 on the ring beyond, your own troops too. A Black Sun instead destroys that tile and everything on it for good (and on a 6 of 1d6 every tile around it). The sky is empty afterwards.",
  ok:()=>(sunUp()||planetUp("blacksun"))&&!!selStack(),run:async()=>{const {r,c}=G.sel;SND.gun();sunFall(r,c);if(G.sel&&!at(G.sel.r,G.sel.c))G.sel=null}},
 {id:"venus",tribe:"firm",dice:"2d3",name:"Venus",cost:4,school:"Astrology",text:"Venus (“Harmony”) takes the moon's place. Choose: you (or your teammate) get +2 mana a turn and +2 maximum, or (not in Survival) +1 mana a turn while every enemy gets +2 maximum. Anyone can swear the Oath of Venus.",
  ok:firmPlace("venus"),run:async()=>{const pl=G.active,mates=[pl,...alliesOf(pl).filter(i=>!isHorde(i))];
   const opts=[{id:"a",label:"+2 mana a turn and +2 maximum",sub:"for you or a teammate"}];if(!survival())opts.push({id:"b",label:"+1 mana a turn, every enemy +2 maximum",sub:"for you or a teammate"});
   const mode=await ask(pl,{kind:"choice",id:"venusmode",title:"Venus: which gift?",options:opts,ai:()=>"a"})||"a";
   const target=mates.length===1?pl:await ask(pl,{kind:"player",id:"venustarget",title:"Venus: for whom?",players:mates,ai:()=>pl});
   G.venus={by:pl,mode,target:target??pl};setPlanet("venus",pl);
   log(`<b>Venus</b> rises for ${plName(G.venus.target)}: ${mode==="a"?"+2 mana a turn and +2 maximum":"+1 mana a turn, and every enemy +2 maximum"}.`,"event")}},
 {id:"jupiter",tribe:"firm",dice:"2d3",name:"Jupiter",cost:4,school:"Astrology",text:"Jupiter (“Fortune”) takes the moon's place. Miners in an Ace's slots bring 1d2 a turn; each round two conjurings are on sale (maybe one mana back); cards can be traded hand to hand at the Auction; a Jester's Sacrificial Suicide brings 1d2 − 1 more. You may get a mana when others buy on sale or trade. Anyone can swear the Oath of Jupiter.",
  ok:firmPlace("jupiter"),run:async()=>{setPlanet("jupiter",G.active);rollJupSale();log(`<b>Jupiter</b> rises where the moon was, raised by ${plName(G.active)}.`,"event")}},
 {id:"oath_earth",name:"Earth Oath",cost:0,school:"Astrology",text:"Free, while the Second Sun burns. Swear to the Earth: no necromancy for you, and every Sorcery spell with a dice price rolls its price twice for you and keeps the lower. Cast again to break the Oath.",
  ok:()=>sunUp()&&me().tribe!=="firm",run:async()=>{toggleOath("earth")}},
 {id:"oath_venus",name:"Oath of Venus",cost:0,school:"Astrology",text:"Free, while Venus is up. Each turn you start without having attacked a player: +2 mana and +2 maximum for that turn. Each attack on a player costs 1d2 mana and two maximum for 1d3 turns. Cast again to break the Oath.",
  ok:()=>planetUp("venus"),run:async()=>{toggleOath("venus")}},
 {id:"oath_jupiter",name:"Oath of Jupiter",cost:0,school:"Astrology",text:"Free, while Jupiter is up. Every conjuring costs you one less, except what already costs one. Cast again to break the Oath.",
  ok:()=>planetUp("jupiter"),run:async()=>{toggleOath("jupiter")}},
 {id:"cry",tribe:"yald",name:"The Sun Cries",cost:0,school:"Sorcery",text:"Free, once every 1d3 turns, while the Second Sun burns: Yaldabaoth makes it weep. Three times and its flames go out: the Black Sun. Then the Firmament that raised it pays you 1d2 mana or 1d2 deck cards every 1d2 of its turns.",
  ok:()=>sunUp()&&tnOf(G.active)>=(me().cryReady||0),run:async()=>{const P=me();P.cryReady=tnOf(G.active)+R(3);G.sunTears=(G.sunTears||0)+1;
   if(G.sunTears>=3){G.moon.gone="blacksun";G.blackBy=G.active;applyMoonTheme();G._vis=null;for(const Q of G.p)if(Q.oath==="earth")Q.oath=null;
     log(`<b>The Sun cries a third time</b> and its flames go out: <b>the Black Sun</b>.`,"event");popup("The Black Sun",`<p>${plName(G.active)} makes the Second Sun weep a third time. Its flames go out.</p><p>The fog of war returns. The Firmament that raised it now pays Yaldabaoth 1d2 mana or 1d2 deck cards every 1d2 of its turns.</p>`,G.active)}
   else{log(`<b>The Sun cries</b> (${G.sunTears} of 3): ${plName(G.active)}'s Yaldabaoth dims it.`,"event");applyMoonTheme()}}}
);
function toggleOath(k){const P=me();if(P.oath===k){P.oath=null;log(`${plName(G.active)} breaks the ${k==="earth"?"Earth Oath":"Oath of "+(k==="venus"?"Venus":"Jupiter")}.`);return}
  P.oath=k;P.venusAttacked=false;log(`${plName(G.active)} swears the ${k==="earth"?"Earth Oath":"Oath of "+(k==="venus"?"Venus":"Jupiter")}.`,"event")}

/* Night's Judgement eats whatever hangs in the sky: the moon at the New or Full Moon, any planet at any time */
Object.assign(SP("judge"),{text:"Free: Yaldabaoth eats what hangs in the sky: the moon at the New Moon or the Full Moon, or Mars, the Second Sun (or the Black Sun), Venus or Jupiter at any time. A Leviathan on it falls back into its deck. Take its worth in mana, or count it toward the hunger (3, or 4 for Jupiter). An eaten planet never comes back.",
  ok:()=>!G.moon.gone&&(G.moon.i===0||G.moon.i===4)||!!PLANETS[G.moon.gone],run:async()=>{
   const pl=G.active,P=me(),k=sky(),v=PLANETS[k]?PLANETS[k].hunger:3,nm=PLANETS[k]?PLANETS[k].name:"the moon";
   if(G.moonLev){const L=G.moonLev;G.moonLev=null;L.card.hp=L.card.maxHp;G.p[L.owner].deck.push(L.card);shuffle(G.p[L.owner].deck);log(`The Leviathan falls from the eaten sky back into ${plName(L.owner)}'s deck.`)}
   if(k==="sun"&&eclipseOn("sun")){P.choke=G.moon.round+1;log(`${plName(pl)} eats the Sun in its eclipse and chokes on it: blind, with no hold on his own troops, this round and the next.`,"event")}
   (G.eatenP=G.eatenP||[]).push(k==="blacksun"?"sun":k);if(k==="mars")G.marsEaten=true;
   G.moon.gone="eaten";G.moon.i=-1;G.moon.blood=false;G.planetBy=null;G.venus=null;G.jupSale=null;for(const Q of G.p)Q.oath=null;applyMoonTheme();G._vis=null;
   const use=await ask(pl,{kind:"choice",id:"moonuse",title:`Night's Judgement: ${nm} is eaten`,options:[{id:"hunger",label:`Feed the hunger (${(P.hunger||0)+v} of 7)`},{id:"mana",label:`Take ${v} mana`}],ai:()=>"hunger"});
   if(use==="mana")giveMana(pl,v);else P.hunger=(P.hunger||0)+v;
   log(`<b>Night's Judgement</b>: ${plName(pl)} eats ${nm}${use==="mana"?" for mana":` (hunger ${P.hunger} of 7)`}.`,"event");
   popup("Night's Judgement",`<p>${plName(pl)} eats ${nm}. It is gone from the sky for good, until Saturn takes its place.</p>`,pl)}});
/* the Leviathan can rise onto the moon at the New Moon, or onto Mars, Venus or Jupiter at any time, never onto a Sun */
const levPlanet=()=>["mars","venus","jupiter","mercury"].includes(G.moon.gone);
SP("lev").ok=()=>(G.moon.i===0&&!G.moon.gone||levPlanet())&&!G.moonLev&&stacksOf(G.active).some(x=>hasK(x.st,"leviathan"));

/* ---------- drawings ---------- */
function planetSVG(k){
  const glowDef=(id,c)=>`<radialGradient id="${id}"><stop offset="50%" stop-color="${c}" stop-opacity=".45"/><stop offset="100%" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
  const tears=G.sunTears||0,lev=G.moonLev?levOnMoon():"";
  if(k==="sun")return `<svg class="moon sun" viewBox="-44 -44 88 88" width="88" height="88" aria-hidden="true"><defs>${glowDef("sung","#7b5cff")}<radialGradient id="sunb" cx="40%" cy="38%"><stop offset="0" stop-color="#d8ccff"/><stop offset=".55" stop-color="#6a4be0"/><stop offset="1" stop-color="#2a1878"/></radialGradient></defs><circle r="${43-tears*4}" fill="url(#sung)" opacity="${1-tears*.22}"/>${Array.from({length:12},(_,i)=>`<path d="M0,-27L0,-35" transform="rotate(${i*30})" stroke="#9a86ff" stroke-width="2" opacity="${1-tears*.25}"/>`).join("")}<circle r="23" fill="url(#sunb)" opacity="${1-tears*.15}"/></svg>`;
  if(k==="blacksun")return `<svg class="moon blacksun" viewBox="-44 -44 88 88" width="88" height="88" aria-hidden="true"><circle r="31" fill="none" stroke="#3a2a5a" stroke-width="5" opacity=".5"/><circle r="24" fill="#050308" stroke="#5a4a7a" stroke-width="1.4"/>${Array.from({length:12},(_,i)=>`<path d="M0,-26L0,-31" transform="rotate(${i*30+15})" stroke="#2a2040" stroke-width="2"/>`).join("")}</svg>`;
  if(k==="venus")return `<svg class="moon venus" viewBox="-44 -44 88 88" width="88" height="88" aria-hidden="true"><defs>${glowDef("veng","#ffe9b8")}<radialGradient id="venb" cx="40%" cy="36%"><stop offset="0" stop-color="#fffaf0"/><stop offset=".6" stop-color="#e8d2a2"/><stop offset="1" stop-color="#9a7e4a"/></radialGradient></defs><circle r="40" fill="url(#veng)"/><circle r="21" fill="url(#venb)"/>${lev}</svg>`;
  if(k==="mercury"){const pc=peaceOn(),wc=warOn();return `<svg class="moon mercury" viewBox="-44 -44 88 88" width="88" height="88" aria-hidden="true"><defs><radialGradient id="merb" cx="40%" cy="36%">${pc?`<stop offset="0" stop-color="#ffd1f0"/><stop offset=".35" stop-color="#9ff0c8"/><stop offset=".7" stop-color="#8ab8ff"/><stop offset="1" stop-color="#c58cff"/>`:wc?`<stop offset="0" stop-color="#e8a090"/><stop offset="1" stop-color="#5a1a12"/>`:`<stop offset="0" stop-color="#e2ddd6"/><stop offset=".6" stop-color="#9a948c"/><stop offset="1" stop-color="#4a4640"/>`}</radialGradient></defs>${pc?`<circle r="38" fill="#c8a8ff" opacity=".18"/>`:""}<circle r="17" fill="url(#merb)" stroke="#2a2622"/><circle cx="-5" cy="4" r="2.4" fill="#000" opacity=".18"/><circle cx="6" cy="-4" r="1.6" fill="#000" opacity=".18"/>${lev}</svg>`}
  if(k==="jupiter")return `<svg class="moon jupiter" viewBox="-44 -44 88 88" width="88" height="88" aria-hidden="true"><defs><clipPath id="jupc"><circle r="27"/></clipPath><radialGradient id="jups" cx="40%" cy="36%"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient></defs><g clip-path="url(#jupc)"><rect x="-30" y="-30" width="60" height="60" fill="#d8b98a"/>${[[-20,5,"#a8774a"],[-9,4,"#c99a6a"],[0,5,"#9a6a3e"],[10,3,"#c9a074"],[18,5,"#a8774a"]].map(([y,h,c])=>`<rect x="-30" y="${y}" width="60" height="${h}" fill="${c}"/>`).join("")}<ellipse cx="8" cy="12" rx="5" ry="3" fill="#b0482a"/></g><circle r="27" fill="url(#jups)" stroke="#5a3a1a"/>${lev}</svg>`;
  return "";
}

/* ---------- the computer and the sky ---------- */
async function aiPlanets(pl,W,cast1){
  const P=G.p[pl],lv=P.cpu;if(G.over||isHorde(pl))return;
  // Oaths
  if(planetUp("jupiter")&&P.oath!=="jupiter")await cast1("oath_jupiter");
  if(planetUp("venus")&&P.oath!=="venus"&&Math.random()<(W&&W.def>1?.7:.3))await cast1("oath_venus");
  if(sunUp()&&P.oath!=="earth"&&P.tribe!=="firm"&&lv!=="hard"&&Math.random()<.3)await cast1("oath_earth");
  if(P.tribe==="yald"&&sunUp())await cast1("cry");
  if(P.tribe!=="firm")return;
  const foes=enemiesOf(pl).flatMap(stacksOf).filter(e=>seesTile(pl,e.r,e.c));
  // the Sun's fall where enemies crowd and none of ours stand
  if(sunUp()||planetUp("blacksun")){let best=null;
    for(const e of foes){let s=AI.value(e.st)*2;for(const f of foes)if(f!==e&&Math.max(Math.abs(f.r-e.r),Math.abs(f.c-e.c))===1)s+=AI.value(f.st)*.5;
      for(const m of stacksOf(pl))if(Math.max(Math.abs(m.r-e.r),Math.abs(m.c-e.c))<=1)s-=AI.value(m.st)*.6;if(!best||s>best.s)best={...e,s}}
    if(best&&best.s>(planetUp("blacksun")?6:9))await cast1("sunfall",best.r,best.c)}
  if(G.moon.gone==="mars"||G.moon.gone==="saturn"||PLANETS[G.moon.gone]&&G.planetBy===pl)return;   // keep the planet it raised
  const m=mana(pl);
  if(m>=(G.prices.venus||4)+1&&Math.random()<.4)await cast1("venus");
  else if(stacksOf(pl).reduce((a,x)=>a+x.st.cards.filter(c=>c.unit==="miner").length,0)>=1&&m>=(G.prices.jupiter||4)+2&&Math.random()<.25)await cast1("jupiter");
  else if(lv!=="easy"&&m>=(G.prices.sun||4)+2&&Math.random()<.12){const j=stacksOf(pl).find(x=>hasK(x.st,"joker")&&!(x.st.cards.find(c=>kind(c)==="joker").captured||[]).length);if(j)await cast1("sun",j.r,j.c)}
}

/* ---------- what the sky says when you hover it ---------- */
const PNOTE={
  sun:()=>`The Second Sun burns where the moon was: no fog of war; every 2d2 turns it judges each player`,
  blacksun:()=>`The Black Sun hangs where the moon was: its flames are out`,
  venus:()=>`Venus hangs where the moon was${G.venus?`: ${esc(G.p[G.venus.target].name)} gets ${G.venus.mode==="a"?"+2 mana a turn and +2 maximum":"+1 mana a turn, every enemy +2 maximum"}`:""}`,
  mercury:()=>`Mercury hangs where the moon was${peaceOn()?": Peace":warOn()?": Total War":": Peace, Total War, Betrayal, bribes"}`,
  jupiter:()=>`Jupiter hangs where the moon was: Ace miners bring 1d2, two conjurings on sale${G.jupSale?` (${G.jupSale.ids.map(id=>SP(id).name).join(", ")})`:""}, trades at the Auction`,
  fallen:()=>`The Second Sun has fallen: the sky is empty`
};
function planetInfoHTML(k){
  const V=view(),P=G.p[V],L=[],by=planetBy();
  if(k==="sun"){L.push(`The indigo Second Sun burns in the moon's place${by!=null?`, raised by ${esc(G.p[by].name)}`:""}. The fog of war is gone (a Delusion still blinds). The Leviathan can't lie on it.`);
    L.push(P.tribe==="firm"?"The Sun doesn't judge you.":`Every 2d2 of your turns it judges you: 1 mana${by!=null?" to "+esc(G.p[by].name):" to the Bank"}, one damage to one of your stacks, or two deck cards; or you are blind for that turn.`);
    L.push(`It has cried ${G.sunTears||0} of 3 times; at three it becomes the Black Sun.`);
    L.push(P.oath==="earth"?"You have sworn the Earth Oath: no necromancy, and Sorcery dice prices roll twice for you and keep the lower.":"You can swear the Earth Oath (Astrology): no necromancy, cheaper Sorcery dice prices.")}
  if(k==="blacksun"){L.push("The Black Sun: the Second Sun cried three times and its flames went out. The fog of war is back.");if(G.blackBy!=null)L.push(`The Firmament that raised it pays ${esc(G.p[G.blackBy].name)} 1d2 mana or 1d2 deck cards every 1d2 of its turns.`);L.push("If it falls, it destroys the tile it lands on for good.")}
  if(k==="venus"){L.push(PNOTE.venus()+".");L.push(P.oath==="venus"?"Your Oath of Venus: +2 mana and +2 maximum each turn you start without having attacked a player; each attack on a player costs 1d2 mana and two maximum for 1d3 turns.":"You can swear the Oath of Venus (Astrology).")}
  if(k==="jupiter"){L.push("Jupiter hangs in the moon's place. Miners in an Ace's slots bring 1d2 a turn. Each round two conjurings are on sale (maybe a mana back). Hand cards can be traded at the Auction. A Jester's Sacrificial Suicide brings 1d2 − 1 more mana.");
    if(G.jupSale)L.push(`On sale this round: ${G.jupSale.ids.map(id=>SP(id).name).join(" and ")}.`);
    L.push(P.oath==="jupiter"?"Your Oath of Jupiter: every conjuring costs one less, except what already costs one.":"You can swear the Oath of Jupiter (Astrology).")}
  if(k==="mercury"){L.push(`Mercury hangs in the moon's place. Anyone can call a vote for Peace or Total War (everyone must agree), or Buy Peace for two rounds. The Oath of Mercury unlocks Betrayal, Declare War and Bribe the Banker.`);
    if(peaceOn())L.push(`Peace until round ${G.peace.until}: no player may attack another or step into another player's lines.`);if(warOn())L.push(`Total War until round ${G.war.until}: kills fall into the Outer Darkness and pay a mana; teammates may fight.`);
    L.push(P.oath==="mercury"?"You have sworn the Oath of Mercury.":"You can swear the Oath of Mercury (Astrology).")}
  if(G.eclipse&&G.eclipse.k===k)L.push(`<b>Eclipsed</b> this round${k==="jupiter"?" and the next":""}.`);
  if(k==="fallen")L.push("The Second Sun fell to the ground. Nothing hangs in the sky now: no phases, no gifts, no tolls.");
  if(G.moonLev&&["venus","jupiter"].includes(k))L.push(`The Leviathan coils on ${PLANETS[k].name}; its toll and its weak spot come every eighth round.`);
  const nm=PLANETS[k]?PLANETS[k].name:"The empty sky",word=PLANETS[k]?SKY_NAME[k==="blacksun"?"sun":k]:"";
  return `<div class="cin sky"><div class="cih"><b>${nm}</b>${word?` <span class="skyword">“${word}”</span>`:""}</div><p>${L.join("</p><p>")}</p></div>`;
}
/* the earth Oath's cheaper sorcery: the dice price is rolled twice for you and the lower kept */
function skyPrices(pl){if(oathOf(pl)!=="earth"||!G.prices)return;for(const s of SPELLS)if(s.school==="Sorcery"&&PRICE[s.id]&&G.prices[s.id]!=null)G.prices[s.id]=Math.min(G.prices[s.id],PRICE[s.id]())}

/* ---------------- Prompt 10c: Mercury (Peace, Total War, Betrayal, bribing the Banker), eclipses, Eclipse Mode,
   and the computer looking after itself ---------------- */

PLANETS.mercury={name:"Mercury",word:"Guile",hunger:3};OATH_SKY.mercury="mercury";
const peaceOn=()=>!!(G.peace&&G.moon.round<=G.peace.until);
const warOn=()=>!!(G.war&&G.moon.round<=G.war.until);
const betrayOn=()=>!!(G.betrayal&&G.moon.round<=G.betrayal.until);
const realPlayers=()=>alive().filter(i=>!isHorde(i));
/* who may strike whom: Total War lets teammates fight; Peace stops every fight between players */
const warFoe=(a,b)=>warOn()&&a!==b&&!isHorde(a)&&!isHorde(b)&&G.p[a]&&G.p[b]&&!isEnemy(a,b);
const peaceBlock=(a,b)=>peaceOn()&&!isHorde(a)&&!isHorde(b);
/* kills under Total War or right after a betrayal fall into the Outer Darkness */
const warOD=()=>warOn()||betrayOn();

/* ---------- the start of each round: eclipses, the end of Peace and War, bribes ---------- */
async function eclipseRound(){
  if(G.over)return;const r=G.moon.round;
  if(G.peace&&r>G.peace.until){G.peace=null;log("<b>Peace ends.</b> The lines are open again.","event");notify(null,"Peace is over.")}
  if(G.war&&r>G.war.until){G.war=null;log("<b>Total War ends.</b>","event");notify(null,"Total War is over.")}
  if(G.war)G.warCurse=R(2)-1;
  if(G.eclipse&&r>G.eclipse.round+(G.eclipse.k==="jupiter"?1:0)){endEclipse()}
  // the Banker's bribes are paid every round
  for(const b of [...(G.bribes||[])]){if(r>b.until||G.p[b.by].out||G.p[b.target].out){G.bribes.splice(G.bribes.indexOf(b),1);log(`The bribe against ${plName(b.target)} runs out.`);continue}
    if(b.paid===r)continue;const c=R(2)+R(3)+R(3);if(mana(b.by)>=c){payQuiet(b.by,c);bankAdd(c);b.paid=r;log(`${plName(b.by)} keeps the Banker bribed (${c} mana): ${plName(b.target)} pays more.`)}
    else{G.bribes.splice(G.bribes.indexOf(b),1);log(`${plName(b.by)} can't pay the Banker: the bribe against ${plName(b.target)} ends.`)}}
  // each planet: 5% a round, or at once in Eclipse Mode
  const k=sky();
  if(["sun","mars","venus","jupiter","mercury"].includes(k)&&!G.eclipse&&(Math.random()<.05||G.opts.eclipseStart&&!G.eclipsedOnce||G.forceEclipse)){G.forceEclipse=false;G.eclipsedOnce=true;await eclipse(k)}
}

/* ---------- Peace ---------- */
function sendHome(pl){
  const P=G.p[pl];let home=0,toDeck=0;
  for(const {st,r,c} of stacksOf(pl)){if(canSpawn(pl,r,c))continue;
    const free=zoneTiles(pl).filter(([rr,cc])=>!G.board[rr][cc]).sort((a,b)=>Number(isBack(pl,a[0],a[1]))-Number(isBack(pl,b[0],b[1])));
    G.board[r][c]=null;
    if(free.length){const [rr,cc]=free[0];G.board[rr][cc]=st;st.moved=true;home++}
    else{const cs=[...st.cards].sort((a,b)=>rate(a)-rate(b));for(const x of cs){if(x.hp!=null)x.hp=x.maxHp;P.deck.push(x);toDeck++}if(st.captive)toGrave(st.captive,"death");shuffle(P.deck)}
  }
  if(home||toDeck)log(`Peace: ${plName(pl)}'s ${home?`${home} stack${home>1?"s go":" goes"} home`:""}${home&&toDeck?"; ":""}${toDeck?`${toDeck} card${toDeck>1?"s":""} with no room go back into the deck`:""}.`);
}
function startPeace(rounds,why){
  const r=G.moon.round;G.peace={until:r+rounds-1};G.war=null;
  for(const pl of realPlayers())sendHome(pl);
  // every wound heals; every curse and enchantment ends
  for(const row of G.board)for(const st of row){if(!st)continue;st.odds=null;st.hypo=0;st.supp=null;for(const c of st.cards){if(c.maxHp)c.hp=c.maxHp;c.hate=false}}
  for(const P of G.p){P.shield=false;P.joy=false;P.theft=false}
  // three cards from the grave to everyone, one at a time around the table
  let given=0;for(let k=0;k<3;k++)for(const pl of realPlayers()){if(!G.grave.length)break;const c=G.grave.splice(Math.floor(Math.random()*G.grave.length),1)[0];c.owner=pl;const P=G.p[pl];if(P.hand.length<handCap(pl))P.hand.push(c);else{P.deck.push(c);shuffle(P.deck)}given++}
  log(`<b>Peace</b> (${why}) for ${rounds} rounds: everyone goes home, every wound heals, curses and enchantments end${given?`, and the grave hands out ${given} card${given>1?"s":""}`:""}. No one may cross into another player's lines or attack another player.`,"event");
  popup("Peace",`<p>${why}. For ${rounds} rounds no player can attack another or step into another player's lines.</p><p>Every stack out on the field went home (what had no room went back into the deck), every card with hearts healed, curses and enchantments ended, and everyone drew three cards from the grave, one at a time.</p>`);
  G._vis=null;applyMoonTheme();
}
function startWar(rounds,why){
  G.war={until:G.moon.round+rounds-1};G.peace=null;G.warCurse=R(2)-1;
  log(`<b>Total War</b> (${why}) for ${rounds} round${rounds>1?"s":""}: every card killed falls into the Outer Darkness and gives its killer a mana, curses cost up to one less, and teammates may strike each other for mana.`,"event");
  popup("Total War",`<p>${why}. For ${rounds} round${rounds>1?"s":""}:</p><p>Every card killed falls into the Outer Darkness, and whoever killed it gets a mana. Curses cost 1d2 − 1 less. Teammates can attack each other, and every damage to a teammate pays its soul's worth + 1d2 − 1 in mana.</p>`);
}
/* everyone votes; Peace and Total War need every player */
async function vote(title,text){const yes=[],no=[];
  for(const pl of realPlayers()){const ok=await ask(pl,{kind:"yesno",id:"vote",title:`${title}: ${esc(G.p[pl].name)} votes`,text,yes:"Agree",no:"Refuse",ai:()=>aiVote(pl,title)});(ok?yes:no).push(pl)}
  log(`${title}: ${yes.length?yes.map(plName).join(", ")+(yes.length===1?" agrees":" agree"):"nobody agrees"}${no.length?`; ${no.map(plName).join(", ")} refuse${no.length===1?"s":""}`:""}.`);return{yes,no}}
/* the computer looks after itself: peace when it is losing, war when it is winning */
function strength(pl){return stacksOf(pl).reduce((a,x)=>a+AI.value(x.st),0)+mana(pl)*.5+G.p[pl].deck.length*.15}
function aiVote(pl,title){const me=strength(pl),them=Math.max(1,...enemiesOf(pl).filter(i=>!isHorde(i)).map(strength));
  if(/Peace/.test(title))return me<them*1.05;return me>them*1.2}

/* ---------- payouts in war and betrayal ---------- */
function warKill(killer){if(killer!=null&&!isHorde(killer)&&warOn()){const g=giveMana(killer,1);if(g)log(`Total War pays ${plName(killer)} 1 mana for the kill.`)}}
function warDamagePay(atk,def,dmg,D){
  if(!dmg||isHorde(atk)||isHorde(def))return;const B=G.betrayal;
  const mates=warFoe(atk,def)||betrayOn()&&B&&(atk===B.by&&B.mates.includes(def)||def===B.by&&B.mates.includes(atk));
  if(!mates)return;const lead=leadCard(D)||D.cards[0],per=(lead?soulOf(lead):1)+R(2)-1,n=giveMana(atk,per*dmg);
  if(n)log(`${plName(atk)} strikes a ${B&&atk===B.by||B&&def===B.by?"former ":""}teammate: ${n} mana.`)}

/* ---------- eclipses ---------- */
async function eclipse(k){
  G.eclipse={k,round:G.moon.round};applyMoonTheme();
  const nm=PLANETS[k].name;
  if(k==="sun"){
    log(`<b>An eclipse</b>: the Second Sun slides in front of the first. Every hand, every Assassin and every face-down card is shown, and everyone may take one of their own cards back out of the Outer Darkness.`,"event");
    popup("The suns align",`<p>The Second Sun crosses the first. The field darkens and the air shimmers.</p><p>This round every hand, every Assassin and every face-down card is shown, and each player can take one card that was theirs back out of the Outer Darkness. If Yaldabaoth eats the Sun now, he chokes on it: blind this round and the next.</p>`);
    for(const pl of realPlayers()){const P=G.p[pl],mine=G.dark.filter(c=>c.darkOwner===pl);if(!mine.length)continue;
      const i=await ask(pl,{kind:"cards",id:"eclipseod",title:`The eclipse: ${esc(P.name)}, take one card back from the Outer Darkness`,cards:mine,cancel:"Leave them",box:"dark",ai:()=>{let b=0;mine.forEach((c,j)=>{if(rate(c)>rate(mine[b]))b=j});return b}});
      if(i==null||!mine[i])continue;const c=mine[i];G.dark.splice(G.dark.indexOf(c),1);c.owner=pl;if(c.hp!=null)c.hp=c.maxHp;if(P.hand.length<handCap(pl))P.hand.push(c);else{P.deck.push(c);shuffle(P.deck)}
      log(`${plName(pl)} pulls ${esc(nameOf(c))} back out of the Outer Darkness.`)}
  }
  if(k==="jupiter"){
    const Y=realPlayers().find(i=>G.p[i].tribe==="yald");
    log(`<b>An eclipse</b>: the Sun passes behind Jupiter.`,"event");
    const lines=[];G.jupMax={until:G.moon.round+1};
    for(const pl of realPlayers()){const d=rollN(2,3),v=sum(d)-1;G.jupMax[pl]=v;const P=G.p[pl];P.minerX2=tnOf(pl)+R(4);
      const got=giveMana(pl,Math.max(0,Math.min(surCap(pl),2*soulCap(pl))-mana(pl)));lines.push(`${esc(P.name)}: 2d3 − 1 = ${d.map(x=>x.v).join(" + ")} − 1 = <b>+${v}</b> maximum, ${got} mana`);tray(pl,"Jupiter eclipse",d,`+${v} max`,true)}
    if(G.bank){for(const pl of realPlayers()){const P=G.p[pl];P.debt=0;P.debtAt=null;P.loans=[]}if(G.bank.mana>0)G.bank.mana*=2}
    if(Y!=null){const n=G.dark.filter(c=>c.darkOwner!==Y).length,got=giveMana(Y,n);if(got)log(`Yaldabaoth drinks from the eclipse: ${plName(Y)} gets ${got} mana for the souls of others in the Outer Darkness.`,"event")}
    popup("Jupiter's eclipse",`<p>The Sun passes behind Jupiter. For this round and the next:</p><p>${lines.join("<br>")}</p><p>Every soul pile fills to twice its maximum. The Bank forgives every debt and loan and doubles what it holds; everything in the Ether is on sale. Miners bring twice as much for 1d4 turns.</p>`);
  }
  if(k==="venus"){
    log(`<b>An eclipse of Venus</b>: its gifts are doubled this round, and the grave makes an offer.`,"event");
    popup("Venus eclipsed",`<p>Venus's gifts are doubled this round.</p><p>Each player may give five random deck cards to another player to take five cards from the grave.</p>`);
    for(const pl of realPlayers()){const P=G.p[pl];const others=realPlayers().filter(i=>i!==pl);if(P.deck.length<5||G.grave.length<5||!others.length)continue;
      const yes=await ask(pl,{kind:"yesno",id:"venusdeal",title:`Venus eclipsed: ${esc(P.name)}`,text:"Give five random cards from your deck to another player, and take five cards from the grave?",yes:"Deal",no:"No",ai:()=>P.deck.length>15&&Math.random()<.5});
      if(!yes)continue;const to=others.length===1?others[0]:await ask(pl,{kind:"player",id:"venusto",title:"Who gets your five cards?",players:others,ai:()=>others[0]});
      for(let i=0;i<5;i++){const c=P.deck.splice(Math.floor(Math.random()*P.deck.length),1)[0];c.owner=to;G.p[to].deck.push(c)}shuffle(G.p[to].deck);
      for(let i=0;i<5&&G.grave.length;i++){const c=G.grave.splice(Math.floor(Math.random()*G.grave.length),1)[0];c.owner=pl;P.deck.push(c)}shuffle(P.deck);
      log(`${plName(pl)} gives five deck cards to ${plName(to)} and takes five from the grave.`,"event")}
  }
  if(k==="mercury"){
    const n=realPlayers().length;
    log(`<b>An eclipse of Mercury</b>: Peace, or war for everyone.`,"event");
    const v=await vote("Mercury eclipsed: Peace","Agree to Peace for 1d2 + 1 rounds? If the vote is split evenly, or most refuse, Total War breaks out instead.");
    const rounds=R(2)+1;
    if(v.yes.length>v.no.length)startPeace(rounds,"Mercury's eclipse, by vote");else startWar(rounds,n===2?"Mercury's eclipse, one on one":"Mercury's eclipse: everyone against everyone");
  }
  if(k==="mars"){
    log(`<b>An eclipse of Mars</b>.`,"event");const msgs=[];
    // the strongest of the Outer Darkness tries to escape
    if(G.dark.length){const top=[...G.dark].filter(c=>c.darkOwner!=null&&G.p[c.darkOwner]&&!G.p[c.darkOwner].out).sort((a,b)=>rate(b)-rate(a)).slice(0,3);
      let best=null;for(const c of top){const d=die(c)||6,v=nat(c)+R(d);if(!best||v>best.v)best={c,v}}
      if(best){const c=best.c,o=c.darkOwner;G.dark.splice(G.dark.indexOf(c),1);c.owner=o;if(c.hp!=null)c.hp=c.maxHp;G.p[o].deck.push(c);shuffle(G.p[o].deck);
        const m=G.dark.length===0&&top.length===1?`${esc(nameOf(c))} was alone in the Outer Darkness and walks back into ${esc(G.p[o].name)}'s deck.`:`${esc(nameOf(c))} (rolled ${best.v}) beats the strongest of the Outer Darkness and escapes into ${esc(G.p[o].name)}'s deck.`;
        log(m,"event");msgs.push(m);notify(o,m)}}
    // two free curses for everyone, never the same one twice
    for(const pl of realPlayers())G.p[pl].freeCurses={left:2,used:[]};msgs.push("Everyone gets two free curses, never the same curse twice.");log("Mars gives everyone two free curses, never the same curse twice.","event");
    // Samson may walk out of Limbo
    const s=G.limbo.find(c=>c.unit==="samson");const A=s&&G.p.find(P=>P.tribe==="angel"&&!P.out);
    if(s&&A&&R(2)===2){G.limbo.splice(G.limbo.indexOf(s),1);s.owner=A.i;s.hp=s.maxHp;A.deck.push(s);shuffle(A.deck);const m=`Samson walks out of Limbo and back into ${esc(A.name)}'s deck.`;log(m,"event");msgs.push(m)}
    popup("Mars eclipsed",`<p>${msgs.join("</p><p>")}</p>`);
  }
}
function endEclipse(){const k=G.eclipse.k;G.eclipse=null;if(k==="jupiter")G.jupMax=null;log(`The eclipse of ${PLANETS[k].name.replace(/^The /,"the ")} passes.`);applyMoonTheme();G._vis=null}
const eclipseOn=k=>!!(G.eclipse&&G.eclipse.k===k);

/* ---------- prices under Mercury, war, eclipses ---------- */
function mercuryCost(sp,c){
  if(c<=0)return c;
  for(const b of G.bribes||[])if(b.target===G.active&&G.moon.round<=b.until)c+=1;
  if(warOn()&&sp.school==="Curse")c=Math.max(0,c-(G.warCurse||0));
  if(eclipseOn("jupiter")&&sp.school==="Conjuring")c=Math.max(1,c-1);
  const P=G.p[G.active];if(P&&P.freeCurses&&P.freeCurses.left>0&&sp.school==="Curse"&&!P.freeCurses.used.includes(sp.id))c=0;
  return c}
function mercuryBought(sp){const P=me();if(P.freeCurses&&P.freeCurses.left>0&&sp.school==="Curse"&&!P.freeCurses.used.includes(sp.id)){P.freeCurses.left--;P.freeCurses.used.push(sp.id);log(`Mars's gift: ${esc(sp.name)} is free (${P.freeCurses.left} left).`)}}

/* ---------- spells ---------- */
PRICE.mercury=()=>R(3)+R(3);PRICE.buypeace=()=>R(2)+R(2)+R(2)+R(2);PRICE.betray=()=>R(2)+R(3)+R(3);PRICE.warnow=()=>R(2)+R(3)+R(3);PRICE.bribe=()=>R(2)+R(3)+R(3);
SPELLS.push(
 {id:"mercury",tribe:"firm",dice:"2d3",name:"Mercury",cost:4,school:"Astrology",text:"Mercury (“Guile”) takes the moon's place. Under it anyone can call a vote for Peace or Total War, or buy Peace; those who swear the Oath of Mercury can betray their team, declare war alone, and bribe the Banker.",
  ok:firmPlace("mercury"),run:async()=>{setPlanet("mercury",G.active);log(`<b>Mercury</b> rises where the moon was, raised by ${plName(G.active)}.`,"event")}},
 {id:"peace",name:"Peace Time",cost:0,school:"Astrology",text:"Free, under Mercury; everyone must agree. Peace for 3 + 1d2 − 1 rounds: every stack goes home (what has no room goes back into the deck, weakest first), every card with hearts heals, curses and enchantments end, everyone gets three cards from the grave one at a time, and no player can attack another or step into another player's lines.",
  ok:()=>planetUp("mercury")&&!peaceOn()&&!warOn()&&!G.voted,run:async()=>{G.voted=true;const v=await vote("Peace","Agree to Peace for 3 or 4 rounds?");if(!v.no.length)startPeace(2+R(2),"agreed by everyone");else log("No peace: not everyone agrees.")}},
 {id:"buypeace",dice:"4d2",name:"Buy Peace",cost:6,school:"Astrology",text:"Under Mercury, without a vote: Peace for two rounds, with everything Peace brings.",
  ok:()=>planetUp("mercury")&&!peaceOn(),run:async()=>{startPeace(2,`bought by ${esc(me().name)}`)}},
 {id:"war",name:"Total War",cost:0,school:"Astrology",text:"Free, under Mercury; everyone must agree. For 3 + 1d2 − 1 rounds every card killed falls into the Outer Darkness and gives its killer a mana, curses cost 1d2 − 1 less, and teammates may strike each other: each damage to a teammate pays its soul's worth + 1d2 − 1.",
  ok:()=>planetUp("mercury")&&!warOn()&&!peaceOn()&&!G.voted,run:async()=>{G.voted=true;const v=await vote("Total War","Agree to Total War for 3 or 4 rounds?");if(!v.no.length)startWar(2+R(2),"agreed by everyone");else log("No war: not everyone agrees.")}},
 {id:"oath_mercury",name:"Oath of Mercury",cost:0,school:"Astrology",text:"Free, while Mercury is up. Unlocks Betrayal, Declare War and Bribe the Banker. Cast again to break the Oath.",
  ok:()=>planetUp("mercury"),run:async()=>{toggleOath("mercury")}},
 {id:"betray",dice:"1d2+2d3",name:"Betrayal",cost:6,school:"Astrology",text:"Oath of Mercury, in a team game. You leave your team for good. For two rounds every card killed falls into the Outer Darkness, and every damage between you and your former teammates pays its dealer the soul's worth + 1d2 − 1.",
  ok:()=>oathOf(G.active)==="mercury"&&alliesOf(G.active).filter(i=>!isHorde(i)).length>0,run:async()=>{const pl=G.active,mates=alliesOf(pl).filter(i=>!isHorde(i));
   const sure=await ask(pl,{kind:"yesno",id:"betray",title:"Betrayal",text:`Betray ${mates.map(i=>esc(G.p[i].name)).join(" and ")}? It can't be undone.`,yes:"Betray",no:"Stay loyal",ai:()=>true});
   if(!sure){giveMana(pl,spellCost(SP("betray")));log(`${plName(pl)} thinks better of it.`);return}
   G.p[pl].team=300+pl;G.betrayal={by:pl,mates,until:G.moon.round+1};G._vis=null;
   log(`<b>Betrayal</b>: ${plName(pl)} turns on ${mates.map(plName).join(" and ")}.`,"event");
   popup("Betrayal",`<p>${plName(pl)} betrays ${mates.map(plName).join(" and ")}. They are enemies now, for good.</p><p>For two rounds every card killed falls into the Outer Darkness, and every damage between them pays its dealer.</p>`,pl);checkWin()}},
 {id:"warnow",dice:"1d2+2d3",name:"Declare War",cost:6,school:"Astrology",text:"Oath of Mercury, without a vote: Total War for 1d2 rounds.",
  ok:()=>oathOf(G.active)==="mercury"&&!warOn(),run:async()=>{startWar(R(2),`declared by ${esc(me().name)}`)}},
 {id:"bribe",dice:"1d2+2d3",name:"Bribe the Banker",cost:6,school:"Astrology",text:"Oath of Mercury. Pick a player: every spell costs them one more for 3d2 − 1 rounds. The bribe costs 1d2 + 2d3 now and again at the start of every round; it ends when you can't pay.",
  ok:()=>oathOf(G.active)==="mercury"&&bankOpen(),run:async()=>{const t=await pickFoe("bribe","Bribe the Banker against whom?");if(t==null)return;const rounds=R(2)+R(2)+R(2)-1;
   (G.bribes=G.bribes||[]).push({by:G.active,target:t,until:G.moon.round+rounds-1,paid:G.moon.round});G.histTarget=t;
   log(`<b>Bribe</b>: ${plName(G.active)} pays the Banker to squeeze ${plName(t)} for ${rounds} rounds.`,"event")}}
);

/* ---------- the computer and Mercury ---------- */
async function aiMercury(pl,W,cast1){
  const P=G.p[pl],lv=P.cpu;if(G.over||isHorde(pl))return;
  if(P.tribe==="firm"&&!PLANETS[G.moon.gone]&&G.moon.gone!=="saturn"&&mana(pl)>=(G.prices.mercury||4)+2&&Math.random()<.12)await cast1("mercury");
  if(!planetUp("mercury"))return;
  const me=strength(pl),them=Math.max(1,...enemiesOf(pl).filter(i=>!isHorde(i)).map(strength));
  const tryVote=G.moon.round-(P.voteRound||-9)>=4;   // don't nag the table every round
  if(me<them*.7&&!peaceOn()&&tryVote){P.voteRound=G.moon.round;if(!await cast1("peace"))if(mana(pl)>=(G.prices.buypeace||8)+2)await cast1("buypeace")}   // losing: ask for peace
  if(lv!=="easy"&&P.oath!=="mercury"&&Math.random()<.4)await cast1("oath_mercury");
  if(oathOf(pl)==="mercury"){
    if(lv==="hard"&&me>them*1.4&&!warOn()&&mana(pl)>=(G.prices.warnow||6)+2)await cast1("warnow");
    else if(me>them*1.3&&!warOn()&&tryVote){P.voteRound=G.moon.round;await cast1("war")}
    if(lv==="hard"&&mana(pl)>=(G.prices.bribe||6)+4&&!(G.bribes||[]).some(b=>b.by===pl)&&Math.random()<.4)await cast1("bribe");
    const mates=alliesOf(pl).filter(i=>!isHorde(i));   // betray only a teammate far weaker, when it pays
    if(lv==="hard"&&mates.length&&mates.every(m=>strength(m)*2.5<me)&&realPlayers().length<=3&&Math.random()<.15)await cast1("betray");
  }
}
/* Yaldabaoth choking on an eclipsed Sun: no sight and no hold on his troops this round and the next */
const choked=pl=>!!(G&&G.p[pl]&&G.p[pl].choke!=null&&G.moon.round<=G.p[pl].choke);

})();
