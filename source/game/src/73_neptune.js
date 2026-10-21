/* ---------------- v71c: Neptune, the Form of Dissolve ----------------
   In the sky (the shop, a change of sky, or the start): every 4d2 turns a cloud in Neptune's blue settles over the tiles
   around the cards for 2d4 turns, drifting each turn. Its tiles are in fog for everyone (a tile with your own stack stays
   yours), even beside your cards. At the start of each player's turn in the cloud, a 1 on 1d20 loses one of their stacks
   for 1d3 + 1d2 − 1 of their turns: they can't see it or command it (nor can their automation), it never attacks, it
   defends itself, and it wanders. Found (another of their stacks beside it) it shows to them, see-through, as it does to
   everyone who can see it. Each round the first mana a player earns or spends rolls 1d20: a 1 sends it to another
   player (a spender still pays), a 20 doubles it. Its cycle (every ten rounds) and eclipse come next. */
const NEP_COL="#3f9be0";
const nepUp=()=>!!(G&&planetUp("neptune"));
const NEP=()=>G.nep||(G.nep={next:null,cloud:null});
const nepCloudOn=()=>nepUp()&&!!(G.nep&&G.nep.cloud);
const nepCloudAt=(r,c)=>nepCloudOn()&&G.nep.cloud.tiles.includes(r*100+c);
const stFights=st=>st.cards.some(c=>!isBase(c));
function nepCloudTiles(){const out=[];
  for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++){if(isVoid(r,c)||tileRole(r,c)==="water")continue;
    let near=false;for(let dr=-1;dr<=1&&!near;dr++)for(let dc=-1;dc<=1;dc++){const a=r+dr,b=c+dc;if(a>=0&&b>=0&&a<G.rows&&b<COLS&&G.board[a][b]){near=true;break}}
    if(near&&Math.random()<.45)out.push(r*100+c)}
  return out}
/* a word in Neptune's blue that rises over a tile, like a critical miss */
function nepMark(r,c,txt){if(!G||G.opts.fast)return;setTimeout(()=>{const b=document.querySelector(`#board button.tile[data-r="${r}"][data-c="${c}"]`);if(!b)return;
  const R0=b.getBoundingClientRect(),s=document.createElement("div");s.className="nepmark";s.textContent=txt;s.style.left=(R0.left+R0.width/2+scrollX)+"px";s.style.top=(R0.top+scrollY)+"px";
  document.body.appendChild(s);setTimeout(()=>s.remove(),1900)},80)}

/* ---------- each turn: the cloud comes and goes, lost stacks wander or are found, and a stack may be lost ---------- */
{const _bt=beginTurn;beginTurn=function(pl){const out=_bt.apply(this,arguments);if(!G||G.over)return out;
  if(!nepUp()){if(G.nep&&G.nep.cloud)G.nep.cloud=null;for(const P of G.p)for(const {st} of stacksOf(P.i))if(st.lost)st.lost=null;return out}
  const N=NEP(),t=G.turnNo;if(N.next==null)N.next=t+sum(rollN(4,2));
  if(N.cloud&&t>N.cloud.until){N.cloud=null;N.next=t+sum(rollN(4,2));G._vis=null;log("Neptune's cloud lifts.","event")}
  if(!N.cloud&&t>=N.next){const d=sum(rollN(2,4));N.cloud={until:t+d-1,tiles:nepCloudTiles()};G._vis=null;
    log(`<b>A cloud in Neptune's blue</b> settles over the field for ${d} turns (2d4): its tiles are in fog for everyone, and cards can be lost in it.`,"event");notify(null,"Neptune's cloud settles over the field.")}
  else if(N.cloud){N.cloud.tiles=nepCloudTiles();G._vis=null}   // the cloud drifts every turn
  for(const {st,r,c} of stacksOf(pl)){if(!st.lost)continue;
    if(tnOf(pl)>=st.lost.untilT){st.lost=null;log(`${plName(pl)} finds a lost stack again on ${coord(r,c)}.`,"event");notify(pl,`You find your lost stack on ${coord(r,c)}.`);continue}
    if(Math.random()<.6){const opts=[[1,0],[-1,0],[0,1],[0,-1]].map(([a,b])=>[r+a,c+b]).filter(([a,b])=>a>=0&&b>=0&&a<G.rows&&b<COLS&&!isVoid(a,b)&&tileRole(a,b)!=="water"&&!G.board[a][b]);
      if(opts.length){const [a,b]=pick(opts);G.board[a][b]=st;G.board[r][c]=null;G._vis=null}}}   // it wanders
  if(N.cloud&&!isNPC(pl)&&!isHorde(pl)&&R(20)===1){const pool=stacksOf(pl).filter(x=>!x.st.lost&&stFights(x.st)&&!hasBase(x.st));
    if(pool.length){const x=pick(pool),n=Math.max(1,R(3)+R(2)-1);x.st.lost={untilT:tnOf(pl)+n};G._vis=null;
      log(`<b>Lost in Neptune's cloud</b>: ${plName(pl)}'s stack on ${coord(x.r,x.c)} is lost for ${n} of their turns (1d3 + 1d2 − 1). They can't see or command it; it defends itself.`,"event");
      notify(pl,`Neptune's cloud: one of your stacks is lost for ${n} turn${n>1?"s":""}.`);nepMark(x.r,x.c,"Lost")}}
  return out}}

