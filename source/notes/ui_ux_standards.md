# UI/UX standards for Ether's Crossroads and the Nous Within Kenoma site

**Who this is for:** any Claude session that changes how the game or the site looks, reads, sounds or behaves.
**When to read it:** before the first UI change of a session, and again before shipping one.
**Where it comes from:** Bryce's own requests (verbatim in `source/notes/`: `ui_overhaul_sheet.md`, `prompt12_sheet.md`,
`next_requests_2026-10-18.md`, `claude_code_requests_2026-10-18.md`, `v44_sheet…`, `v47_sheet…`, `v52_sheet…`).
Quoted words are his. Everything else is a rule drawn from what he asked for or complained about. The sheets are the
evidence; this note is the rulebook.

He asked for this himself: "Do not just see this as a cluster of buzz words or a bunch of different ways of me saying make it
better, because there are principles to be found here and patterns in my criticisms." Treat each rule below as binding,
not as a mood.

---

## 1. The order of priorities

When two goals pull against each other, the higher one wins:

1. **It functions without glitching.** A broken control, a window that can't be closed, a spell that won't light up: these
   come before everything else. ("it has to function without glitching first, then be a good experience for the user second,
   then look really good.")
2. **It is a good experience.** The player finds things at once and isn't punished by the interface.
3. **It looks really good.** Tasteful, consistent, in the game's own style.

Underneath all three sit the **trinity of organization, English and purpose**. "each one of these three things being a trinity
in some respects that relate back to one another." Put plainly: a clear label, in a clear place, for a clear reason. If any one
of the three is missing, the element isn't finished.

The stakes are high. "If i dont want to play my game anymore because of ui this bad, then it is more then a red flag, it is the
end of the world for this game." Sloppiness reads as not caring: "If they dont care about the game … then why would i care?"

---

## 2. The principles

### 2.1 Playability: the player never hunts
- Everything a turn needs is reachable without scrolling the page on a computer: the board, the hand, the Selected box and
  the spells. Scrolling "over two pages" to reach a selection is "completely unacceptable."
- Long lists live in **their own box with a scrollbar in the game's style**. The bar grows, shrinks or disappears with the
  content. All scrollbars follow the art style where possible.
- **No scroll traps.** A box that scrolls inside a page that also scrolls is a bug on phones (B6). There, folds that open fully
  and let the page scroll are the answer.
- **Never scroll sideways.** That applies to the setup window everywhere, computer or phone (SE2), and to every other window.
- Nothing overlaps anything else. The Static toggle once sat under the bottom bar; it was a defect.
- Text never floats beside unrelated UI. The status line is its own line ("Your turn: prep" / "P2 is playing"), not a
  fragment next to the phase steps.
- Every window can be closed (see 2.8). A window that can't be closed on a phone is "game breaking."

### 2.2 Organization: consistent order, consistent geometry, shallow paths
- **Order means something.** Lists are sorted by a rule a player can feel:
  - Spells: by school, cheapest first within each school. The schools' order is fixed. At the top of the list are the Bank,
    then Lazy Hand. Then come Conjuring (the Ether first, Increase Max Mana right below), Astrology, Necromancy (Grave
    Blessing first, Ritual Dice second), Enchantment, Curse, Sorcery and Illusion. "the order the spells go in matter greatly."
  - The Ether shop: by kind (Standard, Special, Support, Base…), cheapest first within each kind.
  - Card pickers (the grave, Sell, Resurrection, trades, the Outer Darkness): tabs by kind (All, Standard, Special, Support, Base,
    Wildcard), a heading per kind, and identical cards folded into one button with a count. Nobody scrolls "through an entire
    deck."
  - Hierarchies of card kinds start grouped ("Special") and can be split into single kinds ("King"). Never by suit.
- **Same group, same shape.** Tiles in one group are the same size: maps, Substances, sky options. There are no tall rectangles
  next to squares, and no box "running sideways below" another. "Maps vs special maps" was merged into one grid for this reason.
- **Directory structure over walls of choices.** Info menus work like folders: kind → card, "a dropdown within a dropdown." Each
  step offers only a few choices. This matters most on phones.
- **One thing, one place.** Hearts sit in one consistent spot on every card and stack, never over the picture, mark, name or
  count. One dice-history box serves everyone. The same kind of window has the same layout.
- **Similar menus share one pattern.** The automation tabs (Field, Ritual Dice, Lazy Hand, Grave) all look like the Field
  Automation menu. Spells Explained and Further Explanations work like Card Info. Pickers sort like the Ether. Every tab of
  Configure Automation has its own on/off switch at the top.

### 2.3 English is a priority
- **Concise, accurate, purposeful.** "All descriptions in the play menu and rules elsewhere should be concise, easy to read, and
  purposeful." To the point, with purpose and clarity.
- **Correct mechanics and capitalization.** No stray quotation marks, ever. When Bryce gives quoted text, the quotes are his
  punctuation, not content to display. "Do not fucking include quotations."
- **Names that make sense as names.** A spell list is a list of things you buy, so no "Buy …" labels ("Increase Max Mana," not
  "Buy Mana"). Short forms players know: 1v1 and 2v2 (never "One on One"), P1–P8.
- **Don't carbon-copy formats.** Spell info reads like card info but shaped for spells (cost, when, effect, limits); it is not
  "a LAZY carbon copy."
- **Voice:**
  - No "we" or "I" in game text.
  - "You" only where the game speaks to the player directly: What you must know and Basics Explained.
  - Warnings are a yellow caution with ⚠, not "We advise against."
- **Exact game vocabulary.** Use these terms the same way everywhere:

  | Term | Meaning |
  |---|---|
  | Turn | One player's turn, broken into phases |
  | Round | Every player's turn once. The top of the page shows "Round N" only. |
  | Crit Hit / Crit Miss / Miss / Crit Success | The on-screen landing results (these exact words) |
  | Heavenly Bodies | The planets as a group |
  | Form of … | The last line of each planet's info, exactly: Form of Fate (The Moon), Form of Limitation (Saturn), Form of Strife (Mars), Form of Judgement (The Second Sun), Form of Harmony (Venus), Form of Guile (Mercury), Form of Abundance (Jupiter) |
  | Demons | The former Barbarians |
  | Tall | The formation formerly called "Deep" |

- **Keep his names.** Spell, card and mode names stay as Bryce wrote them. If one seems wrong, flag it; don't rename it quietly.
- **All on-screen info agrees.** If the Bank window, a tooltip and the rules page describe the same rule, they say the same
  thing. "Make sure the info on screen is consistent with eachother."

### 2.4 Information on demand, not walls of text
- An option tile shows a **name** (one short line at most). The explanation lives in a hover tip on a computer, or a tap or hold
  on a phone that opens info with an X.
- "Could you imagine if microsoft word did that for their ribbon settings? Where every option within every group tried to fit two
  sentences worth of info?" Big boxes stuffed with words are "messy and unprofessional."
- **Hover tips wait about a second** before appearing, so passing the mouse over something doesn't flash a tip.
- **A tip never covers what it explains.** For example, there is no "Card Info: click it or drag it…" tip sitting over the
  stat box.
- **No "i" buttons scattered everywhere** ("terrible to look at"). Touch info comes from holding a tile, or from an opt-in "info
  buttons" switch meant for touch screens.
- **Phone exception, stated by Bryce:** in compact automation menus, descriptions may sit inside the boxes on a phone. On a
  computer they go in hover tips.
- **Compact info boxes.** Planet and spell tips are small and dense. "Think Stellaris UI/UX."
- **The planet's full info** on click is complete ("not hiding things or being too short") but stays about one short paragraph.

### 2.5 Type and scale
- **Readability is the only goal of type.** "dont make words that are really large font, i dont like that."
- **Don't shrink everything either.** Making all text smaller was called out as ignoring what he meant.
- **The Text Size setting enlarges small text most.** Detail text grows most and headings barely, with hard caps. "The increase
  font size is best for smaller things which are hard of sight for the player."
- **A clipped label is worse than a smaller font.** At the user's settings (Text Size 180%, UI 80%, full width) nothing may
  jumble, run behind other UI or overflow. "Visual order is a necessity."
- **Fonts:**

  | Font | Use |
  |---|---|
  | `--mono` (Cascadia Code) | All UI and reading text |
  | Blackletter (Grenze Gotisch, class `.bl`) | Spell names (default on, a Display switch turns it off), "Round N," Crit text, "What you must know," spell labels on stacks, King of the Hill titles |

  Blackletter is an accent. It is never used for body text.
- **Long names never run across the screen.** Card names wrap or fit their card.

### 2.6 Space: room on a computer, no dead space anywhere
- A computer gets a **wide layout by default**, and its windows are wide and tall enough not to scroll needlessly. "when a
  desktop can handle more; remember that."
- **No dead space at the same time.** Windows like the Bank used too-big type and empty areas; the fix is compact and dense,
  keeping "the best parts of the UI."
- **Compact on a computer.** In automation menus the label (the box) sits on the left and the checkbox or arrows sit on the right.
  On a phone, the controls go below the label.

### 2.7 A computer and a phone are different products
**A phone's "100%"** is 80% UI size and 90% text size. Phones start smaller because that fixes most problems there.

**Phone defaults:**
- The Selected box goes above the spells (portrait play).
- The spell box, the log and the book-quote box are folds, closed by default, that glow until first touched.
- Card-face icons get a phone-only layout so they don't look clustered.

**Phone controls:**
- Touch targets are slightly smaller to reduce fat-fingering, but still easy to hit. This matters most for the card-info corner.
- The phone's Back button asks before leaving a game.
- At the start of every game, a window asks which animations to keep. It shows the saved choices, or the defaults if there are
  none, with a "Confirm my choices" button and an X that changes nothing.
- The setup tabs (Players, Map, Deck, Rules, Display) are always reachable on a phone.

**A computer gets hover; a phone gets tap or hold.** Every feature has both paths.

### 2.8 Windows, controls and state
- **Every window has an X at the top right**, plus its close button where it has one.
- **An X on a question means No.** It never means Yes and never changes anything. For example, the X on Field Automation's
  "Are you sure?" counts as No.
- **Consequential switches ask first.** They show an "Are you sure?" with a one-line explanation. Turning something off again
  needs no question.
- **Disabled looks disabled.** A dropdown with nothing to choose is faded and can't be clicked. Options that stop applying fade
  "contextually in a defacto manner using basic logic."
- **Options appear only when they apply.** If the host turns Field Automation off for the game, its button doesn't exist.
  "Flee when low" shows only with the Tall formation. Large Map Controls are faded outside large maps.
- **Interacting never collapses what's open.** Cycling a Yes-and +/− must not snap its list shut.
- **Settings persist.**
  - Display choices are saved on the device and carry into new games, including online guests' own Display tab.
  - "Custom" presets remember their last values.
  - Fold states are remembered.
- **Notifications are a soft glow and a small "!"** on the Bank bar or the Auction, never a blocking popup.
- **Toasts** for announcements that don't need an answer (spawns, start-of-game help). **Windows** only for decisions.
- **Things the player needs to find stand out.** The Ether entry is colored so everyone finds it. The "Never show again" control
  on What you must know glows.

### 2.9 Visual style: the game's own, not a template
- **Keep what was good.** The v12-era look is the base: simple bordered rectangles, a dark palette and the mono font. "Do not
  simply redo everything." "Do not use the most popular and basic ui templates IF they aren't within my style and intentions."
  (This beats the generic advice in any design skill.)
- **No black bars on UI elements or buttons, anywhere on the site.** The **black lines in the page background stay**; he likes
  them. A Display option can turn both off.
- **Outlines go all the way around a box,** on all four sides, never partial.
- **One window, one theme.** New windows use the theme's colors; "The theme will be the same color as everything else."
- **Themes:**
  - The available themes are Ether's Crossroads (the default on every Ether's Crossroads page), Kenoma, Kenoma (dull), Office,
    Office Dark, Druid, Jester, Ten and Disturbed Satan.
  - Office must never be blinding: soft grey-white, not pure white.
  - Colors come from the theme tokens (`--ground --well --deep --text --dim --amber --amber-hi --rule --string`), never
    hard-coded where a token exists.
