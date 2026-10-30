/* ---------- v71j: Default, Data saving or Poor connection (asked once, on the first visit to any Ether's Crossroads page) ----------
   A setting on this device (PREF.net: 0, 1 or 2).
   Data saving: the pages fetch nothing they can do without (the background picture, the fonts, the book's
   passages: see each page's head and site.js), nothing on the field moves (animations, fog, fire, the sky's glow, static,
   lines), and online the host sends this player only the parts of the game that changed (a few kilobytes, not the
   whole game every time).
   Poor connection: all of that, the host's updates gathered into a few a second for the whole table, no animation
   messages for this player, and a dropped connection keeps trying for a minute and a half. The map stays: it is drawn on
   the device and costs no data. */
const netLvl = () => Math.max(0, Math.min(2, +PREF.net || 0));
const NET_NAMES = ["Default", "Data saving", "Poor connection"];
const NET_SUBS = [
  "Everything: the art, the fonts, the music and the animations.",
  "Your device's own fonts, a plain background, nothing moving, and lighter online play. The music still plays: it is made on your device.",
  "For a weak or unreliable connection: all of Data saving, fewer online updates, and longer patience when the connection drops. The music still plays.",
];
{
  const _ap = applyPrefs;
  applyPrefs = function () {
    _ap.apply(this, arguments);
    const h = document.documentElement,
      n = netLvl();
    h.classList.toggle("lite", n > 0);
    h.classList.toggle("poor", n > 1);
    if (n > 0)
      for (const k of ["fog", "fire", "sky", "glow", "blood", "magic"])
        h.classList.add("still-" + k);
    const b = $("#pNet");
    if (b) {
      b.textContent = "Connection: " + NET_NAMES[n];
      b.setAttribute("aria-pressed", n > 0);
    }
  };
}
{
  const _on = FX.on;
  FX.on = function () {
    return netLvl() === 0 && _on.apply(this, arguments);
  };
}
/* what the page fetches only without data saving: the music and the book's passages */
const siteV = () => {
  const s = document.querySelector('script[src*="site.js?v="]'),
    m = s && /v=(\d+)/.exec(s.getAttribute("src"));
  return m ? m[1] : "0";
};
function loadScript(src, done) {
  const s = document.createElement("script");
  s.src = src;
  if (done) s.onload = done;
  document.head.appendChild(s);
}
function loadMusic() {
  if (window.ECMusic || document.querySelector('script[src^="ec-music.js"]'))
    return;
  loadScript(`ec-music.js?v=${siteV()}`);
}
let quotesUp = false,
  quotesLoading = false;
{
  const _mq = mountQuotes;
  mountQuotes = function () {
    if (quotesUp || netLvl() > 0) return;
    if (window.EC_QUOTES && window.EC_QUOTES.length) {
      quotesUp = true;
      return _mq.apply(this, arguments);
    }
    if (!window.EC_QSRC || quotesLoading) return;
    quotesLoading = true;
    loadScript(window.EC_QSRC, () => {
      quotesLoading = false;
      mountQuotes();
    });
  };
}
const LITE_FONTS =
  '@font-face{font-family:"Grenze Gotisch";font-style:normal;font-weight:500;src:local("Old English Text MT"),local("Times New Roman"),local("Georgia"),local("Noto Serif"),local("DejaVu Serif"),local("Liberation Serif")}';
function liteFonts(on) {
  let y = document.getElementById("litefonts");
  if (on && !y) {
    y = document.createElement("style");
    y.id = "litefonts";
    y.textContent = LITE_FONTS;
    document.head.appendChild(y);
  } else if (!on && y) y.remove();
}
function netSet(n, asked) {
  n = Math.max(0, Math.min(2, +n || 0));
  PREF.net = n;
  if (asked) PREF.netAsked = 1;
  savePrefs();
  applyPrefs();
  liteFonts(n > 0);
  if (window.nwkLook) window.nwkLook();
  if (window.nwkStatic && window.nwkStatic.refresh) window.nwkStatic.refresh();
  loadMusic();
  if (!n) mountQuotes(); // v76b: the music plays in every mode (made on the device, no data after its one small script)
  if (window.ECMusic && window.ECMusic.sync) window.ECMusic.sync();
  if (NET.role === "guest" && NET.tr) sendHost({ t: "lite", lvl: n, delta: 1 });
  if (G) render();
  else paintNetCtl();
}
window.ecSetNet = (n, asked) => netSet(n, asked); // the first visit's question (site.js) answers here on the game's page

