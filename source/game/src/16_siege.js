/* ---------------- Prompt 8: Archers, Cannons, Healers, Walls, Repairmen, Battering Rams, Miners, crystals, Field Libation ----------------
   Every one of these waits in the Ether (counts per deck below) and is bought with a Conjure spell. The Beginner starts with a kit. */

/* ---------- the Ether ---------- */
const SIEGE_PER_DECK={archer:8,healer:4,repair:4,wall:4,ram:4,miner:4,cannon:1};
const BEGINNER_KIT={archer:2,wall:1,repair:2,ram:1};
function siegeDecks(pls){
  const n=deckCount(),pool={};for(const u in SIEGE_PER_DECK)pool[u]=SIEGE_PER_DECK[u]*n;
  for(const pl of pls){const P=G.p[pl];if(P.tribe!=="beginner")continue;
    for(const u in BEGINNER_KIT)for(let i=0;i<BEGINNER_KIT[u]&&pool[u]>0;i++){P.deck.push(mkUnit(u,pl));pool[u]--}
    shuffle(P.deck)}
  if(G.opts.deckMiner)for(const pl of pls){const P=G.p[pl];P.deck.push(mkUnit("miner",pl));if(pool.miner>0)pool.miner--;shuffle(P.deck)}   // v74d: one Miner shuffled into every deck (the default)
  for(const u in pool)for(let i=0;i<pool[u];i++)G.ether.push(mkUnit(u,null));
}

/* ---------- small helpers ---------- */
const tnOf=pl=>G.p[pl]?G.p[pl].tn||0:0;                       // a player's own turn count
const shotReady=(card,pl)=>(card.readyAt||0)<=tnOf(pl);
const repLocked=st=>st.repLock!=null&&tnOf(st.owner)<st.repLock;   // a Repairman is at work: nobody fires from the base
const healerOf=st=>st.cards.find(c=>c.unit==="healer");
const repairOf=st=>st.cards.find(c=>c.unit==="repair");
const isShooter=c=>!!(c&&c.unit&&UNIT[c.unit].shooter);
function shieldUp(st){const h=healerOf(st);return !!h&&(h.shieldAt||0)<=G.moon.round&&tnOf(st.owner)>=(h.shieldOff||0)}
function breakShield(st,r,c){const h=healerOf(st),d=R(4);h.shieldAt=G.moon.round+d;
  log(`The Healer's shield on ${coord(r,c)} turns the whole blow and breaks; it comes back in ${d} round${d>1?"s":""} (1d4).`,"event");notify(st.owner,`A Healer's shield breaks on ${coord(r,c)}.`)}
function giveMana(pl,n){let got=0;for(let i=0;i<n&&mana(pl)<surCap(pl);i++){const j=G.ether.findIndex(c=>/^\d+$/.test(c.rank));const c=j>=0?G.ether.splice(j,1)[0]:mk(String(2+Math.floor(Math.random()*9)),pick(["S","H","D","C"]));if(addSoul(pl,c))got++}return got}
const enemyWalls=pl=>enemiesOf(pl).flatMap(stacksOf).some(x=>hasK(x.st,"wall"));

/* ---------- capture slots ---------- */
// support cards standing alone (and a lone Cannon) can't defend themselves: an enemy beside them takes one or destroys one
const lonely=t=>!hasBase(t)&&t.cards.every(c=>c.unit&&(UNIT[c.unit].sup||c.unit==="cannon"));
const CAPT_ORDER=["cannon","healer","repair","ram","miner"];
const captureCard=t=>[...t.cards].sort((a,b)=>CAPT_ORDER.indexOf(a.unit)-CAPT_ORDER.indexOf(b.unit))[0];
function canCapture(A,t){const x=captureCard(t);if(x.unit==="ram")return stackLegal([...A.cards,x]);return !A.captive}
function takeCaptive(A,x){clearMarks(x);x.capturedFrom=x.owner;x.owner=A.owner;x.inSlot=null;x.readyAt=0;A.captive=x}
/* v78j: a stack left with no cards leaves its tile, and what it held captive goes free (sacrifices, Teleport, God Hunger
   and the like emptied stacks without it, and the captive was lost) */
function vacate(r,c,st){if(st.cards.length)return false;G.board[r][c]=null;freeCaptive(st,r,c);return true}
function freeCaptive(st,r,c){const x=st.captive;if(!x)return;st.captive=null;const o=x.capturedFrom;
  if(o!=null&&G.p[o]&&!G.p[o].out&&!G.board[r][c]&&!isVoid(r,c)){clearMarks(x);x.owner=o;x.capturedFrom=null;G.board[r][c]={owner:o,cards:[x],moved:true,attacked:true};log(`The captured ${esc(nameOf(x))} on ${coord(r,c)} breaks free and goes back to ${plName(o)}.`)}
  else{toGrave(x,"death")}}
