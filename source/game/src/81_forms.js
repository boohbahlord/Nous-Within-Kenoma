/* ---------- v71o: the cycle events of Mars, Jupiter, Saturn and the Second Sun, named after their Forms ----------
   Every sixth round a Heavenly Body has hung in the sky (like Venus's and Mercury's cycles; off with the Cycle events option):
   - Mars, the Form of Strife: every attack adds 1d2 that round, and a stack that kills may move one tile at once (a person
     picks the tile or Cancels to stay; a computer, or Field Automation, steps when the tile is better).
   - Jupiter, the Form of Abundance: every Bank loan shrinks by 1d3, and whoever has the fewest cards on the field (everyone
     tied for it) picks one of three cards from the Ether, free, into their hand.
   - Saturn, the Form of Limitation: the toll is taken twice that round; whoever pays both in full gets one more maximum mana,
     for good.
   - The Second Sun, the Form of Judgement: it judges everyone at once (their own countdown keeps running), and for that round
     it shows what hides on the field: face-down cards, Assassins, ambushes and Scouts (not hands). */
const FORM_CYC_NAME={mars:"The Form of Strife",jupiter:"The Form of Abundance",saturn:"The Form of Limitation",sun:"The Form of Judgement"};
const FORM_OF={mars:"Mars",jupiter:"Jupiter",saturn:"Saturn",sun:"the Second Sun"};
const FORM_LINE={mars:"every attack adds 1d2, and a stack that kills may move one tile at once.",
  jupiter:"every Bank loan shrinks by 1d3, and whoever has the fewest cards on the field takes a free card from the Ether.",
  saturn:"the toll is taken twice; whoever pays both in full gets one more maximum mana, for good.",
  sun:"it judges everyone at once, and shows what hides on the field: face-down cards, Assassins, ambushes and Scouts."};
const capF=s=>s.charAt(0).toUpperCase()+s.slice(1);
/* the sky box's line: this round, or when it comes */
function formLine(k,nx){const nm=FORM_CYC_NAME[k];
  return cycleNow(k)?`<b>${nm}</b>, ${FORM_OF[k]}'s cycle, this round: ${FORM_LINE[k]}`:`${capF(FORM_OF[k])}'s cycle every ${CYCLE} rounds, ${nm.replace(/^The/,"the")}: ${FORM_LINE[k]} Next: round ${nx}.`}
const formOn=k=>!!(G&&G.formCyc&&G.formCyc.k===k&&G.formCyc.round===G.moon.round&&planetUp(k)&&!cyclesOff());

/* ---------- the start of the round (called from cycleRound, after Venus's and Mercury's) ---------- */
async function formCycle(){if(!G||G.over||cyclesOff())return;const k=sky();if(!FORM_CYC_NAME[k]||!cycleNow(k))return;
  G.formCyc={k,round:G.moon.round};later(()=>planetFX(k));
  try{const s=SKY_SND[k];if(s&&AUD[s])AUD[s]();if(hostOnline()&&s)netFX({k:"snd",s})}catch(e){}
  if(k==="mars")return marsForm();if(k==="jupiter")return jupiterForm();if(k==="saturn")return saturnForm();if(k==="sun")return sunForm()}

/* Mars: the announcement; the dice and the step are below */
function marsForm(){log(`<b>The Form of Strife</b> (Mars's cycle): every attack adds 1d2 this round, and a stack that kills may move one tile at once.`,"event");
  popup("The Form of Strife",`<p>Mars's cycle. This round every attack adds 1d2, and a stack that kills may move one tile at once, wherever its cards can step.</p>`)}
{const _rs=rollStack;rollStack=function(st,mode){const out=_rs.apply(this,arguments);
  if(mode==="atk"&&out&&out.parts&&st&&formOn("mars")&&!hasK(st,"satan")){const v=R(2);out.total+=v;if(out.dice)out.dice.push({s:2,v});out.parts.push(`Strife +${v}`)}   // Satan takes no modifiers
  return out}}
/* a kill: the attacking stack may step one tile (only for an attack made as an attack, not an ambush on a move) */
let strifeIn=0,strifePend=null;
{const _ar=attackRun;attackRun=function(r1,c1,r2,c2){const A=G.board[r1]&&G.board[r1][c1],D=G.board[r2]&&G.board[r2][c2],n0=D?D.cards.length:0;const out=_ar.apply(this,arguments);
  try{if(strifeIn===1&&A&&D&&formOn("mars")&&G.board[r1][c1]===A&&(G.board[r2][c2]!==D||D.cards.length<n0))strifePend={A,r:r1,c:c1}}catch(e){console.error(e)}
  return out}}
{const _a=attack;attack=function(){strifeIn++;if(strifeIn===1)strifePend=null;let out;try{out=_a.apply(this,arguments)}finally{strifeIn--}
  const p=strifeIn===0?strifePend:null;if(p){strifePend=null;try{strifeStep(p.A,p.r,p.c)}catch(e){console.error(e)}}
  return out}}
