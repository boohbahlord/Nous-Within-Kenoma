/* ---------------- v61: card faces in the players' colors, accent colors, stacks that look stacked ----------------
   - Every card takes its player's color, darkened and calmed, with light lettering that reads on it; the frame is the
     player's accent color. No mark in the top-left corner any more: the rank sits in the middle with a smaller suit.
   - The player's symbol is on the cards only when Display (the Menu) says so.
   - Demons are black with red; the Bank's cards are a faint banknote.
   - Each color comes with accent colors to choose in the setup (the frame of the cards).
   - A stack shows the edges of the cards beneath it: one edge for two cards, two for three or four, three for five or more,
     each stack leaning its own way.
   - The Display bar at the foot of the page keeps the quick settings; the rest live in the Menu. */

/* ---------- accent colors ---------- */
const ACCENTS = [["auto", "Its own light"], ...PALETTE.map(([n, h]) => [h, n])]; // v71e: the whole palette, the same as the players' colors
const accentOf = (color, acc) =>
  !acc || acc === "auto" ? `color-mix(in oklab,${color} 55%,#f3e7d2)` : acc;
const pAccent = (P) =>
  P ? accentOf(P.color, PREF.cb ? "auto" : P.accent) : "#9a8f80"; // v71h: colorblind-safe colors use the color's own light

/* ---------- the card face ---------- */
{
  const _i = inkSVG;
  inkSVG = function (u, color, size) {
    // the art takes the card's lettering color, and its paper is the card itself
    return _i(u, "currentColor", size).replace(
      new RegExp(`(fill|stroke)="${PAPER}"`, "g"),
      (m, a) => `style="${a}:var(--cb,${PAPER})"`,
    );
  };
}
const cardKind = (P) =>
  !P
    ? ""
    : P.npc === "bank"
      ? " bankcard"
      : P.npc === "barb"
        ? " demoncard"
        : "";
{
  const _f = face;
  face = function (c, o = {}) {
    let h = _f.apply(this, arguments);
    const own = o.owner !== undefined ? o.owner : c.owner,
      P = own != null && G && G.p[own] ? G.p[own] : null;
    h = h.replace(
      /<span class="cx">[\s\S]*?<\/span>(?=<(?:i class="su"|span class="uic"))/,
      "",
    ); // no corner mark
    if (!c.unit && !c.puppet) {
      const rk = c.rank === "JK" ? "Joker" : c.rank;
      h = h.replace(
        /<i class="su">([^<]*)<\/i>/,
        (m, su) =>
          `<span class="cmid"><b class="rk${c.rank === "JK" ? " jk" : ""}">${rk}</b><i>${su}</i></span>`,
      );
    }
    return h
      .replace(/^<span class="cf /, `<span class="cf v61${cardKind(P)} `)
      .replace(
        /style="--pc:([^"]*)"/,
        (m, col) => `style="--pc:${col};--ca:${P ? pAccent(P) : "#8f8678"}"`,
      );
  };
}

/* ---------- the stacks: accent, Demons, the Bank, and the cards beneath ---------- */
const STACK_DIRS = [
  [2, -2],
  [-2, -2],
  [2, 2],
  [-2, 2],
  [0, -2.5],
  [2.5, 0],
  [-2.5, 0],
  [0, 2.5],
];
function stackEdges(st, r, c) {
  const n = st.cards.length,
    layers = n <= 1 ? 0 : n === 2 ? 1 : n <= 4 ? 2 : 3;
  if (!layers) return "";
  let s = (st.cards[0].id | 0) * 7 + r * 31 + c * 17;
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const d = STACK_DIRS[Math.floor(rnd() * STACK_DIRS.length)],
    wob = [rnd(), rnd(), rnd()];
  const out = [];
  for (let k = 1; k <= layers; k++) {
    const x = (d[0] * k + (wob[k - 1] - 0.5) * 1.6).toFixed(1),
      y = (d[1] * k + (wob[k % 3] - 0.5) * 1.6).toFixed(1);
    out.push(`${x}px ${y}px 0 0 var(--cbe)`, `${x}px ${y}px 0 1px #000a`);
  }
  return out.join(",");
}
{
  const _sd = siegeDecor;
  siegeDecor = function (inner, st, V, r, c) {
    let h = _sd.apply(this, arguments);
    if (!st) return h;
    const P = G.p[st.owner];
    const stk = stackEdges(st, r, c),
      kind = cardKind(P);
    h = h.replace(
      /(<div class="stack[^"]*") style="--pc:([^";]*)/,
      (m, a, col) =>
        `${a.replace('class="stack ', `class="stack v61${kind} `)} style="--pc:${col};--ca:${pAccent(P)};${stk ? `--stk:${stk};` : ""}`,
    );
    return h;
  };
}

/* ---------- Display: the player's symbol on cards (off by default); the foot bar keeps the quick settings ---------- */
{
  const _ap = applyPrefs;
  applyPrefs = function () {
    _ap.apply(this, arguments);
    document.documentElement.classList.toggle("cardsym", PREF.cardSym === true);
  };
}
{
  const _om = openMenu;
  openMenu = function () {
    _om.apply(this, arguments);
    const m = $("#menu"),
      a = m && m.querySelector("#mSpellBL");
    if (!a || m.querySelector("#mCardSym")) return;
    a.closest("label").insertAdjacentHTML(
      "afterend",
      `<label class="f">Player symbols on cards <select id="mCardSym"><option value="0" ${PREF.cardSym === true ? "" : "selected"}>Off (default)</option><option value="1" ${PREF.cardSym === true ? "selected" : ""}>On</option></select></label>`,
    );
    $("#mCardSym").onchange = (e) => {
      PREF.cardSym = e.target.value === "1";
      savePrefs();
      applyPrefs();
      render();
    };
  };
}

if (window.__EC)
  Object.assign(window.__EC, {
    accentOf,
    ACCENTS,
    stackEdges,
    face: (...a) => face(...a),
  });
{
  const _m = mkPlayer;
  mkPlayer = function (i, o) {
    const P = _m.apply(this, arguments);
    P.accent = (o && o.accent) || "auto";
    return P;
  };
}
/* the book's passages fold on a computer too, closed until their heading is clicked */
FOLD_ALWAYS.add("quotes");