function takeSupport(r1,c1,r2,c2,mode){
  const A=G.board[r1][c1],T=G.board[r2][c2],x=captureCard(T),from=T.owner;A.attacked=true;G.lastAttack=G.turnNo;
  if(A.ambush)A.ambush=false;
  T.cards.splice(T.cards.indexOf(x),1);vacate(r2,c2,T);
  if(mode==="destroy"){log(`<b>${plName(A.owner)}</b> destroys ${plName(from)}'s ${esc(nameOf(x))} on ${coord(r2,c2)}.`,"combat");bury(x,r2,c2,T)}
  else if(x.unit==="ram"){clearMarks(x);x.owner=A.owner;A.cards.push(x);log(`<b>${plName(A.owner)}</b> captures ${plName(from)}'s Battering Ram on ${coord(r2,c2)}: it joins the stack on ${coord(r1,c1)}.`,"combat")}
  else{takeCaptive(A,x);log(`<b>${plName(A.owner)}</b> captures ${plName(from)}'s ${esc(nameOf(x))} on ${coord(r2,c2)} into the capture slot of the stack on ${coord(r1,c1)}.`,"combat")}
  if(!G.board[r2][c2])freeCaptive(T,r2,c2);
  checkWin();return{win:true,line:""};
}
/* where a captive can be set to work: beside the stack (an empty tile, or a stack of yours it can join) */
function releaseSpots(st,r,c){const x=st.captive,out=[];if(!x)return out;
  for(const [dr,dc] of [[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const rr=r+dr,cc=c+dc;if(rr<0||cc<0||rr>=G.rows||cc>=COLS||isVoid(rr,cc))continue;const t=G.board[rr][cc];
    if(!t&&(dr||dc))out.push([rr,cc]);else if(t&&t.owner===st.owner&&stackLegal([...t.cards,x]))out.push([rr,cc])}
  return out}
function release(r,c,rr,cc){const st=G.board[r][c],x=st.captive;st.captive=null;x.owner=st.owner;x.capturedFrom=null;const t=G.board[rr][cc];
  if(t)t.cards.push(x);else G.board[rr][cc]={owner:st.owner,cards:[x],moved:true,attacked:true};
  log(`${plName(st.owner)} sets the captured ${esc(nameOf(x))} to work on ${coord(rr,cc)}: it is theirs now.`)}

/* ---------- Archers: Suppress ---------- */
function suppress(r1,c1,r2,c2,opt){
  const A=G.board[r1][c1],D=G.board[r2][c2],d=R(2),w=R(2);A.attacked=true;G.lastAttack=G.turnNo;if(A.ambush)A.ambush=false;
  opt.card.readyAt=tnOf(A.owner)+d+1;D.supp={n:w};
  tray(A.owner,"Suppress",[{s:2,v:d},{s:2,v:w}],`rest ${d} · ${w} turns`);
  log(`<b>${plName(A.owner)}</b>'s Archer on ${coord(r1,c1)} suppresses ${plName(D.owner)}'s stack on ${coord(r2,c2)}: disadvantage on its next attack, unless it waits out ${w} of its turns (1d2). The Archer rests for ${d} turn${d>1?"s":""} (1d2).`,"combat");
  return{win:false,line:""};
}

/* ---------- Walls ---------- */
function wallHit(r,c,n,why){const st=G.board[r][c];if(!st)return;const w=st.cards.find(x=>x.unit==="wall");if(!w)return;
  w.hp=Math.max(0,w.hp-n);
  if(w.hp>0){log(`${why}: the Wall on ${coord(r,c)} loses ${n} heart${n>1?"s":""} (${w.hp} left).`,"combat");return}
  const dead=st.cards.splice(0);G.board[r][c]=null;log(`${why}: the Wall on ${coord(r,c)} falls, and every card inside it dies with it.`,"event");
  for(const d of dead)bury(d,r,c,st);freeCaptive(st,r,c);checkWin();
}
function ramWall(r1,c1,r2,c2){const A=G.board[r1][c1];A.attacked=true;G.lastAttack=G.turnNo;if(A.ambush)A.ambush=false;SND.gun();
  log(`<b>${plName(A.owner)}</b>'s Battering Ram on ${coord(r1,c1)} slams into the Wall on ${coord(r2,c2)}.`,"combat");wallHit(r2,c2,2,"The Battering Ram");return{win:true,line:""}}

/* ---------- Healers ---------- */
function healTargets(st,r,c){const out=[];
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const t=at(r+dr,c+dc);if(!t||t.owner!==st.owner)continue;
    for(const x of t.cards)if(x.maxHp&&x.hp<x.maxHp&&!isBase(x))out.push({x,r:r+dr,c:c+dc})}
  return out}
const healReady=st=>{const h=healerOf(st);return !!h&&(h.healAt||0)<=tnOf(st.owner)&&shieldUp(st)};
function healAct(r,c,T){const st=G.board[r][c],h=healerOf(st),d=R(2)+2,n=tnOf(st.owner);T.x.hp++;h.healAt=n+d;h.shieldOff=n+3;
  tray(st.owner,"Heal",[{s:2,v:d-2}],`next heal in ${d}`);
  log(`${plName(st.owner)}'s Healer on ${coord(r,c)} heals ${esc(nameOf(T.x))} on ${coord(T.r,T.c)} (${T.x.hp}/${T.x.maxHp}). The shield is down for 3 turns, and the next heal waits ${d} turns (1d2 + 2).`)}

/* ---------- Repairmen ---------- */
function repairTargets(st,r,c){const out=[];
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const t=at(r+dr,c+dc);if(!t||t.owner!==st.owner||!hasBase(t)||repLocked(t))continue;
    const b=t.cards.find(isBase),k=kind(b),hp=b.hp||1,mx=b.maxHp||hp,R0=r+dr,C0=c+dc;
    if(hp<mx)out.push({t,b,r:R0,c:C0,act:"repair",label:`Repair the ${KNAME[k]} on ${coord(R0,C0)}`,sub:`+1 heart (${hp}/${mx})`});
    else if(k==="tree"&&mx<5)out.push({t,b,r:R0,c:C0,act:"upgrade",label:`Strengthen the Tree on ${coord(R0,C0)}`,sub:`${mx} → ${mx+1} hearts (five at most)`});
    else if(k==="ace"&&!b.upgraded)out.push({t,b,r:R0,c:C0,act:"aceup",label:`Upgrade the Ace on ${coord(R0,C0)}`,sub:`${mx} → ${mx+1} hearts, once; the Repairman gives his life and goes to the grave`})}
  return out}
