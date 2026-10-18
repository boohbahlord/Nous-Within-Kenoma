/* ---------------- UI pass 2 (v21): English ----------------
   Every spell's text in three short parts: what you need (n), what it does (e), and its limits (l).
   The hover box shows them like card info: price, when, needs, effect, limits. s.text keeps the joined text for the
   Spells explained panel. Planets get their Forms; Substances get a one-line tag and a few points. */

const SPELL_TEXT={
 // Necromancy
 ritual:{e:"Adds 2d6 to this turn's Grave Blessing.",l:"Cast it before the Grave Blessing. Once a turn."},
 bless:{e:"Roll 1d6, plus 1d6 for each of your Aces on the field and 2d6 from Ritual Dice. For every 6, raise a card of your choice from the grave into your hand.",l:"Once a turn, before any other mana is spent. Six dice at most. Every card you overdrew into the grave takes one die away."},
 suicide:{n:"Select your stack with a Joker.",e:"The Joker shoots itself. The souls it captured go to your soul pile, up to 6 mana; the rest go to the grave.",l:"Only before you spend mana this turn. Under a Blood Moon the Joker and its souls fall into the Outer Darkness instead."},
 sever:{e:"For this turn, an enemy killed beside your Joker is sent to the Ether instead of being captured. You pay half its conjuring price.",l:"Cast again to disarm it."},
 resur:{e:"Choose a card in the grave and take it into your hand.",l:"Needs room in your hand."},
 libation:{n:"Select one of your stacks, check the cards to pour out, and press Pour.",e:"Each card rolls 1d2. On a 2 you gain its soul's mana; on a 1 it goes to the grave for nothing.",l:"Not under the Full Moon. Once a turn."},
 slaves:{n:"A thrall, and an empty tile on your own ground.",e:"A thrall your Slavemasters captured stands up as a Slave: a rifle of 10 + 1d12 that fires two tiles in a straight line or one diagonal, one straight step a turn, no defense.",l:"A Slave stands alone. A miss from two tiles away costs it nothing. Ten thralls can wait at most."},
 exile:{n:"Select your stack with a Joker that holds souls.",e:"Every soul the Joker captured falls into the Outer Darkness."},
 hunger:{e:"Eat 1d2 cards from the grave, your own deck, the selected stack, or an enemy's deck. Take them as mana, or feed the hunger with them.",l:"Twice a turn. Against an enemy's deck you each roll 1d4; if you lose, you pay them 2 mana. Seven eaten bring Saturn."},
 // Enchantment
 divine:{n:"Select your stack.",e:"Advantage on all of its dice in its next combat."},
 hypo:{n:"Select your stack. You need at least two stacks on the field.",e:"The stack can't be attacked for two turns.",l:"Meanwhile it can't attack or step toward the enemy, only sideways or back."},
 pdhm:{e:"None of your stacks can be attacked until your next turn begins. Your cards turn pink and everyone is told.",l:"Once a game."},
 blindfold:{n:"You are under a Delusion.",e:"When the Delusion ends you keep it three more turns: its blindness, its nine mana and its free dice.",l:"Nothing Lucifer paid to stifle it carries over."},
 // Curse
 forced:{e:"Your enemy draws 1d2 cards. Cards past their hand limit go to the grave and weaken their next Grave Blessing."},
 hexed:{n:"Select an enemy stack.",e:"Disadvantage on all of its dice in its next combat."},
 double:{e:"Roll 3d6. Each 1 burns a card from your deck; each 6 burns a card from your enemy's deck."},
 three:{e:"Roll 1d2. On a 1, one random card is destroyed in your enemy's hand and one in yours. On a 2, two of each.",l:"If your hand runs short, the rest comes from your deck. Your enemy never loses deck cards to it."},
 hate:{n:"Select an enemy stack.",e:"Its strongest card turns red. While that card lives, its stack has disadvantage on every attack and defense, and everyone attacking it has advantage."},
 lucifer:{e:"An enemy falls under the Delusion for 2d2 turns: blind past their own cards' reach, nine mana at most, and 3d2 free mana a turn.",l:"Free in a round you cast the Delusion of Ouroboros on yourself. While it lasts you can stifle it: every 2 mana or 2 deck cards you pay takes one maximum mana or one free die from them."},
 deconj:{e:"Choose one. The full curse: no one can conjure at the next Full Moon, and the grave gives nothing at the next New Moon. The short curse: no one, you included, can conjure next round.",l:"The full curse costs 2 + 1d2 (rolled each round); the short curse costs 2."},
 joy:{e:"Choose one, until your next turn. Pleasure and Joy: your cards glow, and those that die go back into your deck instead of the grave. Joyful Theft: each damage an enemy deals to your units moves 1 mana from them to you.",l:"Pleasure and Joy costs 1 + 1d2; Joyful Theft costs 1d3 − 1."},
 // Sorcery
 clair:{e:"Look at 2d6 cards of your deck and take one into your hand. Then the deck is shuffled.",l:"Needs room in your hand. 6 mana at the New Moon, 2 at the Full Moon."},
 tele:{n:"Select your stack in your own two lines, with no enemy beside it, and leave exactly one card checked.",e:"That card leaves the field and comes back into your hand at the start of your next turn.",l:"Needs room in your hand."},
 naked:{e:"You see your enemy's hand for the rest of this turn. Both of you are told it was seen.",l:"6 mana at the New Moon, free at the Full Moon."},
 bird:{e:"The fog of war lifts for you and your teammates for the rest of this round.",l:"Only with fog of war on. It does nothing against a Delusion."},
 gamble:{e:"Roll 1d10. On a 10 the Bank pays you 7d2 mana. On a 1 you lose one maximum mana, take 7d2 of mana debt, and a deck card goes to the Ether. Anything else: the mana is gone.",l:"Only while the Bank is open."},
 bolt:{n:"Three bolts, and an enemy stack selected.",e:"Lightning pins the stack for 1d2 + 1d2 − 1 of its turns: it can't move or attack.",l:"You earn a bolt for every card you lose defending, and for every card Antony kills. Against the Leviathan it takes one heart, no roll; with nothing selected it strikes a Leviathan on the moon."},
 lev:{n:"Your Leviathan on the field, at the New Moon.",e:"The Leviathan leaves the field and lies on the moon. From the next New Moon, every enemy pays a toll each New Moon: 2d4 random deck cards, 2 random hand cards and 1 mana, into the Outer Darkness.",l:"On the moon your maximum mana rises by one for every card in the Outer Darkness, twelve at most. It can be attacked only at the New Moon, and defends with advantage."},
 judge:{e:"Yaldabaoth eats what hangs in the sky. Take its worth in mana, or count it toward the hunger (3, or 4 for Jupiter).",l:"The moon only at the New Moon or the Full Moon; a Heavenly Body at any time. What is eaten never comes back. A Leviathan on it falls back into its deck."},
 saturn:{n:"Hunger of seven, with the moon out of the sky.",e:"Saturn takes the moon's place. At the start of each of their turns, every enemy pays you 1 (a hand card, the top deck card or 1 mana) or refuses, and a Debt Collector rises on your ground.",l:"Each Debt Collector still standing at a new round raises the price by 1. Binah never pays."},
 lifesell:{n:"Select your stack with a Trafficker that holds prisoners.",e:"Put one prisoner up at the Auction. Any player can offer mana or hand cards for it, and you approve the sale."},
 cry:{n:"The Second Sun in the sky.",e:"Yaldabaoth makes the Sun weep. On the third time its flames go out and it becomes the Black Sun.",l:"Once every 1d3 turns. After that, the Firmament that raised it pays you 1d2 mana or 1d2 deck cards every 1d2 of its turns."},
 bloodcall:{e:"The next Full Moon becomes a Blood Moon.",l:"Its harms don't touch you: your dead still go to the grave."},
 rain:{e:"Until your next turn, every sacrifice gives one more mana, and every sacrifice by another player also gives you one."},
 asteroid:{n:"Select a stack.",e:"One damage there. Every tile around it takes one damage on a 4 of 1d4 (Walls take 1d2 + 1). The area burns for two rounds.",l:"The Firmament is immune."},
 // Illusion
 quiet:{e:"For 1d2 + 1 rounds, enemies without a Scout on the field see only what stands right beside their own units.",l:"2 mana now and 2 at the start of each round it lasts. It ends when you can't pay. Scouts see through it."},
 ouro:{e:"For 2d2 of your turns you and your teammates can't see enemy cards past your own cards' reach. Meanwhile your mana can rise to nine, and you get 3d2 free mana at the start of each turn.",l:"Cast on yourself. It makes the Delusion of Lucifer free this round."},
 ffog:{e:"For 1d2 of your turns your enemies see only what is right beside their cards, and their Scouts see one tile less. At the New Moon they are blind, and your own cards see one tile.",l:"Not under the Full Moon. Once every three turns."},
 // Conjuring
 cs:{e:"A random soldier's soul (2 to 10) comes from the Ether into your deck."},
 cj:{e:"A Jack's soul comes from the Ether into your deck."},
 cq:{e:"A Queen's soul comes from the Ether into your deck."},
 ck:{e:"A King's soul comes from the Ether into your deck."},
 cjk:{e:"A Joker's soul comes from the Ether into your deck."},
 ca:{e:"An Ace's soul comes from the Ether into your deck."},
 csc:{e:"A Scout's soul comes from the Ether into your deck.",l:"Scouts see two tiles out through the fog in a diamond and uncover Assassins, ambushers and face-down cards there, move like Assassins, and never fight."},
 cas:{e:"An Assassin's soul comes from the Ether into your deck.",l:"Two hearts, 10 + 1d12 to attack, 8 to defend. Hidden until an enemy stands right beside it. Can ambush. Only another Assassin stacks with it."},
 carch:{e:"An Archer's soul comes from the Ether into your deck.",l:"Shoots 1d20 + 1d10 at a stack exactly two tiles away, or suppresses it (disadvantage on its next attack). A miss costs nothing. No defense. 1 mana for the Beginner."},
 ccan:{e:"A Cannon's soul comes from the Ether into your deck.",l:"Fires 2d20 at anything up to three tiles away, once every 1d2 + 2 turns, two damage to a Wall. A miss costs nothing. No defense. Moves one step."},
 cheal:{e:"A Healer's soul comes from the Ether into your deck.",l:"Its shield turns one blow from its stack and returns in 1d4 rounds; or it heals one heart in or beside its stack. Never stacks with a Queen."},
 cwall:{e:"A Wall's soul comes from the Ether into your deck.",l:"Five hearts, defense 10. Holds six cards like an Ace, but only ranged cards fire from it, one shot a turn. Never moves."},
 crep:{e:"A Repairman's soul comes from the Ether into your deck.",l:"Repairs a Wall, an Ace or the Tree in or beside his stack, then rests 1d3 + 1 turns. He can also give his life to upgrade an Ace once."},
 cram:{e:"A Battering Ram's soul comes from the Ether into your deck.",l:"Worked by one or two Grunts, Infantry or Puppets, it does two damage to a Wall beside it, with no roll. It does nothing else."},
 cmine:{e:"A Miner's soul comes from the Ether into your deck.",l:"In an Ace's miner slot it brings 1d2 − 1 mana a turn, from the next round on. On a crystal it digs 1 + 1d3. Anywhere else it finds 1 mana on a 6."},
 maxmana:{e:"Your maximum mana rises by one for the rest of the game.",l:"Eighteen at most."},
 bull:{e:"A BullGoat comes into your hand: two hearts, 10 + 1d20 up close, or a charge of 10 + 2d20 down a straight, empty line at an enemy two or three tiles away.",l:"It stands alone. When it dies it returns as the Goatbull."},
 deckcards:{n:"Your Tree of Neither Life Or Death on the field.",e:"Your deck is full again, as it was at the start of the game. The cards still in it go to the grave; your hand stays.",l:"Once a game."},
 // Astrology
 mars:{e:"Mars takes the moon's place. At the start of each turn, every stack of only Grunts and Infantry gets advantage on its next attack on 1–5 of 1d8.",l:"The moon's phases stop and your Miner on the moon is lost; a Leviathan on the moon moves onto Mars. Not while Saturn is up, and never once Mars has been eaten."},
 sun:{n:"Select your stack with a Joker.",e:"The Joker shoots itself (its souls go to your soul pile) and the Second Sun takes the moon's place. While it burns there is no fog of war. Every 2d2 turns it judges each other player: 1 mana to you, one damage to one of their stacks, or two deck cards; or they are blind for that turn.",l:"Delusions still blind. Other players can swear the Oath of the Earth. The Leviathan can't lie on it."},
 sunfall:{n:"The Second Sun or the Black Sun in the sky, and a stack selected.",e:"The Sun crashes onto the stack: two damage there, one on a 2 of 1d2 on every tile around it, and one on a 10 of 1d10 on the ring beyond, your own units included.",l:"A Black Sun destroys that tile and everything on it for good, and on a 6 of 1d6 every tile around it. The sky is empty afterwards."},
 venus:{e:"Venus takes the moon's place. Choose: you or a teammate get +2 mana a turn and +2 maximum, or you get +1 mana a turn while every enemy gets +2 maximum.",l:"The second choice isn't offered in Survival. Anyone can swear the Oath of Venus."},
 jupiter:{e:"Jupiter takes the moon's place. Miners in an Ace bring 1d2 a turn, two conjurings go on sale each round, hand cards can be traded at the Auction, and a Jester's Sacrificial Suicide brings 1d2 − 1 more.",l:"You may get a mana back when others buy on sale or trade. Anyone can swear the Oath of Jupiter."},
 mercury:{e:"Mercury takes the moon's place. Anyone can call a vote for Peace or Total War, or buy Peace.",l:"Those who swear the Oath of Mercury can betray their team, declare war alone and bribe the Banker."},
 oath_earth:{e:"No necromancy for you. Every Sorcery spell with a dice price rolls its price twice for you and keeps the lower.",l:"Cast again to break the Oath."},
 oath_venus:{n:"Venus in the sky.",e:"Each turn you start without having attacked a player: +2 mana and +2 maximum for that turn. Each attack on a player costs 1d2 mana and two maximum for 1d3 turns.",l:"Cast again to break the Oath."},
 oath_jupiter:{n:"Jupiter in the sky.",e:"Every conjuring costs you one less, unless it already costs one.",l:"Cast again to break the Oath."},
 oath_mercury:{n:"Mercury in the sky.",e:"Unlocks Betrayal, Declare War and Bribe the Banker.",l:"Cast again to break the Oath."},
 peace:{n:"Mercury in the sky. Every player must agree.",e:"Peace for 3 + 1d2 − 1 rounds. Every stack goes home, every card with hearts heals, curses and enchantments end, and everyone takes three cards from the grave, one at a time.",l:"No player can attack another or step into another player's lines. Stacks with no room at home go back into the deck, weakest first."},
 buypeace:{n:"Mercury in the sky.",e:"Peace for two rounds without a vote, with everything Peace brings."},
 war:{n:"Mercury in the sky. Every player must agree.",e:"Total War for 3 + 1d2 − 1 rounds. Every card killed falls into the Outer Darkness and pays its killer a mana, and curses cost 1d2 − 1 less.",l:"Teammates may strike each other: each damage to a teammate pays its soul's worth + 1d2 − 1."},
 betray:{n:"The Oath of Mercury, in a team game.",e:"You leave your team for good. For two rounds every card killed falls into the Outer Darkness, and each damage between you and your former teammates pays its dealer the soul's worth + 1d2 − 1."},
 warnow:{n:"The Oath of Mercury.",e:"Total War for 1d2 rounds, without a vote."},
 bribe:{n:"The Oath of Mercury, and a player to pick.",e:"Every spell costs that player one more for 3d2 − 1 rounds.",l:"The bribe costs its price now and again at the start of each round. It ends when you can't pay."}
};
SP("oath_earth").name="Oath of the Earth";
for(const s of SPELLS){const t=SPELL_TEXT[s.id];if(t)s.text=[t.n,t.e,t.l].filter(Boolean).join(" ")}

