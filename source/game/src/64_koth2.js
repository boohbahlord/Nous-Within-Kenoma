/* ---------------- v58: King of the Hill, part 2 ----------------
   - The Carriage (King of the Hill only): a standard card, "13" in its corner, a carriage for its symbol. 1 mana, as many as
     you like from the Ether (they don't count against it). Two hearts, no attack, no defense. It carries any stack (but never
     an Archer) up to 3 tiles in any direction. Of the ranged cards only Archers can shoot at it. Blows hit the Carriage first;
     when it breaks, every card it carried rolls 1d4 and dies on a 1, and the rest stay stacked.
   - The Ether in King of the Hill: it starts with three decks' worth of every kind, gains one more deck's worth every 10
     turns, and never holds more than four decks' worth of a kind.
   - Marathon (100 points): holding the Hill can raise mercenaries for your side: on each of your turns, one chance in four,
     a band of soldiers under a crown, in your side's color, that stays yours. Everyone is told.
   - The Bank on the map: its building stands by the Hill (nothing can enter it), the Banker beside it (he can't be attacked),
     guarded by Debt Collectors on Carriages. In this mode the Bank's Collectors ride Carriages too and cover 3 tiles a turn. */

/* ---------- the Carriage ---------- */
UNIT.carriage={name:"Carriage",short:"Carriage",word:"Carriage",hp:2,nat:0,soul:1,cost:1,noDef:true,noAtk:true,kind:"Standard",ether:true,desc:"carries a stack up to 3 tiles in any direction",rt:0};
TYPEWORD.carriage="Carriage";KNAME.carriage="Carriage";
UNIT_ICON.carriage=`<path d="M-10,-4H10V3H-10Z M-8,-4L-6,-9H6L8,-4 M-6,3a3,3 0 1,0 0.1,0 M6,3a3,3 0 1,0 0.1,0 M-10,-1H-13"/>`;
UNIT_MARK.carriage="13";UNLIMITED.add("carriage");
INFO.carriage=["Carriage (standard)","Carriage",[["Carries","any stack but one with an Archer, up to 3 tiles in any direction"],["Fights","never: no attack and no defense; two hearts, and blows hit it first"],
  ["Breaks","every card it carried rolls 1d4 and dies on a 1; the rest stay stacked"],["Shot at","only by Archers among the ranged cards"],["Comes","King of the Hill only: Carriage Conjure, 1 mana, as many as you like"]],"A carriage on two wheels."];
ETHER_SHOP[0][1].push(["ccar","Carriage"]);ETHER_IDS.add("ccar");ETHER_KIND.ccar="carriage";
BROWSE[0][1].push("carriage");CARD_TREE[0][1].push("carriage");FA_KINDS.push("carriage");
SPELLS.push({id:"ccar",name:"Carriage Conjure",cost:1,school:"Conjuring",text:"King of the Hill only. A Carriage comes into your deck, made from nothing: it carries a stack up to 3 tiles in any direction.",ok:()=>kothOn(),run:()=>conjureU("carriage")});
SPELL_TEXT.ccar={n:"King of the Hill only.",e:"A Carriage comes into your deck, made from nothing.",l:"It carries a stack (never an Archer) up to 3 tiles in any direction; two hearts, no attack or defense."};
{const _sb=spellBlock;spellBlock=function(sp){if(sp&&sp.id==="ccar"&&!kothOn())return "King of the Hill only.";return _sb.apply(this,arguments)}}
{const _sl=stackLegal;stackLegal=function(cards){const n=cards.filter(c=>c.unit==="carriage").length;if(!n)return _sl.apply(this,arguments);
  if(n>1||cards.some(c=>c.unit==="archer"))return false;const rest=cards.filter(c=>c.unit!=="carriage");return !rest.length||_sl(rest)}}
/* a stack moving with its Carriage goes up to 3 tiles any way */
{const _mt=moveTargets;moveTargets=function(){const out=_mt.apply(this,arguments);const s=G.sel,st=s&&G.board[s.r][s.c],grp=moveGroup();
  if(!st||!grp.some(c=>c.unit==="carriage")||st.moved||st.stun||st.pin||grp.some(isBase))return out;
  const rest=st.cards.filter(c=>!s.pick.has(c.id));if(rest.length&&!stackLegal(rest))return out;
  const have=new Set(out.map(t=>t[0]+","+t[1]));
  for(let dr=-3;dr<=3;dr++)for(let dc=-3;dc<=3;dc++){const r=s.r+dr,c=s.c+dc;if((!dr&&!dc)||r<0||c<0||r>=G.rows||c>=COLS||isVoid(r,c)||have.has(r+","+c))continue;
    const t=G.board[r][c];if(t&&!(t.owner===st.owner&&stackLegal([...t.cards,...grp])))continue;if(peaceOn()&&G.zone[r][c]>=0&&isEnemy(st.owner,G.zone[r][c]))continue;out.push([r,c])}
  return out}}