/* where it is set: the Display bar, the Menu (also Settings before a game), the setup's Display tab, the online Display tab */
function paintNetCtl() {
  const m = $("#mNet");
  if (m) m.value = String(netLvl());
  const g = $("#gNet");
  if (g) g.value = String(netLvl());
}
{
  const _mb = mountBar;
  mountBar = function () {
    _mb.apply(this, arguments);
    const a = $("#pCb") || $("#pCoord");
    if (!a || $("#pNet")) return;
    a.insertAdjacentHTML(
      "afterend",
      `<button type="button" id="pNet" class="gtog" title="Default, Data saving or Poor connection: how much the game loads and sends. Only on this device."></button>`,
    );
    $("#pNet").onclick = () => netSet((netLvl() + 1) % 3);
    applyPrefs();
  };
}
const netSel = (id) =>
  `<select id="${id}">${NET_NAMES.map((t, i) => `<option value="${i}" ${netLvl() === i ? "selected" : ""}>${t}${i ? "" : " (default)"}</option>`).join("")}</select>`;
{
  const _om = openMenu;
  openMenu = function () {
    _om.apply(this, arguments);
    const m = $("#menu"),
      a = m && (m.querySelector("#mCb") || m.querySelector("#mCardSym"));
    if (!a || m.querySelector("#mNet")) return;
    a.closest("label").insertAdjacentHTML(
      "afterend",
      `<label class="f">Connection ${netSel("mNet")}</label>`,
    );
    $("#mNet").onchange = (e) => netSet(+e.target.value);
  };
}
{
  const _pd = paintDisp;
  paintDisp = function () {
    _pd.apply(this, arguments);
    const a = $("#gCb") || $("#gAnimM");
    if (!a || $("#gNet")) return;
    a.closest("label").insertAdjacentHTML(
      "afterend",
      `<label class="f">Connection ${netSel("gNet")}</label>`,
    );
    $("#gNet").onchange = (e) => netSet(+e.target.value);
  };
}
document.addEventListener("change", (e) => {
  if (e.target && e.target.name === "dnet") netSet(+e.target.value);
});

/* ---------- online: a joined player tells the host how it loads ----------
   The host sends a data-saving player (or everyone, when the host saves data) only the parts of the game that changed: each
   player's every field, each row of the board and every other part of the game separately; the joined screen keeps the
   rest and puts the game back together, exactly as it was sent. It asks for the whole game again if anything is missing.
   With a poor connection anywhere at the table the host gathers its updates into a few a second; a poor-connection
   player gets no animation messages (they don't play them anyway). */
NET.lite = NET.lite || {};
const deltaFor = (id) => {
  const L = NET.lite[id];
  return !!(L && L.delta && (L.lvl > 0 || netLvl() > 0));
};
function netQuiet(id) {
  const L = NET.lite && NET.lite[id];
  return !!(L && L.lvl > 1);
} // used by netFX (37_online2)
const netSlow = () =>
  netLvl() > 1 || Object.keys(NET.guests).some((id) => netQuiet(id));