/* the price as words: fixed, rolled each round (with this round's roll), or free */
function priceWords(s){
  if(s.id==="hypo")return "3, plus 1 for each card past the first";
  const now=G&&G.prices&&G.prices[s.id]!=null?G.prices[s.id]:null;
  if(s.id==="clair"||s.id==="naked"){if(G&&newPrices())return "6 mana (New Moon)";if(G&&fullPrices())return s.id==="clair"?"2 mana (Full Moon)":"free (Full Moon)"}
  if(s.fire)return `${s.dice} mana, rolled each round${now!=null?` · ${now} fire now`:""}`;
  if(s.dice)return `${s.dice}, rolled each round${now!=null?` · ${now?now+" mana":"free"} now`:""}`;
  const c=G?spellCost(s):s.cost;return c?c+" mana":"free";
}
const ATK_SCHOOLS=["Enchantment","Curse","Sorcery","Illusion"];
function spellWhen(s){
  const once=s.once?" Once a game.":"";
  if(s.id==="bless")return "Your prep phase, once a turn."+once;
  if(G&&G.opts.atkSpells&&ATK_SCHOOLS.includes(s.atkSchool||s.school))return "Your prep or attack phase."+once;
  return "Your prep phase."+once;
}
function spellTipHTML(s){
  const t=SPELL_TEXT[s.id]||{e:s.text},blk=G?spellBlock(s):"";
  const row=(k,v,cls)=>v?`<dt class="${cls||""}">${k}</dt><dd>${esc(v)}</dd>`:"";
  return `<div class="cin spelltip"><div class="cih"><b>${esc(s.name)}</b> · ${esc(s.school)}${s.tribe&&TRIBES[s.tribe]?` · ${esc(TRIBES[s.tribe].name)}`:""}</div>
<dl class="stdl">${row("Price",priceWords(s),"k-price")}${row("When",spellWhen(s),"k-when")}${row("Needs",t.n,"k-need")}${row("Effect",t.e,"k-eff")}${row("Limits",t.l,"k-lim")}</dl>${blk?`<p class="sblock">${esc(blk)}</p>`:""}</div>`;
}

