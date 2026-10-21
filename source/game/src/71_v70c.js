/* ---------------- v70c ----------------
   - The Lighthouse: a base for 3 mana, as many as you like (Lighthouse Conjure). In your prep phase it goes up on any empty
     tile beside or diagonal to one of your stacks that isn't a base, anywhere on the field. It holds one stack, which
     attacks and defends from inside it and takes the blows first; the tower itself has three hearts and no defense, a
     Repairman can mend it and a Healer can't. It lights a circle seven tiles across (the rules live in 01_core, 02_combat,
     05_ai and 18_sky; this file adds the card to the game's lists, the Ether and the computer's habits). */

/* a lighthouse on its rock: a banded tower, the gallery, the lamp between the lantern's posts, beams thrown both ways */
UNIT_ICON.lighthouse=`<path fill="@" stroke="none" d="M-5,10.2L-3.1,-2.6H3.1L5,10.2Z"/><path fill="#bg" stroke="none" d="M-3.55,0.4H3.55L3.81,2.2H-3.81Z M-4.23,5H4.23L4.5,6.8H-4.5Z M-1.15,10.2V8.5a1.15,1.15 0 0,1 2.3,0V10.2Z"/><path fill="@" stroke="none" d="M-4.9,-2.4H4.9V-3.7H-4.9Z"/><path stroke-width=".9" d="M-2.3,-3.7V-7.4 M2.3,-3.7V-7.4"/><circle fill="@" stroke="none" cx="0" cy="-5.55" r="1.3"/><path fill="@" stroke="none" d="M-3.4,-7.4C-3,-9.4 -1.6,-10.4 0,-10.6C1.6,-10.4 3,-9.4 3.4,-7.4Z"/><path stroke-width="1.1" d="M0,-10.6V-11.9"/><path stroke-width=".7" d="M-3.7,-6.3L-11.6,-9.1 M-3.7,-4.8L-11.6,-2 M3.7,-6.3L11.6,-9.1 M3.7,-4.8L11.6,-2"/><path stroke-width="1.3" d="M-8.6,10.8C-6.8,9.8 -5.6,10.3 -4.6,10.3H4.6C5.6,10.3 6.8,9.8 8.6,10.8"/>`;
UNIT_MARK.lighthouse="B";UNLIMITED.add("lighthouse");
INFO.lighthouse=["Lighthouse (base)","Lighthouse",[["Hearts","three, and no defense of its own: the stack inside takes the blows first, then the tower"],
  ["Holds","one stack, as it could stand on the field (no other base); that stack attacks and defends from inside it"],
  ["Light","lifts the fog of war in a circle seven tiles across (eleven in King of the Hill); under the Firmament's Fog it sees no farther than any card"],
  ["Goes up","in your prep phase, on any empty tile beside or diagonal to one of your stacks that isn't a base, anywhere on the field"],
  ["Moves","never"],["Healing","a Healer can't heal it; a Repairman can"],["Conjure","3 mana; as many as you like"]],"A lighthouse on its rock, throwing its light both ways."];
ETHER_SHOP.find(g=>g[0]==="Base")[1].push(["clight","Lighthouse"]);ETHER_IDS.add("clight");ETHER_KIND.clight="lighthouse";VENUS_CJ.add("clight");
BROWSE.find(g=>g[0]==="Base")[1].push("lighthouse");CARD_TREE.find(g=>g[0]==="Bases")[1].push("lighthouse");LH_UNITS.splice(LH_UNITS.indexOf("tree")+1,0,"lighthouse");
{const i=FA_TKEYS.indexOf("tree")+1;FA_TK.splice(i,0,["lighthouse","Lighthouses"]);FA_TKEYS.splice(i,0,"lighthouse");TGROUP.lighthouse="base"}   // Field Automation ranks it with the bases, not as a wildcard
SPELLS.push({id:"clight",name:"Lighthouse Conjure",cost:3,school:"Conjuring",text:"A Lighthouse comes into your deck, made from nothing. In your prep phase it goes up beside or diagonal to one of your stacks that isn't a base, anywhere on the field. It lights a circle seven tiles across and holds one stack, which fights from inside it and takes the blows first; three hearts, no defense.",ok:()=>true,run:()=>conjureU("lighthouse")});
SPELL_TEXT.clight={e:"A Lighthouse comes into your deck, made from nothing.",l:"It goes up beside or diagonal to one of your stacks that isn't a base, anywhere on the field, and lights a circle seven tiles across. It holds one stack, which fights from inside it and takes the blows first. Three hearts, no defense."};

