/* ---------------- Prompt 10b: the Second Sun (and the Black Sun), Venus, Jupiter, and Oaths (Astrology) ----------------
   G.moon.gone names what hangs in the moon's place: "mars", "sun", "blacksun", "venus", "jupiter", "saturn", "eaten",
   "fallen" (the Sun came down), "off". Planets the Firmament set up remember who did it in G.planetBy. */

SCHOOLS.splice(1, 0, "Astrology"); // v47: Conjuring, then Astrology, then Necromancy
const sky = () => G.moon.gone || "moon";
const PLANETS = {
  mars: { name: "Mars", word: "Strife", hunger: 3 },
  sun: { name: "The Second Sun", word: "King", hunger: 3 },
  blacksun: { name: "The Black Sun", word: "King", hunger: 3 },
  venus: { name: "Venus", word: "Harmony", hunger: 3 },
  jupiter: { name: "Jupiter", word: "Fortune", hunger: 4 },
  neptune: { name: "Neptune", word: "Dissolve", hunger: 4 }, // v71c
};
const planetUp = (k) => G.moon.gone === k;
const sunUp = () => G.moon.gone === "sun";
const oathOf = (pl) => (G.p[pl] && G.p[pl].oath) || null; // v50: an Oath holds whatever is in the sky
const oathFree = (k) => !(G.eatenP || []).includes(k); // v50: any Heavenly Body not eaten can be sworn to
const OATH_SKY = { sun: "earth", venus: "venus", jupiter: "jupiter" };
const planetBy = () =>
  G.planetBy != null && G.p[G.planetBy] && !G.p[G.planetBy].out
    ? G.planetBy
    : null;

/* ---------- maximum mana from the sky: Venus's gifts and Oath ---------- */
function skyCapMod(P) {
  if (!G || !P) return 0;
  let m = 0;
  const pl = P.i;
  if (planetUp("venus")) {
    const V = G.venus;
    const x = G.eclipse && G.eclipse.k === "venus" ? 2 : 1; // an eclipse of Venus doubles its gifts
    if (V && V.mode === "a" && V.target === pl) m += 2 * x;
    if (V && V.mode === "b" && V.by != null && isEnemy(V.by, pl)) m += 2 * x;
  }
  if (P.oath === "venus") {
    if (P.venusPeace) m += 2;
    if (P.venusPen && tnOf(pl) <= P.venusPen) m -= 2;
  } // v78j: the Oath holds under any sky
  if (G.jupMax && G.jupMax[pl] && G.moon.round <= G.jupMax.until)
    m += G.jupMax[pl]; // a Jupiter eclipse (Prompt 10c)
  return m;
}

