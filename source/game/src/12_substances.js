/* ---------------- Substances: what each one adds to the game ----------------
   Random, Beginner, Angel Machine, Satan, Binah, Jester Fool (and Tiphareth of Kether, plain for now).
   Lucifer & Ouroboros, The Leviathan and Yaldabaoth come in the next update. */

/* Random becomes a real Substance before the game starts; fixed colors and symbols are applied */
function resolveSubstances(opts){
  const taken=new Set(skyBlocked(opts.moon));   // a Heavenly Body in the sky from the start keeps out the Substance it would serve
  // every Substance but the Beginner is played by one player at most
  for(const p of opts.players)if(p.tribe&&TRIBES[p.tribe]&&p.tribe!=="random"&&p.tribe!=="beginner"&&!TRIBES[p.tribe].soon)taken.add(p.tribe);
  for(const p of opts.players){
    if(p.cpu==="horde")continue;
    if(!p.tribe||!TRIBES[p.tribe]||p.tribe==="random"||TRIBES[p.tribe].soon){
      const ban=opts.subBan||[],pool=PLAYABLE.filter(k=>(k==="beginner"||!taken.has(k))&&!ban.includes(k));
      p.tribe=pool.length?pick(pool):"beginner";p.randomSub=true;if(p.tribe!=="beginner")taken.add(p.tribe);
    }
    const T=TRIBES[p.tribe];if(T.color)p.color=T.color;if(T.solid)p.solid=T.solid;
  }
  // v43: Random color and Random symbol take what nobody else has (after the fixed ones of the Substances)
  const ps=opts.players.filter(p=>p.cpu!=="horde");
  const usedC=new Set(ps.filter(p=>TRIBES[p.tribe].color||p.color&&p.color!=="random").map(p=>TRIBES[p.tribe].color||p.color));
  for(const p of ps)if(!TRIBES[p.tribe].color&&(!p.color||p.color==="random")){const free=COLORS.map(c=>c[1]).filter(c=>!usedC.has(c));p.color=pick(free.length?free:COLORS.map(c=>c[1]));usedC.add(p.color)}
  const usedS=new Set(ps.filter(p=>TRIBES[p.tribe].solid||p.solid&&p.solid!=="random").map(p=>TRIBES[p.tribe].solid||p.solid));
  for(const p of ps)if(!TRIBES[p.tribe].solid&&(!p.solid||p.solid==="random")){const free=Object.keys(SOLIDS).filter(k=>!usedS.has(k));p.solid=pick(free.length?free:Object.keys(SOLIDS));usedS.add(p.solid)}
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
      for(const c of P.deck)if(kind(c)==="grunt"||kind(c)==="infantry"){c.rank="2";c.puppet=true}   // every soldier is a Puppet: its own card, with the score of a 2
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
    const c=mk("2",pick(["S","H","D","C"]));c.puppet=true;c.owner=P.i;t.st.cards.push(c);
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
    popup("Antony rises",`<p>The angel Antony was sharing Samson's form, lodged in his heart, and has resurrected his corpse with himself.</p><p class="dim">Samson's card is not in the grave or the Outer Darkness: he wanders through Limbo. Look for the Limbo tab in the Outer Darkness.</p>`,owner);
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
  el.innerHTML=`<div class="popbox" role="alertdialog" aria-labelledby="popt" style="--pc:${q.col}"><button type="button" class="xclose" aria-label="Close" data-x>×</button><h2 id="popt">${esc(q.title)}</h2>${q.html}<p class="acts"><button class="btn" id="popok">Okay</button></p></div>`;
  el.querySelector("[data-x]").onclick=()=>$("#popok").click();
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