function strifeTargets(A,r,c){const grp=A.cards.filter(x=>!isBase(x));if(!grp.length||hasBase(A))return [];   // a base doesn't step
  const old=G.sel,was=A.moved;G.sel={r,c,pick:new Set(grp.map(x=>x.id))};A.moved=false;let tg=[];try{tg=moveTargets()}finally{A.moved=was;G.sel=old}
  return tg.filter(([a,b])=>Math.max(Math.abs(a-r),Math.abs(b-c))===1&&!G.board[a][b])}   // one tile, onto open ground (it doesn't join a stack that may still attack)
function strifeMove(A,r,c,tr,tc){const pl=A.owner;if(G.board[r][c]!==A||G.over)return;
  G.sel={r,c,pick:new Set(A.cards.filter(x=>!isBase(x)).map(x=>x.id))};G.mode=null;doMove(tr,tc);
  const N=G.board[tr]&&G.board[tr][tc];if(N&&N.owner===pl){N.attacked=true;N.moved=true}   // the step is the kill's reward: no second attack
  log(`<b>Strife</b>: ${plName(pl)}'s stack steps from ${coord(r,c)} to ${coord(tr,tc)} after its kill.`,"event")}
function strifeStep(A,r,c){const pl=A.owner,P=G.p[pl];if(pl==null||!P||P.out||isNPC(pl)||isHorde(pl))return;
  const tg=strifeTargets(A,r,c);if(!tg.length)return;
  if(P.cpu||G.busy){   // a computer, or Field Automation: steps when the tile is better
    const S={cards:A.cards.filter(x=>!isBase(x)),owner:pl,hypo:A.hypo},W=AI.stance(pl),stay=AI.tileScore(pl,S,r,c,W,true);let best=null;
    for(const [a,b] of tg){const s=AI.tileScore(pl,S,a,b,W,true);if(!best||s>best.s)best={a,b,s}}
    if(best&&best.s>stay+.15){const keep=G.sel;strifeMove(A,r,c,best.a,best.b);G.sel=P.cpu?null:keep}
    return}
  setTimeout(async()=>{if(!G||G.over||G.board[r][c]!==A||G.aim)return;const was=G.busy;G.busy=true;let t=null;
    try{t=await aimTile(pl,"The Form of Strife: your stack killed. Click a marked tile to move it one tile, or Cancel to stay.",(a,b)=>strifeTargets(A,r,c).some(([x,y])=>x===a&&y===b),()=>null)}
    finally{G.busy=was}
    if(t&&G.board[r][c]===A&&strifeTargets(A,r,c).some(([x,y])=>x===t[0]&&y===t[1]))strifeMove(A,r,c,t[0],t[1]);render()},0)}

/* Jupiter: loans shrink, and the one with the fewest cards on the field takes a card from the Ether */
async function jupiterForm(){const rows=[];
  for(const pl of realPlayers()){const P=G.p[pl];if(P.out||!(P.loans||[]).some(L=>L.owed>0))continue;
    const d=R(3);let left=d;for(const L of P.loans){if(left<=0)break;const x=Math.min(left,Math.max(0,L.owed));L.owed-=x;left-=x}
    P.loans=P.loans.filter(L=>L.owed>0);tray(pl,"Jupiter's cycle",[{s:3,v:d}],"off your loans",true);rows.push(`${plName(pl)} −${d-left}`)}
  const live=realPlayers().filter(pl=>!G.p[pl].out),cnt=pl=>stacksOf(pl).reduce((a,x)=>a+x.st.cards.length,0),low=live.length?Math.min(...live.map(cnt)):0,who=live.filter(pl=>cnt(pl)===low);
  log(`<b>The Form of Abundance</b> (Jupiter's cycle): ${rows.length?`Bank loans shrink by 1d3 (${rows.join(", ")})`:"nobody owes the Bank a loan"}; ${who.length&&G.ether.length?`${who.map(plName).join(", ")} ${who.length>1?"have":"has"} the fewest cards on the field (${low}) and take${who.length>1?"":"s"} a card from the Ether`:"the Ether has nothing to give"}.`,"event");
  popup("The Form of Abundance",`<p>Jupiter's cycle. Every Bank loan shrinks by 1d3, and whoever has the fewest cards on the field takes a free card from the Ether into their hand.</p>
<p>${rows.length?`Loans: ${rows.join(", ")}.`:"Nobody owes the Bank a loan."}</p><p>${who.length&&G.ether.length?`Fewest cards on the field (${low}): ${who.map(plName).join(", ")}.`:"The Ether has nothing to give."}</p>`);
  for(const pl of who){if(G.over||!G.ether.length)break;await jupiterGift(pl)}}
