/* ---------------- Prompt 12, part 3b (v31): hand sacrifices at Ether prices, the grave shuffled for Resurrection, Debt Collectors
   that pay debts, the Bank's bargains at the Auction, loans between players, notices, the Bank's top hat ----------------
   A card sacrificed from the hand is worth its Ether price − 1d2 + 1 (so the price or one less), rolled when it is sacrificed.
   Resurrection shuffles the grave first.
   Whatever a Bank Debt Collector kills goes to the Ether, and its soul worth pays the victim's debt (to the Bank, or to the player
   whose loan it is collecting). On a 4 of 1d4 a good card (not a 2 to 10, never a Substance card) turns up at the Auction instead,
   for less than the Ether asks.
   Players can ask each other for loans in the Bank window. A loan is due in four of the borrower's turns; what isn't paid then is
   taken from their souls, and if that isn't enough the Bank sends Debt Collectors after them for the lender.
   The Bank bar and the Auction glow with a small "!" when something waits for you. The Bank's cards wear a top hat. */

/* ---------- the top hat ---------- */
{const _sp=solidPath;solidPath=function(s){if(s==="tophat")return "M-9.5,5.6Q0,8.8 9.5,5.6Q0,3.4 -9.5,5.6Z M-5.6,4.7L-5,-7.6Q0,-9.4 5,-7.6L5.6,4.7 M-5.4,1.3Q0,2.6 5.4,1.3";return _sp(s)}}
{const _an=addNPCs;addNPCs=function(){_an.apply(this,arguments);const b=npcIx("bank");if(b>=0)G.p[b].solid="tophat"}}

/* ---------- sacrificing from the hand ---------- */
const etherPrice=c=>{const v=costOf(c);return typeof v==="number"&&!isNaN(v)?v:soulOf(c)};
const handSacRange=c=>{const p=etherPrice(c);return p<=1?[p,p]:[p-1,p]};   // v32: a card worth 1 is always worth 1
const handSacLabel=c=>{const [a,b]=handSacRange(c);return a===b?`+${b}`:`+${a}–${b}`};
{const _sac=sacrifice;sacrifice=function(card,from){if(from!=="hand")return _sac(card,from);
  const pl=G.active,P=me(),[,hi]=handSacRange(card);
  if(mana(pl)+hi>surCap(pl)){flash(`The soul pile holds ${surCap(pl)} mana at most, counting the surplus.`);return false}
  const p=etherPrice(card),d=p<=1?0:R(2),v=p<=1?p:p-d+1,s=soulOf(card);
  P.hand.splice(P.hand.indexOf(card),1);
  if(v>=s){addSoul(pl,card);if(v>s)giveMana(pl,v-s)}else{card.owner=pl;toGrave(card,"spent");if(v)giveMana(pl,v)}
  if(d)tray(pl,"Sacrifice",[{s:2,v:d}],`+${v}`,true);
  log(d?`${plName(pl)} sacrifices ${esc(nameOf(card))} from the hand: ${p} − 1d2 (${d}) + 1 = <b>+${v}</b> mana.`:`${plName(pl)} sacrifices ${esc(nameOf(card))} from the hand (+${v} mana).`);
  P.lastSac={v,t:Date.now()};rainSac(pl);return true}}

/* ---------- Resurrection: the grave is shuffled first ---------- */
{const s=SP("resur");if(s){const run=s.run;s.run=async()=>{shuffle(G.grave);log("The grave is shuffled before the Resurrection.");render();return run()}}
  if(SPELL_TEXT.resur)SPELL_TEXT.resur.e="The grave is shuffled, then you choose one card from it and bring it back into your hand."}