/* ---------- what the cloud hides, and what a lost stack can't do ---------- */
const nepFound=(st,r,c)=>stacksOf(st.owner).some(x=>x.st!==st&&Math.max(Math.abs(x.r-r),Math.abs(x.c-c))<=1);
function nepHidden(V,st,r,c){return !!(st&&st.lost&&V!=null&&st.owner===V&&!nepFound(st,r,c))}   // used by hiddenFrom (13_substances2)
{const _f=fogTile;fogTile=function(V,r,c){if(nepCloudAt(r,c)&&!(G.board[r][c]&&G.board[r][c].owner===V))return true;return _f.apply(this,arguments)}}
{const _s=seesTile;seesTile=function(V,r,c){const st=G.board[r]&&G.board[r][c];if(st&&V!=null&&isEnemy(st.owner,V)&&nepCloudAt(r,c))return false;return _s.apply(this,arguments)}}
{const _ao=attackOptions;attackOptions=function(r,c){const st=G.board[r]&&G.board[r][c];if(st&&st.lost)return [];return _ao.apply(this,arguments)}}
{const _mt=moveTargets;moveTargets=function(){const s=G.sel,st=s&&G.board[s.r]&&G.board[s.r][s.c];if(st&&st.lost)return [];return _mt.apply(this,arguments)}}
{const _cp=canPlace;canPlace=function(card,r,c){const st=G&&G.board[r]&&G.board[r][c];if(st&&st.lost)return false;return _cp.apply(this,arguments)}}
{const _sd=siegeDecor;siegeDecor=function(inner,st,V,r,c){const h=_sd.apply(this,arguments);return st&&st.lost?h.replace('class="stack ','class="stack nlost '):h}}
{const _r=render;render=function(){_r.apply(this,arguments);if(!nepCloudOn())return;
  for(const b of document.querySelectorAll("#board button.tile"))if(nepCloudAt(+b.dataset.r,+b.dataset.c)&&!b.querySelector(".nepcloud"))b.insertAdjacentHTML("beforeend",'<span class="nepcloud" aria-hidden="true"></span>')}}

/* ---------- stray mana: once a round each player's earning or spending may go astray (1) or double (20) ---------- */
let nepIn=false;
const nepStrayOk=pl=>nepUp()&&!nepIn&&!!G.p[pl]&&!G.p[pl].out&&!isNPC(pl)&&!isHorde(pl)&&G.p[pl].nepR!==G.moon.round;
const nepOther=pl=>{const o=G.p.filter(P=>P.i!==pl&&!P.out&&!isNPC(P.i)&&!isHorde(P.i)).map(P=>P.i);return o.length?pick(o):null};
{const _gm=giveMana;giveMana=function(pl,n){if(!(n>0)||!nepStrayOk(pl))return _gm.apply(this,arguments);
  const d=R(20);G.p[pl].nepR=G.moon.round;if(d!==1&&d!==20)return _gm.apply(this,arguments);   // one roll a round: the first mana earned or spent
  nepIn=true;
  try{if(d===1){const q=nepOther(pl);if(q==null)return _gm(pl,n);_gm(q,n);
      log(`<b>Neptune</b>: ${n} mana meant for ${plName(pl)} strays to ${plName(q)} (a 1 on 1d20).`,"event");notify(null,`Neptune: ${esc(G.p[pl].name)}'s ${n} mana strays to ${esc(G.p[q].name)}.`);return 0}
    const got=_gm(pl,2*n);log(`<b>Neptune</b> doubles the mana ${plName(pl)} earns: ${n} becomes ${2*n} (a 20 on 1d20).`,"event");notify(pl,`Neptune doubles your ${n} mana.`);return got}
  finally{nepIn=false}}}
{const _sp=spend;spend=function(pl,n){if(!(n>0)||!nepStrayOk(pl))return _sp.apply(this,arguments);
  const d=R(20);G.p[pl].nepR=G.moon.round;if(d!==1&&d!==20)return _sp.apply(this,arguments);
  nepIn=true;
  try{if(d===1){const q=nepOther(pl),out=_sp(pl,n);if(q!=null){const got=giveMana(q,n);if(G.bank)G.bank.mana-=got;
        log(`<b>Neptune</b>: the ${n} mana ${plName(pl)} spends strays to ${plName(q)} (a 1 on 1d20).`,"event");notify(null,`Neptune: ${esc(G.p[pl].name)}'s ${n} mana strays to ${esc(G.p[q].name)}.`)}return out}
    const out=_sp(pl,2*n);log(`<b>Neptune</b> doubles what ${plName(pl)} spends: ${n} becomes ${2*n} (a 20 on 1d20).`,"event");notify(pl,`Neptune doubles what you spend: ${2*n} instead of ${n}.`);return out}
  finally{nepIn=false}}}

