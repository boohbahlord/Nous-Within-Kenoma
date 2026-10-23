/* ---------------- v71 ----------------
   - The sky changes (host setting, Rules tab): by bidding (default), never by itself, every few cycles, or every few rounds
     (a number or dice, 100 at most; by rounds, a new Heavenly Body can start at a random point of its cycle). Cycle events
     and eclipses can each be turned off.
   - Bidding: every 2 + 1d2 − 1 completed cycles the Heavenly Body announces that it is leaving. Each player bids mana in
     secret to keep it for one more cycle or to see it go, or passes. The highest bid wins (keeping wins a tie), and only
     the winner pays, to the Bank; a player under that Heavenly Body's Oath has their bid count half again on a 2 of 1d2.
     If nobody bids to keep it, a new Heavenly Body takes the sky. */

/* the bid: Keep it or Let it go, an amount with arrows, Bid or Pass; nobody sees the others' bids */
{const _ah=askHuman;askHuman=function(pl,spec){if(!spec||spec.kind!=="bid")return _ah.apply(this,arguments);
  return new Promise(res=>{const max=Math.max(0,Math.floor(spec.max||0));let n=Math.min(Math.max(1,spec.n||1),Math.max(1,max)),side=null;
    const who=G.p.filter(P=>!P.cpu).length>1&&!G.opts.online?`<p class="dim">${esc(G.p[pl].name)} bids. The others don't see it.</p>`:"";
    const paint=()=>{ovShow(`<div class="ovbox bidbox" role="dialog" aria-labelledby="bidh"><h2 id="bidh">${spec.title}</h2>${who}<p>${spec.text}</p>
<div class="opts bidside">${[["keep",spec.keepLabel||"Keep it"],["go",spec.goLabel||"Let it go"]].map(([k,t])=>`<label class="opt"><input type="radio" name="bidside" value="${k}" ${side===k?"checked":""} ${max<1?"disabled":""}><span>${t}</span></label>`).join("")}</div>
<p class="skynum bidamt"><button type="button" class="mstep" data-bd="-1" aria-label="less" ${max<1?"disabled":""}>◀</button> <b id="bidn">${max<1?0:n}</b> mana <button type="button" class="mstep" data-bd="1" aria-label="more" ${max<1?"disabled":""}>▶</button> <span class="dim">you have ${max}</span></p>
${max<1?`<p class="dim">You have no mana to bid.</p>`:""}
<p class="acts"><button type="button" class="btn" id="bidOk" ${side&&max>=1?"":"disabled"}>Bid</button> <button type="button" class="btn ghost" id="bidPass">Pass</button></p></div>`);
      document.querySelectorAll('input[name=bidside]').forEach(i=>i.onchange=()=>{side=i.value;paint()});
      document.querySelectorAll('[data-bd]').forEach(b=>b.onclick=()=>{n=Math.max(1,Math.min(max,n+ +b.dataset.bd));$("#bidn").textContent=n});
      $("#bidOk").onclick=()=>{if(!side||max<1)return;ovHide();res({side,n})};$("#bidPass").onclick=()=>{ovHide();res(null)}};
    paint()})}}

/* ---------- the engine: counted at the start of every round, after the sky has turned and its cycle events have run ---------- */
const SKYCHG=()=>Object.assign({mode:"bid",dice:false,n:4,dn:2,ds:6,rand:false},G.opts.skyChange||{});
const skyEvery=o=>Math.max(1,Math.min(100,o.dice?sum(rollN(Math.max(1,o.dn),o.ds)):o.n));
const skyFixed=k=>["off","eaten","fallen"].includes(k);   // no Heavenly Body there to change
/* a cycle of the body in the sky completes this round: the Moon at the Full Moon, the others every eighth round (v75a) */
const cycLen=k=>CYCLE;   // v75a: every Heavenly Body's cycle as long as the Moon's, Neptune's too
/* v71i: an eclipse can only come in a round of its Heavenly Body's cycle event: the round its cycle comes round (every
   eighth round it has hung in the sky), or for Neptune any round of its cycle (every eighth round, for one round). Rolled
   before the round's cycle events, so a Heavenly Body that has just risen waits for its first cycle. */
