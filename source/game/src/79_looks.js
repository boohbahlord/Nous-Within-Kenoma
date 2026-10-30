/* ---------- v71m: more symbols, card patterns, metal sheen, and black as a player's color ----------
   - More shapes for the players' symbols, so a full table of eight never runs short: the Sphere, the Heart (v72a, in the
     Prism's place), the Pentagram, the Cuboctahedron and (v73a) the six-pointed star; the Pyramid is gone.
   - Card patterns: each player's cards and stacks carry a faint pattern of their own. In the seat's look, Pattern is
     Random by default (a pattern nobody else has), None, or one of eight. A Display setting (on by default) shows them;
     Colorblind-safe colors always show them.
   - Metal sheen (off by default, per player): a slow shine sweeps across that player's cards and stacks.
   - Onyx (black) is a player's color: its names, symbols and dice get a light edge so they read on dark pages. */
Object.assign(SOLIDS, {
  sphere: "Sphere",
  heart: "Heart",
  penta: "Pentagram",
  cubocta: "Cuboctahedron",
  hexa: "Six-pointed star",
}); // v72a: the Heart took the Prism's place; v73a: no Pyramid, and the six-pointed star is anyone's (the Firmament bears the eight-pointed one)
{
  const _sp = solidPath;
  solidPath = function (s) {
    if (s === "star8") return ring(poly(4, 9.8, -90)) + ring(poly(4, 9.8, -45)); // v73a: the Firmament's eight-pointed star
    if (s === "sphere")
      return "M-9,0A9,9 0 1,0 9,0A9,9 0 1,0 -9,0Z M-9,0A9,3.1 0 1,0 9,0A9,3.1 0 1,0 -9,0Z M0,-9A3.4,9 0 1,0 0,9A3.4,9 0 1,0 0,-9Z";
    if (s === "pyramid") {
      const T = [0, -9.5],
        L = [-9.5, 5],
        F = [-1.5, 8.8],
        R = [9.5, 4.4];
      return ring([T, L, F, R]) + seg(T, F);
    }
    if (s === "heart" || s === "prism")
      return "M0,8.8C-5.6,4.7 -9.7,1.2 -9.7,-3.3C-9.7,-6.7 -7.1,-8.9 -4.4,-8.9C-2.4,-8.9 -0.9,-7.7 0,-5.8C0.9,-7.7 2.4,-8.9 4.4,-8.9C7.1,-8.9 9.7,-6.7 9.7,-3.3C9.7,1.2 5.6,4.7 0,8.8Z M0,-5.8V8.8"; // a faceted heart (an old Prism draws as the Heart)
    if (s === "penta") {
      const p = poly(5, 9.8, -90);
      return "M" + [0, 2, 4, 1, 3].map((i) => p[i].join(",")).join("L") + "Z";
    }
    if (s === "cubocta") {
      const q = poly(4, 9.6, 45),
        m = q.map((v, i) => {
          const w = q[(i + 1) % 4];
          return [(v[0] + w[0]) / 2, (v[1] + w[1]) / 2];
        });
      return ring(q) + ring(m);
    }
    return _sp.apply(this, arguments);
  };
}

/* black needs a light edge to read on dark pages */
const darkCol = (c) =>
  typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c) && labOf(c)[0] < 14;