/* ---------- setting a Heavenly Body in the sky ---------- */
function setPlanet(k, by) {
  const old = sky();
  if (G.moonLev && (k === "sun" || k === "blacksun")) {
    const L = G.moonLev;
    G.moonLev = null;
    L.card.hp = L.card.maxHp;
    G.p[L.owner].deck.push(L.card);
    shuffle(G.p[L.owner].deck);
    log(
      `The Leviathan can't lie on the Sun: it falls back into ${plName(L.owner)}'s deck.`,
      "event",
    );
  }
  G.moon.gone = k;
  G.moon.i = -1;
  G.moon.blood = false;
  G.planetBy = by;
  if (k === "sun") {
    G.sunTears = 0;
    G.sunJudgeStart = G.turnNo;
  }
  G._vis = null;
  applyMoonTheme();
  checkMoonMiner();
  if (OATH_SKY[k])
    notify(
      null,
      `${PLANETS[k].name} is in the sky: anyone can swear its Oath (Astrology).`,
    );
  if (old === "jupiter") {
    G.jupSale = null;
  }
}
/* ---------- the Second Sun: judgement every 2d2 rounds ---------- */
async function skyAsync(pl) {
  const P = G.p[pl];
  if (!P || isHorde(pl) || P.out) return;
  if (sunUp() && P.tribe !== "firm") {
    if (P.sunNext == null) {
      P.sunNext = tnOf(pl) + R(2) + R(2);
      return;
    }
    if (tnOf(pl) < P.sunNext) return;
    P.sunNext = tnOf(pl) + R(2) + R(2);
    // v65, the Sun's judgement (mine): 1d6 mana to the Bank, or 1d2 damage to your stacks, or 1d2 + 1d3 deck cards; or blindness for 1d3 rounds
    const nM = R(6),
      nH = R(2),
      nD = R(2) + R(3),
      nB = R(3),
      opts = [];
    if (mana(pl) >= nM)
      opts.push({
        id: "mana",
        label: `Pay ${nM} mana`,
        sub: "1d6, to the Bank.",
      });
    if (stacksOf(pl).length)
      opts.push({
        id: "hurt",
        label: `${nH} damage to your stacks`,
        sub: `1d2: ${nH > 1 ? "each blow to a random stack of yours" : "one blow to a random stack of yours"}.`,
      });
    opts.push({
      id: "deck",
      label: `${nD} cards from your deck${shortNote(pl, nD)}`,
      sub: "1d2 + 1d3: they burn in the Sun (to the grave). Cards your deck can't give cost 1 mana each.",
    });
    opts.push({
      id: "no",
      label: `Blindness for ${nB} round${nB > 1 ? "s" : ""}`,
      sub: "1d3: you can't see even what is beside you.",
    });
    const ch =
      opts.length === 1
        ? "no"
        : await ask(pl, {
            kind: "choice",
            id: "sunjudge",
            title: `The Second Sun judges ${esc(P.name)}`,
            options: opts,
            ai: () =>
              mana(pl) >= nM + 2
                ? "mana"
                : P.deck.length > 8 + nD
                  ? "deck"
                  : stacksOf(pl).length > 3 && opts.some((o) => o.id === "hurt")
                    ? "hurt"
                    : opts.some((o) => o.id === "mana")
                      ? "mana"
                      : opts[0].id,
          });
    if (ch !== "hurt" && typeof planetFX === "function") planetFX("sun"); // v70: the Sun's own sign
    if (ch === "mana") {
      payQuiet(pl, nM);
      bankAdd(nM);
      log(
        `${plName(pl)} worships the Earth before the Second Sun: ${nM} mana to the Bank.`,
      );
      sunPayback(pl, nM);
    } else if (ch === "hurt") {
      const hit = [];
      G.sunHurt = true;
      try {
        for (let i = 0; i < nH; i++) {
          const L = stacksOf(pl);
          if (!L.length) break;
          const x = pick(L);
          hit.push(coord(x.r, x.c));
          damage(x.r, x.c, 1, false);
        }
      } finally {
        G.sunHurt = false;
      }
      log(
        `${plName(pl)} offers the Second Sun ${nH} wound${nH > 1 ? "s" : ""} (${hit.join(", ")}).`,
      );
      sunPayback(pl, nH);
    } else if (ch === "deck") {
      let w = 0,
        k = 0;
      for (const c of takeDeck(pl, nD, "the Second Sun")) {
        w += soulOf(c);
        toGrave(c, "burn");
        k++;
      }
      log(
        `${plName(pl)} burns ${k} deck card${k > 1 ? "s" : ""} in the Second Sun.`,
      );
      sunPayback(pl, w);
    } else {
      P.sunBlind = tnOf(pl);
      P.sunBlindTo = tnOf(pl) + nB - 1;
      G._vis = null;
      log(
        `<b>The Second Sun</b> blinds ${plName(pl)} for ${nB} round${nB > 1 ? "s" : ""}.`,
        "event",
      );
      notify(
        pl,
        `${esc(P.name)} is blinded by the Sun for ${nB} round${nB > 1 ? "s" : ""}.`,
      );
    }
    render();
  }
  // the Black Sun: the Firmament who raised it pays Yaldabaoth every 1d2 rounds
  if (
    planetUp("blacksun") &&
    P.tribe === "firm" &&
    G.blackBy != null &&
    !G.p[G.blackBy].out
  ) {
    if (P.blackNext == null) P.blackNext = tnOf(pl) + R(2);
    if (tnOf(pl) >= P.blackNext) {
      P.blackNext = tnOf(pl) + R(2);
      const Y = G.blackBy,
        n = R(2);
      const ch = await ask(pl, {
        kind: "choice",
        id: "blacksun",
        title: `The Black Sun: ${esc(P.name)} pays Yaldabaoth`,
        options: [
          { id: "mana", label: `${n} mana` },
          {
            id: "deck",
            label: `${n} card${n > 1 ? "s" : ""} from your deck${shortNote(pl, n)}`,
          },
        ],
        ai: () => (mana(pl) >= n + 2 ? "mana" : "deck"),
      });
      if (ch === "mana") {
        const p = payQuiet(pl, Math.min(n, mana(pl)));
        giveMana(Y, p);
        log(
          `The Black Sun: ${plName(pl)} pays ${plName(Y)} ${p} mana.`,
          "event",
        );
      } else {
        let k = 0;
        for (const c of takeDeck(pl, n, "the Black Sun")) {
          c.owner = Y;
          G.p[Y].deck.push(c);
          k++;
        }
        shuffle(G.p[Y].deck);
        log(
          `The Black Sun: ${plName(pl)} gives ${plName(Y)} ${k} deck card${k === 1 ? "" : "s"}.`,
          "event",
        );
      }
    }
  }
}
const sunBlind = (pl) => {
  const P = G.p[pl];
  if (!P || P.sunBlind == null) return false;
  const t = tnOf(pl);
  return (
    t >= P.sunBlind && t <= (P.sunBlindTo != null ? P.sunBlindTo : P.sunBlind)
  );
}; // v65: blind for 1d3 rounds

/* ---------- the start of a turn: Venus and its Oath ---------- */
function planetTurn(pl) {
  const P = G.p[pl];
  if (!P || isHorde(pl)) return;
  if (planetUp("venus")) {
    const V = G.venus;
    if (V && V.target === pl) {
      const n = (V.mode === "a" ? 2 : 1) * (eclipseOn("venus") ? 2 : 1),
        got = giveMana(pl, n);
      if (got) log(`Venus gives ${plName(pl)} ${got} mana.`);
    }
  }
  if (P.oath === "venus") {
    P.venusPeace = !P.venusAttacked;
    P.venusAttacked = false;
    if (P.venusPeace) {
      const got = giveMana(pl, 2);
      log(
        `Venus rewards ${plName(pl)}'s peace: ${got} mana and two more maximum this turn.`,
      );
    }
  } // v78j: any sky
  if (planetUp("jupiter") && (!G.jupSale || G.jupSale.round !== G.moon.round))
    rollJupSale();
}
/* attacking a player under the Oath of Venus costs 1d2 mana and two maximum for 1d3 rounds */
function venusAttack(atk, def) {
  const P = G.p[atk];
  if (!P || P.oath !== "venus" || isNPC(def)) return;
  P.venusAttacked = true;
  P.venusPeace = false;
  const d = R(2),
    t = R(3);
  payQuiet(atk, Math.min(d, mana(atk)));
  P.venusPen = tnOf(atk) + t;
  log(
    `Venus frowns on ${plName(atk)}'s attack: −${d} mana and two maximum for ${t} round${t > 1 ? "s" : ""}.`,
  );
}

