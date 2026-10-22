/* ---------------- basics ---------------- */
const $=s=>document.querySelector(s);
const R=n=>1+Math.floor(Math.random()*n);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const SPEED={slow:1.7,normal:1,fast:.4};
const sleep=ms=>{const g=G;return new Promise(r=>{const go=()=>{if(G!==g)return;if(G.paused){setTimeout(go,200);return}r()};setTimeout(go,G&&G.opts.fast?0:ms*(SPEED[G&&G.opts.cpuSpeed]||1)*(G&&G.speedMul||1))})}; // a new game silently ends the old game's waits; the menu pauses them
const SUITS={S:"♠",H:"♥",D:"♦",C:"♣"};
const SUITNAME={S:"Spades",H:"Hearts",D:"Diamonds",C:"Clubs"};
let COLS=5;const SOUL_CAP=6, HAND_CAP=6;   // COLS is set by the map for each game; SOUL_CAP is also what a Joker can hold
/* an Emanation can raise a player's own limits. Mana can go up to three times the maximum for a round (the surplus);
   anything over the maximum fades at the start of the next round */
const surCap=pl=>G&&G.satStrict&&!oathNow(pl,"saturn")&&!(G.satStrictSafe||[]).includes(pl)?soulCap(pl):Math.min(54,soulCap(pl)*3);   // a strict Saturn (its eclipse) allows no surplus
const handCap=pl=>G&&G.p[pl]?({jester:7,beginner:8}[G.p[pl].tribe]||HAND_CAP)*(nepGlow(pl)?3:1):HAND_CAP;   // v71d: Neptune's Afterglow triples it
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

/* ---------------- Emanations, colors, symbols ----------------
   An Emanation is what a player plays as. Some fix the color and the symbol (the Angel Machine is always Bone and the mask,
   Satan always his dark crimson and the claw); the rest leave both to the player. "soon" ones arrive in the next update. */
const BONE="#e9dfc4",SATAN_RED="#9c1428";
const TRIBES={
 random:{name:"Random",sub:"One of the Emanations below, picked when the game starts."},
 beginner:{name:"Beginner",hidden:true,gone:true,sub:"Eight starting cards, eight mana and an eight-card hand, a second Ace and a Joker in hand, three Grunts already on the field, and Please Don't Hurt Me once a game."},
 angel:{name:"Angel Machine",sub:"Antony's Emanation. Always Bone white with the cracked mask. Samson in the deck, Lightning Strike from three bolts, and Three of Swords for 1 mana.",color:BONE,solid:"mask"},
 satan:{name:"Satan",sub:"Always dark crimson with the claw. The Satan card (three hearts, 6d12, stands alone) and the curse Hate.",color:SATAN_RED,solid:"claw"},
 binah:{name:"Binah",sub:"The Southern tribe of the Euclids. Three Slavemasters capture the soldiers they defeat, and the captured come back as armed Slaves. Jokers hit for +3."},
 jester:{name:"Jester Fool",sub:"The Tree of Neither Life Or Death, Puppets for every soldier, the BullGoat, and Deck of Cards. Seven-card hand, seven mana."},
 tiph:{name:"Tiphareth of Kether",sub:"The Northern tribe of the Euclids. Three Traffickers chain the souls that die beside them and sell them at the Auction. The Blindfold, immunity to the Leviathan on the moon, and Jokers that hit for +1."},
 lucifer:{name:"Lucifer & Ouroboros",sub:"Always the ink and scroll. The Delusions of Ouroboros and of Lucifer, Deconjured, and Pleasure and Joy.",solid:"scroll"},
 leviathan:{name:"The Leviathan",sub:"The black serpent in the deck: three hearts, 6d4 + 1d2 + 6. On a New Moon it can rise onto the moon and tax every New Moon after. Its Jokers can exile souls to the Outer Darkness."},
 firm:{name:"The Firmament",sub:"Always the eight-pointed star. Untouched by the Moon's and Saturn's harms and by meteors; a Miner on the moon; Blood Moon, Rain, Asteroid, Fog, and Mars in the sky.",solid:"star8"},
 yald:{name:"Yaldabaoth",sub:"Always the symbol of Saturn. Night's Judgement eats the moon, God Hunger eats cards, and seven eaten bring Saturn and its Debt Collectors.",solid:"saturn"},
 plain:{name:"No Emanation",sub:"The plain rules: no Emanation's advantages or drawbacks.",hidden:true}   // v70d: only through the host's No Emanations option
};
const PLAYABLE=Object.keys(TRIBES).filter(k=>k!=="random"&&!TRIBES[k].soon&&!TRIBES[k].hidden);
/* v71e: one palette for both a player's color and their accent, in hue order. Bone stays the Angel Machine's and Onyx is too
   dark to read names by, so neither is a player's color; both can be accents. Colors that look alike block each other. */