/* ---------- its picture and its box ---------- */
function neptuneSVG(state){const ev=state==="event",ec=state==="eclipse";
  const ring=(o,w)=>`<ellipse rx="33" ry="6.2" fill="none" stroke="#bfe0fa" stroke-opacity="${o}" stroke-width="${w}"/>`;
  return `<svg class="moon neptune${ev?" nepev":""}${ec?" nepec":""}" viewBox="-44 -44 88 88" width="88" height="88" aria-hidden="true"><defs>
<radialGradient id="nepg" cx="36%" cy="32%"><stop offset="0" stop-color="#a8dcff"/><stop offset=".42" stop-color="#3f86dc"/><stop offset=".84" stop-color="#1c3f99"/><stop offset="1" stop-color="#0a1846"/></radialGradient>
<radialGradient id="nepglow"><stop offset="52%" stop-color="${NEP_COL}" stop-opacity="${ev?.62:ec?.5:.34}"/><stop offset="100%" stop-color="${NEP_COL}" stop-opacity="0"/></radialGradient>
<radialGradient id="nepdark"><stop offset="40%" stop-color="#14031f" stop-opacity=".95"/><stop offset="78%" stop-color="#3a0a52" stop-opacity=".55"/><stop offset="100%" stop-color="#000" stop-opacity="0"/></radialGradient>
<clipPath id="nepclip"><circle r="24"/></clipPath><clipPath id="nepfront"><rect x="-40" y="0" width="80" height="12"/></clipPath></defs>
${ec?`<circle r="43" fill="url(#nepdark)"/>`:""}<circle r="40" fill="url(#nepglow)"/><g transform="rotate(-14)">${ring(.28,1)}</g>
<circle r="24" fill="url(#nepg)" stroke="#0a1846"/>
<g clip-path="url(#nepclip)"><path d="M-26,-10C-12,-13 8,-8 26,-11" stroke="#cdeeff" stroke-width="1.3" fill="none" opacity=".45"/><path d="M-26,6C-10,3 10,8 26,4" stroke="#163f9a" stroke-width="3.2" fill="none" opacity=".7"/><path d="M-26,14C-8,12 9,16 26,13" stroke="#cdeeff" stroke-width="1" fill="none" opacity=".35"/>
<ellipse cx="-6" cy="3.6" rx="5.6" ry="3" fill="#0a1d57" opacity=".85"/><path d="M-11.5,0.6C-8,-0.8 -3,-0.6 0.4,1" stroke="#ecf8ff" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".9"/><path d="M9,-4C11,-5 14,-4.6 15.5,-3.6" stroke="#ecf8ff" stroke-width=".8" fill="none" stroke-linecap="round" opacity=".7"/></g>
<g transform="rotate(-14)" clip-path="url(#nepfront)">${ring(.55,1.2)}</g></svg>`}
{const _ps=planetSVG;planetSVG=function(k){if(k==="neptune")return neptuneSVG(G.eclipse&&G.eclipse.k==="neptune"?"eclipse":G.nepEv?"event":"");return _ps.apply(this,arguments)}}
{const _pi=planetInfoHTML;planetInfoHTML=function(k){if(k!=="neptune")return _pi.apply(this,arguments);
  const V=view(),L=[],N=G.nep||{};
  if(N.cloud){const left=N.cloud.until-G.turnNo+1;L.push(`A cloud in its blue covers ${N.cloud.tiles.length} tiles for ${left} more turn${left===1?"":"s"}: they are in fog for everyone, and at the start of a player's turn a 1 on 1d20 loses one of their stacks.`)}
  else L.push(N.next!=null?`The next cloud settles in ${Math.max(1,N.next-G.turnNo)} turn${N.next-G.turnNo===1?"":"s"} (every 4d2 turns, for 2d4).`:"Every 4d2 turns a cloud in its blue settles for 2d4 turns.");
  const lost=V!=null&&G.p[V]?stacksOf(V).filter(x=>x.st.lost).length:0;if(lost)L.push(`${lost} of your stacks ${lost===1?"is":"are"} lost in the cloud.`);
  L.push("The first mana each player earns or spends each round rolls 1d20: a 1 sends it to another player (a spender still pays), a 20 doubles it.","The moon's phases are stopped.");
  skyCommon(L);return skyBox("Neptune","",L,"neptune")}}