/* ---------- the Bank's Debt Collectors pay debts with what they kill ---------- */
const goodCard=c=>!/^\d+$/.test(c.rank||"")&&!(c.unit&&!UNIT[c.unit].ether)&&!c.puppet;
{const _eb=econBury;econBury=function(card,r,c,st){
  const F=G.fight,bk=npcIx("bank"),killer=F?(st===F.D?F.atkPl:st===F.A?F.defPl:null):null;
  if(!F||bk<0||killer!==bk||card.wave||card.unit&&!UNIT[card.unit].ether)return _eb(card,r,c,st);
  const victim=st.owner,V=G.p[victim],BS=st===F.D?F.A:F.D,v=soulOf(card);let paid="";
  const L=BS&&BS.loan!=null?(G.p2p||[]).find(x=>x.id===BS.loan&&x.state==="late"):null;
  if(L){const got=giveMana(L.to,Math.min(v,L.owed));L.owed=Math.max(0,L.owed-v);paid=`, and its worth (${v}) goes to ${plName(L.to)} for the loan${L.owed?` (${L.owed} still owed)`:" (paid off)"}`;if(!L.owed)loanSettled(L)}
  else if(V&&V.debt>0){const k=Math.min(V.debt,v);V.debt-=k;if(!V.debt)V.debtAt=null;bankAdd(v);paid=`, and its worth pays ${k} of ${plName(victim)}'s debt${V.debt?` (−${V.debt} left)`:" (debt cleared)"}`}
  else{bankAdd(v);paid=`; the Bank books its worth (${v})`}
  card.owner=null;if(card.hp!=null)card.hp=card.maxHp;
  if(goodCard(card)&&R(4)===4){const price=Math.max(1,etherPrice(card)-R(2));(G.auction=G.auction||[]).push({card,seller:bk,bank:true,price,from:victim,id:(G.auctN=(G.auctN||0)+1)});
    log(`The Bank's Debt Collector takes ${esc(nameOf(card))}${paid}. The Bank puts it up at the Auction for ${price} mana.`,"event");notify(bk,`A bargain at the Auction: ${esc(nameOf(card))} for ${price} mana.`)}
  else{G.ether.push(card);log(`The Bank's Debt Collector takes ${esc(nameOf(card))} into the Ether${paid}.`)}
  return true}}

/* ---------- the Auction: the Bank's bargains are bought outright ---------- */
async function buyBankItem(pl,it){const P=G.p[pl];if(!G.auction.includes(it))return false;
  if(!canAfford(pl,it.price)){if(!P.cpu)flash("Not enough mana.");return false}
  spend(pl,it.price);G.auction.splice(G.auction.indexOf(it),1);const c=it.card;c.owner=pl;if(c.hp!=null)c.hp=c.maxHp;
  if(P.hand.length<handCap(pl))P.hand.push(c);else{P.deck.push(c);shuffle(P.deck)}
  log(`<b>The Auction</b>: ${plName(pl)} buys ${esc(nameOf(c))} from the Bank for ${it.price} mana (the Ether asks ${etherPrice(c)}).`,"event");render();return true}
{const _mo=makeOffer;makeOffer=async function(it,auto){if(it&&it.bank)return buyBankItem(G.active,it);return _mo(it,auto)}}
{const _va=viewAuction;viewAuction=function(){_va();const V=view(),P=G.p[V],live=canAct()&&G.phase==="prep";P.auctSeen=G.auctV||0;render();
  (G.auction||[]).forEach((it,i)=>{if(!it.bank)return;const box=$("#ov").querySelectorAll(".auct .aitem")[i];if(!box)return;const info=box.querySelector("div");
    info.innerHTML=`<b>${esc(nameOf(it.card))}</b><br><span class="dim">sold by the Bank · <b>${it.price}</b> mana (the Ether asks ${etherPrice(it.card)})</span>${live?`<br><button class="btn sm" data-bbuy="${i}" ${canAfford(V,it.price)?"":"disabled"}>Buy for ${it.price} mana</button>`:""}`});
  const note=$("#ov .ovbox p.dim");if(note&&(G.auction||[]).some(it=>it.bank))note.textContent="Tiphareth of Kether sells the souls its Traffickers chained: offer mana or cards from your hand, and the seller has to approve. The Bank sells what its Debt Collectors took, for less than the Ether: buy it outright.";
  $("#ov").querySelectorAll("[data-bbuy]").forEach(b=>b.onclick=async()=>{if(!canAct())return;await buyBankItem(G.active,G.auction[+b.dataset.bbuy]);viewAuction()})}}