const repairReady=st=>{const m=repairOf(st);return !!m&&(m.repAt||0)<=tnOf(st.owner)};
function repairAct(r,c,T){const st=G.board[r][c],m=repairOf(st),b=T.b,nm=KNAME[kind(b)];
  if(T.act==="aceup"){b.maxHp=(b.maxHp||2)+1;b.hp=(b.hp||2)+1;b.upgraded=true;st.cards.splice(st.cards.indexOf(m),1);m.owner=st.owner;toGrave(m,"death");
    if(!st.cards.length)G.board[r][c]=null;
    log(`${plName(st.owner)}'s Repairman gives his life to upgrade the Ace on ${coord(T.r,T.c)}: it now has ${b.maxHp} hearts.`,"event");return}
  const d=R(3)+1;if(T.act==="upgrade"){b.maxHp++;b.hp++}else b.hp++;m.repAt=tnOf(st.owner)+d;T.t.repLock=tnOf(T.t.owner)+d;
  tray(st.owner,"Repair",[{s:3,v:d-1}],`busy ${d}`);
  log(`${plName(st.owner)}'s Repairman ${T.act==="upgrade"?"strengthens":"repairs"} the ${nm} on ${coord(T.r,T.c)} (${b.hp}/${b.maxHp}). For ${d} turns (1d3 + 1) nothing fires from that base and it can't be repaired again.`)}

/* ---------- Miners and crystals ---------- */
const crystalAt=(r,c)=>(G.crystals||[]).find(x=>x.r===r&&x.c===c);
function centerTiles(){
  const rs=G.rows%2?[(G.rows-1)/2]:[G.rows/2-1,G.rows/2],cs=COLS%2?[(COLS-1)/2]:[COLS/2-1,COLS/2];
  let t=[];for(const r of rs)for(const c of cs)if(!isVoid(r,c))t.push([r,c]);
  if(!t.length){const all=[];for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++)if(!isVoid(r,c))all.push([r,c,Math.hypot(r-(G.rows-1)/2,c-(COLS-1)/2)]);
    all.sort((a,b)=>a[2]-b[2]);if(all.length)t=all.filter(x=>x[2]<=all[0][2]+.01).map(x=>[x[0],x[1]])}
  return t}
function spawnCrystal(){const free=centerTiles().filter(([r,c])=>!crystalAt(r,c));if(!free.length)return false;
  const [r,c]=pick(free);(G.crystals=G.crystals||[]).push({r,c,left:12,hue:pick([190,265,310,150,40])});
  log(`<b>A crystal cluster</b> rises on ${coord(r,c)}: 12 mana for a Miner to dig.`,"event");notify(null,`A crystal rises on ${coord(r,c)}.`);return true}