const PALETTE=[["Crimson","#d7333b"],["Blood","#b3191f"],["Rose","#e4648f"],["Rose gold","#e8a598"],["Flame","#ff7a1a"],["Ember","#ee7a3c"],["Copper","#c47a3c"],["Umber","#9a6236"],
  ["Gold","#e3b944"],["Lime","#c6df47"],["Moss","#8fb33f"],["Emerald","#2fa36b"],["Forest","#2f9150"],["Verdigris","#45b89c"],["Frost","#74d7ea"],["Ice","#9fe3f0"],
  ["Azure","#4c92e6"],["Sapphire","#3a6fd8"],["Indigo","#5d5fe3"],["Violet","#a77de8"],["Amethyst","#9a62d8"],["Magenta","#cf4fd0"],
  ["Slate","#8597ad"],["Ash","#7a7f88"],["Silver","#c9ccd6"],["Bone","#efe2c8"],["Onyx","#17120e"]];
const COLORS=PALETTE.filter(([n])=>n!=="Bone");   // v71m: Onyx (black) is a player's color too; its names and symbols get a light edge
/* how alike two colors look (CIE Lab distance under 20): such colors can't both be players' colors */
const labOf=h=>{const f=c=>{c/=255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4)},[r,g,b]=[1,3,5].map(i=>f(parseInt(h.slice(i,i+2),16)));
  const X=(.4124*r+.3576*g+.1805*b)/.95047,Y=.2126*r+.7152*g+.0722*b,Z=(.0193*r+.1192*g+.9505*b)/1.08883,q=t=>t>.008856?Math.cbrt(t):7.787*t+16/116;
  return [116*q(Y)-16,500*(q(X)-q(Y)),200*(q(Y)-q(Z))]};
const colorNear=(a,b)=>{if(!a||!b||a[0]!=="#"||b[0]!=="#")return false;const A=labOf(a),B=labOf(b);return Math.hypot(A[0]-B[0],A[1]-B[1],A[2]-B[2])<20};   // Bone belongs to the Angel Machine
const SOLIDS={tetra:"Tetrahedron",cube:"Cube",octa:"Octahedron",dodeca:"Dodecahedron",icosa:"Icosahedron"};
const HORDE_COLOR="#97a487";