function snapSplit(g) {
  const o = JSON.parse(g),
    parts = {},
    skel = [];
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (k === "p" && Array.isArray(v))
      skel.push([
        "p",
        v.map((P, i) => {
          if (!P || typeof P !== "object" || Array.isArray(P)) {
            parts[`p|${i}`] = JSON.stringify(P);
            return null;
          }
          const ks = Object.keys(P);
          for (const q of ks) parts[`p|${i}|${q}`] = JSON.stringify(P[q]);
          return ks;
        }),
      ]);
    else if (k === "board" && Array.isArray(v)) {
      skel.push(["board", v.length]);
      v.forEach((row, i) => (parts[`board|${i}`] = JSON.stringify(row)));
    } else {
      skel.push(k);
      parts[k] = JSON.stringify(v);
    }
  }
  return { skel, parts };
}
function snapJoin(skel, parts) {
  const get = (k) => {
    if (parts[k] === undefined) throw new Error("missing " + k);
    return parts[k];
  };
  return (
    "{" +
    skel
      .map((e) =>
        typeof e === "string"
          ? JSON.stringify(e) + ":" + get(e)
          : e[0] === "p"
            ? '"p":[' +
              e[1]
                .map((ks, i) =>
                  ks
                    ? "{" +
                      ks
                        .map(
                          (q) => JSON.stringify(q) + ":" + get(`p|${i}|${q}`),
                        )
                        .join(",") +
                      "}"
                    : get(`p|${i}`),
                )
                .join(",") +
              "]"
            : '"board":[' +
              Array.from({ length: e[1] }, (_, i) => get(`board|${i}`)).join(
                ",",
              ) +
              "]",
      )
      .join(",") +
    "}"
  );
}
flushSnap = function () {
  clearTimeout(snapT);
  snapT = null;
  if (NET.role !== "host" || !G || !G.opts.online) return;
  let base = null,
    lean = null,
    split = null;
  for (const id of guestIds()) {
    const st = NET.sent[id] || (NET.sent[id] = { n: 0, full: false });
    const full = !st.full;
    const log = G.log
      .filter((l) => (!full ? (l.n || 0) > st.n : true))
      .slice(0, full ? 600 : 200);
    if (deltaFor(id)) {
      if (!lean) {
        lean = snapshot(false);
        split = snapSplit(lean.g);
      }
      const parts = {};
      for (const k in split.parts)
        if (full || !st.parts || st.parts[k] !== split.parts[k])
          parts[k] = split.parts[k];
      const sk = JSON.stringify(split.skel),
        dg = { parts };
      if (full || st.skel !== sk) dg.skel = split.skel;
      sendTo(id, { t: "snap", full, dg, aim: lean.aim, log });
      st.parts = split.parts;
      st.skel = sk;
    } else {
      if (!base || full) base = snapshot(full);
      sendTo(id, { t: "snap", full, g: base.g, aim: base.aim, log });
    }
    st.full = true;
    st.n = G.logN || 0;
  }
};
{
  const _on = onNet;
  onNet = function (from, d) {
    if (d && NET.role === "guest" && (d.t === "welcome" || d.t === "start"))
      setTimeout(() => {
        if (NET.tr) sendHost({ t: "lite", lvl: netLvl(), delta: 1 });
      }, 0);
    if (
      d &&
      d.t === "lite" &&
      (NET.role === "host" || NET.role === "lobby-host")
    ) {
      NET.lite[from] = {
        lvl: Math.max(0, Math.min(2, +d.lvl || 0)),
        delta: !!d.delta,
      };
      if (d.resync && NET.sent[from]) NET.sent[from].full = false;
      return;
    }
    if (d && d.t === "snap" && d.dg && NET.role === "guest") {
      let g = null;
      try {
        if (d.full || !NET.dparts) NET.dparts = {};
        Object.assign(NET.dparts, d.dg.parts || {});
        if (d.dg.skel) NET.dskel = d.dg.skel;
        if (NET.dskel && (d.full ? d.dg.skel : true))
          g = snapJoin(NET.dskel, NET.dparts);
      } catch (e) {
        g = null;
      }
      if (g == null) {
        sendHost({ t: "lite", lvl: netLvl(), delta: 1, resync: 1 });
        return;
      }
      d = Object.assign({}, d, { g });
      delete d.dg;
    }
    return _on.call(this, from, d);
  };
}
/* a poor connection at the table: the host gathers its updates (a question still sends the game at once, before it asks) */
{
  const _rd = render;
  render = function () {
    const had = !!snapT;
    rSafe(_rd, this, arguments);
    if (!had && snapT && NET.role === "host" && netSlow()) {
      clearTimeout(snapT);
      snapT = setTimeout(flushSnap, 320);
    }
  };
}

if (window.__EC)
  Object.assign(window.__EC, {
    netLvl,
    netSet: (n, a) => netSet(n, a),
    snapSplit,
    snapJoin,
    netQuiet,
  });
