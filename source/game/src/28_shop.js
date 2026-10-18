/* ---------------- Prompt 12, part 2b (v28): the Heavenly Body shop, Venus's and Mercury's cycles, Rob the Bank, Jail ----------------
   The Heavenly Body shop (a setting, on by default): any of the seven Heavenly Bodies can be bought for the sky for 7 + 1d3 + 1d12 mana, each
     rolled every round. Everyone is told at once; the Heavenly Body rises at the start of the next round, with a second popup. After a
     purchase no Heavenly Body can be bought for six rounds. Nobody's Substance changes.
   Cycles: a Heavenly Body's cycle comes every sixth round it has hung in the sky.
     Venus: under its Oath, support and base conjurings cost 1 less that round and every card heals a heart; without the Oath,
       only on a 4 of 1d4.
     Mercury: a vote to ban one school of spells for 1d3 rounds from the next round (a tie is a d20 roll-off; a Mercury Oath
       wins it outright); and the Bank can be robbed, once each, that round.
   Rob the Bank (d20): 20, all the Bank's mana and +5 maximum; 2–19, a stack of 1d4 Grunts from the Bank comes after the robber
     and no more loans, ever; 1, Jail for 2d2 rounds (an easy computer plays for them, no spells), and after Jail no Ether and no
     Bank for ten turns, and no loans, ever. */

const SHOP_PL=["moon","mercury","venus","sun","mars","jupiter","saturn"];
const SHOP_NAME={moon:"The Moon",mercury:"Mercury",venus:"Venus",sun:"The Second Sun",mars:"Mars",jupiter:"Jupiter",saturn:"Saturn"};
const SHOP_LOCK=6,CYCLE=6;
const skyWord=k=>SHOP_NAME[k]?SHOP_NAME[k].replace(/^The /,"the "):k==="blacksun"?"the Black Sun":"the empty sky";
const shopOn=()=>!!G&&G.opts.pshop!==false;
const SH=()=>G.shop||(G.shop={pend:null,next:0});
const isEaten=k=>(G.eatenP||[]).includes(k)||k==="mars"&&!!G.marsEaten;
function shopBlock(k){const S=SH();
  if(!shopOn())return "The Heavenly Body shop is off in this game.";
  if(S.pend)return `${SHOP_NAME[S.pend.k]} rises next round.`;
  if(G.moon.round<S.next)return `No Heavenly Body can be bought until round ${S.next}.`;
  if(sky()===k)return "Already in the sky.";
  if(isEaten(k))return "Eaten by Yaldabaoth: it never comes back.";
  return ""}

