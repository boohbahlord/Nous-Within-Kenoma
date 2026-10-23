/* ---------------- v71d: the Oath of Neptune, Lostness I and II, Neptune Event and Neptune Eclipse, Stray Mana ----------------
   The Oath of Neptune (any sky): Illusions cost 1d2 − 1 less for you (rolled each turn); +1d2 − 1 mana a turn through
   Neptune's own cycle, 1d3 through its eclipse. It unlocks:
   - Lostness I (free): Neptune's cycle on yourself for 2d3 rounds, without its gifts; at its end 2d2 + 1d6 mana, and 1d2
     more for every round past two. Not during Neptune's cycle or eclipse.
   - Lostness II (free): Neptune's eclipse on yourself for 2d3 rounds; at its end +1d6 maximum for good, 2d2 + 1d6 mana for
     every round past two, and Neptune's Afterglow: three times your maximum mana and hand for eight of your turns. Not
     during Neptune's eclipse.
   - Either can be laid on an enemy instead (not in the first three rounds): it costs you 1d12 deck cards, 1d8 mana and
     1d3 hand cards (a Jester rolls the cards with advantage against himself), and they get no gifts. Whoever has laid one
     on another can't lay one on themselves, and the other way round.
   - Neptune Event (4 + 1d2 mana) and Neptune Eclipse (10): Neptune takes the sky for its cycle or its eclipse; whatever
     hung there before pauses and comes back when it ends.
   Stray Mana (Illusion, 1 mana, every 7d2 rounds; 6d2 or 5d2 under the Oath of Neptune, on a 1d2): choose an enemy. For the
   rest of the round, each mana they earn or spend rolls 1d20: on a 1 it strays to you (what they earn comes to you, what
   they spend is paid to you); on a 20 you share it (you gain what they gain, and pay what they pay). */
OATHS.push(["neptune","Lostness and cheaper illusions"]);
OATH_SKY.neptune="neptune";
const nepGlow=pl=>!!(G&&G.p[pl]&&G.p[pl].nepGlow!=null&&tnOf(pl)<=G.p[pl].nepGlow);   // Neptune's Afterglow (handCap, soulCap)
{const _sc=soulCap;soulCap=function(pl){const c=_sc.apply(this,arguments);return nepGlow(pl)?c*3:c}}

/* ---------- the Oath ---------- */
SPELLS.push({id:"oath_neptune",name:"Oath of Neptune",cost:0,school:"Astrology",text:"",ok:()=>oathFree("neptune"),
  run:async()=>{const P=me();if(P.oath==="saturn"&&!P.satLocked){const yes=await ask(G.active,{kind:"yesno",id:"satbreak",title:"Break the Oath of Saturn?",text:SAT_BREAK_TXT,yes:"Break it",no:"Keep it",ai:()=>false});
      if(!yes){log(`${plName(G.active)} keeps the Oath of Saturn.`);return}}
    toggleOath("neptune")}});
SPELL_TEXT.oath_neptune={n:"Any sky.",e:"Illusions cost 1d2 − 1 less for you, rolled each turn. +1d2 − 1 mana each turn through Neptune's own cycle, 1d3 through its eclipse. Unlocks Lostness I and II, Neptune Event and Neptune Eclipse, and shortens Stray Mana's wait.",l:"Cast again to break the Oath."};
SP("oath_neptune").text=[SPELL_TEXT.oath_neptune.n,SPELL_TEXT.oath_neptune.e,SPELL_TEXT.oath_neptune.l].join(" ");
{const _sc=spellCost;spellCost=function(sp){const c=_sc.apply(this,arguments);const P=G&&G.p[G.active];
  if(sp&&sp.school==="Illusion"&&c>0&&P&&oathNow(G.active,"neptune"))return Math.max(0,c-(P.nepCut||0));return c}}
{const _bt=beginTurn;beginTurn=function(pl){const out=_bt.apply(this,arguments);const P=G&&G.p[pl];if(!P||G.over||!oathNow(pl,"neptune"))return out;
  P.nepCut=R(2)-1;
  const m=nepEcOn()?R(3):nepEvOn()?R(2)-1:0;if(m){const got=giveMana(pl,m);if(got)log(`The Oath of Neptune: ${plName(pl)} draws ${got} mana from its ${nepEcOn()?"eclipse":"cycle"}.`)}
  return out}}