function crystalTick(){
  if(G.opts.crystals===false||G.phase==="setup")return;G.crystals=G.crystals||[];
  if(!G.crystalInit){G.crystalInit=true;if(hq())spawnCrystal();G.crystalNext=G.turnNo+R(6)+4;return}   // Headquarters opens with a crystal in the middle
  if(G.crystalNext==null)G.crystalNext=G.turnNo+R(6)+4;
  if(G.turnNo>=G.crystalNext){spawnCrystal();G.crystalNext=G.turnNo+R(6)+4}   // then one every 1d6 + 4 turns (v71: turns again, as the rule was written)
}
/* the start of a player's turn: crystals, then Miners */
function siegeTurn(pl){
  crystalTick();
  if(!G.p[pl]||isHorde(pl))return;
  let got=0;const notes=[],per=[];   // v62: what each mining slot brought, for its stats
  for(const {st,r,c} of stacksOf(pl)){
    const ms=st.cards.filter(x=>x.unit==="miner");if(!ms.length)continue;
    const cr=crystalAt(r,c),g0=got;
    if(hasK(st,"ace")){for(const m of ms)if(m.inSlot!=null&&m.inSlot<G.moon.round)got+=R(2)-(G.moon.gone==="jupiter"?0:1);per.push(["ace:"+st.cards.find(x=>kind(x)==="ace").id,got-g0])}   // Jupiter: 1d2 instead of 1d2 − 1   // a miner slot: 1d2 − 1 a turn, from the round after it moves in
    else if(cr){per.push(["cr:"+r+"."+c,0]);if(R(2)===2){const take=Math.min(cr.left,1+R(3));cr.left-=take;got+=take;per[per.length-1][1]=take;notes.push(`${take} from the crystal on ${coord(r,c)}${cr.left?` (${cr.left} left)`:"; the crystal is spent and gone"}`);if(!cr.left)G.crystals.splice(G.crystals.indexOf(cr),1)}}
    else for(const m of ms)if(R(6)===6)got++;   // out in the open: 1d6 − 5
  }
  if(got&&G.p[pl].minerX2!=null&&tnOf(pl)<=G.p[pl].minerX2)got*=2;   // Jupiter's eclipse: miners bring twice as much
  if(got&&oathNow(pl,"earth")){notes.push(`the Oath of the Earth +${got}`);got*=2}   // v50: +1 for every mana mined
  {const raw=per.reduce((a,x)=>a+x[1],0)+0,k=raw?got/Math.max(1,raw):1;for(const [key,n] of per)mineNote(pl,key,n*k)}
  if(got){const n=giveMana(pl,got);log(`${plName(pl)}'s Miners bring in ${n} mana${notes.length?": "+notes.join("; "):""}${n<got?" (the soul pile is full)":""}.`)}
}
/* v62: each mining slot's takings are noted here (the Mining slots panel keeps them) */
function mineNote(pl,key,n){}
/* the end of a player's turn: Miners settle into their slots; suppression wears off */
function siegeEnd(pl){
  for(const {st,r,c} of stacksOf(pl)){
    const ace=hasK(st,"ace");for(const m of st.cards)if(m.unit==="miner"){if(ace){if(m.inSlot==null)m.inSlot=G.moon.round}else m.inSlot=null}
    if(st.supp){st.supp.n--;if(st.supp.n<=0){st.supp=null;log(`${plName(pl)}'s stack on ${coord(r,c)} shakes off the Archer's suppression.`)}}
  }
}

/* ---------- Field Libation ---------- */
function pourLibation(r,c,ids){
  const st=G.board[r][c];if(!st)return;const cards=st.cards.filter(x=>ids.has(x.id)&&canSacOnField(st,x));if(!cards.length)return;
  const d=[];let got=0,lost=0;
  for(const x of cards){st.cards.splice(st.cards.indexOf(x),1);const v=R(2);d.push({s:2,v});
    if(x.captured&&x.captured.length){for(const s of x.captured)toGrave(s,"death");x.captured=[]}
    if(v===2&&addSoul(G.active,x))got+=soulOf(x);else{toGrave(x,"spent");lost++}}
  if(!st.cards.length){G.board[r][c]=null;freeCaptive(st,r,c);G.sel=null}else if(G.sel)for(const x of cards)G.sel.pick.delete(x.id);
  tray(G.active,"Field Libation",d,`+${got} mana`);
  log(`<b>Field Libation</b> on ${coord(r,c)}: ${cards.length} card${cards.length>1?"s":""} poured out (1d2 each: ${d.map(x=>x.v).join(", ")}); +${got} mana, ${lost} to the grave for nothing.`);
  G.libPick=null;G.libation="done";checkWin();   // one Pour a turn: the X marks go, and the spell is spent until your next turn
}

