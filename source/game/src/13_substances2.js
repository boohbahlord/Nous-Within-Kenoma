/* ---------------- Emanations, second part: Lucifer & Ouroboros, The Leviathan, Yaldabaoth, Tiphareth of Kether ---------------- */

/* ---------- the moon when it is eaten, replaced by Saturn, or carries the Leviathan ---------- */
const moonName=()=>G.moon.gone==="saturn"?"Saturn":G.moon.gone==="mars"?"Mars":PLANETS[G.moon.gone]?PLANETS[G.moon.gone].name:G.moon.gone==="fallen"?"Empty sky":G.moon.gone?"No moon":MOON[G.moon.i];
const saturnOwner=()=>G.saturnBy==null?"the Bank":esc(G.p[G.saturnBy].name);
function moonNote(){
  const m=G.moon,L=G.moonLev;
  if(PNOTE[m.gone])return PNOTE[m.gone]();
  if(m.gone==="mars")return `Mars hangs where the moon was: each turn, a stack of only Grunts and Infantry gets advantage on its next attack on 1–5 of 1d8${L?"; the Leviathan coils on it":""}`;
  if(m.gone==="saturn")return `Saturn hangs where the moon was: every ${G.saturnBy==null?"player":"enemy of "+saturnOwner()} pays ${1+(G.saturnDebt||0)} at the start of each turn (Binah is exempt)`;
  if(m.gone==="eaten")return "Yaldabaoth ate the moon: the phases have stopped";
  if(m.gone==="off")return "The moon is off for this game";
  if(L)return `The Leviathan (${L.card.hp} heart${L.card.hp===1?"":"s"}) lies on the moon: a toll at every New Moon; attackable only at the New Moon`;
  return "";
}
function goneMoonSVG(){
  if(G.moon.gone==="mars")return marsSVG();
  if(planetSVG(G.moon.gone))return planetSVG(G.moon.gone);
  if(G.moon.gone==="saturn")return `<svg class="moon saturn" viewBox="-44 -44 88 88" width="88" height="88" aria-hidden="true"><defs><radialGradient id="sat" cx="40%" cy="35%"><stop offset="0" stop-color="#e8d29a"/><stop offset="1" stop-color="#7a5c2a"/></radialGradient></defs><ellipse rx="40" ry="9" fill="none" stroke="#c9a96a" stroke-width="2.4" transform="rotate(-18)" opacity=".55"/><circle r="22" fill="url(#sat)" stroke="#3a2a12"/><path d="M-36,4A40,9 0 0 0 36,-4" transform="rotate(-18)" fill="none" stroke="#e6cf96" stroke-width="2.4"/><path d="M-16,-6H16M-20,3H20" stroke="#5a4320" stroke-width="1.4" opacity=".5"/></svg>`;
  return `<svg class="moon eaten" viewBox="-44 -44 88 88" width="88" height="88" aria-hidden="true"><circle r="30" fill="none" stroke="#5a4a3a" stroke-width="1" stroke-dasharray="3 4"/><path d="M-9,-6C-4,-12 4,-12 9,-6" fill="none" stroke="#5a4a3a" stroke-width="1"/></svg>`;
}
function levOnMoon(){const c=G.moonLev.card;return `<g transform="translate(-15,-15) scale(1.25)">${`<g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="#000" stroke-width="3.6">${UNIT_ICON.leviathan.replace(/@|#bg/g,"#000")}</g><g stroke="${G.p[G.moonLev.owner].color}" stroke-width="1.8">${UNIT_ICON.leviathan.replace(/@/g,G.p[G.moonLev.owner].color).replace(/#bg/g,"#000")}</g></g>`}</g><text y="38" text-anchor="middle" font-size="9" fill="#ff5a64" font-family="Cascadia Code,Consolas,monospace">${"♥".repeat(c.hp)}</text>`}

/* ---------- Delusions: blindness beyond your own cards' reach ---------- */
const deluded=pl=>!!(G.p[pl]&&G.p[pl].delu&&G.p[pl].delu.turns>0);
const blindFor=V=>V!=null&&G.p[V]&&[V,...alliesOf(V)].some(deluded);      // the deluded player and their teammates
function deluSees(V,r,c){   // the Delusion's own rule: only what your cards can reach
  if(!blindFor(V))return true;
  for(const {r:a,c:b} of stacksOf(V)){const dr=Math.abs(a-r),dc=Math.abs(b-c);if(dr<=1&&dc<=1||dr===0&&dc===2||dc===0&&dr===2)return true}
  return false;
}
const hiddenFrom=(V,r,c)=>{const st=G.board[r][c];return !!(st&&(totalBlind(V)||isEnemy(st.owner,V)&&!seesTile(V,r,c)||nepHidden(V,st,r,c)))};   // v71c: a stack lost in Neptune's cloud is hidden from its owner   // the blind see nothing, their own cards too
function applyDelusion(t,by){
  const d=rollN(2,2),n=sum(d);G.p[t].delu={turns:n,maxCut:0,diceCut:0,by};
  tray(by,by===t?"Delusion of Ouroboros":"Delusion of Lucifer",d,`${n} turns`);
  return n;
}

/* ---------- start, end and round hooks ---------- */
function turn2(pl){
  const P=G.p[pl];
  if(P.joy){P.joy=false;log(`${plName(pl)}'s Pleasure and Joy fades.`)}
  if(P.theft){P.theft=false;log(`${plName(pl)}'s Joyful Theft fades.`)}
  turn3(pl);
  P.hungerUses=0;
  if(deluded(pl)){   // a Delusion pays: free mana every turn
    const k=Math.max(0,3-(P.delu.diceCut||0)),d=rollN(k,2);let got=0;
    for(let i=0;i<sum(d)&&mana(pl)<soulCap(pl);i++){const j=G.ether.findIndex(c=>/^\d+$/.test(c.rank));const c=j>=0?G.ether.splice(j,1)[0]:mk(String(2+Math.floor(Math.random()*9)),pick(["S","H","D","C"]));addSoul(pl,c);got++}
    if(k)tray(pl,"Delusion mana",d,`+${got} mana`,true);
    log(`${plName(pl)}'s Delusion gives ${k}d2 free mana: ${got}.`);
  }
}
function end2(pl){
  end3(pl);
  const P=G.p[pl];if(!deluded(pl))return;
  P.delu.turns--;
  if(P.delu.turns>0)return;
  if(P.delu.blindfold&&!P.delu.extended){P.delu={turns:3,maxCut:0,diceCut:0,by:pl,extended:true};log(`<b>The Blindfold</b>: ${plName(pl)} keeps the Delusion three more turns, and Lucifer's stifling is gone.`,"event");notify(pl,`${esc(P.name)} keeps the Delusion three more turns under the Blindfold.`);return}
  P.delu=null;log(`${plName(pl)}'s Delusion lifts: the field is visible again.`);
}
async function turnAsync(pl){   // the start of a turn that may ask something: Saturn's tax, the Second Sun's judgement
  await skyAsync(pl);if(G.over)return;
  await saturnToll(pl);
}
/* Saturn's toll (v71o: its own function, so Saturn's cycle can take it twice) */
async function saturnToll(pl){
  const S=G.saturnBy,P=G.p[pl];
  if(G.moon.gone!=="saturn"||S!=null&&(G.p[S].out||!isEnemy(pl,S))||isHorde(pl)||P.out)return;
  if(P.tribe==="firm"){log(`${plName(pl)} ignores Saturn's tax: the Firmament stands above it.`);return}
  if(P.tribe==="binah"){log(`${plName(pl)} ignores Saturn's tax: Binah owes the Demiurge nothing.`);return}
  const n=1+(G.saturnDebt||0);let paid=0;
  if(P.standing&&P.standing[0]&&P.standing[1]&&Math.random()<.25){log(`<b>Saturn</b> passes ${plName(pl)} by this turn: two Bank Reports in good standing. The toll counts as paid.`,"event");saturnPaid(pl,n,n);return}   // v50
  for(let i=0;i<n;i++){
    const opts=[];
    if(P.hand.length)opts.push({id:"hand",label:"A random card from your hand"});
    if(P.deck.length)opts.push({id:"deck",label:"The top card of your deck"});
    if(mana(pl)>=1)opts.push({id:"mana",label:"1 mana"});
    opts.push({id:"no",label:"Refuse",sub:S==null?"The Bank sends a Debt Collector after you.":"Yaldabaoth regurgitates a Debt Collector onto the field."});
    const ch=opts.length===1?"no":await ask(pl,{kind:"choice",id:"saturn",title:`${G.satSecond?"Saturn's cycle, the second toll":"Saturn"}: ${esc(P.name)} owes ${n-i} more`,options:opts,
      ai:()=>P.deck.length>8?"deck":mana(pl)>=2?"mana":P.hand.length?"hand":P.deck.length?"deck":"no"});
    if(ch==="no"||ch==null){spawnDebt(pl);if(G.satStrict&&!oathNow(pl,"saturn")&&!(G.satStrictSafe||[]).includes(pl))spawnDebt(pl);saturnMissed(pl);break}
    let c=null;
    if(ch==="hand")c=P.hand.splice(Math.floor(Math.random()*P.hand.length),1)[0];
    if(ch==="deck")c=P.deck.pop();
    if(ch==="mana"){P.souls.sort((a,b)=>soulOf(a)-soulOf(b));c=P.souls.shift()}
    if(c){if(S==null){bankAdd(soulOf(c));toGrave(c,"spent")}else if(!(c.unit&&c.unit!=="slave")&&addSoul(S,c));else toGrave(c,"spent");paid++}
  }
  if(paid)log(`${plName(pl)} pays Saturn ${paid} (to ${S==null?"the Bank":plName(S)+"'s soul pile"}).`);
  saturnPaid(pl,paid,n);
  render();
}
function spawnDebt(pl){
  const S=G.saturnBy;
  if(S==null){const B=npcIx("bank");   // Saturn with no master: the Bank sends a collector after the one who refused
    if(B<0){addDebt(pl,1);log(`${plName(pl)} refuses Saturn: 1 mana of debt to the Bank.`);return}
    const ts=stacksOf(pl),free=[];for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++)if(!G.board[r][c]&&!isVoid(r,c))free.push([r,c,ts.length?Math.min(...ts.map(x=>Math.abs(x.r-r)+Math.abs(x.c-c))):0]);
    free.sort((a,b)=>a[2]-b[2]);const t=free.find(x=>x[2]>=2)||free[0];if(!t)return;
    G.board[t[0]][t[1]]={owner:B,cards:[mkUnit("debt",B)],moved:true,attacked:true,hunt:pl};
    log(`<b>Saturn</b>: ${plName(pl)} refuses, and the Bank sends a Debt Collector after them from ${coord(t[0],t[1])}.`,"event");return}let t=zoneTiles(S).filter(([r,c])=>!G.board[r][c]);
  if(!t.length)for(let r=0;r<G.rows;r++)for(let c=0;c<COLS;c++)if(!G.board[r][c]&&!isVoid(r,c))t.push([r,c]);
  if(!t.length){log("Saturn finds no room for a Debt Collector.");return}
  const [r,c]=pick(t);G.board[r][c]={owner:S,cards:[mkUnit("debt",S)],moved:true,attacked:true};
  log(`<b>Saturn</b>: ${plName(pl)} refuses, and ${plName(S)} regurgitates a Debt Collector on ${coord(r,c)}.`,"event");
  notify(S,`${esc(G.p[pl].name)} refuses Saturn: a Debt Collector rises on ${coord(r,c)}.`);
}
function round2(){
  quietRound();fullMoonScout();
  // Deconjured takes the next Full Moon
  if(G.noConjure&&G.moon.i!==4)G.noConjure=false;
  if(G.deconjure&&G.moon.i===4){G.deconjure=false;G.noConjure=true;log("<b>Deconjured</b>: no one can conjure under this Full Moon.","event")}
  else if(G.deconjure&&G.moon.gone)G.deconjure=false;   // v78j: no Moon, no Full Moon to close
  // every Debt Collector still standing raises Saturn's price
  if(G.moon.gone==="saturn"){const n=G.board.flat().filter(s=>s&&hasK(s,"debt")).length;if(n){G.saturnDebt=(G.saturnDebt||0)+n;log(`Saturn's price rises by ${n}: each enemy now pays ${1+G.saturnDebt} a turn.`)}}
  // the Leviathan's toll at every New Moon
  const L=G.moonLev;
  if(L&&levNew()&&G.moon.round>L.since){
    for(const pl of enemiesOf(L.owner)){const P=G.p[pl];if(isHorde(pl)||P.tribe==="tiph"||P.tribe==="firm"){if(!isHorde(pl))log(`${plName(pl)} is immune to the Leviathan on the moon.`);continue}
      const k=R(4)+R(4);let a=0,b=0,m=0;
      for(let i=0;i<k&&P.deck.length;i++){toDark(P.deck.splice(Math.floor(Math.random()*P.deck.length),1)[0]);a++}deckShort(pl,k-a,"the Leviathan's toll");
      for(let i=0;i<2&&P.hand.length;i++){toDark(P.hand.splice(Math.floor(Math.random()*P.hand.length),1)[0]);b++}
      if(P.souls.length){P.souls.sort((x,y)=>soulOf(x)-soulOf(y));toDark(P.souls.shift());m=1}
      log(`<b>The Leviathan's toll</b>: ${plName(pl)} loses ${a} deck card${a===1?"":"s"}, ${b} from the hand and ${m} mana to the Outer Darkness.`,"event");
    }
    notify(L.owner,"The New Moon: the Leviathan takes its toll.");
  }
}

/* ---------- where the dead go: Traffickers, Pleasure and Joy, the Leviathan's kills ---------- */
function buryHook(card,r,c,st){
  const owner=st.owner,F=G.fight;
  if(card.unit==="trafficker"&&card.prisoners&&card.prisoners.length){const ps=card.prisoners;card.prisoners=[];for(const p of ps)toGrave(p,"death");log(`The Trafficker's ${ps.length} prisoner${ps.length>1?"s go":" goes"} free into the grave.`)}
  // a Trafficker beside the dead chains its soul
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const s=at(r+dr,c+dc);if(!s||!isEnemy(s.owner,owner)||G.p[s.owner].tribe!=="tiph")continue;
    const t=s.cards.find(x=>x.unit==="trafficker"&&(x.prisoners||[]).length<3);if(!t)continue;
    if(card.unit==="slave")delete card.unit;
    (t.prisoners=t.prisoners||[]).push(card);card.owner=s.owner;
    log(`${plName(s.owner)}'s Trafficker chains ${esc(nameOf(card))} (${t.prisoners.length}/3).`);return true}
  // Pleasure and Joy: the caster's dead go back into the deck
  if(G.p[owner]&&G.p[owner].joy){if(card.unit==="slave")delete card.unit;card.owner=owner;G.p[owner].deck.push(card);shuffle(G.p[owner].deck);log(`Pleasure and Joy: ${esc(nameOf(card))} goes back into ${plName(owner)}'s deck.`);return true}
  // whatever the Leviathan kills falls into the Outer Darkness
  if(F&&(F.moon||(st===F.D?hasK(F.A,"leviathan"):st===F.A?hasK(F.D,"leviathan"):false))&&card.unit!=="leviathan"){if(card.unit==="slave")delete card.unit;toDark(card);log(`The Leviathan sends ${esc(nameOf(card))} into the Outer Darkness.`);return true}
  if(card.unit==="leviathan"){toDark(card);log("<b>The Leviathan falls into the Outer Darkness.</b>","event");notify(owner,"The Leviathan falls into the Outer Darkness.");return true}
  return false;
}
async function lightningLeviathan(){
  const st=selStack();let c=null,onMoon=false;
  if(st&&hasK(st,"leviathan"))c=st.cards.find(x=>x.unit==="leviathan");
  else if(!st&&G.moonLev){c=G.moonLev.card;onMoon=true}
  if(!c)return false;
  me().bolts=0;SND.zap();c.hp--;
  log(`<b>Lightning Strike</b>: the bolt needs no roll against the Leviathan; it loses a heart (${Math.max(0,c.hp)} left).`,"event");
  if(c.hp<=0){
    if(onMoon){const o=G.moonLev.owner;G.moonLev=null;toDark(c);log("<b>The Leviathan falls from the moon into the Outer Darkness.</b>","event");notify(o,"The Leviathan falls from the moon.")}
    else{const r=G.sel.r,cc=G.sel.c;st.cards.splice(st.cards.indexOf(c),1);vacate(r,cc,st);c.hp=c.maxHp;toDark(c);checkWin()}
    popup("The Leviathan is struck down","<p>Twelve times did the lightning strike twelve at once, with one hundred and forty-four wounds, plus the lightning that cut his tongue into two permanent halves, even down to his throat.</p>",G.active);
  }
  return true;
}

/* ---------- the Leviathan on the moon can be attacked at the New Moon ---------- */
const moonAttackable=st=>!!(G.moonLev&&levNew()&&st&&st.owner===G.active&&canAttackFrom(st)&&isEnemy(st.owner,G.moonLev.owner));   // v78j: your own
function attackMoon(r,c){
  const A=G.board[r][c],L=G.moonLev,D={owner:L.owner,cards:[L.card]};
  const ra=rollStack(A,"atk",D,hasK(A,"satan")?null:netFx(A.odds,hated(A)?"dis":null),weaponOf(A)),rd=rollStack(D,"def",A,"adv");
  A.attacked=true;A.odds=null;G.lastAttack=G.turnNo;
  const line=`${ra.total}${cmpSign(ra.total,rd.total)}${rd.total}`;
  tray(A.owner,"Attack on the moon",ra.dice,line);tray(L.owner,"The Leviathan defends",rd.dice,line,true);
  log(`<b>${plName(A.owner)}</b> attacks the Leviathan on the moon from ${coord(r,c)}: <span class="dice">${ra.parts.join(", ")}</span> = <b>${ra.total}</b> vs <span class="dice">${rd.parts.join(", ")}</span> = <b>${rd.total}</b> <span class="tot">(${line})</span>.`,"combat");
  if(ra.total>rd.total){L.card.hp--;log(`The Leviathan loses a heart (${L.card.hp} left).`);
    if(L.card.hp<=0){G.moonLev=null;L.card.hp=L.card.maxHp;toDark(L.card);log("<b>The Leviathan falls from the moon into the Outer Darkness.</b>","event");notify(A.owner,"The Leviathan falls from the moon.")}}
  else{G.fight={A,D,atkPl:A.owner,defPl:L.owner,moon:true};damage(r,c,1,false);G.fight=null}
  render();
}

/* ---------- the Auction ---------- */
function viewAuction(){
  const V=view(),live=canAct()&&G.phase==="prep";
  const items=G.auction||[];
  ovShow(`<div class="ovbox"><h2>The Auction</h2><p class="dim">Tiphareth of Kether sells the souls its Traffickers chained. Offer mana or cards from your hand; the seller has to approve.</p>
<div class="auct">${items.length?items.map((it,i)=>`<div class="aitem">${face(it.card,{owner:it.seller})}<div><b>${esc(nameOf(it.card))}</b><br><span class="dim">sold by ${plName(it.seller)}</span>${live&&it.seller!==V?`<br><button class="btn ghost sm" data-buy="${i}">Make an offer</button>`:""}</div></div>`).join(""):'<p class="dim">Nothing is for sale.</p>'}</div>
${mysteryHTML(live)}${live?`<p><button class="btn ghost sm" id="tradeBtn">Trade a card from your hand</button> <small class="dim">Offer one of your cards for one of another player's; they pick what to give back, or refuse.</small></p>`:""}<p><button class="btn ghost" id="mcancel">Close</button></p></div>`);
  $("#mcancel").onclick=ovHide;wireMystery();if($("#tradeBtn"))$("#tradeBtn").onclick=async()=>{ovHide();G.busy=true;try{await tradeCard(G.active)}finally{G.busy=false}render()};
  $("#ov").querySelectorAll("[data-buy]").forEach(b=>b.onclick=()=>{ovHide();makeOffer(G.auction[+b.dataset.buy])});
}
async function makeOffer(it,auto){
  const pl=G.active,P=me();if(!it||!G.auction.includes(it))return false;
  const was=G.busy;G.busy=true;
  try{
    let pay=null;
    if(auto)pay=auto;
    else{
      const opts=[];for(let k=1;k<=Math.min(mana(pl),6);k++)opts.push({id:"m"+k,label:`${k} mana`});
      if(P.hand.length)opts.push({id:"cards",label:"Cards from my hand"});
      const ch=await ask(pl,{kind:"choice",title:`Offer for ${esc(nameOf(it.card))}`,options:opts,cancel:"Cancel"});
      if(ch==null)return false;
      if(ch==="cards"){const cs=[];for(let i=0;i<3&&P.hand.length;i++){const k=await ask(pl,{kind:"cards",id:"offer",title:`Offer: add a card (${cs.length} so far)`,cards:P.hand.filter(c=>!cs.includes(c)),cancel:cs.length?"That's my offer":"Cancel"});if(k==null)break;cs.push(P.hand.filter(c=>!cs.includes(c))[k])}
        if(!cs.length)return false;pay={cards:cs}}
      else pay={mana:+ch.slice(1)};
    }
    const what=pay.mana?`${pay.mana} mana`:pay.cards.map(c=>esc(nameOf(c))).join(", ");
    const worth=pay.mana||pay.cards.reduce((a,c)=>a+soulOf(c),0),need=soulOf(it.card)+(it.card.unit?2:0);
    const ok=await ask(it.seller,{kind:"yesno",id:"auction",title:`The Auction: ${esc(G.p[pl].name)}'s offer`,text:`${plName(pl)} offers <b>${what}</b> for ${esc(nameOf(it.card))}. Approve the sale?`,yes:"Approve",no:"Refuse",ai:()=>worth>=need});
    if(!ok){log(`The Auction: ${plName(it.seller)} refuses ${plName(pl)}'s offer of ${what}.`);notify(it.seller,`${esc(G.p[it.seller].name)} refuses the offer.`);return false}
    const S=G.p[it.seller];
    if(pay.mana){let moved=0;P.souls.sort((a,b)=>soulOf(a)-soulOf(b));while(moved<pay.mana&&P.souls.length){const c=P.souls.shift();moved+=soulOf(c);if(!addSoul(it.seller,c))toGrave(c,"spent")}}
    else for(const c of pay.cards){P.hand.splice(P.hand.indexOf(c),1);c.owner=it.seller;if(S.hand.length<handCap(it.seller))S.hand.push(c);else if(!addSoul(it.seller,c))toGrave(c,"spent")}
    if(oathNow(it.seller,"mercury")&&!isNPC(it.seller)){const g=giveMana(it.seller,1);if(g)log(`The Oath of Mercury: ${plName(it.seller)} gets 1 more mana for the sale.`)}   // v50
    G.auction.splice(G.auction.indexOf(it),1);
    const c=it.card;c.owner=pl;if(c.hp!=null)c.hp=c.maxHp;if(P.hand.length<handCap(pl))P.hand.push(c);else{P.deck.push(c);shuffle(P.deck)}
    log(`<b>The Auction</b>: ${plName(pl)} buys ${esc(nameOf(c))} from ${plName(it.seller)} for ${what}.`,"event");notify(pl,`${esc(P.name)} buys ${esc(nameOf(c))} at the Auction.`);
    return true;
  }finally{G.busy=was;render()}
}

/* ---------- God Hunger ---------- */
async function godHunger(){
  const pl=G.active,P=me(),st=selStack();
  const opts=[];
  if(G.grave.length)opts.push({id:"grave",label:"The grave"});
  if(P.deck.length)opts.push({id:"own",label:"Your own deck"});
  if(st&&st.cards.some(c=>!(c.unit&&UNIT[c.unit].hp)&&!isBase(c)))opts.push({id:"field",label:`The selected stack on ${coord(G.sel.r,G.sel.c)}`});
  for(const e of enemiesOf(pl).filter(e=>!isHorde(e)&&G.p[e].deck.length))opts.push({id:"p"+e,label:`${G.p[e].name}'s deck`,sub:"They roll 1d4 against your 1d4; lose and you pay them 2 mana."});
  if(!opts.length){log("God Hunger finds nothing to eat.");return}
  const src=await ask(pl,{kind:"choice",id:"hunger",title:"God Hunger: what does Yaldabaoth eat?",options:opts,
    ai:()=>(opts.find(o=>o.id==="grave"&&G.grave.length>=2)||opts.find(o=>o.id==="field")||opts.find(o=>o.id[0]==="p")||opts[0]).id});
  const n=R(2);let eaten=[];
  if(src==="grave")for(let i=0;i<n&&G.grave.length;i++)eaten.push(G.grave.splice(Math.floor(Math.random()*G.grave.length),1)[0]);
  else if(src==="own")for(let i=0;i<n&&P.deck.length;i++)eaten.push(P.deck.pop());
  else if(src==="field"){const s=G.sel;for(let i=0;i<n;i++){const ok=st.cards.filter(c=>!(c.unit&&UNIT[c.unit].hp)&&!isBase(c)).sort((a,b)=>nat(a)-nat(b));if(!ok.length)break;const c=ok[0];st.cards.splice(st.cards.indexOf(c),1);if(c.captured&&c.captured.length){for(const x of c.captured)toGrave(x,"death");c.captured=[]}eaten.push(c)}
    if(vacate(s.r,s.c,st))G.sel=null}
  else if(src&&src[0]==="p"){
    const t=+src.slice(1),a=R(4),b=R(4);tray(pl,"God Hunger",[{s:4,v:a}],`${a} vs ${b}`);tray(t,"God Hunger defense",[{s:4,v:b}],`${b} vs ${a}`,true);
    if(a<=b){let moved=0;P.souls.sort((x,y)=>soulOf(x)-soulOf(y));while(moved<2&&P.souls.length){const c=P.souls.shift();moved+=soulOf(c);if(!addSoul(t,c))toGrave(c,"spent")}
      log(`<b>God Hunger fails</b>: ${plName(pl)} rolls ${a} against ${plName(t)}'s ${b} and loses 2 mana to them.`,"event");
      popup("God Hunger fails",`<p>${plName(pl)} could not eat ${plName(t)}'s deck: ${a} against ${b}. Yaldabaoth loses two mana from the failure, and ${plName(t)} gains two.</p>`,pl);render();return}
    for(let i=0;i<n&&G.p[t].deck.length;i++)eaten.push(G.p[t].deck.pop());
  }
  if(!eaten.length){log("God Hunger finds nothing to eat.");return}
  const room=soulCap(pl)-mana(pl),m=eaten.reduce((a,c)=>a+soulOf(c),0);
  const use=await ask(pl,{kind:"choice",id:"hungeruse",title:`God Hunger: ${eaten.length} card${eaten.length>1?"s":""} eaten`,options:[{id:"hunger",label:`Feed the hunger (${(P.hunger||0)+eaten.length} of 7)`},{id:"mana",label:`Take the mana (+${Math.min(m,room)})`}],
    ai:()=>(P.hunger||0)<7&&mana(pl)>=2?"hunger":"mana"});
  if(use==="mana"){for(const c of eaten){if(c.unit&&c.unit!=="slave"){toDark(c);continue}if(!addSoul(pl,c))toGrave(c,"spent")}log(`<b>God Hunger</b>: ${plName(pl)} eats ${eaten.map(c=>esc(nameOf(c))).join(", ")} for mana.`,"event")}
  else{for(const c of eaten)toDark(c);P.hunger=(P.hunger||0)+eaten.length;log(`<b>God Hunger</b>: ${plName(pl)} eats ${eaten.map(c=>esc(nameOf(c))).join(", ")} (hunger ${P.hunger} of 7).`,"event")}
  checkWin();
}

/* ---------- the spells ---------- */
SPELLS.push(
 {id:"ouro",tribe:"lucifer",dice:"1d2",name:"Delusion of Ouroboros",cost:1,school:"Illusion",text:"Cast on yourself. For 2d2 of your turns you and your teammates cannot see enemy cards beyond your own cards' reach; meanwhile your mana can go up to nine and you get 3d2 free mana at the start of each turn. Casting it makes the Delusion of Lucifer free this round.",
  ok:()=>!deluded(G.active),run:async()=>{const n=applyDelusion(G.active,G.active);me().ouroRound=G.moon.round;
   log(`<b>Delusion of Ouroboros</b>: ${plName(G.active)} blinds themselves for ${n} turns; nine mana at most and 3d2 free mana a turn.`,"event");notify(G.active,`${esc(me().name)} sinks into the Delusion of Ouroboros for ${n} turns.`)}},
 {id:"lucifer",tribe:"lucifer",name:"Delusion of Lucifer",cost:6,school:"Illusion",text:"6 mana, free in a round you cast the Delusion of Ouroboros on yourself. An enemy gets the same Delusion for 2d2 turns: blind beyond their own cards' reach, nine mana at most and 3d2 free mana a turn. Then you can stifle it: every 2 mana, or every 2 cards from your deck, takes one maximum mana or one free die from them while it lasts.",
  ok:()=>!survival()&&enemiesOf(G.active).some(e=>!isHorde(e)),run:async()=>{
   const t=await pickFoe("lucifer","Delusion of Lucifer: on whom?"),T=G.p[t],n=applyDelusion(t,G.active);
   log(`<b>Delusion of Lucifer</b>: ${plName(G.active)} blinds ${plName(t)} for ${n} turns.`,"event");notify(G.active,`${esc(T.name)} is blinded by the Delusion of Lucifer for ${n} turns.`);
   const pl=G.active,P=me();
   for(let guard=0;guard<12;guard++){
     const opts=[];const D=T.delu;
     if(D.maxCut<6&&mana(pl)>=2)opts.push({id:"maxm",label:"Take 1 maximum mana from them (2 mana)"});
     if(D.maxCut<6&&P.deck.length>=2)opts.push({id:"maxd",label:"Take 1 maximum mana from them (2 cards from your deck)"});
     if(D.diceCut<3&&mana(pl)>=2)opts.push({id:"dicem",label:"Take 1 free die from them (2 mana)"});
     if(D.diceCut<3&&P.deck.length>=2)opts.push({id:"diced",label:"Take 1 free die from them (2 cards from your deck)"});
     if(!opts.length)break;opts.push({id:"done",label:"That's enough"});
     const ch=await ask(pl,{kind:"choice",id:"stifle",title:`Stifle ${esc(T.name)}: max ${9-D.maxCut}, ${3-D.diceCut}d2 a turn`,options:opts,ai:()=>mana(pl)>=4&&D.diceCut<3?"dicem":P.deck.length>20&&D.maxCut<3?"maxd":"done"});
     if(ch==null||ch==="done")break;
     if(ch.endsWith("m"))pay(pl,2);else for(let i=0;i<2;i++)toGrave(P.deck.splice(Math.floor(Math.random()*P.deck.length),1)[0],"burn");
     if(ch.startsWith("max"))D.maxCut++;else D.diceCut++;
     log(`${plName(pl)} stifles ${plName(t)}'s Delusion: ${9-D.maxCut} mana at most, ${3-D.diceCut}d2 a turn.`);
   }}},
 {id:"deconj",tribe:"lucifer",name:"Deconjured",cost:2,dice:"2 or 2+1d2",school:"Curse",text:"Choose one. Full curse (2 + 1d2 mana, rolled each round): no one can conjure during the next Full Moon, and the grave gives nothing at the next New Moon. Short curse (2 mana): no one, you included, can conjure during the next round.",
  ok:()=>!G.deconjure&&!G.noConjure&&!(G.noConjureRound>=G.moon.round),run:async()=>{   // v78j: the one-round curse ends
   const pl=G.active,full=G.prices.deconj||3,extra=full-2,opts=[{id:"short",label:"Short curse (2 mana)",sub:"No one can conjure next round."}];
   if(mana(pl)>=extra&&G.moon.i>=0)opts.unshift({id:"full",label:`Full curse (${full} mana)`,sub:"No conjuring at the next Full Moon, and no grave gift at the next New Moon."});
   const ch=await ask(pl,{kind:"choice",id:"deconj",title:"Deconjured",options:opts,ai:()=>opts[0].id});
   if(ch==="full"){if(extra)pay(pl,extra);G.deconjure=true;G.noGraveNext=true;log(`<b>Deconjured</b>: ${plName(pl)} closes the Ether at the next Full Moon and the grave at the next New Moon.`,"event");notify(pl,"Deconjured: no conjuring at the next Full Moon, no grave gift at the next New Moon.")}
   else{G.noConjureRound=G.moon.round+1;log(`<b>Deconjured</b>: ${plName(pl)} closes the Ether to everyone for the next round.`,"event");notify(pl,"Deconjured: no one can conjure next round.")}}},
 {id:"joy",tribe:"lucifer",name:"Pleasure and Joy",cost:0,dice:"1+1d2 or 1d3−1",school:"Curse",text:"Choose one, until your next turn. Pleasure and Joy (1 + 1d2 mana): your cards glow in your color, and those that are killed go back into your deck instead of the grave. Joyful Theft (1d3 − 1 mana): every damage an enemy deals to your units takes 1 mana from that enemy and gives it to you.",
  ok:()=>!me().joy&&!me().theft&&canAfford(G.active,Math.min(joyPrice("A"),joyPrice("B"))),run:async()=>{
   const pl=G.active,P=G.p[pl],a=joyPrice("A"),b=joyPrice("B"),opts=[];
   if(canAfford(pl,a))opts.push({id:"joy",label:`Pleasure and Joy (${a?a+" mana":"free"})`,sub:"Your killed cards go back into your deck."});
   if(canAfford(pl,b))opts.push({id:"theft",label:`Joyful Theft (${b?b+" mana":"free"})`,sub:"Every damage dealt to your units steals 1 mana from whoever dealt it."});
   const ch=await ask(pl,{kind:"choice",id:"joy",title:"Pleasure and Joy",options:opts,cancel:"Cancel",ai:()=>opts[opts.length-1].id});
   const n=ch==="joy"?a:ch==="theft"?b:null;if(n==null)return;
   if(n){G.spentOther=true;spend(pl,n)}   // v78j: paid like any spell (to the Bank; no Grave Blessing after)
   if(ch==="joy"){P.joy=true;log(`<b>Pleasure and Joy</b>: ${plName(pl)}'s cards glow; their dead return to the deck until the next turn.`,"event")}
   else{P.theft=true;log(`<b>Joyful Theft</b>: until ${plName(pl)}'s next turn, every damage to their units costs the attacker 1 mana.`,"event")}}},
 {id:"lev",tribe:"leviathan",name:"Rise to the Moon",cost:0,school:"Sorcery",text:"Free, only at the New Moon, while your Leviathan is on the field. The Leviathan leaves the field for the moon. From the next New Moon on, every enemy pays its toll each New Moon: 2d4 random deck cards, 2 random cards from the hand and 1 mana, all into the Outer Darkness. On the moon your mana can rise by one for every card in the Outer Darkness (twelve at most). It can be attacked only at the New Moon, and defends there with advantage.",
  ok:()=>(G.moon.i===0&&!G.moon.gone||G.moon.gone==="mars")&&!G.moonLev&&stacksOf(G.active).some(x=>hasK(x.st,"leviathan")),run:async()=>{
   const x=stacksOf(G.active).find(x=>hasK(x.st,"leviathan")),c=x.st.cards.find(k=>k.unit==="leviathan");
   x.st.cards.splice(x.st.cards.indexOf(c),1);vacate(x.r,x.c,x.st);if(G.sel&&G.sel.r===x.r&&G.sel.c===x.c)G.sel=null;
   G.moonLev={card:c,owner:G.active,since:G.moon.round};
   log(`<b>The Leviathan rises onto the New Moon.</b>`,"event");
   popup("The Leviathan on the moon",`<p>“'Spit revelation’s limbo back into the cup of sand,' the serpent says wordlessly to the soul from the moon above.</p><p>Caustic spit, bitter with mouth burns. A favor of spirits, where pillars are seen like windows of reflections of themselves inside; dying memories.</p><p>The boy says to himself, 'The apocryphon said thirteen of twelve eternities. I must brand the soul with burning births. Falling from infinity without beginnings, into four corners of end unleashed onto a new world.'”</p>`,G.active);
   popup("Spit the empty full into",`<p>From the next New Moon until the Leviathan is dead, every enemy of ${plName(G.active)} pays at each New Moon: <b>2d4 random cards from the deck, two random cards from the hand, and one mana</b>, all into the Outer Darkness. Tiphareth of Kether is immune.</p><p>Every unit can attack the Leviathan on the moon, but only at the New Moon, and it defends there with advantage.</p>`,G.active)}},
 {id:"exile",tribe:"leviathan",name:"Exile: the Outer Darkness",cost:0,school:"Necromancy",text:"Free. Select your stack with a Joker: every soul it captured falls into the Outer Darkness.",
  ok:()=>selOwnJoker()&&selStack().cards.some(c=>kind(c)==="joker"&&(c.captured||[]).length),run:async()=>{
   const j=selStack().cards.find(c=>kind(c)==="joker"&&(c.captured||[]).length),n=j.captured.length;for(const s of j.captured.splice(0))toDark(s);
   log(`<b>Exile</b>: ${plName(G.active)}'s Joker casts ${n} soul${n>1?"s":""} into the Outer Darkness.`,"event")}},
 {id:"judge",tribe:"yald",name:"Night's Judgement",cost:0,school:"Sorcery",text:"Free, at the New Moon or the Full Moon: Yaldabaoth eats the moon. It disappears and its phases stop. A Leviathan on it goes back into its player's deck. Take 3 mana, or count the moon as three cards toward the hunger.",
  ok:()=>!G.moon.gone&&(G.moon.i===0||G.moon.i===4)||G.moon.gone==="mars",run:async()=>{
   const pl=G.active,P=me();if(G.moon.gone==="mars")G.marsEaten=true;
   if(G.moonLev){const L=G.moonLev;G.moonLev=null;L.card.hp=L.card.maxHp;G.p[L.owner].deck.push(L.card);shuffle(G.p[L.owner].deck);log(`The Leviathan falls from the eaten moon back into ${plName(L.owner)}'s deck.`)}
   G.moon.gone="eaten";G.moon.i=-1;G.moon.blood=false;applyMoonTheme();
   const use=await ask(pl,{kind:"choice",id:"moonuse",title:"Night's Judgement: the moon is eaten",options:[{id:"hunger",label:`Feed the hunger (${(P.hunger||0)+3} of 7)`},{id:"mana",label:"Take 3 mana"}],ai:()=>"hunger"});
   if(use==="mana"){for(let i=0;i<3&&mana(pl)<soulCap(pl);i++)addSoul(pl,mk(String(2+Math.floor(Math.random()*9)),pick(["S","H","D","C"])))}else P.hunger=(P.hunger||0)+3;
   log(`<b>Night's Judgement</b>: ${plName(pl)} eats the moon${use==="mana"?" for mana":` (hunger ${P.hunger} of 7)`}. The phases stop.`,"event");
   popup("Night's Judgement",`<p>${plName(pl)} eats the moon. It leaves the sky and its phases stop.</p>`,pl)}},
 {id:"hunger",tribe:"yald",dice:"1d2",name:"God Hunger",cost:1,school:"Necromancy",text:"Twice a turn. Eat 1d2 cards from the grave, your own deck, the selected stack on the field, or an enemy's deck (they roll 1d4 against your 1d4; if you lose, you pay them 2 mana). Take the eaten as mana, or feed the hunger with them. Seven eaten bring Saturn.",
  ok:()=>(me().hungerUses||0)<2,run:async()=>{me().hungerUses=(me().hungerUses||0)+1;await godHunger()}},
 {id:"saturn",tribe:"yald",name:"Regurgitate Saturn",cost:0,school:"Sorcery",text:"Free, once the hunger reaches seven and the moon is out of the sky. Saturn takes the moon's place: at the start of each of their turns every enemy pays 1 (a hand card, the top deck card or 1 mana) into your soul pile, or refuses and a Debt Collector rises on your ground. Each Debt Collector still standing at a new round raises the price by 1. Binah is exempt.",
  ok:()=>(me().hunger||0)>=7&&!!G.moon.gone&&G.moon.gone!=="saturn",run:async()=>{
   const pl=G.active;if(G.moonLev){const L=G.moonLev;G.moonLev=null;L.card.hp=L.card.maxHp;G.p[L.owner].deck.push(L.card);shuffle(G.p[L.owner].deck)}
   G.p[pl].hunger=Math.max(0,(G.p[pl].hunger||0)-7);   // v78j: the seven eaten are spent
   G.moon.gone="saturn";G.moon.i=-1;G.moon.blood=false;G.saturnBy=pl;G.saturnDebt=0;applyMoonTheme();
   log(`<b>Saturn</b>: ${plName(pl)} regurgitates Saturn where the moon used to be.`,"event");
   popup("Saturn",`<p>${plName(pl)} regurgitates Saturn into the moon's place. Every enemy now pays the Demiurge at the start of each turn, or a Debt Collector rises.</p><p class="dim">A Debt Collector copies the score of the card it fights, without its advantage.</p>`,pl)}},
 {id:"lifesell",tribe:"tiph",name:"Life for Sell",cost:0,school:"Sorcery",text:"Free. Select your stack with a Trafficker holding prisoners: put one of them up at the Auction, beside the Outer Darkness. Any player can offer mana or cards from the hand for it; you approve the sale.",
  ok:()=>selOwn()&&selStack().cards.some(c=>c.unit==="trafficker"&&(c.prisoners||[]).length),run:async()=>{
   const t=selStack().cards.find(c=>c.unit==="trafficker"&&(c.prisoners||[]).length);
   const i=t.prisoners.length===1?0:await ask(G.active,{kind:"cards",id:"lifesell",title:"Life for Sell: who goes to the Auction?",cards:t.prisoners,box:"plain"});
   const c=t.prisoners.splice(i==null?0:i,1)[0];(G.auction=G.auction||[]).push({card:c,seller:G.active});
   log(`<b>Life for Sell</b>: ${plName(G.active)} puts ${esc(nameOf(c))} up at the Auction.`,"event");notify(G.active,`${esc(nameOf(c))} is up for sale at the Auction.`)}},
 {id:"blindfold",tribe:"tiph",name:"The Blindfold",cost:2,school:"Enchantment",text:"While you are under a Delusion: when it ends, you keep it three more turns, with its blindness, its nine mana and its free dice, and without anything Lucifer paid to stifle it.",
  ok:()=>deluded(G.active)&&!me().delu.blindfold&&!me().delu.extended,run:async()=>{me().delu.blindfold=true;log(`<b>The Blindfold</b>: ${plName(G.active)} will keep the Delusion three turns longer.`,"event")}}
);

/* ---------- the computer ---------- */
async function aiSubstance2(pl,W,cast1,foes,mine,near){
  const P=G.p[pl],lv=P.cpu;
  if(P.tribe==="lucifer"){
    if(!deluded(pl)&&mana(pl)>=spellCost(SP("ouro"))+1)await cast1("ouro");
    if(P.ouroRound===G.moon.round||mana(pl)>=8)await cast1("lucifer");
    if(!G.deconjure&&Math.random()<(lv==="hard"?.25:.12)&&mana(pl)>=6)await cast1("deconj");
    if(W&&W.atk>1&&Math.random()<.3&&mana(pl)>=5)await cast1("joy");
  }
  if(P.tribe==="leviathan"){
    if(G.moon.i===0)await cast1("lev");
    if(G.moonLev&&G.moonLev.owner===pl)for(const m of mine)if(m.st.cards.some(c=>kind(c)==="joker"&&(c.captured||[]).length>=2))await cast1("exile",m.r,m.c);
  }
  if(P.tribe==="yald"){
    if(G.moon.gone==="sun")await cast1("cry");else await cast1("judge");   // a burning Sun is worth more as a Black Sun
    for(let i=0;i<2&&mana(pl)>=spellCost(SP("hunger"))+1;i++){
      const t=foes.filter(e=>e.st.cards.some(c=>!(c.unit&&UNIT[c.unit].hp)&&!isBase(c))).sort((a,b)=>AI.value(b.st)-AI.value(a.st))[0];
      if(!(t?await cast1("hunger",t.r,t.c):await cast1("hunger")))break;
    }
    if((P.hunger||0)>=7)await cast1("saturn");
  }
  if(P.tribe==="tiph"){
    for(const m of mine)if(m.st.cards.some(c=>c.unit==="trafficker"&&(c.prisoners||[]).length))await cast1("lifesell",m.r,m.c);
    if(deluded(pl))await cast1("blindfold");
  }
  // anyone may buy at the Auction
  for(const it of [...(G.auction||[])]){
    if(it.seller===pl||!G.auction.includes(it))continue;
    const need=soulOf(it.card)+(it.card.unit?2:0);
    if(AI.value({cards:[it.card]})>3.5&&mana(pl)>=need+2&&Math.random()<.6){await makeOffer(it,{mana:need});break}
  }
}
async function aiMoonAttack(pl){
  if(!G.moonLev||G.moon.i!==0||!isEnemy(pl,G.moonLev.owner))return;
  for(const {st,r,c} of stacksOf(pl)){
    if(!G.moonLev)return;if(!moonAttackable(st))continue;
    const D={owner:G.moonLev.owner,cards:[G.moonLev.card]};let w=0;
    for(let i=0;i<24;i++){if(rollStack(st,"atk",D,null,weaponOf(st)).total>rollStack(D,"def",st,"adv").total)w++}
    if(w/24>.5){attackMoon(r,c);await sleep(500)}
  }
}

/* ---------- symbols ---------- */
UNIT_ICON.leviathan=`<path d="M-10,6C-6,10 -1,9 1,5C3,1 0,-2 3,-5C6,-8 10,-6 9,-2 M9,-2L11,-1L9,0 M6,-5L7,-9L5,-6 M-10,6C-11,3 -9,1 -7,2C-5,3 -6,6 -3,6C0,6 -1,2 1,0 M-7,2L-8,-1 M-3,6L-3,3"/>`;
UNIT_ICON.trafficker=`<path d="M-8,-9a3,3 0 1,0 0.1,0Z M-6,-6L-3,-3 M-3,-3a2.5,2.5 0 1,0 0.1,0 M-1,-1L1,1 M1,1a2.5,2.5 0 1,0 0.1,0 M3,3L5,5 M7,7a4,4 0 1,0 0.1,0Z"/>`;
UNIT_ICON.debt=`<path d="M-8,-10H6L8,-8V10H-8Z M-5,-6H5 M-5,-3H5 M-5,0H2 M-2,4a3,3 0 1,0 0.1,0 M-2,4V7"/>`;
