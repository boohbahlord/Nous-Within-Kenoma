# ---------------------------------------------------------------- Ether's Crossroads
_parts = sorted(f for f in os.listdir("game/src") if f.endswith(".js"))
open(f"{OUT}/ethers-crossroads.js", "w").write(
    "/* Ether's Crossroads: local play for 2 to 4, versus the computer, and Survival.\n"
    "   Rules follow the written rules; where they leave a gap, the digital reading is listed on the\n"
    '   All Rules page under "How the digital table reads the rules". */\n(function(){\n"use strict";\n'
    + "const SUBST_TEXT="
    + open("game/text/substances.json").read().strip()
    + ";\n"
    + "\n".join(open("game/src/" + f).read() for f in _parts)
    + "\n})();\n"
)
EC = "Ether's Crossroads"
ec_cards = """<nav class="cards">
  <a class="card" href="ethers-crossroads-play.html">Play Game<span>Standard (computers and people on this device), Survival or Online</span></a>
  <a class="card" href="ethers-crossroads-play.html#settings">Settings<span>The game's look, sound and animations: the same as the Menu in a game</span></a>
  <a class="card" href="ethers-crossroads-rules.html">All Rules<span>Every rule, spell, moon phase and event</span></a>
</nav>"""
MODES_HTML = """<h2 id="modes">Game Modes</h2>
<h3>Standard</h3>
<p>Local play: against computers, together on this device, or both. Up to four people share one device, and every other seat is a computer: you against one to three computers, friends together against computers, or friends against each other, up to eight seats in King of the Hill. Each player picks an Emanation (or the host turns Emanations off), a color and a symbol, which marks every card they own. With more than one person, the board turns to face whoever is playing, and the screen goes dark between turns until the next player confirms they hold the device. Everyone sees every die.</p>
<h3>The computers</h3>
<p>The computers are written as plain code rather than a language model. Each round the computer weighs offense against defense from the field and the decks. <b>Easy</b> plays loosely and makes mistakes. <b>Medium</b> is balanced and a real fight. <b>Hard</b> plays the Joker for souls, stacks Aces for the Grave Blessing, keeps its own deck full and eats away at yours.</p>
<h3>Survival</h3>
<p>Tower defense for one to four players. You raise your Ace and its Jack, and the Horde comes: after three rounds of grace, a new wave every 1d2 + 2 rounds from a fresh deck, each one a step stronger, with Jacks, Queens and Kings from the sixth wave and Jokers from the eleventh; from then on it brings counter cards (Battering Rams for your Walls) when you lean on something it has no answer to. The Horde has no spells, hand or grave. The moon still turns. You lose when your last card on the field falls, and the round you reach is your score.</p>
<h3>Emanations</h3>
<p>An Emanation is what you play as. Each one changes your deck, your spells or your limits. <a href="ethers-crossroads-rules.html#substances">Every Emanation in full</a>.</p>
<dl class="subtags">@@SUBTAGS@@</dl>
<h3>More players, maps and options</h3>
<p>With three or four players the field is a 7 by 7 square by default: free-for-all, or two against two with teammates side by side, across, or sharing one end. The battle maps are the Keep, the Sahel, the Forest, the Dungeon and the River, all at night. Before a game you can set the field size, the decks, the specials, the starting mana, the sky, the Bank, Demons, crystals, fog of war and more. <a href="ethers-crossroads-rules.html#modes">Every option</a>.</p>
"""
import json as _json

_S = _json.load(open("game/text/substances.json"))
_N = {
    "angel": "Angel Machine",
    "satan": "Satan",
    "binah": "Binah",
    "jester": "Jester Fool",
    "tiph": "Tiphareth of Kether",
    "lucifer": "Lucifer &amp; Ouroboros",
    "leviathan": "The Leviathan",
    "firm": "The Firmament",
    "yald": "Yaldabaoth",
}
MODES_HTML = MODES_HTML.replace(
    "@@SUBTAGS@@",
    "".join(f'<dt>{n}</dt><dd>{_S[k]["tag"]}</dd>' for k, n in _N.items()),
)
land = (
    head(
        EC + " · Nous Within Kenoma",
        extra="<style>" + open("game/text/rules.css").read() + "</style>",
        ec=True,
    )
    + f"""<main class="wrap rules">
<nav class="crumbs"><a href="index.html">← Nous Within Kenoma</a></nav>
<header><span class="num">A card game</span><h1>{EC}</h1></header>
{ec_cards}
<h2>Getting Started</h2>
<p>{EC} is a card game for two or more players, played with ordinary playing cards and dice. You can play it here in the browser, or at a table with real cards. At a table, every player needs their own deck with both Jokers, and you need a d2, d4, d6, d8, d12 and d20 between you.</p>
<p>Your cards are your army, and the dice settle every fight. When a card dies it goes to the grave, which everyone shares. When you sacrifice a card it becomes a soul, and souls are the mana you spend on spells. The moon moves one phase every round, and some phases help you while others cost you.</p>
<h3>Setting up</h3>
<p>Take the Ace and a Jack out of your deck. Put the Ace on any tile of your spawn lines and the Jack inside it. Shuffle, then draw 2d4 cards. You can never hold more than six.</p>
<p>Everyone rolls. Whoever rolls highest sets up first, putting any opening cards on their own two lines, and also takes the first turn.</p>
<h3>Your turn</h3>
<p>A turn has two phases, prep and then attack.</p>
<p>Prep starts with drawing. Roll a d4 and draw that many cards, and do it again as often as you like. Cards that don't fit in your hand go to the grave, and then you can't draw again that turn. After drawing you can place cards, move them, sacrifice them and cast spells. Do your sacrificing before you spend anything, because once you spend mana you can't sacrifice again until your next prep.</p>
<p>In the attack phase each of your stacks can attack once.</p>
<p>The player who goes first doesn't draw on the first turn of the game.</p>
<h3>Fights</h3>
<p>A stack fights with its best card, the card's value plus a die. Piling cards into a stack doesn't add them together, but each card is one more hit the stack can take before it's gone.</p>
<h3>Souls and mana</h3>
<p>Your soul pile holds up to six mana. A card sacrificed from the field is worth its soul. A card from your hand is worth its Ether price, minus 1d2, plus 1, and a card that costs 1 is always worth 1. You spend this on spells. Grave Blessing is free once a round and lets you roll to bring the dead back.</p>
<h3>The moon</h3>
<p>The New Moon gives cards back from the grave. The Full Moon takes a stack of two, or a card, or 2d2 + 2 mana. Every so often the Full Moon turns into a Blood Moon.</p>
<h3>Winning</h3>
<p>You win when the other side has nothing left on the field, or when they finish a turn with no deck, no hand and no souls.</p>
<p>Everything else is in All Rules, from what each card does to every spell and moon event. Play Game starts a game right here.</p>
{MODES_HTML}
</main>
"""
    + TAIL
)
open(f"{OUT}/ethers-crossroads.html", "w").write(land)

