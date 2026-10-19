/* ---------------- v50: the Oaths and the planets ----------------
   Saturn: breaking its Oath costs all your mana, 5 deck cards, 2 hand cards and 2 maximum; each Report in good standing pays
     +10% of your mana and +1 maximum. The Moon: one more Grave Blessing die (04_spells). The Earth: luck at Gambling, Gamble II,
     a reward for every enemy Joker killed, Miners bring twice (16_siege). Jupiter: the floor is −12 (17_econ).
   Mercury: +1 mana an Auction sale (13_substances2), Rob the Bank any round (28_shop), and the Bank's bounties.
   Venus: pay other players' debts for a discount on your next buys; Healers cost one less; a big payment guards you (+2 defense). */

/* ---------- the computer keeps the Moon's demand before it spends anything ---------- */
{const _ph=AI.phase;AI.phase=async function(pl,ph){
  if(ph==="prep"&&G.p[pl]&&!isHorde(pl)&&oathNow(pl,"moon")&&!G.p[pl].moonDone){
    const cast1=async(id,r,c)=>{const sp=SP(id);const old=G.sel;G.sel=r==null?null:{r,c,pick:new Set()};if(!spellReady(sp)){G.sel=old;return false}await cast(sp);G.sel=null;render();await sleep(420);return true};
    try{await aiMoonOath(pl,cast1)}catch(e){console.error(e)}}
  return _ph.apply(this,arguments)}}

/* ---------- the Oath of Saturn: what breaking it costs ---------- */
function saturnBreak(pl){const P=G.p[pl];if(!P)return;
  const m=Math.max(0,mana(pl)),paid=payQuiet(pl,m);bankAdd(paid);
  let d=0;for(let i=0;i<5&&P.deck.length;i++){toGrave(P.deck.splice(Math.floor(Math.random()*P.deck.length),1)[0],"burn");d++}
  let h=0;for(let i=0;i<2&&P.hand.length;i++){toGrave(P.hand.splice(Math.floor(Math.random()*P.hand.length),1)[0],"burn");h++}
  P.maxAdd=(P.maxAdd||0)-2;P.satPaid=0;
  log(`<b>Saturn</b> takes its price from ${plName(pl)} for the broken Oath: ${paid} mana, ${d} deck card${d===1?"":"s"}, ${h} hand card${h===1?"":"s"} and two maximum mana.`,"event")}
const SAT_BREAK_TXT="Breaking the Oath of Saturn costs all your mana, 5 random cards from your deck, 2 random cards from your hand, and 2 maximum mana.";
async function saturnBreakOk(V){const P=G.p[V];if(!P||P.oath!=="saturn"||P.satLocked)return true;if(P.cpu)return false;
  return !!await askHuman(V,{kind:"yesno",id:"satbreak",title:"Break the Oath of Saturn?",text:SAT_BREAK_TXT,yes:"Break it",no:"Keep it"})}
for(const [k] of OATHS){const sp=SP("oath_"+k);if(!sp)continue;const run=sp.run;
  sp.run=async()=>{const P=me();if(P.oath==="saturn"&&!P.satLocked){
      const yes=await ask(G.active,{kind:"yesno",id:"satbreak",title:"Break the Oath of Saturn?",text:SAT_BREAK_TXT,yes:"Break it",no:"Keep it",ai:()=>false});
      if(!yes){log(`${plName(G.active)} keeps the Oath of Saturn.`);return}}
    return run()}}

/* ---------- Report day: Saturn's reward, the bounties ---------- */
{const _br=bankReport;bankReport=function(){
  if(!G.bank||survival())return _br.apply(this,arguments);
  const t=G.turnNo;_br.apply(this,arguments);G.reportN=(G.reportN||0)+1;
  for(const pl of alive().filter(i=>!isHorde(i)&&!isNPC(i))){const P=G.p[pl],R0=(P.reports||[])[0];if(!R0||R0.to!==t)continue;
    if(R0.good&&oathNow(pl,"saturn")){const add=Math.max(1,Math.ceil(Math.max(0,mana(pl))*.1)),got=giveMana(pl,add);P.maxAdd=(P.maxAdd||0)+1;
      log(`<b>The Oath of Saturn</b>: a Report in good standing pays ${plName(pl)} ${got} mana (10%) and one more maximum.`,"event")}}
  bountyReport()}}

