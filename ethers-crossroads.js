/* Ether's Crossroads — two players on one device (pass and play).
   Rules follow the written rules; where the written rules leave a gap, the digital
   reading is listed on the All Rules page under "How the digital table reads the rules". */
(function(){
"use strict";
const $=s=>document.querySelector(s);
const R=n=>1+Math.floor(Math.random()*n);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const SUITS={S:"♠",H:"♥",D:"♦",C:"♣"};
const COLS=5, SOUL_CAP=6, HAND_CAP=6;

/* ---------------- cards ---------------- */
let uid=0;
function mk(rank,suit,color){return{id:++uid,rank,suit,color:color||(suit==="H"||suit==="D"?"red":"black")}}
function deck(){const d=[];for(const s of "SHDC")for(const r of ["2","3","4","5","6","7","8","9","10","J","Q","K","A"])d.push(mk(r,s));d.push(mk("JK",null,"red"),mk("JK",null,"black"));return shuffle(d)}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const num=c=>/^\d+$/.test(c.rank)?+c.rank:0;
const kind=c=>c.rank==="JK"?"joker":c.rank==="A"?"ace":c.rank==="K"?"king":c.rank==="Q"?"queen":c.rank==="J"?"jack":num(c)<=6?"grunt":"infantry";
const nat=c=>({joker:0,ace:11,king:11,queen:0,jack:10}[kind(c)]??num(c));
const die=c=>({grunt:6,infantry:8,jack:12,king:20,ace:20,queen:0,joker:0}[kind(c)]);
const DM=c=>({grunt:6,infantry:8,jack:12,king:20,queen:0,joker:0,ace:0}[kind(c)]);
const MSV=c=>({grunt:24,infantry:24,jack:24,king:28}[kind(c)]||0);
const soulOf=c=>({ace:3,king:2,queen:2}[kind(c)]||1);
const cost={jack:1,joker:2,queen:2,king:2,ace:3,grunt:1,infantry:1};
const label=c=>c.rank==="JK"?"Joker":c.rank+SUITS[c.suit];
const short=c=>c.rank==="JK"?"JK":c.rank+SUITS[c.suit];
const nameOf=c=>c.rank==="JK"?`${c.color} Joker`:({J:"Jack",Q:"Queen",K:"King",A:"Ace"}[c.rank]||c.rank)+" of "+({S:"Spades",H:"Hearts",D:"Diamonds",C:"Clubs"}[c.suit]);

/* ---------------- stacks ---------------- */
function stackLegal(cards){
  if(!cards.length)return false;
  const aces=cards.filter(c=>kind(c)==="ace");
  if(aces.length>1)return false;
  if(aces.length===1){
    const inside=cards.filter(c=>kind(c)!=="ace");
    if(inside.length>6)return false;
    if(G.opts.aceLock&&inside.some(c=>c.color!==aces[0].color))return false;
    return true;
  }
  if(cards.filter(c=>kind(c)==="queen").length>1)return false;
  if(cards.filter(c=>kind(c)==="joker").length>1)return false;
  const msv=Math.max(0,...cards.map(MSV)),sum=cards.reduce((a,c)=>a+DM(c),0);
  if(msv===0)return cards.length<=2;            // a lone Queen, a lone Joker, or the two together
  return sum<=msv;
}
const hasK=(st,k)=>st.cards.some(c=>kind(c)===k);

/* ---------------- state ---------------- */
let G;
function newGame(opts){
  uid=0;
  const rows=opts.mid?5:4;
  G={opts,rows,board:Array.from({length:rows},()=>Array(COLS).fill(null)),
     p:[0,1].map(i=>({name:opts.names[i],deck:deck(),hand:[],souls:[],sevArmed:false})),
     grave:[],ether:[],turn:0,active:0,first:0,phase:"setup",setupDone:[false,false],
     spent:false,blessed:false,ritual:0,log:[],sel:null,selHand:null,mode:null,over:false,turnNo:0,setupOrder:[]};
  for(const pl of G.p)pl.deck.forEach(c=>c.owner=G.p.indexOf(pl));
}
const me=()=>G.p[G.active], foe=()=>G.p[1-G.active];
function backRow(pl){return pl===0?G.rows-1:0}
function frontRow(pl){return pl===0?G.rows-2:1}
const ownLines=(pl,r)=>r===backRow(pl)||r===frontRow(pl);
function stacksOf(pl){const out=[];G.board.forEach((row,r)=>row.forEach((st,c)=>{if(st&&st.owner===pl)out.push({st,r,c})}));return out}
function at(r,c){return r>=0&&r<G.rows&&c>=0&&c<COLS?G.board[r][c]:undefined}
function log(html,cls=""){G.log.unshift({html,cls});G.log=G.log.slice(0,120)}

function draw(pl,n,why){
  const P=G.p[pl];let got=0,burned=0;
  for(let i=0;i<n;i++){const c=P.deck.pop();if(!c)break;
    if(P.hand.length<HAND_CAP){P.hand.push(c);got++}else{toGrave(c);burned++}}
  log(`${esc(P.name)} draws ${got} card${got===1?"":"s"}${why?" ("+why+")":""}${burned?`; ${burned} over the hand limit go${burned===1?"es":""} to the grave`:""}${P.deck.length?"":" (deck empty)"}.`);
}
function toGrave(c){G.grave.push(c)}
const mana=pl=>G.p[pl].souls.reduce((a,c)=>a+soulOf(c),0);
function pay(pl,n){
  const P=G.p[pl];if(mana(pl)<n)return false;
  P.souls.sort((a,b)=>soulOf(a)-soulOf(b));
  let paid=0;
  while(paid<n){const i=P.souls.findIndex(c=>soulOf(c)>=n-paid);const c=i>=0?P.souls.splice(i,1)[0]:P.souls.shift();paid+=soulOf(c);toGrave(c)}
  G.spent=true;return true;
}

/* ---------------- dice ---------------- */
function rollStack(st,mode,enemy,fx){ // mode: "atk" | "def"
  const once=()=>{
    const parts=[];let best=-1,bestCard=null,kingRoll=null,aceRoll=null;
    const soloJoker=st.cards.length===1&&kind(st.cards[0])==="joker";
    if(soloJoker&&enemy){ // copies score and dice of the enemy's leading card
      const lead=leadCard(enemy);
      if(lead){const d=die(lead),r=d&&(mode==="atk"||hasK(st,"queen"))?R(d):0;best=nat(lead)+r;parts.push(`Joker copies ${short(lead)}: ${nat(lead)}${r?"+"+r+" (d"+d+")":""}`)}
      else{best=0;parts.push("Joker: 0")}
      return{total:best,parts,kingRoll};
    }
    const queen=hasK(st,"queen"),ace=hasK(st,"ace");
    for(const c of st.cards){
      const k=kind(c);
      if(mode==="def"&&k==="jack"){parts.push(`${short(c)} cannot defend`);continue}
      if(k==="queen"||k==="joker")continue;
      let useDie;
      if(mode==="atk")useDie=k!=="ace";
      else useDie=ace?k==="ace":queen;
      const d=die(c),r=useDie&&d?R(d):0;
      if(k==="king"&&useDie)kingRoll=r;
      if(k==="ace"&&useDie)aceRoll=r;
      const t=nat(c)+r;parts.push(`${short(c)} ${nat(c)}${r?"+"+r:""}`);
      if(t>best){best=t;bestCard=c}
    }
    return{total:Math.max(0,best),parts,kingRoll,aceRoll};
  };
  const a=once();
  if(fx){const b=once();const pick=fx==="adv"?(b.total>a.total?b:a):(b.total<a.total?b:a);pick.parts.push(fx==="adv"?"(advantage)":"(disadvantage)");return pick}
  return a;
}
function leadCard(st){let best=null;for(const c of st.cards){if(kind(c)==="joker"||kind(c)==="queen")continue;if(!best||nat(c)>nat(best))best=c}return best}

/* ---------------- combat ---------------- */
function adjacent(r1,c1,r2,c2,diag){const dr=Math.abs(r1-r2),dc=Math.abs(c1-c2);return diag?(dr<=1&&dc<=1&&(dr||dc)):dr+dc===1}
const jackOnly=st=>st.cards.every(c=>kind(c)==="jack");
function canAttackFrom(st){
  if(st.attacked)return false;
  if(hasK(st,"ace"))return false;
  if(st.cards.length===1&&kind(st.cards[0])==="king")return false;
  if(st.cards.every(c=>kind(c)==="queen"))return false;
  return true;
}
function attack(r1,c1,r2,c2){
  const A=G.board[r1][c1],D=G.board[r2][c2];
  const fxA=A.odds||null,fxD=D.odds||null;
  const bothSoloJokers=A.cards.length===1&&D.cards.length===1&&kind(A.cards[0])==="joker"&&kind(D.cards[0])==="joker";
  const ra=rollStack(A,"atk",D,fxA),rd=rollStack(D,"def",A,fxD);
  A.odds=null;D.odds=null;A.attacked=true;
  const queenA=hasK(A,"queen"),queenD=hasK(D,"queen");
  let dmgD=0,dmgA=0,notes=[];
  if(bothSoloJokers){notes.push("Jokers cannot kill Jokers.")}
  else if(ra.total>rd.total){
    dmgD=1;
    if(ra.kingRoll===20){dmgD=2;notes.push("King rolls 20: double damage.")}
    if(ra.kingRoll===1&&!queenA){dmgD=0;notes.push("King rolls 1: no damage.")}
  }else{
    dmgA=1;
    if(ra.kingRoll===20){dmgA=0;notes.push("King rolls 20: takes no damage.")}
    if(ra.kingRoll===1&&!queenA){dmgA=2;notes.push("King rolls 1 on a failed attack: two damage.")}
  }
  if(rd.kingRoll===20&&dmgA>0){dmgA*=2;notes.push("Defending King rolls 20: double damage back.")}
  if(rd.aceRoll===1&&dmgA>0){dmgA=0;notes.push("The Ace rolls 1: it does no damage.")}
  log(`<b>${esc(me().name)}</b> attacks: <span class="dice">${ra.parts.join(", ")}</span> = <b>${ra.total}</b> vs <span class="dice">${rd.parts.join(", ")}</span> = <b>${rd.total}</b>. ${notes.join(" ")} ${dmgD?`Defender takes ${dmgD} damage.`:""}${dmgA?`Attacker takes ${dmgA} damage.`:""}${!dmgA&&!dmgD?"No damage.":""}`,"combat");
  if(dmgD)damage(r2,c2,dmgD,G.active,true);
  if(dmgA&&G.board[r1][c1])damage(r1,c1,dmgA,1-G.active,false);
}
function damage(r,c,n,killer,defending){
  const st=G.board[r][c];if(!st)return;
  const dead=[];
  for(let i=0;i<n&&st.cards.length;i++){
    if(hasK(st,"ace")){dead.push(...st.cards.splice(0));log("The Ace falls, and every card inside it is destroyed.");break}
    st.cards.sort((a,b)=>nat(a)-nat(b));
    const c=st.cards.shift();dead.push(c);
    if(kind(c)==="king"&&defending&&st.cards.length){dead.push(...st.cards.splice(0));log("The King is defeated in defense: all units with it die.")}
  }
  if(!st.cards.length)G.board[r][c]=null;
  for(const d of dead)bury(d,r,c,st);
  checkWin();
}
function adjacentJokers(r,c,side){
  const out=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;const s=at(r+dr,c+dc);if(s&&s.owner===side){const j=s.cards.find(x=>kind(x)==="joker");if(j)out.push(j)}}
  const s0=at(r,c);if(s0&&s0.owner===side){const j=s0.cards.find(x=>kind(x)==="joker");if(j)out.push(j)}
  return out;
}
const capMana=j=>(j.captured||[]).reduce((a,c)=>a+soulOf(c),0);
function bury(card,r,c,st){
  const owner=st.owner,enemy=1-owner;
  if(kind(card)==="joker"&&card.captured&&card.captured.length){
    const souls=card.captured;card.captured=[];
    for(const s of souls){const j=adjacentJokers(r,c,enemy).find(j=>capMana(j)+soulOf(s)<=SOUL_CAP);
      if(j){(j.captured=j.captured||[]).push(s);log(`An enemy Joker steals a released soul (${short(s)}).`)}else toGrave(s)}
    log("The Joker's captured souls are released.");
  }
  const j=adjacentJokers(r,c,enemy).find(j=>capMana(j)+soulOf(card)<=SOUL_CAP);
  if(j){
    const P=G.p[enemy];
    if(P.sevArmed&&enemy===G.active&&mana(enemy)>=cost[kind(card)]){pay(enemy,cost[kind(card)]);G.ether.push(card);log(`Flesh Severance: ${esc(nameOf(card))} is exiled to the Ethereal Realm.`);return}
    (j.captured=j.captured||[]).push(card);log(`Soul Capture: a Joker takes the soul of ${esc(nameOf(card))}.`);return;
  }
  toGrave(card);
}

/* ---------------- win ---------------- */
function checkWin(){
  if(G.over||G.phase==="setup")return;
  for(const pl of [0,1]){
    if(!stacksOf(pl).length){end(1-pl,`every card ${esc(G.p[pl].name)} had on the field is destroyed`);return}
  }
}
function checkEconomic(pl){
  const P=G.p[pl];
  if(!P.deck.length&&!P.hand.length&&!P.souls.length)end(1-pl,`${esc(P.name)} has no deck, hand or soul pile left: economic victory`);
}
function end(w,why){G.over=true;log(`<b>${esc(G.p[w].name)} wins</b>: ${why}.`,"win");render();$("#ov").innerHTML=`<div class="ovbox"><h2>${esc(G.p[w].name)} wins</h2><p>${why}.</p><p><button class="btn" id="again">New game</button></p></div>`;$("#ov").hidden=false;$("#again").onclick=showStart}

/* ---------------- flow ---------------- */
function startTurn(){
  G.turnNo++;G.spent=false;G.spentOther=false;G.blessed=false;G.ritual=0;G.sel=null;G.selHand=null;G.mode=null;
  for(const {st} of stacksOf(G.active)){st.moved=false;st.attacked=false}
  me().sevArmed=false;
  G.phase=(G.turnNo===1)?"prep":"draw";
  log(`— ${esc(me().name)}'s turn —`,"turn");
}
function nextPhase(){
  if(G.phase==="setup"){
    if(!stacksOf(G.active).length&&me().hand.some(c=>kind(c)!=="joker")){flash("Place at least one card before finishing setup.");return}
    G.setupDone[G.active]=true;
    if(!G.setupDone[1-G.active]){G.active=1-G.active;pass(`${G.p[G.active].name} sets up`);G.sel=null;G.selHand=null;return}
    checkWin0();G.active=G.first;startTurn();pass(`${me().name} begins`);return;
  }
  if(G.phase==="draw"){G.phase="prep"}
  else if(G.phase==="prep"){G.phase="attack";G.mode=null;G.selHand=null}
  else if(G.phase==="attack"){checkEconomic(G.active);if(G.over)return;G.active=1-G.active;startTurn();pass(`${me().name}'s turn`);return}
  render();
}
function checkWin0(){/* nothing placed by a side is allowed; the field check begins once play starts */}
function pass(msg){
  render();if(G.over)return;
  $("#ov").innerHTML=`<div class="ovbox"><h2>${esc(msg)}</h2><p>Pass the device to <b>${esc(me().name)}</b>. Their hand stays hidden until they are ready.</p><p><button class="btn" id="ready">Show ${esc(me().name)}'s hand</button></p></div>`;
  $("#ov").hidden=false;$("#ready").onclick=()=>{$("#ov").hidden=true;render()};
}

/* ---------------- actions ---------------- */
function canPlace(card,r,c){
  if(!ownLines(G.active,r))return false;
  const st=G.board[r][c],k=kind(card);
  if(k==="ace")return !st&&r===backRow(G.active);
  if(k==="joker"){if(!st||st.owner!==G.active)return false;return st.cards.some(x=>x.color===card.color)&&stackLegal([...st.cards,card])}
  if(!st)return true;
  return st.owner===G.active&&stackLegal([...st.cards,card]);
}
function place(card,r,c){
  const P=me();P.hand.splice(P.hand.indexOf(card),1);
  const st=G.board[r][c];
  if(st)st.cards.push(card);else G.board[r][c]={owner:G.active,cards:[card],moved:G.phase!=="setup",attacked:false};
  log(`${esc(P.name)} places ${esc(nameOf(card))}${st?" onto a stack":""}.`);
  G.selHand=null;
}
function moveGroup(){const s=G.sel;if(!s)return[];const st=G.board[s.r][s.c];return st.cards.filter(c=>s.pick.has(c.id))}
function moveTargets(){
  const s=G.sel,st=G.board[s.r][s.c],grp=moveGroup();
  if(!grp.length||st.moved||grp.some(c=>kind(c)==="ace"))return[];
  const rest=st.cards.filter(c=>!s.pick.has(c.id));
  if(rest.length&&!stackLegal(rest))return[];
  if(!stackLegal(grp))return[];
  const out=[];const jack=grp.every(c=>kind(c)==="jack");
  for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++){
    if(r===s.r&&c===s.c)continue;
    const dr=Math.abs(r-s.r),dc=Math.abs(c-s.c);
    const okStep=(dr+dc===1)||(jack&&((dr+dc===2&&(dr===0||dc===0))||(dr===1&&dc===1)));
    if(!okStep)continue;
    if(jack&&dr+dc===2&&(dr===0||dc===0)){const mr=(r+s.r)/2,mc=(c+s.c)/2,mid=G.board[mr][mc];if(mid&&mid.owner!==G.active)continue}
    const t=G.board[r][c];
    if(!t)out.push([r,c]);else if(t.owner===G.active&&!t.moved&&stackLegal([...t.cards,...grp])&&!(grp.some(x=>kind(x)==="joker")&&!t.cards.some(x=>grp.find(g=>kind(g)==="joker").color===x.color)))out.push([r,c]);
  }
  return out;
}
function doMove(r,c){
  const s=G.sel,st=G.board[s.r][s.c],grp=moveGroup();
  st.cards=st.cards.filter(x=>!s.pick.has(x.id));
  if(!st.cards.length)G.board[s.r][s.c]=null;else st.moved=true;
  const t=G.board[r][c];
  if(t){t.cards.push(...grp);t.moved=true}else G.board[r][c]={owner:G.active,cards:grp,moved:true,attacked:false};
  log(`${esc(me().name)} moves ${grp.map(short).join(" ")}${t?" onto another stack":""}.`);
  G.sel={r,c,pick:new Set(G.board[r][c].cards.filter(x=>kind(x)!=="ace").map(x=>x.id))};G.mode=null;
}
function attackTargets(){
  const s=G.sel,st=G.board[s.r][s.c];if(!canAttackFrom(st))return[];
  const diag=jackOnly(st),out=[];
  for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++){const t=G.board[r][c];if(t&&t.owner!==G.active&&adjacent(s.r,s.c,r,c,diag))out.push([r,c])}
  return out;
}
function sacrificeAllowed(){return G.phase==="prep"&&!G.spent}
function sacrifice(card,from){
  const P=me();
  if(mana(G.active)+soulOf(card)>SOUL_CAP){flash(`The soul pile holds ${SOUL_CAP} mana at most.`);return}
  if(from==="hand")P.hand.splice(P.hand.indexOf(card),1);
  else{const st=G.board[from.r][from.c];st.cards.splice(st.cards.indexOf(card),1);if(!st.cards.length){G.board[from.r][from.c]=null;G.sel=null}else if(G.sel)G.sel.pick.delete(card.id)}
  P.souls.push(card);log(`${esc(P.name)} sacrifices ${esc(nameOf(card))} (+${soulOf(card)} mana).`);
  if(from!=="hand")checkWin();
}

