/* ---------------- Prompt 9: the Bank, loans and mana debt, selling cards, Gambling, max mana, Mystery Generation,
   Demons, the meteor and its fire, the Banker's heart ---------------- */

/* ---------- the two sides nobody plays: the Demons and the Bank ----------
   They sit at the end of G.p with no seat, no deck and no mana, and act at the start of every round. */
const isNPC=pl=>!!(G&&G.p[pl]&&G.p[pl].cpu==="npc");
const npcIx=k=>G.p.findIndex(P=>P.npc===k);
function addNPCs(){
  G.bank={mana:0,dead:false,owes:[],buys:{},upsell:{},angry:false};
  if(G.opts.bankStart){const d=rollN(2*G.p.length,2);G.bank.mana=sum(d);G.bank.startRoll=d}
  if(survival())return;
  for(const [k,name,color,solid] of [["barb","The Demon Band","#b3172c","dodeca"],["bank","The Bank","#d4a72c","octa"]]){
    const i=G.p.length,P=mkPlayer(i,{name,color,solid,cpu:"npc"});P.npc=k;P.team=100+i;G.p.push(P);
    G.map.seats[i]={side:"none",rot:0,fwd:[0,0],back:[],zone:[]};
  }
}

/* ---------- mana that can go below zero ----------
   Souls are mana you hold; debt is mana you owe the Bank. Every soul that comes in pays the debt first.
   Below −3 × your maximum you lose at once. */
const debtOf=pl=>G.p[pl]?G.p[pl].debt||0:0;
const effMana=pl=>mana(pl)-debtOf(pl);
const DEBT_FLOOR=-8,BANK_FLOOR=-8,DEEP_DEBT=-1;   // v49: three turns at −1 or lower and the Debt Collectors come   // v46: nobody goes below −8, the Bank included; Debt Collectors watch −6
const floorOf=pl=>G&&G.p[pl]&&G.p[pl].oath==="jupiter"?-12:DEBT_FLOOR;   // v50: the Oath of Jupiter lets you sink to −12
const bankOpen=()=>!!G.bank&&!G.bank.dead;
function bankAdd(n){if(G.bank)G.bank.mana+=n}
function payQuiet(pl,n){const P=G.p[pl];P.souls.sort((a,b)=>soulOf(a)-soulOf(b));let paid=0;
  while(paid<n&&P.souls.length){const i=P.souls.findIndex(c=>soulOf(c)>=n-paid);const c=i>=0?P.souls.splice(i,1)[0]:P.souls.shift();paid+=soulOf(c);toGrave(c,"spent")}
  return paid}
function addDebt(pl,n){const P=G.p[pl];const paid=payQuiet(pl,Math.min(n,mana(pl)));bankAdd(paid);const rest=n-paid;
  if(rest>0){P.debt=(P.debt||0)+rest;if(P.debtAt==null)P.debtAt=tnOf(pl)+3}
  checkDebt(pl)}
function checkDebt(pl){if(!G||G.over||!G.p[pl]||G.p[pl].out||isHorde(pl))return;
  if(effMana(pl)<floorOf(pl))eliminate(pl,`${esc(G.p[pl].name)} sank below −${-floorOf(pl)} mana, and the Bank takes everything`)}
const creditOn=pl=>!!G.p[pl].credit&&bankOpen();
function canAfford(pl,n){return mana(pl)>=n||creditOn(pl)&&effMana(pl)-n>=floorOf(pl)}
/* spending on a spell: souls first, the rest on credit; whatever is paid goes to the Bank */
function spend(pl,n){const have=mana(pl);
  if(have>=n){pay(pl,n);bankAdd(n);return}
  if(have)pay(pl,have);bankAdd(have);
  const P=G.p[pl];P.debt=(P.debt||0)+(n-have);if(P.debtAt==null)P.debtAt=tnOf(pl)+3;rpOf(pl).credit+=n-have;if(pl===G.active)G.spent=true;
  log(`${plName(pl)} spends ${n-have} mana on credit (${effMana(pl)}/${soulCap(pl)}).`);checkDebt(pl)}
function noteBuy(id){const B=G.bank;if(!B)return;const r=G.moon.round;(B.buys[r]=B.buys[r]||{})[id]=(B.buys[r][id]||0)+1}

/* ---------- prices: the Bank's upsells, the angry Banker, Ether sales, the collapse ---------- */
/* v45: a private Ether sale takes 1d2 − 1 off a conjuring, rolled once a turn for each, so the price you see is the price you pay */
function saleCut(sp){const D=G.saleD||(G.saleD={});if(D[sp.id]==null)D[sp.id]=R(2)-1;return D[sp.id]}
function spellCost(sp){
  let c=baseCost(sp);const B=G.bank;if(!B)return c;
  if(c>0){c+=(B.upsell[sp.id]||0)+(B.angry?1:0);if(G.inflation&&G.turnNo<=G.inflation.until)c+=G.inflation.add||0}
  c=jupiterCost(sp,c);c=mercuryCost(sp,c);
  if(sp.school==="Conjuring"&&c>0){
    if(B.mana<0&&!B.dead)c=Math.max(1,c-1);   // the Bank is broke: the Ether goes on sale
    const P=G.p[G.active];if(P&&P.saleUntil!=null&&tnOf(G.active)<=P.saleUntil)c=Math.max(0,c-saleCut(sp));   // a Demon-slayer's private sale: 1d2 − 1 off
  }
  return Math.max(0,c);
}

