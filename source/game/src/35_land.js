/* ---------------- v35: a deeper fog of war, Venus's reason to help an enemy, the Bank's land ----------------
   Fog: one veil of drifting cloud over every fogged tile, with soft edges that bleed into the tiles you can see, darker at the
   New Moon, silvered at the Full Moon, red under a Blood Moon.
   Venus (the gift to the enemy, "+1 mana a turn, every enemy +2 maximum"): Venus keeps a ledger. Each round an enemy holding her gift
   doesn't attack the favored side, the favored player gets 1 mana of gratitude (2 at most a round). An enemy who attacks the favored
   side anyway loses the gift for three rounds, and Venus pays the favored player 2 mana for the ingratitude.
   The Bank's land: eight plots, 1 mana each, in the Bank window's Land tab. A plot is a Miner slot no enemy can reach: a Miner there
   brings 1d2 − 1 mana a turn, like a Miner in an Ace (1d2 under Jupiter). At every Full Moon (every eighth round when the Moon isn't
   in the sky) the Bank takes half of what the plots brought in since. Whatever can't be paid becomes mana debt and Debt Collectors
   come for it; miss two pay days in a row and the Bank takes the plots back, and each Miner in them is turned into two Slave cards,
   sold at the Auction for 1 mana each. When the Bank sells something of a player who owes it, the money pays that player's debt. */

/* ---------- the fog veil ---------- */
const FOG_CLOUDS=(()=>{const s=(fq,seed,a,b)=>"url(\"data:image/svg+xml;utf8,"+encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='420' height='420'><filter id='n' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='${fq}' numOctaves='4' seed='${seed}' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .6  0 0 0 0 .58  0 0 0 0 .55  0 0 0 ${a} ${b}'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`).replace(/%2523/g,"%23")+"\")";
  return [s(".006 .009",7,1.5,-.55),s(".013 .02",23,1.2,-.45)]})();
let fogKey="";
function fogVeil(){const B=$("#board");if(!B)return;let v=B.querySelector(":scope > .fogveil");const tiles=[...B.querySelectorAll(".tile.fog")];
  if(!tiles.length){if(v)v.remove();fogKey="";return}
  const br=B.getBoundingClientRect(),W=Math.round(br.width),H=Math.round(br.height);if(!W||!H)return;
  const rects=tiles.map(t=>{const r=t.getBoundingClientRect();return [Math.round(r.left-br.left),Math.round(r.top-br.top),Math.round(r.width),Math.round(r.height)]});
  const key=W+"x"+H+":"+rects.map(r=>r.join(",")).join(";");
  if(!v){v=document.createElement("div");v.className="fogveil";v.setAttribute("aria-hidden","true");B.appendChild(v);v.style.animationDelay=`-${(performance.now()/1000)%90}s`}
  if(key!==fogKey||!v.style.maskImage&&!v.style.webkitMaskImage){fogKey=key;
    const g=rects.map(([x,y,w,h])=>`<rect x='${x-4}' y='${y-4}' width='${w+8}' height='${h+8}' rx='10'/>`).join("");
    const m="url(\"data:image/svg+xml;utf8,"+encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}'><filter id='b'><feGaussianBlur stdDeviation='9'/></filter><g fill='white' filter='url(%23b)'>${g}</g></svg>`).replace(/%2523/g,"%23")+"\")";
    v.style.maskImage=m;v.style.webkitMaskImage=m}
  v.style.setProperty("--c1",FOG_CLOUDS[0]);v.style.setProperty("--c2",FOG_CLOUDS[1])}
{const _rd=render;render=function(){_rd.apply(this,arguments);if(!G)return;try{fogVeil()}catch(e){console.error(e)}}}
addEventListener("resize",()=>{fogKey="";if(G)try{fogVeil()}catch(e){}});