/* ---------- Lostness I and II ---------- */
function nepLostTargets(k){const me_=G.active,P=G.p[me_],out=[];
  if(P.nepWay!=="other")out.push(me_);
  if(P.nepWay!=="self"&&G.moon.round>3)for(const e of enemiesOf(me_))if(!isNPC(e)&&!isHorde(e)&&!G.p[e].out&&!nepSelf(e))out.push(e);
  return out}
const nepLostOk=k=>!!G&&oathNow(G.active,"neptune")&&!nepEcOn()&&!(k==="ev"&&nepEvOn())&&!nepSelf(G.active)&&nepLostTargets(k).length>0;
function nepSignNames(){const names={};for(const P of G.p)names[P.i]=nepJumble();return names}
async function castLostness(k){const me_=G.active,P=G.p[me_],nm=k==="ev"?"Lostness I":"Lostness II";
  const ts=nepLostTargets(k);let t=ts.length===1?ts[0]:await ask(me_,{kind:"player",id:"lostness",title:`${nm}: on whom?`,players:ts,ai:()=>me_});
  if(t==null)return;
  if(t!==me_){const adv=P.tribe==="jester",dk=adv?Math.max(R(12),R(12)):R(12),hd=adv?Math.max(R(3),R(3)):R(3),mn=R(8);
    let gone=0;for(const c of takeDeck(me_,dk,nm,true)){toGrave(c,"burn");gone++}
    let hand=0;for(const c of takeHand(me_,hd,nm)){toGrave(c,"burn");hand++}
    const paid=payQuiet(me_,Math.min(mn,Math.max(0,mana(me_))));bankAdd(paid);if(paid<mn)addDebt(me_,mn-paid);
    P.nepWay="other";log(`${plName(me_)} pays for laying ${nm} on ${plName(t)}: ${gone} deck card${gone===1?"":"s"} (1d12${adv?", the Jester's worse of two":""}), ${hand} hand card${hand===1?"":"s"} (1d3) and ${mn} mana (1d8).`,"event")}
  else P.nepWay="self";
  const d=sum(rollN(2,3)),r=G.moon.round,S={k,from:r,until:r+d-1,d,by:me_,self:t===me_};
  if(k==="ec"){S.st={names:nepSignNames(),seed:R(1e6),flip:R(2)===1,mis:{},foe:{}};const Q=G.p[t];shuffle(Q.deck);shuffle(Q.hand);
    (G.blindHand=G.blindHand||[]).push({by:"nepself",t,left:999});(G.manaDel=G.manaDel||[]).push({by:"nepself",t,left:999,off:delOff()})}
  (G.nepSelf=G.nepSelf||{})[t]=S;G._vis=null;
  log(`<b>${nm}</b>: ${plName(t)} ${t===me_?"gives themselves":"is given"} Neptune's ${k==="ev"?"cycle":"eclipse"} for ${d} round${d>1?"s":""} (2d3)${t===me_?", for its gifts at the end":""}.`,"event");
  if(t!==me_)notify(t,`${esc(G.p[me_].name)} lays ${nm} on you: Neptune's ${k==="ev"?"cycle":"eclipse"} for ${d} rounds.`);
  render()}