/* ---------- loans ---------- */
function loanLimit(pl){if(!bankOpen()||isHorde(pl))return 0;const e=effMana(pl),cap=soulCap(pl);
  if(loanWhy(pl))return 0;
  let lim=e<=-cap?5:e<0?6:12;   // the Bank won't lend seven or more to someone already below zero
  return Math.max(0,Math.min(lim,G.bank.mana-BANK_FLOOR,surCap(pl)-mana(pl)+debtOf(pl)))}
/* v46: one loan at a time, one a round at most, and the next no sooner than three of your turns after the last */
const LOAN_GAP=3;
function loanWhy(pl){const P=G.p[pl];if((P.loans||[]).length)return "One loan at a time: pay off the one you have first.";
  if(P.loanRound===G.moon.round)return "One loan a round.";const w=(P.loanNext||0)-tnOf(pl);if(w>0)return `Your next loan can be taken in ${w} turn${w>1?"s":""}.`;
  if(G.bank.mana<=BANK_FLOOR)return `The Bank is ${-BANK_FLOOR} in the red and can't lend.`;return ""}
const loanDue=n=>Math.max(2,Math.ceil(n/2));   // 12 mana: 6 turns; never less than 2
const loanRate=pl=>effMana(pl)<=-soulCap(pl)?.3:.2;
function takeLoan(pl,n){const P=G.p[pl];n=Math.min(n,loanLimit(pl));if(n<=0)return 0;
  G.bank.mana-=n;const got=giveMana(pl,n),t=tnOf(pl);
  (P.loans=P.loans||[]).push({owed:n,at:t+3,due:t+loanDue(n),t0:t});rpOf(pl).loans+=n;P.loanRound=G.moon.round;P.loanNext=t+LOAN_GAP;
  log(`<b>The Bank</b> lends ${plName(pl)} ${n} mana (it grows by 1d2 every 3 turns; due in ${loanDue(n)} turns).`,"event");return got}
function owedOf(pl){return (G.p[pl].loans||[]).reduce((a,L)=>a+L.owed,0)}
function repay(pl,n){const P=G.p[pl];n=Math.min(n,mana(pl),owedOf(pl));if(n<=0)return 0;const paid=payQuiet(pl,n);bankAdd(paid);let left=paid;
  for(const L of [...P.loans]){const k=Math.min(L.owed,left);L.owed-=k;left-=k;if(L.owed<=0)P.loans.splice(P.loans.indexOf(L),1);if(!left)break}
  log(`${plName(pl)} pays the Bank ${paid} mana${P.loans.length?` (${owedOf(pl)} still owed)`:"; every loan is settled"}.`);return paid}
/* selling to the Bank: cards from your hand or deck go to the Ether for their conjuring price */
/* v44: the Bank pays a card's soul worth, less 0 or 1 (rolled at the sale); a standard card worth only 1 can't be sold */
const sellable=c=>!(cardClass(c)==="Standard"&&soulOf(c)<=1);
const sellRange=c=>[Math.max(0,soulOf(c)-1),soulOf(c)];
function sellCards(pl,cards){const P=G.p[pl];let price=0;const rolls=[];cards=cards.filter(sellable);if(!cards.length)return 0;
  for(const c of cards){const L=P.hand.includes(c)?P.hand:P.deck;L.splice(L.indexOf(c),1);const d=R(2);rolls.push({s:2,v:d});price+=Math.max(0,soulOf(c)-(d-1));c.owner=null;if(c.hp!=null)c.hp=c.maxHp;G.ether.push(c)}
  shuffle(P.deck);tray(pl,"Sale to the Bank",rolls,`${price} mana`);const got=giveMana(pl,price);G.bank.mana-=got;
  log(`${plName(pl)} sells ${cards.length} card${cards.length>1?"s":""} to the Bank for ${got} mana (soul worth, less 1 on each 2 of 1d2)${got<price?`; ${price-got} more would not fit in the soul pile`:""}. The deck is reshuffled.`,"event");return got}
function sellThrall(pl){const P=G.p[pl];const c=(P.thralls||[]).shift();if(!c)return;c.owner=null;G.ether.push(c);const got=giveMana(pl,1);G.bank.mana-=got;
  log(`${plName(pl)} sells a thrall to the Bank (+${got} mana).`)}