/* ---------- the sky: names, Forms and a compact info box ---------- */
const SKY_FORM={moon:"Form of Fate",saturn:"Form of Limitation",mars:"Form of Strife",sun:"Form of Judgement",blacksun:"Form of Judgement",venus:"Form of Harmony",mercury:"Form of Guile",jupiter:"Form of Abundance"};
for(const k in PLANETS)PLANETS[k].word=(SKY_FORM[k]||"").replace("Form of ","");
for(const k in SKY_NAME)SKY_NAME[k]=(SKY_FORM[k]||"").replace("Form of ","");
/* both sky boxes share one shape: the name, its state, short lines, and the Form at the bottom */
function skyBox(title,state,lines,k){
  return `<div class="cin sky"><div class="cih"><b>${title}</b>${state?`<span class="skystate">${state}</span>`:""}</div><ul class="skyl">${lines.filter(Boolean).map(l=>`<li>${l}</li>`).join("")}</ul>${SKY_FORM[k]?`<div class="skyform">${SKY_FORM[k]}</div>`:""}</div>`}
const plN=i=>esc(G.p[i].name);
function skyCommon(L){
  if(G.deconjure)L.push("Deconjured: no conjuring at the next Full Moon.");
  if(G.noGraveNext)L.push("Deconjured: no grave gift at the next New Moon.");
  if(G.noConjureRound===G.moon.round)L.push("Deconjured: no one can conjure this round.");
  if(G.moonMiner)L.push(`${plN(G.moonMiner.owner)}'s Miner works the moon: 1d2 − 1 mana a turn.`);
  if(G.bloodCalled)L.push("The Firmament has called a Blood Moon: the next Full Moon turns red.");
  if(G.eclipse&&G.eclipse.k===sky())L.push(`<b>Eclipsed</b> this round${sky()==="jupiter"?" and the next":""}.`);
}
moonInfoHTML=function(){
  const m=G.moon,V=view(),P=G.p[V],L=[];
  if(["sun","blacksun","venus","jupiter","mercury","fallen"].includes(m.gone))return planetInfoHTML(m.gone);
  if(m.gone==="off"){L.push("No starting Heavenly Body in this game: no phases, no gifts, no tolls.");return skyBox("No starting Heavenly Body","",L,"")}
  if(m.gone==="eaten"){L.push("Yaldabaoth ate the moon. No phases, no gifts, no tolls, no Blood Moon.");skyCommon(L);return skyBox("The empty sky","",L,"")}
  if(m.gone==="mars"){L.push("Each turn, every stack of only Grunts, Infantry or Puppets gets advantage on its next attack on 1–5 of 1d8.","The moon's phases are stopped.");
    if(G.moonLev)L.push("The Leviathan coils on Mars. Its toll and its weak spot come every eighth round.");skyCommon(L);return skyBox("Mars","",L,"mars")}
  if(m.gone==="saturn"){const S=G.saturnBy,price=1+(G.saturnDebt||0);
    L.push(S==null?"Saturn has hung in the sky since the start. Its favors go to the Bank.":`Regurgitated by ${plN(S)}.`);
    if(S===V)L.push(`Every enemy pays you ${price} at the start of each of their turns.`);
    else if(P.tribe==="binah")L.push("You are Binah: you owe Saturn nothing.");
    else if(P.tribe==="firm")L.push("You are the Firmament: Saturn's tax doesn't touch you.");
    else if(S==null||isEnemy(V,S))L.push(`At the start of each of your turns, pay ${price} (a hand card, the top deck card or 1 mana) or a Debt Collector rises.`);
    if(G.saturnDebt)L.push(`Debt Collectors still standing have raised the price by ${G.saturnDebt}.`);
    if(paysSaturn(V))L.push(P.oath==="saturn"?(P.satLocked?"You betrayed Saturn: its Puppets come for you, and its Oath holds you.":`Your Oath of Saturn: ${P.satPaid||0} tolls paid. Puppets come after the 1st, 3rd, 6th and 9th.`):"You can swear the Oath of Saturn (Astrology): pay its toll and its Puppets fight for you.");
    skyCommon(L);return skyBox("Saturn","",L,"saturn")}
  const bonus=G.opts.moonBonus!==false;
  if(m.blood)L.push("New Moon gifts at Full Moon prices.","Every card killed falls into the Outer Darkness, and so do a Joker's souls when it shoots itself.");
  else if(m.i===0)L.push("Everyone raises 1d2 cards from the grave.","Clairvoyance and Naked Hand cost 6.",bonus?"Every defense adds 1d2.":"");
  else if(m.i===4)L.push("The toll is paid and decks are shuffled.","No drawing and no necromancy.","Clairvoyance costs 2; Naked Hand is free.",bonus?"Every attack adds 1d2.":"");
  else L.push(`No effect this phase. Next: ${MOON[(m.i+1)%8]}.`);
  L.push("Turns one phase a round, after every player has had a turn.");
  if(P.oath!=="moon")L.push("You can swear the Oath of the Moon (Astrology).");
  if(G.moonLev){const h=G.moonLev.card.hp;L.push(`The Leviathan lies on the moon (${h} heart${h===1?"":"s"}). ${G.moonLev.owner===V?"Your maximum mana rises with the Outer Darkness.":P.tribe==="tiph"?"You are immune to its toll.":"Its toll each New Moon: 2d4 deck cards, 2 hand cards and 1 mana."} It can be attacked only at the New Moon.`)}
  skyCommon(L);
  return skyBox("The Moon",MOON[m.i]+(m.blood?" · Blood Moon":""),L,"moon");
};
planetInfoHTML=function(k){
  const V=view(),P=G.p[V],L=[],by=planetBy(),oath=(id,txt)=>P.oath===id?`Your Oath: ${txt}`:`You can swear the ${SP("oath_"+id).name} (Astrology).`;
  if(k==="sun"){L.push(by!=null?`Raised by ${plN(by)}.`:"","No fog of war while it burns. Delusions still blind.","The Leviathan can't lie on it.");
    L.push(P.tribe==="firm"?"It doesn't judge you.":`Every 2d2 of your turns it judges you: 1 mana${by!=null?" to "+plN(by):" to the Bank"}, one damage to one of your stacks, or two deck cards. Refuse and you are blind for that turn.`);
    L.push(`It has cried ${G.sunTears||0} of 3 times. At three it becomes the Black Sun.`);
    if(P.tribe!=="firm")L.push(oath("sun","fire mana from sacrifices to the Sun and from its judgements; Scorched Earth and Blindness."));
    skyCommon(L);return skyBox("The Second Sun","",L,"sun")}
  if(k==="blacksun"){L.push("The Second Sun cried three times and its flames went out. The fog of war is back.");
    if(G.blackBy!=null)L.push(`The Firmament that raised it pays ${plN(G.blackBy)} 1d2 mana or 1d2 deck cards every 1d2 of its turns.`);
    L.push("If it falls, it destroys the tile it lands on for good.");skyCommon(L);return skyBox("The Black Sun","",L,"blacksun")}
  if(k==="venus"){if(G.venus)L.push(`${plN(G.venus.target)} gets ${G.venus.mode==="a"?"+2 mana a turn and +2 maximum":"+1 mana a turn, and every enemy +2 maximum"}.`);
    L.push(oath("venus","+2 mana and +2 maximum each turn you start without having attacked a player; each attack on a player costs 1d2 mana and two maximum for 1d3 turns."));
    if(G.moonLev)L.push("The Leviathan coils on Venus. Its toll and its weak spot come every eighth round.");
    skyCommon(L);return skyBox("Venus","",L,"venus")}
  if(k==="jupiter"){L.push("Miners in an Ace bring 1d2 a turn.",`Two conjurings are on sale each round${G.jupSale?`: ${G.jupSale.ids.map(id=>esc(SP(id).name)).join(" and ")}`:""}.`,"Hand cards can be traded at the Auction.","A Jester's Sacrificial Suicide brings 1d2 − 1 more mana.");
    L.push(oath("jupiter","every conjuring costs one less, unless it already costs one."));
    if(G.moonLev)L.push("The Leviathan coils on Jupiter. Its toll and its weak spot come every eighth round.");
    skyCommon(L);return skyBox("Jupiter","",L,"jupiter")}
  if(k==="mercury"){
    if(peaceOn())L.push(`<b>Peace</b> until round ${G.peace.until}: no player may attack another or step into another player's lines.`);
    if(warOn())L.push(`<b>Total War</b> until round ${G.war.until}: kills fall into the Outer Darkness and pay a mana; teammates may fight.`);
    L.push("Anyone can call a vote for Peace or Total War (everyone must agree), or buy Peace for two rounds.");
    L.push(P.oath==="mercury"?"You have sworn the Oath of Mercury: Betrayal, Declare War and Bribe the Banker are open to you.":"The Oath of Mercury (Astrology) opens Betrayal, Declare War and Bribe the Banker.");
    skyCommon(L);return skyBox("Mercury","",L,"mercury")}
  L.push("The Second Sun fell to the ground. Nothing hangs in the sky: no phases, no gifts, no tolls.");
  return skyBox("The empty sky","",L,"");
};