/* v43: a Heavenly Body the Firmament already calls with its own, cheaper spell isn't in its shop (it keeps the rest) */
const firmOwn=(pl,k)=>!!(G&&G.p[pl]&&G.p[pl].tribe==="firm"&&SPELLS.some(s=>s.tribe==="firm"&&s.id===k));
/* ---------- the shop's spells: one for each Heavenly Body, in the Astrology panel ---------- */
for(const k of SHOP_PL){
  PRICE["shop_"+k]=()=>7+R(3)+R(12);
  SPELLS.push({id:"shop_"+k,name:"Buy "+skyWord(k).replace(/^the /,"the "),cost:12,dice:"7+1d3+1d12",school:"Astrology",shop:k,text:"",
    ok:()=>!isHorde(G.active)&&!shopBlock(k)&&!firmOwn(G.active,k),run:async()=>{await buyPlanet(G.active,k)}});
  const row=SKY_ROWS.find(r=>r[0]===k);
  SPELL_TEXT["shop_"+k]={n:"The Heavenly Body shop.",e:`${SHOP_NAME[k]} takes the sky at the start of the next round. ${row?row[3]:""}`,l:"7 + 1d3 + 1d12 mana, rolled every round. After any purchase, no Heavenly Body can be bought for six rounds."};
  const t=SPELL_TEXT["shop_"+k];SP("shop_"+k).text=[t.n,t.e,t.l].join(" ");
}
async function buyPlanet(pl,k){
  const S=SH();let venus=null;
  if(k==="venus"){const mates=[pl,...alliesOf(pl).filter(i=>!isHorde(i))];
    const opts=[{id:"a",label:"+2 mana a turn and +2 maximum",sub:"for you or a teammate"}];if(!survival())opts.push({id:"b",label:"+1 mana a turn, every enemy +2 maximum",sub:"for you or a teammate"});
    const mode=await ask(pl,{kind:"choice",id:"venusmode",title:"Venus: which gift?",options:opts,ai:()=>"a"})||"a";
    const target=mates.length===1?pl:await ask(pl,{kind:"player",id:"venustarget",title:"Venus: for whom?",players:mates,ai:()=>pl});
    venus={by:pl,mode,target:target??pl}}
  S.pend={k,by:pl,round:G.moon.round,venus,from:sky()};S.next=G.moon.round+SHOP_LOCK;
  log(`<b>The Heavenly Body shop</b>: ${plName(pl)} buys ${skyWord(k)}. It replaces ${skyWord(sky())} at the start of the next round.`,"event");
  popup("A Heavenly Body is bought",`<p>${plName(pl)} has bought <b>${esc(SHOP_NAME[k])}</b>.</p><p>It takes the place of ${skyWord(sky())} at the start of the next round.</p><p class="dim">No Heavenly Body can be bought again until round ${S.next}.</p>`,pl);
  notify(pl,`${esc(G.p[pl].name)} bought ${skyWord(k)}: it rises next round.`);
}
/* the swap, at the very start of the round (before the sky turns) */
function raisePlanet(){
  const S=SH(),p=S.pend;if(!p||G.moon.round<=p.round)return;S.pend=null;
  const {k,by}=p,old=sky();
  if(G.eclipse)endEclipse();
  if(G.moonLev&&(k==="saturn"||k==="sun")){const L=G.moonLev;G.moonLev=null;L.card.hp=L.card.maxHp;G.p[L.owner].deck.push(L.card);shuffle(G.p[L.owner].deck);log(`The Leviathan can't lie on ${skyWord(k)}: it falls back into ${plName(L.owner)}'s deck.`,"event")}
  if(PLANETS[k])setPlanet(k,by);
  else{const keep=G.p.map(P=>P.oath);
    G.moon.gone=k==="moon"?null:k;G.moon.i=k==="moon"?1:-1;G.moon.blood=false;G.planetBy=k==="moon"?null:by;
    G.p.forEach((P,i)=>{if(P.oath&&P.oath!==OATH_SKY[k]&&keep[i]!=="earth"&&!(keep[i]==="saturn"&&P.satLocked))P.oath=null});
    checkMoonMiner();if(old==="jupiter")G.jupSale=null}
  if(k==="saturn"){G.saturnBy=by;G.saturnDebt=0}else if(old==="saturn")G.saturnBy=null;
  if(k==="venus")G.venus=p.venus||{by,mode:"a",target:by};else if(old==="venus")G.venus=null;
  if(k==="jupiter")rollJupSale();
  G._vis=null;applyMoonTheme();
  log(`<b>${esc(SHOP_NAME[k])}</b> takes the sky: it replaces ${skyWord(old)}, bought by ${plName(by)}.`,"event");
  popup(`${SHOP_NAME[k]} rises`,`<p><b>${esc(SHOP_NAME[k])}</b> has replaced ${skyWord(old)} in the sky. ${plName(by)} bought it.</p>${k==="moon"?"<p>The Moon comes back as a Waxing Crescent.</p>":""}${OATH_SKY[old]&&OATH_SKY[old]!==OATH_SKY[k]?`<p class="dim">Oaths sworn to ${skyWord(old)} are broken.</p>`:""}`,by);
}
{const _ms=moonStart;moonStart=async function(){raisePlanet();return _ms()}}
/* ---------- the shop's panel ---------- */
function shopHTML(){
  const live=canAct()&&G.phase==="prep"&&G.active===view(),S=SH();
  const V=view(),mine=SHOP_PL.filter(k=>firmOwn(V,k));
  const rows=SHOP_PL.filter(k=>!mine.includes(k)).map(k=>{const sp=SP("shop_"+k),c=spellCost(sp),ok=live&&spellReady(sp),now=sky()===k,blk=shopBlock(k);
    const left=now?"In the sky":isEaten(k)?"Eaten":planetStruck(k)?"Struck":S.pend&&S.pend.k===k?"Rises next round":"";
    return `<button class="spell eitem ${ok?"":"off"}" data-cast="shop_${k}" data-sp="shop_${k}" ${blk&&!ok?`data-tip="${esc(blk)}"`:""}><span class="sn">${esc(SHOP_NAME[k])}<small class="dc">${esc((SKY_FORM[k]||"").replace("Form of ",""))}</small>${left?`<small class="left">${left}</small>`:""}</span><em>${c} mana</em></button>`}).join("");
  const note=S.pend?`${plName(S.pend.by)} bought ${skyWord(S.pend.k)}: it rises at the start of the next round.`
    :G.moon.round<S.next?`A Heavenly Body was bought. The shop opens again in round ${S.next}.`
    :live?"Buy a Heavenly Body for the sky. It rises at the start of the next round. Prices (7 + 1d3 + 1d12) are rolled every round."
    :"You can buy a Heavenly Body in your own prep phase.";
  return [`${note} After a purchase, no Heavenly Body can be bought for six rounds.${mine.length?` Your own spells call ${mine.map(k=>SHOP_NAME[k]).join(", ")} for less, so the shop shows only the rest.`:""}`,rows]}
