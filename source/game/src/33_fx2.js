/* ---------------- Prompt 12, part 4b (v33): the schools' signs, the rest of the effects, Mystery Generation's reveal ----------------
   Every spell raises its school's sign where it lands: Necromancy Saturn (lead) ♄︎, Enchantment Jupiter ♃︎, Curse Mars ♂︎, Sorcery the
   Sun ☉︎ (with rays, to tell it from gold), Illusion Neptune ♆︎, Conjuring alchemical gold ☉︎, Astrology the Earth ⊕. The sacrifice sign
   is bigger. Effects: lightning (Lightning Strike), meteor and boom (Asteroid, meteors), fire (flames on burning tiles), rain (Rain),
   wind (Bird's Eye, Teleport), fog (the Firmament's Fog, Quiet Eyes), wisp (cards raised from the grave), pour and fill (mana spent and
   gained), blunt (melee blows), boom (Cannons and Rams). "$" pops on the Bank window's buttons and where a Debt Collector strikes.
   Mystery Generation: a card turns over with its rarity's glow; Epic and up shine longer, Legendary and Mythic with rays. */

/* ---------- the signs, drawn so every device shows the same ---------- */
const SIGN = {
  Necromancy: `<path d="M6 5h7 M9.5 2v12 M9.5 11c0-3 7-3.5 7 1c0 3-4 4-4 7c0 2 2 3 4 2"/>`, // Saturn, lead
  Enchantment: `<path d="M5 8c0-4.5 7.5-4.5 7.5 0c0 3-4 6-7.5 9.5h14 M16 3v18"/>`, // Jupiter
  Curse: `<circle cx="10" cy="14" r="5.6"/><path d="M14 10l6-6 M14.5 4h5.5v5.5"/>`, // Mars
  Sorcery: `<circle cx="12" cy="12" r="5.2"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><path d="M12 2.2v2.6M12 19.2v2.6M2.2 12h2.6M19.2 12h2.6M5.1 5.1l1.8 1.8M17.1 17.1l1.8 1.8M5.1 18.9l1.8-1.8M17.1 6.9l1.8-1.8"/>`, // the Sun
  Illusion: `<path d="M12 3.5v18 M8.5 18.5h7 M5 6.5v2c0 3.5 3 5.5 7 5.5s7-2 7-5.5v-2 M3.5 8l1.5-3 1.5 3 M10.5 6l1.5-3 1.5 3 M17.5 8l1.5-3 1.5 3"/>`, // Neptune
  Conjuring: `<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/>`, // gold
  Astrology: `<circle cx="12" cy="12" r="8"/><path d="M12 4v16 M4 12h16"/>`, // the Earth
  Bank: `<path d="M15.5 7.5c-1-1.6-6.5-2.2-6.5 1c0 3.6 7 2.2 7 6c0 3.2-5.6 2.8-7 1 M12 4v16"/>`,
}; // $
const signSVG = (k, px) =>
  `<svg viewBox="0 0 24 24" width="${px}" height="${px}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${SIGN[k] || SIGN.Astrology}</svg>`;
const SIGN_TXT = {
  Necromancy: "#9a8cf2",
  Enchantment: "#f0cc5a",
  Curse: "#ff4a52",
  Sorcery: "#4fd384",
  Illusion: "#ffa04a",
  Conjuring: "#8c7cff",
  Astrology: "#4fe0cf",
  Bank: "#f1d27a",
};
FX.symbol = function (rect, school, big, px) {
  if (!rect) return;
  const s = px || (big ? 78 : 46);
  const e = FX.make("sign", rect, {
    w: s,
    h: s,
    col: SCHOOL_COL[school] || "#ccc",
    html: signSVG(school, s),
  });
  if (!e) return;
  e.style.color = SIGN_TXT[school] || "#eee";
  FX.play(
    e,
    [
      { transform: "translateY(8px) scale(.55)", opacity: 0 },
      { transform: "translateY(-4px) scale(1)", opacity: 1, offset: 0.28 },
      {
        transform: `translateY(${big ? -40 : -24}px) scale(${big ? 1.25 : 1.08})`,
        opacity: 0,
      },
    ],
    big ? 1400 : 1050,
  );
};
/* the sacrifice: Saturn's sign, bigger than before */
FX.sigil = function (rect, big) {
  if (!rect) return;
  FX.symbol(
    rect,
    "Necromancy",
    big,
    big ? Math.max(96, rect.height * 1.4) : Math.max(56, rect.height * 0.85),
  );
  if (big) FX.burst(rect, SCHOOL_COL.Necromancy, true);
};
FX.dollar = function (rect) {
  if (!rect) return;
  FX.symbol(rect, "Bank", false, 34);
};

