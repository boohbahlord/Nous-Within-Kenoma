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