function lostnessEnd(t,S){if(S.k==="ec"){for(const k of ["blindHand","manaDel"])if(G[k])G[k]=G[k].filter(x=>!(x.by==="nepself"&&x.t===t))}
  delete G.nepSelf[t];G._vis=null;const P=G.p[t];if(!P||P.out)return;
  if(!S.self){log(`${plName(t)} is free of ${S.k==="ev"?"Lostness I":"Lostness II"}.`,"event");return}
  const extra=Math.max(0,S.d-2);
  if(S.k==="ev"){const d=[...rollN(2,2),...rollN(1,6),...rollN(extra,2)],m=sum(d),got=giveMana(t,m);tray(t,"Lostness I",d,`${m} mana`);
    log(`<b>Lostness I</b> ends: ${plName(t)} comes back with ${m} mana (2d2 + 1d6${extra?` + ${extra}d2`:""}${got<m?`; ${got} fit`:""}).`,"event")}
  else{const mx=R(6);P.maxAdd=(P.maxAdd||0)+mx;let m=0;const d=[];for(let i=0;i<extra;i++){const x=[...rollN(2,2),...rollN(1,6)];d.push(...x);m+=sum(x)}
    const got=m?giveMana(t,m):0;P.nepGlow=tnOf(t)+8;if(d.length)tray(t,"Lostness II",d,`${m} mana`);
    log(`<b>Lostness II</b> ends: ${plName(t)} gains ${mx} maximum for good (1d6)${m?` and ${m} mana (2d2 + 1d6 for each of ${extra} round${extra>1?"s":""} past two${got<m?`; ${got} fit`:""})`:""}, and <b>Neptune's Afterglow</b>: three times their maximum mana and hand for eight of their turns.`,"event");
    notify(t,"Neptune's Afterglow: three times your maximum mana and hand for eight turns.")}}
PRICE.nepev=()=>4+R(2);
SPELLS.push(
 {id:"lost1",name:"Lostness I",cost:0,school:"Illusion",text:"",ok:()=>nepLostOk("ev"),run:async()=>{await castLostness("ev")}},
 {id:"lost2",name:"Lostness II",cost:0,school:"Illusion",text:"",ok:()=>nepLostOk("ec"),run:async()=>{await castLostness("ec")}},
 {id:"nepev",name:"Neptune Event",cost:5,dice:"4+1d2",school:"Astrology",text:"",ok:()=>!!G&&oathNow(G.active,"neptune")&&!nepEvOn()&&!G.nepTemp&&!(typeof cyclesOff==="function"&&cyclesOff()),run:async()=>{await nepCall("ev")}},
 {id:"nepec",name:"Neptune Eclipse",cost:10,school:"Astrology",text:"",ok:()=>!!G&&oathNow(G.active,"neptune")&&!nepEcOn()&&!G.eclipse&&!G.nepTemp&&!(typeof eclipsesOff==="function"&&eclipsesOff()),run:async()=>{await nepCall("ec")}});
Object.assign(OATH_ONLY,{lost1:"neptune",lost2:"neptune",nepev:"neptune",nepec:"neptune"});
Object.assign(SPELL_TEXT,{
 lost1:{n:"The Oath of Neptune. Not during Neptune's cycle or eclipse.",e:"Neptune's cycle on yourself for 2d3 rounds, without its gifts. At its end: 2d2 + 1d6 mana, and 1d2 more for every round past two.",l:"Free. Or lay it on an enemy (not in the first three rounds): it costs you 1d12 deck cards, 1d8 mana and 1d3 hand cards, and nobody gets gifts. Once you lay it on another you can't take it yourself, and the other way round."},
 lost2:{n:"The Oath of Neptune. Not during Neptune's eclipse.",e:"Neptune's eclipse on yourself for 2d3 rounds. At its end: +1d6 maximum for good, 2d2 + 1d6 mana for every round past two, and Neptune's Afterglow: three times your maximum mana and hand for eight of your turns.",l:"Free. Or lay it on an enemy (not in the first three rounds): it costs you 1d12 deck cards, 1d8 mana and 1d3 hand cards, and nobody gets gifts. Once you lay it on another you can't take it yourself, and the other way round."},
 nepev:{n:"The Oath of Neptune.",e:"Neptune takes the sky for its cycle (2d3 rounds); whatever hung there pauses and comes back when it ends.",l:"4 + 1d2 mana. Not with cycle events off."},
 nepec:{n:"The Oath of Neptune.",e:"Neptune takes the sky for its eclipse (2d3 rounds); whatever hung there pauses and comes back when it ends.",l:"10 mana. Not with eclipses off."}});
for(const id of ["lost1","lost2","nepev","nepec"]){const t=SPELL_TEXT[id];SP(id).text=[t.n,t.e,t.l].join(" ")}
/* Lostness runs out at the start of a round */
{const _cr=cycleRound;cycleRound=async function(){await _cr.apply(this,arguments);if(!G||G.over)return;
  for(const [t,S] of Object.entries(G.nepSelf||{}))if(G.moon.round>S.until)lostnessEnd(+t,S);
  nepTempRound();render()}}

