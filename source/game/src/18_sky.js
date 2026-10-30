/* ---------------- Prompt 10a: the sky and the Firmament ----------------
   The moon's place in the sky can hold Saturn ("No") or Mars ("Strife"); the Sun, Venus, Jupiter and Mercury come next.
   The Firmament is above the moon's and Saturn's harms and meteors, keeps a Miner on the moon, and casts
   Blood Moon, Rain, Asteroid, Fog and Mars. */

/* a Heavenly Body that starts in the sky keeps out the Emanation it would serve */
const skyBlocked = (sky) =>
  sky === "saturn"
    ? ["yald"]
    : ["mars", "sun", "venus", "jupiter", "mercury"].includes(sky)
      ? ["firm"]
      : [];
const isFirm = (pl) => !!(G.p[pl] && G.p[pl].tribe === "firm");
/* the Leviathan's New Moon: the real New Moon, or every eighth round while it coils on a planet (v78j: any it may rise to) */
const levNew = () =>
  (G.moon.i === 0 && !G.moon.gone) ||
  (["mars", "venus", "jupiter", "mercury"].includes(G.moon.gone) &&
    G.moon.round % 8 === 1);

/* ---------- the start of a turn: Mars, the moon's Miner, the end of Rain ---------- */
function skyTurn(pl) {
  const P = G.p[pl];
  if (!P) return;
  // the Miner on the moon dies when the moon leaves the sky or the Leviathan climbs onto it
  checkMoonMiner();
  const MM = G.moonMiner;
  if (MM && MM.owner === pl) {
    const v = R(2) - 1;
    mineNote(pl, "moon", v);
    if (v) {
      const got = giveMana(pl, v);
      if (got) log(`${plName(pl)}'s Miner on the moon brings ${got} mana.`);
    }
  }
  if (G.rain && G.rain.by === pl) {
    G.rain = null;
    log(`The rain over the field stops.`);
  }
  if (G.ffog && G.ffog.by === pl && tnOf(pl) >= G.ffog.until) {
    G.ffog = null;
    log(`The Firmament's fog lifts.`);
  }
  // Mars: plain soldiers find their courage
  if (G.moon.gone === "mars" && !isHorde(pl)) {
    let n = 0;
    for (const { st } of stacksOf(pl)) {
      st.mars = false;
      if (
        st.cards.every(
          (c) => !c.unit && (kind(c) === "grunt" || kind(c) === "infantry"),
        ) &&
        R(8) <= 5
      ) {
        st.mars = true;
        n++;
      }
    }
    if (n)
      log(
        `Mars stirs ${n} of ${plName(pl)}'s soldier stack${n > 1 ? "s" : ""}: advantage on the next attack.`,
      );
  }
}
function checkMoonMiner() {
  const MM = G.moonMiner;
  if (
    MM &&
    (G.moon.gone ||
      (G.moonLev && G.moonLev.owner !== MM.owner) ||
      G.p[MM.owner].out)
  ) {
    // v62: the Leviathan's own player keeps the Moon's mining slot
    G.moonMiner = null;
    MM.card.owner = MM.owner;
    toGrave(MM.card, "death");
    log(
      `${G.moon.gone ? "The moon has left the sky" : "The Leviathan is on the moon"}: ${plName(MM.owner)}'s Miner on the moon is gone.`,
      "event",
    );
    notify(MM.owner, "The Miner on the moon is lost.");
  }
}
/* Rain: every sacrifice gives one more mana, and one mana to the Firmament */
function rainSac(pl) {
  const Rn = G.rain;
  if (!Rn || G.p[Rn.by].out) return;
  const a = giveMana(pl, 1);
  let b = 0;
  if (pl !== Rn.by) b = giveMana(Rn.by, 1);
  if (a || b)
    log(
      `The rain: ${plName(pl)} gets ${a} more${b ? `, and ${plName(Rn.by)} 1` : ""}.`,
    );
}

/* ---------- the Firmament's Fog: enemies see only what is beside them (their Scouts one less); blind at the New Moon ---------- */
function firmFog(V) {
  const F = G.ffog;
  if (!F || !G.p[F.by] || G.p[F.by].out || tnOf(F.by) >= F.until) return null;
  const nm = G.moon.i === 0 && !G.moon.gone;
  if (isEnemy(F.by, V)) return nm ? { blind: true } : { cut: 1 };
  return nm ? { own: true } : null;
}
const visR = (x, ff) =>
  (ff && ff.own) || !hasK(x.st, "scout") ? 1 : 2 - (ff && ff.cut ? 1 : 0);
/* every card sees the eight tiles around it; a Scout sees two tiles out in a diamond (which holds those eight too) */
/* v70c: a Lighthouse lights a circle seven tiles across (eleven in King of the Hill, where every sight is longer). Whatever cuts
   a Scout's sight down to almost nothing (the Firmament's Fog) leaves the Lighthouse no better than a Scout: then it sees
   like any card. It lights the fog only: hidden Assassins and face-down stacks still need a Scout. */