/* ---------- the Bank's bounties (the Oath of Mercury, or anyone while Mercury is up) ---------- */
const BOUNTY_COLL=2,BOUNTY_MAXC=3;
const bountiesOf=()=>G.bounties||(G.bounties=[]);
const bountyById=id=>bountiesOf().find(b=>b.id===id);
const bountyLive=b=>b&&(b.state==="open"||b.state==="taken");
const bountyOn=pl=>bountiesOf().find(b=>bountyLive(b)&&b.target===pl);
const bountyBanned=pl=>{const P=G.p[pl];return !!P&&P.bountyBan!=null&&(G.reportN||0)<P.bountyBan};
const bountyCanTake=pl=>!!G.p[pl]&&!isNPC(pl)&&!isHorde(pl)&&!G.p[pl].out&&bankOpen()&&(oathNow(pl,"mercury")||planetUp("mercury"))&&!bountyBanned(pl)&&!bankBanned(pl)&&!G.p[pl].jail;
const bountyColls=b=>stacksOf(b.by).filter(x=>x.st.bounty===b.id);
/* what is owed the Bank: debt, loans, the last unpaid tax, and 3 for a robbery */
function bountyOwed(pl){const P=G.p[pl],R0=(P.reports||[])[0];let n=debtOf(pl)+owedOf(pl);if(R0)n+=Math.max(0,R0.taxDue-R0.taxPaid);if(P.robbed!=null&&R0&&P.robbed>=G.moon.round-8)n+=3;return Math.max(2,n)}
/* pay down a player's debt to the Bank, then their loans */
function payDown(pl,n){const P=G.p[pl];let left=n;const d=Math.min(left,P.debt||0);if(d){P.debt-=d;left-=d;if(!P.debt)P.debtAt=null}
  for(const L of P.loans||[]){if(left<=0)break;const x=Math.min(left,L.owed);L.owed-=x;left-=x}
  P.loans=(P.loans||[]).filter(L=>L.owed>0);return n-left}
function bountyReport(){const N=G.reportN||0;
  for(const b of bountiesOf()){if(!bountyLive(b))continue;
    if(!G.p[b.target]||G.p[b.target].out){bountyEnd(b,"void",`The bounty on ${plName(b.target)} is called off: they are out of the game.`);continue}
    if(b.state==="taken"&&!owesBank(b.target)){bountyEnd(b,"void",`The bounty on ${plName(b.target)} ends: nothing is owed the Bank any more.`);continue}
    if(b.state==="taken"&&N>=b.due){bountyFail(b);continue}
    if(b.state==="open"&&(G.p[b.target].standing||[])[0]&&!owesBank(b.target))bountyEnd(b,"void",`The bounty on ${plName(b.target)} is lifted: good standing again.`)}
  for(const pl of alive().filter(i=>!isHorde(i)&&!isNPC(i))){const P=G.p[pl];if((P.standing||[])[0]!==false||bountyOn(pl))continue;
    const b={id:(G.bountyId=(G.bountyId||0)+1),target:pl,owed:bountyOwed(pl),got:0,by:null,due:null,state:"open",at:N};bountiesOf().push(b);
    log(`<b>The Bank</b> posts a bounty on ${plName(pl)}: ${b.owed} mana owed. ${planetUp("mercury")?"Anyone":"The Oath of Mercury"} can take it at the Bank.`,"event")}
  G.bounties=bountiesOf().filter(bountyLive)}
function bountyEnd(b,state,msg){b.state=state;if(b.by!=null)for(const x of bountyColls(b))G.board[x.r][x.c]=null;if(msg)log(msg,"event")}
function bountyFail(b){const h=b.by,P=G.p[h],bk=npcIx("bank");
  for(const o of bountiesOf().filter(x=>x.by===h&&x.state==="taken")){
    for(const x of bountyColls(o)){if(bk<0){G.board[x.r][x.c]=null;continue}x.st.owner=bk;for(const c of x.st.cards)c.owner=bk;x.st.hunt=o.target;delete x.st.bounty}
    if(o!==b){o.state="open";o.by=null;o.due=null}}
  b.state="open";b.by=null;b.due=null;P.bountyBan=(G.reportN||0)+1;
  log(`<b>${plName(h)} fails the bounty</b> on ${plName(b.target)}: their Debt Collectors now belong to the Bank, their other bounties are cancelled, and they must wait a Report to take another.`,"event");
  notify(h,`${esc(P.name)} failed a bounty.`)}