/* ---------- Neptune Event and Neptune Eclipse: Neptune takes the sky for a while ---------- */
const NEP_SAVE=["skySince","_skyK","_chgK","skyCyc","skyArr","skyKeepAt","skyEveryN","planetBy","saturnBy","saturnDebt","venus","jupSale","sunTears"];
async function nepCall(k){const me_=G.active,r=G.moon.round;
  if(!nepUp()){const prev={gone:G.moon.gone,i:G.moon.i,blood:G.moon.blood,at:r};for(const f of NEP_SAVE)prev[f]=G[f];G.nepTemp={prev,k};
    if(G.eclipse)endEclipse();G.moon.gone="neptune";G.moon.i=-1;G.moon.blood=false;G.planetBy=me_;G._skyK="neptune";G._chgK="neptune";G.skySince=r;G._vis=null;applyMoonTheme();
    log(`<b>${k==="ev"?"Neptune Event":"Neptune Eclipse"}</b>: ${plName(me_)} calls Neptune into the sky. ${esc(SHOP_NAME[prev.gone||"moon"]||"The sky")} pauses until it passes.`,"event")}
  else G.nepTemp={prev:null,k};
  if(k==="ev"){const d=sum(rollN(2,3));G.nepEv={from:r,until:r+d-1,spell:true};
    log(`<b>Neptune's cycle</b> for ${d} round${d>1?"s":""} (2d3), called by ${plName(me_)}.`,"event");
    popup("Neptune is called",`<p>${esc(G.p[me_].name)} calls Neptune's cycle for <b>${d} round${d>1?"s":""}</b> (2d3). The tiles fade, the numbers go dark, and the deep tide plays.</p>`);
    for(const pl of nepRealPl()){if(G.over)return;await nepOffer(pl)}}
  else{G.forceNepEc=true;try{await eclipse("neptune")}finally{G.forceNepEc=false}}
  render()}
{const _e=eclipse;eclipse=async function(k){if(k==="neptune"&&G.forceNepEc&&typeof eclipsesOff==="function"&&eclipsesOff())return;return _e.apply(this,arguments)}}
function nepTempRound(){const T=G.nepTemp;if(!T)return;const busy=T.k==="ev"?!!(G.nepEv&&G.moon.round<=G.nepEv.until):!!(G.eclipse&&G.eclipse.k==="neptune");if(busy)return;
  G.nepTemp=null;if(!T.prev)return;const p=T.prev,held=G.moon.round-p.at;
  G.moon.gone=p.gone;G.moon.i=p.i;G.moon.blood=p.blood;for(const f of NEP_SAVE)G[f]=p[f];
  if(G.skySince!=null)G.skySince+=held;if(G.skyArr!=null)G.skyArr+=held;   // its cycle picks up where it paused
  G.nepEv=null;G._vis=null;applyMoonTheme();
  log(`Neptune leaves the sky: ${skyWord(sky())} comes back where it paused.`,"event")}
/* the called cycle sounds like the eclipse: the deep tide and the sunken music */
{const _r=render;render=function(){rSafe(_r,this,arguments);if(!G||!G.nepEv||!G.nepEv.spell||!nepEvOn())return;
  try{if(typeof AUD!=="undefined"&&AUD.setAmb&&!G.eclipse)AUD.setAmb("ecl-neptune");if(window.ECMusic&&ECMusic.nep)ECMusic.nep(true)}catch(e){}}}