/* ---------- spells ---------- */
PRICE.carch=()=>R(2);PRICE.cheal=()=>2+R(3);
SPELLS.push(
 {id:"libation",name:"Field Libation",cost:0,school:"Necromancy",text:"Free, but not under the Full Moon. Your stacks show an X: select one, check the cards to pour out and press Pour. Each card rolls 1d2: a 2 gives you its soul's mana, a 1 sends it to the grave for nothing. Not a great move.",
  ok:()=>!fullDrawbacks()&&!G.libation&&stacksOf(G.active).some(x=>x.st.cards.some(c=>canSacOnField(x.st,c))),run:async()=>{G.libation="armed";G.libPick=new Set();log(`${plName(G.active)} prepares a Field Libation.`);if(!me().cpu)flash("Field Libation: select one of your stacks marked with an X, check the cards, then press Pour.")}},
 {id:"carch",dice:"1d2",name:"Archer Conjure",cost:1,school:"Conjuring",text:"An Archer's soul comes from the Ether into your deck. 1d20 + 1d10 at a stack exactly two tiles away (straight or diagonal); a miss costs nothing; no defense. Suppress instead: the target attacks with disadvantage next time. Stacks alone, with a Queen, or inside an Ace, the Tree or a Wall. 1 mana for the Beginner.",ok:()=>etherHasU("archer"),run:()=>conjureU("archer")},
 {id:"ccan",name:"Cannon Conjure",cost:6,school:"Conjuring",text:"A Cannon's soul comes from the Ether into your deck. 2d20 at anything up to three tiles away, once every 1d2 + 2 turns; a miss costs nothing; two damage to a Wall; no defense. Stands alone or inside a base; moves one step.",ok:()=>etherHasU("cannon"),run:()=>conjureU("cannon")},
 {id:"cheal",dice:"2+1d3",name:"Healer Conjure",cost:3,school:"Conjuring",text:"A Healer's soul comes from the Ether into your deck. Its blue shield turns one blow from its stack, then comes back in 1d4 rounds; or it heals one heart of a card in its stack or beside it. Stacks with anything but a Queen.",ok:()=>etherHasU("healer"),run:()=>conjureU("healer")},
 {id:"cwall",name:"Wall Conjure",cost:4,school:"Conjuring",text:"A Wall's soul comes from the Ether into your deck. Five hearts and defense 10; it holds one stack like an Ace, but only ranged cards fire from it (one shot a turn). It never moves.",ok:()=>etherHasU("wall"),run:()=>conjureU("wall")},
 {id:"crep",name:"Repairman Conjure",cost:2,school:"Conjuring",text:"A Repairman's soul comes from the Ether into your deck. He repairs a Wall, an Ace or the Tree in his stack or beside it, then rests 1d3 + 1 turns. He can also upgrade an Ace once, giving his life for it.",ok:()=>etherHasU("repair"),run:()=>conjureU("repair")},
 {id:"cram",name:"Battering Ram Conjure",cost:3,school:"Conjuring",text:"A Battering Ram's soul comes from the Ether into your deck. Worked by one or two Grunts, Infantry or Puppets, it does two damage to a Wall beside it, no roll. It does nothing else.",ok:()=>etherHasU("ram"),run:()=>conjureU("ram")},
 {id:"cmine",name:"Miner Conjure",cost:2,school:"Conjuring",text:"A Miner's soul comes from the Ether into your deck. In an Ace (as many as you like) it brings 1d2 − 1 mana every turn, from the next round on; on a crystal it digs for 1 + 1d3; anywhere else it finds 1 mana on a 6.",ok:()=>etherHasU("miner"),run:()=>conjureU("miner")}
);

/* ---------- the board ---------- */
function crystalHTML(r,c,under){const x=crystalAt(r,c);if(!x)return "";
  return `<span class="crys${under?" under":""}" style="--ch:${x.hue}" title="Crystal: ${x.left} mana left"><svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M-7,8L-9,-1L-5,-6L-3,8Z M-3,8L-2,-9L2,-11L3,8Z M3,8L4,-4L8,-7L9,8Z" /><path class="cl" d="M-2,-9L0,6 M4,-4L6,6 M-5,-6L-6,6"/></svg><i class="cbar"><b style="width:${Math.round(x.left/12*100)}%"></b></i></span>`}