/* ---------- Jupiter: sales, cheaper conjuring for its Oath, trades ---------- */
function rollJupSale() {
  const cj = SPELLS.filter(
    (s) => s.school === "Conjuring" && !s.tribe && s.id !== "maxmana",
  );
  G.jupSale = {
    round: G.moon.round,
    ids: shuffle([...cj])
      .slice(0, 2)
      .map((s) => s.id),
  };
  log(
    `Jupiter's sale this round: ${G.jupSale.ids.map((id) => SP(id).name).join(" and ")} (maybe one mana off).`,
  );
}
const onJupSale = (id) =>
  planetUp("jupiter") && G.jupSale && G.jupSale.ids.includes(id);
function jupiterCost(sp, c) {
  if (sp.school !== "Conjuring" || c <= 1) return c; // v78j: the Oath holds under any sky
  if (oathOf(G.active) === "jupiter") c -= 1; // the Oath of Jupiter: one less, but nothing that costs one already
  return Math.max(1, c);
}
/* after a purchase: Jupiter's sale may or may not pay off; the Heavenly Body's master may get a mana */
function skyBought(sp, cost) {
  if (onJupSale(sp.id) && cost > 0) {
    const v = R(2) - 1;
    if (v) {
      giveMana(G.active, v);
      log(
        `Jupiter's sale: ${plName(G.active)} gets ${v} mana back on ${esc(sp.name)}.`,
      );
    } else log(`Jupiter's sale: no luck on ${esc(sp.name)} this time.`);
    jupKick();
  }
}
function jupKick() {
  const by = planetBy();
  if (
    by != null &&
    G.moon.gone === "jupiter" &&
    by !== G.active &&
    R(2) === 2
  ) {
    giveMana(by, 1);
    log(`Fortune smiles on ${plName(by)}: 1 mana.`);
  }
}
/* trading hand cards at the Auction while Jupiter is up */
async function tradeCard(pl) {
  const P = G.p[pl];
  if (!P.hand.length) return;
  const others = alive().filter(
    (i) => i !== pl && !isHorde(i) && G.p[i].hand.length,
  );
  if (!others.length) {
    flash("Nobody else has a card to trade.");
    return;
  }
  const i = await ask(pl, {
    kind: "cards",
    id: "trade",
    title: "Trade: which card do you offer?",
    cards: P.hand,
    cancel: "Cancel",
    box: "plain",
  });
  if (i == null) return;
  const give = P.hand[i];
  const to =
    others.length === 1
      ? others[0]
      : await ask(pl, {
          kind: "player",
          id: "trade",
          title: "Trade with whom?",
          players: others,
        });
  if (to == null) return;
  const Q = G.p[to];
  const j = await ask(to, {
    kind: "cards",
    id: "tradeback",
    title: `${esc(P.name)} offers ${esc(nameOf(give))}. Pick a card to give back, or refuse.`,
    cards: Q.hand,
    cancel: "Refuse",
    box: "plain",
    ai: () => {
      const k = Q.hand
        .map((c, ix) => [rate(c), ix])
        .sort((a, b) => a[0] - b[0])[0];
      return k && k[0] <= rate(give) ? k[1] : null;
    },
  });
  if (j == null) {
    log(`${plName(to)} turns down ${plName(pl)}'s trade.`);
    flash("The trade was refused.");
    return;
  }
  const back = Q.hand[j];
  P.hand.splice(P.hand.indexOf(give), 1);
  Q.hand.splice(Q.hand.indexOf(back), 1);
  give.owner = to;
  back.owner = pl;
  Q.hand.push(give);
  P.hand.push(back);
  log(
    `<b>Trade</b>${planetUp("jupiter") ? " under Jupiter" : ""}: ${plName(pl)} and ${plName(to)} swap a card each.`,
    "event",
  );
  if (planetUp("jupiter")) jupKick();
  render();
}

