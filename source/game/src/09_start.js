/* ---------------- card and spell info ---------------- */
const INFO={
 grunt:["Grunt","2 to 6",[["Score","its number + 1d6 on attack; its number alone on defense (+1d6 with a Queen)"],["Dice Max / MSV","6 / 24: four Grunts stack together"],["Soul","1 mana"],["Conjure","Soldier Conjure, 1 mana"],["Moves","one tile straight per turn"]],"The foot soldiers. Every card in a stack is one more hit it can take, and damage always removes the lowest card first."],
 infantry:["Infantry","7 to 10",[["Score","its number + 1d8 on attack; its number alone on defense (+1d8 with a Queen)"],["Dice Max / MSV","8 / 24: three Infantry stack together"],["Soul","1 mana"],["Conjure","Soldier Conjure, 1 mana"],["Moves","one tile straight per turn"]],"Heavier soldiers. They mix with Grunts, Jacks, Kings and Queens as long as the stacking formula holds."],
 jack:["Jack (Knight)","J",[["Score","10 + 1d12 on attack"],["Defense","cannot defend: a Jack adds nothing to its stack's defense"],["Dice Max / MSV","12 / 24: stacks with two Grunts or one Infantry"],["Moves","two tiles straight, or one diagonal, when only Jacks move"],["Attacks","a stack of only Jacks may also attack diagonally"],["Soul","1 mana · Jack Conjure, 1 mana"]],"Every player opens the game with a Jack inside their Ace. Move it out to fight."],
 queen:["Queen","Q",[["Score","0, no die of her own"],["Gift","everyone stacked with her rolls their dice on defense as well as attack"],["King","a King stacked with her takes no penalty for rolling a 1"],["Limits","one Queen per stack; no Dice Max or MSV; she cannot attack alone"],["Soul","2 mana · Queen Conjure, 2 mana"]],"The heart of a defensive stack. Pair her with a King to bunker down."],
 king:["King","K",[["Score","11 + 1d20 on attack"],["Rolls","a 20 deals double damage (or takes none on a failed attack); a 1 deals no damage on a win and takes two on a loss, unless a Queen is with him"],["Alone","cannot attack"],["Defeated in defense","every card stacked with him dies"],["Dice Max / MSV","20 / 28: lower cards adopt his MSV"],["Soul","2 mana · King Conjure, 2 mana · can't be sacrificed from a stack"]],"The strongest attacker, and the most dangerous to lose."],
 ace:["Ace","A",[["Defense","11 + 1d20 when attacked; cards inside it don't roll on defense"],["Hearts","two: the first hit takes a heart and the cards inside are safe; when the last heart goes, the Ace and every card inside it are destroyed. On a roll of 1 it deals no damage back"],["Limits","cannot move or attack; only on an empty backline tile; holds up to six cards"],["Grave Blessing","+1d6 for each Ace you have on the field"],["Soul","3 mana · Ace Conjure, 3 mana · can't be sacrificed on the field, except to the Full Moon"],["Opening","each player starts with an Ace from their deck on a backline tile of their choice, holding a Jack"]],"A fortress and a grave-caller. Hard computers stack Aces to roll more Grave Blessing dice."],
 joker:["Joker (Necromancer)","Joker",[["Score","alone, copies the score and die of the enemy's leading card; Jokers can't kill Jokers"],["Spawns","only onto your stack holding a card of the same color (red or black)"],["Soul Capture","enemies that die on the 8 tiles around it, or its own tile, are held inside it, up to 6 mana of souls"],["Held souls","it keeps them until it dies (it and its souls go to the grave, unless an enemy Joker beside it steals them) or until Sacrificial Suicide moves them to your soul pile"],["Blood Moon","a Joker that shoots itself under a Blood Moon sends itself and every soul it held to the Outer Darkness"],["Survival","Horde Jokers capture your souls; when one shoots itself those cards go to the Outer Darkness and you lose 1 mana"],["Soul","1 mana · Joker Conjure, 2 mana"]],"The necromancer of the deck, and the only way to turn kills into mana."],
 samson:["Samson (Angel Machine)","Samson",[["Hearts","two: he loses one each time he takes damage, and falls at none"],["Slugshot Cannon","3d20, at an enemy two tiles away in a straight line or one diagonal; from two away a miss costs him nothing"],["Arm Blade","12 + 3d8, up close"],["Mech Slam","16 + 1d4, up close"],["Defense","12"],["Moves","one tile straight, or one or two diagonal"],["Stacks","with nothing but an Ace"],["Falls","Antony rises from his heart on the same tile, and Samson wanders through Limbo"]],"The Angel Machine's mech suit. Its deck holds one."],
 antony:["Antony (Angel Machine)","Antony",[["Hearts","two"],["Score","12 + 6d4 on attack, 12 on defense"],["Moves","like Samson"],["Bolts","every card he kills charges a bolt for Lightning Strike"],["Falls","he goes missing: his card is found under Unknown in the Outer Darkness"]],"The angel who was lodged in Samson's heart."],
 satan:["Satan","Satan",[["Hearts","three"],["Score","6d12 on attack and on defense, with no modifiers: no moon bonus, no odds, no Hate"],["Stacks","never"],["Falls","into the Outer Darkness"]],"Satan's own card, one in his deck."],
 tree:["Tree of Neither Life Or Death (Jester Fool)","Tree",[["Hearts","three; it cannot defend itself"],["Holds","up to six cards, like an Ace, but never Kings or tens"],["Gives","+2 mana at the start of each of your turns, and a free Puppet inside it every two rounds"],["Falls","into the Outer Darkness, with every card in it"]],"In the Jester's starting hand. Place it on an empty tile of your ground."],
 puppet:["Puppet (Jester Fool)","?",[["Score","the score of a 2: 2 + 1d6 on attack"],["Deck","every soldier in the Jester's deck is a Puppet, and the Tree grows one every two rounds"]],"Strings and wood."],
 bullgoat:["BullGoat (Jester Fool)","BullGoat",[["Hearts","two"],["Gore","10 + 1d20, up close"],["Charge","10 + 2d20 at an enemy two or three tiles away in a straight line with nothing between; the BullGoat ends next to its target"],["Defense","10"],["Stacks","never"],["Conjure","3 mana, into your hand"]],"The Jester's beast."],
 slavemaster:["Slavemaster (Binah)","SM",[["Score","8 + 1d8 on attack, stacks like an Infantry"],["Capture","enemy soldiers killed in its fights become your thralls, ten at most"]],"Three in Binah's deck."],
 slave:["Slave (Binah)","Slave",[["Rifle","10 + 1d12, at an enemy two tiles away in a straight line or one diagonal; from two away a miss costs nothing"],["Defense","none"],["Moves","one tile straight"],["Stacks","never"],["Deploy","the free Slaves spell (Necromancy) puts one thrall down on an empty tile of your ground"]],"A captured soldier with a chip in its head."],
 leviathan:["The Leviathan","Leviathan",[["Hearts","three"],["Score","6d4 + 1d2 + 6 on attack and on defense; no Queen bonus"],["Stacks","never"],["Kills","whatever it kills falls into the Outer Darkness"],["The moon","Rise to the Moon (free, New Moon only) lifts it onto the moon: a toll on every enemy each New Moon after, and +1 mana cap for you per card in the Outer Darkness (twelve at most)"],["On the moon","any enemy unit can attack it, but only at the New Moon, and it defends with advantage"],["Lightning","Antony's lightning needs no roll: it takes one heart"],["Falls","into the Outer Darkness, forever"]],"The black serpent, one in the Leviathan's deck."],
 trafficker:["Trafficker (Tiphareth of Kether)","Trafficker",[["Score","8 + 1d8 on attack, stacks like an Infantry"],["Chains","any enemy card that dies on the eight tiles around it, three prisoners at most"],["Life for Sell","puts a prisoner up at the Auction"],["Falls","its prisoners go free into the grave"]],"Three in Tiphareth of Kether's deck."],
 debt:["Debt Collector (Yaldabaoth)","Collector",[["Score","copies the leading card of whatever it fights, natural value and die, without its advantage"],["Rises","when an enemy refuses to pay Saturn"],["Price","each one still standing at a new round raises Saturn's price by 1"]],"Saturn's warden."],
 goatbull:["Goatbull (Jester Fool)","Goatbull",[["Comes back","when the BullGoat dies it goes back into the deck, and is drawn again as the Goatbull"],["Hearts","two"],["Horns","10d2 + 1d10, up close"],["Charge","10 + 2d20 at an enemy exactly two tiles away in a straight line with nothing between; it closes the gap"],["Stomp","an ability check: its 1d20 with advantage against the target's 1d20 with disadvantage (Samson rolls plain). Win: the stack is Behooved, pinned for 2d2 of its turns (1d2 on a tie), and can't move or attack. A 16 or more that the target doesn't match deals 1 damage; each later pinned round checks again and needs 5 less (11, then 6…)"],["Attacked","a Goatbull attacked while it pins loses its advantage in every later check"],["Falls","into the Outer Darkness"]],"The BullGoat, turned around."],
 scout:["Scout (support)","Scout",[["Sight","two tiles out through the fog of war, in a diamond (straight two, diagonal one); everything it sees, Assassins, ambushers, face-down cards and enemy Scouts included, is uncovered"],["Hidden","enemies see it only from right beside it, or with their own Scout in sight of it"],["Fights","never: no attack and no defense"],["Moves","one tile straight, two diagonal, or two forward or back"],["Comes","two in every deck; one with your opening Ace, and one with a later Ace while you have no Scout on the field (none for Lucifer & Ouroboros); the rest wait in the Ether for 1 mana"]],"A horse and a rider who sees far."],
 assassin:["Assassin (special)","Assassin",[["Hearts","two (a pair of Assassins has three)"],["Attack","10 + 1d12, the roll of a Jack"],["Defense","8, like an Infantry"],["Hidden","enemies see it only from right beside it, or with a Scout in sight of it"],["Moves","one tile straight, two diagonal, or two forward or back"],["Ambush","it can wait in ambush and strike, with advantage, any enemy that steps beside it"],["Stacks","with one other Assassin, nothing else"],["Conjure","2d2 + 1 mana; four per deck wait in the Ether"]],"The dagger in the dark."],
 archer:["Archer (standard)","Archer",[["Bow","1d20 + 1d10 at a stack exactly two tiles away, straight or diagonal (not the tiles right beside it); a miss costs it nothing"],["Suppress","instead of a shot: the target has disadvantage on its next attack, unless it waits out 1d2 of its turns; the Archer then rests 1d2 turns"],["Defense","none"],["Stacks","alone, with a Queen, or inside an Ace, the Tree or a Wall; never with another Archer"],["Conjure","1d2 mana (1 for the Beginner); eight per deck wait in the Ether"]],"A bow and an arrow."],
 cannon:["Cannon (standard)","Cannon",[["Fire","2d20 at a stack up to three tiles away in any direction, once every 1d2 + 2 turns; a miss costs it nothing"],["Against bases","two damage to a Wall; it can't take an Ace's last heart, and the Tree takes nothing from it"],["Defense","none; it can be captured when it stands alone"],["Moves","one step"],["Stacks","alone, or inside a base, where it still fires"],["Conjure","6 mana; one per deck"]],"Slow, loud and heavy."],
 healer:["Healer (support)","Healer",[["Shield","a blue shield over its stack turns one whole blow without anyone dying, then comes back in 1d4 rounds"],["Heal","one heart back to a card in its stack or beside it (not a base); then it waits 1d2 + 2 turns, and the shield is down for 3 turns"],["Either or","while the shield is broken it can't heal"],["Fights","never; it dies last in its stack, and can be captured when it stands alone"],["Stacks","with anything but a Queen; one per stack"],["Conjure","2 + 1d3 mana; four per deck"]],"The medical cross."],
 repair:["Repairman (support)","Repairman",[["Repair","one heart back to a Wall, an Ace or the Tree in his stack or beside it; then he rests 1d3 + 1 turns, and while he rests nothing fires from that base and it can't be repaired again"],["Strengthen","the Tree at full hearts goes up one, five at most"],["Upgrade","an Ace gets one more heart, once; he gives his life for it and goes to the grave"],["Fights","never; he dies last in his stack and can be captured when he stands alone"],["Conjure","2 mana; four per deck"]],"A hammer."],
 ram:["Battering Ram (support)","Ram",[["Ram","two damage to an enemy Wall right beside it, no roll; useless against Aces and the Tree"],["Crew","needs one or two Grunts, Infantry or Puppets in its stack; with nobody to push it, it can't move or ram"],["Can't die","blows never kill it: an enemy beside a lone Ram captures it (it joins a stack of soldiers that has room) or destroys it"],["Conjure","3 mana; four per deck"]],"A log on a frame."],
 miner:["Miner (support)","Miner",[["Miner slots","every Ace has two: a Miner there brings 1d2 − 1 mana at the start of every turn, from the round after it moves in"],["Crystal","on a crystal tile it digs: 1d2 each turn, and on a 2 it takes 1 + 1d3 of the crystal's 12 mana"],["In the open","1d6 − 5: one mana on a 6"],["First to fall","when its stack takes damage, the Miner goes first; an attacker beside it with a free capture slot takes it instead, and the blow still lands"],["Moves","one step"],["Stacks","two in an Ace, one with any other stack"],["Conjure","2 mana; four per deck; the Beginner's first Ace comes with one"]],"A pickaxe."],
 wall:["Wall (base)","Wall",[["Hearts","five; the cards inside are safe until it falls, then they all die with it"],["Defense","10"],["Holds","six cards, like an Ace; only ranged cards (Archers, Cannons) fire from it, one shot a turn"],["Moves","never; it goes up on any empty tile of your spawn lines"],["Hard hits","charges do double damage to it; Battering Rams and Cannons two; Lightning Strike two"],["Healing","a Healer can't heal it; a Repairman can"],["Conjure","4 mana; four per deck"]],"A fort wall."]
};
function infoHTML(){
  const tabs=Object.keys(INFO).map((k,i)=>`<button class="itab ${i===0?"on":""}" data-k="${k}">${INFO[k][0]}</button>`).join("");
  const spells=SCHOOLS.map(sc=>`<h4>${sc}</h4><dl>`+SPELLS.filter(s=>s.school===sc).sort((a,b)=>(a.tribe?1:0)-(b.tribe?1:0)||(a.cost||0)-(b.cost||0)||a.name.localeCompare(b.name)).map(s=>{const t=SPELL_TEXT[s.id]||{e:s.text};
    return `<dt>${esc(s.name)} <span>${s.id==="hypo"?"3 + 1 per extra card":s.dice?s.dice+", rolled each round":s.cost?s.cost+" mana":"free"}${s.tribe&&TRIBES[s.tribe]?` · ${esc(TRIBES[s.tribe].name)}`:""}</span></dt><dd>${t.n?`<i>${esc(t.n)}</i> `:""}${esc(t.e)}${t.l?` <small>${esc(t.l)}</small>`:""}</dd>`}).join("")+"</dl>").join("");
  const subs=Object.entries(TRIBES).filter(([k])=>k!=="random").map(([k,t])=>`<dt>${esc(t.name)}</dt><dd>${esc(t.sub)}${t.pts&&t.pts.length?`<ul>${t.pts.map(p=>`<li>${esc(p)}</li>`).join("")}</ul>`:""}</dd>`).join("");
  return `<details class="cinfo basics"><summary>Basics explained</summary>
<details class="sub"><summary>What am I doing?</summary><p>You command an army of cards on a small field. Each of your turns has three phases: <b>draw</b> (roll a d4 and draw that many, or skip), <b>prep</b> (place cards from your hand on your own spawn lines, move each stack one step, sacrifice cards for mana, cast spells) and <b>attack</b> (each of your stacks may attack an enemy stack next to it once). A fight compares two scores: the attacker's best card plus its die against the defender's best card. The loser takes a damage, which removes its lowest card. You win when the enemy has nothing left on the field, or no deck, hand or mana at all.</p><p>Your Ace starts on your back line with a Jack inside it. Aces are bases: they can't move or attack, they hold up to six cards, and they have two hearts. When an Ace falls, everything in it falls too.</p></details>
<details class="sub"><summary>What matters on the screen?</summary><ul>
<li><b>The field.</b> Your cards are at the bottom. Click one of your stacks to see where it can go (prep) or what it can hit (attack); the highlighted tiles are your options. Rest the mouse on a card's top-right corner (or tap it) for its stats; drag that corner onto another stack to compare them.</li>
<li><b>Your deck and mana bars.</b> The deck bar is your army in reserve; the mana bar (indigo) pays for spells. Sacrificing a card gives you its soul as mana.</li>
<li><b>The turn bar under the field.</b> It says which phase you're in and has the buttons to roll or move on.</li>
<li><b>The sky.</b> The moon turns once a round and changes prices and rules; Heavenly Bodies can take its place. Hover or tap it to see what it means for you.</li>
<li><b>The right column.</b> The Bank, then the spells by school, cheapest first, then the stack you selected. Greyed out means you can't cast it right now; hover a spell (or long-press it) for its price, what it needs, what it does and why it's blocked. Conjuring is done in the Ether.</li>
<li><b>The log</b> at the bottom: every action, with its time, in the color of the player who took it.</li></ul></details>
<details class="sub"><summary>What are some good ways to play?</summary><ul>
<li><b>Bunker:</b> a King with a Queen in the same stack defends hard, and keeping Aces back gives you more Grave Blessing dice. Good while your deck is bigger than theirs.</li>
<li><b>Push:</b> stack soldiers up to the limit, surround an enemy stack with two of yours, and use Divine Odds or Hexed Odds on the fight that matters.</li>
<li><b>Starve them:</b> Forced Hand, Three of Swords and Double Edged Sword wear down the enemy's hand and deck; an empty deck, hand and soul pile loses the game.</li>
<li><b>The Joker:</b> it captures the souls of enemies dying around it; shoot it (Sacrificial Suicide) for a burst of mana.</li>
<li>Each Substance pushes one of these further: see Substances explained, and the Card info tabs for every card.</li></ul></details>
</details>
<details class="cinfo"><summary>Card info</summary><div class="itabs">${tabs}</div><div id="ibody"></div></details>
<details class="cinfo"><summary>Spells explained</summary><div class="spellinfo">${spells}<p class="dim">New Moon: Clairvoyance and Naked Hand cost 6. Full Moon: Clairvoyance costs 2, Naked Hand is free, and no necromancy is cast. Blood Moon: Full Moon prices with no Full Moon drawbacks; necromancy is allowed. The moon turns one phase per round, once every player has had a turn.</p></div></details>
<details class="cinfo"><summary>Further explanations</summary>
<details class="sub"><summary>Substances explained</summary><dl class="spellinfo">${subs}</dl><p class="dim">Only the Beginner can be played by more than one player in a game. The full rules for each are on the All Rules page.</p></details>
<details class="sub"><summary>Fog of war and stealth explained</summary><dl class="spellinfo"><dt>Fog of war</dt><dd>On by default (Rules tab). Each of your cards sees only the eight tiles around it, straight and diagonal; a Scout sees two tiles out in a diamond (two straight, one diagonal). Shaded tiles are out of sight: enemy cards there stay hidden, and the log only says that something moved out of sight.</dd><dt>Shooting into the fog</dt><dd>Archers, Cannons, Rifles and the Slugshot Cannon can fire at a fogged tile in reach. If nothing is there the shot is lost; if something is, it is a normal attack, but all you learn is whether it hit: you hear the blow land.</dd><dt>Scouts</dt><dd>Never attack or defend. Everything in a Scout's diamond of sight is uncovered: Assassins, ambushers, face-down cards and enemy Scouts. Every Ace you put down brings one from the Ether.</dd><dt>Assassins</dt><dd>Hidden from enemies unless one of their cards stands right beside it (straight, not diagonal) or a Scout is near. Two hearts; 10 + 1d12 to attack, 8 to defend. Only another Assassin stacks with one.</dd><dt>Face down</dt><dd>Tick "Place it face down" before putting a card down. Enemies see only its back. Double disadvantage to attack, advantage to defend; it turns face up once it attacks or is attacked.</dd><dt>Ambush</dt><dd>Select an Assassin or face-down stack in your prep phase and press "Set an ambush": it turns sideways, hides like an Assassin, and strikes with advantage, out of turn, at the first enemy that steps beside it (diagonals too for a Jack's reach). Moving it ends the ambush.</dd><dt>Quiet Eyes and Bird's Eye</dt><dd>Quiet Eyes (Illusion, 2 mana): on each enemy's next turn, and only that turn, they see only the tiles their own cards stand on; Scouts don't see through it. Bird's Eye (Sorcery) lifts the fog for your side for a round, but not a Delusion.</dd></dl></details>
<details class="sub"><summary>Siege, support and mining explained</summary><dl class="spellinfo"><dt>Bought from the Ether</dt><dd>Archers, Cannons, Healers, Walls, Repairmen, Battering Rams and Miners all wait in the Ether, a set for every deck, and come into your deck with their Conjure spells. The Beginner starts with two Archers, a Wall, two Repairmen and a Battering Ram in the deck, and a Miner in the first Ace.</dd><dt>Shooting</dt><dd>Archers and Cannons fire from wherever they stand, inside an Ace, the Tree or a Wall too, where the rest can't fight. Select the stack in the attack phase and click a highlighted target; a miss costs the shooter nothing. Only one shot a turn leaves a base.</dd><dt>Support cards</dt><dd>Healers, Repairmen, Battering Rams and Miners never fight. In a stack they die last (Miners first). Standing alone they can't defend: an enemy beside them chooses Capture or Destroy instead of an attack. A captured card rides in the stack's capture slot (one per stack) until you set it to work beside the stack; then it is yours.</dd><dt>Heal and Repair</dt><dd>Select the stack in your prep phase and press Heal a heart or Repair. The status line under the cards shows every cooldown.</dd><dt>Crystals</dt><dd>A crystal rises in the middle of the field every 1d6 + 4 turns. A Miner on it digs 1 + 1d3 mana on a 2 of 1d2 each turn, until the crystal's 12 mana are gone.</dd><dt>Field Libation</dt><dd>Necromancy, free, not under the Full Moon: pour out cards from your field; each one is worth its mana on a 2 of 1d2, and goes to the grave for nothing on a 1.</dd></dl></details>
${bankExplainHTML()}
${skyExplainHTML()}
</details>`;
}
function infoBody(k){const [t,rk,rows,note]=INFO[k];return `<h4>${t} <span class="bl">${rk}</span></h4><table>${rows.map(([a,b])=>`<tr><th>${a}</th><td>${b}</td></tr>`).join("")}</table><p class="dim">${note}</p>`}
function mountInfo(){
  const box=$("#info");if(!box)return;box.innerHTML=infoHTML();$("#ibody").innerHTML=infoBody("grunt");
  box.querySelectorAll(".itab").forEach(b=>b.onclick=()=>{box.querySelectorAll(".itab").forEach(x=>x.classList.toggle("on",x===b));$("#ibody").innerHTML=infoBody(b.dataset.k)});
}