function siegeDecor(inner,st,V,r,c){
  const cls=[],b=[],mine=st.owner===V;
  if(shieldUp(st))cls.push("hshield");else if(st.mars)cls.push("marsadv");
  if(st.mars)b.push(`<span class="supp" style="color:#c2401c" title="Mars: advantage on its next attack">♂︎</span>`);
  if(hasBase(st)&&repLocked(st)){cls.push("replock");b.push(`<span class="rlock" title="A Repairman is at work: nothing fires from here for ${st.repLock-tnOf(st.owner)} more turn(s)">${unitSVG("repair","#2a2016",34)}<em>${st.repLock-tnOf(st.owner)}</em></span>`)}
  if(st.captive)b.push(`<span class="capt" title="Captured: ${esc(nameOf(st.captive))}">⛓${unitSVG(st.captive.unit,"#5b3a1a",12)}</span>`);
  if(st.supp)b.push(`<span class="supp" title="Suppressed: disadvantage on its next attack (${st.supp.n} turn${st.supp.n>1?"s":""})">▼${st.supp.n}</span>`);
  if(mine){const sh=st.cards.find(isShooter);if(sh&&!shotReady(sh,st.owner))b.push(`<span class="cd" title="The ${esc(UNIT[sh.unit].name)} rests ${sh.readyAt-tnOf(st.owner)} more turn(s)">⟳${sh.readyAt-tnOf(st.owner)}</span>`)}
  if(G.libation==="armed"&&st.owner===G.active&&V===G.active&&G.phase==="prep"&&st.cards.some(x=>canSacOnField(st,x))){cls.push("libx");b.push(`<span class="xmark" aria-hidden="true">✕</span>`)}
  if(!cls.length&&!b.length)return inner;
  let h=cls.length?inner.replace('class="stack ',`class="stack ${cls.join(" ")} `):inner;
  if(b.length&&h.endsWith("</div>"))h=h.slice(0,-6)+b.join("")+"</div>";
  return h;
}
/* the selection box: Heal, Repair, Release, Field Libation, and what each support card is waiting for */
function siegeActs(st,mine,s){
  const out=[],prep=mine&&G.phase==="prep",n=tnOf(st.owner),info=[];
  const h=healerOf(st);if(h)info.push(shieldUp(st)?"Healer: shield up":`Healer: shield ${(h.shieldAt||0)>G.moon.round?`back in ${h.shieldAt-G.moon.round} round(s)`:`down for ${(h.shieldOff||0)-n} turn(s)`}`+((h.healAt||0)>n?` · heal in ${h.healAt-n} turn(s)`:""));
  const m=repairOf(st);if(m&&(m.repAt||0)>n)info.push(`Repairman rests ${m.repAt-n} turn(s)`);
  if(hasBase(st)&&repLocked(st))info.push(`Under repair: nothing fires from this base for ${st.repLock-n} turn(s)`);
  const sh=st.cards.find(isShooter);if(sh&&!shotReady(sh,st.owner))info.push(`${UNIT[sh.unit].name} rests ${sh.readyAt-n} turn(s)`);
  if(st.captive)info.push(`Capture slot: ${esc(nameOf(st.captive))}`);
  if(st.supp)info.push(`Suppressed: disadvantage on its next attack (${st.supp.n} turn(s))`);
  const ms=st.cards.filter(x=>x.unit==="miner");if(ms.length)info.push(hasK(st,"ace")?`Miners ${ms.length}`+(ms.some(x=>x.inSlot==null||x.inSlot>=G.moon.round)?" · mining from next round":""):crystalAt(s.r,s.c)?"Miner on a crystal":"Miner out in the open (1 mana on a 6)");
  if(info.length)out.push(`<p class="sinfo">${info.join(" · ")}</p>`);
  if(prep){
    if(healReady(st)&&healTargets(st,s.r,s.c).length)out.push(`<button class="btn ghost sm" id="healBtn">Heal a heart</button>`);
    if(repairReady(st)&&repairTargets(st,s.r,s.c).length)out.push(`<button class="btn ghost sm" id="repBtn">Repair</button>`);
    if(st.captive&&releaseSpots(st,s.r,s.c).length)out.push(`<button class="btn ghost sm" id="relBtn">Set the captive to work</button>`);
    if(G.libation==="armed"&&st.cards.some(x=>canSacOnField(st,x))){const L=G.libPick||(G.libPick=new Set());
      out.push(`<div class="libbox"><p><b>Field Libation</b>: check the cards to pour out.</p>${st.cards.filter(x=>canSacOnField(st,x)).map(x=>`<label><input type="checkbox" data-lib="${x.id}" ${L.has(x.id)?"checked":""}> ${esc(nameOf(x))} (${soulOf(x)} mana on a 2)</label>`).join("")}<button class="btn sm" id="pourBtn" ${L.size?"":"disabled"}>Pour</button> <button class="btn ghost sm" id="libDone">Cancel</button></div>`)}
  }
  return out;
}
function wireSiege(st,s){
  const go=async(spec)=>{G.busy=true;const v=await askHuman(G.active,spec);G.busy=false;return v};
  if($("#healBtn"))$("#healBtn").onclick=async()=>{if(!canAct())return;const ts=healTargets(st,s.r,s.c);
    const id=ts.length===1?"0":await go({kind:"choice",title:"Heal which card?",options:ts.map((t,i)=>({id:String(i),label:`${nameOf(t.x)} on ${coord(t.r,t.c)}`,sub:`${t.x.hp}/${t.x.maxHp} hearts`})),cancel:"Cancel"});
    if(id!=null&&ts[id])healAct(s.r,s.c,ts[id]);render()};
  if($("#repBtn"))$("#repBtn").onclick=async()=>{if(!canAct())return;const ts=repairTargets(st,s.r,s.c);
    const id=await go({kind:"choice",title:"What does the Repairman do?",options:ts.map((t,i)=>({id:String(i),label:t.label,sub:t.sub})),cancel:"Cancel"});
    if(id!=null&&ts[id])repairAct(s.r,s.c,ts[id]);if(G.sel&&!G.board[G.sel.r][G.sel.c])G.sel=null;render()};
  if($("#relBtn"))$("#relBtn").onclick=async()=>{if(!canAct())return;const sp=releaseSpots(st,s.r,s.c);
    const id=await go({kind:"choice",title:`Where does the ${nameOf(st.captive)} go?`,options:sp.map(([r,c],i)=>({id:String(i),label:coord(r,c),sub:G.board[r][c]?"join your stack there":"an empty tile"})),cancel:"Cancel"});
    if(id!=null&&sp[id])release(s.r,s.c,sp[id][0],sp[id][1]);render()};
  document.querySelectorAll("[data-lib]").forEach(i=>i.onchange=()=>{const L=G.libPick||(G.libPick=new Set()),id=+i.dataset.lib;i.checked?L.add(id):L.delete(id);render()});
  if($("#pourBtn"))$("#pourBtn").onclick=()=>{if(!canAct())return;pourLibation(s.r,s.c,G.libPick||new Set());render()};
  if($("#libDone"))$("#libDone").onclick=()=>{libDone();render()};
}