/* ---------- the start of a player's turn: interest, loans coming due, fire, Demons ---------- */
function bankTurn(pl){
  barbTick();
  const P=G.p[pl];if(!P||isHorde(pl)||!G.bank)return;
  debtWatch(pl);if(P.guilty&&bankOpen()){let k=R(2);if(P.guiltyAt!=null&&tnOf(pl)-P.guiltyAt>=6)k=Math.ceil(k*1.5);sendCollectors(k)}   // v49: six turns in default: half as many again
  const n=tnOf(pl);
  if(bankOpen()){
    for(const L of P.loans||[])if(n>=L.at){const add=R(2);L.owed+=add;L.at=n+3;rpOf(pl).intL+=add;log(`Interest: ${plName(pl)}'s loan grows by ${add} (1d2) to ${L.owed}.`)}
    if(P.debt>0&&P.debtAt!=null&&n>=P.debtAt){const add=R(2);P.debt+=add;P.debtAt=n+3;rpOf(pl).intC+=add;log(`Interest: ${plName(pl)}'s mana debt grows by ${add} to −${P.debt}.`)}
    for(const L of [...(P.loans||[])])if(n>=L.due){P.loans.splice(P.loans.indexOf(L),1);const take=payQuiet(pl,Math.min(mana(pl),L.owed));bankAdd(take);
      if(take<L.owed){const P2=G.p[pl];P2.debt=(P2.debt||0)+L.owed-take;if(P2.debtAt==null)P2.debtAt=n+3}
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
  // a Blood Moon brings the Demons
  if(G.moon.blood&&G.moon.i===4&&npcIx("barb")>=0&&G.opts.barbarians!==false)spawnBarbarians(true);
  // Saturn taxes the Bank too
  if(G.moon.gone==="saturn"&&G.saturnBy!=null&&!G.p[G.saturnBy].out&&!B.dead){const n=Math.min(1+(G.saturnDebt||0),Math.max(0,B.mana-BANK_FLOOR));B.mana-=n;const got=giveMana(G.saturnBy,n);log(`The Bank pays Saturn's tax: ${n} mana (${plName(G.saturnBy)} gets ${got}).`)}
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
  if(!B.dead&&B.mana<=-3&&pls.length&&pls.every(i=>effMana(i)<=-3))collapse();   // v46: everyone 3 in the red, the Bank too
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
  popup("The Bank collapses",`<p>The Bank and every player were 3 or more below zero. It all comes down.</p><p>Everyone's mana and debts are wiped to zero, every maximum falls to three, five random cards leave each deck (two from the field if the deck is empty) and each player's Ace on the field goes back into the Ether. For 4d2 turns every price wobbles up by 1d2 − 1 a turn.</p>`);
  checkWin();
}

/* ---------- Gambling, max mana, Mystery Generation ---------- */
PRICE.mystery=()=>R(2)+R(3)+R(3);
SPELLS.push(
 {id:"gamble",name:"Gambling",cost:1,school:"Sorcery",text:"Roll 1d10. A natural 10 turns your mana into 7d2 mana, paid by the Bank. A 1 costs you one maximum mana, puts you 7d2 into mana debt and takes a card from your deck into the Ether. Anything else: the mana is gone.",
  ok:()=>bankOpen(),run:async()=>{const pl=G.active,P=me(),d=R(10);
   if(d===10){const w=rollN(7,2),n=Math.min(sum(w),Math.max(0,G.bank.mana-BANK_FLOOR)),got=giveMana(pl,n);G.bank.mana-=got;tray(pl,"Gambling",[{s:10,v:d},...w],`+${got}`);log(`<b>Gambling</b>: ${plName(pl)} rolls a natural 10 and wins ${n} mana (${got} fit).`,"event")}
   else if(d===1){const w=rollN(7,2),n=Math.max(0,Math.min(sum(w),effMana(pl)-floorOf(pl)));P.maxAdd=(P.maxAdd||0)-1;const c=P.deck.pop();if(c){c.owner=null;G.ether.push(c)}else deckShort(pl,1,"Gambling");tray(pl,"Gambling",[{s:10,v:d},...w],`−${n}`);
     log(`<b>Gambling</b>: ${plName(pl)} rolls a 1. One maximum mana is lost, ${n} mana of debt (7d2) is owed${c?", and a card leaves the deck for the Ether":""}.`,"event");addDebt(pl,n)}
   else{tray(pl,"Gambling",[{s:10,v:d}],"nothing");log(`Gambling: ${plName(pl)} rolls ${d}. Nothing.`)}}},
 {id:"maxmana",name:"Increase Max Mana",cost:4,school:"Conjuring",text:"Your maximum mana goes up by one for the rest of the game, eighteen at most.",ok:()=>soulCap(G.active)<18,run:async()=>{const P=me();P.maxAdd=(P.maxAdd||0)+1;log(`${plName(G.active)} buys one more maximum mana (${soulCap(G.active)}).`)}}
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
  const tt=n=>`${n} turn${n===1?"":"s"}`;
  const loans=(P.loans||[]).map(L=>`<li><b>${L.owed}</b> owed · grows in ${tt(Math.max(0,L.at-tnOf(V)))} · due in ${tt(Math.max(0,L.due-tnOf(V)))}</li>`).join("");
  const fl=floorOf(V),gap=e-fl,debt=P.debt||0;
  const notes=[];if(B.dead)notes.push("The Banker is dead: the Bank and the Ether are closed.");if(B.angry)notes.push("The Banker is angry about the Demons holding the middle: every price +1.");
  if(B.mana<0&&!B.dead)notes.push("The Bank is in the red: everything in the Ether costs 1 less.");const up=Object.keys(B.upsell);if(up.length)notes.push(`Upsold this round: ${up.map(id=>SP(id)?SP(id).name:id).join(", ")}.`);
  if(G.inflation&&G.turnNo<=G.inflation.until)notes.push(`After the collapse, prices wobble up for ${G.inflation.until-G.turnNo+1} more turn${G.inflation.until-G.turnNo+1===1?"":"s"}.`);
  const cap=soulCap(V),pay=Math.min(mana(V),owed),why=loanWhy(V);
  const tip=t=>`data-tip="${esc(t)}" tabindex="0"`;
  const LOAN_TIP=`A loan is mana now, paid out of the Bank's own mana. How much: up to 12 (6 if you are below zero, 5 at −${cap} or lower), and only while the Bank stays at ${BANK_FLOOR} or above. When it's due: half the amount in your turns, at least 2 (12 mana: 6 turns). It grows by 1d2 every 3 of your turns. Pay it back with Repay; whatever is left when it's due becomes mana debt. One loan at a time, one a round, and the next no sooner than ${LOAN_GAP} turns after the last.`;
  const CREDIT_TIP=`Credit is not a loan: nothing is paid out up front. With it on, you can cast spells you can't afford; what your souls don't cover becomes mana debt at once. You can go down to ${fl}, and below ${fl} you lose the game. Debt grows by 1d2 every 3 of your turns, and every soul you gain pays it first. Stay at ${DEEP_DEBT} or lower for 3 turns and the Debt Collectors come every turn until the debt is paid.`;
  const nums=n=>Array.from({length:n},(_,i)=>`<option>${i+1}</option>`).join("");
  ovShow(`<div class="ovbox bank wide"><h2>The Bank</h2><div class="bankhead"><img class="bankpic" src="banker.png" width="88" height="88" alt="The Banker in his top hat behind a dungeon window, with gold behind him">
<div class="bankinfo"><p class="bwho"><b>The Banker</b> holds <b>${B.mana}</b> mana.${B.owes.length?` He owes ${B.owes.map(o=>`${plName(o.to)} ${o.owed}`).join(", ")}.`:""} <span class="dim">Spell mana goes to him. He can go ${-BANK_FLOOR} into the red, no further.</span></p>
<dl class="bstat"><div ${tip(`Your mana now, out of your maximum of ${cap}. Below zero is mana debt.`)}><dt>Your mana</dt><dd class="${e<0?"neg":""}"><b>${e}</b>/${cap}</dd></div>
<div ${tip(`If your mana falls below ${fl}, you lose the game. You are ${gap} above it.`)}><dt>Lowest point</dt><dd class="${gap<=cap?"neg":""}"><b>${fl}</b> <small>${gap} above</small></dd></div>
<div ${tip(debt?`You are ${debt} in debt. Every soul you gain pays it first. It grows by 1d2 every 3 of your turns.${P.guilty?" You are in default: Debt Collectors come every turn until it is paid.":e<=DEEP_DEBT?` At ${DEEP_DEBT} or lower for 3 turns, the Debt Collectors come.`:""}`:"You have no mana debt.")}><dt>Mana debt</dt><dd class="${debt?"neg":""}">${debt?`<b>${debt}</b>${P.guilty?' <small>in default</small>':e<=DEEP_DEBT&&P.deepAt!=null?` <small>collectors in ${Math.max(1,3-(tnOf(V)-P.deepAt))}</small>`:""}`:"None"}</dd></div>
<div ${tip(owed?"What you owe the Bank in loans, interest included.":"You have no loans.")}><dt>Loans</dt><dd>${owed?`<b>${owed}</b> <small>owed</small>`:"None"}</dd></div></dl>
${loans?`<ul class="bloans">${loans}</ul>`:""}${notes.length?`<p class="bnote">${notes.join("<br>")}</p>`:""}</div></div>
${live&&!B.dead?`<div class="bacts">
<p class="brow"><span class="bkey" ${tip(LOAN_TIP)}>Loan <i class="q">?</i></span><label class="${lim?"":"off"}"><select id="bLoan" aria-label="Mana to borrow" ${lim?"":"disabled"}>${lim?nums(lim):"<option>—</option>"}</select> mana</label><button class="btn sm" id="bLoanBtn" ${lim?"":"disabled"}>Take the loan</button><small class="dim">${lim?`grows 1d2 every 3 turns · due in half the amount, at least 2`:why||"The Bank won't lend to you now."}</small></p>
<p class="brow"><span class="bkey">Repay</span><label class="${pay?"":"off"}"><select id="bPay" aria-label="Mana to repay" ${pay?"":"disabled"}>${pay?nums(pay):"<option>—</option>"}</select> mana</label><button class="btn sm" id="bPayBtn" ${pay?"":"disabled"}>Pay</button><small class="dim">${owed?`You owe ${owed}.`:"No loans to repay."}</small></p>
<p class="brow"><span class="bkey" ${tip(CREDIT_TIP)}>Credit <i class="q">?</i></span><label><input type="checkbox" id="bCredit" ${P.credit?"checked":""}> Spend on credit</label><small class="dim">Spells you can't afford become mana debt, down to ${fl}; below it you lose.</small></p>
<p class="brow bsellrow"><button class="btn bsell" id="bSell">Sell cards to the Bank</button>${P.tribe==="binah"&&(P.thralls||[]).length?`<button class="btn sm" id="bThrall">Sell a thrall (1 mana)</button>`:""}<small class="dim">From your hand or deck, for their soul worth or 1 less.</small></p></div>`:`<p class="dim">${B.dead?"":"Bank business is done in your own prep phase."}</p>`}
<details class="bankhelp"><summary>How the Bank works</summary><dl>${BANK_HELP.map(([a,b])=>`<dt>${a}</dt><dd>${b}</dd>`).join("")}</dl></details>
<p><button class="btn ghost" id="mcancel">Close</button></p></div>`);
  $("#mcancel").onclick=ovHide;
  if($("#bLoanBtn"))$("#bLoanBtn").onclick=()=>{takeLoan(V,+$("#bLoan").value);render();openBank()};
  if($("#bPayBtn"))$("#bPayBtn").onclick=()=>{repay(V,+$("#bPay").value);render();openBank()};
  if($("#bCredit"))$("#bCredit").onchange=e=>{setCredit(V,e.target.checked);render()};
  if($("#bThrall"))$("#bThrall").onclick=()=>{sellThrall(V);render();openBank()};
  if($("#bSell"))$("#bSell").onclick=()=>openSell(V);
}
function openSell(V){const P=G.p[V],pick=new Set();let tab="all";
  const draw=()=>{const list=[...P.hand.map(c=>[c,"hand"]),...P.deck.map(c=>[c,"deck"])],where=new Map(list);
    const chosen=list.filter(([c])=>pick.has(c.id)),lo=chosen.reduce((a,[c])=>a+sellRange(c)[0],0),hi=chosen.reduce((a,[c])=>a+sellRange(c)[1],0);
    ovShow(`<div class="ovbox wide"><h2>Sell to the Bank</h2><p class="dim">A card sells for its soul worth, or 1 less (rolled at the sale), and goes to the Ether; the deck is reshuffled. Standard cards worth only 1 can't be sold. The Bank holds ${G.bank.mana} mana.</p>
${(()=>{const groups=pileGroups(list.map(x=>x[0]));const one=([c,w])=>{const ok=sellable(c),[a,b]=sellRange(c);return `<label class="sellc ${pick.has(c.id)?"on":""} ${ok?"":"off"}" ${ok?"":'data-tip="A standard card worth only 1 can\'t be sold to the Bank."'}><input type="checkbox" data-sl="${c.id}" ${pick.has(c.id)?"checked":""} ${ok?"":"disabled"}>${face(c,{cls:"sm",noci:true})}<small>${w} · ${ok?(a===b?a:a+"–"+b):"—"}</small></label>`};
  return pickTabsHTML(groups,list.length).replace(/class="pktab on" data-pt="all"/,`class="pktab${tab==="all"?" on":""}" data-pt="all"`).replace(/class="pktab" data-pt="([^"]+)"/g,(m,k)=>`class="pktab${tab===k?" on":""}" data-pt="${k}"`)+groups.map(([k,l])=>`<div class="pkgrp" data-pg="${k}" ${tab!=="all"&&tab!==k?"hidden":""}><h3>${k} <span class="dim">${l.length}</span></h3><div class="pickrow sell">${l.map(c=>one([c,where.get(c)])).join("")}</div></div>`).join("")})()}
<p><button class="btn" id="sellGo" ${pick.size?"":"disabled"}>Sell ${pick.size} for ${lo===hi?lo:lo+"–"+hi} mana</button> <button class="btn ghost" id="mcancel">Back</button></p></div>`);
    $("#ov").querySelectorAll("[data-sl]").forEach(i=>i.onchange=()=>{const id=+i.dataset.sl;i.checked?pick.add(id):pick.delete(id);draw()});
    wirePickTabs($("#ov"),t=>{tab=t});
    $("#mcancel").onclick=openBank;
    $("#sellGo").onclick=()=>{const cs=[...P.hand,...P.deck].filter(c=>pick.has(c.id));sellCards(V,cs);render();openBank()}};
  draw()}
function econTags(P){const t=[];if(!G.bank||isHorde(P.i))return t;
  if(P.debt>0)t.push(`<span class="debttag">Debt −${P.debt}</span>`);
  const o=owedOf(P.i);if(o)t.push(`<span class="loantag">Loans ${o}</span>`);
  if(P.credit)t.push(`<span class="loantag">Credit</span>`);
  if(P.saleUntil!=null&&tnOf(P.i)<=P.saleUntil)t.push(`<span class="saletag">Ether sale</span>`);
  if(oathOf(P.i))t.push(`<span class="oathtag">${SP("oath_"+P.oath).name}</span>`);
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

/* ---------- the Demons ---------- */
function barbTick(){
  const B=npcIx("barb");if(B<0||G.opts.barbarians===false||G.phase==="setup")return;
  // v70c: the wait is counted in rounds (it was counted in turns, so four players met the Demons four times as often);
  // a new band waits while the last one still stands
  const rd=G.moon.round;if(G.barbNextR==null){G.barbNextR=rd+4+R(12);return}
  if(rd>=G.barbNextR){if(stacksOf(B).length)G.barbNextR=rd+1+R(3);else{G.barbNextR=rd+4+R(12);spawnBarbarians()}}
  // the middle held for 7d2 turns angers the Banker (v71: turns again, as the rule was written)
  const held=stacksOf(B).some(x=>centerArea().some(([r,c])=>r===x.r&&c===x.c));
  if(held){if(G.barbHeld==null){G.barbHeld=G.turnNo;G.barbNeed=sum(rollN(7,2))}
    else if(G.bank&&!G.bank.angry&&!G.bank.dead&&G.turnNo-G.barbHeld>=G.barbNeed){G.bank.angry=true;
      log(`<b>The Banker is angry.</b> The Demons have held the middle for ${G.barbNeed} turns: every price goes up by 1 until they are gone.`,"event");
      popup("The Banker's justification",`<p>"Trade can't cross the middle of the field while those savages sit on it. Every caravan pays for guards, every guard wants his wage, and somebody has to pay the wage."</p><p>The Demons have held the middle for ${G.barbNeed} turns (7d2). Every spell costs 1 more until no Demon is left in the middle.</p>`)}}
  else{G.barbHeld=null;if(G.bank&&G.bank.angry){G.bank.angry=false;log("The middle is clear of Demons: the Banker calms down and prices go back.","event")}}
}
function centerArea(){const c0=centerTiles(),out=[];for(const [r,c] of c0)for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const rr=r+dr,cc=c+dc;if(rr>=0&&cc>=0&&rr<G.rows&&cc<COLS&&!out.some(t=>t[0]===rr&&t[1]===cc))out.push([rr,cc])}return out}
function spawnBarbarians(blood){
  const B=npcIx("barb");if(B<0)return;
  const have=stacksOf(B),room=6-have.length,haveA=have.filter(x=>x.st.cards.some(c=>kind(c)==="ace")).length;   // v68: never more than six Demon stacks on the field, counting what is already there
  if(room<=0){log("The Demons already crowd the field: no new band comes.");return}
  const n=alive().filter(i=>!isHorde(i)).length,zones=new Set(G.p.flatMap((P,i)=>isNPC(i)?[]:seat(i).zone.map(t=>t.join())));
  const mid=[(G.rows-1)/2,(COLS-1)/2];const tiles=[];
  for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++)if(!isVoid(r,c)&&!G.board[r][c]&&!zones.has(r+","+c))tiles.push([r,c]);
  tiles.sort((a,b)=>Math.hypot(a[0]-mid[0],a[1]-mid[1])-Math.hypot(b[0]-mid[0],b[1]-mid[1]));
  if(!tiles.length){log("The Demons find no room in the middle.");return}
  const dice=[],roll=(k,s)=>{let t=0;for(let i=0;i<k;i++){const v=R(s);dice.push({s,v});t+=v}return t},SU=["S","H","D","C"];
  const grunts=()=>Array.from({length:roll(1,3)+1},()=>mk(String(1+R(5)),pick(SU)));
  const inf=()=>Array.from({length:roll(1,3)},()=>mk(String(6+R(4)),pick(SU)));
  const jacks=()=>Array.from({length:roll(1,2)},()=>mk("J",pick(SU)));
  const any=()=>pick([grunts,inf,jacks])();
  const stacks=[grunts()];if(n>=3)stacks.push(any());
  if(roll(1,2)===1)stacks.push(grunts());
  else{stacks.push(pick([inf,jacks])());if(roll(1,4)===4)stacks.push(any());if(n>=3&&roll(1,4)===4)stacks.push(any())}
  stacks.length=Math.min(stacks.length,n<=2?3:n===3?4:5,room);
  let aces=n>=4?2:0;if(roll(1,6)===6)aces++;if(n===3&&aces===1&&roll(1,6)===6)aces++;aces=Math.min(aces,n<=2?1:n===3?2:3);
  aces=Math.max(0,Math.min(aces,(n<=3?1:2)-haveA,room-stacks.length));   // v68: one or two Demon Aces on the field at most, all bands together
  const W={id:(G.waveNo=(G.waveNo||0)+1),stacks:0,aces:0,aceKilled:false,kills:{},left:0,troops:0};(G.waves=G.waves||{})[W.id]=W;
  const put=cards=>{const t=tiles.shift();if(!t)return false;for(const c of cards){c.owner=B;c.wave=W.id;c.barb=true}G.board[t[0]][t[1]]={owner:B,cards,moved:true,attacked:true};W.left+=cards.length;W.troops+=cards.filter(c=>kind(c)!=="ace").length;return true};
  for(const s of stacks)if(put(s))W.stacks++;
  for(let i=0;i<aces;i++)if(put([mk("A",pick(SU))]))W.aces++;
  tray(B,"Demons",dice,`${W.stacks} band${W.stacks>1?"s":""}${W.aces?` + ${W.aces} Ace${W.aces>1?"s":""}`:""}`,true);
  log(`<b>Demons</b>${blood?" come with the Blood Moon and":""} take the middle of the field: ${W.stacks} band${W.stacks>1?"s":""}${W.aces?` and ${W.aces} Ace base${W.aces>1?"s":""}`:""}. They fight everyone.`,"event");
  notify(null,`Demons take the middle of the field.`);
  popup("Demons",`<p>${blood?"With the Blood Moon, a":"A"} crimson band of Demons takes the middle of the field: ${W.stacks} band${W.stacks>1?"s":""}${W.aces?` and ${W.aces} Ace base${W.aces>1?"s":""}`:""}. They fight everyone.</p><p class="dim">Whoever kills the most of the band earns an Ether sale. When its soldiers are gone, its Aces crumble.</p>`);
}
/* the Demons strike at whatever stands beside them; they hold their ground */
async function barbAct(){
  const B=npcIx("barb");if(B<0)return;
  for(const {st,r,c} of stacksOf(B)){if(G.over||G.board[r][c]!==st)continue;st.attacked=false;st.moved=false;
    let best=null;for(const o of attackOptions(r,c)){if(o.mode==="capture"||o.mode==="destroy")continue;const E=G.board[o.r][o.c];if(!E||isNPC(E.owner))continue;const p=AI.winP(st,E,24,o.mode),s=p*AI.value(E);if(p>=.45&&(!best||s>best.s))best={o,s}}
    if(best){attack(r,c,best.o.r,best.o.c,best.o.mode);render();await sleep(380)}
  }
}
/* who killed the Demons: the band's best killer gets a sale; a big band also clears their debt */
function econBury(card,r,c,st){
  const F=G.fight,killer=F?(st===F.D?F.atkPl:st===F.A?F.defPl:null):null;
  warKill(killer);
  if(card.wave&&G.waves&&G.waves[card.wave]){const W=G.waves[card.wave];W.left--;if(killer!=null&&!isNPC(killer))W.kills[killer]=(W.kills[killer]||0)+1;if(kind(card)==="ace")W.aceKilled=true;else if(W.troops!=null)W.troops--;
    delete card.wave;delete card.barb;
    if(W.troops!=null&&W.troops<=0&&W.left>0){   // v68: with no soldiers left, the band's Aces crumble and the band is broken
      const B=npcIx("barb");let k=0;for(const x of stacksOf(B))if(x.st.cards.every(y=>y.wave===W.id&&kind(y)==="ace")){for(const y of x.st.cards){W.left--;delete y.wave;delete y.barb}G.board[x.r][x.c]=null;k++}
      if(k)log(`The Demons' band is broken: ${k===1?"its Ace crumbles":`its ${k} Aces crumble`} with no one left to hold ${k===1?"it":"them"}.`,"event")}
    if(W.left<=0)waveCleared(W)}
  // the Bank's Debt Collectors send what they kill to the Ether and keep its price
  const bk=npcIx("bank");
  if(F&&bk>=0&&killer===bk&&!(card.unit&&!UNIT[card.unit].ether)){card.owner=null;if(card.hp!=null)card.hp=card.maxHp;G.ether.push(card);const v=costOf(card)||1;bankAdd(v);log(`The Bank takes ${esc(nameOf(card))} into the Ether and books ${v} mana.`);return true}
  return false;
}
function waveCleared(W){
  const ks=Object.entries(W.kills).sort((a,b)=>b[1]-a[1]);delete G.waves[W.id];
  if(!ks.length){log("The last Demons of the band are gone.");return}
  const top=+ks[0][0],P=G.p[top];if(!P||P.out)return;
  P.saleUntil=tnOf(top)+3;
  log(`<b>${plName(top)}</b> killed the most Demons (${ks[0][1]}): the Ether is on sale for them for three turns (every conjuring 1d2 − 1 less, never below 1 mana).`,"event");
  if((W.aceKilled&&W.stacks>=2)||(W.stacks>=3&&!W.aces)){const d=P.debt||0,o=owedOf(top);P.debt=0;P.debtAt=null;P.loans=[];
    log(`<b>The Banker forgives ${plName(top)}'s debts</b>${d||o?` (${d+o} mana)`:""} for breaking the Demons.`,"event");
    popup("Debts forgiven",`<p>${plName(top)} broke a band of Demons${W.aceKilled?" and its Ace":""}. The Banker tears up their debts${d||o?`: ${d+o} mana`:""}.</p>`,top)}
  notify(top,`${esc(P.name)} gets an Ether sale for three turns.`);
}

/* ---------- the Bank's own Debt Collectors ----------
   v46: a player who stays 6 or more below zero for three of their turns is in default. From then on, at the start of each of
   their turns the Bank sends 1d2 Debt Collectors (six at most on the field), aimed at whoever in default owes the most; with two
   in default that is two rolls a round. They stay until the debt is paid off (back to zero), and every card they kill pays it. */
const COLL_MAX=6;
const debtTargets=()=>alive().filter(i=>!isHorde(i)&&G.p[i].guilty).sort((a,b)=>effMana(a)-effMana(b));
function debtWatch(pl){const P=G.p[pl];if(!P||isHorde(pl)||isNPC(pl)||!G.bank)return;const n=tnOf(pl);
  if(P.guilty){if(!P.debt&&effMana(pl)>=0&&!loanLate(pl)){P.guilty=false;P.deepAt=null;P.guiltyAt=null;log(`${plName(pl)} has paid off the debt: the Debt Collectors stop coming.`,"event")}return}
  const late=loanLate(pl);
  if(effMana(pl)<=DEEP_DEBT||late){if(P.deepAt==null)P.deepAt=n;if(late||n-P.deepAt>=2){P.guilty=true;P.guiltyAt=n;rpOf(pl).bad=true;
    log(`<b>${plName(pl)} ${late?"has left a loan unpaid too long":"has been below zero for three turns"}.</b> The Bank sends Debt Collectors every turn until it is paid.`,"event");notify(null,`The Bank's Debt Collectors come for ${esc(P.name)}.`)}}
  else P.deepAt=null}
/* v49: a Bank loan left open for 3 + (owed ÷ 3) of your turns brings the Debt Collectors too */
const loanLate=pl=>(G.p[pl].loans||[]).some(L=>L.t0!=null&&tnOf(pl)-L.t0>=3+Math.floor(L.owed/3));
function sendCollectors(k){const B=npcIx("bank"),tgt=debtTargets()[0];if(B<0||tgt==null||!G.bank||G.bank.dead)return 0;const ts=stacksOf(tgt);if(!ts.length)return 0;
  k=Math.min(k,COLL_MAX-stacksOf(B).filter(x=>x.st.hunt==null).length);let put=0;
  const free=[];for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++)if(!G.board[r][c]&&!isVoid(r,c))free.push([r,c,Math.min(...ts.map(x=>Math.abs(x.r-r)+Math.abs(x.c-c)))]);
  free.sort((a,b)=>a[2]-b[2]);for(const [r,c,d] of free){if(put>=k)break;if(d<2)continue;G.board[r][c]={owner:B,cards:[mkUnit("debt",B)],moved:true,attacked:true};put++}
  if(put)log(`<b>The Bank</b> sends ${put} Debt Collector${put>1?"s":""} after ${plName(tgt)} (${effMana(tgt)} mana).`,"event");return put}
