/* ---------------- v49: the Bank's Credit and Loan Report, taxes, land in the middle, gifts and forgiveness ----------------
   The Report: every Full Moon (every eighth round when the Moon isn't in the sky, the same day the Bank's land is taxed) each
   player gets a paper for the turns since the last one: what they took from loans and on credit, the interest charged on each,
   the taxes taken, the mana they earned, and their standing. Standing turns bad by going into default (the Debt Collectors), by
   leaving a tax unpaid or by robbing the Bank.
   Taxes, taken only on that day: 1d2 for a base standing in the middle of the field (ground that is nobody's home rows); and for
   every other Ace or Tree a 1 in 3 chance (1 in 2 in bad standing) of 1d2. They can't be paid on credit: with no mana they go
   unpaid, and the standing turns bad.
   Land in the middle: 2 mana at the Bank buys a spawn point on a free tile of the middle ground for 8 of the buyer's turns (v71;
   before, until the next Report), on the buyer's side of the midline, never in King of the Hill (one at a time). Any card but a Wall can come down there; a card that comes down without a base on the tile costs 1d2 − 1. A base there
   stays a spawn point after the land is gone, until it falls.
   Between players: a lender can forgive a loan, and anyone can give mana or a card from the hand to another player.
   Debt Collectors can only be attacked by a player who owes the Bank something. */

/* ---------- the running account for the next Report ---------- */
function rpOf(pl){const P=G.p[pl];if(!P.rp)P.rp={from:G.moon.round,round:G.moon.round,loans:0,credit:0,intL:0,intC:0,earned:0,bad:false};return P.rp}
{const _as=addSoul;addSoul=function(pl,c){const ok=_as.apply(this,arguments);if(ok&&G&&G.p[pl]&&!isNPC(pl))rpOf(pl).earned+=soulOf(c);return ok}}
const midTile=(r,c)=>!isVoid(r,c)&&!G.p.some((P,i)=>!isNPC(i)&&canSpawn(i,r,c));
const owesBank=pl=>debtOf(pl)>0||owedOf(pl)>0||!!G.p[pl].guilty;
const standingGood=pl=>{const P=G.p[pl];return !P.guilty&&!(P.rp&&P.rp.bad)};

/* ---------- Report day ---------- */
function bankReport(){if(!G.bank||G.bank.dead||survival())return;   // v78j: no Banker, no taxes
  for(const pl of alive().filter(i=>!isHorde(i)&&!isNPC(i))){const P=G.p[pl],rp=rpOf(pl);
    if(P.robbed!=null&&P.robbed>=rp.round)rp.bad=true;
    // taxes
    let due=0;const lines=[];
    for(const {st,r,c} of stacksOf(pl)){const b=st.cards.find(isBase);if(!b||kind(b)==="wall"||kind(b)==="lighthouse")continue;   // v70c: Lighthouses pay no tax, like Walls
      if(midTile(r,c)){const t=R(2);due+=t;lines.push(`${KNAME[kind(b)]||"base"} in the middle (${coord(r,c)}): ${t}`)}
      else if((kind(b)==="ace"||kind(b)==="tree")&&R(rp.bad||P.guilty?2:3)===1){const t=R(2);due+=t;lines.push(`${KNAME[kind(b)]||"base"} on ${coord(r,c)}: ${t}`)}}
    let paid=0;if(due){paid=mana(pl)>0?payQuiet(pl,Math.min(due,mana(pl))):0;bankAdd(paid);if(paid<due)rp.bad=true}
    const good=!rp.bad&&!P.guilty;
    const paper={from:rp.from,to:G.moon.round,loans:rp.loans,credit:rp.credit,intL:rp.intL,intC:rp.intC,taxDue:due,taxPaid:paid,taxLines:lines,earned:rp.earned,good,debt:debtOf(pl),owed:owedOf(pl)};
    (P.reports=P.reports||[]).unshift(paper);P.reports=P.reports.slice(0,8);(P.standing=P.standing||[]).unshift(good);P.standing=P.standing.slice(0,8);
    P.rp=null;rpOf(pl);
    log(`<b>The Bank's Report</b> for ${plName(pl)} (turns ${paper.from}–${paper.to}): ${good?"good standing":"bad standing"}${due?`; taxes ${paid} of ${due} paid`:""}.`,"event");
    if(!good)notify(pl,`The Bank's Report: ${esc(P.name)} is in bad standing.`)}
}
{const _cr=cycleRound;cycleRound=async function(){const out=await _cr.apply(this,arguments);if(G.over)return out;if(G.moon.round>1&&payDay())bankReport();render();return out}}