async function jupiterGift(pl){const P=G.p[pl],pool=[...G.ether],offer=[],seen=new Set();
  while(pool.length&&offer.length<3){const c=pool.splice(Math.floor(Math.random()*pool.length),1)[0],k=c.unit||c.rank;if(seen.has(k)&&pool.some(x=>!seen.has(x.unit||x.rank)))continue;seen.add(k);offer.push(c)}   // three different cards when it can
  if(!offer.length)return;
  const best=()=>{let b=0;offer.forEach((c,i)=>{if(etherPrice(c)>etherPrice(offer[b]))b=i});return b};
  let i=await ask(pl,{kind:"cards",id:"jupgift",title:`The Form of Abundance: ${esc(P.name)} takes a card from the Ether, free`,sub:"It goes into your hand (into your deck if your hand is full).",cards:offer,ai:best});
  if(i==null||!offer[i])i=best();const c=offer[i],j=G.ether.indexOf(c);if(j<0)return;
  G.ether.splice(j,1);c.owner=pl;if(c.hp!=null&&c.maxHp!=null)c.hp=c.maxHp;
  if(P.hand.length<handCap(pl))P.hand.push(c);else{P.deck.push(c);shuffle(P.deck)}
  log(`Jupiter gives ${plName(pl)} ${esc(nameOf(c))} from the Ether.`);render()}

/* Saturn: the toll is taken twice; both paid in full gives a maximum mana for good */
function saturnForm(){log(`<b>The Form of Limitation</b> (Saturn's cycle): this round the toll is taken twice, and whoever pays both in full gets one more maximum mana for good.`,"event");
  popup("The Form of Limitation",`<p>Saturn's cycle. This round everyone who owes Saturn pays its toll twice, at the start of their turn. Pay both in full and your maximum mana rises by one, for good.</p>`)}
let satLast=null;
{const _sp=saturnPaid;saturnPaid=function(pl,paid,n){satLast={pl,full:paid>=n};return _sp.apply(this,arguments)}}
{const _st=saturnToll;saturnToll=async function(pl){if(!formOn("saturn"))return _st.apply(this,arguments);
  satLast=null;await _st.apply(this,arguments);const a=satLast;if(!a||a.pl!==pl||G.over)return;   // nothing owed
  G.satSecond=true;satLast=null;log(`<b>The Form of Limitation</b>: Saturn takes ${plName(pl)}'s toll a second time.`,"event");
  try{await _st.apply(this,arguments)}finally{G.satSecond=false}
  const b=satLast;if(G.over||!a.full||!b||b.pl!==pl||!b.full)return;
  const P=G.p[pl];P.maxAdd=(P.maxAdd||0)+1;log(`<b>Saturn</b> rewards ${plName(pl)}: both tolls paid in full, one more maximum mana for good.`,"event");
  notify(pl,`${esc(P.name)} paid Saturn twice: one more maximum mana, for good.`);render()}}

/* the Second Sun: everyone is judged now; their own countdown keeps running */
async function sunForm(){log(`<b>The Form of Judgement</b> (the Second Sun's cycle): it judges everyone at once, and shows what hides on the field this round.`,"event");
  popup("The Form of Judgement",`<p>The Second Sun's cycle. It judges everyone now (not the Firmament), and until the end of the round it shows everything that hides on the field: face-down cards, Assassins, ambushes and Scouts.</p>`);
  G._vis=null;
  for(const pl of roundOrder()){const P=G.p[pl];if(!P||P.out||isHorde(pl)||P.tribe==="firm")continue;
    const keep={n:P.sunNext,f:P.sunFrom};P.sunNext=tnOf(pl);G.skyGlow=true;render();
    try{await skyAsync(pl)}finally{P.sunNext=keep.n;P.sunFrom=keep.f;G.skyGlow=false}
    if(G.over)return}
  render()}
/* what hides on the field shows (not through blindness, a Delusion or Quiet Eyes) */
const sunShows=V=>V!=null&&formOn("sun")&&!totalBlind(V)&&!sunBlind(V)&&!blindFor(V)&&!choked(V)&&!(typeof quietNow==="function"&&quietNow(V));
{const _s=seesTile;seesTile=function(V,r,c){const out=_s.apply(this,arguments);if(out)return out;const st=G.board[r]&&G.board[r][c];return !!(st&&stealthy(st)&&sunShows(V))}}
{const _sb=showsBack;showsBack=function(V){if(sunShows(V))return false;return _sb.apply(this,arguments)}}

if(window.__EC)Object.assign(window.__EC,{formCycle:()=>formCycle(),formOn:k=>formOn(k),strifeTargets:(...a)=>strifeTargets(...a),jupiterGift:pl=>jupiterGift(pl),saturnTollW:pl=>saturnToll(pl),attackW:(...a)=>attack(...a),seesTileW:(...a)=>seesTile(...a),showsBackW:(...a)=>showsBack(...a),strifeStepW:(...a)=>strifeStep(...a)});