/* ---------- loans between players ---------- */
const P2P_DUE=4,P2P_RATE=.2;
const p2pOf=()=>G.p2p||(G.p2p=[]);
const lenders=pl=>alive().filter(i=>i!==pl&&!isHorde(i)&&!G.p[i].jail);
const loanReqsFor=V=>p2pOf().filter(L=>L.to===V&&L.state==="ask");
function askLoan(from,to,n){
  if(p2pOf().some(L=>L.from===from&&L.to===to&&["ask","open","late"].includes(L.state))){if(!G.p[from].cpu)flash(`You already have a loan or a request with ${G.p[to].name}.`);return null}
  const L={id:(G.p2pN=(G.p2pN||0)+1),from,to,n,owed:n,state:"ask",round:G.moon.round};p2pOf().push(L);
  log(`${plName(from)} asks ${plName(to)} for a loan of ${n} mana.`,"event");
  if(G.p[to].cpu)answerLoan(L,aiLend(L));
  else notify(to,`${esc(G.p[from].name)} asks ${esc(G.p[to].name)} for a loan of ${n} mana (the Bank window).`);
  return L}
function aiLend(L){const m=mana(L.to);if(m<L.n+3)return false;if(!isEnemy(L.from,L.to))return true;return m>=L.n+6&&Math.random()<.4}
function answerLoan(L,yes){
  if(L.state!=="ask")return;
  if(!yes){L.state="no";log(`${plName(L.to)} refuses to lend ${plName(L.from)} ${L.n} mana.`);notify(L.from,`${esc(G.p[L.to].name)} refuses the loan.`);return}
  if(mana(L.to)<L.n){if(!G.p[L.to].cpu)flash(`You hold only ${mana(L.to)} mana.`);return}
  const paid=payQuiet(L.to,L.n),got=giveMana(L.from,paid);L.state="open";L.owed=paid;L.due=tnOf(L.from)+P2P_DUE;L.intAt=tnOf(L.from)+R(2);
  log(`<b>${plName(L.to)} lends ${plName(L.from)} ${paid} mana</b>${got<paid?` (${got} fit in the soul pile)`:""}. 20% interest every 1d2 of ${plName(L.from)}'s turns, due in ${P2P_DUE}; if it isn't paid, the Bank collects.`,"event");
  notify(L.from,`${esc(G.p[L.to].name)} lends ${esc(G.p[L.from].name)} ${paid} mana.`)}
function repayLoan(L,k){k=Math.min(k,L.owed,mana(L.from));if(k<=0)return 0;const paid=payQuiet(L.from,k),got=giveMana(L.to,paid);L.owed-=paid;
  log(`${plName(L.from)} pays ${plName(L.to)} back ${paid} mana${L.owed?` (${L.owed} still owed)`:"; the loan is settled"}.`);if(!L.owed)loanSettled(L);return paid}
function loanSettled(L){L.state="done";L.owed=0;const bk=npcIx("bank");if(bk>=0)for(const x of stacksOf(bk))if(x.st.loan===L.id)G.board[x.r][x.c]=null;
  log(`The loan from ${plName(L.to)} to ${plName(L.from)} is settled.`)}
function sendLoanCollectors(L){const bk=npcIx("bank");if(bk<0)return 0;let n=0;const k=R(2);
  for(const t of freeTilesNear(L.from,true).slice(0,k)){G.board[t[0]][t[1]]={owner:bk,cards:[mkUnit("debt",bk)],moved:true,attacked:true,hunt:L.from,loan:L.id};n++}return n}
/* a loan comes due at the start of the borrower's turn */
{const _bt=bankTurn;bankTurn=function(pl){_bt(pl);const tn=tnOf(pl);
  for(const L of p2pOf()){
    if(["ask","open","late"].includes(L.state)&&(G.p[L.from].out||G.p[L.to].out)){L.state="void";continue}
    if(L.from!==pl)continue;
    if(["open","late"].includes(L.state)&&L.owed>0&&L.intAt!=null&&tn>=L.intAt){const add=Math.max(1,Math.ceil(L.owed*P2P_RATE));L.owed+=add;L.intAt=tn+R(2);log(`Interest: ${plName(pl)}'s loan from ${plName(L.to)} grows by ${add} (20%) to ${L.owed}.`)}
    if(L.state==="open"&&tn>=L.due){const take=Math.min(mana(pl),L.owed);if(take)repayLoan(L,take);
      if(L.owed>0){L.state="late";const n=sendLoanCollectors(L);
        log(`<b>${plName(pl)}'s loan from ${plName(L.to)} is due</b> and ${L.owed} mana is still owed. The Bank sends ${n} Debt Collector${n===1?"":"s"} after ${plName(pl)}; what they take goes to ${plName(L.to)}.`,"event");
        popup("A loan is not paid",`<p>${plName(pl)} owed ${plName(L.to)} ${L.owed+take} mana and could pay ${take}.</p><p>The Bank sends Debt Collectors after ${plName(pl)} for the other ${L.owed}. Whatever they kill goes to the Ether, and its worth goes to ${plName(L.to)} until the loan is paid.</p>`,L.to)}}
    else if(L.state==="late"){const bk=npcIx("bank");if(bk>=0&&!stacksOf(bk).some(x=>x.st.loan===L.id))sendLoanCollectors(L)}
  }}}