/* ---------- land in the middle ---------- */
const landAt=(r,c)=>(G.lands||[]).find(l=>l.r===r&&l.c===c&&G.p[l.owner]&&!G.p[l.owner].out);
/* v71: land lasts 8 of its owner's turns (this one counts), never lies past the midline from the buyer's side, and King of the Hill has none */
const LAND_TURNS=8;
const landLeft=l=>Math.max(0,l.untilT-tnOf(l.owner));
function landOwnSide(pl,r,c){const S=seat(pl);if(!S||!S.back||!S.back.length)return true;const [br,bc]=S.back[0],[fr,fc]=S.fwd;
  const depth=(r-br)*fr+(c-bc)*fc,full=(fr?(fr>0?G.rows-1-br:br):0)+(fc?(fc>0?COLS-1-bc:bc):0);   // how far forward, out of the whole field
  return depth<=Math.ceil(full/2)}
/* v79h: land is bought only where your side's own cards see (yours and your teammates'): what a spell or the sky uncovers
   (Bird's Eye, the Second Sun burning the fog away) doesn't count. With no fog of war in the game, anywhere. */
function landSeen(pl,r,c){if(G.opts.fog===false)return true;if(totalBlind(pl))return false;const ff=firmFog(pl);if(ff&&ff.blind)return false;
  return visionMap(pl).own.some(x=>inSight(x,r,c,ff))}
const landFree=pl=>{const t=[];if(typeof kothOn==="function"&&kothOn())return t;
  for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++)if(midTile(r,c)&&!G.board[r][c]&&!landAt(r,c)&&!(typeof flagAt==="function"&&flagAt(r,c))&&(pl==null||landOwnSide(pl,r,c)&&landSeen(pl,r,c)))t.push([r,c]);return t};
{const _bt=beginTurn;beginTurn=function(pl){const out=_bt.apply(this,arguments);
  for(const l of [...(G.lands||[])])if(l.owner===pl&&l.untilT!=null&&tnOf(pl)>=l.untilT){G.lands.splice(G.lands.indexOf(l),1);
    log(`${plName(pl)}'s land on ${coord(l.r,l.c)} goes back to the Bank after ${LAND_TURNS} rounds (a base on it stays a spawn point until it falls).`)}
  return out}}
/* v71e: a typed tile, like C3, and why it can't be land */
const landParse=txt=>{const m=/^([A-Z])\s*(\d{1,2})$/.exec(String(txt||"").trim().toUpperCase());return m?[G.rows-(+m[2]),m[1].charCodeAt(0)-65]:null};
function landWhy(pl,txt){const t=String(txt||"").trim().toUpperCase();if(!t)return "Type a tile: a letter and a number, like C3.";
  if(typeof kothOn==="function"&&kothOn())return "No land in King of the Hill.";
  const rc=landParse(t);if(!rc)return `"${t}" isn't a tile: a letter and a number, like C3.`;const [r,c]=rc;
  if(c<0||c>=COLS||r<0||r>=G.rows)return `${t} isn't on the field.`;
  if(isVoid(r,c)||tileRole(r,c)==="water")return `${t} isn't ground anyone can stand on.`;
  if(!midTile(r,c))return `${t} is home ground, not the middle.`;
  if(!landOwnSide(pl,r,c))return `${t} is past the midline: land must be on your side of it.`;
  if(!landSeen(pl,r,c))return `${t} is in the fog: land can only be bought where your side's own cards see (not what a spell uncovers).`;
  if(landAt(r,c))return `${t} is already someone's land.`;
  if(G.board[r][c])return `Something stands on ${t}: land must be empty.`;
  if(typeof flagAt==="function"&&flagAt(r,c))return `${t} is already a spawn point.`;
  if((G.lands||[]).some(l=>l.owner===pl))return "You already hold land in the middle.";
  if(!canAfford(pl,2))return "Land costs 2 mana.";
  return ""}