function ecCycleNow(k){if(!G||G._skyK!==k||!planetUp(k))return false;const r=G.moon.round,s=G.skySince;
  if(k==="neptune")return !!(G.nepEv&&r>=G.nepEv.from&&r<=G.nepEv.until)||s!=null&&r>s&&(r-s)%cycLen(k)===0;
  return cycleNow(k)}
/* v71q: Eclipse mode: every cycle event is an eclipse */
function ecChance(){return G&&(G.opts.eclipseMode||G.opts.eclipseAlways)?1:.05}
const cycleDone=k=>k==="moon"?G.moon.i===4&&G.moon.round>(G.skyArr||0):G.skySince!=null&&G.moon.round>G.skySince&&(G.moon.round-G.skySince)%cycLen(k)===0;
function skyArrive(){const o=SKYCHG(),k=sky();G._chgK=k;G.skyCyc=0;G.skyArr=G.moon.round;
  G.skyKeepAt=o.mode==="bid"?2+R(2)-1:null;G.skyEveryN=o.mode==="cycles"||o.mode==="rounds"?skyEvery(o):null}
/* a new Heavenly Body, picked at random from those that can take the sky (not the one leaving, nothing eaten or banned) */
function skyPick(){const old=sky(),ban=new Set(G.opts.planetBan||[]);const pool=SHOP_PL.filter(k=>k!==old&&!isEaten(k)&&!ban.has(k));return pool.length?pick(pool):null}
function skySwap(k,why){const old=sky(),o=SKYCHG();
  if(G.eclipse)endEclipse();
  if(G.moonLev&&(k==="saturn"||k==="sun")){const L=G.moonLev;G.moonLev=null;L.card.hp=L.card.maxHp;G.p[L.owner].deck.push(L.card);shuffle(G.p[L.owner].deck);log(`The Leviathan can't lie on ${skyWord(k)}: it falls back into ${plName(L.owner)}'s deck.`,"event")}
  if(PLANETS[k])setPlanet(k,null);
  else{   // Oaths hold whatever is in the sky (v50)
    G.moon.gone=k==="moon"?null:k;G.moon.i=k==="moon"?(o.rand?R(8)-1:0):-1;G.moon.blood=false;G.planetBy=null;
    checkMoonMiner();if(old==="jupiter")G.jupSale=null}
  if(k==="saturn"){G.saturnBy=null;G.saturnDebt=0}else if(old==="saturn")G.saturnBy=null;
  if(old==="venus")G.venus=null;
  if(k==="jupiter")rollJupSale();
  G._skyK=k;G.skySince=G.moon.round-(o.rand&&o.mode==="rounds"&&k!=="moon"?R(CYCLE)-1:0);   // a random start can put its event only a round or two away
  G._vis=null;applyMoonTheme();skyArrive();
  log(`<b>${esc(SHOP_NAME[k])}</b> takes the sky: it replaces ${skyWord(old)} (${why}).`,"event");
  popup(`${SHOP_NAME[k]} takes the sky`,`<p><b>${esc(SHOP_NAME[k])}</b> replaces ${skyWord(old)} (${esc(why)}).</p>${k==="moon"?`<p>The Moon comes back as ${MOON[G.moon.i].replace(/^(\w)/,c=>/[AEIOU]/.test(c)?"an "+c:"a "+c)}.</p>`:""}`)}
/* the bid: everyone at once, in secret; keeping wins a tie; only the winner pays, to the Bank */
function aiSkyBid(pl,k){const P=G.p[pl],m=mana(pl);if(m<2)return null;
  const mine=P.oath&&(P.oath===k||OATH_SKY[k]===P.oath);
  if(mine)return {side:"keep",n:Math.min(m-1,1+R(3))};
  if(k==="saturn"&&P.oath!=="saturn"&&!(G.saturnBy===pl))return Math.random()<.6?{side:"go",n:Math.min(m-1,1+R(2))}:null;
  return Math.random()<.2?{side:Math.random()<.5?"keep":"go",n:Math.min(m-1,R(2))}:null}