RULES_CSS = "<style>" + open("game/text/rules.css").read() + "</style>"
rules = (
    head("All Rules · " + EC, extra=RULES_CSS, ec=True) + f"""<main class="wrap rules">
<nav class="crumbs"><a href="ethers-crossroads.html">← {EC}</a><a href="ethers-crossroads-play.html">Play Game →</a></nav>
<header><span class="num">{EC}</span><h1>All Rules</h1></header>
@@RULES_INDEX@@

<h2>How to Start</h2>
<ul>
<li>Every player starts with one Ace from their own deck already on the field, on any tile of their spawn lines they choose. Every Ace spawns with one Jack from that player's deck inside it, wherever it is placed. Which Ace or Jack doesn't matter.</li>
<li>First when starting, draw 2d4 cards for both sides.</li>
<li>Second, both players roll dice; whoever goes first by highest roll will set up their cards on the field first, then the second player places their cards on the field.</li>
<li>Third, the one with the highest roll takes the first game-starting turn, with the <b>prep phase</b> as the first part of this turn. The player will be able to move cards, place cards, or even sacrifice cards, and during this prep phase, the starting player's attack will not happen yet.</li>
<li>The other player can now be attacked; this is the <b>attack phase</b>, and the attacker cannot move their cards, place their cards, or sacrifice during this phase. After, this is the end of the first player's turn.</li>
<li>The second player at the start of their turn has an <b>optional draw card phase</b>: roll a d4 as many times as wanted, and the dice result tells how many cards to draw. When doing this optional phase, you cannot place cards, move cards, sacrifice cards, or attack.</li>
<li>What follows is the <b>prep phase</b>; the player can move cards, place cards, or sacrifice cards, but cannot attack during this phase.</li>
<li>Last is the final phase of the turn, and no actions from the prep phase can be taken during it: the <b>attack phase</b>. Each card can only attack once.</li>
</ul>
<p>The players should use this pattern each turn:</p>
<p class="formula flow">Prep Phase (optional drawing first) → Attack Phase</p>
<ul>
<li>As many times as desired, roll four-sided dice to optionally draw cards.</li>
<li>Move cards. Place cards. Sacrifice cards.</li>
<li>Attack enemy cards on the field; each card can only attack once.</li>
</ul>

<h2>Major Rules</h2>
<p>There are two ways to beat a player, and the last side standing wins:</p>
<ul><li><b>Domination</b>: every card the player has on the field is destroyed (in Headquarters, every base). Zero cards on the field and they are out.</li>
<li><b>Economic victory</b>: the player sinks below the lowest mana allowed, −8 (−12 under the Oath of Jupiter). Mana can go below zero, through debts, tolls and an empty deck, down to that floor; one more mana below it (−9) and the Bank takes everything, and they are out.</li></ul>
<p>Running out of cards in the deck, the hand and the soul pile doesn't end a player's game by itself: the deck is not a player's life. An empty deck only means there is nothing left to draw (your own draw roll takes just what is left, never mana).</p>
<p>Certain rules can be changed as desired, such as the cards present in the Ethereal Realm, or the number of cards in the players' hands.</p>

<h2>Game Setup</h2>
<h3>The Field</h3>
<table>
<tr><td>Soul Pile</td><td>(enemy, top)</td></tr>
<tr><td>Enemy's Hand · Deck</td><td></td></tr>
<tr><td>Enemy Backline</td><td></td></tr>
<tr><td>Enemy Frontline</td><td></td></tr>
<tr><td>Midline / Midland</td><td>optional; can be removed</td></tr>
<tr><td>Player's Frontline</td><td></td></tr>
<tr><td>Player's Backline</td><td></td></tr>
<tr><td>Player's Hand · Deck</td><td></td></tr>
<tr><td>Soul Pile</td><td>(player, bottom)</td></tr>
</table>
<p>Beside the field lie the <b>Graveyard</b> and the <b>Ethereal Realm</b>.</p>
<ul>
<li><b>The Ethereal Realm</b> is a realm of form that can be a source of summoning, conjuring, or materialization. Spend or offer mana to summon souls into the material realm.</li>
<li><b>The grave</b> is where dead souls sleep in their corpse, waiting to be set free. This is where sacrificed souls go after being spent of their mana, or where dead cards lie trapped and bound to their flesh. The grave is shared.</li>
</ul>

<h2>Dice and Points of Cards</h2>
<p>Note: a stack of cards takes the highest-scoring card as its total.</p>
<h3>Scores</h3>
<p>Every card's die is its Dice Max (DM), the same number the stacking formula uses, so the scores and the stacking limits always agree.</p>
<table>
<tr><th>Card</th><th>Score</th></tr>
<tr><td>2–6 (Grunts)</td><td>Natural point value + 1d6</td></tr>
<tr><td>7–10 (Infantry)</td><td>Natural point value + 1d8</td></tr>
<tr><td>Jack</td><td>10 + 1d12</td></tr>
<tr><td>Queen</td><td>0, no die of her own</td></tr>
<tr><td>King</td><td>11 + 1d20</td></tr>
<tr><td>Ace</td><td>11, + 1d20 when it defends</td></tr>
<tr><td>Joker</td><td>Copies the score and dice of the enemy (only when not stacked)</td></tr>
</table>
<p>Modifiers are used for offense; on defense a card counts its natural value, unless a Queen is in the stack. When writing scores by hand, mark 6s and 9s so they can be told apart.</p>
<h3>Dice values of cards</h3>
<table>
<tr><th>Card</th><th>Die and role</th></tr>
<tr><td>2–6</td><td>1d6; Grunts</td></tr>
<tr><td>7–10</td><td>1d8; Infantry</td></tr>
<tr><td>Jack</td><td>1d12; Knights. Can travel two adjacent spaces, or spend two movements to travel diagonally.</td></tr>
<tr><td>Queen</td><td>No dice. Prevents any advantage or disadvantage of being surrounded when with the Queen.</td></tr>
<tr><td>King</td><td>1d20. A 20 grants double damage on attack or defense; if the enemy has more or equal score, then don't receive one damage. A 1 causes no damage on attack where you have the higher attack score; if your attack is an equal or lower score, take two damage. Queens prevent all drawbacks of rolling a 1 when stacked with the King.</td></tr>
<tr><td>Ace</td><td>1d20. Cannot attack, and only uses its die when attacked; no penalty for 1s besides no damage done.</td></tr>
<tr><td>Joker</td><td>Copies the score and dice of the enemy when alone; Jokers cannot kill Jokers. Collects the souls of cards destroyed next to it with Soul Capture, and can redeem them by ending itself, which puts the Joker in the grave and moves its stolen souls into the soul pile for spending.</td></tr>
</table>

<h2>Card Roles and Stacking</h2>
<h3>2–10: Soldiers</h3>
<ul><li>2–6 are Grunt soldiers; 7–10 are Infantry soldiers.</li><li>Grunts stack to four (24 ÷ 6) and Infantry to three (24 ÷ 8), or any mix whose dice add up to 24 or less.</li></ul>
<h3>Jacks</h3>
<ul><li>A Jack can only stack with two Grunts, one Infantry, or one other Jack (12 + 12 = 24).</li><li>Jacks can move two spaces, or use both for a diagonal.</li><li>Jacks cannot defend.</li></ul>
<h3>Queens</h3>
<ul><li>A Queen has no Dice Max, so she adds nothing to the stacking sum: she can join four Grunts, three Infantry, or a King with the one soldier he can hold.</li><li>Anyone stacked with the Queen gets modifiers for both offense and defense.</li><li>The Queen can use her modifier for both offense and defense.</li><li>The special abilities of Queens do not stack with other Queens, and they do not work in base or spawn mode.</li></ul>
<h3>Kings</h3>
<ul><li>Cards of the King's suit can be placed inside a King when defending.</li><li>A King has a DM of 20 and an MSV of 28, so he holds one Grunt or one Infantry at most (20 + 8 = 28).</li><li>A Joker can stack with the King, with his one soldier or without.</li><li>Cannot attack when defending while alone.</li><li>Cannot be sacrificed on the field when stacked in offensive stance.</li><li>A Queen can stack with a King, granting the Queen's bonuses. A Joker can also be stacked here, but only with a King present.</li><li>When successfully defeated in defensive placement mode, all units die.</li><li>Jokers can only spawn on a King of the same color.</li></ul>
<h3>Joker (Necromancer)</h3>
<ul><li>Any enemy killed next to the Joker goes to its sacrifice pile (Soul Capture): an upside-down stack inside the Joker, its personal sacrifice pile.</li><li>Has no Dice Max, so it can stack with four Grunts, three Infantry, one King, a King and Queen, or a King with his one soldier.</li><li>When the Joker sacrifices himself, the player gains access to its sacrifice pile.</li><li>The Joker's personal sacrifice pile holds up to six, though players can change this for balance.</li><li>A captured soul stays inside the Joker until the Joker dies, when the Joker and its souls go to the grave, or until it uses Sacrificial Suicide.</li><li>If the Joker is defeated by enemies, its cards go to the grave pile.</li><li>If a Joker kills itself during a Blood Moon, it sends itself and every card it held to the Outer Darkness.</li><li>Can only spawn on a card of the same color (red or black).</li></ul>
<h3>Ace</h3>
<ul><li>Each player opens the game with one Ace in their spawn lines, holding one Jack, with a Miner already in it (that first Ace only; an Ace holds as many Miners and Repairmen as you like).</li><li>Cannot move or attack, and is always in defense.</li><li>Can only be placed in open tiles in the backlines.</li><li>Anything inside an Ace cannot use modifiers for defense.</li><li>An Ace holds one stack inside it: up to six cards that could stand together on the field (Scouts, Healers, Repairmen and Miners ride along). Every base works the same way.</li><li>If an Ace is destroyed, all cards inside are destroyed.</li><li>Cannot be sacrificed while on the field.</li><li>Each Ace on the field grants +1d6 for pulling cards from the grave.</li></ul>
<h3>Optional Ace rule</h3>
<p>Card placement inside Aces can be locked to only the Ace's color (red, black) or suit (diamonds, spades, hearts, clubs).</p>

<h2>Maximum Stack Value and Dice Max</h2>
<table>
<tr><th>Card</th><th>Dice Max (DM)</th><th>Maximum Stack Value (MSV)</th></tr>
<tr><td>Grunts</td><td>6</td><td>24</td></tr>
<tr><td>Infantry</td><td>8</td><td>24</td></tr>
<tr><td>Jack / Knight</td><td>12</td><td>24</td></tr>
<tr><td>King</td><td>20</td><td>28; anyone with a lower MSV adopts the King's MSV when mixing stacks</td></tr>
<tr><td>Queen</td><td>none</td><td>none</td></tr>
</table>
<p>Each card type has an MSV that limits its stacking based on its DM. Calculate how many cards can stack by dividing MSV by DM. For Grunts:</p>
<p class="formula">MSV ÷ DM = 24 ÷ 6 = 4 (allowing four Grunts)</p>
<p><b>Mixed stacks:</b> different cards can stack together if their combined value doesn't exceed the highest MSV. The card in a stack with the highest MSV sets the MSV for the formula.</p>
<p><b>Stack Limit (SL):</b> the most cards of a type that can be stacked, found by dividing the MSV by the DM for that type, or for the combined value of a mixed stack.</p>
<p class="formula">Σ DM ≤ MSV</p>
<p>where Σ DM is the sum of the dice max values of every card in the stack, and MSV is the Maximum Stack Value of the highest card in the mixed stack.</p>

<h2>Hand Rules</h2>
<ul><li>Only six cards are allowed in a player's hand.</li><li>Cards drawn over the hand limit go to the grave pile. Once a draw roll overdraws, no more draw rolls that turn.</li><li><b>Overdrawing:</b> every card that is drawn and goes to the grave because the hand is full takes one die off that round's Grave Blessing maximum, so a maximum of six dice drops to five. The Grave Blessing shows the count as <b>−{{n}}d6 max</b>; past six it turns bold and red (7, 8, and so on) and the rest carries over: overdraw 7 cards and you have no Grave Blessing this round and −1d6 next round; past 12 it carries into the round after that, and so on. It only happens when there were cards in your deck to lose.</li><li>Cards can only be placed in their respective card spawn, such as Aces or Kings.</li><li>Cards in hand, or certain cards on the field, can be sacrificed during the sacrificial part of the prep phase.</li></ul>

<h2>Sacrificial Rules</h2>
<p><b>Soul currency:</b> each player has a pile of face-down sacrificed cards used as currency for mana, or soul points. This pile of publicly revealed cards owned by the player can be spent during the sacrificial part of the prep phase. The pile holds six mana at most.</p>
<table>
<tr><th>Soul</th><th>Mana</th></tr>
<tr><td>Soldiers (2–10), Jacks, Jokers</td><td>1</td></tr>
<tr><td>Queen, King</td><td>2</td></tr>
<tr><td>Ace</td><td>3</td></tr>
</table>
<p><b>Order of the sacrificial part of prep:</b> sacrifices first, spending mana second. Before spending, there is the free spell Grave Blessing.</p>

<h2>Spells</h2>
<h3>Necromancy</h3>
<ul>
<li><b>Grave Blessing</b> (free): roll 1d6; each natural 6 raises one card from the grave. Add +1d6 per Ace on the field, or more with Ritual Dice; 6 dice at most per round.</li>
<li><b>Ritual Dice</b> (1 mana): roll an additional 2d6 for your Grave Blessing.</li>
<li><b>Sacrificial Suicide</b>: by default (the Rules option, on), the souls the Joker captured fall into the Outer Darkness, their worth comes to the player as mana, and the Joker goes back into the player's deck. With the option off, the Joker sacrifices its soul to the grave and all the souls it captured move into the player's soul pile for spending; a Joker can hold six cards and six mana of souls in all, and any surplus goes to the grave.</li>
<li><b>Soul Capture</b>: the Joker captures the souls of enemies that die or are killed next to it, up to six mana of souls. They are not available to its player until Sacrificial Suicide. If the enemy kills the Joker, its souls are released into the graveyard, unless an enemy Joker is there to capture them.</li>
<li><b>Resurrection</b> (1d2 + 1 mana): the grave is shuffled, then choose one card from it and bring it back into your hand.</li>
<li><b>Flesh Severance</b>: because body and soul are two in this game, the Joker can spend mana from the soul pile to disembody the soul of a unit killed next to it, exiling its form to the Ethereal Realm. This is the player's choice, and it costs half the price to summon the units severed that turn, rounded up: severing a 2-mana and a 1-mana unit costs 2.</li>
</ul>
<h3>Enchantments</h3>
<ul><li><b>Hypostasis</b> (3 mana for one card, +1 for every more card in the stack): grants a stack temporary invulnerability for two rounds. During it the stack can't move forward toward the enemy's side, only to the side or backward if the stack's movement allows, and it can't attack. Afterward the effect disappears and the stack returns to its normal rules. It can't be cast if you have only one stack or card on the board.</li>
<li><b>Divine Odds</b> (1d2 + 1 mana): advantage on all modifiers of one of your stacks for one combat. Mark the cards with a coin or chess piece. Advantage means rolling the dice twice and taking the higher total.</li></ul>
<h3>Curses</h3>
<ul>
<li><b>Forced Hand</b> (1d2 mana): the other player draws 1d2 cards; any over their hand limit go straight to the grave.</li>
<li><b>Hexed Odds</b> (1d2 + 1 mana): disadvantage on all modifiers of one enemy stack for one combat. Disadvantage means rolling twice and taking the lower total.</li>
<li><b>Three of Swords</b> (1d3 mana): roll 1d2. A 1 destroys one random card from the enemy's hand and one from your own; a 2 destroys two from each. If you have nothing in your hand, you lose that many cards from your deck instead; the enemy loses nothing from the deck if their hand is empty.</li>
<li><b>Double Edged Sword</b>: roll 3d6. A 1 means the caster loses a card from their deck; a 6 means the target loses a card from their deck. Only works against the deck.</li>
</ul>
<h3>Sorcery</h3>
<ul>
<li><b>Clairvoyance</b> (2 + 1d2 mana): pull 2d6 cards from your deck and look at them; choose one to put in your hand or place on the board, then reshuffle. The number pulled is limited by the size of your deck.</li>
<li><b>Naked Hand</b> (1d2 mana): reveals the other player's hand, and tells both players the cards have been seen. It costs 6 at the New Moon, nothing at the Full Moon, and 1 under a Blood Moon.</li>
<li><b>Teleport</b> (1d2 − 1 mana, rolled each round, so half the time free): a card leaves the field now and comes back into your hand at the start of your next turn. You must have room in your hand, no enemy next to it, and it must be in your own lines.</li>
</ul>
<p><b>Rolled prices:</b> a price written with dice is rolled behind the scenes at the start of each round, once for everyone, and that price holds for the whole round; the spell list shows it and the log lists the new prices. The moon's prices replace the roll only while their phase lasts: Clairvoyance costs 6 at the New Moon and 2 at the Full Moon; Naked Hand costs 6 at the New Moon, nothing at the Full Moon and 1 under a Blood Moon.</p>
<h3>Conjuring and Summoning</h3>
<table>
<tr><th>Spell</th><th>Cost</th></tr>
<tr><td>Soldier Conjure</td><td>1 mana</td></tr>
<tr><td>Jack Conjure</td><td>1 mana</td></tr>
<tr><td>Joker Conjure</td><td>2 mana</td></tr>
<tr><td>Queen Conjure</td><td>2 mana</td></tr>
<tr><td>King Conjure</td><td>2 mana</td></tr>
<tr><td>Ace Conjure</td><td>3 mana</td></tr>
</table>
<p>Each conjure purchases a soul to materialize into your deck from the Ethereal Realm. In Play Game, conjuring happens in <b>the Ether</b>: open it from the top of the Conjuring spells to see every card you can conjure by type, cheapest first, and every soul waiting there.</p>
<h3>Commons</h3>
<p>The Bank, Diplomacy and Lazy Hand are the <b>commons</b>: not spells, but open to every player beside the spells. In the spell bar at the bottom of the screen (F on the keys) they have a school of their own, <i>Common</i>, and their numbers open them like spells (1 the Bank, then Diplomacy when it is on, then Lazy Hand).</p>

<h2 id="moon">The Moon</h2>
<p>Every round sits under one phase of the moon, shown at the top of the table. A round is one turn for each player, every turn with all its phases (draw, prep, attack); when every player has finished their turn, the moon moves to its next phase, in this order, and then it repeats:</p>
<p class="formula flow">New Moon → Waxing Crescent → First Quarter → Waxing Gibbous → Full Moon → Waning Gibbous → Last (Third) Quarter → Waning Crescent</p>
<h3>New Moon</h3>
<ul><li>Players get to choose 1d2 cards from the grave for free.</li><li>Clairvoyance and Naked Hand cost six mana, and their spell options turn dark grey.</li></ul>
<h3>Full Moon</h3>
<ul><li>Each player is asked for a random stack of two cards; with none, a random card from the field; with nothing on the field to take, three cards from their shuffled deck. Given, they go to the soul pile. Refused, it costs 2d2 + 2 mana, which can take you below zero.</li><li>All decks are shuffled.</li><li>No one can draw cards or cast necromancy spells.</li><li>Naked Hand is free and Clairvoyance costs only two mana; both turn a bright grey, the color of the Full Moon.</li></ul>
<h3>Blood Moon</h3>
<ul><li>Every Full Moon may turn into a Blood Moon. The moon turns red, and so does every necromancy spell, and the table turns the crimson of the Disturbed Satan chapter and starts to glitch.</li><li>New Moon effects take place: players pick cards from the grave. The Full Moon's drawbacks (the toll, the shuffle, no drawing, no necromancy) are void, but its cheaper prices stay.</li><li>Every card killed during the Blood Moon is sent to the <b>Outer Darkness</b> and can never be returned. A Joker that kills itself during it sends all the cards it held to the Outer Darkness.</li></ul>
<h3>The Outer Darkness</h3>
<p>Cards in the Outer Darkness can be viewed at any time, in a box the red of the Disturbed Satan chapter. Each card carries the symbol of the player it belonged to at the time of its death.</p>
<h2 id="digital">How the digital table reads the rules</h2>
<p>Some rules leave room for the players to decide. Play Game uses these readings:</p>
<ul>
<li>In Standard, two to four players share one device; the screen goes black between turns until the next player confirms, and the board turns so the player at the device always sits at the bottom. With one person at the device, that person always sits at the bottom. Hands show face down to the other side unless Naked Hand reveals them.</li>
<li>The field is five tiles wide by default, or six or seven. It is five lines tall with the midline (the default) and four without it. Survival always keeps the midline. Three and four players use a 7 by 7 field (corners cut by default) where each player's back line is their whole edge; two against two on the same side uses 6 by 6, two lines and three columns for each player.</li>
<li>When play is together, the computers take their phase first and you play yours after; the shared phase ends when you press Ready. Spells that pick one player (Forced Hand, Double Edged Sword, Three of Swords, Naked Hand) ask which opponent when there is more than one, and Naked Hand shows that one hand only, to the caster and the caster's team.</li>
<li>Cut corners remove the four corner tiles from play. Nothing can stand on a removed tile or the river, and a Jack cannot leap over them; the only way across the River map is its two-tile bridge.</li>
<li>The opening roll is a d6 each, rerolled on a tie. Each player's Ace and Jack are taken out of the deck before the opening 2d4 hand is drawn, and the Ace is placed during setup, before any other opening cards. The first turn of the game has no draw phase.</li>
<li>Scores use the Dice Max of each card: 2–6 roll d6, 7–10 roll d8, Jacks d12, Kings and Aces d20. Natural values are the card's number, Jack 10, King 11, Ace 11, Queen 0.</li>
<li>Stacking follows the MSV and DM formula, with one Queen and one Joker per stack at most. Every base (Ace, Tree, Wall, Lighthouse) holds one stack inside it: up to six cards that could stand together on the field, with Scouts, Healers, Repairmen and Miners riding along. Where an older line of the rules gave a different number (soldiers stacking to three, three soldiers with a King, a d12 for the King), the MSV, DM and SL formula decides.</li>
<li>A stack's score is its best card. Dice add on attack. On defense, cards use their natural value only, unless a Queen is in the stack; an Ace stack defends with the Ace's 11 + d20. Jacks don't count on defense.</li>
<li>If the attacker's total is higher, the defender takes one damage; otherwise the attacker takes one. Each damage removes the stack's lowest card, or a heart from a card that has hearts. Every Ace has two hearts: the first hit takes a heart and the cards inside are safe; when the last heart goes, the Ace falls with everything inside it. A Repairman can give an Ace a third heart, once. King and Ace rolls of 20 and 1 change the damage as written above. The dice box shows the attack total on the left and the defense total on the right, like 12&gt;1.</li>
<li><b>The landing roll</b>: in every fight both sides also roll 1d20. The attacker's 1 is a <b>Crit Miss</b>: the attack misses. The attacker's 20, with two or more cards in the stack that can each attack, is a <b>Crit Hit</b>: the defender takes the blow whatever the scores, unless it rolls a 20 too. A defender's 1 costs it nothing. Three or more Puppets in a stack crit on 19 or 20; Puppets never miss and shrug off Crit Hits. Assassins shrug off Crit Hits and dodge on 17 to 20 of their own roll (a <b>Miss</b>). Every player sees the Crit Hit, Crit Miss or Miss on screen.</li>
<li><b>Dice Plus</b> (Enchantment, 1d3 mana): on one of your stacks, a sword (its next attack) or a shield (its next defense) adds a d12 on this table: 1: +1 · 2: +1d2 · 3: +1d3 · 4: +1d4 · 5–6: +1d6 · 7–9: +1d8 · 10: +1d10 · 11: +1d12 · 12: two more d12 on the table, and every 12 rolls again. Once on a stack; as many stacks as you like. The stack glows orange (sword) or purple (shield).</li>
<li><b>Spells on a stack</b>: their names show in faint blackletter at the bottom of the stack, and how long they last (and their odds) at its top right.</li>
<li>Cards are placed from the hand into your own spawn lines: on an empty tile, or onto your own stack if the stack stays legal. Your spawn lines are your backline and frontline; on a field 5 wide and 5 tall or smaller they are your backline alone. Teammates on the same side may spawn on each other's lines. Aces go only on empty backline tiles; Jokers spawn onto your stack holding a card of the same color.</li>
<li>Each stack moves once per round, one tile straight. A group made only of Jacks moves two tiles straight or one diagonal. You can split a stack by choosing which cards move.</li>
<li>Stacks attack an enemy stack next to them (not diagonal, except Jack-only stacks). Aces and a King standing alone don't attack.</li>
<li>Paying mana spends your smallest souls first; any mana overpaid is lost, and spent souls go to the grave. Sacrifices happen before any mana is spent, and the Grave Blessing must come before spending too (Ritual Dice excepted).</li>
<li>A Joker's captured souls hold six mana at most. Double Edged Sword has no listed cost, so it costs 1 mana here.</li>
<li>The Ether is shared. It holds every special the players do not start with, the unused half of the deck in a one-deck Survival game, and the whole third deck in a three-deck game. A conjure takes a random soul of that kind from it, and Flesh Severance sends exiled souls back into it. A conjure whose kind is not in the Ether cannot be cast. Starting mana takes soldier souls from it; when it has none, new soldier souls are made.</li>
<li>Overdrawing counts every card burned by a full hand, including draws forced by Forced Hand, but not the opening hand. At the end of each round six of the count are used up and the rest carries on.</li>
<li>Resurrection brings the card into your hand. Three of Swords destroys cards into the grave (or the Outer Darkness under a Blood Moon). Naked Hand lasts until the caster's turn ends.</li>
<li>Hypostasis lasts two rounds and ends at the start of your second turn after casting. A stack under it can't be targeted by attacks or by the Full Moon's toll.</li>
<li>The moon moves one phase each round, at the start of the first player's turn. Its New Moon gift and Full Moon toll reach both players at the start of the round, the first player first; the moon's prices, draw ban and Blood Moon last the whole round, and the spell prices apply to whoever casts that turn.</li>
<li>The Full Moon never takes a card inside an Ace or under Hypostasis. What is given goes to the soul pile up to your maximum; the rest goes to the grave.</li>
<li>Not yet in the digital table: the Queen's protection from being surrounded, and placing same-suit cards inside a defending King. A King can't be sacrificed from a stack that holds other cards.</li>
</ul>

@@RULES_MODES@@
<h2 id="events">Events and their rarity</h2>
<table>
<tr><th>Event</th><th>Chance</th><th>What it does</th></tr>
<tr><td>New Moon</td><td>every 8 rounds</td><td>Players choose 1d2 cards from the grave for free. Clairvoyance and Naked Hand cost 6 mana.</td></tr>
<tr><td>Full Moon</td><td>every 8 rounds</td><td>Give a random stack of two (or a card, or three deck cards), or pay 2d2 + 2 mana. Decks shuffle; no drawing or necromancy. Naked Hand is free, Clairvoyance costs 2.</td></tr>
<tr><td>Blood Moon</td><td>5% of Full Moons</td><td>New Moon gifts with Full Moon prices and no Full Moon drawbacks. Every card killed goes to the Outer Darkness, and a Joker's suicide sends it and its cards there too. The table turns crimson and glitches.</td></tr>
</table>
</main>
""" + TAIL
)
rules = rules.replace("@@RULES_MODES@@", open("game/text/rules_modes.html").read())
# an index like the site's index pages: every section numbered, with the parts of Game types and rule options under it
import re as _re