DRAWERS.shop={title:"Heavenly Body shop",fill:shopHTML};
{const _p=astroPins;astroPins=function(live,V){let h=_p(live,V);if(!shopOn())return h;const S=SH();
  const st=S.pend?`${SHOP_NAME[S.pend.k]} next round`:G.moon.round<S.next?`opens round ${S.next}`:"open";
  return h+`<button class="spell drawerbtn shop ${live?"":"off"}" id="openShop" data-tip="The Heavenly Body shop: buy any of the seven Heavenly Bodies for the sky. It rises at the start of the next round."><span class="sn">Heavenly Body shop<small class="dc">${esc(st)}</small></span><em>›</em></button>`}}
{const _w=wireAstroPins;wireAstroPins=function(){_w();if($("#openShop"))$("#openShop").onclick=()=>openDrawer("shop")}}

/* ---------- cycles: every sixth round a Heavenly Body has hung in the sky ---------- */
const cycleNow=k=>planetUp(k)&&G.skySince!=null&&G.moon.round>G.skySince&&(G.moon.round-G.skySince)%CYCLE===0;
const cycleNext=()=>{if(G.skySince==null)return null;let n=G.skySince+CYCLE;while(n<G.moon.round)n+=CYCLE;return n};
const VENUS_CJ=new Set(["csc","cmine","crep","cram","cheal","ca","cwall"]);   // the Ether's support and base cards
const venusBlessed=pl=>!!(G&&G.venusCyc&&G.venusCyc.round===G.moon.round&&planetUp("venus")&&G.venusCyc.who.includes(pl));
function venusCycle(){
  const who=[],rolls=[];
  for(const pl of realPlayers()){if(oathNow(pl,"venus")){who.push(pl);continue}
    const d=R(4);rolls.push([pl,d]);tray(pl,"Venus's cycle",[{s:4,v:d}],d===4?"blessed":"passed over",true);if(d===4)who.push(pl)}
  G.venusCyc={round:G.moon.round,who};let healed=0;
  for(const pl of who)for(const {st} of stacksOf(pl))for(const c of st.cards)if(c.maxHp&&c.hp<c.maxHp){c.hp++;healed++}
  log(`<b>Venus's cycle</b>: ${who.length?`${who.map(plName).join(", ")} ${who.length===1?"is":"are"} blessed this round (support and base conjurings 1 less, ${healed} heart${healed===1?"":"s"} healed)`:"Venus blesses no one this round"}.`,"event");
  popup("Venus's cycle",`<p>Every sixth round Venus is generous to those sworn to her: this round their support and base cards from the Ether (Scout, Miner, Repairman, Battering Ram, Healer, Ace, Wall) cost 1 less, and every wounded card of theirs heals one heart.</p>
<p>${who.length?`Blessed: ${who.map(plName).join(", ")}.`:"Nobody is blessed this time."}</p>${rolls.length?`<p class="dim">Without her Oath, a 4 on 1d4: ${rolls.map(([pl,d])=>`${plName(pl)} ${d}`).join(", ")}.</p>`:""}`);
}
{const _sc=spellCost;spellCost=function(sp){let c=_sc(sp);if(sp&&c>0&&VENUS_CJ.has(sp.id)&&G&&venusBlessed(G.active))c=Math.max(0,c-1);return c}}