/* ---------------- cards ---------------- */
let uid=0;
function mk(rank,suit,color){const c={id:++uid,rank,suit,color:color||(suit==="H"||suit==="D"?"red":"black"),owner:null};if(rank==="A"){c.hp=2;c.maxHp=2}return c}   // every Ace is a base with two hearts
/* Emanation cards ("wildcards" and special units). solo: stands alone ("ace": alone or inside an Ace); base: holds cards like an Ace.
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
 wall:{name:"Wall",word:"Wall",hp:5,nat:10,base:true,soul:3,cost:4,kind:"Base",ether:true,desc:"five hearts, defense 10; holds one stack; only ranged cards fire from it"},
 /* v70c: the Lighthouse: a base that holds one stack, which fights from inside it and takes the blows first */
 lighthouse:{name:"Lighthouse",word:"Lighthouse",hp:3,nat:0,base:true,soul:2,cost:3,noDef:true,noAtk:true,kind:"Base",ether:true,desc:"three hearts; holds one stack, which fights from inside it and takes the blows first; lights a circle seven tiles across"}
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
const isBase=c=>kind(c)==="ace"||kind(c)==="tree"||kind(c)==="wall"||kind(c)==="lighthouse";             // holds other cards inside it
const isHero=c=>!!(c.unit&&UNIT[c.unit].solo&&UNIT[c.unit].solo!=="pair");   // stands alone (or only inside an Ace)
const short=c=>c.puppet?"Puppet":c.unit?(UNIT[c.unit].short||UNIT[c.unit].name):c.rank==="JK"?"JK":c.rank+SUITS[c.suit];
const nameOf=c=>c.puppet?"Puppet":c.unit?(c.unit==="slave"?`Slave (once the ${({J:"Jack",Q:"Queen",K:"King",A:"Ace"}[c.rank]||c.rank)} of ${SUITNAME[c.suit]})`:UNIT[c.unit].name):c.rank==="JK"?`${c.color==="red"?"Red":"Black"} Joker`:(c.puppet?"Puppet ":"")+(({J:"Jack",Q:"Queen",K:"King",A:"Ace"}[c.rank]||c.rank)+" of "+SUITNAME[c.suit]);
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
    const inAce=rest.some(c=>kind(c)==="ace");
    if(n("healer")>1||n("repair")>1&&!inAce)return false;   // v72a: as many Repairmen in an Ace as you like
    if(n("healer")&&rest.some(c=>kind(c)==="queen"))return false;   // the Healer won't stand with a Queen
    if(n("miner")>1&&!inAce)return false;   // v72a: as many Miners in an Ace as you like, one anywhere else
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
    const crew=inside.filter(c=>c.unit!=="scout");   // v70c: every base holds one stack, as it could stand on the field; Scouts (and support cards) ride along
    return !crew.length||stackLegal(crew);
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
const lhInner=st=>st&&st.cards.some(c=>c.unit==="lighthouse")?{...st,cards:st.cards.filter(c=>c.unit!=="lighthouse")}:st;   // v70c: the stack inside a Lighthouse, which does its fighting