/* ---------- the Sun's fall ---------- */
function makeVoid(r, c) {
  const st = G.board[r][c];
  if (st) {
    G.board[r][c] = null;
    for (const x of st.cards) {
      if (x.captured && x.captured.length) {
        for (const s of x.captured) toGrave(s, "death");
        x.captured = [];
      }
      bury(x, r, c, st);
    }
    if (st.captive) toGrave(st.captive, "death");
  }
  G.void[r][c] = true;
  for (const k of Object.keys(G.map.art || {}))
    if (k.startsWith(r + "." + c + ".")) delete G.map.art[k];
  G.crystals = (G.crystals || []).filter((x) => !(x.r === r && x.c === c));
  G.fires = (G.fires || []).filter((x) => !(x.r === r && x.c === c));
}
function sunFall(r, c) {
  const black = planetUp("blacksun"),
    by = G.active;
  if (black) {
    log(
      `<b>The Black Sun falls</b> on ${coord(r, c)}: the ground there is gone for good.`,
      "event",
    );
    makeVoid(r, c);
    if (R(6) === 6) {
      log(
        `The hole tears wider: every tile around ${coord(r, c)} falls in too.`,
        "event",
      );
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr,
            cc = c + dc;
          if (
            (dr || dc) &&
            rr >= 0 &&
            cc >= 0 &&
            rr < G.rows &&
            cc < COLS &&
            !isVoid(rr, cc)
          )
            makeVoid(rr, cc);
        }
    }
    popup(
      "The Black Sun falls",
      `<p>The dead sun crashes onto ${coord(r, c)}. Everything there is destroyed, and the ground becomes a hole for the rest of the game.</p>`,
      by,
    );
  } else {
    log(`<b>The Second Sun falls</b> on ${coord(r, c)}!`, "event");
    const hit = (rr, cc, n) => {
      if (rr < 0 || cc < 0 || rr >= G.rows || cc >= COLS || isVoid(rr, cc))
        return;
      const st = G.board[rr][cc];
      if (!st) return;
      if (hasK(st, "wall")) wallHit(rr, cc, n + 1, "The falling Sun");
      else damage(rr, cc, n, false);
    };
    hit(r, c, 2);
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++)
        if ((dr || dc) && R(2) === 2) hit(r + dr, c + dc, 1);
    for (let dr = -2; dr <= 2; dr++)
      for (let dc = -2; dc <= 2; dc++)
        if (Math.max(Math.abs(dr), Math.abs(dc)) === 2 && R(10) === 10)
          hit(r + dr, c + dc, 1);
    popup(
      "The Second Sun falls",
      `<p>The Second Sun crashes onto ${coord(r, c)}: two damage there, one damage on a 2 of 1d2 on every tile around it, and one on a 10 of 1d10 on the ring beyond. Its own troops are not spared.</p>`,
      by,
    );
  }
  setPlanet("fallen", null);
  G.moon.gone = "fallen";
  applyMoonTheme();
  // whoever has nowhere left to put a card is out
  for (const pl of alive())
    if (!isHorde(pl) && !zoneTiles(pl).length)
      eliminate(pl, `${esc(G.p[pl].name)} has no ground left to stand on`);
  checkWin();
}

/* ---------- spells ---------- */
PRICE.sun = () => R(3) + R(3);
PRICE.venus = () => R(3) + R(3);
PRICE.jupiter = () => R(3) + R(3);
const firmPlace = (k) => () =>
  G.moon.gone !== k &&
  G.moon.gone !== "saturn" &&
  !(G.eatenP || []).includes(k);