/* the short line beside the sky at the top of the table */
moonNote=function(){
  const m=G.moon,L=G.moonLev;
  if(m.gone==="sun")return "No fog of war · it judges every 2d2 turns";
  if(m.gone==="blacksun")return "Its flames are out · the fog of war is back";
  if(m.gone==="venus")return G.venus?`${plN(G.venus.target)}: ${G.venus.mode==="a"?"+2 mana a turn and +2 maximum":"+1 mana a turn · every enemy +2 maximum"}`:"Oath of Venus open";
  if(m.gone==="mercury")return peaceOn()?`Peace until round ${G.peace.until}`:warOn()?`Total War until round ${G.war.until}`:"Votes for Peace or Total War";
  if(m.gone==="jupiter")return "Ace miners bring 1d2 · two conjurings on sale";
  if(m.gone==="fallen")return "The Second Sun fell · the sky is empty";
  if(m.gone==="mars")return `Grunts and Infantry: advantage on 1–5 of 1d8${L?" · the Leviathan coils here":""}`;
  if(m.gone==="saturn")return `${G.saturnBy==null?"Every player":"Every enemy of "+saturnOwner()} pays ${1+(G.saturnDebt||0)} a turn · Binah is exempt`;
  if(m.gone==="eaten")return "Eaten by Yaldabaoth · no more phases";
  if(m.gone==="off")return "Off for this game";
  if(L)return `The Leviathan lies here (${L.card.hp} heart${L.card.hp===1?"":"s"}) · a toll every New Moon`;
  return "";
};

