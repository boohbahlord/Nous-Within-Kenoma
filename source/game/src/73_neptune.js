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
SKY_PARA.neptune="Neptune, the Form of Dissolve, stops the Moon's phases. Every 4d2 turns a cloud in its blue settles over the tiles around the cards for 2d4 turns, drifting with every turn. Its tiles are in fog for everyone, even beside your own cards (a tile with your own stack stays yours). At the start of each player's turn in the cloud, a 1 on 1d20 loses one of their stacks for 1d3 + 1d2 − 1 of their turns: they can't see it or command it, nor can their automation; it never attacks, defends itself, and wanders. Another of their stacks beside it finds it: then they see it, see-through, as everyone does. The first mana each player earns or spends each round rolls 1d20: a 1 sends it to another player (a spender still pays), a 20 doubles it.";

if(window.__EC)Object.assign(window.__EC,{nepCloudAt:(r,c)=>nepCloudAt(r,c),neptuneSVG,giveManaW:(...a)=>giveMana(...a),spendW:(...a)=>spend(...a),beginTurnW:pl=>beginTurn(pl),hiddenFromW:(V,r,c)=>hiddenFrom(V,r,c)});