/* ---------------- spells ---------------- */
const SPELLS=[
 {id:"ritual",name:"Ritual Dice",cost:1,school:"Necromancy",text:"+2d6 to this turn's Grave Blessing.",ok:()=>!G.blessed&&G.ritual===0,run:()=>{G.ritual=2;log("Ritual Dice: two more dice for the Grave Blessing.")}},
 {id:"bless",name:"Grave Blessing",cost:0,school:"Necromancy",text:"Free. Roll 1d6 (+1d6 per Ace you have on the field, +2 from Ritual Dice, 6 max). Each natural 6 raises a card from the grave.",ok:()=>!G.blessed&&!G.spentOther&&G.grave.length>0,run:blessing},
 {id:"suicide",name:"Sacrificial Suicide",cost:0,school:"Necromancy",text:"Select your stack with a Joker. The Joker goes to the grave and its captured souls go to your soul pile (6 mana max; the surplus goes to the grave).",ok:()=>!G.spent&&selOwnJoker(),run:suicide},
 {id:"sever",name:"Flesh Severance",cost:0,school:"Necromancy",text:"Arm for this turn: enemies killed next to your Joker are exiled to the Ethereal Realm for their summoning cost instead of being captured.",ok:()=>true,run:()=>{me().sevArmed=!me().sevArmed;log(`Flesh Severance ${me().sevArmed?"armed":"disarmed"}.`)}},
 {id:"divine",name:"Divine Odds",cost:3,school:"Enchantment",text:"Select your stack: advantage on all its dice for its next combat.",ok:()=>selOwn()&&!selStack().odds,run:()=>{selStack().odds="adv";log("Divine Odds marks a stack.")}},
 {id:"forced",name:"Forced Hand",cost:2,school:"Curse",text:"The other player draws 1d2 cards; any over the hand limit go to the grave.",ok:()=>true,run:()=>{const n=R(2);draw(1-G.active,n,"Forced Hand")}},
 {id:"hexed",name:"Hexed Odds",cost:3,school:"Curse",text:"Select an enemy stack: disadvantage on all its dice for its next combat.",ok:()=>selEnemy()&&!selStack().odds,run:()=>{selStack().odds="dis";log("Hexed Odds marks an enemy stack.")}},
 {id:"double",name:"Double Edged Sword",cost:1,school:"Curse",text:"Roll 3d6. Each 1 burns a card from your deck; each 6 burns a card from the enemy's deck.",ok:()=>true,run:doubleEdge},
 {id:"clair",name:"Clairvoyance",cost:3,school:"Sorcery",text:"Look at 2d6 cards from your deck, take one into your hand, then reshuffle.",ok:()=>me().deck.length>0&&me().hand.length<HAND_CAP,run:clairvoyance},
 {id:"tele",name:"Teleport",cost:2,school:"Sorcery",text:"Select your stack in your own two lines with no enemy beside it and leave exactly one card checked; that card returns to your hand.",ok:teleOk,run:teleport},
 {id:"cj",name:"Jack Conjure",cost:1,school:"Conjuring",text:"A Jack's soul materializes into your deck.",ok:()=>true,run:()=>conjure("J")},
 {id:"cjk",name:"Joker Conjure",cost:2,school:"Conjuring",text:"A Joker's soul materializes into your deck.",ok:()=>true,run:()=>conjure("JK")},
 {id:"cq",name:"Queen Conjure",cost:2,school:"Conjuring",text:"A Queen's soul materializes into your deck.",ok:()=>true,run:()=>conjure("Q")},
 {id:"ck",name:"King Conjure",cost:2,school:"Conjuring",text:"A King's soul materializes into your deck.",ok:()=>true,run:()=>conjure("K")},
 {id:"ca",name:"Ace Conjure",cost:3,school:"Conjuring",text:"An Ace's soul materializes into your deck.",ok:()=>true,run:()=>conjure("A")},
 {id:"cs",name:"Soldier Conjure",cost:1,school:"Conjuring",text:"A soldier's soul (2 to 10) materializes into your deck.",ok:()=>true,run:()=>conjure("S")}
];
const selStack=()=>G.sel&&G.board[G.sel.r][G.sel.c];
const selOwn=()=>selStack()&&selStack().owner===G.active;
const selEnemy=()=>selStack()&&selStack().owner!==G.active;
const selOwnJoker=()=>selOwn()&&hasK(selStack(),"joker");
function blessing(){
  const aces=stacksOf(G.active).filter(x=>hasK(x.st,"ace")).length;
  const n=Math.min(6,1+aces+G.ritual);const rolls=Array.from({length:n},()=>R(6));
  const sixes=rolls.filter(x=>x===6).length;G.blessed=true;
  log(`Grave Blessing: ${n}d6 → ${rolls.join(", ")}. ${sixes?sixes+" card"+(sixes>1?"s":"")+" may rise.":"Nothing rises."}`);
  if(sixes)pickFromGrave(sixes);
}
function pickFromGrave(n){
  if(!n||!G.grave.length||me().hand.length>=HAND_CAP){render();return}
  modal(`Raise a card from the grave (${n} left)`,G.grave.map((c,i)=>({label:label(c),title:nameOf(c),cls:c.color,val:i})),i=>{
    const c=G.grave.splice(i,1)[0];c.owner=G.active;me().hand.push(c);log(`${esc(me().name)} raises ${esc(nameOf(c))} from the grave.`);pickFromGrave(n-1)},"Stop");
}
function suicide(){
  const st=selStack(),j=st.cards.find(c=>kind(c)==="joker");
  st.cards.splice(st.cards.indexOf(j),1);if(!st.cards.length){G.board[G.sel.r][G.sel.c]=null;G.sel=null}
  const souls=j.captured||[];j.captured=[];let moved=0,lost=0;
  for(const s of souls){if(mana(G.active)+soulOf(s)<=SOUL_CAP){me().souls.push(s);moved++}else{toGrave(s);lost++}}
  toGrave(j);log(`Sacrificial Suicide: the Joker goes to the grave; ${moved} soul${moved===1?"":"s"} join the soul pile${lost?`, ${lost} surplus to the grave`:""}.`);
  checkWin();
}
function doubleEdge(){
  const rolls=[R(6),R(6),R(6)];let mine=0,theirs=0;
  for(const r of rolls){if(r===1){const c=me().deck.pop();if(c){toGrave(c);mine++}}if(r===6){const c=foe().deck.pop();if(c){toGrave(c);theirs++}}}
  log(`Double Edged Sword: 3d6 → ${rolls.join(", ")}. You lose ${mine}, the enemy loses ${theirs} from the deck.`);
}
function clairvoyance(){
  const n=Math.min(R(6)+R(6),me().deck.length);const look=me().deck.slice(-n);
  log(`Clairvoyance reveals ${n} cards.`);
  modal(`Clairvoyance: choose one of ${n} cards`,look.map(c=>({label:label(c),title:nameOf(c),cls:c.color,val:c.id})),id=>{
    const P=me(),i=P.deck.findIndex(c=>c.id===id);const c=P.deck.splice(i,1)[0];P.hand.push(c);shuffle(P.deck);log(`${esc(P.name)} takes a card into the hand and reshuffles.`);render()});
}
function teleOk(){
  if(!selOwn())return false;const s=G.sel,st=selStack();
  if(!ownLines(G.active,s.r)||me().hand.length>=HAND_CAP)return false;
  for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const t=at(s.r+dr,s.c+dc);if(t&&t.owner!==G.active)return false}
  return st.cards.filter(c=>s.pick.has(c.id)).length===1;
}
function teleport(){
  const st=selStack(),c=st.cards.find(x=>G.sel.pick.has(x.id));
  st.cards.splice(st.cards.indexOf(c),1);me().hand.push(c);
  if(!st.cards.length){G.board[G.sel.r][G.sel.c]=null;G.sel=null}else G.sel.pick.delete(c.id);
  log(`Teleport: ${esc(nameOf(c))} returns to the hand.`);checkWin();
}
function conjure(r){
  const suit="SHDC"[Math.floor(Math.random()*4)];
  const c=r==="JK"?mk("JK",null,Math.random()<.5?"red":"black"):r==="S"?mk(String(1+R(9)),suit):mk(r,suit);
  c.owner=G.active;me().deck.push(c);shuffle(me().deck);log(`A soul materializes from the Ethereal Realm into ${esc(me().name)}'s deck.`);
}
function cast(sp){
  if(G.phase!=="prep"){flash("Spells are cast in the prep phase.");return}
  if(!sp.ok()){flash("That spell can't be cast right now.");return}
  if(sp.cost){if(mana(G.active)<sp.cost){flash("Not enough mana.");return}if(sp.id!=="ritual")G.spentOther=true;pay(G.active,sp.cost)}
  sp.run();render();
}

