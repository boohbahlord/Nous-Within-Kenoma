/* ---------- v79a: where notices show ----------
   Outside fullscreen nothing changes. In fullscreen a notice shows in one of two places, and nowhere else, and both look alike:
   - on the left, on top of your hand and its mining slots: what concerns you and what you are doing right now (the answers
     to your own moves, the field keys' note, the reminder of the keys);
   - the top middle, under the turn bar and the meters: what happens on the table (the other players, the sky, the Bank,
     the events).
   A menu's "!" is the third kind and stays on its menu. */
const NOTE_LEFT = ["kbremind", "flash", "fkmode"]; // top to bottom in the left column
const noteHomes = new Map(); // where each one lives outside fullscreen
function noticeSpots() {
  const h = document.documentElement;
  let L = $("#fsleft");
  if (!fsOn()) {
    if (L)
      for (const id of NOTE_LEFT) {
        const e = document.getElementById(id),
          o = noteHomes.get(id);
        if (e && e.parentNode === L) {
          if (o && o.p.isConnected)
            o.p.insertBefore(e, o.n && o.n.parentNode === o.p ? o.n : null);
          else document.body.appendChild(e);
        }
      }
    return;
  }
  if (!L) {
    L = document.createElement("div");
    L.id = "fsleft";
    document.body.appendChild(L);
  }
  for (const id of NOTE_LEFT) {
    const e = document.getElementById(id);
    if (!e || e.parentNode === L) continue;
    noteHomes.set(id, { p: e.parentNode, n: e.nextSibling });
    L.appendChild(e);
  }
  NOTE_LEFT.forEach((id) => {
    const e = document.getElementById(id);
    if (e && e.parentNode === L) L.appendChild(e);
  }); // in order
  const hw = $("#handwrap"),
    r = hw && hw.getClientRects().length ? hw.getBoundingClientRect() : null;
  h.style.setProperty(
    "--fsleftb",
    Math.round(
      r && r.height
        ? innerHeight - r.top + 6
        : $("#fsrow")
          ? $("#fsrow").offsetHeight + 16
          : 40,
    ) + "px",
  );
  if (r && r.width)
    h.style.setProperty("--fsleftw", Math.round(r.width) + "px");
  let top = 0;
  for (const s of ["#me", "#controls", "#fsphase"]) {
    const e = $(s);
    if (e && e.getClientRects().length)
      top = Math.max(top, e.getBoundingClientRect().bottom);
  }
  if (top) h.style.setProperty("--fsnotet", Math.round(top + 8) + "px");
}
{
  const _r = render;
  render = function () {
    rSafe(_r, this, arguments);
    noticeSpots();
    if (fsOn()) requestAnimationFrame(noticeSpots);
    banDue();
    drawDark();
  };
}
addEventListener("resize", () => {
  if (fsOn()) noticeSpots();
});
/* a notice made while fullscreen is on goes straight to its place */
{
  const _f = flash;
  flash = function () {
    const out = _f.apply(this, arguments);
    if (fsOn()) noticeSpots();
    return out;
  };
}
{
  const _k = kbRemind;
  kbRemind = function () {
    const out = _k.apply(this, arguments);
    if (fsOn()) noticeSpots();
    return out;
  };
}

/* ---------- v79a: the round banner shows at the start of your prep ----------
   The round's banner (its number, and the grace, the moon, the cycle, the eclipse) waits for the start of the prep of each
   person at this device; with nobody playing here (computers only) it shows when the round starts. Online, each device shows
   it for its own seat. */
const deviceSeat = (i) =>
  !!(G && G.p[i]) && (netOn() ? i === NET.seat : !G.p[i].cpu);
const BAN_SEEN = new Set();
const banKey = (b, who) => `${G.map ? G.map.seed : ""}:${b.r}:${who}`;
function banShown(b) {
  for (const k of BAN_SEEN)
    if (k.startsWith(`${G.map ? G.map.seed : ""}:${b.r}:`)) return true;
  return false;
}
function banDue() {
  if (!G || G.over || !G.ban || G.passing) return;
  const b = G.ban;
  if (!G.p.some((P, i) => deviceSeat(i))) {
    const k = banKey(b, "all");
    if (!BAN_SEEN.has(k)) {
      BAN_SEEN.add(k);
      roundBanner(b.n, b.sub);
    }
    return;
  }
  if (G.phase !== "prep" || !deviceSeat(G.active)) return;
  const k = banKey(b, G.active);
  if (BAN_SEEN.has(k)) return;
  BAN_SEEN.add(k);
  roundBanner(b.n, b.sub);
}

/* ---------- v79a: the field goes very dark while you draw ---------- */
function drawDark() {
  const on = !!(
      G &&
      !G.over &&
      G.phase === "draw" &&
      !G.drawWait &&
      deviceSeat(G.active)
    ),
    B = $("#board");
  document.documentElement.classList.toggle("drawdark", on);
  if (B && !B.querySelector(":scope>.drawveil"))
    B.insertAdjacentHTML(
      "beforeend",
      '<div class="drawveil" aria-hidden="true"></div>',
    );
} // a veil over the whole field, tiles, fog and all

/* ---------- v79a: hold Alt to scroll ----------
   In a window: Alt+W and Alt+S (or Alt+C and Alt+V) scroll it up and down, Alt+A and Alt+D left and right. With no window
   open: Alt+C and Alt+V scroll the page (in fullscreen, the open drawer). Shift scrolls further. Held down, it keeps going. */
function kbScrollBox(w) {
  let best = null,
    ba = 0;
  for (const el of [w, ...w.querySelectorAll("*")]) {
    if (
      el.scrollHeight <= el.clientHeight + 2 &&
      el.scrollWidth <= el.clientWidth + 2
    )
      continue;
    const cs = getComputedStyle(el);
    if (
      !/auto|scroll/.test(cs.overflowY + " " + cs.overflowX) ||
      !el.getClientRects().length
    )
      continue;
    const a = el.clientWidth * el.clientHeight;
    if (a > ba) {
      ba = a;
      best = el;
    }
  }
  return best;
}
document.addEventListener(
  "keydown",
  (e) => {
    if (!e.altKey || typing(e.target)) return;
    const w = kbTop();
    let d = null,
      box = null;
    if (w) {
      d = kmIs(e, "winScrollUp")
        ? [0, -1]
        : kmIs(e, "winScrollDown")
          ? [0, 1]
          : kmIs(e, "winScrollLeft")
            ? [-1, 0]
            : kmIs(e, "winScrollRight")
              ? [1, 0]
              : null;
      if (d) box = kbScrollBox(w);
    } else {
      const p = kmIs(e, "pageUp") ? -1 : kmIs(e, "pageDown") ? 1 : 0;
      if (p) {
        d = [0, p];
        box = fsOn()
          ? PREF.fsSp
            ? $(".spellpanel")
            : PREF.fsSel
              ? $("#selwrap")
              : null
          : document.scrollingElement;
      }
    }
    if (!d) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (!box) return;
    const pg = box === document.scrollingElement,
      k = e.shiftKey ? 0.8 : 0.3;
    box.scrollBy({
      left: d[0] * (pg ? innerWidth : box.clientWidth) * k,
      top: d[1] * (pg ? innerHeight : box.clientHeight) * k,
      behavior: e.repeat ? "auto" : "smooth",
    });
  },
  true,
);

if (window.__EC)
  Object.assign(window.__EC, {
    noticeSpots: () => noticeSpots(),
    banDue: () => banDue(),
    BAN_SEEN,
  });