/* Mercury: a vote to ban a school of spells */
const banOn=()=>!!(G&&G.mban&&G.moon.round>=G.mban.from&&G.moon.round<=G.mban.until);
function aiBanVote(pl){if(Math.random()<.3)return "none";
  const mine=new Set(SPELLS.filter(s=>(!s.tribe||s.tribe===G.p[pl].tribe)&&s.school!=="Astrology").map(s=>s.school));
  const opts=SCHOOLS.filter(s=>s!=="Astrology");const theirs=opts.filter(s=>!["Conjuring"].includes(s)||mana(pl)<4);
  return pick(theirs.length?theirs:opts)||"none"}
async function mercuryCycle(){
  const r=G.moon.round;G.mercCyc=r;
  const opts=[...SCHOOLS.map(s=>({id:s,label:s,sub:`No ${s} spells for anyone`})),{id:"none",label:"Ban nothing"}];
  const back={};
  for(const pl of realPlayers()){const v=await ask(pl,{kind:"choice",id:"mercban",title:`Mercury's cycle: ${G.p[pl].name} votes to ban a school of spells for 1d3 rounds`,options:opts,ai:()=>aiBanVote(pl)})||"none";
    (back[v]=back[v]||[]).push(pl);log(`${plName(pl)} votes to ban ${v==="none"?"nothing":v}.`)}
  const top=Math.max(...Object.values(back).map(a=>a.length)),tied=Object.keys(back).filter(k=>back[k].length===top);
  let win=tied[0],tie="";
  if(tied.length>1){
    const merc=tied.filter(s=>back[s].some(pl=>oathNow(pl,"mercury")));
    if(merc.length===1){win=merc[0];tie=`<p>A tie between ${tied.map(s=>s==="none"?"no ban":s).join(" and ")}. ${back[win].filter(pl=>oathNow(pl,"mercury")).map(plName).join(", ")} swore the Oath of Mercury and wins the tie without dice.</p>`}
    else{let pool=merc.length?merc:tied,rows=[];
      for(let tries=0;tries<10&&pool.length>1;tries++){const best={};
        for(const s of pool){for(const pl of back[s]){const d=R(20);rows.push([pl,s,d]);tray(pl,"Mercury's tie",[{s:20,v:d}],`for ${s==="none"?"no ban":s}`,true);best[s]=Math.max(best[s]||0,d)}}
        const hi=Math.max(...Object.values(best));pool=pool.filter(s=>best[s]===hi)}
      win=pool[0];
      tie=`<p>A tie between ${tied.map(s=>s==="none"?"no ban":s).join(" and ")}: everyone behind them rolls 1d20, and the highest roll wins.</p><table class="tierolls">${rows.map(([pl,s,d])=>`<tr><td>${plName(pl)}</td><td>${s==="none"?"no ban":s}</td><td><b>${d}</b></td></tr>`).join("")}</table>`}
    popup("Mercury's vote: a tie",`${tie}<p>The winner: <b>${win==="none"?"no ban":esc(win)}</b>.</p>`)}
  if(win==="none"){G.mban=null;log("Mercury's vote: nothing is banned.","event")}
  else{const d=R(3);G.mban={school:win,from:r+1,until:r+d};
    log(`<b>Mercury's ban</b>: no ${win} spells for anyone from round ${r+1} to round ${r+d} (1d3 = ${d}).`,"event");
    popup("Mercury's ban",`<p>The vote bans <b>${esc(win)}</b>. From the start of the next round, nobody can cast ${esc(win)} spells for ${d} round${d>1?"s":""} (1d3), until the end of round ${r+d}.</p>`)}
  if(bankOpen())notify(null,"Mercury's cycle: the Bank can be robbed this round (Rob the Bank, under the Bank).");
}
/* ---------- the start of each round: Jail, the sky's age, the cycles ---------- */
async function cycleRound(){
  for(const P of G.p)if(P.jail&&G.moon.round>P.jail.until)leaveJail(P.i);
  if(G._skyK!==sky()){G._skyK=sky();G.skySince=G.moon.round}
  if(G.mban&&G.moon.round===G.mban.from)notify(null,`Mercury's ban begins: no ${esc(G.mban.school)} spells until the end of round ${G.mban.until}.`);
  if(G.mban&&G.moon.round>G.mban.until){log(`Mercury's ban on ${G.mban.school} ends.`,"event");G.mban=null}
  if(cycleNow("venus"))venusCycle();
  if(cycleNow("mercury"))await mercuryCycle();
  render();
}
{const _nr=newRound;newRound=async function(){await _nr();if(G.over)return;await cycleRound()}}

