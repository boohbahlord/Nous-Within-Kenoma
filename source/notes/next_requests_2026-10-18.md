# Requests after v37 — NOT built yet (user 2026-10-18 04:22: "do not make a new version right now")
Purpose: data for the hand-off document (Projects / Claude Code / Cowork). Verbatim below, then a sorted digest.

## Verbatim
> The whole site shouldn't have black bars on the ui elements or buttons anymore btw, i dont like it. The black lines in the background are fine though and i like them.
>
> Maybe in the display option, there is a brightness or gamma setting, only one of the two.
>
> There should be a new theme variation that is the Kenoma them in the theme options of display settings, but less orange looks and more dull with a slight--slight yellowish tint coming through a teeny bit more. It isn't the default, just a new option.
>
> Another new theme should be "Office Theme", and it takes inspiration from Microsoft office in the page and color scheme in the game with a lot of white obviously as well. It is a theme though, not actually being the actual image of microsoft word for example becuz of copyright prob and bla bla bla.
>
> There should be an option in display to turn off the black bars and black lines in the background. Furthermore, not every setting in the menu for display needs to be found in the bottom selection.
>
> The screen for online should show a lobby for host and players who join if possible to inform everyone on what is going on, and that screen, when the host is editing the settings for the game itself, the players should have access to the player screen in order to be able to choose their Substance, colors, symbols, and player name. Furthermore, there should be a display setting section as a tab the joined players can click in the window that is unique to their setup and translates it's setting onto the game or carries over their previously selected settings in their cookies. The screen basically has the players being able to do this while the host sets up the game.
>
> Some glitches and more were found.
>
> When players open the chat box, neither can close it on phone, even if they click the chat button or the X on the chat window. This is game breaking and makes the game unplayable while punishing players for no wrong.
>
> The fog of war is not working, every card acts like a scout. It is as if the fog of war is meaningless now and so is scout. The fog should not be so black, add transparency for the black so it isn't so bad, but the whispy white on the field (or grey and white fog?) is fine and a nice touch. The fog of war must be repaired to where every unit can only see adjacently around them by one sqaure(diagonal, and front, back, left and right). This helps make the character want to use the scout to see better for their range attacks and other reasons. Units can attack the fog of war with range though, even if no card is there, and the attack always fails if a card isn't there, but if it does work, the sound of damage will indicate it worked.
>
> There should be a animation for when a card on the field dies, so we can do a simple white skull effect that shows on the screen when a card dies, it is a magic like effect, and the skull should look like a skull, not too simple or crazy crazy detailed.
>
> There should be an option to turn animation off, and that can be in the display settings before a game or at the bottom of the screen. The setting replaces the fog of war with a static image of the already existent fog of war visual.
> The animation screen can be specific, so there is another on and off for card animations and one for magic or other. This will help the game run better on mobile devices. The animations are asked by the mobile user when they load any game or game mode if they want to keep them on or off, and the window will show the settings they can leave on or off and an "Confirm my choices" button. There is also an X button that doesn't change the choices. This window about animation choices for mobile shows up at the start of every game and has the default choices selected IF the player's cookies hasn't already, but IF the player has already selected their own choices previously in any type of display menu, it shows their already selected settings as is. There is a note that informs the player about how turning off animations can improve performance for less capable hardware in their device; or written in a more to the point way if that works.
>
> The game should have the "Spells Explained" and "Further Explanations" menu take more after the "Card Info" dropdown in the game, and the Card Info section should have the cards organized into card types before you select them, like a dropdown within a dropdown. This is especially important for mobile. The dropdown within dropdown approach will finally bring the player to a few choices, like the card info screen now, but not as many, because of the directory path structure you will implement to better organize this info for the player.
>
> The game only allows a player to buy a plot of land in the bank once every two turns. This way, the player cannot buy up all the land.
> The land can be sold with the miners to help pay off debt, and that will be worth 2-3 (dice roll based for the range of number obv; and the sell price is listed as a range and the amount of mana it is sold for is determined by a role that is done after the purchase is made) mana worth of debt paid off; this also gives the bank their own plot of land and miner which can be sold for three mana. The plot of land also goes to the bank when the player dies if there are more players.
> Jupiter's event makes the plots that you buy from the bank produce +1 mana for each plot, and the eclipse makes it +1d2 for each plot.
>
> The game
>
> Furthermore, mobile has a scrolling problem where the spells are hard to scroll past because they also have a scrolling screen.
> I want Mobile to have a slightly different layout and default settings:
>
> * Mobile should have their selected cards above the spell by default because they are likely to play in vertical mode.
> * The icons on the cards look clustered and not visually organized, this should be fixed with it's own code that is ONLY for players on mobile.
> * The box of spells that shows all the spells should be able to be minimized and shrunken, like a dropdown menu almost, and it should be closed by default and glowing before the mobile player first touches it. This should be the same for the log menu and the book quote generator.
> * When the player selects a card in mobile, the outline doesn't show all around it. This should be fixed.
> * In mobile, the ui elements that you can grow and shrink should be 80% for everything and 90% for text, and that should be the mobile's version for 100% (does that make sense?), so that way, they start out with different sizes of things for their format, since it fixes a lot of problems in the expierance for mobile, it is just more pleasant.
> * In mobile, the names for the cards, like the wildcards for example, will go across the screen in ways they are not meant to.
> * In mobile, the tabs in the play menu is hidden from the player and they cannot navigate the menu to set up the game settings to play on; as in the options or tabs like "Players", "Map", "Deck", "Rules", and so on.
> * On mobile, clicking the back arrow on the phone UI quits the game without a yes or no question, and that could be a huge setback for players, so that should also have the usual yes or no popup for them to save them some anger.
>
> (The user says this list isn't complete; "The game" was cut off mid-sentence.)

## Digest, sorted (for the hand-off document and the next builds)
**Bugs (fix first)**
- B1 Mobile: the chat box can't be closed (X and the Chat button both fail) — game-breaking.
- B2 Fog of war: every unit sees too far (acts like a Scout). Rule: every unit sees only the 8 tiles around it (orthogonal and
  diagonal); the Scout sees farther. Fog darkness too black: more transparent; keep the wispy grey/white clouds.
- B3 Ranged attacks into the fog: allowed on any fogged tile in range; with no card there it always fails; a hit plays the
  damage sound (so the attacker learns something was there).
- B4 Mobile: the setup tabs (Players, Map, Deck, Rules, Display) are hidden — can't set up a game.
- B5 Mobile: the phone's Back button leaves the game with no confirmation → add the usual yes/no.
- B6 Mobile: the spell list scrolls inside the page scroll (hard to scroll past).
- B7 Mobile: a selected card's outline isn't drawn all around it.
- B8 Mobile: long card names (wildcards) run across the screen.
- B9 Mobile: the icons on cards look clustered → a mobile-only card layout.

**Look and settings**
- L1 No black bars on UI elements or buttons anywhere on the site (the black lines in the page background stay, the user likes them).
- L2 A display option to turn off the black bars and the background lines.
- L3 One of brightness OR gamma in Display.
- L4 New theme "Kenoma (dull)": less orange, duller, a slight yellowish tint. Not the default.
- L5 New theme "Office": inspired by Microsoft Office colors, lots of white — a theme, not a copy of Office's look.
- L6 Not every Display setting needs to be in the bottom bar.
- L7 Animations: on/off, split into card animations and magic/other; in Display before a game and in the bottom bar.
  Off → the fog becomes a still image of the current fog look.
- L8 Mobile: at the start of every game, a window asks which animations to keep (checkboxes, "Confirm my choices", an X that
  changes nothing); defaults unless the player chose before (cookies) — then their saved choices; a short note that turning
  animations off helps slower devices.
- L9 Card death: a white skull, magic-like, recognizable, not too simple or too detailed.
- L10 Info menus: "Spells Explained" and "Further Explanations" work like "Card Info"; Card Info gets folders by card type
  (dropdown inside dropdown), so each step shows only a few choices — especially for mobile.

**Mobile defaults**
- M1 Selected-stack box above the spells by default (portrait play).
- M2 Spell box, log and book-quote box: collapsible, closed by default, glowing until first touched.
- M3 Mobile "100%" = 80% UI size and 90% text size.

**Online**
- O1 A real lobby screen for host and joined players showing what's going on.
- O2 While the host sets up, joined players can pick their own Substance, color, symbol and name.
- O3 Joined players get their own Display tab in that window; their saved display settings (cookies) carry over.

**Bank land rules**
- R1 A player can buy a plot at most once every two turns.
- R2 Selling land: a plot with its Miner can be sold to pay off debt for 2–3 mana (shown as a range, rolled after the sale); the
  Bank keeps that plot and Miner and can sell them for 3 mana.
- R3 When a player is out (and others remain), their plots go to the Bank.
- R4 Jupiter in the sky: +1 mana per bought plot; Jupiter's eclipse: +1d2 per plot.

**Workflow (the user's question this turn)**
- Moving the work to Claude Code / Cowork / Projects with GitHub access; considering more usage/credits or a plan upgrade.
- The user will send a screenshot of their folder layout (where the zips were saved and extracted before uploading).