/* the sky options before a game: name, one short line, and the Form */
const SKY_OPTS=[
 ["on","The Moon (default)","Turns one phase a round: grave gifts at the New Moon, a toll at the Full Moon."],
 ["off","No Starting Heavenly Body","No moon and no Heavenly Body: no phases, no gifts, no tolls, no Blood Moon. Yaldabaoth can still bring Saturn."],
 ["saturn","Saturn","Everyone but Binah and the Firmament pays 1 a turn to the Bank, or a Debt Collector comes. No Yaldabaoth."],
 ["mars","Mars","Each turn, stacks of only Grunts and Infantry may get advantage on their next attack. No Firmament."],
 ["sun","The Second Sun","No fog of war; every 2d2 turns each player pays the Bank or goes blind for a turn. No Firmament."],
 ["venus","Venus","The Oath of Venus rewards turns without attacking a player. No Firmament."],
 ["mercury","Mercury","Votes for Peace or Total War, and the Oath of Mercury. No Firmament."],
 ["jupiter","Jupiter","Ace miners bring 1d2, conjurings go on sale, cards trade at the Auction. No Firmament."]];
/* Substances: one tag line for the setup, and a few points for the info panels */
for(const k in SUBST_TEXT)if(TRIBES[k]){TRIBES[k].sub=SUBST_TEXT[k].tag;TRIBES[k].pts=SUBST_TEXT[k].pts}