/* ---------------- UI ---------------- */
let flashT;
function flash(t){const f=$("#flash");f.textContent=t;f.hidden=false;clearTimeout(flashT);flashT=setTimeout(()=>f.hidden=true,2600)}
function modal(title,items,onPick,cancel){
  $("#ov").innerHTML=`<div class="ovbox"><h2>${esc(title)}</h2><div class="pickrow">${items.map((it,i)=>`<button class="card ${it.cls||""}" data-i="${i}" title="${esc(it.title||"")}">${esc(it.label)}</button>`).join("")}</div>${cancel?`<p><button class="btn ghost" id="mcancel">${esc(cancel)}</button></p>`:""}</div>`;
  $("#ov").hidden=false;
  $("#ov").querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{$("#ov").hidden=true;onPick(items[+b.dataset.i].val);render()});
  if(cancel)$("#mcancel").onclick=()=>{$("#ov").hidden=true;render()};
}
const PH={setup:"Setup",draw:"Draw",prep:"Prep",attack:"Attack"};
function render(){
  if(!G)return;
  const flip=G.active===1;
  // phase bar
  $("#phases").innerHTML=G.phase==="setup"?'<span class="on">Setup</span>':["draw","prep","attack"].map(p=>`<span class="${G.phase===p?"on":""}">${PH[p]}</span>`).join('<i>→</i>');
  $("#who").innerHTML=`<b>${esc(me().name)}</b> · ${G.phase==="setup"?"place your opening cards in your two lines":({draw:"roll d4s to draw, or skip",prep:"place, move, sacrifice, cast",attack:"attack with each stack once"}[G.phase])}`;
  // board
  const rows=[...Array(G.rows).keys()];if(flip)rows.reverse();
  let tgt=[];
  if(G.sel&&G.mode==="move")tgt=moveTargets();
  if(G.sel&&G.mode==="attack")tgt=attackTargets();
  const placeT=G.selHand?(()=>{const o=[];for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++)if(canPlace(G.selHand,r,c))o.push([r,c]);return o})():[];
  const isT=(r,c,list)=>list.some(([a,b])=>a===r&&b===c);
  $("#board").style.setProperty("--rows",G.rows);
  $("#board").innerHTML=rows.map(r=>{
    const lineName=r===backRow(G.active)?"your backline":r===frontRow(G.active)?"your frontline":r===backRow(1-G.active)?"enemy backline":r===frontRow(1-G.active)?"enemy frontline":"midline";
    return `<div class="row ${lineName.replace(/\s/g,"-")}"><span class="rl">${lineName}</span>`+[...Array(COLS).keys()].map(c=>{
      const st=G.board[r][c];
      const cls=["tile"];if(G.sel&&G.sel.r===r&&G.sel.c===c)cls.push("sel");
      if(isT(r,c,tgt))cls.push(G.mode==="attack"?"tatk":"tmove");if(isT(r,c,placeT))cls.push("tplace");
      let inner="";
      if(st){
        const lead=st.cards.find(x=>kind(x)==="ace")||[...st.cards].sort((a,b)=>nat(b)-nat(a)||kind(b).localeCompare(kind(a)))[0];
        const mine=st.owner===G.active;
        const cap=st.cards.reduce((a,x)=>a+capMana(x),0);
        inner=`<div class="stack ${mine?"mine":"theirs"} ${lead.color}"><span class="lead">${esc(short(lead))}</span>${st.cards.length>1?`<span class="cnt">×${st.cards.length}</span>`:""}<span class="mini">${st.cards.map(short).join(" ")}</span>${st.odds?`<span class="odds ${st.odds}">${st.odds==="adv"?"▲":"▼"}</span>`:""}${cap?`<span class="souls" title="captured souls">✦${cap}</span>`:""}${mine&&(st.moved||st.attacked)&&G.phase!=="setup"?`<span class="used">${st.attacked?"atk":"mv"}</span>`:""}</div>`;
      }
      return `<button class="${cls.join(" ")}" data-r="${r}" data-c="${c}" aria-label="${lineName} column ${c+1}${st?", "+st.cards.map(nameOf).join(", "):", empty"}">${inner}</button>`;
    }).join("")+"</div>";
  }).join("");
  $("#board").querySelectorAll(".tile").forEach(b=>b.onclick=()=>tileClick(+b.dataset.r,+b.dataset.c));
  // players
  for(const [el,pl] of [["#me",G.active],["#foe",1-G.active]]){
    const P=G.p[pl];
    $(el).innerHTML=`<h3>${esc(P.name)}${pl===G.active?" (you)":""}</h3><p class="stats"><span>Deck <b>${P.deck.length}</b></span><span>Hand <b>${P.hand.length}/${HAND_CAP}</b></span><span>Soul pile <b>${mana(pl)}/${SOUL_CAP}</b> mana</span></p>`;
  }
  $("#shared").innerHTML=`<button class="link" id="seegrave">Grave: ${G.grave.length}</button> · Ethereal Realm: ${G.ether.length} exiled`;
  $("#seegrave").onclick=()=>{if(G.grave.length)modal("The grave (shared)",G.grave.map(c=>({label:label(c),title:nameOf(c),cls:c.color,val:0})),()=>{},"Close");else flash("The grave is empty.")};
  // hand
  const P=me();
  $("#hand").innerHTML=P.hand.length?P.hand.map((c,i)=>`<div class="hc"><button class="card ${c.color} ${G.selHand===c?"on":""}" data-h="${i}" title="${esc(nameOf(c))}: ${kind(c)}, ${nat(c)}${die(c)?" + d"+die(c):""}">${esc(label(c))}</button>${sacrificeAllowed()?`<button class="mini-btn" data-sh="${i}" title="Sacrifice to your soul pile (+${soulOf(c)} mana)">sac +${soulOf(c)}</button>`:""}</div>`).join(""):'<p class="dim">No cards in hand.</p>';
  $("#hand").querySelectorAll("[data-h]").forEach(b=>b.onclick=()=>{
    if(!(G.phase==="setup"||G.phase==="prep")){flash("Cards are placed during setup or the prep phase.");return}
    const c=P.hand[+b.dataset.h];G.selHand=G.selHand===c?null:c;G.mode=null;render()});
  $("#hand").querySelectorAll("[data-sh]").forEach(b=>b.onclick=()=>{sacrifice(P.hand[+b.dataset.sh],"hand");render()});
  // controls
  const ctl=[];
  if(G.phase==="draw")ctl.push(`<button class="btn" id="d4">Roll d4 and draw</button>`);
  ctl.push(`<button class="btn ghost" id="next">${G.phase==="setup"?"Done setting up":G.phase==="draw"?"To prep phase →":G.phase==="prep"?"To attack phase →":"End turn →"}</button>`);
  $("#controls").innerHTML=ctl.join("");
  if($("#d4"))$("#d4").onclick=()=>{const n=R(4);log(`${esc(me().name)} rolls d4: ${n}.`);draw(G.active,n);render()};
  $("#next").onclick=nextPhase;
  // selection panel
  renderSel();
  // spells
  $("#spells").innerHTML=(G.phase==="prep"?"":'<p class="dim">Spells are cast during the prep phase.</p>')+["Necromancy","Enchantment","Curse","Sorcery","Conjuring"].map(sc=>`<h4>${sc}</h4>`+SPELLS.filter(s=>s.school===sc).map(s=>{const ok=G.phase==="prep"&&s.ok()&&mana(G.active)>=s.cost;return `<button class="spell ${ok?"":"off"} ${s.id==="sever"&&me().sevArmed?"armed":""}" data-s="${s.id}" title="${esc(s.text)}"><span>${esc(s.name)}</span><em>${s.cost?s.cost+" mana":"free"}</em></button>`}).join("")).join("");
  $("#spells").querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>cast(SPELLS.find(s=>s.id===b.dataset.s)));
  // log
  $("#log").innerHTML=G.log.map(l=>`<li class="${l.cls}">${l.html}</li>`).join("");
}
function renderSel(){
  const box=$("#selbox"),st=selStack();
  if(G.selHand){box.innerHTML=`<p><b>${esc(nameOf(G.selHand))}</b> selected. Click a highlighted tile in your two lines to place it${kind(G.selHand)==="ace"?" (Aces go on an empty backline tile)":kind(G.selHand)==="joker"?" (Jokers spawn onto your stack holding a card of the same color)":""}.</p>`;return}
  if(!st){box.innerHTML='<p class="dim">Select a stack on the board, or a card in your hand.</p>';return}
  const mine=st.owner===G.active,s=G.sel;
  const rows=st.cards.map(c=>{
    const k=kind(c),cap=capMana(c);
    const chk=mine&&k!=="ace"&&G.phase!=="attack"?`<input type="checkbox" data-pk="${c.id}" ${s.pick.has(c.id)?"checked":""} aria-label="include ${esc(nameOf(c))} in the moving group">`:"";
    const sac=mine&&sacrificeAllowed()&&k!=="ace"&&!(k==="king"&&st.cards.length>1)?`<button class="mini-btn" data-sc="${c.id}">sac +${soulOf(c)}</button>`:"";
    return `<li>${chk}<span class="card sm ${c.color}">${esc(short(c))}</span> ${esc(k)} · ${nat(c)}${die(c)?" + d"+die(c):""}${cap?` · ✦${cap} captured`:""} ${sac}</li>`}).join("");
  const acts=[];
  if(mine&&(G.phase==="prep"||G.phase==="setup")&&G.phase!=="setup")acts.push(`<button class="btn sm ${G.mode==="move"?"on":""}" id="mv" ${st.moved?"disabled":""}>Move checked cards</button>`);
  if(mine&&G.phase==="attack")acts.push(`<button class="btn sm ${G.mode==="attack"?"on":""}" id="ak" ${canAttackFrom(st)?"":"disabled"}>Attack</button>`);
  box.innerHTML=`<p><b>${mine?"Your":"Enemy"} stack</b> · ${st.cards.length} card${st.cards.length>1?"s":""}${st.odds?` · ${st.odds==="adv"?"Divine Odds":"Hexed Odds"}`:""}${mine&&st.moved?" · moved":""}${mine&&st.attacked?" · attacked":""}</p><ul class="cards">${rows}</ul><div class="acts">${acts.join("")}</div>${mine&&G.phase==="prep"?'<p class="dim">Check which cards move together, then press Move and click a highlighted tile.</p>':""}${mine&&G.phase==="attack"?'<p class="dim">Press Attack, then click a highlighted enemy stack.</p>':""}`;
  box.querySelectorAll("[data-pk]").forEach(i=>i.onchange=()=>{const id=+i.dataset.pk;i.checked?s.pick.add(id):s.pick.delete(id);G.mode=null;render()});
  box.querySelectorAll("[data-sc]").forEach(b=>b.onclick=()=>{const c=st.cards.find(x=>x.id===+b.dataset.sc);sacrifice(c,{r:s.r,c:s.c});render()});
  if($("#mv"))$("#mv").onclick=()=>{G.mode=G.mode==="move"?null:"move";if(G.mode&&!moveTargets().length)flash("No legal move for that group (check stacking limits).");render()};
  if($("#ak"))$("#ak").onclick=()=>{G.mode=G.mode==="attack"?null:"attack";if(G.mode&&!attackTargets().length)flash("No enemy stack is in reach.");render()};
}
function tileClick(r,c){
  if(G.over)return;
  if(G.selHand){if(canPlace(G.selHand,r,c)){place(G.selHand,r,c);render()}else flash("That card can't be placed there.");return}
  if(G.sel&&G.mode==="move"&&moveTargets().some(([a,b])=>a===r&&b===c)){doMove(r,c);render();return}
  if(G.sel&&G.mode==="attack"&&attackTargets().some(([a,b])=>a===r&&b===c)){attack(G.sel.r,G.sel.c,r,c);G.mode=null;if(G.sel&&!G.board[G.sel.r][G.sel.c])G.sel=null;render();return}
  const st=G.board[r][c];
  if(!st){G.sel=null;G.mode=null;render();return}
  G.sel={r,c,pick:new Set(st.cards.filter(x=>kind(x)!=="ace").map(x=>x.id))};G.mode=null;render();
}