/* ---------- Rob the Bank ---------- */
const bankBanned=pl=>!!(G.p[pl]&&G.p[pl].bankBan!=null&&tnOf(pl)<=G.p[pl].bankBan);
const etherBanned=pl=>!!(G.p[pl]&&G.p[pl].etherBan!=null&&tnOf(pl)<=G.p[pl].etherBan);
const jailLeft=P=>Math.max(1,P.jail.until-Math.max(G.moon.round,P.jail.from+1)+1);   // the round they are caught in is not counted
const robOk=pl=>!!(G&&G.p[pl]&&G.mercCyc===G.moon.round&&planetUp("mercury")&&bankOpen()&&!isHorde(pl)&&!G.p[pl].jail&&G.p[pl].robbed!==G.moon.round&&!bankBanned(pl));
SPELLS.push({id:"robbank",name:"Rob the Bank",cost:0,school:"Bank",text:"Free, once, in a round of Mercury's cycle. Roll 1d20. A natural 20: every mana in the Bank is yours (what doesn\u2019t fit in your soul pile waits in a stash and pours in each turn), and +5 maximum. A 1: Jail for 2d2 rounds (an easy computer plays for you, and you cast nothing); after Jail, no Ether and no Bank for ten turns, and no loans ever again. Anything else: a stack of 1d4 Grunts comes out of the Bank after you, and you can never take a loan again.",
  ok:()=>robOk(G.active),run:async()=>{await robBank(G.active)}});
SPELL_TEXT.robbank={n:"Mercury's cycle, once, in your prep phase.",e:"Roll 1d20. A natural 20: the Bank is emptied and every mana in it is yours (what doesn\u2019t fit in your soul pile waits in a stash and pours in at the start of each turn), and +5 maximum. 2 to 19: a stack of 1d4 Grunts comes out of the Bank after you, and you can never take a loan again. A 1: Jail for 2d2 rounds; an easy computer plays for you and you cast nothing.",l:"After Jail: no Ether and no Bank for ten turns, and no loans ever again."};
const ROB_FAILS=[
  n=>`The vault door ${n} broke open was painted on the wall. The guards laughed for a while before they drew their swords.`,
  n=>`The Banker was counting coins in the dark the whole time. He wrote down ${n}'s face and rang the bell.`,
  n=>`${n}'s tunnel came up under the guardhouse instead of the vault.`,
  n=>`One coin slipped out of ${n}'s sack and rang on the marble floor. The whole Bank heard it.`,
  n=>`The sack had a hole in it: a trail of mana led the guards straight back to ${n}.`,
  n=>`The Banker's ledger already had ${n}'s name in it, under "expected".`];