def _slug(t):
    return _re.sub(r"[^a-z0-9]+", "-", _re.sub(r"<[^>]+>", "", t).lower()).strip("-")


_toc = []


def _h2(m):
    hid = m.group(1) or _slug(m.group(2))
    _toc.append([hid, _re.sub(r"<[^>]+>", "", m.group(2)), []])
    return f'<h2 id="{hid}">{m.group(2)}</h2>'


rules = _re.sub(r'<h2(?: id="([^"]+)")?>(.*?)</h2>', _h2, rules)
for m in _re.finditer(r'<h3 id="([^"]+)">(.*?)</h3>', rules):
    for t in reversed(_toc):
        if rules.find(f'id="{t[0]}"') < m.start():
            t[2].append((m.group(1), _re.sub(r"<[^>]+>", "", m.group(2))))
            break
# v72c: every part of the rules gets a code, numbers and letters by turns: 3 (a section), 3.B (its part), 3.B.4 (an entry),
# 3.B.4.c (an entry under that). Headings share a level's count with the list entries beside them; nested lists get none.
_L = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"


def _lv(n, depth):
    return (
        str(n)
        if depth % 2 == 0
        else (_L[(n - 1) % 26] if depth == 1 else _L[(n - 1) % 26].lower())
    )


_codes = {}