async function bankCollectors(){
  const B=npcIx("bank");if(B<0||!G.bank)return;
  const T=G.bank.dead?[]:debtTargets();
  // the Bank's own collectors go home when nobody is in default; Saturn's hunters and a player's loan collectors (st.hunt) keep on
  const own=stacksOf(B).filter(x=>x.st.hunt==null);
  if(!T.length&&own.length){for(const x of own)G.board[x.r][x.c]=null;log("Nobody owes the Bank in default any more: it calls its Debt Collectors home.")}
  const tgt=T[0];
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
  if(mana(pl)>=MYS_MAX+3&&P.deck.length<P.start*.6&&Math.random()<.3)await mysteryGen(pl);
}

/* ---------- symbols ---------- */
Object.assign(UNIT_ICON,{
 goldbar:`<path d="M-10,6L-6,-3H6L10,6Z M-6,-3L-4,-7H4L6,-3 M-3,1H3"/>`,
 banker:`<path d="M-6,-4V-11H6V-4 M-10,-4H10 M-6,-6H6 M-6,-3C-6,4 6,4 6,-3 M-3,0h0.1 M3,0h0.1 M-2,2.5C-1,3.5 1,3.5 2,2.5 M-8,11C-7,6 7,6 8,11"/>`,
 mystery:`<path d="M-4,-5C-4,-10 5,-10 5,-5C5,-2 0,-1 0,3 M0,7v0.1 M-10,-10L-7,-7 M10,-10L7,-7 M-10,10L-7,7 M10,10L7,7"/>`
});
/* v46: the Debt Collectors also strike at the start of each turn of a player in default */
{const _ta=turnAsync;turnAsync=async function(pl){await _ta.apply(this,arguments);if(G&&!G.over&&G.p[pl]&&G.p[pl].guilty&&npcIx("bank")>=0)await bankCollectors()}}