SP("mars").school = "Astrology";
SPELLS.push(
  {
    id: "sun",
    tribe: "firm",
    dice: "2d3",
    name: "Second Sun",
    cost: 4,
    school: "Astrology",
    text: "Select your stack with a Joker: the Joker shoots itself (its souls go to your soul pile) and an indigo Second Sun (“King”) takes the moon's place. The fog of war is gone while it burns (Delusions stay). Every 2d2 rounds it judges each other player: 1 mana to you, one damage to one of their stacks, or two deck cards; or blindness for that turn. Others can swear the Oath of the Earth. The Leviathan can't lie on it.",
    ok: () => firmPlace("sun")() && G.moon.gone !== "blacksun" && selOwnJoker(),
    run: async () => {
      const s = G.sel,
        st = selStack();
      await jokerSuicide(s.r, s.c, st, G.active);
      setPlanet("sun", G.active);
      log(
        `<b>The Second Sun</b> rises where the moon was, raised by ${plName(G.active)}.`,
        "event",
      );
      popup(
        "The Second Sun",
        `<p>${plName(G.active)}'s Joker shoots itself and an indigo sun rises in the moon's place. The fog of war burns away.</p><p>Every 2d2 rounds the Sun judges each player, who pays 1d6 mana to the Bank, 1d2 damage to their stacks or 1d2 + 1d3 deck cards, or is blind for 1d3 rounds. Anyone can swear the <b>Oath of the Earth</b> (Astrology).</p>`,
        G.active,
      );
    },
  },
  {
    id: "sunfall",
    tribe: "firm",
    name: "Second Sun's Fall",
    cost: 0,
    school: "Astrology",
    text: "Free. Select a stack: the Sun crashes onto it. Two damage there, one damage on a 2 of 1d2 on every tile around it, one on a 10 of 1d10 on the ring beyond, your own troops too. A Black Sun instead destroys that tile and everything on it for good (and on a 6 of 1d6 every tile around it). The sky is empty afterwards.",
    ok: () => (sunUp() || planetUp("blacksun")) && !!selStack(),
    run: async () => {
      const { r, c } = G.sel;
      SND.gun();
      sunFall(r, c);
      if (G.sel && !at(G.sel.r, G.sel.c)) G.sel = null;
    },
  },
  {
    id: "venus",
    tribe: "firm",
    dice: "2d3",
    name: "Venus",
    cost: 4,
    school: "Astrology",
    text: "Venus (“Harmony”) takes the moon's place. Choose: you (or your teammate) get +2 mana a round and +2 maximum, or (not in Survival) +1 mana a round while every enemy gets +2 maximum. Anyone can swear the Oath of Venus.",
    ok: firmPlace("venus"),
    run: async () => {
      const pl = G.active,
        mates = [pl, ...alliesOf(pl).filter((i) => !isHorde(i))];
      const opts = [
        {
          id: "a",
          label: "+2 mana a round and +2 maximum",
          sub: "for you or a teammate",
        },
      ];
      if (!survival())
        opts.push({
          id: "b",
          label: "+1 mana a round, every enemy +2 maximum",
          sub: "for you or a teammate",
        });
      const mode =
        (await ask(pl, {
          kind: "choice",
          id: "venusmode",
          title: "Venus: which gift?",
          options: opts,
          ai: () => "a",
        })) || "a";
      const target =
        mates.length === 1
          ? pl
          : await ask(pl, {
              kind: "player",
              id: "venustarget",
              title: "Venus: for whom?",
              players: mates,
              ai: () => pl,
            });
      G.venus = { by: pl, mode, target: target ?? pl };
      setPlanet("venus", pl);
      log(
        `<b>Venus</b> rises for ${plName(G.venus.target)}: ${mode === "a" ? "+2 mana a round and +2 maximum" : "+1 mana a round, and every enemy +2 maximum"}.`,
        "event",
      );
    },
  },
  {
    id: "jupiter",
    tribe: "firm",
    dice: "2d3",
    name: "Jupiter",
    cost: 4,
    school: "Astrology",
    text: "Jupiter (“Fortune”) takes the moon's place. Miners in an Ace's slots bring 1d2 a round; each round two conjurings are on sale (maybe one mana back); cards can be traded hand to hand at the Auction; a Jester's Sacrificial Suicide brings 1d2 − 1 more. You may get a mana when others buy on sale or trade. Anyone can swear the Oath of Jupiter.",
    ok: firmPlace("jupiter"),
    run: async () => {
      setPlanet("jupiter", G.active);
      rollJupSale();
      log(
        `<b>Jupiter</b> rises where the moon was, raised by ${plName(G.active)}.`,
        "event",
      );
    },
  },
  {
    id: "oath_earth",
    name: "Oath of the Earth",
    cost: 0,
    school: "Astrology",
    text: "Free. Swear to the Earth: no necromancy for you, and every Sorcery spell with a dice price rolls its price twice for you and keeps the lower. Cast again to break the Oath.",
    ok: () => me().tribe !== "firm",
    run: async () => {
      toggleOath("earth");
    },
  },
  {
    id: "oath_venus",
    name: "Oath of Venus",
    cost: 0,
    school: "Astrology",
    text: "Free. Each round you start without having attacked a player: +2 mana and +2 maximum for that turn. Each attack on a player costs 1d2 mana and two maximum for 1d3 rounds. Cast again to break the Oath.",
    ok: () => oathFree("venus"),
    run: async () => {
      toggleOath("venus");
    },
  },
  {
    id: "oath_jupiter",
    name: "Oath of Jupiter",
    cost: 0,
    school: "Astrology",
    text: "Free. Every conjuring costs you one less, except what already costs one, and your mana can fall to −12 instead of −8. Cast again to break the Oath.",
    ok: () => oathFree("jupiter"),
    run: async () => {
      toggleOath("jupiter");
    },
  },
  {
    id: "cry",
    tribe: "yald",
    name: "The Sun Cries",
    cost: 0,
    school: "Sorcery",
    text: "Free, once every 1d3 rounds, while the Second Sun burns: Yaldabaoth makes it weep. Three times and its flames go out: the Black Sun. Then the Firmament that raised it pays you 1d2 mana or 1d2 deck cards every 1d2 rounds.",
    ok: () => sunUp() && tnOf(G.active) >= (me().cryReady || 0),
    run: async () => {
      const P = me();
      P.cryReady = tnOf(G.active) + R(3);
      G.sunTears = (G.sunTears || 0) + 1;
      if (G.sunTears >= 3) {
        G.moon.gone = "blacksun";
        G.blackBy = G.active;
        applyMoonTheme();
        G._vis = null;
        log(
          `<b>The Sun cries a third time</b> and its flames go out: <b>the Black Sun</b>.`,
          "event",
        );
        popup(
          "The Black Sun",
          `<p>${plName(G.active)} makes the Second Sun weep a third time. Its flames go out.</p><p>The fog of war returns. The Firmament that raised it now pays Yaldabaoth 1d2 mana or 1d2 deck cards every 1d2 rounds.</p>`,
          G.active,
        );
      } else {
        log(
          `<b>The Sun cries</b> (${G.sunTears} of 3): ${plName(G.active)}'s Yaldabaoth dims it.`,
          "event",
        );
        applyMoonTheme();
      }
    },
  },
);
function toggleOath(k) {
  const P = me();
  if (P.oath === "saturn" && P.satLocked) {
    flash("You betrayed Saturn: its Oath holds you now.");
    return;
  }
  if (P.oath === "saturn") saturnBreak(G.active); // v50: breaking the Oath of Saturn costs dearly
  if (P.oath === k) {
    P.oath = null;
    log(`${plName(G.active)} breaks the ${SP("oath_" + k).name}.`);
    return;
  }
  P.oath = k;
  P.venusAttacked = false;
  log(`${plName(G.active)} swears the ${SP("oath_" + k).name}.`, "event");
}