function bankGrunts(pl){const B=npcIx("bank");if(B<0)return 0;const t=freeTilesNear(pl,true)[0];if(!t)return 0;const k=R(4);
  const cards=Array.from({length:k},()=>{const c=mk(String(1+R(4)),pick(["S","H","D","C"]));c.owner=B;return c});
  G.board[t[0]][t[1]]={owner:B,cards,moved:true,attacked:true,hunt:pl};return k}
async function robBank(pl){
  const P=G.p[pl],B=G.bank,d=R(20),nm=plName(pl);P.robbed=G.moon.round;
  tray(pl,"Rob the Bank",[{s:20,v:d}],d===20?"the vault is yours":d===1?"caught: Jail":"failed");
  if(d===20){P.maxAdd=(P.maxAdd||0)+5;const all=Math.max(0,B.mana),got=giveMana(pl,all);B.mana=0;const left=all-got;if(left>0)P.loot=(P.loot||0)+left;
    log(`<b>${nm} robs the Bank</b> with a natural 20: all ${all} mana and +5 maximum${left>0?` (${left} wait in a stash and pour into the soul pile as it has room, at the start of each turn)`:""}.`,"event");
    popup("The heist",`<p>${nm} rolls a natural 20 and empties the vault: all <b>${all}</b> mana, and five more maximum mana.${left>0?` <b>${got}</b> go into the soul pile now; the other <b>${left}</b> wait in a stash and pour in at the start of each of ${nm}'s turns, as much as fits.`:""}</p>`,pl)}
  else if(d===1)goToJail(pl);
  else{P.noLoans=true;P.credit=false;const k=bankGrunts(pl);
    log(`${nm} tries to rob the Bank and fails (${d}). ${k?`A stack of ${k} Grunt${k>1?"s":""} comes out of the Bank after them, and `:""}${k?"they":"They"} can never take a loan again.`,"event");
    popup("The robbery fails",`<p>${pick(ROB_FAILS)(nm)}</p><p>${nm} rolled ${d}: not a 20.${k?` A stack of ${k} Grunt${k>1?"s":""} comes out of the Bank after them.`:""}</p><p>${nm} can never take a loan again.</p>`,pl)}
  render();checkWin();
}
/* the stash from a perfect heist pours into the soul pile at the start of each of the robber's turns, as much as fits */
{const _ta=turnAsync;turnAsync=async function(pl){const P=G.p[pl];if(P&&P.loot>0&&!P.out){const got=giveMana(pl,P.loot);if(got){P.loot-=got;log(`${plName(pl)} takes ${got} mana from the Bank heist's stash${P.loot?` (${P.loot} left)`:""}.`)}}
  return _ta.apply(this,arguments)}}
/* ---------- Jail ---------- */
function goToJail(pl){
  const P=G.p[pl],d=[R(2),R(2)],n=d[0]+d[1];tray(pl,"Jail",d.map(v=>({s:2,v})),`${n} rounds`,true);
  P.jail={from:G.moon.round,until:G.moon.round+n,cpu:P.cpu||false};P.noLoans=true;P.credit=false;
  if(!P.cpu)G.lastView=pl;P.cpu="easy";
  log(`<b>${plName(pl)} is caught robbing the Bank</b> (a 1) and goes to Jail for ${n} rounds (2d2). An easy computer plays for them; they cast nothing.`,"event");
  popup("Jail",`<p>${plName(pl)} rolls a 1. The guards were waiting.</p><p>${plName(pl)} is in Jail for <b>${n}</b> rounds (2d2): an easy computer plays their side, and they can't cast anything.</p><p>After Jail: nothing from the Ether and no Bank business for ten turns, and never a loan again.</p>`,pl);
  // a person caught in their own prep phase: the computer takes over at once
  if(G.active===pl)setTimeout(()=>{if(G.waiter&&G.active===pl&&P.jail){const f=G.waiter;G.waiter=null;G.mode=null;G.selHand=null;f()}},500);
}
function leaveJail(pl){const P=G.p[pl];if(!P.jail)return;P.cpu=P.jail.cpu;P.jail=null;
  P.etherBan=tnOf(pl)+10;P.bankBan=tnOf(pl)+10;P.noLoans=true;P.credit=false;
  log(`<b>${plName(pl)} is out of Jail.</b> No Ether and no Bank for ten turns; no loans ever again.`,"event");
  popup("Out of Jail",`<p>${plName(pl)} walks out of Jail and takes their side back.</p><p>For the next ten turns: nothing from the Ether and no Bank business. And never a loan again.</p>`,pl)}

/* what Jail, the ban and the robbery's aftermath forbid */
{const _b=spellBlock;spellBlock=function(sp){const P=G.p[G.active];
  if(P&&P.jail)return `In Jail: no spells for ${jailLeft(P)} more round${jailLeft(P)===1?"":"s"}.`;
  if(banOn()&&sp.school===G.mban.school)return `Mercury's ban: no ${G.mban.school} spells until the end of round ${G.mban.until}.`;
  if(P&&sp.school==="Conjuring"&&etherBanned(G.active))return `Out of Jail: no Ether until your turn ${P.etherBan+1}.`;
  if(P&&sp.id==="gamble"&&bankBanned(G.active))return `Out of Jail: no Bank until your turn ${P.bankBan+1}.`;
  return _b(sp)}}
{const _ll=loanLimit;loanLimit=function(pl){const P=G.p[pl];if(P&&(P.noLoans||P.jail||bankBanned(pl)))return 0;return _ll(pl)}}
{const _ca=canAfford;canAfford=function(pl,n){const P=G.p[pl];if(P&&(P.noLoans||P.jail||bankBanned(pl)))return mana(pl)>=n;return _ca(pl,n)}}
{const _mb=mysteryBuy;mysteryBuy=function(pl){const P=G.p[pl];if(P&&(P.jail||etherBanned(pl))){if(!P.cpu)flash("Out of Jail: no Ether yet.");return null}return _mb(pl)}}
{const _ab=aiBank;aiBank=async function(pl,W,cast1){if(G.p[pl].jail||bankBanned(pl))return;return _ab(pl,W,cast1)}}
{const _ob=openBank;openBank=function(){_ob();const V=view(),P=G.p[V],box=$("#ov .bank .bacts");if(!box)return;
  if(P.jail||bankBanned(V)){box.innerHTML=`<p class="bnote">${P.jail?"In Jail: no Bank business.":`Out of Jail: no Bank business until your turn ${P.bankBan+1}.`}</p>`;return}
  if(P.noLoans){for(const id of ["#bLoan","#bLoanBtn","#bCredit"]){const e=$(id);if(e){e.disabled=true;e.checked=false}}
    const n=document.createElement("p");n.className="bnote";n.textContent="After robbing the Bank you can never take a loan or spend on credit again.";box.prepend(n)}}}
/* the computer playing a jailed player stays easy; a robber's computer at the Bank */
{const _ap=aiPlanets;aiPlanets=async function(pl,W,cast1){await _ap(pl,W,cast1);if(G.over)return;const P=G.p[pl],lv=P.cpu;if(P.jail)return;
  if(shopOn()&&!SH().pend&&G.moon.round>=SH().next&&Math.random()<(lv==="hard"?.12:.06)){
    const ks=SHOP_PL.filter(k=>!shopBlock(k)),want=ks.length?pick(ks):null;
    if(want&&mana(pl)>=(G.prices["shop_"+want]||15)+4)await cast1("shop_"+want)}
  if(robOk(pl)&&Math.random()<(lv==="easy"?.3:.12))await cast1("robbank");
}}

/* ---------- on the screen ---------- */
{const _id=inDrawer;inDrawer=function(s,V){if(s.shop||s.id==="robbank")return true;return _id(s,V)}}
/* Rob the Bank sits under the Bank, in dark red, while it can be done */
{const _rs=renderSpells;renderSpells=function(live){_rs(live);const bs=$("#bankslot");if(!bs||!G)return;const V=view();
  if(G.mercCyc===G.moon.round&&planetUp("mercury")&&bankOpen()&&!survival()){const sp=SP("robbank"),ok=live&&G.active===V&&spellReady(sp);
    const done=G.p[V].robbed===G.moon.round;
    bs.insertAdjacentHTML("beforeend",`<button class="spell robbank ${ok?"":"off"}" id="robBank" data-sp="robbank"><span class="sn">Rob the Bank<small class="dc">1d20</small>${done?`<small class="left">tried</small>`:""}</span><em>free</em></button>`);
    $("#robBank").onclick=async()=>{if(!canAct())return;await cast(SP("robbank"));render()}}}}
{const _et=econTags;econTags=function(P){const t=_et(P);
  if(P.jail)t.push(`<span class="debttag jailtag">In Jail · ${jailLeft(P)} round${jailLeft(P)===1?"":"s"}</span>`);
  else{if(etherBanned(P.i))t.push(`<span class="debttag">No Ether · ${P.etherBan-tnOf(P.i)}</span>`);if(bankBanned(P.i))t.push(`<span class="debttag">No Bank · ${P.bankBan-tnOf(P.i)}</span>`)}
  if(P.noLoans&&!P.jail)t.push(`<span class="debttag">No loans</span>`);
  if(venusBlessed(P.i))t.push(`<span class="saletag">Venus's blessing</span>`);
  return t}}
{const _rd=render;render=function(){_rd.apply(this,arguments);if(!G)return;
  const B=$("#board"),V=G.p[view()];if(!B)return;let js=B.querySelector(".jailstrip");
  if(V&&V.jail){if(!js){js=document.createElement("div");js.className="jailstrip";js.setAttribute("role","status");B.appendChild(js)}
    const n=jailLeft(V);js.innerHTML=`<b>You are in Jail</b><span>${n} round${n===1?"":"s"} left</span>`}
  else if(js)js.remove()}}
/* the sky's box: what's coming */
{const _c=skyCommon;skyCommon=function(L){_c(L);const S=SH(),r=G.moon.round;
  if(S.pend)L.push(`${plN(S.pend.by)} bought ${skyWord(S.pend.k)}: it takes the sky next round.`);
  else if(shopOn()&&r<S.next)L.push(`Heavenly Body shop: no Heavenly Body can be bought until round ${S.next}.`);
  const nx=cycleNext();
  if(planetUp("venus"))L.push(cycleNow("venus")?`<b>Venus's cycle</b> this round: ${G.venusCyc&&G.venusCyc.who.length?G.venusCyc.who.map(plN).join(", ")+" blessed":"nobody blessed"}.`:`Venus's cycle every ${CYCLE} rounds: under her Oath, support and base conjurings cost 1 less and every wounded card heals a heart (without it, a 4 on 1d4). Next: round ${nx}.`);
  if(planetUp("mercury"))L.push(cycleNow("mercury")?"<b>Mercury's cycle</b> this round: the Bank can be robbed.":`Mercury's cycle every ${CYCLE} rounds: a vote bans one school of spells for 1d3 rounds, and the Bank can be robbed. Next: round ${nx}.`);
  if(banOn())L.push(`<b>Mercury's ban</b>: no ${esc(G.mban.school)} spells until the end of round ${G.mban.until}.`);
  else if(G.mban)L.push(`Mercury's ban on ${esc(G.mban.school)} starts next round.`)}}

if(window.__EC)Object.assign(window.__EC,{buyPlanet,raisePlanet,venusCycle,mercuryCycle,robBank,goToJail,leaveJail,cycleRound,shopBlock,spellCost:sp=>spellCost(sp),spellBlock:sp=>spellBlock(sp)});