SKY_PARA.neptune="Neptune, the Form of Dissolve, stops the Moon's phases. Every 4d2 turns a cloud in its blue settles over the tiles around the cards for 2d4 turns, drifting with every turn. Its tiles are in fog for everyone, even beside your own cards (a tile with your own stack stays yours). At the start of each player's turn in the cloud, a 1 on 1d20 loses one of their stacks for 1d3 + 1d2 − 1 of their turns: they can't see it or command it, nor can their automation; it never attacks, defends itself, and wanders. Another of their stacks beside it finds it: then they see it, see-through, as everyone does. The first mana each player earns or spends each round rolls 1d20: a 1 sends it to another player (a spender still pays), a 20 doubles it. Its cycle, every ten rounds, lasts 2d3 rounds: the tiles fade into the map and everyone's numbers go dark; a sacrifice's mana goes to another player on a 1 of 1d8; the mana a purchase brings the Bank goes to a random player on a 1 of 1d10 (not in Survival); a drawn card is lost at sea on a 1 of 1d20 (another from the same draw on a 1 of 1d3), found 1d10 turns later by anyone; a card that dies sinks on a 1 of 1d4, to the Outer Darkness (1 on 1d2) or the Ether (2); at its start Neptune offers each player a free Clairvoyance or 2d6 + 1d2 mana for 1d6 deck cards; and once a round, on a 1 of 1d8, a player may sacrifice up to three cards from the grave for their soul worth. Its eclipse (5% in each round of its cycle) lasts 2d3 rounds and brings its whole cycle with it: everyone's numbers lie and hands go blank and shuffled, every deck is shuffled, names turn to random letters and numbers, every stack on the field takes a stranger's color (a stranger's stack can be picked up, but acting with it costs 1d2 deck cards; once a round, on a 1 of 1d6, it moves by accident), a 1 of 1d20 sends a move or an attack astray (twice a round at most), prices, the Ether's counts and the Bank's mana lie (one price in eight reads free), Field Automation and Lazy Hand wait (still On, crossed out), the field may turn around, and the music sinks an octave and a half step, muffled.";

/* ---------- v71c-2: Neptune's cycle, every ten rounds it has hung in the sky, for 2d3 rounds ----------
   It glows; the tiles lose their outlines into the map and everyone's numbers go dark. A sacrifice's mana goes to a random
   other player on a 1 of 1d8. Mana a purchase brings the Bank goes to a random player (the buyer too) on a 1 of 1d10 (not
   in Survival). A drawn card is lost on a 1 of 1d20 (another from that draw on a 1 of 1d3), found 1d10 turns later by any
   player. A card that dies goes, on a 1 of 1d4, to the Outer Darkness (1 on 1d2) or the Ether (2). Neptune offers each
   player at its start: give up 1d6 deck cards for a free Clairvoyance, or for 2d6 + 1d2 mana. Once a round, on a 1 of 1d8,
   a player may sacrifice up to three cards from the grave for their soul worth. Cycle events off: none of it. */