function bountyGain(b,v,how){if(!bountyLive(b)||b.state!=="taken")return;const paid=payDown(b.target,v);b.got+=v;
  log(`The bounty: ${plName(b.by)} collects ${v} for the Bank from ${plName(b.target)} (${how}; ${Math.min(b.got,b.owed)} of ${b.owed}${paid<v?"; nothing more is owed":""}).`);
  if(b.got>=b.owed||!owesBank(b.target))bountyDone(b)}
function bountyDone(b){const h=b.by,P=G.p[h];
  const forg=debtOf(h)+owedOf(h);P.debt=0;P.debtAt=null;P.loans=[];
  const want=Math.ceil(b.owed/2),n=Math.min(want,Math.max(0,G.bank.mana-BANK_FLOOR)),got=giveMana(h,n);G.bank.mana-=got;
  bountyEnd(b,"done",`<b>${plName(h)} completes the bounty</b> on ${plName(b.target)}: ${got} mana from the Bank (half of ${b.owed})${forg?`, and ${forg} of their own debt is forgiven`:""}.`);
  popup("Bounty complete",`<p>${plName(h)} collected what ${plName(b.target)} owed the Bank.</p><p>Reward: <b>${got}</b> mana${forg?`, and the Bank forgives ${forg} mana of ${esc(P.name)}'s own debts and loans`:""}.</p>`,h)}
function acceptBounty(pl,id){const b=bountyById(id);if(!b||b.state!=="open"||b.target===pl||!bountyCanTake(pl))return false;
  b.state="taken";b.by=pl;b.due=(G.reportN||0)+2;
  log(`${plName(pl)} takes the Bank's bounty on ${plName(b.target)} (${b.owed} mana, by the second Report from now).`,"event");notify(b.target,`${esc(G.p[pl].name)} hunts ${esc(G.p[b.target].name)} for the Bank.`);return true}
function buyBountyColl(pl,id){const b=bountyById(id);if(!b||b.state!=="taken"||b.by!==pl||G.active!==pl||G.phase!=="prep"||!bankOpen())return false;
  if(bountyColls(b).length>=BOUNTY_MAXC){if(!G.p[pl].cpu)flash(`At most ${BOUNTY_MAXC} Debt Collectors on one bounty.`);return false}
  if(!canAfford(pl,BOUNTY_COLL)){if(!G.p[pl].cpu)flash(`A Debt Collector costs ${BOUNTY_COLL} mana.`);return false}
  const t=freeTilesNear(b.target,true)[0];if(!t){if(!G.p[pl].cpu)flash("No free ground near them.");return false}
  spend(pl,BOUNTY_COLL);G.board[t[0]][t[1]]={owner:pl,cards:[mkUnit("debt",pl)],moved:true,attacked:true,bounty:b.id};
  log(`${plName(pl)} buys a Debt Collector for the bounty on ${plName(b.target)}: it waits on ${coord(t[0],t[1])}.`,"event");return true}
function turnInCapt(pl,r,c){const st=G.board[r]&&G.board[r][c];if(!st||st.owner!==pl||!st.captive||G.active!==pl)return false;
  const x=st.captive,b=bountiesOf().find(o=>o.state==="taken"&&o.by===pl&&o.target===x.capturedFrom);if(!b)return false;
  st.captive=null;x.owner=null;x.capturedFrom=null;if(x.hp!=null)x.hp=x.maxHp;G.ether.push(x);bountyGain(b,costOf(x)||1,`a captured ${nameOf(x)} turned in to the Ether`);return true}
for(const [name,get,set] of [["acceptBounty",()=>acceptBounty,f=>acceptBounty=f],["buyBountyColl",()=>buyBountyColl,f=>buyBountyColl=f],["turnInCapt",()=>turnInCapt,f=>turnInCapt=f]]){
  NETFN[name]={get,set,any:true};const orig=get();set(function(...a){if(NET.role!=="guest")return orig.apply(this,a);const rid=++NET.rid;sendHost({t:"cmd",fn:name,args:netClean(a),ui:uiSnap(),rid})})}
/* a bounty's Debt Collectors strike only its target, a teammate too (that is no betrayal) */
{const _ao=attackOptions;attackOptions=function(r,c){let out=_ao(r,c);const st=G&&G.board[r]&&G.board[r][c];if(!st||st.bounty==null)return out;
  const b=bountyById(st.bounty);if(!b||b.state!=="taken")return [];
  out=out.filter(o=>{const t=G.board[o.r][o.c];return t&&t.owner===b.target});
  if(!isEnemy(st.owner,b.target)&&!st.attacked&&!st.stun&&!st.pin&&canAttackFrom(st)){const w=UNIT.debt.weapons[0];
    for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const r2=r+dr,c2=c+dc,t=G.board[r2]&&G.board[r2][c2];
      if(t&&t.owner===b.target&&!t.hypo&&!shielded(t.owner)&&reaches(w.reach,r,c,r2,c2)&&!out.some(o=>o.r===r2&&o.c===c2))out.push({r:r2,c:c2,mode:w.id,ranged:false,w})}}
  return out}}
/* what a bounty's Debt Collector kills goes to the Ether, and its price comes off the target's debt */
{const _eb=econBury;econBury=function(card,r,c,st){const out=_eb.apply(this,arguments);if(out)return out;const F=G.fight;if(!F)return false;
  const kst=st===F.D?F.A:st===F.A?F.D:null,b=kst&&kst.bounty!=null?bountyById(kst.bounty):null;
  if(!b||b.state!=="taken"||st.owner!==b.target||card.unit&&!UNIT[card.unit].ether)return false;
  card.owner=null;if(card.hp!=null)card.hp=card.maxHp;G.ether.push(card);bountyGain(b,costOf(card)||1,`${nameOf(card)} into the Ether`);return true}}
/* a computer hunter's Debt Collectors close in on the target at the end of its turn */
function bountyMove(pl){if(!G.p[pl].cpu)return;
  for(const b of bountiesOf().filter(o=>o.state==="taken"&&o.by===pl))for(const x of bountyColls(b)){let {st,r,c}=x;if(G.board[r][c]!==st||st.attacked)continue;
    const hit=()=>{const o=attackOptions(r,c)[0];if(o){attack(r,c,o.r,o.c,o.mode);return true}return false};if(hit()||st.moved)continue;
    const tl=stacksOf(b.target);if(!tl.length)continue;const dist=(a,d)=>Math.min(...tl.map(y=>Math.abs(y.r-a)+Math.abs(y.c-d)));let best=null;
    for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const rr=r+dr,cc=c+dc;if(rr<0||cc<0||rr>=G.rows||cc>=COLS||isVoid(rr,cc)||G.board[rr][cc])continue;const d=dist(rr,cc);if(d<dist(r,c)&&(!best||d<best.d))best={rr,cc,d}}
    if(best){G.board[best.rr][best.cc]=st;G.board[r][c]=null;st.moved=true;r=best.rr;c=best.cc;hit()}}}
{const _et=endTurn;endTurn=function(pl){if(G.p[pl]&&!G.p[pl].out&&!isHorde(pl)&&!isNPC(pl))try{bountyMove(pl)}catch(e){console.error(e)}return _et(pl)}}