- **Color coding by spell school** is used for frames, cooldown bars and effects:

  | School | Color | Hex |
  |---|---|---|
  | Necromancy | very dark purple-blue | `#4a3d9a` |
  | Enchantment | gold | `#e3b944` |
  | Curse | crimson | `#c8202e` |
  | Sorcery | dark, rich green | `#2f9a5a` |
  | Illusion | orange | `#ec8a2c` |
  | Conjuring | mana blue | `#5b48d6` |
  | Astrology | teal | `#2fb8a8` |
  | Bank | gold | `#e8c24a` |

  The same school must look the same everywhere. That's why every Necromancy row has the purple frame, not just two of them.
- **Pixel art matches the page background's pixel density.** The battle maps, the banker portrait and the dungeon all use it,
  with crisp pixels and no smoothing.
- **Card faces follow one system:**
  - A top-left mark (rank, letter or symbol, in the shared blackletter) and the name along the bottom.
  - Card art in the same ink and line weight as the standard cards.
  - One type per card.
  - Art must be recognizable at a glance: a horse is a horse, a cannon is a cannon.
  - Special families are clearly different: Demons are crimson cards; the Bank's Debt Collectors are black cards with red
    lettering and gold accents.

### 2.10 Motion, sound and feedback
**Animations:**
- They stay with what they're about. Effects over cards move with the board and never stay fixed to the screen while the page
  scrolls.