const lhR = (x, ff) =>
  !hasK(x.st, "lighthouse") || ff ? 0 : G.opts.layout === "koth" ? 5.3 : 3.5;
const inSight = (x, r, c, ff) => {
  const dr = Math.abs(x.r - r),
    dc = Math.abs(x.c - c),
    v = visR(x, ff),
    L = lhR(x, ff);
  if (L && Math.hypot(dr, dc) <= L) return true;
  if (dr === 2 && dc === 2 && !ff && diagSight(x.st)) return true; // v78r: a Jack, Samson or Antony sees one tile further along each diagonal (they strike and step that way)
  if (G.opts.layout === "koth" && !ff && v >= 1)
    return Math.hypot(dr, dc) <= (hasK(x.st, "scout") ? 4.3 : 2.3); // v57: King of the Hill: sight is a circle
  return (
    (Math.max(dr, dc) <= 1 && v >= 1) ||
    (hasK(x.st, "scout") && !(ff && ff.own) && dr + dc <= v)
  );
};
const diagSight = (st) =>
  st.cards.some(
    (c) => kind(c) === "jack" || (c.unit && UNIT[c.unit] && UNIT[c.unit].diag2),
  );

/* ---------- drawings ---------- */
function marsSVG() {
  return `<svg class="moon mars" viewBox="-44 -44 88 88" width="88" height="88" aria-hidden="true"><defs><radialGradient id="marsg" cx="38%" cy="34%"><stop offset="0" stop-color="#f08a5a"/><stop offset=".65" stop-color="#b3431f"/><stop offset="1" stop-color="#5a1a0c"/></radialGradient><radialGradient id="marsglow"><stop offset="55%" stop-color="#ff6a3a" stop-opacity=".35"/><stop offset="100%" stop-color="#ff6a3a" stop-opacity="0"/></radialGradient></defs><circle r="40" fill="url(#marsglow)"/><circle r="24" fill="url(#marsg)" stroke="#3a120a"/><circle cx="-7" cy="5" r="3.4" fill="#8a3216" opacity=".7"/><circle cx="8" cy="-6" r="2.2" fill="#8a3216" opacity=".7"/><circle cx="4" cy="10" r="1.6" fill="#8a3216" opacity=".7"/><path d="M-18,-6C-10,-9 4,-2 18,-5" stroke="#7a2a12" stroke-width="1.6" fill="none" opacity=".6"/>${G.moonLev ? levOnMoon() : ""}</svg>`;
}
function minerOnMoon() {
  const P = G.p[G.moonMiner.owner];
  return `<g transform="translate(12,-30) scale(.9)"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="#000" stroke-width="3.4">${UNIT_ICON.miner}</g><g stroke="${P.color}" stroke-width="1.7">${UNIT_ICON.miner}</g></g></g>`;
}