/* v77g: and so do its meters (the deck, an enemy's mana and deck lines): a meter in a near-black color is marked, and drawn light */
{
  const _r = render;
  render = function () {
    rSafe(_r, this, arguments);
    for (const el of document.querySelectorAll(
      '.deckbar[style*="--pc"],#foe [style*="--pc"],.fsfoe[style*="--pc"]',
    )) {
      const m = /--pc:\s*(#[0-9a-f]{6})/i.exec(el.getAttribute("style") || "");
      el.classList.toggle("pcdk", !!m && darkCol(m[1]));
    }
  };
}
{
  const _ss = solidSVG;
  solidSVG = function (s, color, size) {
    const h = _ss.apply(this, arguments);
    return darkCol(color)
      ? h.replace(
          'stroke="#000" stroke-opacity=".55"',
          'stroke="#e8e0d4" stroke-opacity=".8"',
        )
      : h;
  };
}
{
  const _d = dieSVG;
  dieSVG = function (d, col) {
    return _d.call(this, d, darkCol(col) ? "#a59d92" : col);
  };
}
{
  const _mk = FX.make;
  FX.make = function (cls, rect, o) {
    if (o && darkCol(o.col)) o = Object.assign({}, o, { col: "#a59d92" });
    return _mk.call(this, cls, rect, o);
  };
}

/* patterns: one per player, chosen or random (none for the Bank's and the Demons' cards) */
const PATTERNS = [
  "Slant",
  "Reverse",
  "Dots",
  "Upright",
  "Flat",
  "Hatch",
  "Grid",
  "Rings",
];
const SHEEN_T = 6;
{
  const _m = mkPlayer;
  mkPlayer = function (i, o) {
    if (o && o.solid === "prism") o = Object.assign({}, o, { solid: "heart" });
    if (o && o.solid === "pyramid")
      o = Object.assign({}, o, { solid: "tetra" });
    const P = _m.call(this, i, o);
    P.patSel = o && o.pattern != null ? String(o.pattern) : "random";
    P.sheen = !!(o && o.sheen);
    return P;
  };
}
function dealPatterns() {
  if (!G || !G.p) return;
  const ps = G.p.filter((P) => P && !P.npc && !isNPC(P.i));
  for (const P of ps) {
    const v = P.patSel;
    P.pattern =
      v === "none" ? -1 : /^\d$/.test(v) && +v < PATTERNS.length ? +v : null;
  }
  const used = new Set(
    ps.map((P) => P.pattern).filter((x) => x != null && x >= 0),
  );
  for (const P of ps)
    if (P.pattern == null) {
      const free = PATTERNS.map((_, k) => k).filter((k) => !used.has(k));
      P.pattern = pick(free.length ? free : PATTERNS.map((_, k) => k));
      used.add(P.pattern);
    }
}
{
  const _ng = newGame;
  newGame = function () {
    const out = _ng.apply(this, arguments);
    dealPatterns();
    return out;
  };
}
function lookStyle(P) {
  if (!P || P.npc) return "";
  let s = "";
  if (P.pattern != null && P.pattern >= 0)
    s += `--cbpat:var(--pat${P.pattern});`;
  if (P.sheen)
    s += `--shd:-${((performance.now() / 1000) % SHEEN_T).toFixed(2)}s;`;
  return s;
} // the shine keeps its pace when the page is drawn again
{
  const _f = face;
  face = function (c, o = {}) {
    const h = _f.apply(this, arguments),
      own = o.owner !== undefined ? o.owner : c.owner,
      P = own != null && G && G.p[own] ? G.p[own] : null,
      ls = lookStyle(P);
    if (!ls) return h;
    return (
      P.sheen ? h.replace(/^<span class="cf /, '<span class="cf sheen ') : h
    ).replace('style="--pc:', `style="${ls}--pc:`);
  };
}
{
  const _sd = siegeDecor;
  siegeDecor = function (inner, st) {
    const h = _sd.apply(this, arguments);
    if (!st) return h;
    const P = G.p[st.owner],
      ls = lookStyle(P);
    if (!ls) return h;
    return h.replace(
      /(<div class="stack[^"]*") style="/,
      (m, a) =>
        `${P.sheen ? a.replace('class="stack ', 'class="stack sheen ') : a} style="${ls}`,
    );
  };
}
{
  const _ap = applyPrefs;
  applyPrefs = function () {
    _ap.apply(this, arguments);
    document.documentElement.classList.toggle("nopat", PREF.pat === false);
  };
}

/* the seat's look: Pattern and Metal sheen, after the symbol */
function lookExtras(i, S, n) {
  const v = S.pattern || "random",
    pc = S.color && S.color !== "random" ? S.color : "#c9a274";
  return `<div class="f"><span>Pattern</span><div class="opts swatches pats">${[
    ["random", "Random"],
    ["none", "None"],
    ...PATTERNS.map((nm, k) => [String(k), nm]),
  ]
    .map(
      ([val, nm]) =>
        `<label class="sw pat${val === "random" ? " swrand" : ""}" title="${val === "random" ? "Random: a pattern nobody else has" : nm}"><input type="radio" name="pt${n}" data-seat="${i}" data-k="pattern" value="${val}" ${v === val ? "checked" : ""}><span style="--pc:${pc};${/^\d$/.test(val) ? `--cbpat:var(--pat${val})` : ""}">${val === "random" ? "?" : ""}</span><em>${nm}</em></label>`,
    )
    .join("")}</div></div>
<label class="chk"><input type="checkbox" data-seat="${i}" data-k="sheen" ${S.sheen ? "checked" : ""}> <span><b>Metal sheen</b><small>A slow shine sweeps across this player's cards and stacks. Off by default.</small></span></label>`;
}

/* the Display: Card patterns, on by default (the Menu, and the setup's Colors box) */
{
  const _om = openMenu;
  openMenu = function () {
    _om.apply(this, arguments);
    const m = $("#menu"),
      a = m && m.querySelector("#mCardSym");
    if (!a || m.querySelector("#mPat")) return;
    a.closest("label").insertAdjacentHTML(
      "afterend",
      `<label class="f">Card patterns <select id="mPat"><option value="1" ${PREF.pat === false ? "" : "selected"}>On (default)</option><option value="0" ${PREF.pat === false ? "selected" : ""}>Off</option></select></label>`,
    );
    $("#mPat").onchange = (e) => {
      PREF.pat = e.target.value === "1";
      savePrefs();
      applyPrefs();
    };
  };
}
document.addEventListener("change", (e) => {
  if (e.target && e.target.id === "dpat") {
    PREF.pat = e.target.checked;
    savePrefs();
    applyPrefs();
  }
});

if (window.__EC)
  Object.assign(window.__EC, { dealPatterns, PATTERNS, darkCol });
