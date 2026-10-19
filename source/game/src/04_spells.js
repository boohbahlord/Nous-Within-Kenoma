/* ---------------- spells ---------------- */
const selStack=()=>G.sel&&G.board[G.sel.r]&&G.board[G.sel.r][G.sel.c];
const selOwn=()=>selStack()&&selStack().owner===G.active;
const selEnemy=()=>selStack()&&isEnemy(selStack().owner,G.active);
/* spells aimed at another player: with several enemies, the caster picks one */
async function pickFoe(id,title){const es=enemiesOf(G.active).filter(pl=>!isHorde(pl));const t=es.length<=1?es[0]:await ask(G.active,{kind:"player",id,title,players:es});G.histTarget=t;return t}
const selOwnJoker=()=>selOwn()&&hasK(selStack(),"joker");
const SCHOOLS=["Conjuring","Necromancy","Enchantment","Curse","Sorcery","Illusion"];   // v43: Conjuring (and the Ether) first
const SPELLS=[
 {id:"ritual",name:"Ritual Dice",cost:1,school:"Necromancy",text:"+3d6 to this turn's Grave Blessing for each one bought.",ok:()=>{const b=SP("bless");return !!b&&b.ok()&&!spellBlock(b)},run:async()=>{G.ritual=(G.ritual||0)+1;log(`Ritual Dice: three more dice for the Grave Blessing (${3*G.ritual} from Ritual Dice this turn).`)}},
 {id:"bless",name:"Grave Blessing",cost:0,school:"Necromancy",text:"Free, once a turn, before any other mana is spent. Roll 1d6, +1d6 per Ace you have on the field (6 dice at most), +3d6 for each Ritual Dice bought this turn. Each natural 6 raises a card from the grave. Every card you overdrew to the grave takes 1d6 off the first six.",ok:()=>!G.blessed&&!G.spentOther&&G.grave.length>0&&blessCap(G.active)>0,run:blessing},
 {id:"suicide",name:"Sacrificial Suicide",cost:0,school:"Necromancy",text:"Select your stack with a Joker. The Joker dies and the souls it captured go to your soul pile (6 mana at most; the surplus goes to the grave). Under a Blood Moon, the Joker and all its souls go to the Outer Darkness instead.",ok:()=>!G.spent&&selOwnJoker(),run:suicideSpell},
 {id:"sever",name:"Flesh Severance",cost:0,school:"Necromancy",text:"Arm for this turn: an enemy killed next to your Joker is exiled to the Ether for its conjuring cost instead of being captured.",ok:()=>true,run:async()=>{me().sevArmed=!me().sevArmed;log(`Flesh Severance ${me().sevArmed?"armed":"disarmed"}.`)}},
 {id:"resur",dice:"1d2+1",name:"Resurrection",cost:6,school:"Necromancy",text:"Choose one card from the grave and bring it back into your hand.",ok:()=>G.grave.length>0&&me().hand.length<handCap(G.active),run:async()=>{await pickGrave(G.active,1,"Resurrection")}},
 {id:"divine",dice:"1d2+1",name:"Divine Odds",cost:3,school:"Enchantment",text:"Select your stack: advantage on all its dice for its next combat.",ok:()=>selOwn()&&!selStack().odds,run:async()=>{selStack().odds="adv";log("Divine Odds marks a stack.")}},
 {id:"hypo",name:"Hypostasis",cost:3,school:"Enchantment",text:"Select your stack: it cannot be attacked for two turns. While it lasts it cannot attack or step toward the enemy, only sideways or back. Costs 3 for one card, +1 for each more card in the stack. Needs at least two of your stacks on the field.",ok:()=>selOwn()&&!selStack().hypo&&stacksOf(G.active).length>=2,run:async()=>{const st=selStack();st.hypo=2;log(`Hypostasis: ${plName(G.active)}'s stack of ${st.cards.length} becomes untouchable for two turns.`)}},
 {id:"forced",dice:"1d2",name:"Forced Hand",cost:2,school:"Curse",text:"The other player draws 1d2 cards; any over the hand limit go to the grave (and cut their Grave Blessing).",ok:()=>!survival(),run:async()=>{const t=await pickFoe("forced","Forced Hand: who draws?");const n=R(2);tray(G.active,"Forced Hand",[{s:2,v:n}],`draw ${n}`);draw(t,n,"Forced Hand")}},
 {id:"hexed",dice:"1d2+1",name:"Hexed Odds",cost:3,school:"Curse",text:"Select an enemy stack: disadvantage on all its dice for its next combat.",ok:()=>selEnemy()&&!selStack().odds,run:async()=>{selStack().odds="dis";log("Hexed Odds marks an enemy stack.")}},
 {id:"double",name:"Double Edged Sword",cost:1,school:"Curse",text:"Roll 3d6. Each 1 burns a card from your deck; each 6 burns a card from the enemy's deck.",ok:()=>!survival(),run:doubleEdge},
 {id:"three",dice:"1d3",name:"Three of Swords",cost:3,school:"Curse",text:"Roll 1d2. A 1 destroys one random card in the enemy's hand and one in yours; a 2 destroys two of each. If your hand runs short, the rest comes from your deck. The enemy loses nothing from the deck.",ok:()=>!survival(),run:threeSwords},
 {id:"clair",dice:"2+1d2",name:"Clairvoyance",cost:3,school:"Sorcery",text:"Look at 2d6 cards from your deck, take one into your hand, then reshuffle. 6 mana at the New Moon, 2 at the Full Moon.",ok:()=>me().deck.length>0&&me().hand.length<handCap(G.active),run:clairvoyance},
 {id:"tele",dice:"1d2−1",name:"Teleport",cost:1,school:"Sorcery",text:"Select your stack in your own two lines with no enemy beside it and leave exactly one card checked; that card leaves the field now and comes back into your hand at the start of your next turn.",ok:teleOk,run:teleport},
 {id:"naked",dice:"1d2",name:"Naked Hand",cost:3,school:"Sorcery",text:"The other player's hand is shown to you for the rest of this turn, and both players are told it has been seen. 6 mana at the New Moon, free at the Full Moon.",ok:()=>!survival()&&enemiesOf(G.active).some(pl=>G.p[pl].hand.length>0),run:nakedHand},
 {id:"cj",name:"Jack Conjure",cost:1,school:"Conjuring",text:"A Jack's soul comes from the Ether into your deck.",ok:()=>etherHas("jack"),run:()=>conjure("jack")},
 {id:"cjk",name:"Joker Conjure",cost:2,school:"Conjuring",text:"A Joker's soul comes from the Ether into your deck.",ok:()=>etherHas("joker"),run:()=>conjure("joker")},
 {id:"cq",name:"Queen Conjure",cost:2,school:"Conjuring",text:"A Queen's soul comes from the Ether into your deck.",ok:()=>etherHas("queen"),run:()=>conjure("queen")},
 {id:"ck",name:"King Conjure",cost:2,school:"Conjuring",text:"A King's soul comes from the Ether into your deck.",ok:()=>etherHas("king"),run:()=>conjure("king")},
 {id:"ca",name:"Ace Conjure",cost:3,school:"Conjuring",text:"An Ace's soul comes from the Ether into your deck.",ok:()=>etherHas("ace"),run:()=>conjure("ace")},
 {id:"cs",name:"Soldier Conjure",cost:1,school:"Conjuring",text:"A soldier's soul (2 to 10) comes from the Ether into your deck.",ok:()=>etherHas("soldier"),run:()=>conjure("soldier")}
];
const SP=id=>SPELLS.find(s=>s.id===id);
/* spells with a dice price roll it once at the start of each round (the same price for everyone that round); the moon's prices replace the roll while that phase lasts */
const PRICE={tele:()=>R(2)-1,deconj:()=>2+R(2),joyA:()=>1+R(2),joyB:()=>R(3)-1,ouro:()=>R(2),hunger:()=>R(2),resur:()=>R(2)+1,divine:()=>R(2)+1,hexed:()=>R(2)+1,forced:()=>R(2),three:()=>R(3),clair:()=>2+R(2),naked:()=>R(2)};
function rollPrices(){G.roundPrices={};for(const k in PRICE)G.roundPrices[k]=PRICE[k]();G.prices={...G.roundPrices}}
function baseCost(sp){
  if(sp.id==="three"&&G.p[G.active]&&G.p[G.active].tribe==="angel")return 1;
  if(sp.id==="carch"&&G.p[G.active]&&G.p[G.active].tribe==="beginner")return 1;   // Archers come cheap to the Beginner   // the Angel Machine's Three of Swords
  if(sp.id==="lucifer"&&me().ouroRound===G.moon.round)return 0;                   // free in a round you cast Ouroboros on yourself
  const firm=G.p[G.active]&&G.p[G.active].tribe==="firm";   // the Firmament pays no moon surcharges
  if(sp.id==="clair"&&newPrices()&&!firm)return 6;
  if(sp.id==="clair"&&fullPrices())return 2;
  if(sp.id==="naked")return newPrices()&&firm?(G.prices?G.prices.naked:2):newPrices()?6:G.moon.blood?1:fullPrices()?0:(G.prices?G.prices.naked:2);
  if(sp.id==="deconj")return 2;   // the full curse pays the rest when it is chosen
  if(sp.id==="joy")return 0;      // both options pay when chosen
  if(G.prices&&G.prices[sp.id]!=null)return G.prices[sp.id];
  if(sp.id==="hypo"){const st=selOwn()?selStack():null;return 3+(st?st.cards.length-1:0)}
  return sp.cost;
}
function spellBlock(sp){ // reason the moon or mode forbids a spell, or ""
  if(sp.school==="Necromancy"&&G.p[G.active]&&oathOf(G.active)==="earth")return "The Oath of the Earth forbids necromancy.";
  if(G.bank&&G.bank.dead&&sp.school==="Conjuring")return "The Ether is closed: the Banker is dead.";
  if(fullDrawbacks()&&sp.school==="Necromancy"&&me().tribe!=="firm")return "No necromancy under the Full Moon.";
  if(fullDrawbacks()&&sp.id==="forced")return "No one draws under the Full Moon.";
  if(survival()&&["forced","double","three","naked"].includes(sp.id))return "The Horde has no hand or deck.";
  if(G.noConjure&&sp.school==="Conjuring")return "Deconjured: no one can conjure this Full Moon.";
  if(G.noConjureRound===G.moon.round&&sp.school==="Conjuring")return "Deconjured: no one can conjure this round.";
  return "";
}
const phaseOk=sp=>G.phase==="prep"||(G.phase==="attack"&&G.opts.atkSpells&&["Enchantment","Curse","Sorcery","Illusion"].includes(sp.atkSchool||sp.school));
const spellMine=sp=>!sp.tribe||G.p[G.active].tribe===sp.tribe;   // Substance spells belong to their Substance
function spellReady(sp){return spellMine(sp)&&phaseOk(sp)&&!spellBlock(sp)&&sp.ok()&&canAfford(G.active,spellCost(sp))}
async function cast(sp){
  if(G.busy&&!me().cpu)return;
  if(!phaseOk(sp)){flash(G.opts.atkSpells?"That school is cast in the prep phase.":"Spells are cast in the prep phase.");return}
  if(!spellMine(sp))return;
  const why=spellBlock(sp);if(why){flash(why);return}
  if(!sp.ok()){flash("That spell can't be cast right now.");return}
  const cost=spellCost(sp);
  if(!canAfford(G.active,cost)){flash(me().credit?"Not even the Bank will cover that.":"Not enough mana. (The Bank can let you spend on credit.)");return}
  const wasBusy=G.busy;G.busy=true;const caster=G.active;
  const tile=G.sel&&["suicide","divine","hypo","hexed","tele"].includes(sp.id)?coord(G.sel.r,G.sel.c):null;G.histTarget=null;G.histTile=tile;
  if(cost){if(sp.id!=="ritual")G.spentOther=true;spend(G.active,cost);noteBuy(sp.id)}
  const paidCost=cost;   // spell mana goes to the Bank
  try{await sp.run()}finally{G.histTile=null}
  skyBought(sp,paidCost);mercuryBought(sp);
  hist(caster,{kind:"spell",name:sp.name,tile,cost,target:G.histTarget!=null?G.p[G.histTarget].name:null});
  log(`${plName(caster)} casts <b>${esc(sp.name)}</b>${tile?" on "+tile:""}${G.histTarget!=null?" at "+plName(G.histTarget):""}${cost?` (${cost} mana)`:""}.`,"cast");G.histTarget=null;
  G.busy=wasBusy;render();checkWin();
}
const etherHas=k=>G.ether.some(c=>k==="soldier"?/^\d+$/.test(c.rank):kind(c)===k);
async function conjure(k){
  const list=G.ether.filter(c=>k==="soldier"?/^\d+$/.test(c.rank):kind(c)===k);
  const c=pick(list);G.ether.splice(G.ether.indexOf(c),1);
  c.owner=G.active;me().deck.push(c);shuffle(me().deck);log(`A ${KNAME[kind(c)]}'s soul materializes from the Ether into ${plName(G.active)}'s deck.`);
}
async function blessing(){
  const pl=G.active,aces=stacksOf(pl).filter(x=>hasK(x.st,"ace")).length;
  const want=Math.min(6,1+aces),cap=blessCap(pl),rit=3*(G.ritual||0),n=Math.min(want,cap)+rit;   // v47: Ritual Dice adds 3d6 a purchase, past the six-dice cap and the overdraw cut
  const why=`1${aces?` + ${aces} for Ace${aces>1?"s":""} on the field`:""}${1+aces>6?", 6 at most":""}${cap<want?`, cut to ${cap} by overdrawing`:""}${rit?`, + ${rit} from Ritual Dice`:""}`;
  const d=rollN(n,6),six=d.filter(x=>x.v===6).length;G.blessed=true;
  tray(pl,"Grave Blessing",d,`${six} six${six===1?"":"es"}`);
  log(`Grave Blessing: ${n}d6 (${why}) → ${d.map(x=>x.v).join(", ")}. ${six?six+" card"+(six>1?"s":"")+" may rise.":"Nothing rises."}`);
  render();
  if(six)await pickGrave(pl,six,"Grave Blessing");
}
async function suicideSpell(){
  const s=G.sel,st=selStack();await jokerSuicide(s.r,s.c,st,G.active);
}
/* a Joker kills itself. Works for players and for the Horde (survival) */
async function jokerSuicide(r,c,st,pl){
  const j=st.cards.find(x=>kind(x)==="joker");
  st.cards.splice(st.cards.indexOf(j),1);if(!st.cards.length){G.board[r][c]=null;if(G.sel&&G.sel.r===r&&G.sel.c===c)G.sel=null}
  else if(G.sel)G.sel.pick.delete(j.id);
  const souls=j.captured||[];j.captured=[];
  SND.gun();
  if(isHorde(pl)){ // survival: the player's captured souls go to the Outer Darkness, and the player loses 1 mana
    for(const s of souls)toDark(s);j.owner=pl;
    const victims=[...new Set(souls.map(x=>x.darkOwner).filter(v=>v!=null&&!isHorde(v)))];
    for(const v of victims){const P=G.p[v];if(mana(v)>=1)pay(v,1);else if(P.souls.length)toGrave(P.souls.shift(),"spent")}
    log(`A Horde Joker shoots itself: ${souls.length} captured soul${souls.length===1?"":"s"} fall into the Outer Darkness${victims.length?`; ${victims.map(plName).join(" and ")} lose${victims.length===1?"s":""} 1 mana`:""}.`,"event");
    flash("A Horde Joker shoots itself.");checkWin();return;
  }
  const m=G.moon;
  if(m.blood){
    toDark(j);for(const s of souls)toDark(s);
    log(`Sacrificial Suicide under the Blood Moon: the Joker and its ${souls.length} soul${souls.length===1?"":"s"} fall into the Outer Darkness.`,"event");
  }else{
    let moved=0,lost=0;
    for(const s of souls){if(addSoul(pl,s))moved++;else{toGrave(s,"spent");lost++}}
    if(G.p[pl].tribe==="jester"&&G.moon.gone==="jupiter"){const v=R(2)-1;if(v){giveMana(pl,v);log(`Jupiter adds ${v} mana to the Jester's Sacrificial Suicide.`)}}
    toGrave(j,"death");
    log(`Sacrificial Suicide: the Joker goes to the grave; ${moved} soul${moved===1?"":"s"} join the soul pile${lost?`, ${lost} surplus to the grave`:""}.`);
  }
  render();
  checkWin();
}
async function doubleEdge(){
  const t=await pickFoe("double","Double Edged Sword: whose deck?"),F=G.p[t];
  const d=rollN(3,6);let mine=0,theirs=0;
  for(const x of d){if(x.v===1){const c=me().deck.pop();if(c){toGrave(c,"burn");mine++}}if(x.v===6){const c=F.deck.pop();if(c){toGrave(c,"burn");theirs++}}}
  tray(G.active,"Double Edged Sword",d,`you −${mine} · them −${theirs}`);
  log(`Double Edged Sword: 3d6 → ${d.map(x=>x.v).join(", ")}. ${plName(G.active)} loses ${mine}, the enemy loses ${theirs} from the deck.`);
}
async function threeSwords(){
  const t=await pickFoe("three","Three of Swords: whose hand?");
  const n=R(2);tray(G.active,"Three of Swords",[{s:2,v:n}],`${n} each`);
  const F=G.p[t],P=me();let fl=0,ml=0,dl=0;
  for(let i=0;i<n&&F.hand.length;i++){toGrave(F.hand.splice(Math.floor(Math.random()*F.hand.length),1)[0],"death");fl++}
  for(let i=0;i<n;i++){if(P.hand.length){toGrave(P.hand.splice(Math.floor(Math.random()*P.hand.length),1)[0],"death");ml++}else if(P.deck.length){toGrave(P.deck.pop(),"death");dl++}}
  log(`Three of Swords (${plName(P.i)}): 1d2 → ${n}. ${plName(F.i)} loses ${fl} from the hand; ${plName(P.i)} loses ${ml} from the hand${dl?` and ${dl} from the deck`:""}.`);
}
async function clairvoyance(){
  const d=rollN(2,6),n=Math.min(sum(d),me().deck.length);const look=me().deck.slice(-n);
  tray(G.active,"Clairvoyance",d,`look at ${n}`);
  log(`Clairvoyance: 2d6 → ${d[0].v} + ${d[1].v} = ${sum(d)}; ${n} cards revealed to ${plName(G.active)}.`);render();
  const i=await ask(G.active,{kind:"cards",id:"clair",title:`Clairvoyance: choose one of ${n} cards`,cards:look,box:"plain"});
  const P=me(),c=look[i==null?look.length-1:i];P.deck.splice(P.deck.indexOf(c),1);P.hand.push(c);shuffle(P.deck);
  log(`${plName(G.active)} takes a card into the hand and reshuffles.`);
}
function teleOk(){
  if(!selOwn())return false;const s=G.sel,st=selStack();
  if(!canSpawn(G.active,s.r,s.c)||me().hand.length>=handCap(G.active))return false;
  for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const t=at(s.r+dr,s.c+dc);if(t&&isEnemy(t.owner,G.active))return false}
  return st.cards.filter(c=>s.pick.has(c.id)).length===1;
}
async function teleport(){
  const st=selStack(),c=st.cards.find(x=>G.sel.pick.has(x.id));
  st.cards.splice(st.cards.indexOf(c),1);(me().returning=me().returning||[]).push(c);
  if(!st.cards.length){G.board[G.sel.r][G.sel.c]=null;G.sel=null}else G.sel.pick.delete(c.id);
  log(`Teleport: ${esc(nameOf(c))} leaves the field and will be back in the hand at the start of the next turn.`);checkWin();
}
async function nakedHand(){
  const t=await pickFoe("naked","Naked Hand: whose hand?"),F=G.p[t];F.shownUntil=G.turnNo;F.shownBy=G.active;F.seen=true;
  log(`<b>Naked Hand</b>: ${plName(G.active)} sees ${esc(F.name)}'s hand. ${esc(F.name)}, your cards have been seen.`,"event");
  if(!me().cpu&&F.cpu)flash(`You see the computer's hand until your turn ends.`);
  if(me().cpu&&!F.cpu)flash(`The computer has seen your hand.`);
}
