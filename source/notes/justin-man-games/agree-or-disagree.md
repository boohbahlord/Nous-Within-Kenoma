# Justin Man Games · Agree or Disagree

The spec as written down on 2026-10-23, from the request below (kept word for word at the end). Where the request said
one thing and the picture another, the picture wins for the board's colors, as asked.

## The site

- A site for party games, of which Agree or Disagree is the first. Every game has its own art (a "map preview" picture)
  with the game's symbol in the art's top left.
- Front page: **Play** and **Settings** on the left with almost no explanation; under them one short line, something like
  "A party game for friends on a voice call". A rubber duck picture on the right. Top right: **Sign in** (a profile keeps
  settings and stats; without it, a guest profile keeps them in cookies on the device).
- Play shows **Create a room** and, below it, **the rooms online** (open and private ones both listed; a private one asks
  for its passkey).
- The look: a ball pit in an indoor playground first (the cover especially), then a playground and a water park, a little
  carnival. A Twister-like page background: simple colored shapes (circles, triangles, squares and other simple shapes)
  with white space between them. White UI by default; a dark mode setting. Funny, party, almost no explanations. It fills
  the screen on computers.

## The game's symbol and art

- Symbol: three filled rectangle columns side by side with gaps, slightly see-through: left **red**, middle **yellow**,
  right **green** (the board's disagree, neutral and agree).
- Art: a rubber duck on a cloud, "Agree or Disagree" across it in the multicolored letters (below), the symbol in the
  top left.

## The board (the picture's colors, left to right)

Seven equal, symmetrical columns, each with its name written inside it:

| #   | Answer            | Color       | Hex (from the picture) |
| --- | ----------------- | ----------- | ---------------------- |
| 1   | Strongly disagree | dark red    | `#880015`              |
| 2   | Disagree          | red         | `#ED1C24`              |
| 3   | Slightly disagree | orange      | `#FF7F27`              |
| 4   | Neutral           | yellow      | `#FFF200`              |
| 5   | Slightly agree    | light green | `#75F94D`              |
| 6   | Agree             | green       | `#37D421`              |
| 7   | Strongly agree    | blue        | `#00A2E8`              |

- Computer: left to right as above. Phone held upright: the same columns as rows, agree at the top (strongly agree first)
  and disagree at the bottom.
- The colors are the board's background; the players' avatars stand in the column of their answer.

## Avatars

- A toy rubber duck, a little 3D, with a small shadow under it. The duck's color, a pattern, or a metal (gold, silver…)
  that shines. Or a square picture the player uploads.
- Names under the avatars, somewhat see-through.

## Players, names, customization

- Usernames: "Player 1" and so on by default; letters, numbers, dashes and underscores only; no censor. The last name
  used is kept in a cookie for every game joined or made.
- How a name shows to others: its color and its font, including the multicolored letters (each letter a different color,
  like fridge magnet letters), on any font; the childlike font can be chosen without the colors too.
- Every color choice has a paintbrush, **Invent a color**: a hex box with a circled "i" (hover or click) explaining hex.
- Player card: bigger than Halo's, the duck on its left; its background a color, a fun pattern, or an uploaded picture
  that fits the card. Right-click a player card for its options (customization, including the name, and View stats).

## Rooms and the lobby

- Open or private (passkey). Up to 8 players by default. Joining a room puts you in it at once (the lobby covers the whole
  page; an X at its top right leaves).
- Lobby laid out like Halo: Reach's custom game lobby (notes/ref/lobby-idea-halo-reach.webp):
  - the game's art at the top left;
  - the title, then Game type (locked to "Agree or Disagree" for now), Map (one choice for now), Game options (the host
    edits them), Start game;
  - the party on the right: the players in rows, names on the right of each row; click your own row to rename;
  - the buttons at the bottom left: Space ready, T text chat, right-click player card options, left click select.
- Start game counts down with a sound like Halo: Reach's lobby countdown.
- Create a room has a small **TEST** checkbox: the host sets how many computers join; they act after 30 seconds; others
  can join a test room too; a test room never touches anyone's stats.

## A round

The rounds go on until the players vote to end the game or leave.

1. **Submit questions.** Everyone writes one question (or chooses **Don't submit one**, with an "Are you sure? Yes / No").
   **Add a prompt from Notes** puts one of your notes in the box, to edit before sending. The phase ends on a time limit
   or when enough players are ready (below).
2. **Answer, one question at a time.** The questions come in a fixed rotating order or at random, one player's question
   each (the host's choice in the lobby). The player whose question it is is the **Round Lord**: their avatar shows in a
   cloud above the middle of the screen with "Round Lord" under it in the multicolored letters; they set the answer time.
   - Players answer by moving their avatar onto a column: WASD or the arrow keys, or the mouse if they turn that on, or
     (a setting) **Show multiple choice**, which jumps the avatar to the chosen column. Everyone's avatar shows on the
     board while answering.
   - Then they talk it over (voice chat outside the game), moving their avatars around.
   - The next question comes when enough players end their turn, or a timer runs out if one is set.
3. **Results.** Each player's stat box (avatar at its top left; the boxes scroll): what they chose most, the median, the
   average, and the clicks this game. During results players can move their avatars within their column (WASD, arrows).
   From the second round on, each player may vote once a round for an **all-rounds review**, shown after the round's own
   stats.

### Ending turns and timers

- A phase or turn ends when enough players have ended their turn: **3 out of 4** by default.
- Timer choices: 30, 60 or 90 seconds; off by default.
- The catch-up timer (submit questions and answering only): once enough players have ended their turn, a 15, 30 or 45
  second timer starts for the rest. Default: on, **15 seconds after 3 of 4**.

## Notes, chat, command line

- **Notes**, bottom left: question ideas, written any time.
- Text chat (T): its side is a setting (left, bottom, right or hidden, as the game allows). `@name` pings with a soft
  sound and a "!" on the chat's tab; `\@name` is a private message; `\help` lists these. Autocomplete with Tab (never
  leaving the page), arrow keys through the suggestions; names autocomplete; clicking the box suggests `\help`.
- **Command line** (Shift+T, or the symbol at the chat's bottom left): the chat button is "ABC" on a white circle; the
  command line is a retro green "$" on black. It looks like the chat. For now, customization only: `custom` lists
  `avatar`, `card`, `username`…, e.g. `custom username font "times new roman"`, `custom username "font color" red`.
  Commands are white; Tab adds the quotes around words with spaces.

## Clicks

- Every click anywhere counts; the counter sits at the bottom middle and grows across games (kept in cookies). Settings:
  scientific notation, and hide it.

## Leaving

- The pause menu at the top right, with Leave game. The browser's back (and the phone's) and closing the tab ask "Leave the
  game in progress?".

## Accounts and friends

- Sign in (GitHub was the guess; see the questions) to keep settings and stats in a profile rather than the device's
  cookies. Friends: requests, the friends list, inviting a friend who is on the site (a notice at the bottom middle).
  Friends open from the pause menu or with Shift+\ (not while typing or in a game).

## Settings

- Tabs, the basic ones ordered like Ether's Crossroads'. Fonts: the old English font, Cascadia Code Extra Light, Courier
  New, Times New Roman, Comic Sans, Georgia (and the playground font). Dyslexic mode, colorblind mode, dark mode; clicks
  shown in scientific notation; the click counter hidden; mouse moves the avatar; show multiple choice. Music later.

## Decided (2026-10-23)

- Online: **Firebase** (live room list, real-time play, sign-in, friends). The owner makes a free Firebase project and
  sends its web settings.
- Symbol colors: red, yellow, green.
- Fonts: **Fredoka** is the default text font; **Lilita One** is the playground font for the multicolored letters
  (Round Lord, the title). The font list: Fredoka, Lilita One, the old English font (Grenze Gotisch, from Ether's
  Crossroads), Cascadia Code Extra Light, Courier New, Times New Roman, Comic Sans, Georgia.

## The plan

1. The site and the game without a server: the front page (Play, Settings, the duck, the shape background), Settings
   with tabs (fonts, dark mode, dyslexic mode, colorblind mode, clicks), the art and symbol, the duck avatar (colors,
   patterns, metals, an uploaded square picture), the Halo-style lobby, the board, the whole round (submit questions,
   Round Lord, answering by moving the duck, results and the all-rounds review), Notes, the chat and the customization
   command line, the click counter, leaving safely. Playable at once in a TEST room with computers.
2. Online with Firebase: the room list (open and private with passkeys), real-time rooms for 8, the host's options.
3. Profiles: sign in, settings and stats kept in the profile, friends (requests, invites, Shift+\).
4. Later: music, maps, more games.

## Later (not now)

- Music. Maps for this game. More games on the site (each with art and a symbol).

---

## The request, word for word (2026-10-23)

(two pictures with it: notes/ref/lobby-idea-halo-reach.webp and notes/ref/board-colors-rough.png)

Add a game called "Agree or Disagree", and in the game, there is a center of neutral, to the left, there is slightly disagree, then a disagree option, and then a strongly disagree. The neutral is blue. To the right of neutral is a slightly agree, agree, and disagree. The screen on computer is left to right and on vertical orientation on mobile the agree is at the top and the disagree is at the bottom. The game has avatars that we will figure out overtime. The colors are in the background and a player asks a question and the players answer a multiple choice of how much they agree or disagree into the multiple choice that is labeled inside the boxes by name (ie; agree, strongly disagree, neutral, etc.) The players have a certain amount of time the player asking the question decides since they run the round. Afterwards, the players can discuss with their avatars on different parts of the board. The players also have a UI element somewhere in the bottom left called "Notes", and there, they can write down question ideas while they aren't busy. When prompted to write a question when it is a player's turn, there is a "Add Prompt from Notes" (written roughly like that) that allows players to add one of their note entries into the box instead of typing out something they already have in their notes, and the box can be edited or revised before submitting for game. Their is a submit question round where all players write up a question either in a time limit or a round where all or most players have to hit ready before a timer starts counting down. When the submit questions round is over, then it will have the questions sent in a consistent revolving order or a random order of one player's question each, where the option is determined by the host in the game lobby.

This is going to be an online game btw. When in game, the pause menu is at the top right, which has a leave game option,

The rooms you join can be open rooms or private with passkeys required. The open rooms and private rooms both show up in the available rooms online below the create a room setting. The create a room setting will have it to where it shows the players that have joined to the host and show the players to each other who joined. The players sit in rows with their usernames on the right, which are "Player 1" by default, but clicking YOUR row will allow it to have the name changed. You can make it to where the name carries across games by use of cookies and will keep whatever name you last entered thru all games you join or create. The room has 8 players max by default. The avatars are a toy rubber duck OR a sqaure image the player can upload as their avatar. Players can select a color on their duck, a pattern, or even metals, such as gold or silver to make the duck shine. Players can use images they upload as their avatars instead. The players will have their avatar show up in the column they voted for, and when all players vote for the turn to end or a timer goes off if that is set, then the game continues on to the next question.

Players basically have turns with three phases. The first round is writing and then submitting questions for the round, the next turn is voting on one question and then discussing the answers, and that phase the players takes turns, the first turn being how one player gets their own round to where people answer their question UNLESS they didn't submit one, which is an option to click in the submit question phase (there is a are you sure button with a yes or no option to confirm if they want to not submit a question). The turn after that is returning to the next player's submitted question for others to answer with their opinion, and they discuss results that show the avatars on the boards to represent what option they chose in "Agree or Disagree" how they discuss it outside of the game in a voice chat like discord or elsewhere.

The next phase after all of that is done will show a result that shows how often players agree or disagree within a round with their avatars to the top left of their stat box that players can scroll through. The first stat shows the mode, (which shouldn't be call a mode but is called what the player chose the most), the next stat is the medium, the average, and the number of clicks per game. (The game keeps track of how often you ever clicked in a game and is stored in cookies, the click counter will be at the bottom middle of a screen and it grows across games. The settings can change the clicks to scientific notation even if they haven't even clicked yet, clicking refers to clicking the screen randomly, which makes the counter goes up. The counter can be hidden under the settings menu in the pause menu.)

In the game, clicking the back arrow on a phone screen on browser or clicking the back arrow on browser will ask a player if they are sure they want to leave the game in progress, and so would trying to close the browser. The timer is either 30 seconds, 60 seconds, or 90 seconds. The timer is off by default and the round or phase doesnt end UNLESS a certain amount of players have voted, and the game basically needs 3/4 players to end their turns in order to go on to the next phase or turn by default, and it can be set to enable 15, 30, or 45 second timer WHEN players haven't ended their turn, so that timer goes off when other players haven't ended their turn ONLY WHEN it it is the submit question or answer question part of the turn WILL the timer turn on AFTER a certain amount of turns are ended IF the timer condition itself being self-referred to is turned on. The default is a 15 second timer after 3 out of 4 players ended their turn WHEN there is submit question phase OR the part of the turn where you answer questions.

The settings have a font setting where fonts can be selected, the old English font for my game should be an option that you can select as well as Cascadia Code Extra Light, Courier New, Times New Roman, Comic Sans, and Georgia. You can suggest new fonts or suggest to remove old fonts, as well suggest the default font. There should be a setting for dyslexic mode. The game should feel like the mix of a ball pit, a playground, a water park, or a carnival maybe, but especially the first three. The cover of the game should FEEL like a ball pit in an indoor playground maybe. We will discuss music later.

The avatar of a player shows in a cloud above the center of the screen to indicate it is their round, and they are called the "Round Lord", and it will say it under them.

If there is a child like playground font that we can make multicolored then we can use that for the part that says round lord, and it can be like different colors for each letter that says round lord on the cloud, like those colored magnets you can put into words you find on some fridges IF you cant imagine what im talking about, like something i might imagine for a Toys R Us logo IF i am not mistaken, but dont run with that example.

The rounds go on indefinitely players vote to end game or leave game. A player can cast a vote suggestion once a round to preview a total stat review of the running game, that shows the stats already mentioned by players but not just for a round but all rounds combined, and it comes after the first set of stats for that round and can only be voted in during the second round and later rounds, and it is appended to its own part after that first show of stats on the one round. The part that shows players results will allow them to move their avatars around the column they are in on their screen by just using the WASD or arrow keys. The names are visible beneath the avatars and are somewhat transparent. Players can customize how their usernames appear to players in colors AND fonts, including the color font u see for the "Round Lord" word, where the letters are all different colors in a childlike way, and that setting can be used in the color even on different kinds of fonts, but the childish font (whatever that will be, maybe multiple) can be selected without the colors as well. There is an invent color option that is a paintbrush for any color customization that allows players to use hexadecimal values to create their own color, and the hexadecimal box where you select your custom color will have a circle "i" for info that the mouse can hover over or players can click to preview the info for how hexadecimal works.

Like i said, the answers will be shown by showing where players are on the column... HMMMM, maybe the players can move on the columns with their avatars when they answer instead of clicking agree or disagree or whatever. ALSO, the players can still use their mouse to move their avatars the same as WASD if their enable it in their settings, and they can enable another setting that says to display multiple choice instead, which just teleports their avatars to the column. While players are answering, you can see their avatars on the columns. The duck avatars should look a little 3d and ALSO have a small shadow cast on their duck. The UI is naturally white, but players can enable a dark mode setting. There is also a colorblind setting and dyslexic mode setting. There will be music eventually. The players in game have a player card that can be clicked for options, such as view stats, and it will show how they have answered. There is a create a room with a checkbox called TEST, and it will spawn computers in the game that act after 30 seconds, and the test room DOES NOT affect stats on a player card WHATSOEVER! The test room simulates other players, and other players can join a test room too, and the number of computers in a test game is determined by a host. The test mode is a small check box.

I sent a screenshot that will show a very rough UI idea of how i imagine the lobby to look. When players join a lobby, they are already in the game. The host can edit options for the game in the game options before the game. The game type is locked into "Agree or Disagree", since i will add new games later. I might add maps for this game mode, but we will see, so you do not need to add that option. There is a game option menu like i said, it is called game options. The start game button creates a countdown with a sound similiar to the start game countdown in halo reach lobbies. The map preview at the top left isn't a thing yet, but you can make a picture of a duck on a cloud for art and have it say "Agree or Disagree" in the art in the multicolored letter font we talked about. The top left symbol for the game is just three colored filled rectangle columns (the left one is red, the middle is blue, and the right one is green) that sit with gaps next to each other in the top left of the art, and they are slightly transparent. Every game I add to this site will have it's own art and WILL also have a symbol in the top left of the art. The map can actually have a section with only one selection for now. The buttons are shown on the bottom left for players actually, which shows Spacebar for ready, T for text chat, right click for player card options, and left click to select. In this menu, there is an X at the top right of the lobby when you join. When you join a lobby, it covers the whole page. There is no game mode selection and the game just has a play or settings menu on the front page with almost no explanation, and you click play and can then see the create a room or join room options. The front page has a short brief explanation below the options on the left hand side, like below the play game and options, and it says "For friends in voice call or other communication" or it can say something better worded then that. There is a picture of a rubber Duck on the right side of the screen before you hit play. The theme of the game should remind of twister a little bit, like with multiple-colored dots, but maybe circles, triangles, squares, and every other simple shape in the page background with white clear space between it. The game has a funny look obviously and is a party game with brief or no explanations hardly anywhere because it is simple social time. The game should fill the screen on computers. The game lobby should be it's own while being in the perfect format of the screenshot of Halo Reaches UI, but the player cards can be bigger AND show the ducks on the left of the player card. The player card can be customized to be different colors with different fun patterns too OR can be an image the player selects that has to fit within the player card dimensions. Customization "Including player name now" is found with right clicking a player card which shows the options that way.

When can also allow the front page have an option in the top right to sign in to profile to save settings and stats to profile INSTEAD of just the guest profile which saves to cookies. I assume that will just sign a player into their github, which they can choose to create an account to their github probably. If the players have an account, there should be a friend request feature, where a player can add a friend by their friend list OR invite a friend IF they are on the game, which shows up as a notification at the bottom middle of a screen. The friends menu is accessible in the pause menu or by using the Shift+\ button IF IF IF they arent already typing in a box or in a game. In the text chat, there are private messages if a player uses the negative sign before the @ as such "\@" (the quotes dont count here), if they use the @ without the backslash then it just does a soft notification noise with an exclamation to the chat slide on the left of the screen (options can change if it is on left, bottom, right, or hidden on the screen IF the game they are in allows it, based on new game modes that might be out later), which will be told if the player types \help
If a player wants to, they can use the shift + t button to change to command line or click the bottom left of the text chat while it is open on a symbol. Text chat will simply be the ABC with a white circle behind it as a button, and the command line would be a green dollar sign in the classic green retro color and font with a black behind it to indicate command line mode, and the command line looks the same same as chat. Clicking the box will auto show the \help option which can be enter with tab or typed, and also ignored, since it is an autocomplete suggestion. The autocomplete is done with tab without it tab thru the browser ui, and the tab button will autocomplete while the arrow keys can scroll thru suggestions in the chat. The \@ button is used for private messages between one player. Autocompleting a player's name is a thing. (the player cannot have special characters in their name, only letters and numbers, but the dash is allowed, underscores are, and so is anything in the likeness of those) There is no censor on the names players can create.

The command line has a customize command, where when you type "custom", other commands appear, such as "avatar", "card", "username" and so on. Options that appear as we add them to the game get commands. So like, 'custom username font "times new roman"' or 'custom username "font color" red'. In the command line, commands have white characters, which means parts of a command needs to be quotes if there is a space, and the autocomplete will put the quotes for you

The command line should be simple and only have commands for customization for now.

The UI should be based on my UI/UX principles AND things I outlined here. Furthermore, consider things like dead space, alignment, font size, bold, underline, box size, and more. Similiar BASIC settings from ether's roads should be found in these settings and ordered similarly, like how settings have multiple tabs. There are other UI/UX princples i didnt mention because i have not much time to even scrap the ice on that here, you must know what i told you before thru thing u have written down or received. Ask me questions if need be with the multiple-choice boxes you do.

In the second screenshot, that shows the map the players walk on, and they get their avatar lock into one of the colors based on their answers. BUT it is the most crude example possible, BECUZ it is rly the roughest estimate ever, like each part should be symmetrical AND a column, and NOT what you see in the picture, or more so shows the roughest idea of the colors from left to right in that second screenshot. Now BEFFORE the colors may have been been described dif in this text, but it is hard for me to go back and change that. When you take note for this sight based on this prompt before making a plan, you can rewrite how i described the colors of the map based on the image i sent in the seond screenshot.