/* ---------------- state ---------------- */
let G=null;
function mkPlayer(i,o){return{i,name:o.name,tribe:o.tribe||null,color:o.color,solid:o.solid,cpu:o.cpu||null,net:o.net||null,team:o.team!=null?o.team:i,
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
  for(const P of G.p)if(!P.cpu)P.autoBless=!!(typeof PREF!=="undefined"&&PREF.autoBless);
  if(opts.moon==="off"){G.moon.gone="off";G.moon.i=-1}
  if(opts.moon==="saturn"){G.moon.gone="saturn";G.moon.i=-1;G.saturnBy=null;G.saturnDebt=0}   // Saturn from the start: its favors go to the Bank
  if(["mars","sun","venus","jupiter","mercury","neptune"].includes(opts.moon)){G.moon.gone=opts.moon;G.moon.i=-1;G.planetBy=null;G.sunTears=0}
  G.zone=Array.from({length:rows},()=>Array(COLS).fill(-1));G.backz=Array.from({length:rows},()=>Array(COLS).fill(-1));
  M.seats.forEach((S,pl)=>{for(const [r,c] of S.zone)G.zone[r][c]=pl;for(const [r,c] of S.back)G.backz[r][c]=pl});
  buildDecks();
  addNPCs();
}
/* ---------------- decks and the Ether ----------------
   decks: 1 (the two players split one deck: one red and one black suit each), 2 (a full deck each), 3 (a full deck each and a whole third deck in the Ether)
   With more players: a full deck or half a deck each (free-for-all), one deck per team split two suits to a teammate (2v2), or one deck a team shares.
   specials (J Q K A Joker): none (only the opening Ace; the rest wait in the Ether), half (the default since v74d: the Jacks, Queens and
   Kings of half your suits, picked at random, one red and one black, and one more Ace and one Joker for each deck you hold), all
   Every player keeps at least one Joker unless that option is off. Whatever specials a player does not start with go to the Ether. */
const RED=["H","D"],BLACK=["S","C"],RANKS=["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
const isSpecial=c=>["jack","queen","king","ace","joker"].includes(kind(c));
const ALL4=["S","H","D","C"];
/* v70d: decks per player: half a deck (one red and one black suit and a Joker: in 1v1 the two split one deck, in 2v2 each team
   splits one), one deck (all four suits, both Jokers), two or three decks. Older games and the tools still pass decks and ffaDeck. */
function deckPer(o){if(o.deckPer)return String(o.deckPer);const L=o.layout||"duel";
  if(L==="duel")return o.decks===1?"half":"1";if(L.startsWith("team"))return "half";return o.ffaDeck==="half"?"half":"1"}
function deckPlan(o,pls){
  const L=o.layout||"duel",per=deckPer(o),N=pls.length,half=per==="half",m=half?1:Math.max(1,Math.min(3,+per||1));
  if(half&&L==="duel"){
    let suits;
    if(o.suits&&o.suits.length===2){const a=o.suits,b=[RED.find(s=>!a.includes(s)),BLACK.find(s=>!a.includes(s))];suits=[a,b]}
    else{const r=shuffle([...RED]),b=shuffle([...BLACK]);suits=[[r[0],b[0]],[r[1],b[1]]]}
    return{n:1,suits:suits.slice(0,N),jokers:shuffle(["red","black"]).map(c=>[c]),spare:N<2?suits[1]:null};
  }
  if(half&&L.startsWith("team")){ // one deck per team: each teammate gets one red and one black suit
    const suits=[],jokers=[];const byTeam={};
    pls.forEach(pl=>{const t=G.p[pl].team;(byTeam[t]=byTeam[t]||[]).push(pl)});
    const map={};for(const t in byTeam){const r=shuffle([...RED]),b=shuffle([...BLACK]),j=shuffle(["red","black"]);byTeam[t].forEach((pl,k)=>{map[pl]=[[r[k%2],b[k%2]],[j[k%2]]]})}
    pls.forEach(pl=>{suits.push(map[pl][0]);jokers.push(map[pl][1])});
    return{n:1,suits,jokers,spare:null};
  }
  if(half)return{n:1,suits:pls.map(()=>[pick(RED),pick(BLACK)]),jokers:pls.map(()=>[pick(["red","black"])]),spare:null};
  const suits=Array.from({length:m},()=>ALL4).flat(),jokers=Array.from({length:m},()=>["red","black"]).flat();
  return{n:m,suits:pls.map(()=>suits),jokers:pls.map(()=>jokers),spare:null};
}
function buildDecks(){
  const o=G.opts,pls=G.p.map((P,i)=>i).filter(i=>!isHorde(i)),plan=deckPlan(o,pls),sp=o.specials||"none";
  G.ether=[];
  pls.forEach((pl,k)=>{
    const P=G.p[pl],mySuits=plan.suits[k];
    let cards=[];for(const s of mySuits)for(const r of RANKS)cards.push(mk(r,s));
    for(const col of plan.jokers[k])cards.push(mk("JK",null,col));
    const kinds=[...new Set(mySuits)];let keepSuits=sp==="all"?kinds:sp==="half"?(kinds.length===4?[pick(RED),pick(BLACK)]:[pick(kinds)]):[];
    const keepJokers=sp==="all"?9:0;let jk=0;
    const deck=[],out=[];
    for(const c of cards){
      if(!isSpecial(c)){deck.push(c);continue}
      if(kind(c)==="joker"){if(jk<keepJokers){deck.push(c);jk++}else out.push(c);continue}
      (keepSuits.includes(c.suit)&&!(sp==="half"&&kind(c)==="ace")?deck:out).push(c);
    }
    const take=(list,k2)=>{const i=list.findIndex(c=>kind(c)===k2);return i<0?null:list.splice(i,1)[0]};
    const ace=take(deck,"ace")||take(out,"ace")||mk("A",mySuits[0]);
    const jack=take(deck,"jack")||take(out,"jack")||mk("J",mySuits[0]);
    if(sp!=="half"&&o.jokerSure!==false&&!deck.some(c=>kind(c)==="joker"))deck.push(take(out,"joker")||mk("JK",null,pick(["red","black"])));
    P.opening=[ace,jack];P.opening2=[];
    if(o.hq&&o.mode!=="survival"){const a2=take(deck,"ace")||take(out,"ace")||mk("A",mySuits[mySuits.length-1]);a2.owner=pl;P.opening2=[a2]}
    if(sp==="half"){const nd=Math.max(1,Math.round(mySuits.length/4)),best=k2=>{const i=out.findIndex(c=>kind(c)===k2&&keepSuits.includes(c.suit));return i>=0?out.splice(i,1)[0]:take(out,k2)};   // v74d: one more Ace and one Joker for each deck you hold
      for(let i=0;i<nd;i++){deck.push(best("ace")||mk("A",keepSuits[0]||mySuits[0]));deck.push(take(out,"joker")||mk("JK",null,pick(["red","black"])))}}
    for(const c of [...deck,ace,jack])c.owner=pl;
    P.deck=shuffle(deck);G.ether.push(...out);
  });
  // a team that shares its deck shares one deck and one soul pile; the hands stay separate
  if(o.shareDeck&&(o.layout||"").startsWith("team")){
    const byTeam={};pls.forEach(pl=>{const t=G.p[pl].team;(byTeam[t]=byTeam[t]||[]).push(pl)});
    for(const t in byTeam){const m=byTeam[t];const d=shuffle(m.flatMap(pl=>G.p[pl].deck)),sl=[];for(const pl of m){G.p[pl].deck=d;G.p[pl].souls=sl}}
  }
  if(plan.spare)for(const s of plan.spare)for(const r of RANKS)G.ether.push(mk(r,s));   // one deck in Survival: the other half waits in the Ether
  substanceDecks(pls);fogDecks(pls);siegeDecks(pls);
  for(const c of G.ether)c.owner=null;
  shuffle(G.ether);
}
const survival=()=>G.opts.mode==="survival";
const isHorde=pl=>!!(G.p[pl]&&(G.p[pl].cpu==="horde"||G.p[pl].cpu==="npc"));   // the Horde, and the Demons and the Bank (no deck, no hand, no mana)
const hordeIx=()=>G.p.findIndex(P=>P.cpu==="horde");
const alive=()=>G.p.filter(P=>!P.out).map(P=>P.i);
/* v76b: work that measures the page waits for one pass just before the next paint (see 99_perf.js) */
const PERF={inRender:0,vk:null,sp:null,jobs:new Map(),raf:0};
function perfFlush(){PERF.raf=0;const js=[...PERF.jobs.values()];PERF.jobs.clear();for(const f of js){try{f()}catch(e){console.error(e)}}}
function perfLater(k,fn){PERF.jobs.set(k,fn);if(!PERF.raf)PERF.raf=typeof requestAnimationFrame==="function"?requestAnimationFrame(perfFlush):setTimeout(perfFlush,16)}
/* a layer of the redraw that fails is logged and skipped: the layers around it, and the game, carry on */
const rSafe=(f,t,a)=>{try{return f.apply(t,a)}catch(e){console.error(e)}};
const isEnemy=(a,b)=>a!=null&&b!=null&&a!==b&&G.p[a].team!==G.p[b].team&&!(G.dip&&dipAllied(a,b));   // v75b: allies (Diplomacy) are not enemies
const enemiesOf=pl=>alive().filter(i=>isEnemy(pl,i));
const alliesOf=pl=>alive().filter(i=>i!==pl&&!isEnemy(pl,i));
const teammatesOf=pl=>alive().filter(i=>i!==pl&&!isHorde(i)&&G.p[i].team===G.p[pl].team);   // the real team (Diplomacy allies are not on it)
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
/* v53: you spawn in your own lines, or in a teammate's when they hold the same side of the field */
const canSpawn=(pl,r,c)=>{const z=G.zone[r][c];if(z===pl)return true;if(z<0||!G.p[z]||!G.p[pl]||G.p[z].team!==G.p[pl].team||isNPC(z)||isNPC(pl))return false;
  const a=G.map.seats[z],b=G.map.seats[pl];return !!a&&!!b&&a.side===b.side};
const isBack=(pl,r,c)=>G.backz[r][c]===pl||!!(G.map.seats[pl]&&G.map.seats[pl].back.some(([a,b])=>a===r&&b===c));   // teammates who share a back line (2v2, same side) each hold all of it
const backTiles=pl=>seat(pl).back.filter(([r,c])=>!isVoid(r,c));
const zoneTiles=pl=>seat(pl).zone.filter(([r,c])=>!isVoid(r,c));
const isFront=(pl,r,c)=>canSpawn(pl,r,c)&&!isBack(pl,r,c);
/* kept for the two-player field: the rows of player 0 (bottom) and player 1 (top) */
function backRow(pl){return seat(pl).back[0][0]}
function frontRow(pl){const S=seat(pl);return S.back[0][0]+S.fwd[0]}   // v53: the row in front of the backline, a spawn line or not
const ownLines=(pl,r,c)=>c==null?G.zone[r].includes(pl):canSpawn(pl,r,c);
function stacksOf(pl){const out=[];G.board.forEach((row,r)=>row.forEach((st,c)=>{if(st&&st.owner===pl)out.push({st,r,c})}));return out}
function at(r,c){return r>=0&&r<G.rows&&c>=0&&c<COLS?G.board[r][c]:undefined}
const isVoid=(r,c)=>!!(G.void&&G.void[r]&&G.void[r][c]);
const hq=()=>!!G.opts.hq&&!survival();
const centerOut=()=>{const m=(COLS-1)/2;return [...Array(COLS).keys()].sort((a,b)=>Math.abs(a-m)-Math.abs(b-m)||a-b)};
/* per-player turn state: in phases everyone plays at once, each player keeps their own */
const TURNKEYS=["spent","spentOther","blessed","ritual","sevSum","prices","sel","selHand","mode","noDraw","libation","saleD"];
function setActive(pl){
  if(pl===G.active&&G.p[pl].ctx)return;
  const P=G.p[G.active];if(P){P.ctx={};for(const k of TURNKEYS)P.ctx[k]=G[k]}
  G.active=pl;const Q=G.p[pl];if(Q.ctx)for(const k of TURNKEYS)G[k]=Q.ctx[k];
}
/* every action a player takes goes through here: it is recorded, so a later online version can send it to the table */
/* tile names, like chess squares: columns A, B, C… from the left of the field, rows 1, 2, 3… from the bottom */
const coord=(r,c)=>String.fromCharCode(65+c)+(G.rows-r);   // v57: up to Y on the 25 by 25 field
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
  else if(c.unit&&c.unit!=="slave"){   // Emanation cards never lie in the grave
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
  if(!opening&&got+burned<n)deckShort(pl,n-got-burned,why||"a draw");   // v71: a card the deck can't give costs 1 mana
  return{got,burned};
}
/* ---------- v71: an empty deck costs mana. Every card a deck can't give (a draw, a toll, a price) costs 1 mana instead, as deep
   below zero as it goes: past the floor the player is out. A Heavenly Body asking for cards from the hand takes them from the
   deck when the hand is empty, and then mana (an enemy's spell on your hand doesn't reach past the hand). ---------- */
function deckShort(pl,n,why){if(!(n>0)||!G||G.over||!G.p[pl]||G.p[pl].out||isHorde(pl))return 0;addDebt(pl,n);
  log(`${plName(pl)}'s deck can't give ${n} card${n>1?"s":""}${why?` (${why})`:""}: ${n} mana instead (now ${effMana(pl)}).`,"event");return n}
function takeDeck(pl,n,why,rand){const P=G.p[pl],out=[];
  for(let i=0;i<n&&P.deck.length;i++)out.push(rand?P.deck.splice(Math.floor(Math.random()*P.deck.length),1)[0]:P.deck.pop());
  deckShort(pl,n-out.length,why);return out}
function takeHand(pl,n,why){const P=G.p[pl],out=[];for(let i=0;i<n&&P.hand.length;i++)out.push(P.hand.splice(Math.floor(Math.random()*P.hand.length),1)[0]);
  return out.concat(takeDeck(pl,n-out.length,why,true))}
const shortNote=(pl,n)=>{const k=Math.max(0,n-G.p[pl].deck.length);return k?` (your deck is ${k} short: ${k} mana instead)`:""};
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