def _code_rules(html):
    out = []
    pos = 0
    path = []
    cnt = [0]
    ldepth = 0
    hlev = 0
    tok = _re.compile(r"<(/?)(h2|h3|h4|ul|ol|li)\b([^>]*)>")
    level = {"h2": 0, "h3": 1, "h4": 2}
    for m in tok.finditer(html):
        close, tag, attrs = m.group(1), m.group(2), m.group(3)
        if tag in ("ul", "ol"):
            if 'class="toc"' in attrs or 'class="subtoc"' in attrs:
                continue
            ldepth += -1 if close else 1
            continue
        if close:
            continue
        if tag in level:
            if 'class="label"' in attrs:
                continue
            d = level[tag]
            if d > len(path):
                d = len(path)  # an h4 straight under an h2 takes the next level
            path = path[:d]
            cnt = cnt[: d + 1]
            cnt[d] = cnt[d] + 1 if len(cnt) > d else 1
            path.append(_lv(cnt[d], d))
            cnt.append(0)
            code = ".".join(path)
            idm = _re.search(r'id="([^"]+)"', attrs)
            new = f'<{tag}{attrs if idm else attrs + " id=" + chr(34) + "r-" + code.replace(".", "-") + chr(34)} data-rcode="{code}"><span class="rcode">{code}</span> '
            _codes[idm.group(1) if idm else "r-" + code.replace(".", "-")] = code
            out.append(html[pos : m.start()])
            out.append(new)
            pos = m.end()
            continue
        if tag == "li" and ldepth == 1 and path:
            d = len(path)
            while len(cnt) <= d:
                cnt.append(0)
            cnt[d] += 1
            code = ".".join(path + [_lv(cnt[d], d)])
            rid = "r-" + code.replace(".", "-")
            out.append(html[pos : m.start()])
            out.append(
                f'<li{attrs} id="{rid}" data-rcode="{code}"><a class="rcode" href="#{rid}" title="Rule {code}: a link to it">{code}</a> '
            )
            pos = m.end()
    out.append(html[pos:])
    return "".join(out)