/* Night's Judgement eats whatever hangs in the sky: the moon at the New or Full Moon, any Heavenly Body at any time */
Object.assign(SP("judge"), {
  text: "Free: Yaldabaoth eats what hangs in the sky: the moon at the New Moon or the Full Moon, or Mars, the Second Sun (or the Black Sun), Venus or Jupiter at any time. A Leviathan on it falls back into its deck. Take its worth in mana, or count it toward the hunger (3, or 4 for Jupiter). An eaten Heavenly Body never comes back.",
  ok: () =>
    (!G.moon.gone && (G.moon.i === 0 || G.moon.i === 4)) ||
    !!PLANETS[G.moon.gone],
  run: async () => {
    const pl = G.active,
      P = me(),
      k = sky(),
      v = PLANETS[k] ? PLANETS[k].hunger : 3,
      nm = PLANETS[k] ? PLANETS[k].name : "the moon";
    if (G.moonLev) {
      const L = G.moonLev;
      G.moonLev = null;
      L.card.hp = L.card.maxHp;
      G.p[L.owner].deck.push(L.card);
      shuffle(G.p[L.owner].deck);
      log(
        `The Leviathan falls from the eaten sky back into ${plName(L.owner)}'s deck.`,
      );
    }
    if (k === "sun" && eclipseOn("sun")) {
      P.choke = G.moon.round + 1;
      log(
        `${plName(pl)} eats the Sun in its eclipse and chokes on it: blind, with no hold on his own troops, this round and the next.`,
        "event",
      );
    }
    (G.eatenP = G.eatenP || []).push(k === "blacksun" ? "sun" : k);
    if (k === "mars") G.marsEaten = true;
    G.moon.gone = "eaten";
    G.moon.i = -1;
    G.moon.blood = false;
    G.planetBy = null;
    G.venus = null;
    G.jupSale = null;
    for (const Q of G.p)
      if (Q.oath === (k === "blacksun" ? "sun" : k)) {
        Q.oath = null;
        log(`${plName(Q.i)}'s Oath ends with what it was sworn to.`);
      }
    applyMoonTheme();
    G._vis = null;
    const use = await ask(pl, {
      kind: "choice",
      id: "moonuse",
      title: `Night's Judgement: ${nm} is eaten`,
      options: [
        {
          id: "hunger",
          label: `Feed the hunger (${(P.hunger || 0) + v} of 7)`,
        },
        { id: "mana", label: `Take ${v} mana` },
      ],
      ai: () => "hunger",
    });
    if (use === "mana") giveMana(pl, v);
    else P.hunger = (P.hunger || 0) + v;
    log(
      `<b>Night's Judgement</b>: ${plName(pl)} eats ${nm}${use === "mana" ? " for mana" : ` (hunger ${P.hunger} of 7)`}.`,
      "event",
    );
    popup(
      "Night's Judgement",
      `<p>${plName(pl)} eats ${nm}. It is gone from the sky for good.</p>`,
      pl,
    );
  },
});
/* the Leviathan can rise onto the moon at the New Moon, or onto Mars, Venus or Jupiter at any time, never onto a Sun */
const levPlanet = () =>
  ["mars", "venus", "jupiter", "mercury"].includes(G.moon.gone);
SP("lev").ok = () =>
  ((G.moon.i === 0 && !G.moon.gone) || levPlanet()) &&
  !G.moonLev &&
  stacksOf(G.active).some((x) => hasK(x.st, "leviathan"));