/* the computer borrows when it is poor, and answers a person's request at once (see askLoan) */
{const _ab=aiBank;aiBank=async function(pl,W,cast1){await _ab(pl,W,cast1);const P=G.p[pl];if(P.jail||G.over)return;
  for(const L of p2pOf())if(L.from===pl&&L.state==="open"&&mana(pl)>=L.owed+3)repayLoan(L,L.owed);
  for(const L of loanReqsFor(pl))answerLoan(L,aiLend(L));
  if(mana(pl)<=1&&Math.random()<.08){const t=lenders(pl).filter(i=>!isEnemy(pl,i)||Math.random()<.3).sort((a,b)=>mana(b)-mana(a))[0];if(t!=null&&mana(t)>=4)askLoan(pl,t,1+R(3))}}}

/* ---------- the Bank window: a tab for loans between players ---------- */
function p2pHTML(V){
  const live=canAct()&&G.phase==="prep"&&G.active===V,P=G.p[V],tt=n=>`${n} turn${n===1?"":"s"}`,L=p2pOf();
  const reqs=loanReqsFor(V).map(x=>`<li><b>${plName(x.from)}</b> asks you for <b>${x.n}</b> mana, due in ${P2P_DUE} of their turns. <button class="btn sm" data-lend="${x.id}" ${mana(V)>=x.n&&!G.busy?"":"disabled"}>Lend ${x.n}</button> <button class="btn ghost sm" data-nolend="${x.id}">Refuse</button></li>`).join("");
  const mine=L.filter(x=>x.from===V&&["ask","open","late","no"].includes(x.state)&&(x.state!=="no"||x.round>=G.moon.round-1)).map(x=>`<li>${x.state==="ask"?`You asked ${plName(x.to)} for ${x.n}: waiting.`:x.state==="no"?`${plName(x.to)} refused your request.`:`You owe ${plName(x.to)} <b>${x.owed}</b>${x.state==="late"?` <span class="neg">late: the Bank's Debt Collectors are after you</span>`:` · due in ${tt(Math.max(0,x.due-tnOf(V)))} · 20% every 1d2 turns`}${live&&mana(V)?` <button class="btn sm" data-repay="${x.id}">Pay back ${Math.min(mana(V),x.owed)}</button>`:""}`}</li>`).join("");
  const lent=L.filter(x=>x.to===V&&["open","late"].includes(x.state)).map(x=>`<li>${plName(x.from)} owes you <b>${x.owed}</b>${x.state==="late"?" (late: the Bank is collecting for you)":` · due in ${tt(Math.max(0,x.due-tnOf(x.from)))}`}</li>`).join("");
  const who=lenders(V);
  const form=live&&!P.jail&&who.length?`<p class="p2pask"><label>Ask <select id="p2pTo">${who.map(i=>`<option value="${i}">${esc(G.p[i].name)}</option>`).join("")}</select></label> <label>for <select id="p2pN">${[1,2,3,4,5,6,7,8].map(n=>`<option>${n}</option>`).join("")}</select> mana</label> <button class="btn sm" id="p2pGo">Ask for a loan</button></p><p class="dim">20% interest every 1d2 of your turns, until it is paid. Due in ${P2P_DUE} of your turns. What you can't pay then is taken from your souls, and the Bank sends Debt Collectors after you for the rest; what they kill goes to the lender.</p>`:`<p class="dim">${P.jail?"In Jail: no loans.":"You can ask for a loan in your own prep phase."}</p>`;
  return `${reqs?`<h3>Asked of you</h3><ul class="p2pl">${reqs}</ul>`:""}${mine?`<h3>Your loans</h3><ul class="p2pl">${mine}</ul>`:""}${lent?`<h3>What others owe you</h3><ul class="p2pl">${lent}</ul>`:""}<h3>Ask another player</h3>${form}`}
