/* ---------------- Prompt 7: fog of war, Scouts, Assassins, face-down cards, ambush, Quiet Eyes, Bird's Eye ---------------- */

/* ---------- who sees what ----------
   Fog of war (on by default): every unit sees the eight tiles around it, a Scout two tiles out in a diamond. Assassins, ambushers and enemy Scouts
   stay hidden unless one of your cards stands right next to them; your Scouts also uncover Assassins, ambushers and
   face-down cards within a round two tiles, and enemy Scouts within three. Bird's Eye lifts the fog for your side for a
   round. Quiet Eyes, cast by an enemy, hides everything not right beside you unless you have a Scout on the field.
   (v60: Quiet Eyes is now one turn of near-blindness for each enemy, Scouts or not: see 65_v60.js.)
   A Delusion overrides all of this with its own rule, and Scouts can't help against it. */
const fogOn = () => G.opts.fog !== false && G.moon.gone !== "sun"; // the Second Sun burns the fog away
const sideOf = (V) => [V, ...alliesOf(V)];
const scoutsOf = (V) =>
  sideOf(V)
    .flatMap(stacksOf)
    .filter((x) => hasK(x.st, "scout"));
const quietOn = (V) =>
  (G.quiet || []).some((q) => q.until >= G.moon.round && isEnemy(q.by, V));
const birdOn = (V) =>
  (G.bird || []).some((b) => b.round === G.moon.round && !isEnemy(b.by, V));
const stealthy = (st) =>
  st.ambush ||
  st.cards.every((c) => c.unit === "assassin" || c.unit === "scout");
function visionMap(V) {
  // cached until the board changes: each side's cards and Scouts
  let key = PERF.inRender ? PERF.vk : null; // v76b: worked out once per redraw (nothing on the board moves while it is drawn)
  if (!key) {
    const L0 = G.log[0];
    let n = 0;
    for (const row of G.board) for (const s of row) if (s) n++;
    key =
      G.turnNo +
      "|" +
      G.log.length +
      "|" +
      (L0 ? L0.t + L0.html.length : 0) +
      "|" +
      n;
    if (PERF.inRender) PERF.vk = key;
  }
  if (!G._vis || G._vis.key !== key) G._vis = { key, m: {} };
  return (
    G._vis.m[V] ||
    (G._vis.m[V] = { own: sideOf(V).flatMap(stacksOf), sc: scoutsOf(V) })
  );
}
PRICE.bird = () => R(2);
PRICE.cas = () => R(2) + R(2) + 1;
function seesTile(V, r, c) {
  if (V == null || !G.p[V]) return true;
  const st = G.board[r][c];
  if (!st || !isEnemy(st.owner, V)) return true;
  if (blindFor(V)) return deluSees(V, r, c); // the Delusion's rule wins, Scouts or not
  if (sunBlind(V) || choked(V)) return false; // blinded by the Sun: not even what is beside you
  const ff = firmFog(V);
  if (ff && ff.blind) return false; // the Firmament's fog at the New Moon: blind
  const M = visionMap(V);
  const near = M.own.some((x) => Math.abs(x.r - r) + Math.abs(x.c - c) === 1); // right beside one of your cards
  if (stealthy(st)) {
    if (near || eclipseOn("sun")) return true; // the suns' eclipse shows every Assassin
    const scoutR = 2 - (ff && ff.cut ? 1 : 0); // your Scouts uncover them within their own diamond of sight
    return M.sc.some((x) => Math.abs(x.r - r) + Math.abs(x.c - c) <= scoutR);
  }
  if (quietOn(V) && !M.sc.length)
    return M.own.some(
      (x) => Math.max(Math.abs(x.r - r), Math.abs(x.c - c)) <= 1,
    );
  if (!ff && (!fogOn() || birdOn(V))) return true;
  return M.own.some((x) => inSight(x, r, c, ff));
}
/* a tile is foggy for you when none of your cards can see it */
function fogTile(V, r, c) {
  if (V != null && totalBlind(V)) return true;
  if (V == null || !G.p[V] || blindFor(V)) return false;
  if (sunBlind(V)) return !visionMap(V).own.some((x) => x.r === r && x.c === c);
  const ff = firmFog(V);
  if (!ff && (!fogOn() || birdOn(V))) return false;
  const M = visionMap(V);
  if (ff && ff.blind) return !M.own.some((x) => x.r === r && x.c === c);
  return !M.own.some((x) => inSight(x, r, c, ff));
}
/* a face-down enemy stack shows only its back, unless your Scout is within two tiles */
function showsBack(V, r, c) {
  const st = G.board[r][c];
  if (!st || !st.down || !isEnemy(st.owner, V) || eclipseOn("sun"))
    return false;
  return !scoutsOf(V).some((x) => Math.abs(x.r - r) + Math.abs(x.c - c) <= 2);
}