const nepEvOn=()=>nepUp()&&(!!G.nepEv&&G.moon.round<=G.nepEv.until||nepEcOn());   // its eclipse brings every effect of its cycle too
/* v71d: Lostness puts one player under Neptune's cycle (I) or eclipse (II) whatever is in the sky: these ask for one player */
const nepSelf=pl=>{const s=G&&pl!=null&&G.nepSelf&&G.nepSelf[pl];return s&&G.moon.round<=s.until?s:null};
const nepEvFor=pl=>nepEvOn()||!!nepSelf(pl);
const nepEcFor=pl=>nepEcOn()||!!(nepSelf(pl)&&nepSelf(pl).k==="ec");
const nepEcState=pl=>nepEcOn()?G.nepEc:nepSelf(pl)&&nepSelf(pl).k==="ec"?nepSelf(pl).st:null;
const nepRealPl=()=>G.p.filter(P=>!P.out&&!isNPC(P.i)&&!isHorde(P.i)).map(P=>P.i);
async function nepEventRound(){if(!nepUp()){G.nepEv=null;return}
  const r=G.moon.round;
  if(G.nepEv&&r>G.nepEv.until){G.nepEv=null;log("Neptune's cycle ends: the field and the numbers come back.","event");render()}
  const since=G.skySince;
  if(!G.nepEv&&!(typeof cyclesOff==="function"&&cyclesOff())&&since!=null&&r>since&&(r-since)%10===0){
    const d=sum(rollN(2,3));G.nepEv={from:r,until:r+d-1};
    log(`<b>Neptune's cycle</b> (every ten rounds): for ${d} rounds (2d3) the tiles fade into the map and every player's numbers go dark. Sacrifices, the Bank's takings and drawn cards may drift away; the dead may sink to the Ether or the Outer Darkness.`,"event");
    popup("Neptune's cycle",`<p>For <b>${d} round${d>1?"s":""}</b> (2d3) Neptune glows: the tiles fade into the map and every player's numbers go dark.</p><ul><li>A sacrifice's mana goes to another player on a 1 of 1d8.</li><li>Mana a purchase brings the Bank goes to a random player on a 1 of 1d10${survival()?" (not in Survival)":""}.</li><li>A drawn card is lost on a 1 of 1d20 (another from the same draw on a 1 of 1d3), and found 1d10 turns later by anyone.</li><li>A card that dies sinks, on a 1 of 1d4, to the Outer Darkness or the Ether.</li><li>Once a round a player may be let into the grave (a 1 of 1d8) to sacrifice its cards for mana.</li></ul>`);
    render();
    for(const pl of nepRealPl()){if(G.over)return;await nepOffer(pl)}}
  if(nepEvOn())for(const pl of nepRealPl()){if(G.over)return;if(R(8)===1)await nepGraveSac(pl)}}
{const _cr=cycleRound;cycleRound=async function(){await _cr.apply(this,arguments);if(G&&!G.over)await nepEventRound()}}
/* Neptune's offer: 1d6 deck cards for a free Clairvoyance (once, until used) or for 2d6 + 1d2 mana */
async function nepOffer(pl){const P=G.p[pl];if(!P.deck.length)return;
  const opts=[];if(!P.nepClair)opts.push({id:"clair",label:"A free Clairvoyance",sub:"your next one costs nothing"});opts.push({id:"mana",label:"2d6 + 1d2 mana",sub:"rolled now"},{id:"no",label:"Keep my cards"});
  const ch=await ask(pl,{kind:"choice",id:"nepoffer",title:"Neptune's offer",text:"Give up 1d6 cards from your deck to Neptune, for a free Clairvoyance (your next, once) or for 2d6 + 1d2 mana?",options:opts,ai:()=>P.deck.length>18&&Math.random()<.6?"mana":"no"});
  if(!ch||ch==="no")return;
  const n=R(6),gone=P.deck.splice(Math.max(0,P.deck.length-n),n);for(const c of gone)toDark(c);
  if(ch==="clair"){P.nepClair=true;log(`${plName(pl)} gives Neptune ${gone.length} deck card${gone.length===1?"":"s"} (1d6) for a free Clairvoyance.`,"event")}
  else{const d=[...rollN(2,6),...rollN(1,2)],m=sum(d),got=giveMana(pl,m);tray(pl,"Neptune's offer",d,`${m} mana`);log(`${plName(pl)} gives Neptune ${gone.length} deck card${gone.length===1?"":"s"} (1d6) for ${m} mana (2d6 + 1d2${got<m?`; ${got} fit`:""}).`,"event")}
  render()}
{const _sc=spellCost;spellCost=function(sp){if(sp&&sp.id==="clair"&&G&&G.p[G.active]&&G.p[G.active].nepClair)return 0;return _sc.apply(this,arguments)}}
{const sp=SP("clair");if(sp){const run=sp.run;sp.run=async function(){const P=G.p[G.active],free=!!(P&&P.nepClair);if(free)P.nepClair=false;const out=await run.apply(this,arguments);if(free)log(`${plName(G.active)}'s Clairvoyance is Neptune's gift: free.`);return out}}}
/* the grave opens to one player: up to three of its cards, sacrificed for their soul worth */
async function nepGraveSac(pl){let n=0;
  while(n<3&&G.grave.length&&!G.over){const i=await ask(pl,{kind:"cards",id:"nepgrave",title:`Neptune opens the grave to ${esc(G.p[pl].name)}: sacrifice a card for its soul worth (${3-n} left)`,cards:G.grave,cancel:"Done",box:"limbo"});
    if(i==null||!G.grave[i])break;const c=G.grave.splice(i,1)[0],w=soulOf(c);toDark(c);const got=giveMana(pl,w);n++;
    log(`Neptune lets ${plName(pl)} sacrifice ${esc(nameOf(c))} from the grave: +${got} mana.`,"event");render()}}
/* a sacrifice's mana strays to another player on a 1 of 1d8 */
let nepSacking=false;
{const _s=sacrifice;sacrifice=function(card,from){nepSacking=nepEvFor(G.active);try{return _s.apply(this,arguments)}finally{nepSacking=false}}}
{const _as=addSoul;addSoul=function(pl,c){if(nepSacking&&R(8)===1){nepSacking=false;const o=nepRealPl().filter(i=>i!==pl);if(o.length){const q=pick(o);
    const ok=_as(q,c);log(`<b>Neptune</b>: the soul ${plName(pl)} sacrifices drifts to ${plName(q)} (a 1 on 1d8).`,"event");notify(null,`Neptune: ${esc(G.p[pl].name)}'s sacrifice drifts to ${esc(G.p[q].name)}.`);return ok}}
  return _as.apply(this,arguments)}}
/* the Bank's takings from a purchase go to a random player on a 1 of 1d10 (not in Survival) */
let nepBuying=null;
{const _sp=spend;spend=function(pl,n){nepBuying=pl;try{return _sp.apply(this,arguments)}finally{nepBuying=null}}}
{const _ba=bankAdd;bankAdd=function(n){if(nepBuying!=null&&n>0&&nepEvFor(nepBuying)&&!survival()&&!nepIn&&R(10)===1){nepBuying=null;const ps=nepRealPl();if(ps.length){const q=pick(ps);nepIn=true;let got=0;try{got=giveMana(q,n)}finally{nepIn=false}
    log(`<b>Neptune</b>: the ${n} mana the Bank takes for a purchase drifts to ${plName(q)} (a 1 on 1d10).`,"event");notify(null,`Neptune: ${n} of the Bank's mana drifts to ${esc(G.p[q].name)}.`);return}}
  return _ba.apply(this,arguments)}}