/* ---------- the Oath of the Earth: Gambling, Gamble II, the Jokers it kills ---------- */
{const GSP=SP("gamble"),run0=GSP.run;
  GSP.run=async()=>{const pl=G.active,P=me();if(!oathNow(pl,"earth"))return run0();
    const a=R(2),b=R(2);let dbl=a===2,safe=b===2;const notes=[];
    if(dbl&&safe){dbl=safe=false;notes.push("both Earth rolls came up, so the odds stay plain")}else{if(dbl)notes.push("doubled odds: 9 or 10 wins");if(safe)notes.push("a 1 costs nothing")}
    if(P.earthJoker){P.earthJoker=false;if(!dbl)notes.push("doubled odds for the enemy Joker killed");dbl=true}
    const d=R(10),ed=[{s:2,v:a},{s:2,v:b}],why=notes.length?` (the Oath of the Earth: ${notes.join("; ")})`:"";
    if(d===10||dbl&&d===9){const w=rollN(7,2),n=Math.min(sum(w),Math.max(0,G.bank.mana-BANK_FLOOR)),got=giveMana(pl,n);G.bank.mana-=got;tray(pl,"Gambling",[{s:10,v:d},...ed,...w],`+${got}`);log(`<b>Gambling</b>: ${plName(pl)} rolls ${d} and wins ${n} mana (${got} fit)${why}.`,"event")}
    else if(d===1&&!safe){const w=rollN(7,2),n=Math.max(0,Math.min(sum(w),effMana(pl)-floorOf(pl)));P.maxAdd=(P.maxAdd||0)-1;const c=P.deck.pop();if(c){c.owner=null;G.ether.push(c)}tray(pl,"Gambling",[{s:10,v:d},...ed,...w],`−${n}`);
      log(`<b>Gambling</b>: ${plName(pl)} rolls a 1${why}. One maximum mana is lost, ${n} mana of debt (7d2) is owed${c?", and a card leaves the deck for the Ether":""}.`,"event");addDebt(pl,n)}
    else{tray(pl,"Gambling",[{s:10,v:d},...ed],"nothing");log(`Gambling: ${plName(pl)} rolls ${d}${d===1?", and the Earth catches the fall":""}. Nothing${why}.`)}}}