/* ---------- shooting into the fog ----------
   A ranged weapon may fire at any fogged tile in its reach. With no enemy there the shot always fails; with one there it is an
   ordinary attack, but the shooter learns only whether it hit (and hears the blow land). */
function blindOptions(r, c) {
  const st = G.board[r] && G.board[r][c];
  if (!st || st.attacked || st.hypo || st.stun || st.pin || choked(st.owner))
    return [];
  const V = st.owner,
    known = new Set(attackOptions(r, c).map((o) => o.r * 16 + o.c)),
    tiles = [],
    out = [];
  for (let r2 = 0; r2 < G.rows; r2++)
    for (let c2 = 0; c2 < COLS; c2++) {
      if (isVoid(r2, c2) || known.has(r2 * 16 + c2) || !fogTile(V, r2, c2))
        continue;
      const t = G.board[r2][c2];
      if (t && !isEnemy(t.owner, V) && !warFoe(V, t.owner)) continue;
      tiles.push([r2, c2]);
    }
  if (!tiles.length) return out;
  if (!(hasBase(st) && repLocked(st)))
    for (const card of st.cards) {
      const U = card.unit && UNIT[card.unit];
      if (!U || !U.shooter || !shotReady(card, V)) continue;
      const A = { owner: V, cards: [card], odds: st.odds, down: st.down };
      for (const [r2, c2] of tiles)
        for (const w of U.weapons)
          if (w.id !== "suppress" && reaches(w.reach, r, c, r2, c2))
            out.push({
              r: r2,
              c: c2,
              mode: w.id,
              ranged: true,
              w,
              A,
              card,
              blind: true,
            });
    }
  const u = canAttackFrom(st) && soloUnit(st);
  if (u)
    for (const w of UNIT[u.unit].weapons)
      if (w.reach === "gun")
        for (const [r2, c2] of tiles)
          if (!near8(r, c, r2, c2) && reaches(w.reach, r, c, r2, c2))
            out.push({
              r: r2,
              c: c2,
              mode: w.id,
              ranged: true,
              w,
              blind: true,
            });
  return out;
}
function blindPick(r1, c1, r2, c2, mode) {
  const st = G.board[r1] && G.board[r1][c1];
  if (!st || !fogTile(st.owner, r2, c2)) return null; // v78j: any hidden tile, fog of war on or not
  if (attackOptions(r1, c1).some((o) => o.r === r2 && o.c === c2)) return null;
  return (
    blindOptions(r1, c1).find(
      (o) => o.r === r2 && o.c === c2 && (mode == null || o.mode === mode),
    ) || null
  );
}
function blindShot(r1, c1, r2, c2, o) {
  const A = G.board[r1][c1],
    pl = A.owner,
    D = G.board[r2][c2];
  const real =
    D &&
    (isEnemy(D.owner, pl) || warFoe(pl, D.owner)) &&
    !peaceBlock(pl, D.owner) &&
    !D.hypo &&
    !shielded(D.owner);
  const lost = `${plName(pl)} fires into the fog on ${coord(r2, c2)} (${esc(o.w.name)}). The shot is lost in the fog.`;
  if (!real) {
    // nothing there: it looks exactly like a miss
    A.attacked = true;
    if (o.card && o.card.unit === "cannon")
      o.card.readyAt = (G.p[pl].tn || 0) + R(2) + 2;
    G.histTile = `${coord(r1, c1)} → ${coord(r2, c2)}`;
    tray(pl, "Attack", o.w.roll ? o.w.roll() : [], "lost in the fog");
    G.histTile = null;
    log(lost, "combat");
    return { win: false, line: "", blind: true };
  }
  const seen = G.p.map(
      (P) => P.i !== pl && (!isEnemy(D.owner, P.i) || seesTile(P.i, r2, c2)),
    ),
    L0 = G.log[0];
  const res = attackRun(r1, c1, r2, c2, o.mode, o) || {};
  const end = L0 ? G.log.indexOf(L0) : G.log.length,
    fresh = G.log.slice(0, end < 0 ? G.log.length : end);
  const main = fresh.find((l) => l.cls === "combat");
  for (const l of fresh)
    if (!l.fog)
      l.fog = {
        by: D.owner,
        seen,
        alt:
          l === main
            ? res.win
              ? `${plName(pl)} fires into the fog on ${coord(r2, c2)} (${esc(o.w.name)}). Something in the fog is hit.`
              : lost
            : "",
      };
  return Object.assign(res, { blind: true });
}

