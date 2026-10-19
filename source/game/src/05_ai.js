/* ---------------- the computer opponent (plain code, no language model) ----------------
   Each turn it weighs offense against defense from the board and the decks:
   offense pushes stacks forward, surrounds enemies and casts curses; defense bunkers
   (Kings with Queens, Aces in the back), shields threatened stacks and keeps the deck full.
   Easy adds noise and mistakes; Medium balances; Hard plays every edge it can find. */
const AI=(()=>{
  const LV={
    easy:  {mc:14,noise:.45,thr:.5, spell:.45,skipMove:.35,bias:-.15,draw:3},
    medium:{mc:30,noise:.1, thr:.5, spell:.9, skipMove:.04,bias:0,  draw:2},
    hard:  {mc:48,noise:0,  thr:.46,spell:1,  skipMove:0,  bias:.12,draw:2},
    horde: {mc:36,noise:0,  thr:.4, spell:0,  skipMove:0,  bias:1,  draw:0}
  };
  let FAX=null;   // v38: Field Automation plays a person's field with their settings (see 42_fieldauto.js)
  const L=pl=>FAX&&FAX.pl===pl?LV[FAX.level]||LV.medium:LV[G.p[pl].cpu]||LV.medium;
  const lvl=pl=>FAX&&FAX.pl===pl?FAX.level:G.p[pl].cpu;
  const jit=pl=>1+(Math.random()*2-1)*L(pl).noise;
  const PUSH={atk:1.5,def:.2,dist:1.1,ally:0},OFF={atk:1.3,def:.7,dist:.35,ally:.1},DEF={atk:.8,def:1.35,dist:.06,ally:.35},HORDE={atk:1.5,def:.35,dist:.7,ally:.05};
  let cache=new Map();
  const key=st=>st.cards.map(c=>c.id+(c.hp||"")).join(".")+(st.odds||"");
  function winP(A,D,n,mode){
    const k=key(A)+"|"+key(D)+"|"+(mode||"");if(cache.has(k))return cache.get(k);
    const w0=weaponOf(A,mode),fa=hasK(A,"satan")?null:netFx(A.odds,hated(A)?"dis":null,hated(D)?"adv":null),fd=hasK(D,"satan")?null:netFx(D.odds,hated(D)?"dis":null);
    let w=0;for(let i=0;i<n;i++){const a=rollStack(A,"atk",D,fa,w0),d=rollStack(D,"def",A,fd);if(a.total>d.total)w++}
    const p=w/n;cache.set(k,p);return p;
  }
  function value(st){let v=0;for(const c of st.cards){v+=1+soulOf(c)*.8+rate(c)/7;if(kind(c)==="joker")v+=2+capMana(c)*1.4;if(kind(c)==="ace")v+=3;if(c.hp)v+=c.hp*2.2;if(kind(c)==="tree")v+=4}return v}
  function killsOnHit(st){const b=st.cards.find(isBase);if(b)return !(b.hp>1);if(st.cards.length===1)return !(st.cards[0].hp>1);const low=[...st.cards].sort((a,b)=>nat(a)-nat(b))[0];return kind(low)==="king"}
  function threat(st){
    if(hasBase(st))return 1+(hasK(st,"joker")?3:0);
    let t=Math.max(0,...st.cards.map(c=>kind(c)==="joker"?7:rate(c)))/4+st.cards.length*.4;
    const j=st.cards.find(c=>kind(c)==="joker");if(j)t+=2.5+capMana(j);
    return t;
  }
  const gain=E=>((killsOnHit(E)?value(E):value(E)/E.cards.length)+threat(E)*.35)*(hq()&&hasK(E,"ace")?3:1)*(FAX?FAX.gainMul(E):1);   // in Headquarters the enemy bases are the prize
  const loss=S=>(killsOnHit(S)?value(S):value(S)/S.cards.length)*(FAX?FAX.lossMul:1);
  const dist=(r1,c1,r2,c2)=>Math.abs(r1-r2)+Math.abs(c1-c2);
  /* walking distance around the river and cut corners (straight steps over open tiles) */
  let pcache=new Map();
  function walk(r1,c1,r2,c2){
    if(!G.void||!G.void.some(row=>row.some(Boolean)))return dist(r1,c1,r2,c2);
    const key=r2*16+c2;let F=pcache.get(key);
    if(!F){F=Array.from({length:G.rows},()=>Array(COLS).fill(99));const q=[[r2,c2]];F[r2][c2]=0;
      while(q.length){const [r,c]=q.shift();for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=r+dr,b=c+dc;if(a<0||b<0||a>=G.rows||b>=COLS||isVoid(a,b)||F[a][b]<=F[r][c]+1)continue;F[a][b]=F[r][c]+1;q.push([a,b])}}
      pcache.set(key,F)}
    return F[r1][c1];
  }
  function enemyStacks(pl){return enemiesOf(pl).flatMap(stacksOf).filter(x=>seesTile(pl,x.r,x.c))}   // a deluded computer is as blind as a person
  /* how good it is for stack S (owned by pl) to stand at r,c */
  function tileScore(pl,S,r,c,W,canHit){
    const n=L(pl).mc;let opp=0,risk=0,allies=0;
    const diag=jackOnly(S),shot=S.cards.find(isShooter),hits=canHit&&(!!shot||canAttackFrom({cards:S.cards,attacked:false,hypo:S.hypo}));
    const su=shot?UNIT[shot.unit].weapons.filter(w=>!w.special):S.cards.length===1&&S.cards[0].unit&&UNIT[S.cards[0].unit].weapons?UNIT[S.cards[0].unit].weapons:null;
    const SA=shot?{cards:[shot],owner:pl}:S;
    const inReach=(er,ec)=>su?su.some(w=>w.reach==="charge"?(r===er&&Math.abs(c-ec)<=3&&Math.abs(c-ec)>=2)||(c===ec&&Math.abs(r-er)<=3&&Math.abs(r-er)>=2):reaches(w.reach,r,c,er,ec)):adjacent(r,c,er,ec,diag);
    let near=99;
    for(const e of enemyStacks(pl)){
      const E=e.st,d=walk(r,c,e.r,e.c);near=Math.min(near,d);
      if(hits&&!E.hypo&&!shielded(E.owner)&&inReach(e.r,e.c)){
        const p=winP(SA,E,n);let sc=shot?p*gain(E):p*gain(E)-(1-p)*loss(S);
        const ring=stacksOf(pl).filter(x=>x.st!==S&&adjacent(x.r,x.c,e.r,e.c,false)).length;sc+=ring*.3;
        if(sc>opp)opp=sc;
      }
      const esh=E.cards.find(isShooter),reach=esh?(esh.unit==="cannon"?4:3):jackOnly(E)||soloUnit(E)?3:2;
      if(d<=reach&&(esh||canAttackFrom({cards:E.cards,attacked:false,hypo:E.hypo}))&&!S.hypo){
        const p=winP(esh?{cards:[esh],owner:E.owner}:E,S,n);const rk=p*loss(S)*(d===1?1:.7);if(rk>risk)risk=rk;
      }
    }
    for(const x of stacksOf(pl))if(x.st!==S&&dist(x.r,x.c,r,c)===1)allies++;
    if(near===99){   // nothing in sight (fog of war): head for the enemy's ground
      let d=99;for(const e of enemiesOf(pl))for(const [er,ec] of zoneTiles(e))d=Math.min(d,walk(r,c,er,ec));near=d===99?0:d*.8}
    // the Horde and offense push toward the enemy's back line too
    const ctr=W.ctr?Math.abs(r-(G.rows-1)/2)+Math.abs(c-(COLS-1)/2):0;   // Field Automation: holding the center
    return W.atk*opp-W.def*risk-W.dist*near+W.ally*allies-(W.ctr||0)*ctr;
  }
  /* v44 · Field Automation: support cards (Scouts, Healers, Repairmen) serve the stacks they support instead of chasing fights.
     A Healer keeps beside or inside a hurt or strong stack, a Repairman beside a damaged base, a Scout a step or two from its own
     stacks and two or three from the enemy, where it sees without being caught. */
  const SUPPORT=new Set(["scout","healer","repair"]);
  const isSupport=grp=>grp.length>0&&grp.every(c=>SUPPORT.has(c.unit));
  function supportScore(pl,S,r,c,W,from){
    let s=tileScore(pl,S,r,c,{atk:0,def:Math.max(1,W.def||1),dist:0,ally:0},false);   // the risk of standing here
    const us=new Set(S.cards.map(x=>x.unit)),friends=stacksOf(pl).filter(x=>x.st!==from&&!x.st.cards.every(y=>SUPPORT.has(y.unit)));
    const hurt=st=>st.cards.some(x=>x.maxHp&&x.hp<x.maxHp&&!isBase(x)),broken=st=>{const b=st.cards.find(isBase);return b&&(b.hp||1)<(b.maxHp||1)};
    const best=f=>friends.reduce((m,x)=>Math.max(m,f(x,dist(r,c,x.r,x.c))),-9);
    if(us.has("healer"))s+=best((x,d)=>d<=1?(hurt(x.st)?3:.6+value(x.st)/20):-.25*d*(hurt(x.st)?1:.4));
    if(us.has("repair"))s+=best((x,d)=>broken(x.st)?(d<=1?4:-.35*d):hasBase(x.st)&&d<=1?1:-.1*d);
    if(us.has("scout")){s+=best((x,d)=>d>=1&&d<=2?1.2:d===0?.2:-.2*d);
      const es=enemyStacks(pl);if(es.length){const n=Math.min(...es.map(e=>walk(r,c,e.r,e.c)));s+=n===1?-1.5:n<=3?1.5:-.15*n}
      else{let d=99;for(const e of enemiesOf(pl))for(const [er,ec] of zoneTiles(e))d=Math.min(d,walk(r,c,er,ec));if(d<99)s-=.12*d}}
    return s;
  }
  function stance(pl){
    if(isHorde(pl))return HORDE;
    if(G.turnNo-(G.lastAttack||0)>10)return PUSH;   // nobody has fought for five rounds: break the stalemate
    const es=enemiesOf(pl).filter(e=>!isNPC(e)),my=stacksOf(pl).reduce((a,x)=>a+value(x.st),0),th=enemyStacks(pl).reduce((a,x)=>a+value(x.st),0)/Math.max(1,es.length);
    const eDeck=es.length?Math.min(...es.map(e=>G.p[e].deck.length)):0,deckAdv=(G.p[pl].deck.length-eDeck)/40;
    let o=my/(th+1)+deckAdv+L(pl).bias;
    if(lvl(pl)==="easy")o+=Math.random()*.6-.3;
    if(!G.p[pl].deck.length||!eDeck||G.turnNo>90*Math.max(1,G.p.length/2)||hq()&&G.turnNo>8)return OFF;   // a dry deck ends the waiting game
    return o>1?OFF:DEF;
  }
  function withSel(r,c,ids,fn){const old=G.sel;G.sel={r,c,pick:new Set(ids)};try{return fn()}finally{G.sel=old}}
  const step=()=>{render();return sleep(G.p[G.active].cpu==="horde"?260:420)};

  /* ---------- placement ---------- */
  function placeScore(pl,card,r,c,W){
    const t=G.board[r][c];const S={cards:t?[...t.cards,card]:[card],owner:pl,hypo:t?t.hypo:0};
    const k=kind(card),u=card.unit;
    if(u==="wall")return ((isFront(pl,r,c)?3:1.5)+(enemyStacks(pl).some(e=>dist(e.r,e.c,r,c)<=3)?1:0)-stacksOf(pl).filter(x=>hasK(x.st,"wall")).length*1.5)*jit(pl);
    if(u==="miner"){if(t&&hasK(t,"ace"))return 4.5*jit(pl);if(t)return -1;
      const cr=(G.crystals||[]).filter(x=>!G.board[x.r][x.c]||G.board[x.r][x.c].owner===pl);if(!cr.length)return -1;
      return (3.2-Math.min(...cr.map(x=>dist(x.r,x.c,r,c)))*.25-(enemyStacks(pl).some(e=>dist(e.r,e.c,r,c)<=1)?2:0))*jit(pl)}
    if(u==="archer"||u==="cannon")return (t?(hasBase(t)?4+(enemyStacks(pl).some(e=>Math.max(Math.abs(e.r-r),Math.abs(e.c-c))<=3)?1:0):2):(isBack(pl,r,c)?2.2:1.4))*jit(pl);
    if(u==="healer")return (t?2+value(t)/6:-.5)*jit(pl);
    if(u==="repair"){const b=t&&t.cards.find(isBase);return (b?3+((b.hp||1)<(b.maxHp||1)?2:0):t?.8:-.5)*jit(pl)}
    if(u==="ram")return (t&&enemyWalls(pl)?3:t?.3:-1)*jit(pl);
    if(k==="tree")return (t?-9:(isBack(pl,r,c)?4:3)-tileScore(pl,{cards:[card],owner:pl},r,c,DEF,false)*.1)*jit(pl);
    if(t&&hasBase(t)&&k!=="ace")return (hq()?1.2+rate(card)/12-t.cards.length*.15:(W===DEF?.7:.2)-t.cards.length*.3)*jit(pl);   // cards inside an Ace cannot fight, and die with it
    let s=tileScore(pl,S,r,c,W,false)-(t?tileScore(pl,t,r,c,W,false):0)+value(S)-(t?value(t):0);
    if(k==="ace")s+=lvl(pl)==="hard"?4:2;
    if(k==="queen"&&t&&hasK(t,"king"))s+=W===DEF?3:1.5;
    if(k==="king"&&t&&hasK(t,"queen"))s+=W===DEF?3:1.5;
    if(k==="joker")s+=enemyStacks(pl).some(e=>dist(e.r,e.c,r,c)<=2)?2:.5;
    if(isFront(pl,r,c)&&W===OFF)s+=.4;
    if(isBack(pl,r,c)&&W===DEF)s+=.3;
    return s*jit(pl);
  }
  async function placements(pl,W,keep){
    for(let guard=0;guard<8;guard++){
      const P=G.p[pl];if(P.hand.length<=keep+(P.deck.length?0:1))return;
      let best=null;
      for(const card of P.hand)for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++){
        if(!canPlace(card,r,c))continue;
        const s=placeScore(pl,card,r,c,W);if(!best||s>best.s)best={card,r,c,s};
      }
      if(!best||best.s<.6)return;
      place(best.card,best.r,best.c);cache.clear();await step();
    }
  }
  /* ---------- movement ---------- */
  async function moves(pl,W){
    const lv=L(pl);
    const order=isHorde(pl)?stacksOf(pl).sort((a,b)=>stackRate(b.st)-stackRate(a.st)):stacksOf(pl).sort((a,b)=>{const na=Math.min(99,...enemyStacks(pl).map(e=>dist(a.r,a.c,e.r,e.c))),nb=Math.min(99,...enemyStacks(pl).map(e=>dist(b.r,b.c,e.r,e.c)));return na-nb});
    for(const o of order){
      if(G.over)return;
      const st=G.board[o.r][o.c];if(!st||st!==o.st||st.owner!==pl||st.moved)continue;
      if(Math.random()<lv.skipMove)continue;
      if(st.cards.every(c=>c.unit==="miner"))continue;   // lone Miners have their own errands
      let grp=st.cards.filter(c=>!isBase(c)&&!(hasBase(st)&&c.unit&&(c.unit==="miner"||c.unit==="repair"||UNIT[c.unit].shooter)));   // Miners, Repairmen and shooters stay in their base
      if(!grp.length||st.stun)continue;
      if(FAX&&!FAX.ok(grp))continue;   // Field Automation: a stack it doesn't control stays where the player put it
      if(!stackLegal(grp)){ // too many to leave together (a full Ace): send out the strongest group that can stand on its own
        const g2=[];for(const c of [...grp].sort((a,b)=>rate(b)-rate(a)))if(stackLegal([...g2,c]))g2.push(c);grp=g2;if(!grp.length)continue}
      const inAce=hasBase(st);const S={cards:grp,owner:pl,hypo:st.hypo};
      if(FAX&&FAX.flee&&!inAce&&(st.peak||0)>=2&&grp.length<=Math.floor(st.peak/2)){   // v47: Flee when low: pull back, toward friends
        const W2={atk:0,def:2.2,dist:-.5,ally:.6},tg=withSel(o.r,o.c,grp.map(c=>c.id),moveTargets),stay=tileScore(pl,S,o.r,o.c,W2,false);let best=null;
        for(const [r,c] of tg){if(G.board[r][c])continue;const sc=tileScore(pl,S,r,c,W2,false)*jit(pl);if(!best||sc>best.s)best={r,c,s:sc}}
        if(best&&best.s>stay+.15){G.sel={r:o.r,c:o.c,pick:new Set(grp.map(c=>c.id))};doMove(best.r,best.c);G.sel=null;cache.clear();await step()}
        continue}
      if(FAX&&isSupport(grp)){const tg=withSel(o.r,o.c,grp.map(c=>c.id),moveTargets),stay=supportScore(pl,S,o.r,o.c,W,st);let best=null;
        for(const [r,c] of tg){const sc=supportScore(pl,S,r,c,W,st)*jit(pl);if(!best||sc>best.s)best={r,c,s:sc}}
        if(best&&best.s>stay+.2){G.sel={r:o.r,c:o.c,pick:new Set(grp.map(c=>c.id))};doMove(best.r,best.c);G.sel=null;cache.clear();await step()}
        continue}
      let stay=inAce?tileScore(pl,S,o.r,o.c,W,false)+(hq()?-1:W===DEF?.6:0):tileScore(pl,S,o.r,o.c,W,true);
      const tg=withSel(o.r,o.c,grp.map(c=>c.id),moveTargets);
      let best=null;
      for(const [r,c] of tg){
        const t=G.board[r][c];
        let s;
        if(t){const M={cards:[...t.cards,...grp],owner:pl,hypo:0};s=tileScore(pl,M,r,c,W,true)-tileScore(pl,t,r,c,W,true)+.2+(W.stack||0)}
        else s=tileScore(pl,S,r,c,W,true);
        s*=jit(pl);
        if(!best||s>best.s)best={r,c,s};
      }
      if(best&&best.s>stay+.15){
        G.sel={r:o.r,c:o.c,pick:new Set(grp.map(c=>c.id))};doMove(best.r,best.c);G.sel=null;cache.clear();await step();
      }
    }
  }
  /* ---------- attacks ---------- */
  function bestAttack(pl){
    const lv=L(pl);let best=null;
    for(const {st,r,c} of stacksOf(pl)){
      for(const o of attackOptions(r,c)){
        if(FAX&&!FAX.okAtk(st,o))continue;   // Field Automation: only the cards it controls
        const r2=o.r,c2=o.c,E=G.board[r2][c2];
        if(o.mode==="capture"||o.mode==="destroy"||o.mode==="ram"){const sc=(o.mode==="capture"?value(E)+2:o.mode==="ram"?3.5:value(E)*.8+.5)*jit(pl);if(!best||sc>best.sc)best={r,c,r2,c2,sc,p:1,mode:o.mode};continue}
        if(o.mode==="suppress"){if(lvl(pl)!=="easy"&&canAttackFrom({cards:E.cards,attacked:false})&&Math.random()<.12){const sc=.45;if(!best||sc>best.sc)best={r,c,r2,c2,sc,p:1,mode:o.mode}}continue}
        const p0=o.mode==="stomp"?(E.pin?0:.62):winP(o.A||st,E,lv.mc,o.mode),p=o.ranged||o.mode==="stomp"?Math.min(1,p0+(1-p0)*.6):p0;   // a ranged miss (or a failed Stomp) costs nothing
        const sc=(p*gain(E)*(o.mode==="stomp"?.6:1)-(1-p)*loss(st))*jit(pl);
        const late=isHorde(pl)?0:G.turnNo>90?Math.min(.25,.1+(G.turnNo-90)/200):!G.p[pl].deck.length?.1:0;
  
        const go=p>=(lv.thr-late+(FAX?FAX.thrAdj:0))*(lvl(pl)==="easy"?(.7+Math.random()*.6):1)||(lvl(pl)!=="easy"&&sc>.4)||isHorde(pl);   // the Horde never holds back: whatever it can reach, it hits
        if(go&&(!best||sc>best.sc))best={r,c,r2,c2,sc,p,mode:o.mode};
      }
    }
    return best;
  }
  async function attacks(pl){
    for(let guard=0;guard<24;guard++){
      if(G.over)return;cache.clear();pcache.clear();
      const b=bestAttack(pl);if(!b)return;
      attack(b.r,b.c,b.r2,b.c2,b.mode);await sleep(isHorde(pl)?420:650);render();
    }
  }
  /* ---------- spells ---------- */
  async function tryCast(id,r,c,ids){
    const sp=SP(id),P=G.p[G.active];
    if(!P.deck.length&&!P.hand.length&&mana(G.active)-spellCost(sp)<=0&&id!=="bless")return false; // never spend the last soul with no deck and no hand
    const ok=()=>r==null?spellReady(sp):withSel(r,c,ids||[],()=>spellReady(sp));
    if(!ok())return false;
    if(r!=null)G.sel={r,c,pick:new Set(ids||[])};
    await cast(sp);G.sel=null;cache.clear();await step();return true;
  }
  async function suicides(pl){
    const lv=lvl(pl);if(lv==="easy"&&Math.random()<.5)return;
    for(const {st,r,c} of stacksOf(pl)){
      const j=st.cards.find(x=>kind(x)==="joker");if(!j||!j.captured||!j.captured.length)continue;
      const cm=capMana(j),room=soulCap(pl)-mana(pl);
      let danger=0;for(const e of enemyStacks(pl))if(dist(e.r,e.c,r,c)<=2&&canAttackFrom({cards:e.st.cards,attacked:false}))danger=Math.max(danger,winP(e.st,st,24));
      const want=(cm>=4&&room>=cm-1)||(cm>=2&&danger>.55)||(lv==="hard"&&cm>=3&&mana(pl)<=2);
      if(want&&!G.moon.blood){await tryCast("suicide",r,c,[]);return}
    }
  }
  async function sacrifices(pl,target,keep){
    const P=G.p[pl];
    while(mana(pl)<target&&P.hand.length>keep){
      const c=[...P.hand].filter(c=>mana(pl)+soulOf(c)<=soulCap(pl)&&kind(c)!=="ace"&&kind(c)!=="joker"&&canSacCard(c)&&!(c.unit==="scout"&&fogOn()&&scoutsOf(pl).length<2)&&!keepSupport(pl,c)).sort((a,b)=>rate(a)-rate(b))[0];
      if(!c)break;
      if(rate(c)>14&&mana(pl)>=2)break;
      sacrifice(c,"hand");await step();
    }
  }
  async function necro(pl){
    const lv=lvl(pl),aces=stacksOf(pl).filter(x=>hasK(x.st,"ace")).length;
    if(G.p[pl].tribe!=="firm"&&G.grave.length>=2&&mana(pl)>=(lv==="hard"?1:2)&&(lv!=="easy"||Math.random()<.4)&&(aces>=1||lv==="hard"))await tryCast("ritual");
    if(!(lv==="easy"&&Math.random()<.3))await tryCast("bless");
  }
  async function curses(pl,W){
    const es=enemiesOf(pl).filter(e=>!isHorde(e));if(!es.length)return;
    const lv=lvl(pl),F=G.p[es.reduce((a,b)=>G.p[b].hand.length>G.p[a].hand.length?b:a)],P=G.p[pl],sp=L(pl).spell;
    if(Math.random()>sp)return;
    // shield the most exposed valuable stack
    if((W===DEF||lv==="hard")&&stacksOf(pl).length>=2){
      let best=null;
      for(const x of stacksOf(pl)){if(x.st.hypo)continue;let rk=0;
        for(const e of enemyStacks(pl))if(dist(e.r,e.c,x.r,x.c)<=2&&canAttackFrom({cards:e.st.cards,attacked:false}))rk=Math.max(rk,winP(e.st,x.st,24));
        const v=rk*value(x.st);if(rk>.55&&value(x.st)>7&&(!best||v>best.v))best={...x,v}}
      if(best&&mana(pl)>=3+best.st.cards.length-1)await tryCast("hypo",best.r,best.c,[]);
    }
    if(F.hand.length>=(lv==="hard"?4:5))await tryCast("forced");
    if(F.hand.length>=2&&F.hand.length>=P.hand.length+(lv==="hard"?1:2))await tryCast("three");
    if((P.deck.length>=F.deck.length+(lv==="hard"?5:9))||(F.deck.length<=8&&P.deck.length>F.deck.length))await tryCast("double");
    if(P.hand.length<=1&&P.deck.length>4&&spellCost(SP("clair"))<=3)await tryCast("clair");
    if(lv!=="easy"&&mana(pl)>=6&&G.grave.some(c=>["ace","king","joker"].includes(kind(c))))await tryCast("resur");
  }
  async function odds(pl){
    const lv=L(pl);if(Math.random()>lv.spell)return;
    for(let i=0;i<(lvl(pl)==="hard"?2:1);i++){
      if(mana(pl)<3)return;
      let best=null;
      for(const {st,r,c} of stacksOf(pl)){if(!canAttackFrom(st))continue;
        for(const [r2,c2] of withSel(r,c,[],attackTargets)){const E=G.board[r2][c2],p=winP(st,E,lv.mc,(attackOptions(r,c).find(o=>o.r===r2&&o.c===c2)||{}).mode);
          if(p>=.28&&p<=.72){const g=gain(E);if(!best||g>best.g)best={r,c,r2,c2,g}}}}
      if(!best)return;
      const E=G.board[best.r2][best.c2];
      if(!E.odds&&await tryCast("hexed",best.r2,best.c2,[]))continue;
      if(!G.board[best.r][best.c].odds)await tryCast("divine",best.r,best.c,[]);
    }
  }
  async function conjures(pl,W){
    const lv=lvl(pl),P=G.p[pl];if(Math.random()>L(pl).spell)return;
    // keep the deck alive with whatever mana is left
    const low=P.deck.length<(lv==="hard"?Math.max(18,P.start*.7):12);
    if(low||mana(pl)>=5){
      const order=lv==="hard"&&stacksOf(pl).filter(x=>hasK(x.st,"ace")).length<2?["ca","ck","cjk","cj","cs"]:W===DEF?["ck","cq","ca","cs"]:["cj","ck","cs","cjk"];
      for(const id of order){if(mana(pl)<(low?1:3))break;await tryCast(id)}
    }
  }
  function shouldDraw(pl){
    const P=G.p[pl],lv=lvl(pl);
    if(!P.deck.length||P.hand.length>handCap(pl)-4+(lv==="easy"?1:0))return false;
    if(lv==="hard")return P.hand.length<=1||(P.hand.length<=2&&P.deck.length>P.start*.5);
    return P.hand.length<=2;
  }
  /* ---------- whole turns ---------- */
  /* one phase of a computer's turn */
  async function phase(pl,ph){
    cache.clear();pcache.clear();
    if(isHorde(pl))return hordePhase(pl,ph);
    if(ph==="draw"){for(let n=0;n<3&&shouldDraw(pl);n++){rollDraw();await step()}return}
    if(ph==="prep"){
      const W=stance(pl),lv=lvl(pl);
      log(`${plName(pl)} ${W===PUSH?"pushes to break the standoff":"leans to "+(W===DEF?"defense":"offense")}.`,"ai");
      await suicides(pl);
      await sacrifices(pl,lv==="hard"?5:lv==="medium"?4:2,lv==="hard"?2:1);
      await necro(pl);
      await aiSubstance(pl,W);
      await curses(pl,W);
      await placements(pl,W,lv==="hard"?1:0);
      await moves(pl,W);
      await odds(pl);
      await conjures(pl,W);
      G.sel=null;await step();return;
    }
    if(ph==="attack"){await attacks(pl);await aiMoonAttack(pl);G.sel=null}
  }
  async function setup(pl){
    const W=DEF,cx=(COLS-1)/2,cy=(G.rows-1)/2;
    while(G.setupStep==="ace"){
      const free=backTiles(pl).filter(([r,c])=>!G.board[r][c]).sort((a,b)=>Math.hypot(a[0]-cy,a[1]-cx)-Math.hypot(b[0]-cy,b[1]-cx));
      if(!free.length)break;
      const pool=lvl(pl)==="easy"?free:free.slice(0,3),[r,c]=pick(pool);
      await sleep(300);placeOpening(pl,r,c);render();await sleep(200);
    }
    const prev=G.phase;G.phase="setup";
    await placements(pl,W,lvl(pl)==="hard"?2:1);
    G.phase=prev;
  }
  async function hordePhase(pl,ph){
    if(ph==="draw")return;
    if(ph==="prep"){
      hordeSpawn();await sleep(700);render();await step();
      // Horde Jokers: shoot themselves once they hold souls
      for(const {st,r,c} of stacksOf(pl)){const j=st.cards.find(x=>kind(x)==="joker");
        if(j&&j.captured&&j.captured.length&&(j.captured.length>=2||Math.random()<.35)){await jokerSuicide(r,c,st,pl);await step();if(G.over)return}}
      await moves(pl,HORDE);return;
    }
    await attacks(pl);
  }
  const cardVal=c=>({ace:9,king:8,joker:7.5,jack:6,queen:5.5}[kind(c)]||(num(c)/2+1));
  function choose(pl,spec){
    const lv=lvl(pl);
    if(spec.kind==="choice")return spec.options[0].id;
    if(spec.kind==="player"){const ps=spec.players;const by=f=>ps.reduce((a,b)=>f(b)>f(a)?b:a);
      if(spec.id==="double")return by(x=>G.p[x].deck.length);
      if(spec.id==="naked")return pick(ps);
      return by(x=>G.p[x].hand.length)}
    if(spec.kind==="cards"){
      const cards=spec.cards;if(!cards.length)return null;
      if(spec.id==="shop"){let b=-1;cards.forEach((c,i)=>{if(costOf(c)<=mana(pl)&&(b<0||cardVal(c)>cardVal(cards[b])))b=i});return b<0||mana(pl)<1?null:b}
      if(lv==="easy"&&Math.random()<.5)return Math.floor(Math.random()*cards.length);
      let b=0;cards.forEach((c,i)=>{if(cardVal(c)>cardVal(cards[b]))b=i});return b;
    }
    if(spec.kind==="yesno"){
      if(spec.id==="fullmoon"){
        if(lv==="easy")return Math.random()<.5;
        const st=spec.target.st,n=stacksOf(pl).length;
        if(n<=1)return false;
        const refuse=mana(pl)*1.1+Math.min(5,G.p[pl].deck.length)*(G.p[pl].deck.length<15?1.4:.7);
        return value(st)<refuse+2;
      }
      return true;
    }
    return null;
  }
  /* the best tile for a card that has to go down now (a deployed Slave) */
  function bestSpot(pl,card,ctx){   // ctx: a person's Field Automation settings (Lazy Hand follows them)
    const old=FAX;if(ctx)FAX=Object.assign({pl},ctx);
    try{const W=ctx?ctx.W:stance(pl);let best=null;
      for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++){if(!canPlace(card,r,c))continue;const s=placeScore(pl,card,r,c,W);if(!best||s>best.s)best={r,c,s}}
      return best?[best.r,best.c]:null}
    finally{FAX=old;cache.clear()}
  }
  /* Field Automation: the field of a person, with their settings in ctx (built in 42_fieldauto.js) */
  async function field(pl,ph,ctx){FAX=Object.assign({pl},ctx);cache.clear();pcache.clear();
    for(const {st} of stacksOf(pl))st.peak=Math.max(st.peak||0,st.cards.filter(c=>!isBase(c)).length);   // how big each stack has been, for Flee when low
    try{
      if(ph==="prep"){if(ctx.moves)await moves(pl,ctx.W);
        if(ctx.ambushP>0)for(const {st,r,c} of stacksOf(pl)){if(!canAmbush(st)||st.ambush||st.moved||st.attacked||!ctx.ok(st.cards.filter(x=>!isBase(x))))continue;
          if(!attackOptions(r,c).length&&Math.random()<ctx.ambushP){st.ambush=true;log(`${plName(pl)}'s field sets a stack in ambush.`,"ai")}}}
      else if(ph==="attack")await attacks(pl);
    }finally{FAX=null;cache.clear();G.sel=null}}
  return{phase,setup,choose,winP,value,LV,bestSpot,field,stance:pl=>stance(pl),W:{PUSH,OFF,DEF},enemyStacks:pl=>enemyStacks(pl)};
})();