SPELLS.push({id:"gamble2",name:"Gamble II",cost:1,school:"Sorcery",text:"",ok:()=>oathNow(G.active,"earth")&&bankOpen(),run:async()=>{const pl=G.active,P=me(),dbl=!!P.earthJoker;P.earthJoker=false;const d=R(20);
  if(d===20||dbl&&d===19){const room=Math.max(0,surCap(pl)-mana(pl)),n=Math.min(room,Math.max(0,G.bank.mana-BANK_FLOOR)),got=giveMana(pl,n);G.bank.mana-=got;
    tray(pl,"Gamble II",[{s:20,v:d}],`+${got}`);log(`<b>Gamble II</b>: ${plName(pl)} rolls ${d}${dbl?" (doubled odds for the Joker killed)":""}: the Bank fills the soul pile with ${got} mana.`,"event");critLog("success",d,`${plName(pl)}: Crit Success`)}
  else{tray(pl,"Gamble II",[{s:20,v:d}],"nothing");log(`Gamble II: ${plName(pl)} rolls ${d}${dbl?" (doubled odds)":""}. Nothing.`)}}});
OATH_ONLY.gamble2="earth";
Object.assign(SPELL_TEXT,{gamble2:{n:"The Oath of the Earth, while the Bank is open.",e:"Roll 1d20. A natural 20 is a Crit Success: the Bank fills your soul pile as full as it can hold, the surplus included.",l:"Anything else: the mana is gone. Gamble II never costs more than its mana."}});
SP("gamble2").text=[SPELL_TEXT.gamble2.n,SPELL_TEXT.gamble2.e,SPELL_TEXT.gamble2.l].join(" ");
if(SPELL_TEXT.gamble)SPELL_TEXT.gamble.l=(SPELL_TEXT.gamble.l||"")+" Under the Oath of the Earth: a 1d2 for doubled odds (9 or 10 wins) and a 1d2 for no loss on a 1; both at once and the odds stay plain.";
{const _b=bury;bury=function(card,r,c,st){const F=G.fight;
  if(F&&card&&kind(card)==="joker"&&st){const k=st===F.D?F.atkPl:st===F.A?F.defPl:null;
    if(k!=null&&G.p[k]&&!isNPC(k)&&!isHorde(k)&&isEnemy(k,st.owner)&&oathNow(k,"earth")){const P=G.p[k],add=R(2)+R(3),got=giveMana(k,add);P.earthJoker=true;
      log(`The Oath of the Earth: ${plName(k)} kills a Joker: +${got} mana (1d2 + 1d3), and doubled odds on the next Gamble.`)}}
  return _b.apply(this,arguments)}}