/* ---------- spells ---------- */
PRICE.bloodcall = () => R(2) + R(2) + R(3) + R(3);
PRICE.rain = () => 1 + R(2);
PRICE.asteroid = () => R(2) + R(2) + R(2);
PRICE.ffog = () => R(2) + R(2);
PRICE.mars = () => R(3) + R(3);
SPELLS.push(
  {
    id: "bloodcall",
    tribe: "firm",
    dice: "2d2+2d3",
    name: "Blood Moon",
    cost: 4,
    school: "Sorcery",
    text: "The next Full Moon turns into a Blood Moon. Its harms don't touch the Firmament: your dead still go to the grave.",
    ok: () => !G.moon.gone && !G.moon.blood && !G.bloodCalled,
    run: async () => {
      G.bloodCalled = true;
      G.forceMoon = 1;
      log(
        `<b>Blood Moon</b>: ${plName(G.active)} calls the blood onto the next Full Moon.`,
        "event",
      );
      notify(null, "The next Full Moon will be a Blood Moon.");
    },
  },
  {
    id: "rain",
    tribe: "firm",
    dice: "1d2+1",
    name: "Rain",
    cost: 2,
    school: "Sorcery",
    text: "Until your next turn begins, every card anyone sacrifices gives one more mana, and every sacrifice by another player also gives you one mana.",
    ok: () => !G.rain,
    run: async () => {
      G.rain = { by: G.active };
      log(
        `<b>Rain</b> falls over the field: sacrifices are worth one more until ${plName(G.active)}'s next turn, and every sacrifice feeds the Firmament.`,
        "event",
      );
    },
  },
  {
    id: "asteroid",
    tribe: "firm",
    dice: "3d2",
    name: "Asteroid",
    cost: 4,
    school: "Sorcery",
    text: "Select a stack: an asteroid falls on it. One damage there, one damage on a 4 of 1d4 on every tile around it (Walls take 1d2 + 1), and fire over the area for two rounds. The Firmament is immune.",
    ok: () => !!selStack() && !isFirm(selStack().owner),
    run: async () => {
      const { r, c } = G.sel;
      SND.gun();
      log(
        `<b>Asteroid</b>: ${plName(G.active)} brings a rock down on ${coord(r, c)}.`,
        "event",
      );
      skyStrike(r, c, "The asteroid");
      if (G.sel && !G.board[G.sel.r][G.sel.c]) G.sel = null;
    },
  },
  {
    id: "ffog",
    tribe: "firm",
    dice: "2d2",
    name: "Fog",
    cost: 4,
    school: "Illusion",
    text: "For 1d2 rounds your enemies see only what is right beside their cards, and their Scouts one tile less. Not under the Full Moon; at the New Moon it blinds them completely, while your own cards see one tile. Once every three rounds.",
    ok: () =>
      G.moon.i !== 4 && !G.ffog && tnOf(G.active) >= (me().fogReady || 0),
    run: async () => {
      const pl = G.active,
        d = R(2);
      G.ffog = { by: pl, until: tnOf(pl) + d };
      me().fogReady = tnOf(pl) + 3;
      G._vis = null;
      tray(pl, "Fog", [{ s: 2, v: d }], `${d} round${d > 1 ? "s" : ""}`);
      log(
        `<b>Fog</b> rolls in from ${plName(pl)}'s Firmament for ${d} round${d > 1 ? "s" : ""}.`,
        "event",
      );
      notify(pl, "The Firmament's fog rolls over the field.");
    },
  },
  {
    id: "mars",
    tribe: "firm",
    dice: "2d3",
    name: "Mars",
    cost: 4,
    school: "Sorcery",
    text: "Mars takes the moon's place in the sky (“Strife”). Each round every stack of only Grunts and Infantry gets advantage on its next attack on 1–5 of 1d8. The moon's phases stop and your Miner on the moon is lost; a Leviathan on the moon coils on Mars instead. Not while Saturn hangs there, and never again once Mars is eaten.",
    ok: () =>
      G.moon.gone !== "mars" && G.moon.gone !== "saturn" && !G.marsEaten,
    run: async () => {
      G.moon.gone = "mars";
      G.moon.i = -1;
      G.moon.blood = false;
      applyMoonTheme();
      log(
        `<b>Mars</b>: ${plName(G.active)} sets Mars in the sky where the moon was.`,
        "event",
      );
      popup(
        "Mars",
        `<p>${plName(G.active)} hangs Mars in the moon's place. The phases stop.</p><p>At the start of each round, every stack made only of Grunts and Infantry (Puppets too) gets advantage on its next attack on 1–5 of 1d8.</p>`,
        G.active,
      );
    },
  },
);

/* ---------- the computer playing the Firmament ---------- */
async function aiSky(pl, W, cast1) {
  const P = G.p[pl],
    lv = P.cpu;
  if (P.tribe !== "firm" || G.over) return;
  const foes = enemiesOf(pl)
    .flatMap(stacksOf)
    .filter((e) => seesTile(pl, e.r, e.c));
  // the Asteroid where it hurts the most
  let best = null;
  for (const e of foes) {
    let s = AI.value(e.st);
    for (const f of foes)
      if (f !== e && Math.max(Math.abs(f.r - e.r), Math.abs(f.c - e.c)) === 1)
        s += AI.value(f.st) * 0.25;
    if (!best || s > best.s) best = { ...e, s };
  }
  if (
    best &&
    best.s > (lv === "hard" ? 4 : 6) &&
    mana(pl) >= (G.prices.asteroid || 4) + 1
  )
    await cast1("asteroid", best.r, best.c);
  const close = foes.some((e) =>
    stacksOf(pl).some((m) => Math.abs(m.r - e.r) + Math.abs(m.c - e.c) <= 3),
  );
  if (
    close &&
    lv !== "easy" &&
    mana(pl) >= (G.prices.ffog || 4) + 1 &&
    Math.random() < (lv === "hard" ? 0.6 : 0.4)
  )
    await cast1("ffog");
  if (
    !G.moon.gone &&
    G.moon.i >= 1 &&
    G.moon.i <= 3 &&
    mana(pl) >= (G.prices.bloodcall || 6) + 1 &&
    Math.random() < 0.25
  )
    await cast1("bloodcall");
  const soldiers = (pls) =>
    pls
      .flatMap(stacksOf)
      .filter((x) =>
        x.st.cards.every(
          (c) => !c.unit && (kind(c) === "grunt" || kind(c) === "infantry"),
        ),
      ).length;
  if (
    G.moon.gone !== "mars" &&
    soldiers([pl]) > soldiers(enemiesOf(pl)) + 1 &&
    mana(pl) >= (G.prices.mars || 4) + 1 &&
    Math.random() < 0.3
  )
    await cast1("mars");
  if (mana(pl) >= (G.prices.rain || 2) + 2 && Math.random() < 0.2)
    await cast1("rain");
}