function buyLand(pl,r,c){const P=G.p[pl];if(!bankOpen()||G.phase!=="prep"||G.active!==pl)return false;
  if((G.lands||[]).some(l=>l.owner===pl)){if(!P.cpu)flash("You already hold land in the middle.");return false}
  if(!landFree(pl).some(([a,b])=>a===r&&b===c))return false;if(!canAfford(pl,2)){if(!P.cpu)flash("Land costs 2 mana.");return false}
  spend(pl,2);(G.lands=G.lands||[]).push({r,c,owner:pl,untilT:tnOf(pl)+LAND_TURNS});
  log(`${plName(pl)} buys land from the Bank on ${coord(r,c)}: a spawn point for ${LAND_TURNS} rounds.`,"event");return true}
{NETFN.buyLand={get:()=>buyLand,set:f=>buyLand=f};const orig=buyLand;buyLand=function(...a){if(NET.role!=="guest")return orig.apply(this,a);const rid=++NET.rid;sendHost({t:"cmd",fn:"buyLand",args:netClean(a),ui:uiSnap(),rid})}}
{const _cp=canPlace;canPlace=function(card,r,c){if(_cp(card,r,c))return true;if(!G||G.phase==="setup"||isVoid(r,c))return false;
  const l=landAt(r,c);if(!l||l.owner!==G.active||kind(card)==="wall")return false;const st=G.board[r][c];
  if(!st)return true;if(st.owner!==G.active||kind(card)==="ace"||isBase(card))return false;
  if(card.unit&&UNIT[card.unit].solo==="alone")return false;if(kind(card)==="joker"&&!st.cards.some(x=>x.color===card.color))return false;
  return stackLegal([...st.cards,card])}}
{const _pl=place;place=function(card,r,c){const l=landAt(r,c),pl=G.active;const out=_pl.apply(this,arguments);
  const st=G.board[r][c];if(l&&l.owner===pl&&st&&!st.cards.some(isBase)){const fee=R(2)-1;if(fee){const was=G.spent;spend(pl,fee);G.spent=was;log(`The Bank charges ${plName(pl)} ${fee} mana for a card on its land.`)}}
  return out}}
function landHTML_(r,c,under){const l=landAt(r,c);if(!l)return "";const P=G.p[l.owner];
  return `<span class="landmk${under?" under":""}" style="--fc:${P.color}" data-tip="${esc(P.name)}'s land from the Bank: a spawn point for any card but a Wall, ${landLeft(l)} more of ${esc(P.name)}'s turns (counting the current one). A card without a base here costs 1d2 − 1.">$</span>`}
{const _ch=crystalHTML;crystalHTML=function(r,c,under){return _ch(r,c,under)+landHTML_(r,c,under)}}

/* ---------- Debt Collectors: only someone who owes the Bank can strike them ---------- */
{const _ao=attackOptions;attackOptions=function(r,c){const out=_ao(r,c),st=G.board[r]&&G.board[r][c];if(!st||!G)return out;const bk=npcIx("bank");if(bk<0||owesBank(st.owner))return out;
  return out.filter(o=>{const t=G.board[o.r][o.c];return !(t&&t.owner===bk&&t.cards.every(x=>x.unit==="debt"))})}}

/* ---------- between players: forgive a loan, give mana or a card ---------- */
function forgiveLoan(L){if(!L||!["open","late"].includes(L.state))return;L.state="done";const n=L.owed;L.owed=0;loanCollectorsOff(L);
  log(`<b>${plName(L.to)} forgives ${plName(L.from)}'s loan</b> (${n} mana).`,"event");notify(L.from,`${esc(G.p[L.to].name)} forgives the loan.`)}