/* ---------------- start screen ---------------- */
const MODES=[
 ["local","Local","2 to 4 players (up to 8 in King of the Hill) on one device, taking turns. The board turns to whoever is playing, and the screen goes dark while you pass it. Any seat can be a computer."],
 ["cpu","Versus Computer","You against 1 to 3 computers at Easy, Medium or Hard: 1v1, free-for-all, or two against two with a computer at your side; up to 7 in King of the Hill."],
 ["survival","Survival","1 to 4 players hold the line against a Horde that grows every round. Count the rounds you last."]];
let startMode=null;
const ORD=["One","Two","Three","Four"],SEATCOL=[0,3,2,5,4,7,1,8],SEATSOL=["tetra","icosa","cube","octa","dodeca","tetra","icosa","cube"];   // v57: eight seats for King of the Hill
const LAYOUTS={
 duel:["1v1","Two players, one army at each end of the field. Needs exactly 2 players."],
 ffa:["Free-for-all","Everyone for themselves, one player to each edge of the field. Needs 3 or 4 players."],
 "team-side":["2v2, side by side","Teammates hold two neighboring edges. Needs 4 players."],
 "team-across":["2v2, across","Teammates face each other from opposite edges, with the enemy on both flanks. Needs 4 players."],
 "team-same":["2v2, same side","Laid out like 1v1: each team shares one end of the field, half its columns each. Needs 4 players."],
 koth:["King of the Hill","A 25 by 25 night field around a glowing Hill: hold it to score. 2 to 8 players, in teams by default."]};