/* ---------------- start ---------------- */
function showStart(){
  $("#ov").innerHTML=`<div class="ovbox"><h2>New game</h2>
  <p class="dim">Two players share this device. Each turn the board turns so the active player sits at the bottom.</p>
  <label class="f">Player one <input id="n1" value="Player One" maxlength="20"></label>
  <label class="f">Player two <input id="n2" value="Player Two" maxlength="20"></label>
  <label class="chk"><input type="checkbox" id="omid" checked> Use the midline</label>
  <label class="chk"><input type="checkbox" id="olock"> Optional Ace rule: cards inside an Ace must match its color</label>
  <p><button class="btn" id="go">Roll for the opening</button></p></div>`;
  $("#ov").hidden=false;
  $("#go").onclick=()=>{
    newGame({names:[$("#n1").value.trim()||"Player One",$("#n2").value.trim()||"Player Two"],mid:$("#omid").checked,aceLock:$("#olock").checked});
    for(const pl of [0,1]){const a=R(4),b=R(4);log(`${esc(G.p[pl].name)} rolls 2d4: ${a} + ${b}.`);draw(pl,a+b,"opening hand")}
    let r1,r2;do{r1=R(6);r2=R(6)}while(r1===r2);
    G.first=r1>r2?0:1;G.active=G.first;
    log(`Opening roll: ${esc(G.p[0].name)} ${r1}, ${esc(G.p[1].name)} ${r2}. ${esc(me().name)} sets up first and takes the first turn.`);
    pass(`${me().name} sets up first`);
  };
}
document.addEventListener("DOMContentLoaded",()=>{showStart();$("#newgame").onclick=()=>{if(!G||G.over||confirmNew())showStart()}});
function confirmNew(){return window.confirm?window.confirm("Start a new game? The current one will be lost."):true}
window.__EC={get G(){return G},stackLegal,canPlace,nextPhase,render};
})();