function giftMana(from,to,n){n=Math.min(Math.max(0,Math.round(n)),mana(from));if(n<=0||from===to||!G.p[to]||G.p[to].out)return 0;
  const paid=payQuiet(from,n),got=giveMana(to,paid);log(`${plName(from)} gives ${plName(to)} ${paid} mana${got<paid?` (${got} fit in the soul pile)`:""}.`,"event");return got}
function giftCard(from,to,id){const P=G.p[from],Q=G.p[to],c=P.hand.find(x=>x.id===id);if(!c||!Q||Q.out||from===to)return false;
  P.hand.splice(P.hand.indexOf(c),1);clearMarks(c);c.owner=to;if(Q.hand.length<handCap(to))Q.hand.push(c);else{Q.deck.push(c);shuffle(Q.deck)}
  log(`${plName(from)} gives ${plName(to)} a card.`,"event");notify(to,`${esc(P.name)} gives ${esc(Q.name)} a card.`);return true}
for(const [name,get,set] of [["forgiveLoan",()=>forgiveLoan,f=>forgiveLoan=f,a=>[a[0].id],a=>[p2pOf().find(x=>x.id===a[0])]],["giftMana",()=>giftMana,f=>giftMana=f],["giftCard",()=>giftCard,f=>giftCard=f]]){
  NETFN[name]={get,set,any:true};const orig=get();set(function(...a){if(NET.role!=="guest")return orig.apply(this,a);const rid=++NET.rid;const args=name==="forgiveLoan"?[a[0].id]:a;
    sendHost({t:"cmd",fn:name,args:netClean(args),ui:uiSnap(),rid})})}
NETFN.forgiveLoan.un=a=>[p2pOf().find(x=>x.id===a[0])];