/* blows hit the Carriage first; when it breaks, its passengers roll for their lives */
{const _dm=damage;damage=function(r,c,n,defending){const st=G.board[r]&&G.board[r][c],car=st&&st.cards.find(x=>x.unit==="carriage");
  if(!car||n<=0||st.cards.some(isBase)||shieldUp(st)||st.cards.length===1)return _dm.apply(this,arguments);
  let left=n;while(left>0&&car.hp>0){car.hp--;left--}
  if(car.hp>0){log(`The Carriage on ${coord(r,c)} loses a heart (${car.hp} left).`);return 0}
  st.cards.splice(st.cards.indexOf(car),1);bury(car,r,c,st);const dead=[];
  for(const x of [...st.cards])if(R(4)===1){st.cards.splice(st.cards.indexOf(x),1);dead.push(x)}
  log(`<b>The Carriage on ${coord(r,c)} breaks.</b> ${dead.length?`${dead.map(x=>esc(nameOf(x))).join(", ")} die${dead.length===1?"s":""} in the wreck (a 1 on 1d4).`:"Everyone in it walks away."}`,"combat");
  for(const x of dead)bury(x,r,c,st);
  if(!st.cards.length){G.board[r][c]=null;freeCaptive(st,r,c)}
  let k=1+dead.length;if(left>0&&G.board[r][c]===st)k+=_dm.call(this,r,c,left,defending);checkWin();return k}}
/* of the ranged cards only Archers shoot at a Carriage */
{const _ao=attackOptions;attackOptions=function(r,c){const out=_ao(r,c);if(!G)return out;
  return out.filter(o=>{const t=G.board[o.r]&&G.board[o.r][o.c];if(!t)return true;
    if(t.cards.some(x=>x.unit==="banker"))return false;   // the Banker can't be attacked
    if(o.ranged&&t.cards.some(x=>x.unit==="carriage")&&!(o.card&&o.card.unit==="archer"))return false;return true})}}

/* ---------- the Ether in King of the Hill ---------- */
const KOTH_KEY=c=>c.unit?c.unit:c.rank==="JK"?"JK":c.rank;
function kothDeckCounts(){const n={};for(const r of ["2","3","4","5","6","7","8","9","10","J","Q","K","A"])n[r]=4;n.JK=2;for(const u in SIEGE_PER_DECK)n[u]=SIEGE_PER_DECK[u];n.scout=2;return n}
function kothFillEther(decks){const per=kothDeckCounts(),have={};for(const c of G.ether){const k=KOTH_KEY(c);have[k]=(have[k]||0)+1}let added=0;
  const S=["S","H","D","C"];
  for(const k in per){const want=Math.min(per[k]*decks,per[k]*4);for(let i=have[k]||0;i<want;i++){let c;
    if(UNIT[k])c=mkUnit(k,null);else if(k==="JK")c=mk("JK",null,i%2?"red":"black");else c=mk(k,S[i%4]);c.owner=null;G.ether.push(c);added++}}
  return added}
{const _sg=startGame;startGame=function(opts){const out=_sg.apply(this,arguments);if(kothOn()){kothFillEther(3);G.kothDecks=3}return out}}
{const _st=substanceTurn;substanceTurn=function(pl){_st.apply(this,arguments);if(!kothOn()||G.over)return;
  if(G.turnNo>0&&G.turnNo%10===0&&G.kothEtherAt!==G.turnNo){G.kothEtherAt=G.turnNo;   // v71: every 10 turns again, as the rule was written
    const n=kothFillEther(Math.min(4,(G.kothDecks||3)+1));G.kothDecks=Math.min(4,(G.kothDecks||3)+1);if(n)log(`<b>The Ether</b> fills up: ${n} souls come in (never more than four decks' worth of a kind).`,"event")}
  if(!G.kothBankDone&&G.phase!=="setup"){G.kothBankDone=true;kothBank();render()}   // the Bank exists once the game is under way
  kothMercs(pl);kothCarriages()}}

/* a stack riding a Carriage shows a small carriage */
{const _sd=siegeDecor;siegeDecor=function(inner,st,V,r,c){const h=_sd.apply(this,arguments);if(!st||st.cards.length<2||!st.cards.some(x=>x.unit==="carriage"))return h;
  const car=st.cards.find(x=>x.unit==="carriage");return h.replace(/<\/div>$/,`<span class="carbadge" data-tip="On a Carriage (${car.hp}/2 hearts): moves up to 3 tiles in any direction">${unitSVG("carriage","#d9c79a",16)}<i>${"♥".repeat(car.hp)}</i></span></div>`)}}

