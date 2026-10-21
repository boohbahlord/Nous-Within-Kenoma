/* ---------------- Prompt 10c: Mercury (Peace, Total War, Betrayal, bribing the Banker), eclipses, Eclipse Mode,
   and the computer looking after itself ---------------- */

PLANETS.mercury={name:"Mercury",word:"Guile",hunger:3};OATH_SKY.mercury="mercury";
const peaceOn=()=>!!(G.peace&&(G.peace.untilT!=null?G.turnNo<=G.peace.untilT:G.moon.round<=G.peace.until));
const peaceTill=()=>G.peace.untilT!=null?`for ${Math.max(1,G.peace.untilT-G.turnNo+1)} more turn${G.peace.untilT-G.turnNo+1===1?"":"s"}`:`until round ${G.peace.until}`;   // v71e: bought Peace counts turns
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
  if(G.peace&&G.peace.untilT==null&&r>G.peace.until){G.peace=null;log("<b>Peace ends.</b> The lines are open again.","event");notify(null,"Peace is over.")}
  if(G.war&&r>G.war.until){G.war=null;log("<b>Total War ends.</b>","event");notify(null,"Total War is over.")}
  if(G.war)G.warCurse=R(2)-1;
  if(G.eclipse&&r>(G.eclipse.until!=null?G.eclipse.until:G.eclipse.round+(G.eclipse.k==="jupiter"?1:0))){endEclipse()}   // v71c: Neptune's lasts 2d3 rounds
  // the Banker's bribes are paid every round
  for(const b of [...(G.bribes||[])]){if(r>b.until||G.p[b.by].out||G.p[b.target].out){G.bribes.splice(G.bribes.indexOf(b),1);log(`The bribe against ${plName(b.target)} runs out.`);continue}
    if(b.paid===r)continue;const c=R(2)+R(3)+R(3);if(mana(b.by)>=c){payQuiet(b.by,c);bankAdd(c);b.paid=r;log(`${plName(b.by)} keeps the Banker bribed (${c} mana): ${plName(b.target)} pays more.`)}
    else{G.bribes.splice(G.bribes.indexOf(b),1);log(`${plName(b.by)} can't pay the Banker: the bribe against ${plName(b.target)} ends.`)}}
  // each Heavenly Body: 5% in a round of its cycle event (v71i), or at once in Eclipse Mode
  const k=sky();
  if(["sun","mars","venus","jupiter","mercury","neptune"].includes(k)&&!G.eclipse&&(ecCycleNow(k)&&Math.random()<.05||G.opts.eclipseStart&&!G.eclipsedOnce||G.forceEclipse)){G.forceEclipse=false;G.eclipsedOnce=true;await eclipse(k)}
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
function startPeace(rounds,why,turns){
  const r=G.moon.round;G.peace=turns?{untilT:G.turnNo+turns}:{until:r+rounds-1};G.war=null;
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
    if(v.yes.length>v.no.length)startPeace(rounds,"Mercury's eclipse, by vote");else startWar(rounds,n===2?"Mercury's eclipse, 1v1":"Mercury's eclipse: everyone against everyone");
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
 {id:"buypeace",dice:"4d2",name:"Buy Peace",cost:6,school:"Astrology",text:"Under Mercury, without a vote: Peace for two turns, with everything Peace brings.",
  ok:()=>planetUp("mercury")&&!peaceOn(),run:async()=>{startPeace(0,`bought by ${esc(me().name)}`,2)}},
 {id:"war",name:"Total War",cost:0,school:"Astrology",text:"Free, under Mercury; everyone must agree. For 3 + 1d2 − 1 rounds every card killed falls into the Outer Darkness and gives its killer a mana, curses cost 1d2 − 1 less, and teammates may strike each other: each damage to a teammate pays its soul's worth + 1d2 − 1.",
  ok:()=>planetUp("mercury")&&!warOn()&&!peaceOn()&&!G.voted,run:async()=>{G.voted=true;const v=await vote("Total War","Agree to Total War for 3 or 4 rounds?");if(!v.no.length)startWar(2+R(2),"agreed by everyone");else log("No war: not everyone agrees.")}},
 {id:"oath_mercury",name:"Oath of Mercury",cost:0,school:"Astrology",text:"Free. Unlocks Betrayal, Declare War and Bribe the Banker. Cast again to break the Oath.",
  ok:()=>oathFree("mercury"),run:async()=>{toggleOath("mercury")}},
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