/* ---------- the Oath of Venus: paying others' debts, cheaper Healers, a guard ---------- */
const venusDefOn=pl=>{const P=G.p[pl];return !!P&&P.venusDef!=null&&tnOf(pl)<=P.venusDef};
function payDebtFor(from,to,n){if(!oathNow(from,"venus")||from===to||!G.p[to]||G.p[to].out||G.active!==from)return 0;
  n=Math.min(Math.round(n),Math.max(0,mana(from)),debtOf(to)+owedOf(to));if(n<=0)return 0;
  const paid=payQuiet(from,n);bankAdd(paid);payDown(to,paid);
  let left=paid,t=0;while(left>0){const d=R(2);if(d>left)break;left-=d;t++}
  const P=G.p[from];P.venusDisc=(P.venusDisc||0)+t;
  let guard="";if(paid>=6){const k=R(3)+R(3);P.venusDef=tnOf(from)+k;guard=` Venus guards them: +2 on defense for ${k} turns.`}
  log(`<b>The Oath of Venus</b>: ${plName(from)} pays ${paid} of ${plName(to)}'s debt to the Bank. ${t} discount${t===1?"":"s"} of 1 mana on their next buys.${guard}`,"event");
  notify(to,`${esc(P.name)} pays ${paid} of ${esc(G.p[to].name)}'s debt.`);return paid}
{NETFN.payDebtFor={get:()=>payDebtFor,set:f=>payDebtFor=f,any:true};const orig=payDebtFor;payDebtFor=function(...a){if(NET.role!=="guest")return orig.apply(this,a);const rid=++NET.rid;sendHost({t:"cmd",fn:"payDebtFor",args:netClean(a),ui:uiSnap(),rid})}}
let vdOff=false;
{const _sc=spellCost;spellCost=function(sp){let c=_sc(sp);if(!sp||!G)return c;const P=G.p[G.active];
  if(sp.id==="cheal"&&oathNow(G.active,"venus"))c=Math.max(1,c-1);
  if(!vdOff&&P&&P.venusDisc>0&&c>1)c-=1;
  return c}}
{const _c=cast;cast=async function(sp){const P=G&&G.p[G.active];let use=false;
  if(NET.role!=="guest"&&P&&P.venusDisc>0&&sp&&!(G.busy&&!P.cpu)){vdOff=true;const raw=spellCost(sp);vdOff=false;use=raw>1&&spellReady(sp)}
  const out=await _c.apply(this,arguments);
  if(use){P.venusDisc--;log(`The Oath of Venus takes 1 mana off ${plName(P.i)}'s ${esc(sp.name)} (${P.venusDisc} discount${P.venusDisc===1?"":"s"} left).`)}
  return out}}
{const _rs=rollStack;rollStack=function(st,mode){const out=_rs.apply(this,arguments);
  if(mode==="def"&&st&&st.owner!=null&&!hasK(st,"satan")&&venusDefOn(st.owner)&&out&&out.parts){out.total+=2;out.parts.push("Venus +2")}
  return out}}

/* ---------- the texts built again after the changes above ---------- */
{const s=SP("gamble"),t=SPELL_TEXT.gamble;if(s&&t)s.text=[t.n,t.e,t.l].filter(Boolean).join(" ")}

/* ---------- the computer: Gamble II, bounties, Venus ---------- */
{const _ap=aiPlanets;aiPlanets=async function(pl,W,cast1){await _ap(pl,W,cast1);if(G.over)return;const P=G.p[pl],lv=P.cpu;
  if(oathNow(pl,"earth")&&mana(pl)>=2&&Math.random()<(P.earthJoker?.7:.2))await cast1("gamble2");
  if(lv!=="easy"&&bountyCanTake(pl)&&!bountiesOf().some(b=>b.state==="taken"&&b.by===pl)&&mana(pl)>=3&&Math.random()<.5){
    const b=bountiesOf().filter(o=>o.state==="open"&&o.target!==pl&&isEnemy(pl,o.target)).sort((x,y)=>y.owed-x.owed)[0];if(b)acceptBounty(pl,b.id)}
  for(const b of bountiesOf().filter(o=>o.state==="taken"&&o.by===pl)){
    for(const x of stacksOf(pl))if(x.st.captive&&x.st.captive.capturedFrom===b.target)turnInCapt(pl,x.r,x.c);
    if(b.state==="taken"&&bountyColls(b).length<2&&mana(pl)>=BOUNTY_COLL+2)buyBountyColl(pl,b.id)}
  if(oathNow(pl,"venus")&&mana(pl)>=5){const to=alliesOf(pl).filter(i=>!isHorde(i)&&!isNPC(i)&&!G.p[i].out&&debtOf(i)+owedOf(i)>0)[0];if(to!=null)payDebtFor(pl,to,Math.min(mana(pl)-2,debtOf(to)+owedOf(to)))}
}}