/* drawn cards lost in the sea, found 1d10 turns later by anyone */
{const _d=draw;draw=function(pl,n,why,opening){const P=G.p[pl],before=new Set(P.hand),out=_d.apply(this,arguments);
  if(opening||!nepEvFor(pl)||isNPC(pl)||isHorde(pl))return out;
  const drawn=P.hand.filter(c=>!before.has(c));let lost=[];
  for(const c of drawn){if(lost.length?R(3)===1:R(20)===1)lost.push(c)}
  if(lost.length){for(const c of lost)P.hand.splice(P.hand.indexOf(c),1);(G.nepLost=G.nepLost||[]).push({cards:lost,from:pl,at:G.turnNo+R(10)});
    log(`<b>Neptune</b>: ${plName(pl)} loses ${lost.length} drawn card${lost.length>1?"s":""} at sea.`,"event");
    popup("Lost at sea",`<p>${esc(P.name)} lost <b>${lost.length}</b> card${lost.length>1?"s":""} as they drew. Someone will find ${lost.length>1?"them":"it"} within ten turns.</p>`)}
  return out}}
{const _bt=beginTurn;beginTurn=function(pl){const out=_bt.apply(this,arguments);if(!G||G.over||!G.nepLost||!G.nepLost.length)return out;
  for(const L of [...G.nepLost])if(G.turnNo>=L.at){G.nepLost.splice(G.nepLost.indexOf(L),1);const ps=nepRealPl();if(!ps.length)continue;const q=pick(ps),Q=G.p[q];
    for(const c of L.cards){c.owner=q;if(Q.hand.length<handCap(q))Q.hand.push(c);else{Q.deck.push(c);shuffle(Q.deck)}}
    log(`<b>Neptune</b>: ${plName(q)} finds the ${L.cards.length} card${L.cards.length>1?"s":""} ${plName(L.from)} lost at sea.`,"event");
    popup("Found at sea",`<p><b>${esc(Q.name)}</b> found the ${L.cards.length} card${L.cards.length>1?"s":""} ${esc(G.p[L.from].name)} lost${q===L.from?": they come home":""}.</p>`)}
  return out}}
/* the dead may sink: on a 1 of 1d4, to the Outer Darkness (1 on 1d2) or the Ether (2) */
{const _tg=toGrave;toGrave=function(c,cause){if(c&&cause==="death"&&(nepEvOn()||c.owner!=null&&nepSelf(c.owner))&&R(4)===1){const dark=R(2)===1||c.unit&&!(UNIT[c.unit]&&UNIT[c.unit].ether);
    if(dark)toDark(c);else{if(c.captured&&c.captured.length){for(const s of c.captured)toGrave(s,"death");c.captured=[]}c.owner=null;if(c.hp!=null)c.hp=c.maxHp;G.ether.push(c)}
    log(`<b>Neptune</b>: ${esc(nameOf(c))} sinks into ${dark?"the Outer Darkness":"the Ether, for sale"}.`);notify(null,`<span class="nepword">♆ ${dark?"Darkness":"Ether"}</span> ${esc(nameOf(c))} sinks into ${dark?"the Outer Darkness":"the Ether"}.`);return}
  return _tg.apply(this,arguments)}}
{const _r=render;render=function(){_r.apply(this,arguments);const V=G?view():null;document.documentElement.classList.toggle("nepev",!!G&&(nepEvFor(V)||G.p.some(P=>P.i!==V&&nepSelf(P.i)&&V!=null&&!isEnemy(P.i,V))))}}   // a teammate under Lostness clouds your view too
/* G.nepEv drives the glow in the picture too (planetSVG above) */

/* ---------- v71c-3: Neptune's eclipse: 5% in each round of its cycle (v71i) (or Eclipse mode; never with eclipses off), as long as
   its cycle would be (2d3 rounds, rolled for itself), and every effect of its cycle with it. Neptune glows brighter in a
   black aura. Everyone's numbers lie (Mana Delusion) and hands go blank and shuffled (Blind Hand); every deck is
   shuffled; names turn to random runs of letters and numbers; every stack on the field takes a stranger's color, so nobody
   is sure which are theirs. A stranger's stack can be picked up, but acting with it costs 1d2 deck cards; once a round,
   on a 1 of 1d6, it moves by accident. Twice a round at most, a 1 of 1d20 sends a move or an attack astray. Prices lie
   (one in eight reads free), and so do the Ether's counts and the Bank's mana. Field Automation and Lazy Hand still read
   On, crossed out in Neptune's blue, and wait for it to end. The field may turn around. The music sinks an octave and a
   half step, muffled. ---------- */