/* ---------- drawings ---------- */
function planetSVG(k) {
  const glowDef = (id, c) =>
    `<radialGradient id="${id}"><stop offset="50%" stop-color="${c}" stop-opacity=".45"/><stop offset="100%" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
  const tears = G.sunTears || 0,
    lev = G.moonLev ? levOnMoon() : "";
  if (k === "sun")
    return `<svg class="moon sun" viewBox="-44 -44 88 88" width="88" height="88" aria-hidden="true"><defs>${glowDef("sung", "#7b5cff")}<radialGradient id="sunb" cx="40%" cy="38%"><stop offset="0" stop-color="#d8ccff"/><stop offset=".55" stop-color="#6a4be0"/><stop offset="1" stop-color="#2a1878"/></radialGradient></defs><circle r="${43 - tears * 4}" fill="url(#sung)" opacity="${1 - tears * 0.22}"/>${Array.from({ length: 12 }, (_, i) => `<path d="M0,-27L0,-35" transform="rotate(${i * 30})" stroke="#9a86ff" stroke-width="2" opacity="${1 - tears * 0.25}"/>`).join("")}<circle r="23" fill="url(#sunb)" opacity="${1 - tears * 0.15}"/></svg>`;
  if (k === "blacksun")
    return `<svg class="moon blacksun" viewBox="-44 -44 88 88" width="88" height="88" aria-hidden="true"><circle r="31" fill="none" stroke="#3a2a5a" stroke-width="5" opacity=".5"/><circle r="24" fill="#050308" stroke="#5a4a7a" stroke-width="1.4"/>${Array.from({ length: 12 }, (_, i) => `<path d="M0,-26L0,-31" transform="rotate(${i * 30 + 15})" stroke="#2a2040" stroke-width="2"/>`).join("")}</svg>`;
  if (k === "venus")
    return `<svg class="moon venus" viewBox="-44 -44 88 88" width="88" height="88" aria-hidden="true"><defs>${glowDef("veng", "#ffe9b8")}<radialGradient id="venb" cx="40%" cy="36%"><stop offset="0" stop-color="#fffaf0"/><stop offset=".6" stop-color="#e8d2a2"/><stop offset="1" stop-color="#9a7e4a"/></radialGradient></defs><circle r="40" fill="url(#veng)"/><circle r="21" fill="url(#venb)"/>${lev}</svg>`;
  if (k === "mercury") {
    const pc = peaceOn(),
      wc = warOn();
    return `<svg class="moon mercury" viewBox="-44 -44 88 88" width="88" height="88" aria-hidden="true"><defs><radialGradient id="merb" cx="40%" cy="36%">${pc ? `<stop offset="0" stop-color="#ffd1f0"/><stop offset=".35" stop-color="#9ff0c8"/><stop offset=".7" stop-color="#8ab8ff"/><stop offset="1" stop-color="#c58cff"/>` : wc ? `<stop offset="0" stop-color="#e8a090"/><stop offset="1" stop-color="#5a1a12"/>` : `<stop offset="0" stop-color="#e2ddd6"/><stop offset=".6" stop-color="#9a948c"/><stop offset="1" stop-color="#4a4640"/>`}</radialGradient></defs>${pc ? `<circle r="38" fill="#c8a8ff" opacity=".18"/>` : ""}<circle r="17" fill="url(#merb)" stroke="#2a2622"/><circle cx="-5" cy="4" r="2.4" fill="#000" opacity=".18"/><circle cx="6" cy="-4" r="1.6" fill="#000" opacity=".18"/>${lev}</svg>`;
  }
  if (k === "jupiter")
    return `<svg class="moon jupiter" viewBox="-44 -44 88 88" width="88" height="88" aria-hidden="true"><defs><clipPath id="jupc"><circle r="27"/></clipPath><radialGradient id="jups" cx="40%" cy="36%"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient></defs><g clip-path="url(#jupc)"><rect x="-30" y="-30" width="60" height="60" fill="#d8b98a"/>${[
      [-20, 5, "#a8774a"],
      [-9, 4, "#c99a6a"],
      [0, 5, "#9a6a3e"],
      [10, 3, "#c9a074"],
      [18, 5, "#a8774a"],
    ]
      .map(
        ([y, h, c]) =>
          `<rect x="-30" y="${y}" width="60" height="${h}" fill="${c}"/>`,
      )
      .join(
        "",
      )}<ellipse cx="8" cy="12" rx="5" ry="3" fill="#b0482a"/></g><circle r="27" fill="url(#jups)" stroke="#5a3a1a"/>${lev}</svg>`;
  return "";
}

/* ---------- the computer and the sky ---------- */
async function aiPlanets(pl, W, cast1) {
  const P = G.p[pl],
    lv = P.cpu;
  if (G.over || isHorde(pl)) return;
  // Oaths
  if (planetUp("jupiter") && P.oath !== "jupiter") await cast1("oath_jupiter");
  if (
    planetUp("venus") &&
    P.oath !== "venus" &&
    Math.random() < (W && W.def > 1 ? 0.7 : 0.3)
  )
    await cast1("oath_venus");
  if (
    sunUp() &&
    P.oath !== "earth" &&
    P.tribe !== "firm" &&
    lv !== "hard" &&
    Math.random() < 0.3
  )
    await cast1("oath_earth");
  if (P.tribe === "yald" && sunUp()) await cast1("cry");
  if (P.tribe !== "firm") return;
  const foes = enemiesOf(pl)
    .flatMap(stacksOf)
    .filter((e) => seesTile(pl, e.r, e.c));
  // the Sun's fall where enemies crowd and none of ours stand
  if (sunUp() || planetUp("blacksun")) {
    let best = null;
    for (const e of foes) {
      let s = AI.value(e.st) * 2;
      for (const f of foes)
        if (f !== e && Math.max(Math.abs(f.r - e.r), Math.abs(f.c - e.c)) === 1)
          s += AI.value(f.st) * 0.5;
      for (const m of stacksOf(pl))
        if (Math.max(Math.abs(m.r - e.r), Math.abs(m.c - e.c)) <= 1)
          s -= AI.value(m.st) * 0.6;
      if (!best || s > best.s) best = { ...e, s };
    }
    if (best && best.s > (planetUp("blacksun") ? 6 : 9))
      await cast1("sunfall", best.r, best.c);
  }
  if (
    G.moon.gone === "mars" ||
    G.moon.gone === "saturn" ||
    (PLANETS[G.moon.gone] && G.planetBy === pl)
  )
    return; // keep the Heavenly Body it raised
  const m = mana(pl);
  if (m >= (G.prices.venus || 4) + 1 && Math.random() < 0.4)
    await cast1("venus");
  else if (
    stacksOf(pl).reduce(
      (a, x) => a + x.st.cards.filter((c) => c.unit === "miner").length,
      0,
    ) >= 1 &&
    m >= (G.prices.jupiter || 4) + 2 &&
    Math.random() < 0.25
  )
    await cast1("jupiter");
  else if (
    lv !== "easy" &&
    m >= (G.prices.sun || 4) + 2 &&
    Math.random() < 0.12
  ) {
    const j = stacksOf(pl).find(
      (x) =>
        hasK(x.st, "joker") &&
        !(x.st.cards.find((c) => kind(c) === "joker").captured || []).length,
    );
    if (j) await cast1("sun", j.r, j.c);
  }
}

/* ---------- what the sky says when you hover it ---------- */
const PNOTE = {
  sun: () =>
    `The Second Sun burns where the moon was: no fog of war; every 2d2 rounds it judges each player`,
  blacksun: () => `The Black Sun hangs where the moon was: its flames are out`,
  venus: () =>
    `Venus hangs where the moon was${G.venus ? `: ${esc(G.p[G.venus.target].name)} gets ${G.venus.mode === "a" ? "+2 mana a round and +2 maximum" : "+1 mana a round, every enemy +2 maximum"}` : ""}`,
  mercury: () =>
    `Mercury hangs where the moon was${peaceOn() ? ": Peace" : warOn() ? ": Total War" : ": Peace, Total War, Betrayal, bribes"}`,
  jupiter: () =>
    `Jupiter hangs where the moon was: Ace miners bring 1d2, two conjurings on sale${G.jupSale ? ` (${G.jupSale.ids.map((id) => SP(id).name).join(", ")})` : ""}, trades at the Auction`,
  fallen: () => `The Second Sun has fallen: the sky is empty`,
};
function planetInfoHTML(k) {
  const V = view(),
    P = G.p[V],
    L = [],
    by = planetBy();
  if (k === "sun") {
    L.push(
      `The indigo Second Sun burns in the moon's place${by != null ? `, raised by ${esc(G.p[by].name)}` : ""}. The fog of war is gone (a Delusion still blinds). The Leviathan can't lie on it.`,
    );
    L.push(
      P.tribe === "firm"
        ? "The Sun doesn't judge you."
        : `Every 2d2 rounds it judges you: 1d6 mana to the Bank, 1d2 damage to your stacks, or 1d2 + 1d3 deck cards; or you are blind for 1d3 rounds.`,
    );
    L.push(
      `It has cried ${G.sunTears || 0} of 3 times; at three it becomes the Black Sun.`,
    );
    L.push(
      P.oath === "earth"
        ? "You have sworn the Oath of the Earth: no necromancy, and Sorcery dice prices roll twice for you and keep the lower."
        : "You can swear the Oath of the Earth (Astrology): no necromancy, cheaper Sorcery dice prices.",
    );
  }
  if (k === "blacksun") {
    L.push(
      "The Black Sun: the Second Sun cried three times and its flames went out. The fog of war is back.",
    );
    if (G.blackBy != null)
      L.push(
        `The Firmament that raised it pays ${esc(G.p[G.blackBy].name)} 1d2 mana or 1d2 deck cards every 1d2 rounds.`,
      );
    L.push("If it falls, it destroys the tile it lands on for good.");
  }
  if (k === "venus") {
    L.push(PNOTE.venus() + ".");
    L.push(
      P.oath === "venus"
        ? "Your Oath of Venus: +2 mana and +2 maximum each round you start without having attacked a player; each attack on a player costs 1d2 mana and two maximum for 1d3 rounds."
        : "You can swear the Oath of Venus (Astrology).",
    );
  }
  if (k === "jupiter") {
    L.push(
      "Jupiter hangs in the moon's place. Miners in an Ace's slots bring 1d2 a round. Each round two conjurings are on sale (maybe a mana back). Hand cards can be traded at the Auction. A Jester's Sacrificial Suicide brings 1d2 − 1 more mana.",
    );
    if (G.jupSale)
      L.push(
        `On sale this round: ${G.jupSale.ids.map((id) => SP(id).name).join(" and ")}.`,
      );
    L.push(
      P.oath === "jupiter"
        ? "Your Oath of Jupiter: every conjuring costs one less, except what already costs one."
        : "You can swear the Oath of Jupiter (Astrology).",
    );
  }
  if (k === "mercury") {
    L.push(
      `Mercury hangs in the moon's place. Anyone can call a vote for Peace or Total War (everyone must agree), or Buy Peace for two rounds. The Oath of Mercury unlocks Betrayal, Declare War and Bribe the Banker.`,
    );
    if (peaceOn())
      L.push(
        `Peace ${peaceTill()}: no player may attack another or step into another player's lines.`,
      );
    if (warOn())
      L.push(
        `Total War until round ${G.war.until}: kills fall into the Outer Darkness and pay a mana; teammates may fight.`,
      );
    L.push(
      P.oath === "mercury"
        ? "You have sworn the Oath of Mercury."
        : "You can swear the Oath of Mercury (Astrology).",
    );
  }
  if (G.eclipse && G.eclipse.k === k)
    L.push(
      `<b>Eclipsed</b> this round${k === "jupiter" ? " and the next" : ""}.`,
    );
  if (k === "fallen")
    L.push(
      "The Second Sun fell to the ground. Nothing hangs in the sky now: no phases, no gifts, no tolls.",
    );
  if (G.moonLev && ["venus", "jupiter"].includes(k))
    L.push(
      `The Leviathan coils on ${PLANETS[k].name}; its toll and its weak spot come every eighth round.`,
    );
  const nm = PLANETS[k] ? PLANETS[k].name : "The empty sky",
    word = PLANETS[k] ? SKY_NAME[k === "blacksun" ? "sun" : k] : "";
  return `<div class="cin sky"><div class="cih"><b>${nm}</b>${word ? ` <span class="skyword">“${word}”</span>` : ""}</div><p>${L.join("</p><p>")}</p></div>`;
}
/* the earth Oath's cheaper sorcery: the dice price is rolled twice for you and the lower kept */
function skyPrices(pl) {
  if (oathOf(pl) !== "earth" || !G.prices) return;
  for (const s of SPELLS)
    if (s.school === "Sorcery" && PRICE[s.id] && G.prices[s.id] != null)
      G.prices[s.id] = Math.min(G.prices[s.id], PRICE[s.id]());
}