/* ---------- the Bank window: the Bounties tab; Venus pays debts between players ---------- */
function bountyHTML(V){const live=canAct()&&G.phase==="prep"&&G.active===V,can=bountyCanTake(V),L=bountiesOf().filter(bountyLive);
  const why=!bankOpen()?"The Bank is closed.":bountyBanned(V)?"You failed a bounty: wait for the next Report.":!(oathNow(V,"mercury")||planetUp("mercury"))?"Only the Oath of Mercury takes bounties, or anyone while Mercury is in the sky.":"";
  const row=b=>{const mine=b.by===V,cs=b.state==="taken"&&mine?bountyColls(b).length:0;
    const caps=mine?stacksOf(V).filter(x=>x.st.captive&&x.st.captive.capturedFrom===b.target):[];
    return `<li class="bnty${mine?" mine":""}"><b>${plName(b.target)}</b> owes <b>${b.owed}</b>${b.state==="taken"?` · ${mine?"yours":`hunted by ${plName(b.by)}`}: ${Math.min(b.got,b.owed)} of ${b.owed} collected, ${Math.max(0,b.due-(G.reportN||0))} Report${b.due-(G.reportN||0)===1?"":"s"} left`:""}
${b.state==="open"&&b.target!==V?`<button class="btn sm" data-bacc="${b.id}" ${live&&can?"":"disabled"}>Accept</button>`:""}
${mine?`<button class="btn sm" data-bcol="${b.id}" ${live&&cs<BOUNTY_MAXC&&canAfford(V,BOUNTY_COLL)?"":"disabled"}>Buy a Debt Collector (${BOUNTY_COLL} mana) · ${cs}/${BOUNTY_MAXC}</button>${caps.map(x=>`<button class="btn ghost sm" data-bcap="${x.r},${x.c}" ${live?"":"disabled"}>Turn in the captured ${esc(nameOf(x.st.captive))} (${costOf(x.st.captive)||1})</button>`).join("")}`:""}</li>`};
  return `<p class="dim">Each Report puts a bounty on everyone in bad standing. Take one and buy Debt Collectors (2 mana) that hunt only that player, a teammate too, with no betrayal. Their kills, and captured support cards you turn in, pay off the debt. Finish within two Reports: half the debt is yours, and your own Bank debts are forgiven. Fail: your Collectors go to the Bank, your other bounties end, and you wait one Report.</p>
${why?`<p class="bwhy">${why}</p>`:""}${L.length?`<ul class="p2pl bntyl">${L.map(row).join("")}</ul>`:`<p class="dim">No bounties right now.</p>`}`}
{const _ob=openBank;openBank=function(){_ob();const box=$("#ov .ovbox.bank");if(!box||!G)return;const V=view(),live=canAct()&&G.phase==="prep"&&G.active===V;
  const tabs=box.querySelector(".btabs");
  if(tabs&&!tabs.querySelector('[data-bt="bounty"]')&&!survival()){const n=bountiesOf().filter(b=>b.state==="open"&&b.target!==V).length;
    tabs.insertAdjacentHTML("beforeend",`<button type="button" class="stab" data-bt="bounty">Bounties${n?` <i class="bang">${n}</i>`:""}</button>`);
    const pane=document.createElement("div");pane.className="btab bounty";pane.dataset.t="bounty";pane.innerHTML=bountyHTML(V);pane.hidden=true;(box.querySelector(".btab.report")||box.querySelector(".btab.land")).after(pane);
    const show=t=>{tabs.querySelectorAll("[data-bt]").forEach(b=>{const on=b.dataset.bt===t;b.classList.toggle("on",on);b.setAttribute("aria-selected",on)});box.querySelectorAll(".btab").forEach(p=>p.hidden=p.dataset.t!==t);bankTab=t};
    tabs.querySelectorAll("[data-bt]").forEach(b=>b.onclick=()=>show(b.dataset.bt));if(bankTab==="bounty")show("bounty");
    const again=()=>{bankTab="bounty";render();openBank()};
    pane.querySelectorAll("[data-bacc]").forEach(b=>b.onclick=()=>{acceptBounty(V,+b.dataset.bacc);again()});
    pane.querySelectorAll("[data-bcol]").forEach(b=>b.onclick=()=>{buyBountyColl(V,+b.dataset.bcol);again()});
    pane.querySelectorAll("[data-bcap]").forEach(b=>b.onclick=()=>{const [r,c]=b.dataset.bcap.split(",").map(Number);turnInCapt(V,r,c);again()})}
  const p2p=box.querySelector(".btab.p2p");
  if(p2p&&live&&oathNow(V,"venus")){const owe=alive().filter(i=>i!==V&&!isHorde(i)&&!isNPC(i)&&debtOf(i)+owedOf(i)>0),m=Math.max(0,mana(V));
    p2p.insertAdjacentHTML("beforeend",`<h3>Pay a debt (the Oath of Venus)</h3>${owe.length?`<p class="p2pask"><label>For <select id="vTo">${owe.map(i=>`<option value="${i}">${esc(G.p[i].name)} (owes ${debtOf(i)+owedOf(i)})</option>`).join("")}</select></label>
 <label><select id="vN">${Array.from({length:Math.max(1,m)},(_,i)=>`<option>${i+1}</option>`).join("")}</select> mana</label> <button class="btn sm" id="vPay" ${m?"":"disabled"}>Pay</button></p><p class="dim">Every 1d2 paid takes 1 mana off one of your next buys. 6 or more at once: +2 on defense for 2d3 turns.</p>`:`<p class="dim">Nobody owes the Bank right now.</p>`}`);
    const b=$("#vPay");if(b)b.onclick=()=>{payDebtFor(V,+$("#vTo").value,+$("#vN").value);bankTab="p2p";render();openBank()}}}}