/* ---------- ambush ---------- */
const canAmbush = (st) =>
  st &&
  (st.down || st.cards.some((c) => c.unit === "assassin")) &&
  !hasBase(st) &&
  !st.cards.every((c) => c.unit && UNIT[c.unit].noAtk);
/* an enemy stack that steps beside an ambusher is struck at once, out of turn, with advantage */
function ambushCheck(r, c) {
  const T = G.board[r][c];
  if (!T) return;
  for (let rr = 0; rr < G.rows; rr++)
    for (let cc = 0; cc < COLS; cc++) {
      const A = G.board[rr][cc];
      if (!A || !A.ambush || !isEnemy(A.owner, T.owner) || !G.board[r][c])
        continue;
      if (!adjacent(rr, cc, r, c, jackOnly(A))) continue;
      const keep = { attacked: A.attacked, moved: A.moved };
      A.attacked = false;
      A.ambushing = true;
      log(
        `<b>Ambush!</b> ${plName(A.owner)}'s hidden stack on ${coord(rr, cc)} strikes as ${plName(T.owner)} steps onto ${coord(r, c)}.`,
        "event",
      );
      notify(A.owner, `Ambush on ${coord(r, c)}.`);
      const opt = attackOptions(rr, cc).find((o) => o.r === r && o.c === c);
      if (opt) attack(rr, cc, r, c, opt.mode);
      else {
        A.ambushing = false;
        A.ambush = false;
      }
      if (G.board[rr][cc] === A) {
        A.attacked = keep.attacked;
        A.moved = keep.moved;
      }
      if (G.over) return;
    }
}

/* ---------- Scouts and Assassins in the decks and the Ether ---------- */
/* v70d: the Ether's decks: as many as the players hold (the default) or its own number per player; 1v1-sized at least in 1v1 */
function deckCount() {
  const o = G.opts,
    L = o.layout || "duel",
    n = G.p.filter((P) => !isHorde(P.i)).length,
    e =
      o.etherPer && o.etherPer !== "same" && o.etherPer !== "inf"
        ? String(o.etherPer)
        : deckPer(o);
  const f = e === "half" ? 0.5 : Math.max(0.5, +e || 1);
  return Math.max(1, Math.round(f * Math.max(n, L === "duel" ? 2 : 1)));
}
function fogDecks(pls) {
  const n = deckCount();
  let scouts = 8 * n,
    ass = 4 * n;
  for (const pl of pls) {
    const P = G.p[pl],
      k = 2,
      a = P.tribe === "beginner" ? 1 : 0; // v44: two Scouts in every deck, the Beginner's too
    for (let i = 0; i < k && scouts > 0; i++) {
      P.deck.push(mkUnit("scout", pl));
      scouts--;
    }
    for (let i = 0; i < a && ass > 0; i++) {
      P.deck.push(mkUnit("assassin", pl));
      ass--;
    }
    shuffle(P.deck);
  }
  for (let i = 0; i < scouts; i++) G.ether.push(mkUnit("scout", null));
  for (let i = 0; i < ass; i++) G.ether.push(mkUnit("assassin", null));
}
/* v44: your opening Ace brings a Scout from the Ether; a later Ace brings one only while you have no Scout on the field.
   Lucifer & Ouroboros get none. The Beginner's first Ace also brings a Miner. */