_mi = rules.index("<main")
rules = rules[:_mi] + _code_rules(rules[_mi:])
_idx = (
    '<nav class="rindex" id="index" aria-label="Contents"><h2 class="label">Index</h2><p class="dim rcodehelp">Every rule has a code: a number for each section, a letter for its parts, then numbers and letters by turns (3.B.4). Click a code to link to it.</p><ol class="toc">'
    + "".join(
        f'<li><a href="#{h}"><span class="n">{_codes.get(h, i + 1)}</span><span>{t}</span></a>'
        + (
            '<ol class="subtoc">'
            + "".join(
                f'<li><a href="#{a}"><span class="n">{_codes.get(a, "")}</span> {b}</a></li>'
                for a, b in subs
            )
            + "</ol>"
            if subs
            else ""
        )
        + "</li>"
        for i, (h, t, subs) in enumerate(_toc)
    )
    + "</ol></nav>"
)
rules = rules.replace("@@RULES_INDEX@@", _idx)
rules = rules.replace(
    "</main>",
    """<a class="totop" href="#index" hidden>↑ Index</a>
<script>(function(){var b=document.querySelector(".totop"),i=document.getElementById("index");if(!b||!i)return;
function f(){b.hidden=i.getBoundingClientRect().bottom>0}addEventListener("scroll",f,{passive:true});f();
b.addEventListener("click",function(e){e.preventDefault();i.scrollIntoView({behavior:"smooth"});history.replaceState(null,"","#index")})})();</script>
<script>"""
    + open("game/text/rules_reader.js").read()
    + """</script>
</main>""",
    1,
)
open(f"{OUT}/ethers-crossroads-rules.html", "w").write(rules)