/* "Heavenly Bodies explained" and "The Bank explained", under the table */
const SKY_ROWS=[
 ["moon","The Moon","The default sky.","Turns one phase a round. The New Moon gives 1d2 grave cards and makes Clairvoyance and Naked Hand cost 6. The Full Moon takes its toll, shuffles every deck and forbids drawing and necromancy. One Full Moon in twenty is a Blood Moon."],
 ["saturn","Saturn","Yaldabaoth, at seven hunger; or the sky from the start.","Every enemy pays 1 each turn (a hand card, the top deck card or 1 mana), or a Debt Collector rises. Binah never pays."],
 ["mars","Mars","The Firmament; or the sky from the start.","Each turn, stacks of only Grunts, Infantry or Puppets get advantage on their next attack on 1–5 of 1d8."],
 ["sun","The Second Sun","The Firmament, with a Joker that shoots itself; or the sky from the start.","No fog of war. Every 2d2 turns it judges each other player: 1 mana, a wound or two deck cards, or a blind turn. Three cries from Yaldabaoth make it the Black Sun."],
 ["venus","Venus","The Firmament; or the sky from the start.","+2 mana a turn and +2 maximum for the caster or a teammate, or +1 a turn while every enemy gets +2 maximum."],
 ["mercury","Mercury","The Firmament; or the sky from the start.","Votes for Peace or Total War, bought Peace, and under its Oath Betrayal, Declare War and Bribe the Banker."],
 ["jupiter","Jupiter","The Firmament; or the sky from the start.","Ace miners bring 1d2, two conjurings on sale each round, trades at the Auction."]];