/* ---------- Venus: gratitude and ingratitude ---------- */
const venusB=()=>planetUp("venus")&&G.venus&&G.venus.mode==="b"?G.venus:null;
const venusSpurned=pl=>!!(G.venusSpurn&&G.venusSpurn[pl]!=null&&G.moon.round<=G.venusSpurn[pl]);
const venusFavored=pl=>{const V=venusB();return !!V&&(pl===V.target||!isEnemy(pl,V.target))};
{const _sc=skyCapMod;skyCapMod=function(P){let m=_sc(P);const V=venusB();if(V&&P&&V.by!=null&&isEnemy(V.by,P.i)&&venusSpurned(P.i))m-=2*(eclipseOn("venus")?2:1);return m}}
{const _at=attack;attack=function(r1,c1,r2,c2,mode){const V=venusB(),A=G.board[r1]&&G.board[r1][c1],D=G.board[r2]&&G.board[r2][c2];
  if(V&&A&&D&&!isNPC(A.owner)&&!isNPC(D.owner)&&V.by!=null&&isEnemy(A.owner,V.by)&&venusFavored(D.owner)){
    (G.venusHit=G.venusHit||{})[A.owner]=G.moon.round;
    if(!venusSpurned(A.owner)){(G.venusSpurn=G.venusSpurn||{})[A.owner]=G.moon.round+2;const got=giveMana(V.target,2);
      log(`<b>Venus is spurned</b>: ${plName(A.owner)} takes her gift and attacks ${plName(D.owner)}. The gift is gone for three rounds, and Venus pays ${plName(V.target)} ${got} mana for the ingratitude.`,"event");
      notify(V.target,`${esc(G.p[A.owner].name)} spurned Venus: ${got} mana to ${esc(G.p[V.target].name)}.`)}}
  return _at.apply(this,arguments)}}
function venusGratitude(){const V=venusB();if(!V||V.by==null||G.p[V.target].out)return;const r=G.moon.round-1;if(V.since==null){V.since=G.moon.round;return}if(r<V.since)return;
  const grateful=realPlayers().filter(i=>isEnemy(i,V.by)&&!venusSpurned(i)&&!(G.venusHit&&G.venusHit[i]===r));
  if(!grateful.length)return;const got=giveMana(V.target,Math.min(2,grateful.length));
  if(got)log(`<b>Venus's gratitude</b>: ${grateful.map(plName).join(", ")} held her gift in peace last round; ${plName(V.target)} gets ${got} mana.`)}
/* the computer gives to the enemy when it is the weaker side */
const venusAiMode=pl=>{const me=strength(pl),them=Math.max(1,...enemiesOf(pl).filter(i=>!isHorde(i)).map(strength));return me<them*.9&&!survival()?"b":"a"};
{const _ask=ask;ask=function(pl,spec){if(spec&&spec.id==="venusmode"&&G.p[pl]&&G.p[pl].cpu)spec={...spec,ai:()=>spec.options.some(o=>o.id==="b")?venusAiMode(pl):"a"};return _ask(pl,spec)}}
{const s=SP("venus");if(s)s.text=s.text.replace("Anyone can swear the Oath of Venus.","With the gift to the enemy, Venus keeps a ledger: each round an enemy holding her gift leaves your side alone, you get 1 mana (2 at most a round); an enemy who attacks your side anyway loses the gift for three rounds and Venus pays you 2. Anyone can swear the Oath of Venus.")}
if(SKY_PARA.venus)SKY_PARA.venus=SKY_PARA.venus.replace("Under the Oath of Venus,","With the gift to the enemy, Venus keeps a ledger: every round an enemy holding her gift leaves the favored side alone, the favored player gets 1 mana of gratitude (2 at most a round), and an enemy who attacks the favored side anyway loses the gift for three rounds while Venus pays the favored player 2 mana. Under the Oath of Venus,");
{const _pi=planetInfoHTML;planetInfoHTML=function(k){let h=_pi(k);if(k!=="venus"||!venusB())return h;const V=venusB(),sp=Object.keys(G.venusSpurn||{}).filter(i=>venusSpurned(+i)).map(i=>plN(+i));
  const line=`<li>Venus's ledger: each round an enemy holding her gift leaves ${plN(V.target)}'s side alone, ${plN(V.target)} gets 1 mana (2 at most). Attack that side and the gift is gone for three rounds, and Venus pays ${plN(V.target)} 2.${sp.length?` Spurned: ${sp.join(", ")}.`:""}</li>`;
  return h.replace("</ul>",line+"</ul>")}}

/* ---------- the Bank's land ---------- */
const PLOTS=8,PLOT_PRICE=1;
const plotsOf=()=>G.plots||(G.plots=Array.from({length:PLOTS},(_,i)=>({i,owner:null,miners:[],prod:0})));
const myPlots=pl=>plotsOf().filter(p=>p.owner===pl);
const payDay=()=>!G.moon.gone?G.moon.i===4:G.moon.round%8===0;
const handMiners=pl=>G.p[pl].hand.filter(c=>c.unit==="miner");
function buyPlot(pl,p){const P=G.p[pl];if(p.owner!=null||!bankOpen()||bankBanned(pl)||P.jail)return false;if(!canAfford(pl,PLOT_PRICE)){if(!P.cpu)flash("Not enough mana.");return false}
  spend(pl,PLOT_PRICE);p.owner=pl;p.prod=0;log(`${plName(pl)} buys plot ${p.i+1} from the Bank (1 mana).`,"event");return true}