function aceScout(pl, r, c, first) {
  const P = G.p[pl],
    st = G.board[r][c];
  if (!st || P.tribe === "lucifer" || isHorde(pl) || (G.bank && G.bank.dead))
    return;
  let got = 0;
  if (
    (first || !stacksOf(pl).some((x) => x.st !== st && hasK(x.st, "scout"))) &&
    st.cards.length <= 6
  ) {
    const j = G.ether.findIndex((x) => x.unit === "scout");
    if (j >= 0) {
      const s = G.ether.splice(j, 1)[0];
      s.owner = pl;
      st.cards.push(s);
      got = 1;
    }
  }
  if (first && P.tribe === "beginner") {
    const j = G.ether.findIndex((x) => x.unit === "miner");
    if (j >= 0) {
      const m = G.ether.splice(j, 1)[0];
      m.owner = pl;
      m.inSlot = 0;
      st.cards.push(m);
      log(`A Miner takes ${plName(pl)}'s first miner slot.`);
    }
  }
  if (got) {
    fogLog(pl, r, c, `A Scout rides out of the Ether to ${plName(pl)}.`);
    log(
      `A Scout rides out of the Ether into ${plName(pl)}'s Ace on ${coord(r, c)}.`,
    );
  }
}
function fullMoonScout() {
  // the Beginner's free Scout each Full Moon
  if (G.moon.i !== 4) return;
  for (const P of G.p) {
    if (P.out || P.tribe !== "beginner") continue;
    if (
      stacksOf(P.i).reduce(
        (n, x) => n + x.st.cards.filter((c) => c.unit === "scout").length,
        0,
      ) +
        P.hand.filter((c) => c.unit === "scout").length >=
      2
    )
      continue; // v44: only while they hold fewer than two
    const j = G.ether.findIndex((x) => x.unit === "scout");
    if (j < 0) continue;
    const s = G.ether.splice(j, 1)[0];
    s.owner = P.i;
    if (P.hand.length < handCap(P.i)) P.hand.push(s);
    else {
      P.deck.push(s);
      shuffle(P.deck);
    }
    log(`The Full Moon sends ${plName(P.i)} a free Scout from the Ether.`);
  }
}

/* ---------- spells ---------- */
SPELLS.push(
  {
    id: "csc",
    name: "Scout Conjure",
    cost: 1,
    school: "Conjuring",
    text: "A Scout's soul comes from the Ether into your deck. Scouts see two tiles out through the fog in a diamond and uncover Assassins, ambushers and face-down cards there, move like Assassins and don't fight.",
    ok: () => etherHasU("scout"),
    run: () => conjureU("scout"),
  },
  {
    id: "cas",
    dice: "2d2+1",
    name: "Assassin Conjure",
    cost: 5,
    school: "Conjuring",
    text: "An Assassin's soul comes from the Ether into your deck. Two hearts, the defense of an Infantry (8) and the attack of a Jack (10 + 1d12); moves one tile straight, two diagonal, or two forward or back; hidden from enemies until they stand right beside it; can ambush; two can stack together.",
    ok: () => etherHasU("assassin"),
    run: () => conjureU("assassin"),
  },
  {
    id: "quiet",
    name: "Quiet Eyes",
    cost: 2,
    dice: "2 a round",
    school: "Illusion",
    text: "For 1d2 + 1 rounds, enemies without a Scout on the field see only the units right beside their own. 2 mana now and 2 at the start of every round it lasts; it ends when you can't pay. Scouts see through it.",
    ok: () =>
      !(G.quiet || []).some(
        (q) => q.by === G.active && q.until >= G.moon.round,
      ),
    run: async () => {
      const d = R(2) + 1;
      (G.quiet = G.quiet || []).push({
        by: G.active,
        until: G.moon.round + d - 1,
      });
      tray(G.active, "Quiet Eyes", [{ s: 2, v: d - 1 }], `${d} rounds`);
      log(
        `<b>Quiet Eyes</b>: ${plName(G.active)} hushes the field for ${d} rounds.`,
        "event",
      );
      notify(
        G.active,
        `Quiet Eyes: enemies without a Scout see only what is right beside them, ${d} rounds.`,
      );
    },
  },
  {
    id: "bird",
    dice: "1d2",
    name: "Bird's Eye",
    cost: 1,
    school: "Sorcery",
    text: "For the rest of this round the fog of war lifts for you and your teammates. It does nothing against a Delusion.",
    ok: () => fogOn() && !birdOn(G.active),
    run: async () => {
      (G.bird = G.bird || []).push({ by: G.active, round: G.moon.round });
      log(
        `<b>Bird's Eye</b>: ${plName(G.active)} sees the whole field this round.`,
        "event",
      );
    },
  },
);
/* v44: Miners and Repairmen never run out: when the Ether has none left, a new one is made (the Ether's count doesn't include them) */
const UNLIMITED = new Set(["miner", "repair"]);
const etherHasU = (u) => UNLIMITED.has(u) || G.ether.some((c) => c.unit === u);
async function conjureU(u) {
  const i = G.ether.findIndex((c) => c.unit === u);
  const c = i >= 0 ? G.ether.splice(i, 1)[0] : mkUnit(u, G.active);
  c.owner = G.active;
  if (c.hp != null) c.hp = c.maxHp;
  me().deck.push(c);
  shuffle(me().deck);
  log(
    `A${/^[AEIOU]/.test(UNIT[u].name) ? "n" : ""} ${UNIT[u].name}'s soul materializes from the Ether into ${plName(G.active)}'s deck.`,
  );
}
/* Quiet Eyes asks 2 mana at the start of each round it lasts */
function quietRound() {
  for (const q of G.quiet || []) {
    if (q.until < G.moon.round || q.paidRound === G.moon.round) continue;
    if (q.started === undefined) {
      q.started = G.moon.round;
      q.paidRound = G.moon.round;
      continue;
    }
    if (mana(q.by) >= 2) {
      pay(q.by, 2);
      q.paidRound = G.moon.round;
      log(`${plName(q.by)} pays 2 mana to keep Quiet Eyes.`);
    } else {
      q.until = G.moon.round - 1;
      log(`${plName(q.by)} can't pay: Quiet Eyes ends.`);
    }
  }
}