/* ---------- the effects ---------- */
FX.svgAt = function (rect, html, cls, w, h, o = {}) {
  const e = FX.make("svgfx " + (cls || ""), rect, {
    w,
    h,
    html: `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${html}</svg>`,
    ...o,
  });
  return e;
};
FX.lightning = function (rect) {
  if (!rect) return;
  const h = Math.min(rect.top + rect.height / 2, 420),
    w = rect.width;
  let x = w / 2,
    y = 0,
    d = `M${x} 0`;
  while (y < h - 10) {
    y += 10 + Math.random() * 18;
    x = w / 2 + (Math.random() - 0.5) * w * 0.55;
    d += ` L${x.toFixed(1)} ${Math.min(y, h).toFixed(1)}`;
  }
  const e = FX.svgAt(
    rect,
    `<path d="${d}" fill="none" stroke="#e8f4ff" stroke-width="3" stroke-linejoin="bevel"/><path d="${d}" fill="none" stroke="#7fc4ff" stroke-width="7" opacity=".35"/>`,
    "bolt",
    w,
    h,
    { dy: -h / 2 },
  );
  FX.play(
    e,
    [
      { opacity: 0 },
      { opacity: 1, offset: 0.08 },
      { opacity: 0.2, offset: 0.25 },
      { opacity: 1, offset: 0.4 },
      { opacity: 0 },
    ],
    520,
    0,
    "linear",
  );
  FX.hit(rect, "#bfe3ff");
};
FX.boom = function (rect, delay = 0) {
  if (!rect) return;
  const s = Math.max(rect.width, rect.height);
  FX.play(
    FX.make("boomcore", rect, { w: s * 0.9, h: s * 0.9 }),
    [
      { transform: "scale(.2)", opacity: 1 },
      { transform: "scale(1)", opacity: 0.9, offset: 0.3 },
      { transform: "scale(1.3)", opacity: 0 },
    ],
    600,
    delay,
  );
  FX.play(
    FX.make("ring", rect, { w: s * 1.3, h: s * 1.3, col: "#ffb347" }),
    [
      { transform: "scale(.3)", opacity: 1 },
      { transform: "scale(1.2)", opacity: 0 },
    ],
    700,
    delay,
  );
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6 + Math.random() * 0.5,
      dd = s * (0.5 + Math.random() * 0.3);
    FX.play(
      FX.make("spark", rect, { w: 5, h: 5 }),
      [
        { transform: "translate(0,0)", opacity: 1 },
        {
          transform: `translate(${Math.cos(a) * dd}px,${Math.sin(a) * dd}px)`,
          opacity: 0,
        },
      ],
      520,
      delay + 40,
    );
  }
};
FX.meteor = function (rect) {
  if (!rect) return;
  const s = Math.max(18, rect.width * 0.35),
    e = FX.make("meteorball", rect, { w: s, h: s });
  FX.play(
    e,
    [
      {
        transform: `translate(${innerWidth * 0.35}px,${-innerHeight * 0.5}px)`,
        opacity: 0.2,
      },
      { transform: "translate(0,0)", opacity: 1 },
    ],
    520,
    0,
    "ease-in",
  );
  FX.boom(rect, 480);
};
FX.flames = function (rect, delay = 0) {
  if (!rect) return;
  for (let i = 0; i < 4; i++) {
    const dx = (Math.random() - 0.5) * rect.width * 0.6,
      s = rect.width * (0.16 + Math.random() * 0.1);
    FX.play(
      FX.make("flame", rect, { w: s, h: s * 1.6, dx, dy: rect.height * 0.22 }),
      [
        { transform: "translateY(0) scale(.6)", opacity: 0 },
        { transform: "translateY(-6px) scale(1)", opacity: 1, offset: 0.3 },
        {
          transform: `translateY(${-rect.height * 0.45}px) scale(.4)`,
          opacity: 0,
        },
      ],
      800,
      delay + i * 90,
    );
  }
};
FX.rain = function () {
  const B = FX.rectOf($("#board"));
  if (!B) return;
  for (let i = 0; i < 46; i++) {
    const x = Math.random() * B.width,
      e = FX.make(
        "drop",
        { left: B.left + x, top: B.top, width: 0, height: 0 },
        { w: 2, h: 16 },
      );
    FX.play(
      e,
      [
        { transform: "translateY(0)", opacity: 0 },
        {
          transform: `translateY(${B.height * 0.2}px)`,
          opacity: 0.8,
          offset: 0.15,
        },
        { transform: `translateY(${B.height}px)`, opacity: 0 },
      ],
      700 + Math.random() * 300,
      Math.random() * 700,
      "linear",
    );
  }
};
FX.wind = function (rect) {
  const B = rect || FX.rectOf($("#board"));
  if (!B) return;
  for (let i = 0; i < 10; i++) {
    const y = B.top + B.height * (0.1 + 0.8 * Math.random()),
      e = FX.make(
        "gust",
        { left: B.left, top: y, width: 0, height: 0 },
        { w: B.width * 0.35, h: 2 },
      );
    FX.play(
      e,
      [
        { transform: "translateX(0)", opacity: 0 },
        {
          transform: `translateX(${B.width * 0.4}px)`,
          opacity: 0.7,
          offset: 0.4,
        },
        { transform: `translateX(${B.width * 0.9}px)`, opacity: 0 },
      ],
      900,
      i * 70,
      "ease-in-out",
    );
  }
};
FX.fogroll = function (col) {
  const B = FX.rectOf($("#board"));
  if (!B) return;
  const e = FX.make("fogsheet", B, { col });
  FX.play(
    e,
    [
      { transform: "translateX(-40%)", opacity: 0 },
      { transform: "translateX(0)", opacity: 0.75, offset: 0.45 },
      { transform: "translateX(25%)", opacity: 0 },
    ],
    1600,
    0,
    "ease-in-out",
  );
};
FX.wisp = function (a, b, delay = 0) {
  if (!a || !b) return;
  const e = FX.make("wispo", a, { w: 14, h: 14, col: SCHOOL_COL.Necromancy });
  const dx = b.left + b.width / 2 - (a.left + a.width / 2),
    dy = b.top + b.height / 2 - (a.top + a.height / 2);
  FX.play(
    e,
    [
      { transform: "translate(0,0) scale(.6)", opacity: 0 },
      {
        transform: `translate(${dx * 0.4}px,${dy * 0.4 - 40}px) scale(1.1)`,
        opacity: 1,
        offset: 0.45,
      },
      { transform: `translate(${dx}px,${dy}px) scale(.5)`, opacity: 0 },
    ],
    900,
    delay,
    "ease-in-out",
  );
};
FX.pour = function (rect, n) {
  if (!rect) return;
  for (let i = 0; i < Math.min(6, n); i++) {
    const dx = (Math.random() - 0.5) * rect.width * 0.7;
    FX.play(
      FX.make("dropm", rect, { w: 5, h: 8, dx }),
      [
        { transform: "translateY(0)", opacity: 1 },
        { transform: "translateY(26px)", opacity: 0 },
      ],
      520,
      i * 60,
      "ease-in",
    );
  }
};
FX.fill = function (rect, n) {
  if (!rect) return;
  for (let i = 0; i < Math.min(6, n); i++) {
    const dx = (Math.random() - 0.5) * rect.width * 0.7;
    FX.play(
      FX.make("dropm up", rect, { w: 5, h: 5, dx, dy: 14 }),
      [
        { transform: "translateY(0) scale(.6)", opacity: 0 },
        { transform: "translateY(-6px) scale(1)", opacity: 1, offset: 0.4 },
        { transform: "translateY(-18px)", opacity: 0 },
      ],
      600,
      i * 60,
    );
  }
};
FX.blunt = function (rect) {
  if (!rect) return;
  const s = rect.width * 0.55;
  const e = FX.svgAt(
    rect,
    `<path d="M30 2l5 17 17-5-11 14 13 11-18-1 2 18-10-15-10 15 2-18-18 1 13-11-11-14 17 5z" fill="#fff3d6" stroke="#ff9a5a" stroke-width="2" transform="scale(${(s / 60).toFixed(3)})"/>`,
    "impact",
    s,
    s,
  );
  FX.play(
    e,
    [
      { transform: "scale(.3) rotate(-10deg)", opacity: 1 },
      { transform: "scale(1) rotate(0)", opacity: 0.9, offset: 0.35 },
      { transform: "scale(1.1)", opacity: 0 },
    ],
    380,
    90,
  );
};

