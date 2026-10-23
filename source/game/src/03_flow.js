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
  if(G.moon.round===1&&G.opts.bloodStart){m.i=4;m.blood=true;log("The game opens under a <b>Blood Moon</b>.","event")}
  else if(G.opts.eclipseAlways&&m.i>=0&&G.forceMoon!==0){m.blood=true;G.forceMoon=null}   // v71q: Always in eclipse: a Blood Moon at every phase
  else if(m.i===4){
    const p=G.forceMoon!=null?G.forceMoon:ecChance();G.forceMoon=null;   // v71q: Eclipse mode: every Full Moon
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
/* v49: the Full Moon's toll: a random stack of two cards, or else one random card from the field (never inside an Ace or under
   Hypostasis); with nothing to take there, three cards from the shuffled deck. Given, they go to the soul pile (anything over the
   maximum to the grave). Refused, it costs 2d2 + 2 mana, which can take you below zero. */
function moonTarget(pl){const ok=stacksOf(pl).filter(x=>!x.st.hypo&&!hasK(x.st,"ace"));
  const twos=ok.filter(x=>x.st.cards.length===2);if(twos.length){const t=pick(twos);return {kind:"stack",r:t.r,c:t.c,st:t.st,cards:[...t.st.cards]}}
  const all=ok.flatMap(x=>x.st.cards.filter(c=>!isBase(c)).map(c=>({x,c})));if(all.length){const {x,c}=pick(all);return {kind:"card",r:x.r,c:x.c,st:x.st,cards:[c]}}
  const P=G.p[pl];shuffle(P.deck);return {kind:"deck",cards:P.deck.slice(-3),short:Math.max(0,3-P.deck.length)}}   // v71: what the deck can't give costs mana
function strongest(pl){return moonTarget(pl)}
async function fullMoonToll(){
  for(const pl of order()){
    if(G.p[pl].tribe==="firm"){log(`${plName(pl)} owes the Full Moon nothing: the Firmament is above its toll.`);continue}
    const t=moonTarget(pl);if(!t)continue;const P=G.p[pl];
    const what=t.kind==="deck"?`three cards from your shuffled deck (${t.cards.length?t.cards.map(c=>esc(nameOf(c))).join(", "):"it is empty"}${t.short?`; the ${t.short} it can't give cost ${t.short} mana instead`:""})`:t.kind==="stack"?`a stack of two: <b>${t.cards.map(c=>esc(nameOf(c))).join(", ")}</b>`:`a card on your field: <b>${esc(nameOf(t.cards[0]))}</b>`;
    const yes=await ask(pl,{kind:"yesno",id:"fullmoon",target:t,title:`Full Moon: ${esc(P.name)}'s toll`,
      text:`The Full Moon asks for ${what}. Give it to your soul pile (any mana over your maximum goes to the grave), or refuse and pay 2d2 + 2 mana, even below zero.`,
      yes:"Give it",no:"Refuse",ai:()=>t.kind==="deck"||AI.value({cards:t.cards,owner:pl})<7||effMana(pl)-6<=-4});
    if(yes){let m=0;
      if(t.kind==="deck"){for(const c of t.cards){P.deck.splice(P.deck.indexOf(c),1);if(addSoul(pl,c))m+=soulOf(c);else toGrave(c,"spent")}deckShort(pl,t.short||0,"the Full Moon's toll")}
      else{const st=G.board[t.r][t.c];if(st){for(const c of t.cards){const i=st.cards.indexOf(c);if(i<0)continue;st.cards.splice(i,1);
          if(c.captured&&c.captured.length){for(const s of c.captured)toGrave(s,"death");c.captured=[]}
          if(c.unit&&buryUnit(c,t.r,t.c,pl))continue;   // Emanation cards keep their own fates
          if(addSoul(pl,c))m+=soulOf(c);else toGrave(c,"spent")}
        if(!st.cards.length){G.board[t.r][t.c]=null;freeCaptive(st,t.r,t.c)}}}
      log(`${plName(pl)} gives the Full Moon ${t.cards.length} card${t.cards.length>1?"s":""}${t.kind==="deck"?" from the deck":""} (+${m} mana).`,"event");
    }else{const d=rollN(2,2),n=sum(d)+2;tray(pl,"Full Moon",d,`−${n}`);addDebt(pl,n);
      log(`${plName(pl)} refuses the Full Moon and pays ${n} mana (2d2 + 2: ${d.map(x=>x.v).join(" + ")} + 2), now at ${effMana(pl)}.`,"event")}
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
  Object.assign(G,{spent:false,spentOther:false,blessed:false,ritual:0,sel:null,selHand:null,mode:null,noDraw:false,sevSum:0,libation:false,saleD:null});
  G.p[pl].tn=(G.p[pl].tn||0)+1;   // the player's own turn count, for cooldowns
  G.prices={...(G.roundPrices||{})};
  if(G.inflation&&G.turnNo<=G.inflation.until)G.inflation.add=R(2)-1;   // v71: back to turns, as the rule was written
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
const PHASE_LABEL={draw:"Done drawing →",prep:"To attack phase →",attack:"End turn →"};   // v70d: drawing is the first part of prep
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
/* v70d: a phase played together. Drawing is the first part of prep: everyone draws together (the people first, then the
   computers, while "Waiting for players to draw" shows), and the rest of prep starts only when everyone is done drawing. */
async function together(players,phases){
  const g=G;players=players.filter(pl=>!G.p[pl].out);
  for(const pl of players)beginTurn(pl);
  for(const pl of players){setActive(pl);await turnAsync(pl);if(G!==g||G.over)return}
  log(`— ${players.map(plName).join(", ")} play ${phases.includes("attack")?"the whole turn":"draw and prep"} together —`,"turn");
  for(let k=0;k<phases.length;k++){
    const ph=phases[k];G.phase=ph;G.shared=true;
    const cpus=players.filter(pl=>G.p[pl].cpu&&!G.p[pl].out),hs=players.filter(pl=>!G.p[pl].cpu&&!G.p[pl].out);
    if(ph==="draw"){
      for(const pl of hs){setActive(pl);if(G.noDraw)continue;G.nextLabel=PHASE_LABEL.draw;await actPhase(pl,ph);if(G!==g||G.over)return}
      G.drawWait=true;G.speedMul=.5;
      for(const pl of cpus){setActive(pl);if(G.noDraw)continue;await actPhase(pl,ph);if(G!==g||G.over){G.drawWait=false;return}}
      G.speedMul=1;G.drawWait=false;continue}
    G.speedMul=.5;
    for(const pl of cpus){setActive(pl);await actPhase(pl,ph);if(G!==g||G.over)return}
    G.speedMul=1;
    for(const pl of hs){setActive(pl);G.nextLabel=ph==="prep"?PHASE_LABEL.prep:PHASE_LABEL.attack;await actPhase(pl,ph);if(G!==g||G.over)return}
  }
  G.shared=false;
  if(phases.includes("attack"))for(const pl of players)endTurn(pl);
}
/* one player plays one phase: the computer in code, a person until they press the button (or the timer runs out) */
async function actPhase(pl,ph){
  setActive(pl);G.phase=ph;
  if(G.p[pl].cpu){G.busy=true;render();try{await AI.phase(pl,ph)}catch(e){console.error(e);log("The computer stumbles: "+esc(e.message))}G.busy=false;render();return}
  G.busy=false;render();
  if(ph==="prep")await autoBlessing(pl);
  await new Promise(res=>{G.waiter=res;startTimer(ph)});
  stopTimer();
}
async function nextPhase(){
  if(G.busy||G.over||G.passing)return;
  if(G.phase==="setup"){
    if(G.setupStep==="ace"){flash("First place your Ace and its Jack on a tile of your spawn lines.");return}
    if(G.setupResolve){const f=G.setupResolve;G.setupResolve=null;stopTimer();f()}
    return;
  }
  journal("next",{phase:G.phase});
  if(G.placing)cancelPlacing();
  if(G.waiter){const f=G.waiter;G.waiter=null;G.mode=null;G.selHand=null;f()}
}
/* once a draw roll overdraws, that turn's drawing is over: no misclicked or rage-quit spree can burn a whole deck */
const overdrewNow=pl=>G.p[pl]&&G.p[pl].odTurn===G.turnNo;
function rollDraw(){
  if(overdrewNow(G.active)){flash("You overdrew this turn: no more draws until your next turn.");return}
  const n=R(4);tray(G.active,"Draw",[{s:4,v:n}],`draw ${n}`);
  log(`${plName(G.active)} rolls d4: ${n}.`);const r=draw(G.active,n);
  if(r&&r.burned){G.p[G.active].odTurn=G.turnNo;log(`${plName(G.active)} overdrew: no more draws this turn.`)}
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
  if(G.setupStep==="more")setupDone(pl);   // Emanations that start with cards on the field
}

/* ---------------- actions ---------------- */
function canPlace(card,r,c){
  if(!canSpawn(G.active,r,c)||isVoid(r,c))return false;
  const st=G.board[r][c],k=kind(card);
  if(k==="ace")return !st;   // v78a: an Ace goes on any empty tile you may spawn on (both spawn lines, your Bank land, your Flags)
  if(k==="tree"||k==="wall"||(card.unit&&UNIT[card.unit].solo==="alone"))return !st;   // a Wall goes up on any empty tile of your spawn lines   // the Tree, Satan, the BullGoat and Slaves take an empty tile
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
  if(rest.length&&!stackLegal(rest)&&stackLegal(st.cards))return[];   // a stack already too full (an old base) can always be emptied
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
  for(const o of attackOptions(s.r,s.c)){const k=o.r*1000+o.c;if(!seen.has(k)){seen.add(k);out.push([o.r,o.c])}}
  if(!G.p[G.active]||G.p[G.active].cpu==null)for(const o of blindOptions(s.r,s.c)){const k=o.r*1000+o.c;if(!seen.has(k)){seen.add(k);out.push([o.r,o.c])}}   // fogged tiles a shooter can fire into
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
const canSacCard=c=>!(c.unit&&(UNIT[c.unit].hp||UNIT[c.unit].base));   // the Emanation cards with hearts (and the Tree) can't be sacrificed
const canSacOnField=(st,c)=>kind(c)!=="ace"&&canSacCard(c)&&!(kind(c)==="king"&&st.cards.length>1);