/* ---------- the computer ---------- */
async function aiFog(pl, W, cast1) {
  const P = G.p[pl],
    lv = P.cpu;
  // set ambush with Assassins and face-down stacks that have nothing to hit right now
  for (const { st, r, c } of stacksOf(pl)) {
    if (!canAmbush(st) || st.ambush || st.moved || st.attacked) continue;
    if (
      !attackOptions(r, c).length &&
      Math.random() < (lv === "easy" ? 0.3 : 0.7)
    ) {
      st.ambush = true;
      log(`${plName(pl)} sets a stack in ambush.`, "ai");
    }
  }
  if (fogOn() && !scoutsOf(pl).length && mana(pl) >= 2 && lv !== "easy")
    await cast1("csc");
  if (
    lv === "hard" &&
    mana(pl) >= spellCost(SP("cas")) + 1 &&
    Math.random() < 0.35
  )
    await cast1("cas");
  if (
    fogOn() &&
    lv !== "easy" &&
    W &&
    W.atk > 1 &&
    mana(pl) >= 3 &&
    Math.random() < 0.25
  )
    await cast1("bird");
  if (lv === "hard" && mana(pl) >= 6 && Math.random() < 0.15)
    await cast1("quiet");
}

/* icons */
UNIT_ICON.scout = `<path d="M-8,8L-5,0L-7,-4L-3,-8L2,-7L6,-3L8,-4L7,1L3,0L2,8"/><path d="M-3,-8L-1,-11M2,-7L4,-10"/>`;
UNIT_ICON.assassin = `<path d="M0,-11L2.5,-2L0,4L-2.5,-2Z"/><path d="M-6,4L6,4M0,4L0,10"/>`;

/* the log hides what an enemy couldn't see: a move or placement onto a tile hidden from them shows only a vague line */
function fogLog(by, r, c, alt) {
  if (
    !fogOn() &&
    !G.ffog &&
    !G.quiet?.length &&
    !G.p.some((P) => blindFor(P.i)) &&
    !stealthy(G.board[r][c] || { cards: [] })
  )
    return;
  G._vis = null;
  const seen = G.p.map((P) => !isEnemy(by, P.i) || seesTile(P.i, r, c));
  if (seen.every(Boolean)) return;
  log.fog = { by, seen, alt };
}
/* v78j: a fight a player can't see stays out of their log (and its banner off their screen): the lines an attack writes
   are marked for whoever sees neither tile and sides with neither fighter (a shot into the fog marks its own lines) */
{
  const _ar = attackRun;
  attackRun = function (r1, c1, r2, c2, mode, forced) {
    const A = G.board[r1] && G.board[r1][c1],
      D = G.board[r2] && G.board[r2][c2];
    if (!A || !D || (forced && forced.blind)) return _ar.apply(this, arguments);
    const seen = G.p.map(
      (P) =>
        !isEnemy(A.owner, P.i) ||
        !isEnemy(D.owner, P.i) ||
        seesTile(P.i, r1, c1) ||
        seesTile(P.i, r2, c2),
    );
    if (seen.every(Boolean)) return _ar.apply(this, arguments);
    const L0 = G.log[0],
      out = _ar.apply(this, arguments),
      end = L0 ? G.log.indexOf(L0) : G.log.length;
    for (const l of G.log.slice(0, end < 0 ? G.log.length : end))
      if (!l.fog && l.cls !== "event" && l.cls !== "win")
        l.fog = { by: A.owner, seen, alt: "" }; // v78p: a side falling, or the game ending, is news for all
    return out;
  };
}
