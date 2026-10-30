/* ---------- v71h: Colorblind-safe colors (a Display setting, only for this device) ----------
   Every player shows in a color of the Okabe and Ito palette, which red-green and blue-yellow colorblind eyes can tell
   apart. CB_SEP is how far apart each pair stays for protanopia, deuteranopia and tritanopia (the least of the three, in
   CIEDE2000, by simulation): never under 10. Each player gets the palette color nearest to the one they picked, steering
   away from the pairs that come closest. Their cards and stacks carry a faint pattern of their own and always show their
   symbol. It changes only what this screen shows: the game, its log and what goes online keep the colors players picked.
   The colors are swapped as the page draws (innerHTML, insertAdjacentHTML and the few style properties set by hand), so
   every place a player's color appears follows without touching each one. */
const CB_PAL = [
  "#56b4e9",
  "#d55e00",
  "#f0e442",
  "#cc79a7",
  "#0072b2",
  "#009e73",
  "#e69f00",
  "#dddddd",
];
const CB_SEP = [
  [0, 52, 40, 14, 20, 12, 51, 21],
  [52, 0, 24, 14, 50, 18, 13, 34],
  [40, 24, 0, 25, 47, 28, 12, 15],
  [14, 14, 25, 0, 12, 16, 11, 19],
  [20, 50, 47, 12, 0, 12, 51, 37],
  [12, 18, 28, 16, 12, 0, 18, 24],
  [51, 13, 12, 11, 51, 18, 0, 27],
  [21, 34, 15, 19, 37, 24, 27, 0],
];
let cbKey = null,
  cbTab = null,
  cbRe = null;
/* the players' colors mapped to the palette: the least total distance from the colors picked, plus a cost for each pair
   closer than 16 */
function cbTable() {
  if (!PREF.cb || !G || !G.p) return null;
  const ps = G.p.filter(
    (P) => P && !isNPC(P.i) && /^#[0-9a-f]{6}$/i.test(P.color || ""),
  );
  const key = ps.map((P) => P.color.toLowerCase()).join();
  if (key === cbKey) return cbTab;
  cbKey = key;
  cbTab = null;
  cbRe = null;
  const src = [...new Set(ps.map((P) => P.color.toLowerCase()))].slice(
    0,
    CB_PAL.length,
  );
  if (!src.length) return null;
  const D = src.map((a) =>
    CB_PAL.map((b) => {
      const x = labOf(a),
        y = labOf(b);
      return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
    }),
  );
  let best = 1 / 0,
    out = null;
  const used = [],
    cur = [];
  (function go(i, s) {
    if (s >= best) return;
    if (i === src.length) {
      best = s;
      out = cur.slice();
      return;
    }
    for (let j = 0; j < CB_PAL.length; j++)
      if (!used[j]) {
        let t = s + D[i][j];
        for (let q = 0; q < i; q++)
          t += Math.max(0, 16 - CB_SEP[cur[q]][j]) * 3;
        used[j] = 1;
        cur[i] = j;
        go(i + 1, t);
        used[j] = 0;
      }
  })(0, 0);
  cbTab = {};
  src.forEach((c, i) => (cbTab[c] = CB_PAL[out[i]]));
  cbRe = new RegExp(src.join("|"), "gi");
  return cbTab;
}
function cbMap(col) {
  const T = cbTable();
  return T && typeof col === "string" ? T[col.toLowerCase()] || col : col;
}
/* the setup keeps the colors as picked: they are what the other players see */
function cbHTML(el, v) {
  if (!PREF.cb || typeof v !== "string" || v.indexOf("#") < 0) return v;
  const T = cbTable();
  if (!T || !cbRe) return v;
  if (el && el.closest && el.closest(".ovbox.setup")) return v;
  if (el && el.id === "ov" && /^\s*<div class="ovbox setup/.test(v)) return v;
  return v.replace(cbRe, (m) => T[m.toLowerCase()] || m);
}
{
  const d = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
  if (d && d.set)
    Object.defineProperty(Element.prototype, "innerHTML", {
      configurable: true,
      enumerable: d.enumerable,
      get() {
        return d.get.call(this);
      },
      set(v) {
        d.set.call(this, cbHTML(this, v));
      },
    });
}
{
  const _ia = Element.prototype.insertAdjacentHTML;
  Element.prototype.insertAdjacentHTML = function (w, v) {
    return _ia.call(this, w, cbHTML(this, v));
  };
}
{
  const _mk = FX.make;
  FX.make = function (cls, rect, o) {
    if (o && o.col) o = Object.assign({}, o, { col: cbMap(o.col) });
    return _mk.call(this, cls, rect, o);
  };
}
{
  const _ap = applyPrefs;
  applyPrefs = function () {
    _ap.apply(this, arguments);
    document.documentElement.classList.toggle("cvd", PREF.cb === true);
    const b = $("#pCb");
    if (b) {
      b.textContent = "Colorblind-safe: " + (PREF.cb ? "On" : "Off");
      b.setAttribute("aria-pressed", PREF.cb === true);
    }
  };
}
function cbSet(on) {
  PREF.cb = !!on;
  savePrefs();
  applyPrefs();
  if (G) render();
}

/* where it is set: the Display bar, the pause menu (Settings on the front page), the setup's Display tab, the online Display tab */
{
  const _mb = mountBar;
  mountBar = function () {
    _mb.apply(this, arguments);
    const c = $("#pCoord");
    if (!c || $("#pCb")) return;
    c.insertAdjacentHTML(
      "afterend",
      `<button type="button" id="pCb" class="gtog" title="Players in colors colorblind eyes can tell apart, each with a faint pattern of their own. Only on this device."></button>`,
    );
    $("#pCb").onclick = () => cbSet(!PREF.cb);
    applyPrefs();
  };
}
{
  const _om = openMenu;
  openMenu = function () {
    _om.apply(this, arguments);
    const m = $("#menu"),
      a = m && (m.querySelector("#mCardSym") || m.querySelector("#mSpellBL"));
    if (!a || m.querySelector("#mCb")) return;
    a.closest("label").insertAdjacentHTML(
      "afterend",
      `<label class="f">Colorblind-safe colors <select id="mCb"><option value="0" ${PREF.cb ? "" : "selected"}>Off (default)</option><option value="1" ${PREF.cb ? "selected" : ""}>On</option></select></label>`,
    );
    $("#mCb").onchange = (e) => cbSet(e.target.value === "1");
  };
}
{
  const _pd = paintDisp;
  paintDisp = function () {
    _pd.apply(this, arguments);
    const a = $("#gAnimM");
    if (!a || $("#gCb")) return;
    a.closest("label").insertAdjacentHTML(
      "afterend",
      `<label class="f">Colorblind-safe colors <select id="gCb"><option value="0" ${PREF.cb ? "" : "selected"}>Off</option><option value="1" ${PREF.cb ? "selected" : ""}>On</option></select></label>`,
    );
    $("#gCb").onchange = (e) => cbSet(e.target.value === "1");
  };
}
document.addEventListener("change", (e) => {
  if (e.target && e.target.id === "dcb") cbSet(e.target.checked);
});

if (window.__EC)
  Object.assign(window.__EC, {
    cbTable: () => cbTable(),
    cbMap: (c) => cbMap(c),
    cbSet: (on) => cbSet(on),
    CB_PAL,
  });