- They are small, see-through and magical. The crit seal is a glowing outline of a die over the attacked card, not a big
  banner.
- "Neither effects should be overdone; both effects should also be able to be noticed."
- They use the school colors. Particular effects stay on one card or tile; area effects cover areas.

**Animation switches:**
- Cards and magic have separate switches, plus switches for particular effects (like drifting fog).
- With animations off, the fog becomes a still image.
- Respect reduced motion.

**Fog of war:**
- It flows through the map like mist. It isn't square per tile and isn't too black.
- The wispy grey-white clouds are liked; keep them.

**Sound:**
- All sounds come from one family and sound like a game: simple onomatopoeia, not realism, and no longer than a few seconds.
- There is a click sound on every button, site-wide, as feedback.

**Music:**
- It is quiet and never annoying. Volume moves in 5% steps up to 150%.
- It ducks briefly under cycle sounds without changing the settings.
- The songs differ in timbre, with a little Silent Hill in them.

**Shared effects:** field effects that concern several players are shown to all of them.

### 2.11 Care in the details
- "Certainly on care or details." Small defects (half an outline, a stray capital, a tip covering its subject) count as real
  bugs, not polish.
- **Check UI changes by eye** at a phone size and a computer size, at Bryce's settings (Text 180%, UI 80%), and in at least one
  3+ player game. Look at the actual screen, not just the code.