# v71j: EC_BL asks the page's head to preload the blackletter (unless the device saves data)
play = (
    head(
        "Play · " + EC,
        extra='\n<script>window.EC_BL=1</script>\n<link rel="stylesheet" href="ethers-crossroads.css?v=171">',
        ec=True,
    )
    + f"""<main class="wide game">
<nav class="crumbs"><a href="ethers-crossroads.html">← {EC}</a><span><button class="link" id="menubtn" type="button">Menu</button> · <a href="ethers-crossroads-rules.html">All Rules</a> · <button class="link" id="newgame" type="button">New game</button> · <button class="link" id="sndtop" type="button" aria-pressed="true">Sound: On</button></span></nav>
<header><span class="num">Play</span><h1>{EC}</h1></header>
<div class="gtop">
  <div id="moon" aria-live="polite"></div>
  <div class="gmid"><div id="phases"></div></div>
  <div id="round" hidden></div>
  <div id="ctltop"><div id="controls"></div></div>
  <div id="who" class="statusline" aria-live="polite"></div>
</div>
<div class="glayout">
<section aria-label="Field">
  <div id="foe" class="pbox"></div>
  <p id="blindnote" class="blindnote" hidden>Delusion: you see only the enemy cards your own cards can reach.</p>
  <div id="board"></div>
  <div id="actbar" hidden><span id="actph"></span><span id="ctlbottom"></span></div>
  <div id="me" class="pbox"></div>
  <div id="handslot"></div>
</section>
<aside class="gside">
  <div id="sidehand"><div id="handwrap"><h3 id="handh">Your hand</h3><div id="hand"></div><div id="mytray" class="traywrap" aria-live="polite"></div></div></div>
  <div id="seltop"><div id="selwrap"><h3>Selected</h3><div id="selbox" class="scrollbox"></div></div></div>
  <div class="spellpanel"><h3>Spells</h3><div id="bankslot"></div><div id="spells" class="scrollbox"></div><p id="shared" aria-label="The grave, the Ether, the Outer Darkness and the Auction"></p></div>
  <div id="selbottom"></div>
</aside>
</div>
<section id="info" aria-label="Card and spell info"></section>
<section id="logwrap" aria-label="Log"><h3 class="label" style="margin:22px 0 6px">Log</h3>
<ol id="log"></ol></section>
<section id="quotes" aria-label="Passages from the book">
  <h3 class="label">From the book</h3>
  <div class="qbox" tabindex="0"><p id="qtext"></p><p id="qsrc" class="dim"></p></div>
  <p class="qacts"><button class="btn ghost sm" id="qnext" type="button">Another passage</button> <button class="btn ghost sm" id="qpause" type="button" aria-pressed="false">Pause</button></p>
</section>
</main>
<div id="ov" hidden></div>
<div id="flash" hidden role="status"></div>
<script>window.EC_QSRC="ethers-crossroads-quotes.js?v=159"</script>
<script src="ethers-crossroads.js?v=182"></script>
"""
    + TAIL
)
open(f"{OUT}/ethers-crossroads-play.html", "w").write(play)