/* where it can go up: an empty tile beside or diagonal to one of your stacks that isn't a base (spawn lines don't matter) */
const lhSpot=(pl,r,c)=>!isVoid(r,c)&&!G.board[r][c]&&stacksOf(pl).some(x=>!hasBase(x.st)&&Math.max(Math.abs(x.r-r),Math.abs(x.c-c))===1);
{const _cp=canPlace;canPlace=function(card,r,c){if(card&&card.unit==="lighthouse")return !!G&&G.phase!=="setup"&&lhSpot(G.active,r,c);return _cp.apply(this,arguments)}}
{const _rs=renderSel;renderSel=function(live){_rs.apply(this,arguments);if(!G||!G.selHand||G.selHand.unit!=="lighthouse")return;const p=$("#selbox")&&[...$("#selbox").querySelectorAll("p")].find(x=>/selected\./.test(x.textContent));
  if(p)p.innerHTML=`<b>Lighthouse</b> selected. Click a highlighted tile beside or diagonal to one of your stacks (not a base) to raise it, anywhere on the field.`}}

/* the computer: it keeps one for a foggy field and conjures one now and then, never a string of them */
{const _k=keepSupport;keepSupport=function(pl,c){if(c&&c.unit==="lighthouse")return fogOn();return _k.apply(this,arguments)}}
{const _as=aiSubstance;aiSubstance=async function(pl,W){const P=G.p[pl];   // asked first, while the turn's mana is still there; one Lighthouse at a time
  if(P&&!G.over&&fogOn()&&G.moon.round>=3&&P.cpu&&P.cpu!=="horde"&&!isNPC(pl)&&mana(pl)>=4&&Math.random()<({hard:.15,medium:.1}[P.cpu]||.05)
    &&![...P.hand,...P.deck,...stacksOf(pl).flatMap(x=>x.st.cards)].some(c=>c.unit==="lighthouse")){const sp=SP("clight");if(sp&&spellReady(sp)){await cast(sp);render();await sleep(420)}}
  return _as.apply(this,arguments)}}

if(window.__EC)Object.assign(window.__EC,{lhSpot:(...a)=>lhSpot(...a),canPlaceW:(...a)=>canPlace(...a),damageW:(...a)=>damage(...a),stackLegalW:(...a)=>stackLegal(...a),fogTileW:(...a)=>fogTile(...a),rollStackW:(...a)=>rollStack(...a)});

/* ---------- every player's first Ace (the opening one) comes with a Miner already in a miner slot, mining from round 1 ---------- */
{const _po=placeOpening;placeOpening=function(pl,r,c){const first=!!(G.p[pl]&&G.p[pl].opening&&G.p[pl].opening.length);const out=_po.apply(this,arguments);
  const st=G.board[r][c];if(first&&st&&!isHorde(pl)&&!isNPC(pl)&&!st.cards.some(x=>x.unit==="miner")){const j=G.ether.findIndex(x=>x.unit==="miner");
    const m=j>=0?G.ether.splice(j,1)[0]:mkUnit("miner",pl);m.owner=pl;m.inSlot=0;st.cards.push(m);log(`A Miner takes ${plName(pl)}'s first miner slot.`)}
  return out}}

/* ---------- two Illusions on an enemy, each for their next turn (their next two on a 3 of 1d3); the target is told ----------
   Blind Hand (2 mana): their hand shows blank and shuffled; they can still play it, blind.
   Mana Delusion (1d2 + 1 mana): their own mana bar lies by 1d3 either way (rolled again each of their turns), and what it
   shows is what they can spend: more than they really have goes on credit with the Bank, as debt. */
const illOf=(k,pl)=>G&&(G[k]||[]).find(x=>x.t===pl&&x.left>0)||null;
async function pickHandFoe(id,title){const es=enemiesOf(G.active).filter(pl=>!isHorde(pl)&&!isNPC(pl)&&!G.p[pl].out);const t=es.length<=1?es[0]:await ask(G.active,{kind:"player",id,title,players:es});G.histTarget=t;return t}
const illFoes=()=>enemiesOf(G.active).some(pl=>!isHorde(pl)&&!isNPC(pl)&&!G.p[pl].out);
const delOff=()=>(R(2)===1?-1:1)*R(3);
PRICE.mdel=()=>R(2)+1;
SPELLS.push(
 {id:"blindh",dice:"1d3",name:"Blind Hand",cost:2,school:"Illusion",text:"Choose an enemy: for 1 round their hand shows blank and shuffled (2 rounds on a 3 of 1d3). They can still play it, blind.",
  ok:illFoes,run:async()=>{const t=await pickHandFoe("blindh","Blind Hand: whose hand?");if(t==null)return;const d=R(3),n=d===3?2:1;
   G.blindHand=(G.blindHand||[]).filter(x=>x.t!==t);G.blindHand.push({by:G.active,t,left:n});shuffle(G.p[t].hand);
   tray(G.active,"Blind Hand",[{s:3,v:d}],`${n} round${n>1?"s":""}`);log(`<b>Blind Hand</b>: ${plName(G.active)} blinds ${plName(t)}'s hand for ${n} round${n>1?"s":""}.`,"event");
   notify(t,`Blind Hand: your hand shows blank and shuffled for ${n===2?"your next two turns":"your next turn"}. You can still play it, blind.`)}},
 {id:"mdel",dice:"1d2+1",name:"Mana Delusion",cost:2,school:"Illusion",text:"Choose an enemy: for 1 round their mana bar lies by 1d3 either way (2 rounds on a 3 of 1d3), and they spend by what it shows: more than they have goes on credit, as debt.",
  ok:illFoes,run:async()=>{const t=await pickHandFoe("mdel","Mana Delusion: whose mana?");if(t==null)return;const d=R(3),n=d===3?2:1;
   G.manaDel=(G.manaDel||[]).filter(x=>x.t!==t);G.manaDel.push({by:G.active,t,left:n,off:delOff()});
   tray(G.active,"Mana Delusion",[{s:3,v:d}],`${n} round${n>1?"s":""}`);log(`<b>Mana Delusion</b>: ${plName(G.active)} clouds ${plName(t)}'s mana for ${n} round${n>1?"s":""}.`,"event");
   notify(t,`Mana Delusion: your mana bar may be lying for ${n===2?"your next two turns":"your next turn"}, and you spend by what it shows.`)}});