/* ---------- Stray Mana ---------- */
PRICE.stray=()=>1;
SPELLS.push({id:"stray",name:"Stray Mana",cost:1,school:"Illusion",text:"",ok:()=>!!G&&illFoes()&&G.moon.round>=(G.p[G.active].strayNext||0)&&!(G.strayOn&&G.strayOn.by===G.active&&G.strayOn.round===G.moon.round),
  run:async()=>{const me_=G.active,P=G.p[me_];const t=await pickHandFoe("stray","Stray Mana: whose mana?");if(t==null)return;
    let n,how;if(oathNow(me_,"neptune")){const c=R(2);n=sum(rollN(c===1?6:5,2));how=`${c===1?6:5}d2 (the Oath of Neptune)`}else{n=sum(rollN(7,2));how="7d2"}
    P.strayNext=G.moon.round+n;G.strayOn={by:me_,t,round:G.moon.round};
    log(`<b>Stray Mana</b>: ${plName(me_)} sets Neptune on ${plName(t)}'s mana for the rest of the round. Ready again in ${n} rounds (${how}).`,"event");
    notify(t,`Stray Mana: your mana may stray to ${esc(P.name)} for the rest of the round.`)}});
SPELL_TEXT.stray={n:"Choose an enemy.",e:"For the rest of the round, each mana they earn or spend rolls 1d20: on a 1 it strays to you (what they earn comes to you; what they spend is paid to you); on a 20 you share it (you gain what they gain, and pay what they pay).",l:"1 mana. Then not for 7d2 rounds (6d2 or 5d2 under the Oath of Neptune, on a 1d2)."};
SP("stray").text=[SPELL_TEXT.stray.n,SPELL_TEXT.stray.e,SPELL_TEXT.stray.l].join(" ");
let strayIn=false;
const strayOn=pl=>{const S=G&&G.strayOn;return !strayIn&&S&&S.t===pl&&S.round===G.moon.round&&G.p[S.by]&&!G.p[S.by].out?S:null};
{const _gm=giveMana;giveMana=function(pl,n){const S=n>0?strayOn(pl):null;if(!S)return _gm.apply(this,arguments);const d=R(20);if(d!==1&&d!==20)return _gm.apply(this,arguments);
  strayIn=true;try{if(d===1){_gm(S.by,n);log(`<b>Stray Mana</b>: ${n} mana meant for ${plName(pl)} strays to ${plName(S.by)} (a 1 on 1d20).`,"event");return 0}
    const out=_gm(pl,n);_gm(S.by,n);log(`<b>Stray Mana</b>: ${plName(S.by)} shares the ${n} mana ${plName(pl)} earns (a 20 on 1d20).`,"event");return out}finally{strayIn=false}}}
{const _sp=spend;spend=function(pl,n){const S=n>0?strayOn(pl):null;if(!S)return _sp.apply(this,arguments);const d=R(20);if(d!==1&&d!==20)return _sp.apply(this,arguments);
  strayIn=true;try{const out=_sp(pl,n);
    if(d===1){const got=giveMana(S.by,n);if(G.bank)G.bank.mana-=got;log(`<b>Stray Mana</b>: the ${n} mana ${plName(pl)} spends is paid to ${plName(S.by)} (a 1 on 1d20).`,"event")}
    else{_sp(S.by,n);log(`<b>Stray Mana</b>: ${plName(S.by)} pays the same ${n} mana ${plName(pl)} spends (a 20 on 1d20).`,"event")}
    return out}finally{strayIn=false}}}

/* a teammate under Lostness II: you see their stacks in a stranger's colors too */
{const _r=render;render=function(){rSafe(_r,this,arguments);if(!G)return;const V=view();if(V==null||nepEcState(V))return;
  for(const P of G.p){const S=P.i!==V&&nepSelf(P.i);if(!S||S.k!=="ec"||isEnemy(P.i,V))continue;
    for(const t of document.querySelectorAll("#board button.tile")){const st=G.board[+t.dataset.r][+t.dataset.c],s=t.querySelector(".stack");if(!st||!s||st.owner!==P.i||!st.cards[0])continue;
      const col=COLORS[nepHash(st.cards[0].id+"|"+S.st.seed)%COLORS.length][1];s.style.setProperty("--pc",col);s.style.setProperty("--pcb",`color-mix(in oklab,${col} 44%,#211b16)`)}}}}

if(window.__EC)Object.assign(window.__EC,{castLostnessW:k=>castLostness(k),nepCallW:k=>nepCall(k),nepTempRoundW:()=>nepTempRound(),nepSelfW:pl=>nepSelf(pl),cycleRoundW2:()=>cycleRound()});
