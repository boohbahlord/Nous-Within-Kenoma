import re,json,html
seg=open('rules_seg_old.html').read()
lis=re.findall(r'<li><b>([^<]+)</b>(.*?)</li>',seg,re.S)
D={}
for n,t in lis:
    k=n if n not in D else n+'#2'
    D[k]=t.lstrip(': ').strip()
def li(name,key=None,text=None):
    t=text if text is not None else D[key or name]
    return f'<li><b>{name}</b>: {t}</li>'
P=lambda tag: re.search(r'<h3>'+tag+r'</h3>\n(<p>.*?</p>)',seg,re.S).group(1)
surv=re.search(r'<h3>Survival</h3>\n(.*?)\n<h3>Substances</h3>',seg,re.S).group(1)
S=json.load(open('game/text/substances.json'))
NAMES={"beginner":"Beginner","angel":"Angel Machine","satan":"Satan","binah":"Binah","jester":"Jester Fool","tiph":"Tiphareth of Kether","lucifer":"Lucifer &amp; Ouroboros","leviathan":"The Leviathan","firm":"The Firmament","yald":"Yaldabaoth"}
subs=[]
for k,nm in NAMES.items():
    detail=D[nm].replace('“Spit the empty full into”','<i>Spit the empty full into</i>')
    detail=re.sub(r',? ?“[A-Za-z]+”,?','',detail)
    pts=''.join(f'<li>{html.escape(p,quote=False)}</li>' for p in S[k]['pts'])
    subs.append(f'<div class="subst" id="sub-{k}"><h4>{nm}</h4><p class="tag">{html.escape(S[k]["tag"],quote=False)}</p><ul>{pts}</ul><details><summary>Every detail</summary><p>{detail}</p></details></div>')