function skyExplainHTML(){return `<details class="sub"><summary>Heavenly Bodies explained</summary><div class="skygrid">${SKY_ROWS.map(([k,n,how,what])=>`<div class="skycard"><b>${n}</b><p>${what}</p><small>${how}</small><em class="skyform">${SKY_FORM[k]}</em></div>`).join("")}</div><p class="dim">Every Heavenly Body but the Moon can be eclipsed: 5% at the start of each round. Hover or tap the sky in a game for what it means for you.</p></details>`}
const BANK_HELP=[
 ["Where mana goes","Every mana spent on a spell goes to the Bank. The Bank can only lend what it holds."],
 ["Loans","Mana now, from what the Bank holds. A loan grows 20% every 1d2 of your turns and is due in 4 of your turns; repay it with Repay. Whatever isn't paid then becomes mana debt."],
 ["Mana debt","Debt shows as mana below zero. Every soul you gain pays the debt first. Below zero the Bank lends six at most; at minus your maximum, five at most and at 30%."],
 ["Spend on credit","Not a loan: nothing is lent up front. Tick it to cast spells you can't afford; what your souls don't cover becomes mana debt at once, down to your lowest point."],
 ["Your lowest point","You lose the game if your mana falls below three times your maximum under zero (−18 with a maximum of 6)."],
 ["Selling","Sell cards from your hand or deck for their soul worth, or 1 less (rolled at the sale); a standard card worth only 1 can't be sold. They go to the Ether and your deck is reshuffled. Binah can sell thralls for 1 mana."],
 ["Upselling","A spell bought more than twice in each of two rounds in a row costs 1d2 − 1 more."],
 ["When the Bank is in the red","The Ether goes on sale (1 less), and the Bank borrows from the richest player."],
 ["Debt Collectors","Anyone more than their maximum below zero is hunted by the Bank's Debt Collectors."],
 ["The angry Banker","If Barbarians hold the middle of the field for 7d2 turns, every price goes up by 1 until they are gone."],
 ["Collapse","If the Bank is 12 in the red and every player 6 below zero, it collapses: mana and debts go to zero, every maximum falls to three, and prices wobble up for a while."]];
function bankExplainHTML(){return `<details class="sub"><summary>The Bank, Barbarians and meteors explained</summary><dl class="spellinfo">${BANK_HELP.map(([a,b])=>`<dt>${a}</dt><dd>${b}</dd>`).join("")}
<dt>Barbarians</dt><dd>A crimson band takes the middle every 4 + 1d12 turns and with every Blood Moon, and fights anyone beside it. The player who kills the most of a band gets an Ether sale; breaking a big band can earn debt forgiveness.</dd>
<dt>Meteor</dt><dd>One round in a hundred: damage where it lands and maybe around it, then fire for two rounds.</dd>
<dt>Gambling, Increase Max Mana, Mystery Generation</dt><dd>Gambling (Sorcery, 1 mana): a 10 on 1d10 wins 7d2; a 1 costs a maximum mana, 7d2 of debt and a deck card. Increase Max Mana (Conjuring, 4): +1, eighteen at most. Mystery Generation (in the Auction, 3 to 8 mana): three brand-new cards of any rarity, wildcards included.</dd></dl></details>`}