const nepEcOn=()=>nepUp()&&!!G.eclipse&&G.eclipse.k==="neptune";
function nepEcPause(pl){return !!G&&nepEcFor(pl)}   // used by blindPause (70_v65)
/* v71m: a name under the eclipse is a random run of letters and numbers (4 to 7, both kinds in it); the zodiac signs it
   used to be made of showed as emoji on phones */
const NEP_CHARS="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz",NEP_DIGITS="0123456789";
function nepJumble(){const n=3+R(4),all=NEP_CHARS+NEP_DIGITS,ch=s=>s[Math.floor(Math.random()*s.length)];const a=Array.from({length:n},()=>ch(all));
  if(!a.some(x=>NEP_DIGITS.includes(x)))a[Math.floor(Math.random()*n)]=ch(NEP_DIGITS);if(!a.some(x=>NEP_CHARS.includes(x))){const i=Math.floor(Math.random()*n);a[i]=ch(NEP_CHARS)}
  return a.join("")}
const nepHash=s=>{let h=2166136261;for(const ch of String(s))h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0};
{const _e=eclipse;eclipse=async function(k){if(k!=="neptune")return _e.apply(this,arguments);if(typeof eclipsesOff==="function"&&eclipsesOff())return;
  const d=sum(rollN(2,3)),r=G.moon.round;G.eclipse={k:"neptune",round:r,until:r+d-1};
  const names={};for(const P of G.p)names[P.i]=nepJumble();
  G.nepEc={names,seed:R(1e6),flip:R(2)===1,mis:{},foe:{}};
  for(const P of G.p){if(P.out||isNPC(P.i)||isHorde(P.i))continue;shuffle(P.deck);shuffle(P.hand);
    (G.blindHand=G.blindHand||[]).push({by:"nep",t:P.i,left:999});(G.manaDel=G.manaDel||[]).push({by:"nep",t:P.i,left:999,off:delOff()})}
  applyMoonTheme();
  log(`<b>Neptune's eclipse</b> for ${d} round${d>1?"s":""} (2d3): names, numbers, prices and colors lie, hands go blank, every deck is shuffled, and automation waits. All of Neptune's cycle comes with it.`,"event");
  popup("Neptune is eclipsed",`<p>A black aura closes around Neptune for <b>${d} round${d>1?"s":""}</b> (2d3), and everything it touches dissolves.</p><ul><li>Every player's numbers lie, and hands go blank and shuffled; every deck is shuffled.</li><li>Names turn to random letters and numbers, and every stack on the field takes a stranger's color: a stack you pick up may not be yours, and acting with one that isn't costs 1d2 cards from your deck (once a round, on a 1 of 1d6, it moves by accident).</li><li>Twice a round, a 1 of 1d20 sends a move or an attack astray.</li><li>Prices, the Ether's counts and the Bank's mana lie.</li><li>Field Automation and Lazy Hand wait for it to end.</li><li>Everything in Neptune's cycle happens too.</li></ul>`);
  render()}}
{const _ee=endEclipse;endEclipse=function(){if(G.eclipse&&G.eclipse.k==="neptune"){G.nepEc=null;for(const k of ["blindHand","manaDel"])if(G[k])G[k]=G[k].filter(x=>x.by!=="nep")}return _ee.apply(this,arguments)}}
/* acting with a stranger's stack */
function nepFoePenalty(V){const lost=takeDeck(V,R(2),"Neptune's eclipse");for(const x of lost)toGrave(x,"burn");
  log(`Neptune's eclipse: that stack wasn't ${plName(V)}'s, and it costs ${lost.length} deck card${lost.length===1?"":"s"} (1d2).`,"event");flash(`That stack wasn't yours: Neptune takes ${lost.length} card${lost.length===1?"":"s"} from your deck.`)}
{const _tc=tileClick;tileClick=function(r,c){if(!G||!nepEcFor(view()))return _tc.apply(this,arguments);
  const V=view(),st=G.board[r][c],S=G.sel;
  if(S&&S.nepFoe){G.sel=null;if(S.r===r&&S.c===c){render();return}
    const E=nepEcState(V)||{foe:{}},k=V+"|"+G.moon.round,fs=G.board[S.r][S.c];
    if(fs&&!E.foe[k]&&!G.board[r][c]&&!isVoid(r,c)&&Math.abs(r-S.r)+Math.abs(c-S.c)===1&&R(6)===1){E.foe[k]=1;G.board[r][c]=fs;G.board[S.r][S.c]=null;G._vis=null;
      log(`Neptune's eclipse: ${plName(V)} moves a stranger's stack by accident, to ${coord(r,c)} (a 1 on 1d6).`,"event");render();return}
    nepFoePenalty(V);render();return}
  if(st&&isEnemy(st.owner,V)&&G.active===V&&(G.phase==="prep"||G.phase==="attack")&&!G.mode&&!G.selHand&&canAct()&&stFights(st)){G.sel={r,c,pick:new Set(st.cards.filter(x=>!isBase(x)).map(x=>x.id)),nepFoe:true};render();return}
  return _tc.apply(this,arguments)}}