bank=[
 ('Spending','Every mana spent on a spell goes to the Bank. The Bank lends only what it holds.'),
 ('Loans','20% interest every 1d2 rounds, due in 4 rounds. What isn\'t paid by then becomes <b>mana debt</b>, and your mana shows below zero. Below zero the Bank lends six at most; at minus your maximum, five at most and at 30%.'),
 ('Credit','With <b>Spend on credit</b> ticked, spells you can\'t afford go on your debt. Every soul you gain pays the debt first.'),
 ('The floor','Fall below three times your maximum mana under zero (−18 with a maximum of 6) and you lose at once.'),
 ('Selling','Sell cards from your hand or deck for their conjuring price. They go to the Ether and your deck is reshuffled. Binah can sell thralls for 1 mana each.'),
 ('Upselling','A spell bought more than twice in each of two rounds in a row costs 1d2 − 1 more.'),
 ('A Bank in the red','The Ether goes on sale (1 less), and the Bank asks the richest player for a loan, which it pays back at 20% every two rounds.'),
 ('Debt Collectors','Anyone more than their maximum below zero is hunted by the Bank\'s Debt Collectors (1d3 every 1d3 rounds). What they kill goes to the Ether, and its price to the Bank.'),
 ('Collapse','If the Bank is 12 in the red and every player 6 below zero, it collapses: everyone back to zero, every maximum falls to three, five cards from each deck and one Ace from the field go to the Ether, and prices wobble up for 4d2 rounds.'),
 ('Opening and closing','The Bank can open with (2 × players)d2 mana (off by default). One round in a thousand the Banker dies of a heart attack, and the Bank and the Ether close for good.'),
]
sky_rows=[
 ('The Moon','Form of Fate','The default sky.','Turns one phase a round. The New Moon gives 1d2 grave cards; the Full Moon takes its toll and forbids drawing and necromancy; one Full Moon in twenty is a Blood Moon.'),
 ('Saturn','Form of Limitation','Yaldabaoth, at seven hunger; or the sky from the start.','Every enemy pays 1 each round (a hand card, the top deck card or 1 mana), or a Debt Collector rises. Binah never pays. From the start, its favors go to the Bank.'),
 ('Mars','Form of Strife','The Firmament (2d3); or the sky from the start.','Each round, stacks of only Grunts, Infantry or Puppets get advantage on their next attack on 1–5 of 1d8.'),
 ('The Second Sun','Form of Judgement','The Firmament (2d3, and a Joker shoots itself); or the sky from the start.','No fog of war. Every 2d2 rounds it judges each other player: 1 mana, a wound to one of their stacks, or two deck cards, or blindness for that turn. Three cries from Yaldabaoth turn it into the Black Sun.'),
 ('Venus','Form of Harmony','The Firmament (2d3); or the sky from the start.','+2 mana a round and +2 maximum for the caster or a teammate, or +1 mana a round while every enemy gets +2 maximum.'),
 ('Mercury','Form of Guile','The Firmament (2d3); or the sky from the start.','Votes for Peace or Total War, bought Peace, and, under its Oath, Betrayal, Declare War and Bribe the Banker.'),
 ('Jupiter','Form of Abundance','The Firmament (2d3); or the sky from the start.','Ace miners bring 1d2, two conjurings on sale each round, trades at the Auction, and more mana for a Jester\'s Sacrificial Suicide.'),
]
skyopt='Before a game: the moon (default), no moon, or a planet from the start: Saturn, Mars, the Second Sun, Venus, Mercury or Jupiter. A planet from the start keeps the Firmament out (and Saturn keeps Yaldabaoth out), and its favors go to the Bank. A Leviathan can coil on Mars, Venus or Jupiter, with its toll every eighth round. Hover or tap the sky in a game for what it means for you.'
merc=D['Mercury'].replace(', “Guile”','').replace('(the Firmament, Astrology, 2d3). Under it','brought by the Firmament (Astrology, 2d3). Under it')
out=f'''<h2 id="modes">Game types and rule options</h2>
<p class="toc">On this part of the page: <a href="#types">Game types</a> · <a href="#substances">Substances</a> · <a href="#setup">Setup options</a> · <a href="#sky">The sky</a> · <a href="#economy">The Bank and the economy</a> · <a href="#siege">Siege, support and mining</a> · <a href="#stealth">Fog and stealth</a> · <a href="#screen">On the screen</a></p>
<h3 id="types">Game types</h3>
<h4>Local</h4>
{P('Local')}
<h4>Versus Computer</h4>
{P('Versus Computer')}
<h4>Survival</h4>
{surv}
<h4>More players</h4>
<ul>
{li('Free-for-all')}
{li('Two against two')}
{li('Decks')}
{li('When a player falls')}
{li('Turn order')}
{li('Phase timer')}
{li('Computer speed')}
</ul>
<h3 id="substances">Substances</h3>
<p>A Substance is what you play as. Each one changes your deck, your spells or your limits. Random picks one when the game starts, and only the Beginner can be played by more than one player.</p>
<div class="substs">
{chr(10).join(subs)}
</div>
<p>Substance cards with hearts lose one heart each time they take damage and fall at none. They can't be sacrificed, and they never lie in the grave. One-time spells say so when they are cast. Big moments come up as a box; smaller ones as a short notice across the top of the screen, in the color of the player they belong to.</p>
<h3 id="setup">Setup options</h3>
<ul>
{li('Field size')}
{li('Midline')}
{li('Battle map')}
{li('River')}
{li('Hole in the middle')}
{li('Headquarters')}
{li('Decks','Decks#2')}
{li('Specials')}
{li('At least one Joker')}
{li('Starting mana')}
{li('Moon combat bonus')}
{li('Spells in the attack phase')}
{li('Optional Ace rule')}
{li('Blood Moon mode')} 
<li><b>Eclipse mode</b>: the game opens under the eclipse of the chosen sky (the Blood Moon, for the moon).</li>
</ul>
<h3 id="sky">The sky</h3>
<p>{skyopt}</p>
<table class="skytable">
<tr><th>Sky</th><th>Form</th><th>How it comes</th><th>What it does</th></tr>
{chr(10).join(f'<tr><td>{a}</td><td>{b}</td><td>{c}</td><td>{d}</td></tr>' for a,b,c,d in sky_rows)}
</table>
<ul>
{li('Oaths',text=D['Oaths'].replace(' A popup tells',' <b>Oath of Mercury</b>: unlocks Betrayal, Declare War and Bribe the Banker. A popup tells'))}
<li><b>Mercury</b>: {merc}</li>
{li('Eclipses')}
{li('Yaldabaoth and the Sun')}
</ul>
<h3 id="economy">The Bank and the economy</h3>
<ul>
{chr(10).join(f'<li><b>{a}</b>: {b}</li>' for a,b in bank)}
{li('Surplus mana')}
{li('Gambling')}
{li('Barbarians')}
{li('The meteor')}
</ul>
<h3 id="siege">Siege, support and mining</h3>
<ul>
{li('Archers')}
{li('Cannons')}
{li('Walls')}
{li('Support cards')}
{li('Crystals')}
{li('Field Libation')}
{li('Stacked odds')}
</ul>
<h3 id="stealth">Fog and stealth</h3>
<ul>
{li('Fog of war')}
{li('Scouts')}
{li('Assassins')}
{li('Face-down cards')}
{li('Ambush')}
{li('Quiet Eyes')}
</ul>
<h3 id="screen">On the screen</h3>
<ul>
<li><b>Spells</b>: the right column holds the Bank, then the spells in their own scroll box, then the selected stack. Within each school the spells run from cheapest to dearest. Rest the mouse on a spell (or long-press it on a touch screen) for its price, when it can be cast, what it needs, what it does and its limits.</li>
<li><b>The Ether</b>: the Ether entry at the top of Conjuring opens a panel on the right with every card you can conjure, by type (Standard, Special, Support, Base), cheapest first, with how many are left. Increase Max Mana sits right under it.</li>
<li><b>Grave Blessing on its own</b>: the auto switch on the left of Grave Blessing casts it for you at the start of every prep phase.</li>
<li><b>Display</b>: the Display button at the bottom of the screen opens the theme, the card icon size, the interface size, the text size (small words grow the most), the hand position, the tile names (columns A, B, C from the left and rows 1, 2, 3 from the bottom, like a chessboard) and the page width (full width by default on a computer). The static switch sits beside it. The Menu holds the same settings, plus where the selected-stack box and the turn buttons sit.</li>
<li><b>Card info</b>: rest the mouse on the top-right corner of any card or stack for its stats, or tap the corner on a touch screen: type (Standard, Special, Support, Wildcard or Base), attack and defense averages with their min–max, hearts, soul worth, effects, the cards in it and anything it captured or imprisoned. Drag that corner from one stack on the field onto another to compare them: higher in green, lower in red, equal in yellow. The selected-stack box shows the same stats and can compare with another stack or any kind of card.</li>
<li><b>Status</b>: hover or tap a player's symbol for their limits, effects and recent spells; hover or tap the sky for what it means for you.</li>
<li><b>Windows</b>: every window has an X in its top-right corner, and Escape closes it.</li>
{li('Log')}
{li('Dice box history')}
{li('Menu')}
{li('Phase timer off')}
</ul>
'''
open('game/text/rules_modes.html','w').write(out)
print(len(out))