/* ---------- Marathon: mercenaries under a crown ---------- */
const CROWN_SVG=c=>`<svg viewBox="-12 -12 24 24" width="16" height="16" aria-hidden="true"><path d="M-9,6L-10,-6L-4,-1L0,-9L4,-1L10,-6L9,6Z" fill="${c}" stroke="#15100b" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
function kothMercs(pl){const K=G.opts.koth;if(K.target<100||isNPC(pl)||isHorde(pl)||!G.p[pl]||G.p[pl].out)return;
  const g=kothGroup(pl);if(!kothHolders().has(g)||R(4)!==1)return;
  const ring=[],[h0,h1]=hillSpan();for(let r=h0-2;r<=h1+2;r++)for(let c=h0-2;c<=h1+2;c++){if(isHill(r,c)||isVoid(r,c)||G.board[r][c])continue;ring.push([r,c])}
  shuffle(ring);const stacks=Math.min(ring.length,2+R(2)-1);let cards=0;
  for(let i=0;i<stacks;i++){const [r,c]=ring[i],n=1+R(3),cs=Array.from({length:n},()=>{const x=mk(String(1+R(9)),pick(["S","H","D","C"]));x.owner=pl;x.merc=true;return x});
    if(!stackLegal(cs))cs.splice(1);G.board[r][c]={owner:pl,cards:cs,moved:true,attacked:true,merc:g};cards+=cs.length}
  if(!stacks)return;const msg=`Mercenaries rise on the Hill for ${kothGroupName(g)}: ${stacks} band${stacks>1?"s":""}, ${cards} soldiers.`;
  log(`<b>Marathon</b>: ${msg}`,"event");notify(null,msg)}
{const _sd=siegeDecor;siegeDecor=function(inner,st,V,r,c){let h=_sd.apply(this,arguments);if(!st||!st.merc||!kothOn())return h;
  const col=kothGroupColor(st.merc);h=h.replace(/<span class="so">[\s\S]*?<\/svg><\/span>/,`<span class="so crown">${CROWN_SVG(col)}</span>`);return h.replace('class="stack ','class="stack merc ').replace(/style="--pc:[^"]*"/,`style="--pc:${col}"`)}}

/* ---------- the Bank on the map ---------- */
UNIT.banker={name:"The Banker",short:"Banker",word:"Banker",nat:0,soul:3,cost:3,noDef:true,noAtk:true,kind:"Wildcard",desc:"the Bank's own; he can't be attacked",rt:0};
TYPEWORD.banker="Banker";KNAME.banker="Banker";UNIT_ICON.banker=UNIT_ICON.debt;UNIT_MARK.banker="$";
/* v59: the Bank stands outside the mountains, never inside the ring around the Hill: just beyond it if there is room, and
   never where the building and its guards would cut a way through to the Hill */
const BANK_NB=[[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]];
function kothBankSpot(){const C=KOTH_C,cheb=(r,c)=>Math.max(Math.abs(r-C),Math.abs(c-C)),ok=(r,c)=>r>=0&&c>=0&&r<G.rows&&c<COLS&&!isVoid(r,c);
  const reach=block=>{const seen=new Set([C+","+C]),q=[[C,C]];while(q.length){const [r,c]=q.pop();for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const rr=r+a,cc=c+b,k=rr+","+cc;if(!ok(rr,cc)||seen.has(k)||block.has(k))continue;seen.add(k);q.push([rr,cc])}}return seen};
  const base=reach(new Set()),cands=[];
  for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++){const d=cheb(r,c);if(d<6||d>9||!ok(r,c)||G.board[r][c]||!base.has(r+","+c))continue;
    const f=BANK_NB.map(([a,b])=>[r+a,c+b]).filter(([a,b])=>ok(a,b)&&!isHill(a,b)&&!G.board[a][b]);if(f.length>=3)cands.push({r,c,d,f:f.slice(0,3)})}
  shuffle(cands);cands.sort((a,b)=>a.d-b.d);   // just outside the mountains first
  for(const x of cands){const block=new Set([x.r+","+x.c,...x.f.map(t=>t.join())]),after=reach(block);if([...base].every(k=>block.has(k)||after.has(k)))return x}
  return null}
function kothBank(){const B=npcIx("bank");if(B<0||!G.bank)return;const spot=kothBankSpot();if(!spot)return;
  const {r,c}=spot;G.kothBank=[r,c];G.void[r][c]=true;   // the building: no card can enter it
  const free=BANK_NB.map(([a,b])=>[r+a,c+b]).filter(([a,b])=>a>=0&&b>=0&&a<G.rows&&b<COLS&&!isVoid(a,b)&&!isHill(a,b)&&!G.board[a][b]);
  const put=(cards,extra)=>{const t=free.shift();if(!t)return;cards.forEach(x=>x.owner=B);G.board[t[0]][t[1]]={owner:B,cards,moved:true,attacked:true,...extra}};
  put([mkUnit("banker",B)],{banker:true});put([mkUnit("debt",B),mkUnit("carriage",B)],{guard:true});put([mkUnit("debt",B),mkUnit("carriage",B)],{guard:true});
  G._vis=null;if(G.map&&G.map.art)for(const k of Object.keys(G.map.art))if(k.startsWith(r+"."+c+"."))delete G.map.art[k]}
/* the Bank's own Collectors ride Carriages here */
function kothCarriages(){const B=npcIx("bank");if(B<0)return;for(const {st} of stacksOf(B))if(!st.banker&&st.cards.length&&st.cards.every(x=>x.unit==="debt"))st.cards.push(mkUnit("carriage",B))}
/* the Banker and his guards stay home; hunters on Carriages cover 3 tiles */
{const _bc=bankCollectors;bankCollectors=async function(){if(!kothOn())return _bc.apply(this,arguments);
  const home=[];for(const {st,r,c} of stacksOf(npcIx("bank")))if(st.banker||st.guard){home.push({st,r,c});G.board[r][c]=null}
  try{await _bc.apply(this,arguments)}finally{for(const h of home)if(!G.board[h.r][h.c])G.board[h.r][h.c]=h.st}
  const B=npcIx("bank"),T=debtTargets();
  for(const {st,r:r0,c:c0} of stacksOf(B)){if(G.over||st.banker||st.guard||st.attacked||!st.cards.some(x=>x.unit==="carriage"))continue;const who=st.hunt!=null?st.hunt:T[0];if(who==null||!G.p[who]||G.p[who].out)continue;
    const tl=stacksOf(who);if(!tl.length)continue;let r=r0,c=c0;const dist=(a,b)=>Math.min(...tl.map(x=>Math.abs(x.r-a)+Math.abs(x.c-b)));
    for(let k=0;k<2;k++){let best=null;for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const rr=r+dr,cc=c+dc;if(rr<0||cc<0||rr>=G.rows||cc>=COLS||isVoid(rr,cc)||G.board[rr][cc])continue;const d=dist(rr,cc);if(d<dist(r,c)&&(!best||d<best.d))best={rr,cc,d}}
      if(!best)break;G.board[best.rr][best.cc]=st;G.board[r][c]=null;r=best.rr;c=best.cc}
    const o=attackOptions(r,c).find(o=>{const E=G.board[o.r][o.c];return E&&E.owner===who&&o.mode!=="capture"&&o.mode!=="destroy"});if(o){attack(r,c,o.r,o.c,o.mode);render();await sleep(300)}}}}
/* the Debt Collector rule (only debtors strike them) holds for those on Carriages too */
{const _ao=attackOptions;attackOptions=function(r,c){const out=_ao(r,c),st=G&&G.board[r]&&G.board[r][c];if(!st||!kothOn())return out;const bk=npcIx("bank");if(bk<0||owesBank(st.owner))return out;
  return out.filter(o=>{const t=G.board[o.r][o.c];return !(t&&t.owner===bk&&t.cards.every(x=>x.unit==="debt"||x.unit==="carriage"))})}}
/* the building in pixel art */
{const _pt=pxTile;pxTile=function(r,c,role,edge){if(!G||!G.kothBank||G.kothBank[0]!==r||G.kothBank[1]!==c)return _pt.apply(this,arguments);
  const P=pxPainter(PXW,PXH),rnd=rng(G.map.seed+r*7+c);pxGround(P,PXPAL.hill.ground,rnd,G.map.seed);
  P.rect(6,14,28,20,[70,62,52]);pxBricks(P,7,15,26,18,6,4,[[96,86,72],[108,96,80],[88,78,66]],[40,34,28],G.map.seed+3);
  for(let y=0;y<9;y++)P.rect(20-y-3,6+y,2*y+6,1,[132,30,36]);P.rect(4,14,32,2,[60,20,24]);
  for(const x of [10,18,26])P.rect(x,19,3,13,[220,206,170]);P.rect(15,26,8,8,[30,22,16]);P.rect(17,9,5,4,[212,167,44]);P.set(19,10,[60,40,10]);
  return P.done()}}

if(window.__EC)Object.assign(window.__EC,{kothFillEther,kothMercs,kothBank,stackLegal:(...a)=>stackLegal(...a),damage:(...a)=>damage(...a),moveTargets:(...a)=>moveTargets(...a)});