const LAYNEED={duel:[2],ffa:[3,4],"team-side":[4],"team-across":[4],"team-same":[4],koth:[2,3,4,5,6,7,8]};
const LAYDEF={2:"duel",3:"ffa",4:"ffa",5:"koth",6:"koth",7:"koth",8:"koth"};
function seatForm(i,S,mode,L,taken){taken=taken||new Set();
  const n=i+1,tm=L.startsWith("team")||L==="koth"&&SEAT_KOTH_TEAM,team=tm?`<span class="sidetag s${S.team}">${S.team?"Side B":"Side A"}</span>`:"";
  let type;
  const you=mode==="cpu"&&i===0;   // v60: "You" is a tag in your own color beside your seat's name
  if(you)type="";else if(mode==="survival")type=`<span class="dim">Human</span>`;
  else type=`<label class="f">Plays as <select data-seat="${i}" data-k="type">${(mode==="cpu"?[]:[["human","Human"]]).concat([["easy","Computer · Easy"],["medium","Computer · Medium"],["hard","Computer · Hard"]]).map(([v,t])=>`<option value="${v}" ${S.type===v?"selected":""}>${t}</option>`).join("")}</select></label>`+(S.type&&S.type!=="human"?`<label class="f">Style <select data-seat="${i}" data-k="arch" title="${esc(AI.ARCH[S.arch]?AI.ARCH[S.arch].sub:"Each computer gets one of the styles at random.")}">${[["random","Random (default)"],...Object.entries(AI.ARCH).map(([k,a])=>[k,a.name])].map(([v,t])=>`<option value="${v}" ${(S.arch||"random")===v?"selected":""}>${t}</option>`).join("")}</select></label>`:"");   // v69: the computer's playstyle
  const pcol=TRIBES[S.tribe]&&TRIBES[S.tribe].color||(S.color==="random"?"#c9a274":S.color);
  const T0=TRIBES[S.tribe]||{},scol=T0.color||S.color,ssol=T0.solid||S.solid,
    lsum=`<span class="dim lsum">· ${esc(T0.name||"Random")} ${scol&&scol!=="random"?`<i class="lsw" style="background:${scol}"></i>`:`<i class="lsw rnd">?</i>`}${ssol&&ssol!=="random"&&SOLIDS[ssol]?`<i class="lso">${solidSVG(ssol,scol&&scol!=="random"?scol:"#f3d6a6",14)}</i>`:""}</span>`;
  return `<fieldset class="pf seat${you?" isyou":""}" style="--pc:${pcol}"><legend>P${i+1}${you?' <b class="youtag">You</b>':""} ${team}</legend>
<div class="srow"><label class="f">Name <input data-seat="${i}" data-k="name" value="${esc(S.name)}" maxlength="20"></label>${type}</div>
<details class="look" ${S.open?"open":""}><summary>${tm?"Team, Substance, color and symbol":"Substance, color and symbol"} ${lsum}</summary>
${tm?`<div class="f"><span>Team</span><div class="opts">${[0,1].map(t=>`<label class="opt"><input type="radio" name="tm${n}" data-seat="${i}" data-k="team" value="${t}" ${S.team===t?"checked":""}><span>${t?"Side B":"Side A"}<small>${t?"Plays against Side A.":"Plays against Side B."} ${L==="koth"?"Each side needs at least one player.":"Each side needs two players."}</small></span></label>`).join("")}</div></div>`:""}
<div class="f"><span>Substance</span><div class="opts subs">${Object.entries(TRIBES).map(([k,t])=>{const off=t.soon||taken.has(k)&&k!==S.tribe;return `<label class="opt${off?" off":""}"><input type="radio" name="tr${n}" data-seat="${i}" data-k="tribe" value="${k}" ${k===S.tribe?"checked":""} ${off?"disabled":""}><span>${t.solid?`<i class="subsym">${solidSVG(t.solid,t.color||"#f3d6a6",18)}</i>`:""}${t.name}<small>${taken.has(k)&&k!==S.tribe?"Another player has it: only the Beginner can be played by more than one player.":t.sub}</small></span></label>`}).join("")}</div></div>
${(()=>{const T=TRIBES[S.tribe]||{};
  const acc=c0=>`<div class="f"><span>Accent</span><div class="opts swatches accents">${ACCENTS.map(([v,nm])=>`<label class="sw" title="${nm}${v==="auto"?" (a light shade of the color)":""}"><input type="radio" name="ac${n}" data-seat="${i}" data-k="accent" value="${v}" ${v===(S.accent||"auto")?"checked":""}><span style="--pc:${v==="auto"?accentOf(c0&&c0!=="random"?c0:"#c9a274","auto"):v}"></span><em>${nm}</em></label>`).join("")}</div></div>`;   // v61: the frame of your cards
  if(T.color)return `<p class="dim fixednote">${esc(T.name)} always plays in its own color and symbol: ${solidSVG(T.solid,T.color,20)}</p>`+acc(T.color);
  const colors=`<div class="f"><span>Color</span><div class="opts swatches">${COLORS.map(([nm,hex])=>`<label class="sw" title="${nm}"><input type="radio" name="co${n}" data-seat="${i}" data-k="color" value="${hex}" ${hex===S.color?"checked":""}><span style="--pc:${hex}"></span><em>${nm}</em></label>`).join("")}<label class="sw swrand" title="Random: a color nobody else has"><input type="radio" name="co${n}" data-seat="${i}" data-k="color" value="random" ${S.color==="random"?"checked":""}><span>?</span><em>Random</em></label></div></div>`;
  if(T.solid)return colors+acc(S.color)+`<p class="dim fixednote">${esc(T.name)} always bears its own symbol: ${solidSVG(T.solid,S.color,20)}</p>`;
  return colors+acc(S.color)+`<div class="f"><span>Symbol</span><div class="opts solids">${Object.entries(SOLIDS).map(([k,nm])=>`<label class="so-opt" title="${nm}"><input type="radio" name="so${n}" data-seat="${i}" data-k="solid" value="${k}" ${k===S.solid?"checked":""}><span>${solidSVG(k,"#f3d6a6",28)}<em>${nm}</em></span></label>`).join("")}<label class="so-opt" title="Random: a symbol nobody else has"><input type="radio" name="so${n}" data-seat="${i}" data-k="solid" value="random" ${S.solid==="random"?"checked":""}><span><b class="sorand">?</b><em>Random</em></span></label></div></div>`;
})()}
</details></fieldset>`;
}
const val=name=>{const e=document.querySelector(`input[name="${name}"]:checked`);return e&&e.value};
const chk=(id,label,sub,on)=>`<label class="chk"><input type="checkbox" id="${id}" ${on?"checked":""}> <span><b>${label}</b>${sub?`<small>${sub}</small>`:""}</span></label>`;
function showStart(){
  if(G)G.over=true;
  applyMoonTheme();
  const q=new URLSearchParams(location.search).get("mode");
  if(!startMode&&MODES.some(m=>m[0]===q))startMode=q;
  if(!startMode){
    ovShow(`<div class="ovbox setup"><div class="shead"><h2>New game</h2><p class="dim">Choose how to play.</p></div><div class="modes">${MODES.map(([k,t,s])=>`<button class="mode" data-m="${k}"><b>${t}</b><span>${s}</span></button>`).join("")}</div></div>`);
    document.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{startMode=b.dataset.m;showStart()});return;
  }
  const mode=startMode,M=MODES.find(m=>m[0]===mode);
  const seatsS=[0,1,2,3,4,5,6,7].map(i=>({name:mode==="survival"&&i===0?"Survivor":`P${i+1}`,type:mode==="survival"||i===0?"human":mode==="cpu"?"medium":"human",
    tribe:mode==="cpu"&&i>0?"random":"beginner",color:mode==="cpu"&&i>0?"random":COLORS[SEATCOL[i]][1],solid:mode==="cpu"&&i>0?"random":SEATSOL[i],team:i%2,named:false}));
  let curLayout=null;
  const counts=mode==="survival"?[1,2,3,4]:mode==="online"?[2,3,4]:[2,3,4,5,6,7,8];
  const forms=`<fieldset class="pf"><legend>Table</legend>
<label class="f">${mode==="survival"?"Players against the Horde":"Players"} <select id="pcount">${counts.map(c=>`<option value="${c}" ${c===counts[0]?"selected":""}>${c}</option>`).join("")}</select></label>
<div class="f" id="layoutf" ${mode==="survival"?"hidden":""}><span>Layout</span><div class="opts">${Object.entries(LAYOUTS).map(([k,[t,d]],i)=>`<label class="opt" data-lay="${k}"><input type="radio" name="olayout" value="${k}" ${i===0?"checked":""}><span>${t}<small>${d}</small></span></label>`).join("")}</div></div>
<p class="dim" id="laynote"></p>
<div id="kothopts" hidden><div class="f"><span>King of the Hill</span><div class="opts">
${chk("okteam","Team mode","Players form two sides, Side A and Side B (not necessarily even). Off: everyone for themselves.",true)}
${chk("oktug","Tug of war","Team mode only. One shared bar from −25 to +25: holding the Hill pulls it your side's way; when both sides hold it, it stops. Pull it all the way to win.",false)}
${chk("okdouble","Double points","Every point counts twice.",false)}
${chk("okcontest","Contest","When more than one side holds the Hill, nobody scores.",false)}</div></div>
<div class="f"><span>Points to win</span><div class="opts">${[["30","30"],["50","50 (default)"],["100","Marathon: 100","Holding the Hill can raise mercenaries for your side."]].map(([v,t,d])=>`<label class="opt"><input type="radio" name="oktarget" value="${v}" ${v==="50"?"checked":""}><span>${t}${d?`<small>${d}</small>`:""}</span></label>`).join("")}</div></div>
<div class="f"><span>Spawns</span><div class="opts"><label class="opt"><input type="radio" name="oknear" value="" checked><span>Apart (default)<small>Far enough from enemies, but not as far as possible.</small></span></label><label class="opt"><input type="radio" name="oknear" value="near"><span>Next to enemies<small>Everyone spawns closer to enemies than to teammates.</small></span></label></div></div>
<div class="f"><span>Computers take the Hill</span><div class="opts">${[["each","Each its own way (default)","Every computer picks one of the three ways for the game."],["army","Gather an army first","They build a big army, then march on the Hill together."],["straight","Straight there","Every card heads for the Hill at once."],["groups","In small groups","Groups of two or three set out one after another."]].map(([v,t,d],i)=>`<label class="opt"><input type="radio" name="okcpu" value="${v}" ${i?"":"checked"}><span>${t}<small>${d}</small></span></label>`).join("")}</div></div>
<p class="dim">Other ways to win still count. The Hill is never in the fog; sight is a circle of 2 (Scouts: 4, and they move 3 in any direction); meteors fall more often.</p></div></fieldset><div id="seats"></div>`;
  const diff="";
  const rules=`<fieldset class="pf"><legend>Turns</legend>
<label class="f">Turn order <select id="oturns"><option value="classic">Classic</option><option value="prep">Draw and prep together</option><option value="all">Every phase together</option></select></label>
<p class="dim" id="turnnote"></p>
<label class="f">Phase timer <select id="otimer"><option value="0" selected>Off (default)</option><option value="30">30 seconds</option><option value="60">60 seconds (draw phase 30)</option><option value="90">90 seconds (draw phase 30)</option></select></label>
<p class="dim">When the timer runs out the game moves on to the next phase. During setup it places your cards for you, the way a Medium computer would.</p>
<label class="f">Computer speed <select id="ospeed"><option value="slow">Slow</option><option value="normal" selected>Normal (default)</option><option value="fast">Fast</option></select></label>
</fieldset>
<fieldset class="pf" id="elimset" hidden><legend>When a player falls</legend><div class="opts">
<label class="opt"><input type="radio" name="oelim" value="grave" checked><span>To the grave (default)<small>Their deck and hand go to the grave, and the grave is shuffled.</small></span></label>
<label class="opt"><input type="radio" name="oelim" value="dark"><span>To the Outer Darkness<small>Their deck and hand are gone for good.</small></span></label></div></fieldset>
<fieldset class="pf"><legend>Field</legend>
${chk("ocrys","Crystals (default)","A crystal cluster rises in the middle of the field every 1d6 + 4 turns (Headquarters opens with one). A Miner standing on it digs out its 12 mana.",true)}
${chk("ofog","Fog of war (default)","Each card sees only the eight tiles around it (a Scout two tiles out, in a diamond); ranged cards can fire blind into the fog. Assassins, ambushers and Scouts stay hidden until you stand right beside them.",true)}
${chk("obarb","Demons (default)","Every 4 + 1d12 turns a crimson band of Grunts, Infantry or Jacks (sometimes with an Ace) takes the middle of the field and fights everyone. Whoever kills the most earns an Ether sale; a big band can earn debt forgiveness.",true)}
<label class="f">Hole in the middle <select id="ohole"><option value="0" selected>None (default)</option><option value="1">One or two tiles</option><option value="2">Doubled</option><option value="3">Tripled</option></select></label>
<p class="dim">An empty pit in the center of the field, never on the River map and never in anyone's lines; it only grows where there is room.</p>
${chk("olock","Optional Ace rule","Cards inside an Ace must match its color.",false)}
</fieldset>
<fieldset class="pf"><legend>Cheats</legend>
${chk("ocheat","Cheat mode","Off by default. Free magic, infinite mana, every spell, blocks, rare events and spawns on demand, and no victory or loss, from a Cheat button beside Configure. Every player sees that it is on.",false)}
</fieldset>
<fieldset class="pf"><legend>Mana</legend>
<label class="f">Starting mana <select id="omana"><option value="3d2" selected>3d2 (default)</option><option value="1d6">1d6</option><option value="none">None</option>${[1,2,3,4,5,6].map(n=>`<option value="${n}">${n}</option>`).join("")}</select></label>
${chk("obank","The Bank opens with mana","The Bank starts with (2 × players)d2 mana to lend. Off by default: it fills up from the mana spent on spells.",false)}
${chk("oeach","Each player rolls their own","On by default with one deck; off by default otherwise, when one roll sets the same starting mana for everyone.",false)}
<p class="dim">Starting souls come from the Ether as soldier souls, worth 1 mana each.</p>
</fieldset>
<fieldset class="pf"><legend>Heavenly Bodies</legend>
<p class="dim">The starting Heavenly Body is chosen in the Map tab.</p>
${chk("omoon","Moon combat bonus","Every attack adds 1d2 at the Full Moon, and every defense adds 1d2 at the New Moon.",true)}
${chk("opshop","Heavenly Body shop","Any of the seven Heavenly Bodies can be bought for the sky (Astrology) for 7 + 1d3 + 1d12 mana, rolled every round. It rises at the start of the next round; then no Heavenly Body can be bought for six rounds.",true)}
${chk("oatk","Spells in the attack phase","Enchantments, curses, sorcery and illusions can also be cast while attacking. Necromancy, conjuring and sacrifices stay in prep.",false)}
${chk("oblood","Eclipse mode (the Blood Moon for the moon)","With the moon: the game opens on a Blood Moon; each deck is shuffled and two thirds of it go to the grave; each player starts with a Joker in hand. With a Heavenly Body in the sky: the game opens under that Heavenly Body's eclipse.",false)}
</fieldset>`;
  const display=`<fieldset class="pf"><legend>Your hand</legend><div class="opts">
<label class="opt"><input type="radio" name="dhand" value="below" ${PREF.hand!=="side"?"checked":""}><span>Under your deck (default)<small>Right below your own bars, with your dice box.</small></span></label>
<label class="opt"><input type="radio" name="dhand" value="side" ${PREF.hand==="side"?"checked":""}><span>Beside the field<small>In the right-hand column, above the spells.</small></span></label></div></fieldset>
<fieldset class="pf"><legend>Selected stack box</legend><div class="opts">
<label class="opt"><input type="radio" name="dsel" value="bottom" ${PREF.sel!=="top"?"checked":""}><span>Below the spells${isPhone()?"":" (default)"}<small>At the bottom of the right-hand column.</small></span></label>
<label class="opt"><input type="radio" name="dsel" value="top" ${PREF.sel==="top"?"checked":""}><span>Above the spells${isPhone()?" (default on a phone)":""}<small>At the top of the right-hand column.</small></span></label></div></fieldset>
<fieldset class="pf"><legend>Turn buttons</legend><div class="opts">
<label class="opt"><input type="radio" name="dctl" value="bottom" ${PREF.ctl!=="top"?"checked":""}><span>Under the field (default)<small>Roll, next phase and end turn sit in a bar right below the board, on the page.</small></span></label>
<label class="opt"><input type="radio" name="dctl" value="top" ${PREF.ctl==="top"?"checked":""}><span>At the top<small>Beside the moon and the phases.</small></span></label></div></fieldset>
<fieldset class="pf"><legend>Tile names</legend><div class="opts">
<label class="opt"><input type="radio" name="dcoord" value="0" ${PREF.coords?"":"checked"}><span>Off (default)<small>Like a chessboard without its letters and numbers.</small></span></label>
<label class="opt"><input type="radio" name="dcoord" value="1" ${PREF.coords?"checked":""}><span>On<small>Each tile shows its name in a corner: columns A, B, C from the left, rows 1, 2, 3 from the bottom.</small></span></label></div>
<p class="dim">Tile names are always used in the dice box history, either way.</p></fieldset>
<fieldset class="pf pc-only"><legend>Page width</legend><div class="opts">
<label class="opt"><input type="radio" name="dfull" value="0" ${PREF.full?"":"checked"}><span>Standard<small>The page keeps the width of the rest of the site.</small></span></label>
<label class="opt"><input type="radio" name="dfull" value="1" ${PREF.full?"checked":""}><span>Full width (default)<small>The page fills the whole width of a wide screen, and the field grows with it. The default on a computer.</small></span></label></div></fieldset>
<fieldset class="pf"><legend>Animations</legend><div class="opts">
<label class="opt"><input type="checkbox" id="danimc" ${PREF.fxCards!==false?"checked":""}><span>Card animations (on by default)<small>Moves, strikes, wounds, deaths (a white skull rises), sacrifices, mana and shuffles.</small></span></label>
<label class="opt"><input type="checkbox" id="danimm" ${PREF.fxMagic!==false?"checked":""}><span>Magic and other animations (on by default)<small>Spells, the sky, fire and weather, and the drifting fog. Off, the fog of war stands still.</small></span></label></div>
<p class="dim">Turning animations off helps slower phones. Also in the Display bar at the bottom of the game.</p></fieldset>
<fieldset class="pf"><legend>Background lines</legend><div class="opts">
<label class="opt"><input type="radio" name="dlines" value="1" ${PREF.lines!==false?"checked":""}><span>On (default)<small>Thin black lines across the page behind everything, and now and then a black bar.</small></span></label>
<label class="opt"><input type="radio" name="dlines" value="0" ${PREF.lines===false?"checked":""}><span>Off<small>A plain background, on every page of the site.</small></span></label></div></fieldset>
<fieldset class="pf"><legend>Brightness</legend><label class="f">Brightness <select id="dbright">${[.7,.8,.9,1,1.1,1.2,1.3].map(v=>`<option value="${v}" ${Math.abs((PREF.bright||1)-v)<.01?"selected":""}>${Math.round(v*100)}%${v===1?" (default)":""}</option>`).join("")}</select></label><p class="dim">For the whole site. Also in the Display bar at the bottom of the game.</p></fieldset>
<fieldset class="pf"><legend>Page theme</legend><div class="opts">${Object.entries(THEMES).map(([k,[n]])=>`<label class="opt"><input type="radio" name="dtheme" value="${k}" ${PREF.theme===k?"checked":""}><span>${n}<small>${({darkfantasy:"The default: an old dungeon in grey and crimson, gold and silver, with music.","":"The burnt amber of the rest of the site.",dull:"The burnt amber, duller and less orange, with a faint yellow tint.",office:"Soft grey pages and panels with a blue accent, like an office suite; easy on the eyes.",officedark:"The Office theme in charcoal, for the night.",earth:"A night druid\u2019s grove: dark soil, moss and lichen gold.",jester:"Black, after chapter 26.",ten:"White on indigo, after chapters 1–4.",satan:"Crimson, after chapter 23."})[k]}</small></span></label>`).join("")}</div><p class="dim">A Blood Moon overrides the theme while it lasts. Card icon size, interface size, text size, hand position, tile names, page width and theme can also be changed at the bottom of the screen during play.</p></fieldset>`;
  const suitSel=`<div id="suitpick" hidden><p class="dim">${mode==="local"?"P1 picks; P2 gets the other two suits.":mode==="cpu"?"You pick; the computer gets the other two suits.":"You pick; the other two suits wait in the Ether."}</p>
<label class="f">Red suit <select id="osuitR"><option value="H">♥ Hearts</option><option value="D">♦ Diamonds</option></select></label>
<label class="f">Black suit <select id="osuitB"><option value="S">♠ Spades</option><option value="C">♣ Clubs</option></select></label></div>`;
  const deckTab=`<fieldset class="pf" id="ffadecks" hidden><legend>Decks</legend><div class="opts">
<label class="opt"><input type="radio" name="offa" value="full" checked><span>A whole deck each (default)<small>Every player has all four suits.</small></span></label>
<label class="opt"><input type="radio" name="offa" value="half"><span>Half a deck each<small>One red and one black suit each; the rest wait in the Ether.</small></span></label></div></fieldset>
<fieldset class="pf" id="teamdecks" hidden><legend>Decks</legend><p class="dim">Each team has one deck: every teammate takes one red and one black suit of it, and one of its Jokers.</p>
${chk("oshare","Shared team deck","Teammates draw from one deck and spend from one soul pile, but keep their own hands.",false)}</fieldset>
<fieldset class="pf" id="dueldecks"><legend>Decks</legend><div class="opts">
${[["1","One deck",mode==="survival"?"You take one red and one black suit; the other half of the deck waits in the Ether.":"Both players split one deck: each takes one red and one black suit."],["2","Two decks (default)","Each player has a full deck of all four suits."],["3","Three decks","A full deck each, and a whole third deck waits in the Ether."]].map(([v,t,d])=>`<label class="opt"><input type="radio" name="odecks" value="${v}" ${v==="2"?"checked":""}><span>${t}<small>${d}</small></span></label>`).join("")}</div>
<div class="f" id="suitmode" hidden><span>Suits (one deck)</span><div class="opts"><label class="opt"><input type="radio" name="osuitmode" value="random" checked><span>Random (default)<small>Each player is dealt one red and one black suit at random.</small></span></label><label class="opt"><input type="radio" name="osuitmode" value="choose"><span>Choose<small>Pick the two suits below.</small></span></label></div>${suitSel}</div>
</fieldset>
<fieldset class="pf"><legend>Specials and Aces (Jacks, Queens, Kings, Jokers and Aces)</legend><div class="opts">
${[["none","None (default)","Only your opening Ace and its Jack. Every other special waits in the Ether to be conjured."],["half","Half","The specials of half your suits; the rest wait in the Ether."],["all","All","Every special of your suits is in your deck."]].map(([v,t,d])=>`<label class="opt"><input type="radio" name="ospecials" value="${v}" ${v==="none"?"checked":""}><span>${t}<small>${d}</small></span></label>`).join("")}</div>
${chk("ojoker","At least one Joker","Every player's deck holds at least one Joker, taken from the Ether if needed.",true)}
<p class="dim" id="decksum"></p>
</fieldset>`;
  const mapTab=`<fieldset class="pf"><legend>Battle map</legend><div class="opts">
<label class="opt"><input type="radio" name="omap" value="random"><span>Random<small>One of the four maps below, picked at the start.</small></span></label>
${["keep","sahel","forest","dungeon"].map(k=>`<label class="opt"><input type="radio" name="omap" value="${k}"><span>${MAPS[k].name}<small>${MAPS[k].sub}</small></span></label>`).join("")}
<span class="optgroup">Special Maps</span>
${["river","none"].filter(k=>!(mode==="survival"&&k==="river")).map(k=>`<label class="opt"><input type="radio" name="omap" value="${k}" ${k==="none"?"checked":""}><span>${MAPS[k].name}${k==="none"?" (default)":""}<small>${MAPS[k].sub}</small></span></label>`).join("")}</div>
<div class="f" id="bridgeopt" hidden><span>Bridge</span><div class="opts"><label class="opt"><input type="radio" name="obridge" value="left" checked><span>Left<small>Two tiles wide, on the left of the river.</small></span></label><label class="opt"><input type="radio" name="obridge" value="right"><span>Right<small>Two tiles wide, on the right.</small></span></label></div></div>
</fieldset>
<fieldset class="pf"><legend>Starting Heavenly Body</legend>
<div class="opts skyopts">${SKY_OPTS.map(([v,nm,txt],i)=>`<label class="opt sky-${v}"><input type="radio" name="omoonon" value="${v}" ${i?"":"checked"}><span>${nm}<small>${txt}</small>${SKY_FORM[v==="on"?"moon":v]?`<em class="skyform">${SKY_FORM[v==="on"?"moon":v]}</em>`:""}</span></label>`).join("")}</div>
</fieldset>
<fieldset class="pf" id="sizeset"><legend>Size</legend>
<div id="sizeduel"><p class="dim">On a phone, 5 wide is the largest size that stays easy to read.</p><div class="f"><span>Width</span><div class="opts">${[5,6,7].map(w=>`<label class="opt"><input type="radio" name="ocols" value="${w}" ${w===6?"checked":""}><span>${w} wide${w===6?" (default)":""}</span></label>`).join("")}</div></div>
${mode==="survival"?'<p class="dim">Survival always uses the midline: the field is 5 tall.</p>':`<div class="f"><span>Height</span><div class="opts">${[[4,"4 tall","No midline"],[5,"5 tall","One midline"],[6,"6 tall (default)","Two midlines"]].map(([h,t,d])=>`<label class="opt"><input type="radio" name="orowsd" value="${h}" ${h===6?"checked":""}><span>${t}<small>${d}</small></span></label>`).join("")}</div></div>`}
</div>${chk("ocorners","Cut off the corners","The four corner tiles are removed from play. On by default for free-for-all and the 2v2 layouts on the edges.",false)}
<div id="sizeother" class="sizesel" hidden></div>
${mode==="survival"?"":`<div class="f" id="bigset"><span>Large maps</span><div class="opts">${[["","Standard (default)","The sizes above."],["long","10 long, 6 wide","1v1, or 2v2 with each team on one short end."],["sq","10 by 10","Any layout."],["plus","10 by 10 plus","A cross with arms 4 wide; everyone spawns at the end of an arm."],["round","Plus with a round middle","The cross with a round open middle; the hole option can open its center."]].map(([v,t,d])=>`<label class="opt"><input type="radio" name="obig" value="${v}" ${v?"":"checked"}><span>${t}<small>${d}</small></span></label>`).join("")}</div><p class="dim">Large maps scroll inside a frame: the mouse wheel zooms, dragging an empty spot or WASD and the arrow keys move it, and Q and E (or C and V) zoom. The Menu has Large Map Controls.</p></div>`}
<p class="dim mapnote" id="rivernote" hidden>The River map is always 7 wide and 5 tall with the midline, and keeps its corners.</p>

</fieldset>
${mode==="survival"?"":`<fieldset class="pf"><legend>Victory</legend>${chk("ohq","Headquarters","Each side opens with two Aces as bases, and troops can only be spawned inside your Aces. The only ways to win are destroying every enemy base or an economic victory.",false)}</fieldset>`}`;
  const tabs=[["players","Players",forms],["map","Map",mapTab],["deck","Deck",deckTab],["rules","Rules",rules],["display","Display",display]];
  ovShow(`<div class="ovbox setup"><div class="shead"><h2>${M[1]}</h2><p class="dim">${M[2]}</p></div>
<div class="stabs" role="tablist">${tabs.map(([k,t],i)=>`<button type="button" role="tab" class="stab ${i?"":"on"}" data-t="${k}" aria-selected="${!i}">${t}</button>`).join("")}</div>
${tabs.map(([k,,h],i)=>`<div class="spanel" data-p="${k}" role="tabpanel" ${i?"hidden":""}><div class="scols">${h}</div></div>`).join("")}
<p class="acts sfoot"><button class="btn" id="go">${mode==="survival"?"Raise your Ace":"Roll for the opening"}</button> <button class="btn ghost" id="back">← Other modes</button> <a class="dim" href="ethers-crossroads-rules.html#modes">How the modes work</a></p></div>`);
  document.querySelectorAll(".stab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".stab").forEach(x=>{x.classList.toggle("on",x===b);x.setAttribute("aria-selected",x===b)});document.querySelectorAll(".spanel").forEach(p=>p.hidden=p.dataset.p!==b.dataset.t)});
  const count=()=>+$("#pcount").value;
  const layout=()=>{const n=count();if(mode==="survival")return n===1?"duel":"coop";const v=val("olayout");return v&&LAYNEED[v].includes(n)?v:LAYDEF[n]};
  const humans=()=>mode==="survival"?count():seatsS.slice(0,count()).filter(S=>S.type==="human").length;
  const drawSeats=()=>{
    const n=count(),L=layout();
    if(mode!=="survival"){
      document.querySelectorAll("#layoutf [data-lay]").forEach(o=>{const ok=LAYNEED[o.dataset.lay].includes(n);o.classList.toggle("off",!ok);const inp=o.querySelector("input");inp.disabled=!ok;inp.checked=o.dataset.lay===L})}
    const key=L+(L==="coop"?n:"");if(key!==curLayout){curLayout=key;sizeUp()}
    if($("#kothopts")){$("#kothopts").hidden=L!=="koth";SEAT_KOTH_TEAM=$("#okteam").checked;$("#oktug").disabled=!SEAT_KOTH_TEAM;kothMapUp(L)}
    $("#laynote").textContent=mode==="survival"?(n===1?"One survivor on the usual field.":`${n} survivors share the bottom of the field, and the Horde spawns once for each of you. You take your turns one after another on this device, and the Horde moves first each round.`):"";
    const blk=skyBlocked(val("omoonon"));
    $("#seats").innerHTML=seatsS.slice(0,n).map((S,i)=>seatForm(i,S,mode,L,new Set([...blk,...seatsS.slice(0,n).filter((Q,j)=>j!==i&&Q.tribe!=="random"&&Q.tribe!=="beginner").map(Q=>Q.tribe)]))).join("");
    $("#seats").querySelectorAll("details.look").forEach((d,i)=>d.addEventListener("toggle",()=>{seatsS[i].open=d.open}));   // v60: each seat's fold stays as it was left
    $("#seats").querySelectorAll("[data-seat]").forEach(el=>el.addEventListener(el.tagName==="INPUT"&&el.type==="text"?"input":"change",()=>{
      const S=seatsS[+el.dataset.seat],k=el.dataset.k;S[k]=el.value;if(k==="name")S.named=true;
      if(k==="color"){S.lookSet=true;el.closest(".seat").style.setProperty("--pc",el.value);drawSeats();return}   // v61: the accents follow the color
      if(k==="tribe"||k==="color"||k==="solid")S.lookSet=true;
      if(k==="type"){if(!S.lookSet){const i2=+el.dataset.seat,cpu=el.value!=="human";S.tribe=cpu?"random":"beginner";S.color=cpu?"random":COLORS[SEATCOL[i2]][1];S.solid=cpu?"random":SEATSOL[i2];drawSeats();return}
        turnUp()}
      if(k==="team"){S.team=+el.value;drawSeats()}
      if(k==="tribe"){S.open=true;drawSeats()}
    }));
    const big=["ffa","team-side","team-across"].includes(L);
    $("#sizeduel").hidden=L!=="duel";
    if(!$("#ocorners").dataset.touched)$("#ocorners").checked=big;
    $("#ocorners").disabled=L==="coop";
    document.querySelectorAll('input[name=obig]').forEach(i=>{const no=L==="coop"||i.value==="long"&&!(L==="duel"||L==="team-same");i.disabled=no;i.closest(".opt").classList.toggle("off",no);if(no&&i.checked)document.querySelector('input[name=obig][value=""]').checked=true});
    document.querySelectorAll('input[name=omap][value=river]').forEach(i=>{i.disabled=L!=="duel";i.closest(".opt").classList.toggle("off",i.disabled);if(i.disabled&&i.checked)document.querySelector('input[name=omap][value=none]').checked=true});
    $("#dueldecks").hidden=L!=="duel";$("#ffadecks").hidden=!(L==="ffa"||L==="coop");$("#teamdecks").hidden=!L.startsWith("team");
    $("#elimset").hidden=(mode==="survival"?n:n)<(mode==="survival"?2:3);
    turnUp();mapUp&&mapUp();sumUp();
  };
  const turnUp=()=>{
    const t=$("#oturns"),many=humans()>1;
    if(many){t.value="classic";t.disabled=true;$("#turnnote").textContent="With more than one person on this device, play is always turn by turn."}
    else{t.disabled=false;if(!t.dataset.touched)t.value=mode==="local"?"classic":"prep";
      $("#turnnote").textContent=t.value==="classic"?"Each player takes the draw, prep and attack phases before the next player goes.":t.value==="prep"?"Everyone draws and preps at once; a shared phase ends when every player is Ready. Then each player attacks in turn.":"Every phase is played at once; each phase ends when every player is Ready."}
  };
  $("#oturns").addEventListener("change",()=>{$("#oturns").dataset.touched=1;turnUp()});
  $("#ocorners").addEventListener("change",()=>$("#ocorners").dataset.touched=1);
  $("#pcount").addEventListener("change",drawSeats);
  document.querySelectorAll('input[name=olayout]').forEach(i=>i.addEventListener("change",drawSeats));
  let mapUp=null;
  function sizeUp(){
    const L=layout(),box=$("#sizeother"),n=count();box.hidden=L==="duel";if(L==="duel"){box.innerHTML="";return}
    const sel=(id,label,opts,def)=>`<label class="f">${label} <select id="${id}">${opts.map(v=>`<option value="${v}" ${v===def?"selected":""}>${v}${v===def?" (default)":""}</option>`).join("")}</select></label>`;
    const rng=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
    if(L==="ffa"||L==="team-side"||L==="team-across")box.innerHTML=sel("osize","Size (tiles on each side)",rng(5,9),7)+'<p class="dim">The field is square so every edge is the same. On a phone, 7 is the largest size that stays easy to read.</p>';
    else if(L==="team-same")box.innerHTML=sel("ocols2","Width",[6,7,8],6)+sel("orows2","Height",[4,5,6],6)+'<p class="dim">Each team holds two lines at one end. Height 4 has no midline, 5 has one line between the teams, and 6 has two.</p>';
    else{const h=n,dc=h===2?6:h===3?9:8,dr=h===2?5:6;box.innerHTML=sel("ocols2","Width",rng(Math.max(5,h*2),9),dc)+sel("orows2","Height",[5,6],dr)+'<p class="dim">The survivors split the bottom two lines; the Horde holds the top two.</p>'}
  }
  const sumUp=()=>{
    const d=+val("odecks"),sp=val("ospecials"),js=$("#ojoker").checked,np=mode==="survival"?1:2;
    if(layout()!=="duel"){$("#decksum").textContent="";return}
    if(!$("#oeach").dataset.touched)$("#oeach").checked=d===1;
    $("#suitmode").hidden=d!==1;$("#suitpick").hidden=d!==1||val("osuitmode")!=="choose";
    const s=d===1?2:4,j=d===1?1:2,keptSp=sp==="all"?4*s+j:sp==="half"?4*s/2+Math.floor(j/2):0;
    const keptJ=sp==="all"?j:sp==="half"?Math.floor(j/2):0;
    const deck=9*s+keptSp-(keptSp?2:0)+(js&&!keptJ?1:0);
    const outPer=4*s+j-keptSp-(keptSp?0:2)-(js&&!keptJ?1:0);
    const ether=outPer*np+(d===3?54:0)+(d===1&&np===1?26:0);
    $("#decksum").textContent=`Each deck starts with ${deck} cards, plus the opening Ace and Jack on the field. The Ether starts with ${ether} souls to conjure.`;
  };
  $("#oeach").addEventListener("change",()=>$("#oeach").dataset.touched=1);
  document.querySelectorAll('input[name=odecks],input[name=ospecials],input[name=osuitmode],#ojoker').forEach(i=>i.addEventListener("change",sumUp));sumUp();
  mapUp=()=>{const rv=val("omap")==="river";$("#bridgeopt").hidden=!rv;$("#rivernote").hidden=!rv;
    document.querySelectorAll('#sizeduel input').forEach(i=>i.disabled=rv);};
  document.querySelectorAll('input[name=omap]').forEach(i=>i.addEventListener("change",mapUp));
  document.querySelectorAll('input[name=omoonon]').forEach(i=>i.addEventListener("change",()=>{for(const S of seatsS)if(skyBlocked(val("omoonon")).includes(S.tribe))S.tribe="random";drawSeats()}));drawSeats();
  $("#back").onclick=()=>{startMode=null;history.replaceState(null,"",location.pathname);showStart()};
  $("#go").onclick=()=>{
    const n=count(),L=layout();
    const used={};
    let players=seatsS.slice(0,n).map((S,i)=>{
      const cpu=S.type==="human"?null:S.type;
      let name=(S.name.trim()||`P${i+1}`).slice(0,20);
      return{name,tribe:S.tribe,color:S.color,solid:S.solid,accent:S.accent||"auto",cpu,arch:cpu&&cpu!=="horde"?S.arch||"random":null};
    });
    const blk=skyBlocked(val("omoonon")),bad=players.find(p=>blk.includes(p.tribe));if(bad){flash(`${TRIBES[bad.tribe].name} can't be played with that Heavenly Body in the sky.`);return}
    for(const t of Object.keys(TRIBES))if(t!=="random"&&t!=="beginner"&&players.filter(p=>p.tribe===t).length>1){flash(`Only one player can be ${TRIBES[t].name}. The Beginner is the only Substance more than one player can share.`);return}
    {const picked=players.filter(p=>!TRIBES[p.tribe].color&&p.color!=="random");if(new Set(picked.map(p=>p.color)).size<picked.length){flash("Every player needs a different color.");return}}   // Random finds a free color at the start
    if(L==="koth"&&$("#okteam").checked){players.forEach((p,i)=>p.team=seatsS[i].team?1:0);if(!players.some(p=>p.team===0)||!players.some(p=>p.team===1)){flash("Each side needs at least one player.");return}}
    if(L.startsWith("team")){ // seats alternate sides: A, B, A, B
      const A=players.filter((p,i)=>!seatsS[i].team),B=players.filter((p,i)=>seatsS[i].team);
      if(A.length!==2){flash("Each side needs two players.");return}
      players=[A[0],B[0],A[1],B[1]];
    }
    if(mode==="survival")players.push({name:"The Horde",color:HORDE_COLOR,solid:pick(Object.keys(SOLIDS).filter(s=>!players.some(p=>p.solid===s)))||"dodeca",cpu:"horde"});
    PREF.hand=val("dhand")||PREF.hand;PREF.sel=val("dsel")||PREF.sel;PREF.ctl=val("dctl")||PREF.ctl;PREF.theme=val("dtheme")??PREF.theme;PREF.coords=val("dcoord")==="1";PREF.full=val("dfull")==="1";PREF.lines=val("dlines")!=="0";if($("#danimc")){PREF.fxCards=$("#danimc").checked;PREF.fxMagic=$("#danimm").checked}PREF.bright=+($("#dbright")||{}).value||1;savePrefs();applyPrefs();
    startGame({mode,players,mid:mode==="survival"||(val("orowsd")?+val("orowsd")>4:true),aceLock:$("#olock").checked,fog:$("#ofog").checked,crystals:$("#ocrys").checked,barbarians:$("#obarb").checked,cheat:!!($("#ocheat")&&$("#ocheat").checked),hole:+$("#ohole").value,bankStart:$("#obank").checked,bloodStart:$("#oblood").checked&&(val("omoonon")||"on")==="on",eclipseStart:$("#oblood").checked&&!["on","off","saturn"].includes(val("omoonon")||"on"),
      map:L==="koth"?"hill":val("omap"),big:L==="koth"?"":val("obig")||"",koth:L==="koth"?{team:$("#okteam").checked,tug:$("#okteam").checked&&$("#oktug").checked,double:$("#okdouble").checked,contest:$("#okcontest").checked,target:+val("oktarget")||50,near:val("oknear")==="near",cpu:val("okcpu")||"each"}:null,cols:L==="duel"?+val("ocols"):$("#ocols2")?+$("#ocols2").value:undefined,rows:$("#orows2")?+$("#orows2").value:L==="duel"&&val("orowsd")?+val("orowsd"):undefined,size:$("#osize")?+$("#osize").value:undefined,corners:$("#ocorners").checked,bridge:val("obridge"),hq:!!($("#ohq")&&$("#ohq").checked),
      decks:+val("odecks"),specials:val("ospecials"),jokerSure:$("#ojoker").checked,suits:+val("odecks")===1&&val("osuitmode")==="choose"?[$("#osuitR").value,$("#osuitB").value]:null,
      startMana:$("#omana").value,manaEach:$("#oeach").checked,moonBonus:$("#omoon").checked,moon:val("omoonon")||"on",atkSpells:$("#oatk").checked,pshop:$("#opshop")?$("#opshop").checked:true,
      layout:L,turns:$("#oturns").value,timer:+$("#otimer").value,cpuSpeed:$("#ospeed").value,elimDark:val("oelim")==="dark",ffaDeck:val("offa"),shareDeck:$("#oshare").checked});
  };
}
function startGame(opts){
  ovHide();newGame(opts);applyMoonTheme();render();
  opening().catch(e=>{console.error(e);log("Error: "+esc(e.message))});
}
document.addEventListener("DOMContentLoaded",()=>{
  mountInfo();mountBar();applyPrefs();guardLinks();mountQuotes();showStart();
  $("#moon").addEventListener("click",()=>{if(G&&canAct()&&G.phase==="attack"&&G.sel&&moonAttackable(selStack())){attackMoon(G.sel.r,G.sel.c);G.mode=null;if(G.sel&&!G.board[G.sel.r][G.sel.c])G.sel=null;render()}});
  if($("#menubtn"))$("#menubtn").onclick=()=>{if(G&&!G.over)openMenu();else flash("Start a game first.")};
  $("#newgame").onclick=()=>confirmLeave(()=>{startMode=null;showStart()});
});
window.__EC={get G(){return G},startGame,stackLegal,canPlace,nextPhase,render,AI,SP,cast,SPELLS,hordeSpawn,roman,moonSVG,
  force(o){G.forceMoon=o},jokerSuicide,mk,damage,mkUnit,attack,attackOptions,doMove,seesTile,fogTile,ambushCheck,siegeTurn,siegeEnd,spawnCrystal,spawnBarbarians,meteor,collapse,takeLoan,repay,bankTurn,econRound,effMana:p=>effMana(p),spend,openBank,mysteryGen,skyTurn,firmFog,setPlanet,sunFall,planetTurn,skyAsync,tradeCard,eclipse:k=>eclipse(k),startPeace:(a,b)=>startPeace(a,b),startWar:(a,b)=>startWar(a,b)};