- **Bug sweeps include UI/UX and English,** not only console errors. "Go heavy on checking and finding glitches … this includes
  UI/UX. Check for English and sentences."

---

## 3. How to work (the related process rules)

- **Notes first.** For every multi-part request, keep a sheet in `source/notes/` with:
  - **Part A:** the request verbatim.
  - **Part B:** a digest with IDs.
  - **Part C:** the plan and its order, plus a status log.

  "Dont make your notes forget my requests, and esp their principles."
- **Work in parts. Don't jump ahead** when parts give better UI ("the look of the game matters a ton"). Order the work by logic:
  what's broken comes first, then what every game touches, then looks, then new features. "Do not neglect the order of your logic."
- **Flag readings.** When a request is ambiguous or cut off, pick the most reasonable reading, build it, and list it under "My
  readings" in the sheet and in the reply. Ask first only when a wrong guess would be costly.
- **Don't redo what works.** Change what was criticized, and keep what wasn't.
- **Leave section notes in the code** (`/* ---------- what this part does ---------- */`), so each part is easy to understand.
- **Test before shipping:** a headless browser at phone and desktop size, AI-vs-AI games with no errors, then deploy.

---

## 4. Anti-patterns he has already caught (never again)

| What happened | The rule it broke |
|---|---|
| Selection panel became "a cluster of jumbled words" at large text | 2.5 scale-safe layouts |
| Two pages of scrolling to reach the Selected box | 2.1 playability |
| Planet names shown with quotation marks, some planets with quotes and some without | 2.3 English, 2.11 care |
| "Buy Mana" as a spell name | 2.3 names that make sense |
| "Player one (you) play - everyone play this together" floating beside the phases | 2.1 no floating text, 2.3 clarity |
| Tall-rectangle Substance tiles with a box running sideways below | 2.2 same group, same shape |
| A card-info corner nobody could find, which also needed a click | 2.4 info on demand, made easy |
| "i" buttons all over the play menu | 2.4 |
| Chat that couldn't be closed on a phone | 2.1, 2.8 |
| Fog solid black and squared per tile | 2.10 |
| Crit popup big and fixed to the screen | 2.10 |
| "Turn 14 round 7" in small grey type | 2.3 vocabulary, 2.5 |
| Bank window with huge type and dead space | 2.5, 2.6 |
| A Yes-and list snapping shut on the third click | 2.8 |
| "We advise against" | 2.3 voice |
| Half-outlined boxes on the front page | 2.9 |
| Black bars on buttons and UI elements | 2.9 |
| Office theme too white | 2.9 |
| Horizontal scrolling in the setup window | 2.1 |
| Hover tip covering the stat box it referred to | 2.4 |