/* ---------- the computer ---------- */
async function aiSiege(pl,W,cast1){
  const P=G.p[pl],lv=P.cpu;if(G.over||isHorde(pl))return;
  for(const {st,r,c} of stacksOf(pl)){
    if(G.board[r][c]!==st)continue;
    if(healReady(st)){const t=healTargets(st,r,c).sort((a,b)=>rate(b.x)-rate(a.x))[0];if(t){healAct(r,c,t);render();await sleep(300)}}
    if(G.board[r][c]===st&&repairReady(st)){const ts=repairTargets(st,r,c);const t=ts.find(x=>x.act==="repair")||ts.find(x=>x.act==="upgrade")||(lv==="hard"&&Math.random()<.3?ts.find(x=>x.act==="aceup"):null);if(t){repairAct(r,c,t);render();await sleep(300)}}
    if(G.board[r][c]===st&&st.captive){const sp=releaseSpots(st,r,c);if(sp.length){const x=st.captive;let b=sp.find(([rr,cc])=>!(rr===r&&cc===c))||sp[0];
      if(x.unit==="miner"){const a=sp.find(([rr,cc])=>G.board[rr][cc]&&hasK(G.board[rr][cc],"ace"));if(a)b=a}
      if(x.unit==="ram"){const a=sp.find(([rr,cc])=>G.board[rr][cc]);if(a)b=a;else b=null}
      if(b){release(r,c,b[0],b[1]);render();await sleep(300)}}}
  }
  await aiMiners(pl);
  if(Math.random()>(lv==="easy"?.5:.9))return;
  const all=[...P.hand,...P.deck,...stacksOf(pl).flatMap(x=>x.st.cards)],count=u=>all.filter(c=>c.unit===u).length,m=()=>mana(pl);
  const slots=stacksOf(pl).filter(x=>hasK(x.st,"ace")).length*2-count("miner");
  const hurt=stacksOf(pl).some(x=>{const b=x.st.cards.find(isBase);return b&&(b.hp||1)<(b.maxHp||1)});
  if((slots>0||(G.crystals||[]).length&&count("miner")<slots+3)&&m()>=3&&Math.random()<(lv==="easy"?.2:.45))await cast1("cmine");
  if(count("archer")<(lv==="hard"?3:2)&&m()>=3&&Math.random()<.5)await cast1("carch");
  if(W&&W.def>1&&count("wall")<1&&m()>=5&&Math.random()<.35)await cast1("cwall");
  if(enemyWalls(pl)&&count("ram")<1&&m()>=4)await cast1("cram");
  if(hurt&&count("repair")<1&&m()>=3)await cast1("crep");
  if(count("healer")<1&&m()>=6&&Math.random()<.3)await cast1("cheal");
  if(lv==="hard"&&count("cannon")<1&&m()>=8&&Math.random()<.35)await cast1("ccan");
}
/* the computer keeps the support cards it has a use for */
function keepSupport(pl,c){const u=c.unit;if(!u)return false;const mine=stacksOf(pl);
  if(u==="miner")return mine.some(x=>hasK(x.st,"ace")&&x.st.cards.filter(y=>y.unit==="miner").length<2)||(G.crystals||[]).length>0;
  if(u==="repair")return mine.some(x=>hasBase(x.st));
  if(u==="ram")return enemyWalls(pl);
  return u==="healer"||u==="wall"||u==="cannon"||u==="archer";
}
/* lone Miners walk to a crystal, or home to an Ace with a free slot */
async function aiMiners(pl){
  for(const {st,r,c} of stacksOf(pl)){
    if(G.board[r][c]!==st||st.moved||!st.cards.every(x=>x.unit==="miner")||crystalAt(r,c))continue;
    const goals=[];for(const x of G.crystals||[]){const t=G.board[x.r][x.c];if(!t||t.owner===pl&&stackLegal([...t.cards,...st.cards]))goals.push([x.r,x.c])}
    if(!goals.length)for(const a of stacksOf(pl))if(hasK(a.st,"ace")&&stackLegal([...a.st.cards,...st.cards]))goals.push([a.r,a.c]);
    if(!goals.length)continue;
    G.sel={r,c,pick:new Set(st.cards.map(x=>x.id))};const tg=moveTargets();
    const d=(a,b)=>Math.min(...goals.map(([gr,gc])=>Math.abs(gr-a)+Math.abs(gc-b)));
    const here=d(r,c);let best=null;
    for(const [rr,cc] of tg){const danger=enemiesOf(pl).flatMap(stacksOf).some(e=>Math.abs(e.r-rr)+Math.abs(e.c-cc)===1);const s=d(rr,cc)+(danger?1.5:0);if(s<here&&(!best||s<best.s))best={rr,cc,s}}
    if(best){doMove(best.rr,best.cc);render();await sleep(300)}
    G.sel=null;
  }
}