function plantMiner(pl,p){const m=handMiners(pl)[0];if(!m||p.owner!==pl||p.miners.length)return false;const P=G.p[pl];P.hand.splice(P.hand.indexOf(m),1);m.owner=pl;m.plotSince=G.moon.round;p.miners.push(m);
  log(`${plName(pl)} puts a Miner to work on plot ${p.i+1}: no enemy can reach it there.`);return true}
/* the Miners work at the start of their owner's turn */
{const _bt=bankTurn;bankTurn=function(pl){_bt(pl);if(!G.p[pl]||isHorde(pl)||!G.plots)return;let got=0;
  for(const p of myPlots(pl))for(const m of p.miners)if(m.plotSince<G.moon.round){let n=R(2)-(planetUp("jupiter")?0:1);if(n&&G.p[pl].minerX2!=null&&tnOf(pl)<=G.p[pl].minerX2)n*=2;p.prod+=n;got+=n}
  if(got){const n=giveMana(pl,got);log(`${plName(pl)}'s Miners on the Bank's land bring in ${n} mana${n<got?" (the soul pile is full)":""}. The Bank's half is due at the Full Moon.`)}}}
/* pay day: the Bank takes half */
function landPayDay(){if(!G.plots||!bankOpen())return;const bk=npcIx("bank");
  for(const pl of [...new Set(plotsOf().filter(p=>p.owner!=null).map(p=>p.owner))]){const P=G.p[pl],ps=myPlots(pl);if(!P||P.out){for(const p of ps){p.owner=null;p.miners=[];p.prod=0}continue}
    const made=ps.reduce((a,p)=>a+p.prod,0),due=Math.ceil(made/2);ps.forEach(p=>p.prod=0);if(!due){P.landMiss=0;continue}
    const paid=payQuiet(pl,Math.min(mana(pl),due));bankAdd(paid);const rest=due-paid;
    if(!rest){P.landMiss=0;log(`Pay day: ${plName(pl)} pays the Bank its half of the land's ${made} mana (${due}).`);continue}
    P.debt=(P.debt||0)+rest;if(P.debtAt==null)P.debtAt=tnOf(pl)+R(2);P.landMiss=(P.landMiss||0)+1;
    let n=0;if(bk>=0)for(const t of freeTilesNear(pl,true).slice(0,R(2))){G.board[t[0]][t[1]]={owner:bk,cards:[mkUnit("debt",bk)],moved:true,attacked:true,hunt:pl,land:true};n++}
    log(`<b>Pay day</b>: ${plName(pl)} owes the Bank ${due} for the land and pays ${paid}; ${rest} becomes mana debt${n?`, and ${n} Debt Collector${n>1?"s come":" comes"} to make them pay`:""} (${P.landMiss} missed).`,"event");
    if(P.landMiss>=2){P.landMiss=0;let slaves=0;
      for(const p of ps){for(const m of p.miners){m.owner=null;if(m.hp!=null)m.hp=m.maxHp;G.ether.push(m);
          for(let k=0;k<2;k++){const s=mk(String(2+Math.floor(Math.random()*9)),pick(["S","H","D","C"]));s.unit="slave";s.owner=bk;(G.auction=G.auction||[]).push({card:s,seller:bk,bank:true,price:1,from:pl,id:(G.auctN=(G.auctN||0)+1)});slaves++}}
        p.owner=null;p.miners=[];p.prod=0}
      log(`<b>The Bank takes back ${plName(pl)}'s land</b>: two pay days missed. ${slaves?`The Miners are turned into ${slaves} Slave cards, sold at the Auction for 1 mana each to pay the debt.`:""}`,"event");
      popup("The Bank takes the land back",`<p>${plName(pl)} missed two pay days in a row.</p><p>The Bank takes back every plot${slaves?`, and the Miners on them are turned into ${slaves} Slave cards, sold at the Auction for 1 mana each. What they sell for pays ${plName(pl)}'s debt`:""}.</p>`,pl)}
    else popup("Pay day",`<p>${plName(pl)} couldn't pay the Bank its half of the land (${due} due, ${paid} paid).</p><p>${rest} mana becomes debt and Debt Collectors come. Miss the next pay day too and the Bank takes the land back.</p>`,pl)}
  // the land's Debt Collectors go home once the debt is paid
  if(bk>=0)for(const x of stacksOf(bk))if(x.st.land&&!(G.p[x.st.hunt]&&G.p[x.st.hunt].debt>0))G.board[x.r][x.c]=null}
{const _cr=cycleRound;cycleRound=async function(){const out=await _cr.apply(this,arguments);if(G.over)return out;venusGratitude();if(G.moon.round>1&&payDay())landPayDay();render();return out}}
/* what the Bank sells of a debtor's pays that debtor's debt */
{const _bb=buyBankItem;buyBankItem=async function(pl,it){const from=it&&it.from,price=it&&it.price;const ok=await _bb(pl,it);
  if(ok&&from!=null&&G.p[from]&&G.p[from].debt>0){const k=Math.min(G.p[from].debt,price);G.p[from].debt-=k;if(!G.p[from].debt)G.p[from].debtAt=null;log(`The sale pays ${k} of ${plName(from)}'s debt to the Bank.`)}
  return ok}}
/* the computer and the land */
{const _ab=aiBank;aiBank=async function(pl,W,cast1){await _ab(pl,W,cast1);const P=G.p[pl];if(G.over||P.jail||!bankOpen()||bankBanned(pl))return;
  for(const p of myPlots(pl))if(!p.miners.length&&handMiners(pl).length)plantMiner(pl,p);
  if(handMiners(pl).length&&mana(pl)>=3&&Math.random()<.5){const p=plotsOf().find(q=>q.owner==null);if(p&&buyPlot(pl,p))plantMiner(pl,p)}}}

/* the Land tab */
function landHTML(V){const live=canAct()&&G.phase==="prep"&&G.active===V,P=G.p[V],open=bankOpen()&&!bankBanned(V)&&!P.jail,hm=handMiners(V).length;
  const mine=myPlots(V),made=mine.reduce((a,p)=>a+p.prod,0);
  const box=p=>{const own=p.owner,me=own===V;let body;
    if(own==null)body=`<span class="dim">For sale</span>${live&&open?`<button class="btn sm" data-plot="${p.i}" ${canAfford(V,PLOT_PRICE)?"":"disabled"}>Buy · 1 mana</button>`:""}`;
    else if(me)body=p.miners.length?`<span>${unitSVG("miner","#e8c24a",18)} A Miner at work</span><small class="dim">${p.prod} brought in since pay day</small>`:`<span class="dim">Yours, empty</span>${live&&hm?`<button class="btn sm" data-plant="${p.i}">Put a Miner from your hand</button>`:`<small class="dim">${hm?"":"No Miner in your hand"}</small>`}`;
    else body=`<span class="dim">Owned by ${plName(own)}</span>${p.miners.length?`<small class="dim">a Miner at work</small>`:""}`;
    return `<div class="plot${me?" mine":own!=null?" taken":""}"><b>Plot ${p.i+1}</b>${body}</div>`};
  return `<p class="dim">Eight plots of the Bank's land, 1 mana each. A plot is a Miner slot no enemy can reach: a Miner in it brings 1d2 − 1 mana a turn, like a Miner in an Ace (1d2 under Jupiter). At every Full Moon (every eighth round without the Moon) the Bank takes half of what your plots brought in since. What you can't pay becomes debt and Debt Collectors come; miss two pay days in a row and the Bank takes the land back and sells each Miner as two Slave cards at the Auction.</p>
${mine.length?`<p>Your plots: ${mine.length}. Brought in since the last pay day: <b>${made}</b>; the Bank's half: <b>${Math.ceil(made/2)}</b>${P.landMiss?` · <span class="neg">${P.landMiss} pay day missed</span>`:""}.</p>`:""}
<div class="plots">${plotsOf().map(box).join("")}</div>${!open?`<p class="dim">${!bankOpen()?"The Bank is closed.":P.jail?"In Jail: no Bank business.":"No Bank business yet."}</p>`:live?"":`<p class="dim">Land is bought in your own prep phase.</p>`}`}
function wireLand(el,V,re){el.querySelectorAll("[data-plot]").forEach(b=>b.onclick=()=>{if(!canAct())return;buyPlot(V,plotsOf()[+b.dataset.plot]);re()});
  el.querySelectorAll("[data-plant]").forEach(b=>b.onclick=()=>{if(!canAct())return;plantMiner(V,plotsOf()[+b.dataset.plant]);re()})}

if(window.__EC)Object.assign(window.__EC,{plotsOf,buyPlot,plantMiner,landPayDay,venusGratitude,fogVeil});