---

## 5. Checklist before any UI change ships

- [ ] It works: no console errors, every window closes, nothing can be clicked twice where it should be once.
- [ ] Reachable without hunting; no page scroll needed for turn essentials on a computer; no scroll traps; no sideways
      scroll.
- [ ] Sorted by a rule; same-size tiles in a group; the same pattern as its sibling menus.
- [ ] English: concise, correct capitals, no stray quotes, the game's vocabulary, no "we/I," "you" only where allowed, and in
      agreement with the rules page and tooltips.
- [ ] Names on tiles, explanations on hover (about a 1 s delay) or tap/hold with an X; no tip covers its subject.
- [ ] Readable at Text 180% / UI 80%; nothing clipped; no oversized type; no dead space.
- [ ] Phone checked: 80%/90% baseline, folds, touch targets, Back confirm, tabs reachable.
- [ ] X on every window; X = No; disabled things faded; options shown only when they apply; open lists stay open.
- [ ] Theme tokens used; outlines on all four sides; no black bars on UI; school colors right; looks right in at least the
      default theme and Office.
- [ ] Animations local to their cards, small, switchable; sounds short and in the family.
- [ ] Section notes in the code; the sheet's status updated; readings flagged.

---

## 6. Reference values (as of v58)

| Setting | Value |
|---|---|
| Theme tokens | `theme/site.css` `:root`; per-theme overrides in `html.th-*` classes. Theme list: `THEMES` in `game/src/10_prefs.js`. |
| Fonts | `--mono` = Cascadia Code (site-wide, weight 200). Blackletter class `.bl` = Grenze Gotisch, with "Old English Text MT" as fallback. |
| School colors | `SCHOOL_COL` in `game/src/30_cycles.js` |
| Spell school order | `SCHOOLS` in `04_spells.js`, with Astrology spliced in second in `19_planets.js` |
| Text Size formula (v20) | `base·(1+(f−1)·w)`, with `w = clamp((18−base)/8, 0, 1)`, capped at 21px; tips grow half as much (`TZ_DAMP`) |
| Phone folds | `38_mobile.js` (`FOLDS`); the log folds on a computer too, closed by default |