/* ---------- symbols ---------- */
Object.assign(UNIT_ICON,{
 archer:`<path d="M-5,-10C3,-6 3,6 -5,10 M-5,-10L-5,10 M-10,0H8 M5,-3L8,0L5,3 M-10,0L-12,-2.5 M-10,0L-12,2.5"/>`,
 cannon:`<path d="M-9,1L5,-7L8,-2L-6,5Z M8,-2L10,-4 M-4,6a3,3 0 1,0 0.1,0Z M4,4L4,9"/>`,
 healer:`<path d="M-3,-9H3V-3H9V3H3V9H-3V3H-9V-3H-3Z"/>`,
 repair:`<path d="M-9,-4L-3,-10L1,-6L-5,0Z M-2,-3L9,8 M7,10L11,6"/>`,
 ram:`<path d="M-11,-2H6L10,-4V4L6,2H-11Z M-7,2V7 M2,2V7 M-9,7H4 M-7,-2V-7 M2,-2V-7 M-9,-7H4"/>`,
 miner:`<path d="M-10,-3C-5,-9 5,-9 10,-3 M0,-7V10"/>`,
 wall:`<path d="M-10,9V-3H-7V-7H-4V-3H-1V-7H2V-3H5V-7H8V-3H10V9Z M-10,3H10 M-4,3V9 M4,3V9 M0,-3V3"/>`
});
/* while a Field Libation waits for its Pour, its row in the spell list cancels it */
{const _rs=renderSpells;renderSpells=function(live){_rs(live);const b=document.querySelector('#spells [data-s="libation"]');
  if(!b||!G||G.libation!=="armed"||G.active!==view())return;b.classList.remove("off");b.classList.add("armed");
  const em=b.querySelector("em");if(em)em.textContent="cancel";b.dataset.tip="Field Libation is waiting: select a stack marked with an X, check the cards and press Pour. Click here to cancel it.";
  b.onclick=()=>{if(!canAct())return;libDone();render()}}}
