# Source for the Nous Within Kenoma site (incl. Ether's Crossroads)

The live site files at the repo root are BUILT from this folder. Edit here, then rebuild.

Build:  cd source && python3 -I build_all.py    -> writes everything into source/site/
Deploy: copy the files from source/site/ to the repo root (GitHub Pages serves the root).

- game/src/NN_*.js   game modules, concatenated in filename order into ethers-crossroads.js
- game/text/         rules page text (rules_modes.html), substances.json, rules.css
- theme/             site.css, site.js, game.css (game.css -> ethers-crossroads.css)
- assets/            images and fonts copied as-is
- codex/, edits/, nwk/, chapters_all.json   lore pages, chapter edits, character web / cosmos maps
- game_pages.py      builds the 3 game pages; the ?v=NN cache tag lives here
- make_parts.py      old zip-maker for manual uploads (not needed with direct repo access)
- tools/             headless AI-vs-AI sims (node simp.js ..., needs `npm install playwright`)
- notes/             design notes, verbatim requests, pending to-do list (next_requests_2026-10-18.md)