/* ---------- the Bank window: land on the front tab, the Report tab, gifts and forgiveness between players ---------- */
function reportHTML(V){const P=G.p[V],rp=rpOf(V),R0=(P.reports||[])[0];
  const paper=(x,cur)=>`<div class="rpaper${cur?" cur":""}"><h4>${cur?"This period so far":"Credit and Loan Report"} <small>rounds ${x.from}–${cur?G.moon.round:x.to}</small></h4>
<dl><dt>Taken from loans</dt><dd>${x.loans}</dd><dt>Taken on credit</dt><dd>${x.credit}</dd><dt>Together</dt><dd><b>${x.loans+x.credit}</b></dd>
<dt>Interest on loans</dt><dd>${x.intL}</dd><dt>Interest on credit</dt><dd>${x.intC}</dd><dt>Interest together</dt><dd><b>${x.intL+x.intC}</b></dd>
${cur?"":`<dt>Taxes taken</dt><dd>${x.taxPaid} of ${x.taxDue}${x.taxLines&&x.taxLines.length?`<small>${x.taxLines.map(esc).join("; ")}</small>`:""}</dd>`}
<dt>Mana earned</dt><dd>${x.earned}</dd>${cur?"":`<dt>Owing at the end</dt><dd>debt ${x.debt} · loans ${x.owed}</dd>`}</dl>
<p class="rstand ${(cur?standingGood(V):x.good)?"good":"bad"}">${(cur?standingGood(V):x.good)?"Good standing with the Bank.":"Bad standing: the Bank's Debt Collectors will inquire for further action."}</p></div>`;
  const older=(P.reports||[]).slice(1);
  return `<p class="dim">A Report comes every Full Moon (every eighth round without the Moon), the day the Bank also takes its taxes and its half of the land's Miners.</p>
${paper({...rp},true)}${R0?paper(R0,false):`<p class="dim">No Report yet.</p>`}${older.length?`<details class="rold"><summary>Older Reports (${older.length})</summary>${older.map(x=>paper(x,false)).join("")}</details>`:""}`}
{const _ob=openBank;openBank=function(){_ob();const box=$("#ov .ovbox.bank");if(!box||!G)return;const V=view(),live=canAct()&&G.phase==="prep"&&G.active===V;
  // the Report tab
  const tabs=box.querySelector(".btabs");if(tabs&&!tabs.querySelector('[data-bt="report"]')){
    tabs.insertAdjacentHTML("beforeend",`<button type="button" class="stab" data-bt="report">Credit and Loan Report${standingGood(V)?"":' <i class="bang">!</i>'}</button>`);
    const pane=document.createElement("div");pane.className="btab report";pane.dataset.t="report";pane.innerHTML=reportHTML(V);pane.hidden=true;box.querySelector(".btab.land").after(pane);
    const show=t=>{tabs.querySelectorAll("[data-bt]").forEach(b=>{const on=b.dataset.bt===t;b.classList.toggle("on",on);b.setAttribute("aria-selected",on)});box.querySelectorAll(".btab").forEach(p=>p.hidden=p.dataset.t!==t);bankTab=t};
    tabs.querySelectorAll("[data-bt]").forEach(b=>b.onclick=()=>show(b.dataset.bt));if(bankTab==="report")show("report")}
  // land on the front tab
  const acts=box.querySelector(".bacts");if(acts&&live&&bankOpen()){const mine=(G.lands||[]).find(l=>l.owner===V),free=landFree(V);
    acts.insertAdjacentHTML("beforeend",`<p class="brow landrow"><span class="bkey" data-tip="A spawn point on the middle ground for 8 rounds (this one counts), on your side of the midline (none in King of the Hill): any card but a Wall can come down there; a card without a base on it costs 1d2 − 1. A base on it stays a spawn point after that, until it falls." tabindex="0">Land <i class="q">?</i></span>${mine?`<small class="dim">You hold land on ${coord(mine.r,mine.c)}: ${landLeft(mine)} rounds left, this one counted.</small>`:`<label class="landin ${free.length?"":"off"}"><input id="bLandAt" type="text" maxlength="4" autocomplete="off" spellcheck="false" placeholder="${free.length?coord(free[0][0],free[0][1]):"—"}" aria-label="Which tile, like C3" aria-describedby="bLandErr" ${free.length?"":"disabled"}></label><button class="btn sm" id="bLandBtn" disabled>Buy for 2 mana</button><small class="dim">Type a tile in the middle, on your side of the midline: a spawn point for 8 rounds.</small><small id="bLandErr" class="landerr" role="status" aria-live="polite">${free.length?"":"No free tile on your side of the midline."}</small>`}</p>`);
    const inp=$("#bLandAt"),btn=$("#bLandBtn"),err=$("#bLandErr");   // v71e: typed, and what's wrong shows under it as you type
    if(inp&&btn&&err){const chk=()=>{const t=inp.value.trim(),why=landWhy(V,t);err.classList.toggle("ok",!why);err.textContent=!t?"":why||`${t.toUpperCase()} is free: yours for 2 mana.`;btn.disabled=!!why;return !why};
      inp.oninput=chk;inp.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();if(chk())btn.click()}};
      btn.onclick=()=>{if(!chk())return;const rc=landParse(inp.value);if(rc)buyLand(V,rc[0],rc[1]);render();openBank()}}}
  // between players: forgive, give
  const p2p=box.querySelector(".btab.p2p");if(p2p){
    p2p.querySelectorAll("ul.p2pl li").forEach(li=>{});
    const lent=p2pOf().filter(x=>x.to===V&&["open","late"].includes(x.state));
    if(lent.length)p2p.insertAdjacentHTML("beforeend",`<h3>Forgive a loan</h3><ul class="p2pl">${lent.map(x=>`<li>${plName(x.from)} owes you <b>${x.owed}</b> <button class="btn ghost sm" data-forgive="${x.id}">Forgive</button></li>`).join("")}</ul>`);
    const others=alive().filter(i=>i!==V&&!isHorde(i)&&!isNPC(i));
    if(live&&others.length)p2p.insertAdjacentHTML("beforeend",`<h3>Give, for nothing</h3><p class="p2pask"><label>To <select id="gTo">${others.map(i=>`<option value="${i}">${esc(G.p[i].name)}</option>`).join("")}</select></label>
 <label><select id="gN">${Array.from({length:Math.max(1,mana(V))},(_,i)=>`<option>${i+1}</option>`).join("")}</select> mana</label> <button class="btn sm" id="gMana" ${mana(V)?"":"disabled"}>Give mana</button> <button class="btn ghost sm" id="gCard" ${G.p[V].hand.length?"":"disabled"}>Give a card…</button></p>`);
    p2p.querySelectorAll("[data-forgive]").forEach(b=>b.onclick=()=>{const L=p2pOf().find(x=>x.id===+b.dataset.forgive);if(L)forgiveLoan(L);render();openBank()});
    if($("#gMana"))$("#gMana").onclick=()=>{giftMana(V,+$("#gTo").value,+$("#gN").value);bankTab="p2p";render();openBank()};
    if($("#gCard"))$("#gCard").onclick=async()=>{const to=+$("#gTo").value,P=G.p[V];ovHide();
      const i=await askHuman(V,{kind:"cards",id:"gift",title:`Give ${esc(G.p[to].name)} which card?`,cards:P.hand,cancel:"Cancel",box:"plain"});
      if(i!=null&&P.hand[i])giftCard(V,to,P.hand[i].id);bankTab="p2p";render();openBank()}}}}