async function skyAuction(){const k=sky(),name=SHOP_NAME[k]||skyWord(k);
  log(`<b>${esc(name)}</b> has completed its ${G.skyCyc}${["th","st","nd","rd"][G.skyCyc%10>3||Math.floor(G.skyCyc/10)===1?0:G.skyCyc%10]} cycle and announces that it is leaving. Bids decide whether it stays for one more cycle.`,"event");
  notify(null,`${esc(name)} is leaving the sky: bid mana to keep it for one more cycle, or to see it go.`);
  const bids=[];
  for(const pl of realPlayers()){if(G.over)return;
    const b=await ask(pl,{kind:"bid",id:"skybid",title:`${esc(name)} is leaving`,text:`${esc(name)} has completed its cycle and will leave the sky. Bid mana to keep it for one more cycle, or to see it go; or pass. The highest bid wins (keeping wins a tie), and only the winner pays, to the Bank.${G.p[pl].oath&&(G.p[pl].oath===k||OATH_SKY[k]===G.p[pl].oath)?" Under its Oath, your bid counts half again on a 2 of 1d2.":""}`,
      max:mana(pl),keepLabel:`Keep ${skyWord(k)}`,goLabel:"Let it go",ai:()=>aiSkyBid(pl,k)});
    if(!b||!(b.n>0)||!["keep","go"].includes(b.side))continue;const n=Math.min(Math.floor(b.n),mana(pl));if(n<1)continue;
    const P=G.p[pl],oath=P.oath&&(P.oath===k||OATH_SKY[k]===P.oath);let eff=n,d=null;
    if(oath){d=R(2);if(d===2)eff=Math.floor(n*1.5);tray(pl,"Oath bid",[{s:2,v:d}],d===2?`×1.5: ${eff}`:`${eff}`)}
    bids.push({pl,side:b.side,n,eff})}
  const top=s=>bids.filter(b=>b.side===s).sort((a,b)=>b.eff-a.eff)[0]||null;
  const K=top("keep"),Gx=top("go"),list=bids.length?bids.map(b=>`${plName(b.pl)}: ${b.side==="keep"?"keep":"let go"} ${b.n}${b.eff!==b.n?` (counts ${b.eff})`:""}`).join(", "):"no bids";
  if(K&&(!Gx||K.eff>=Gx.eff)){payQuiet(K.pl,K.n);bankAdd(K.n);G.skyKeepAt=G.skyCyc+1;
    log(`<b>${esc(name)} stays</b> for one more cycle: ${plName(K.pl)}'s bid of ${K.n} wins (${list}).`,"event");
    popup(`${name} stays`,`<p>${plName(K.pl)} keeps ${skyWord(k)} in the sky for one more cycle with a bid of <b>${K.n}</b> mana (paid to the Bank).</p><p class="dim">Bids: ${list}.</p>`);return}
  if(Gx){payQuiet(Gx.pl,Gx.n);bankAdd(Gx.n)}
  const nk=skyPick();if(!nk){G.skyKeepAt=G.skyCyc+1;log(`No other Heavenly Body can take the sky: ${esc(name)} stays.`,"event");return}
  log(`<b>${esc(name)} leaves</b> (${K?`${plName(Gx.pl)}'s bid of ${Gx.n} beats keeping`:"nobody bid to keep it"}; ${list}).`,"event");
  skySwap(nk,K||Gx?"the bids decided":"nobody bid to keep the old one")}
async function skyChangeRound(){const o=SKYCHG(),k=sky();if(G.over||skyFixed(k))return;
  if(G._chgK!==k)skyArrive();   // a new Heavenly Body (the shop, a spell, the start of the game): its count starts over
  if(SH().pend)return;          // something bought rises next round
  const done=cycleDone(k);if(done)G.skyCyc++;
  if(o.mode==="bid"&&done&&G.skyCyc>=G.skyKeepAt)await skyAuction();
  else if(o.mode==="cycles"&&done&&G.skyCyc>=G.skyEveryN){const nk=skyPick();if(nk)skySwap(nk,`its ${G.skyCyc} cycles are over`)}
  else if(o.mode==="rounds"&&G.moon.round-G.skyArr>=G.skyEveryN){const nk=skyPick();if(nk)skySwap(nk,`its ${G.skyEveryN} rounds are over`)}
  render()}
{const _cr=cycleRound;cycleRound=async function(){await _cr.apply(this,arguments);await skyChangeRound()}}

/* ---------- cycle events and eclipses can be turned off ---------- */
const cyclesOff=()=>!!G&&G.opts.cycleEvents===false,eclipsesOff=()=>!!G&&G.opts.eclipses===false;
{const _v=venusCycle;venusCycle=function(){if(cyclesOff())return;return _v.apply(this,arguments)}}
{const _m=mercuryCycle;mercuryCycle=async function(){if(cyclesOff())return;return _m.apply(this,arguments)}}
{const _t=fullMoonToll;fullMoonToll=async function(){if(cyclesOff()){log("The Full Moon asks no toll: cycle events are off in this game.");return}return _t.apply(this,arguments)}}
{const _s=skyAsync;skyAsync=async function(pl){if(cyclesOff()&&sunUp()&&G.p[pl]){const P=G.p[pl];P.sunNext=tnOf(pl)+99}return _s.apply(this,arguments)}}   // no judgement
{const _e=eclipse;eclipse=async function(k){if(eclipsesOff())return;return _e.apply(this,arguments)}}
{const _ms=moonStart;moonStart=async function(){if(eclipsesOff()&&G.forceMoon==null&&!G.opts.bloodStart)G.forceMoon=0;return _ms.apply(this,arguments)}}   // no Blood Moon

/* ---------- the sky's lines: when it changes next ---------- */
function skyChgLine(){if(!G||!G.moon)return "";const o=SKYCHG(),k=sky();if(skyFixed(k)||o.mode==="never"||G._chgK!==k)return "";
  if(o.mode==="rounds"){const left=G.skyArr+G.skyEveryN-G.moon.round;return `A new Heavenly Body takes the sky in ${left} round${left===1?"":"s"}.`}
  const target=o.mode==="bid"?G.skyKeepAt:G.skyEveryN,leftC=Math.max(0,target-(G.skyCyc||0));
  return o.mode==="bid"?`Leaves after ${leftC===0?"this":leftC===1?"its next":`${leftC} more`} cycle${leftC>1?"s":""}, unless bids keep it (${G.skyCyc||0} of ${target} cycles done).`:`Leaves after ${leftC} more cycle${leftC===1?"":"s"} (${G.skyCyc||0} of ${target} done).`}
{const _ms=moonStrip;moonStrip=function(){const h=_ms.apply(this,arguments),l=skyChgLine();return l?h+`<p class="skychgl">${esc(l)}</p>`:h}}
/* ---------- v71: things the rules count in turns ---------- */
{const _bt=beginTurn;beginTurn=function(pl){const out=_bt.apply(this,arguments);
  if(G.fires)G.fires=G.fires.filter(f=>f.untilT==null||f.untilT>=G.turnNo);   // fire burns out after its turns
  if(G.peace&&G.peace.untilT!=null&&G.turnNo>G.peace.untilT){G.peace=null;log("<b>Peace ends.</b> The lines are open again.","event");notify(null,"Peace is over.")}   // bought Peace: two turns
  const B=G.bank;if(B&&B.owes)for(const o of B.owes)if(o.atT!=null&&G.turnNo>=o.atT){o.owed=Math.ceil(o.owed*1.2);o.atT=G.turnNo+R(2)}   // what the Bank owes grows 20% every 1d2 turns
  return out}}
if(window.__EC)Object.assign(window.__EC,{eclipseW:k=>eclipse(k),venusCycleW:()=>venusCycle(),fullMoonTollW:()=>fullMoonToll(),skyChangeRound:()=>skyChangeRound(),skySwap:(...a)=>skySwap(...a),skyAuction:()=>skyAuction(),skyArrive:()=>skyArrive(),skyChgLine:()=>skyChgLine(),cycleRoundW:()=>cycleRound()});