# ---------------------------------------------------------------- quotes for the waiting player
import random as _rnd, glob as _glob, html as _html, json as _json


def _quotes():
    pool = []
    for f in sorted(_glob.glob(f"{OUT}/chapter-*.html")):
        s = open(f).read()
        n = int(re.search(r"chapter-(\d+)", f).group(1))
        title = _html.unescape(re.search(r"<h1>(.*?)</h1>", s).group(1))
        body = s[s.index("<article") : s.index("</article>")]
        paras = [
            _html.unescape(re.sub("<[^>]+>", "", p)).strip()
            for p in re.findall(r'<p class="para"[^>]*>(.*?)</p>', body, re.S)
        ]
        good = [p for p in paras if 220 <= len(p) <= 700]
        if len(good) < 2:  # poems: join each stanza
            st, cur = [], []
            for cls, p in re.findall(r'<p class="([^"]*)"[^>]*>(.*?)</p>', body, re.S):
                t = _html.unescape(re.sub("<[^>]+>", "", p)).strip()
                if "blank" in cls or not t:
                    if cur:
                        st.append("\n".join(cur))
                        cur = []
                else:
                    cur.append(t)
            if cur:
                st.append("\n".join(cur))
            good += [x for x in st if 120 <= len(x) <= 700]
        pool.append((n, title, good))
    total = sum(len(g) for _, _, g in pool)
    rng = _rnd.Random(26)
    want = {
        n: (min(len(g), max(2, round(100 * len(g) / total))) if g else 0)
        for n, _, g in pool
    }  # every chapter at least two passages where it has them
    while sum(want.values()) > 100:
        k = max(want, key=lambda n: want[n])
        want[k] -= 1
    while sum(want.values()) < 100:
        k = max(
            (n for n, _, g in pool if want[n] < len(g)),
            key=lambda n: len([x for x in pool if x[0] == n][0][2]) - want[n],
        )
        want[k] += 1
    out = []
    for n, title, good in pool:
        k = want[n]
        if not k:
            continue
        step = len(good) / k
        for i in range(k):
            out.append({"t": good[int(i * step + step / 2)], "n": n, "title": title})
    return out


_Q = _quotes()
open(f"{OUT}/ethers-crossroads-quotes.js", "w").write(
    "window.EC_QUOTES=" + _json.dumps(_Q, ensure_ascii=False) + ";\n"
)
print("quotes", len(_Q))