/* ---------- the tags beside a player: every status, each explained on hover or hold ---------- */
{const _et=econTags;econTags=function(P){const t=_et(P);if(!G.bank||isHorde(P.i)||isNPC(P.i))return t;
  if(P.guilty)t.unshift(`<span class="debttag" data-tip="In default with the Bank: Debt Collectors come every round until the debt is paid off.">In default</span>`);
  else if(P.rp&&P.rp.bad)t.unshift(`<span class="debttag" data-tip="Bad standing with the Bank this period (default, an unpaid tax or a robbery). It shows on the next Report.">Bad standing</span>`);
  const l=(G.lands||[]).find(x=>x.owner===P.i);if(l)t.push(`<span class="saletag" data-tip="Land from the Bank on ${coord(l.r,l.c)}: a spawn point for ${landLeft(l)} more of ${esc(P.name)}'s turns, this one counted.">Land ${coord(l.r,l.c)} · ${landLeft(l)}</span>`);
  if(P.shield)t.push(`<span class="saletag" data-tip="Please Don't Hurt Me: none of this player's stacks can be attacked until their next turn.">Untouchable</span>`);
  if(P.noLoans)t.push(`<span class="debttag" data-tip="Tried to rob the Bank: no loans or credit, ever.">No loans</span>`);
  return t}}
const TAG_TIPS=[[/^Debt −/,"Mana debt: shows as mana below zero. Every soul gained pays it first; it grows by 1d2 every 3 rounds."],[/^Loans /,"Owed to the Bank in loans, interest included."],[/^Credit$/,"Spends on credit: spells it can't afford become mana debt."],
  [/^Ether sale$/,"Killed the most Demons: conjuring costs 1d2 − 1 less (never below 1)."],[/^Max /,"Maximum mana changed by spells and events."],[/^Sun-blind$/,"Blinded by the Second Sun."],[/^Choking on the Sun$/,"The Second Sun chokes this player: no attacks."]];
{const _et=econTags;econTags=function(P){return _et(P).map(h=>{if(/data-tip=/.test(h))return h;const m=/^<span([^>]*)>([^<]*)</.exec(h);if(!m)return h;const tip=TAG_TIPS.find(([re])=>re.test(m[2]));
  return tip?h.replace("<span",`<span data-tip="${esc(tip[1])}"`):h})}}
if(window.__EC)Object.assign(window.__EC,{bankReport,buyLand,landFree,forgiveLoan,giftMana,giftCard,rpOf,attackOptions:(...a)=>attackOptions(...a)});
if(window.__EC)Object.assign(window.__EC,{landFreeW:pl=>landFree(pl),buyLandW:(...a)=>buyLand(...a),landLeftW:l=>landLeft(l),midTileW:(r,c)=>midTile(r,c)});