let bankTab="bank";
{const _ob=openBank;openBank=function(){_ob();const box=$("#ov .ovbox.bank");if(!box||!G)return;const V=view();
  const h2=box.querySelector("h2"),close=box.querySelector("#mcancel").closest("p");
  const main=document.createElement("div");main.className="btab";main.dataset.t="bank";
  while(h2.nextSibling&&h2.nextSibling!==close)main.appendChild(h2.nextSibling);
  const other=document.createElement("div");other.className="btab p2p";other.dataset.t="p2p";other.innerHTML=p2pHTML(V);
  const n=loanReqsFor(V).length;
  const tabs=document.createElement("div");tabs.className="btabs";tabs.setAttribute("role","tablist");
  tabs.innerHTML=`<button type="button" class="stab" data-bt="bank">The Bank</button><button type="button" class="stab" data-bt="p2p">Between players${n?` <i class="bang">!</i>`:""}</button><button type="button" class="stab" data-bt="land">Land</button>`;
  const land=document.createElement("div");land.className="btab land";land.dataset.t="land";land.innerHTML=landHTML(V);
  h2.after(tabs);tabs.after(main);main.after(other);other.after(land);
  const show=t=>{bankTab=t;tabs.querySelectorAll("[data-bt]").forEach(b=>{const on=b.dataset.bt===t;b.classList.toggle("on",on);b.setAttribute("aria-selected",on)});main.hidden=t!=="bank";other.hidden=t!=="p2p";land.hidden=t!=="land"};
  tabs.querySelectorAll("[data-bt]").forEach(b=>b.onclick=()=>show(b.dataset.bt));show(n?"p2p":bankTab);
  const re=()=>{render();openBank()};wireLand(land,V,re);
  other.querySelectorAll("[data-lend]").forEach(b=>b.onclick=()=>{const L=p2pOf().find(x=>x.id===+b.dataset.lend);if(L)answerLoan(L,true);re()});
  other.querySelectorAll("[data-nolend]").forEach(b=>b.onclick=()=>{const L=p2pOf().find(x=>x.id===+b.dataset.nolend);if(L)answerLoan(L,false);re()});
  other.querySelectorAll("[data-repay]").forEach(b=>b.onclick=()=>{const L=p2pOf().find(x=>x.id===+b.dataset.repay);if(L)repayLoan(L,L.owed);re()});
  if($("#p2pGo"))$("#p2pGo").onclick=()=>{askLoan(V,+$("#p2pTo").value,+$("#p2pN").value);bankTab="p2p";re()}}}

/* ---------- notices: the Bank bar and the Auction ---------- */
{const _bb=bankBarHTML;bankBarHTML=function(){const h=_bb();if(!h||!G)return h;const n=loanReqsFor(view()).length;
  return n?h.replace('class="bankbar"','class="bankbar notify"').replace("</button>",`<i class="bang" aria-label="${n} loan request${n>1?"s":""}">!</i></button>`):h}}
{const _rd=render;render=function(){_rd.apply(this,arguments);if(!G)return;
  const n=(G.auction||[]).length;if(n>(G._auctLen||0))G.auctV=(G.auctV||0)+1;G._auctLen=n;
  const a=$("#seeauct"),V=view(),P=G.p[V];if(!a||!P)return;
  const fresh=n&&(P.auctSeen||0)<(G.auctV||0)&&G.auction.some(it=>it.seller!==V);
  a.classList.toggle("notify",!!fresh);if(fresh&&!a.querySelector(".bang"))a.insertAdjacentHTML("beforeend",`<i class="bang" aria-label="new at the Auction">!</i>`)}}
/* the computer buys the Bank's bargains too */
{const _ap=aiPlanets;aiPlanets=async function(pl,W,cast1){await _ap(pl,W,cast1);if(G.over||G.p[pl].jail)return;
  for(const it of [...(G.auction||[])])if(it.bank&&mana(pl)>=it.price+3&&AI.value({cards:[it.card]})>2.5&&Math.random()<.6){await buyBankItem(pl,it);break}}}

if(window.__EC)Object.assign(window.__EC,{askLoan,answerLoan,repayLoan,buyBankItem,handSacRange,econBury:(...a)=>econBury(...a),sacrifice:(...a)=>sacrifice(...a),bankTurn:pl=>bankTurn(pl),p2pOf,openBank:()=>openBank()});