document.addEventListener("click",e=>{if(!G||!G.sel||!G.sel.nepFoe||!nepEcFor(view()))return;const b=e.target.closest&&e.target.closest("#selbox button");if(!b)return;
  e.preventDefault();e.stopPropagation();G.sel=null;nepFoePenalty(view());render()},true);   // the Selected box's buttons count as acting with it
/* twice a round at most, a 1 of 1d20 sends a move or an attack astray */
const nepAstray=pl=>{const E=nepEcState(pl);if(!E)return false;const k=pl+"|"+G.moon.round;if((E.mis[k]||0)>=2||R(20)!==1)return false;E.mis[k]=(E.mis[k]||0)+1;return true};
{const _dm=doMove;doMove=function(r,c){if(nepEcFor(G.active)&&G.sel&&!G.sel.nepFoe&&nepAstray(G.active)){const alt=moveTargets().filter(([a,b])=>a!==r||b!==c);
    if(alt.length){const [a,b]=pick(alt);log(`Neptune's eclipse: ${plName(G.active)}'s stack wanders astray, to ${coord(a,b)} (a 1 on 1d20).`,"event");return _dm.call(this,a,b)}}
  return _dm.apply(this,arguments)}}
{const _at=attack;attack=function(r1,c1,r2,c2,mode){if(nepEcFor(G.active)&&nepAstray(G.active)){const alt=attackOptions(r1,c1).filter(o=>(o.r!==r2||o.c!==c2)&&(o.mode||null)===(mode||null));
    if(alt.length){const o=pick(alt);log(`Neptune's eclipse: ${plName(G.active)}'s attack goes astray, at ${coord(o.r,o.c)} (a 1 on 1d20).`,"event");return _at.call(this,r1,c1,o.r,o.c,mode)}}
  return _at.apply(this,arguments)}}
/* what the eclipse does to the screen */
let nepMusicOn=false;
{const _r=render;render=function(){_r.apply(this,arguments);const V=G?view():null,E=G?nepEcState(V):null,h=document.documentElement;
  h.classList.toggle("nepec",!!E);h.classList.toggle("nepflip",!!(E&&E.flip));
  if(!!E!==nepMusicOn){nepMusicOn=!!E;try{window.ECMusic&&ECMusic.nep&&ECMusic.nep(nepMusicOn)}catch(e){}}
  if(!E)return;
  for(const s of document.querySelectorAll(".pn[data-pl]")){const n=E.names[+s.dataset.pl];if(n&&s.textContent!==n)s.textContent=n}
  for(const b of document.querySelectorAll(".ph [data-stat]")){const nm=b.parentNode.querySelector("b"),n=E.names[+b.dataset.stat];if(nm&&n)nm.textContent=n}
  for(const t of document.querySelectorAll("#board button.tile")){const st=G.board[+t.dataset.r][+t.dataset.c],s=t.querySelector(".stack");if(!st||!s||!st.cards[0])continue;
    const col=COLORS[nepHash(st.cards[0].id+"|"+E.seed)%COLORS.length][1];s.style.setProperty("--pc",col);s.style.setProperty("--pcb",`color-mix(in oklab,${col} 44%,#211b16)`);s.classList.remove("mine","theirs","ally")}
  const rd=G.moon.round;
  for(const em of document.querySelectorAll("#spells .spell em")){const b=em.closest("[data-sp],[data-cast]");const id=b&&(b.dataset.sp||b.dataset.cast);if(id&&/mana/.test(em.textContent)&&nepHash(id+"|"+rd+"|"+E.seed)%8===0)em.textContent="free"}
  for(const sm of document.querySelectorAll("#etherpanel .spell small.left")){const m=/^(\d+)/.exec(sm.textContent);if(m)sm.textContent=sm.textContent.replace(m[1],String(Math.max(0,+m[1]+(nepHash(sm.textContent+rd+E.seed)%7)-3)))}
  const bk=document.querySelector("#openBank small");if(bk){const m=/(-?\d+)/.exec(bk.textContent);if(m)bk.textContent=bk.textContent.replace(m[1],String((+m[1])*(nepHash("bank"+rd+E.seed)%2?-1:1)+(nepHash("bk"+rd+E.seed)%9)-4))}}}

if(window.__EC)Object.assign(window.__EC,{endEclipseW:()=>endEclipse(),eclipseRoundW:()=>eclipseRound(),nepEclipseW:()=>eclipse("neptune"),nepEcOnW:()=>nepEcOn(),tileClickW:(r,c)=>tileClick(r,c),nepEventRoundW:()=>nepEventRound(),nepEvOnW:()=>nepEvOn(),toGraveW:(...a)=>toGrave(...a),nepCloudAt:(r,c)=>nepCloudAt(r,c),neptuneSVG,giveManaW:(...a)=>giveMana(...a),spendW:(...a)=>spend(...a),beginTurnW:pl=>beginTurn(pl),hiddenFromW:(V,r,c)=>hiddenFrom(V,r,c)});
