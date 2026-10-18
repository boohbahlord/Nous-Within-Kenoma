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
  if(V!=null&&totalBlind(V))return true;
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