/* ---------- where they play ---------- */
const sel2 = (sel) =>
  sel && FX.sees(sel.r, sel.c) ? FX.tile(sel.r, sel.c) : null;
FX.spell = function (sp, sel, pl) {
  const col = SCHOOL_COL[sp.school];
  if (sp.id === "bolt") {
    const t = sel2(sel);
    if (t) {
      FX.lightning(t);
      FX.symbol(t, sp.school);
    } else FX.lightning(FX.rectOf($("#moon svg.moon")));
    return true;
  }
  if (sp.id === "rain") {
    FX.rain();
    FX.symbol(FX.rectOf($("#board")), sp.school, true);
    return true;
  }
  if (sp.id === "bird") {
    FX.wind();
    FX.symbol(FX.rectOf($("#board")), sp.school, true);
    return true;
  }
  if (sp.id === "tele") {
    const t = sel2(sel);
    if (t) {
      FX.wind(t);
      FX.symbol(t, sp.school);
    }
    return !!t;
  }
  if (sp.id === "ffog" || sp.id === "quiet") {
    FX.fogroll(col);
    FX.symbol(FX.rectOf($("#board")), sp.school, true);
    return true;
  }
  return false;
};
{
  const _ss = skyStrike;
  skyStrike = function (r, c, why) {
    const rect = FX.on() && FX.sees(r, c) ? FX.tile(r, c) : null;
    const out = _ss.apply(this, arguments);
    if (rect)
      later(() => {
        FX.meteor(rect);
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++)
            if ((dr || dc) && FX.sees(r + dr, c + dc))
              FX.flames(FX.tile(r + dr, c + dc), 520);
      });
    return out;
  };
}
/* melee blows land blunt; Cannons and Rams go boom; a Debt Collector's blow shows "$" */
{
  const _at = attack;
  attack = function (r1, c1, r2, c2, mode) {
    const A = G.board[r1] && G.board[r1][c1];
    let kind2 = null;
    if (FX.on() && A && FX.sees(r2, c2)) {
      const o =
        attackOptions(r1, c1).find(
          (x) => x.r === r2 && x.c === c2 && (mode == null || x.mode === mode),
        ) || {};
      kind2 =
        mode === "ram" || (hasK(A, "cannon") && o.ranged)
          ? "boom"
          : hasK(A, "debt") || (isNPC(A.owner) && G.p[A.owner].npc === "bank")
            ? "dollar"
            : o.ranged
              ? null
              : "blunt";
    }
    const rect = kind2 ? FX.tile(r2, c2) : null;
    const out = _at.apply(this, arguments);
    if (rect)
      later(() => {
        if (kind2 === "boom") FX.boom(rect, 180);
        else if (kind2 === "dollar") {
          FX.blunt(rect);
          FX.dollar(rect);
        } else FX.blunt(rect);
      });
    return out;
  };
}
/* the grave gives a card back: a wisp from the grave to the hand */
{
  const _pg = pickGrave;
  pickGrave = async function (pl, n, title) {
    const got = await _pg.apply(this, arguments);
    if (got && FX.on()) {
      const a = FX.rectOf($("#seegrave")),
        b =
          pl === view()
            ? FX.rectOf($("#hand"))
            : FX.rectOf(barOf(pl, ".deckbar"));
      for (let i = 0; i < got; i++) FX.wisp(a, b, i * 160);
    }
    return got;
  };
}
/* mana poured out and filled in */
{
  const _sp = spend;
  spend = function (pl, n) {
    if (FX.on() && n > 0) {
      const r = FX.rectOf(barOf(pl, ".manabar"));
      later(() => FX.pour(r, n));
    }
    return _sp.apply(this, arguments);
  };
}
{
  const _gm = giveMana;
  giveMana = function (pl, n) {
    const got = _gm.apply(this, arguments);
    if (got > 0 && FX.on() && G.phase !== "setup") {
      const r = FX.rectOf(barOf(pl, ".manabar"));
      later(() => FX.fill(r, got));
    }
    return got;
  };
}
/* the Bank window: every option clicked shows "$" */
document.addEventListener(
  "click",
  (e) => {
    const b =
      e.target.closest &&
      e.target.closest(
        "#ov .ovbox.bank button, #ov .ovbox.bank input[type=checkbox]",
      );
    if (!b || b.id === "mcancel" || b.dataset.bt || !FX.on()) return;
    FX.dollar(b.getBoundingClientRect());
  },
  true,
);

/* ---------- Mystery Generation: turning a card over ---------- */
const MYS_SEEN = new WeakSet();
{
  const _mc = mysCardHTML;
  mysCardHTML = function (g, i, shown) {
    let h = _mc(g, i, shown);
    if (!shown || !g) return h;
    const fresh = !MYS_SEEN.has(g.card);
    MYS_SEEN.add(g.card);
    return h.replace(
      'class="myscard shown"',
      `class="myscard shown tier-${g.tier.k}${fresh && !matchMedia("(prefers-reduced-motion: reduce)").matches ? " fresh" : ""}"`,
    );
  };
}

if (window.__EC) Object.assign(window.__EC, { signSVG });