/* ---------- the tags beside a player ---------- */
{const _et=econTags;econTags=function(P){const t=_et(P);if(!G||isHorde(P.i)||isNPC(P.i))return t;
  const b=bountyOn(P.i);if(b)t.push(`<span class="debttag" data-tip="The Bank has a bounty on this player: ${b.owed} mana owed.${b.state==="taken"?` Hunted by ${esc(G.p[b.by].name)}.`:""}">Bounty ${b.owed}</span>`);
  const h=bountiesOf().filter(o=>o.state==="taken"&&o.by===P.i).length;if(h)t.push(`<span class="oathtag" data-tip="Hunting ${h} bount${h>1?"ies":"y"} for the Bank.">Hunting ${h}</span>`);
  if(P.venusDisc>0)t.push(`<span class="saletag" data-tip="The Oath of Venus: each takes 1 mana off one of the next buys that cost more than 1.">Venus −${P.venusDisc}</span>`);
  if(venusDefOn(P.i))t.push(`<span class="oathtag" data-tip="The Oath of Venus: +2 on defense until turn ${P.venusDef}.">Venus guard</span>`);
  if(P.earthJoker)t.push(`<span class="oathtag" data-tip="The Oath of the Earth: doubled odds on the next Gambling or Gamble II.">Earth luck</span>`);
  if(bountyBanned(P.i))t.push(`<span class="debttag" data-tip="Failed a bounty: no bounties until the next Report.">No bounties</span>`);
  return t}}

if(window.__EC)Object.assign(window.__EC,{saturnBreak,acceptBounty:(...a)=>acceptBounty(...a),buyBountyColl:(...a)=>buyBountyColl(...a),turnInCapt:(...a)=>turnInCapt(...a),bountyReport,bountiesOf,payDebtFor:(...a)=>payDebtFor(...a),
  bankReport:(...a)=>bankReport(...a),attackOptions:(...a)=>attackOptions(...a),spellCost:(...a)=>spellCost(...a),cast:(...a)=>cast(...a),toggleOath:(...a)=>toggleOath(...a),bury:(...a)=>bury(...a),blessing:(...a)=>blessing(...a),floorOf,fullIn,moonFullNow,oathRound:(...a)=>oathRound(...a),aiMoonOath,turnAsync:(...a)=>turnAsync(...a),openDrawer:(...a)=>openDrawer(...a)});