SPELL_TEXT.blindh={e:"Choose an enemy: their hand shows blank and shuffled for 1 round (2 on a 3 of 1d3).",l:"They can still play their cards, blind. They are told."};
SPELL_TEXT.mdel={e:"Choose an enemy: their mana bar lies by 1d3 either way for 1 round (2 on a 3 of 1d3).",l:"They spend by what it shows: more than they really have goes on credit with the Bank. They are told."};
{const _bt=beginTurn;beginTurn=function(pl){const out=_bt.apply(this,arguments);if(illOf("blindHand",pl))shuffle(G.p[pl].hand);const m=illOf("manaDel",pl);if(m)m.off=delOff();return out}}
{const _et=endTurn;endTurn=function(pl){for(const k of ["blindHand","manaDel"])if(G[k]){for(const x of G[k])if(x.t===pl)x.left--;G[k]=G[k].filter(x=>x.left>0)}return _et.apply(this,arguments)}}
/* the blind hand, as its owner sees it */
{const _r=render;render=function(){_r.apply(this,arguments);if(!G)return;const V=view();if(!illOf("blindHand",V))return;
  document.querySelectorAll("#hand .hc").forEach(h=>{const b=h.querySelector(".cardbtn");if(b){b.innerHTML=`<span class="cf blank"><b>?</b></span>`;b.setAttribute("aria-label","a hidden card")}
    h.querySelectorAll("[data-sh]").forEach(x=>{x.textContent="sac ?";x.title="Sacrifice this hidden card to your soul pile"});h.querySelectorAll("[data-sunh]").forEach(x=>{x.textContent="sun ?"})});
  if(G.selHand){const box=$("#selbox");if(box)box.innerHTML=`<p><b>A hidden card</b> selected (Blind Hand). Click a highlighted tile to place it.</p>`}}}
/* the lying mana bar: only its owner sees the lie, and spends by it */
const manaShown=pl=>{const P=G.p[pl],x=illOf("manaDel",pl),real=mana(pl)-(P.debt||0);return x?Math.max(-8,real+x.off):real};
{const _b=bars;bars=function(P){const h=_b.apply(this,arguments);if(!illOf("manaDel",P.i)||view()!==P.i)return h;const m=manaShown(P.i),cap=soulCap(P.i);
  const meter=`<div class="meter mana deluded" title="Mana Delusion: this bar may be lying"><span class="bk">Mana</span><div class="manabar" role="img" aria-label="Mana ${m} of ${cap}">${Array.from({length:cap},(_,i)=>`<i class="${i<m?"f":""}"></i>`).join("")}</div><b class="mv${m<0?" neg":""}">${m<0?"−"+(-m):m}/${cap}</b></div>`;
  return h.replace(/<div class="meter mana">[\s\S]*$/,meter+"</div>")}}
{const _ca=canAfford;canAfford=function(pl,n){if(!illOf("manaDel",pl)||pl!==G.active)return _ca.apply(this,arguments);
  return manaShown(pl)>=n&&(mana(pl)>=n||!!(G.bank&&!G.bank.dead))}}   // what the bar shows decides; without a Bank there is no credit to fall into
if(window.__EC)Object.assign(window.__EC,{illOf:(...a)=>illOf(...a),manaShown:pl=>manaShown(pl),canAffordW2:(...a)=>canAfford(...a),beginTurnW:(...a)=>beginTurn(...a),endTurnW:(...a)=>endTurn(...a)});
