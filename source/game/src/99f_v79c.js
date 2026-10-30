/* ---------- v79c: a symbol beside the phase's name ----------
   Draw: a face-down deck seen from above at a slant, its height and its top. Prep: a chess knight. Attack: a sword whose
   handle sits at the bottom left, in front of a shield, and whose blade runs up to the top right; the shield is painted
   inside in the player's color with their symbol on it (and their card pattern, and a shine with the metal sheen), and its
   rim in their second color: their side's color in a team game, gold otherwise. */
const PH_PAT = [
  "M0 3L3 0M-1 1L1-1M2 4L4 2",
  "M0 0L3 3M-1 2L1 4M2-1L4 1",
  null,
  "M1.5 0V3",
  "M0 1.5H3",
  "M0 3L3 0M0 0L3 3",
  "M1.5 0V3M0 1.5H3",
  null,
]; // the card patterns, small
function phPatDef(id, k) {
  if (k == null || k < 0) return "";
  const body =
    k === 2
      ? `<circle cx="1.5" cy="1.5" r=".5" fill="#fff" fill-opacity=".35"/>`
      : k === 7
        ? `<circle cx="1.5" cy="1.5" r="1.05" fill="none" stroke="#fff" stroke-opacity=".32" stroke-width=".45"/>`
        : PH_PAT[k]
          ? `<path d="${PH_PAT[k]}" stroke="#fff" stroke-opacity=".32" stroke-width=".55"/>`
          : "";
  return body
    ? `<pattern id="${id}" width="3" height="3" patternUnits="userSpaceOnUse">${body}</pattern>`
    : "";
}
const phSecond = (pl) => {
  const P = G.p[pl];
  if (!P) return "#d4a53c";
  const mates = G.p.some((Q) => Q.i !== pl && !isNPC(Q.i) && Q.team === P.team);
  return mates &&
    typeof SIDE_COL !== "undefined" &&
    SIDE_COL[(P.team | 0) % SIDE_COL.length]
    ? SIDE_COL[(P.team | 0) % SIDE_COL.length][1]
    : "#d4a53c";
};
function phIcon(ph, pl) {
  const S = `class="phico ph-${ph}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"`;
  if (ph === "draw") {
    let edges = "";
    for (let k = 1; k <= 4; k++)
      edges += `M3 ${10 + k}L12 ${14 + k}L21 ${10 + k}`;
    return `<svg ${S}><path d="M3 10L12 14L21 10V15L12 19L3 15Z" fill="#efe4cc" stroke="#2a1a0e" stroke-width=".8" stroke-linejoin="round"/><path d="${edges}" fill="none" stroke="#7a6a52" stroke-width=".45"/>
<path d="M3 10L12 6L21 10L12 14Z" fill="#8c2a26" stroke="#2a1a0e" stroke-width=".8" stroke-linejoin="round"/><path d="M6.4 10L12 7.6L17.6 10L12 12.4Z" fill="none" stroke="#e3b46a" stroke-width=".55"/><path d="M10.3 10L12 9.2L13.7 10L12 10.8Z" fill="#e3b46a"/></svg>`;
  }
  if (ph === "prep")
    return `<svg ${S}><path d="M6.5 21.5H18v-1.7c0-.7-.5-1.3-1.2-1.5l-.5-.1c-.4-2.5.3-4.7 1.1-6.9.9-2.6.3-5-1.6-6.6-1.3-1.1-3-1.6-4.7-1.4l-1-1.8-.9 2.1c-1.7.9-3 2.4-3.9 4.2L4.4 9.9c-.3.7.1 1.5.8 1.7l.9.3c.6.2 1.2 0 1.5-.5l.8-1.1c.7.2 1.4.1 2-.3-.9 2.6-2.8 4.5-3 7.4l-.6.2c-.7.2-1.2.8-1.2 1.5Z" fill="#efe4cc" stroke="#2a1a0e" stroke-width=".9" stroke-linejoin="round"/>
<path d="M12.2 5.6c1.7.4 3.1 1.6 3.5 3.4" fill="none" stroke="#2a1a0e" stroke-width=".7" stroke-linecap="round"/><circle cx="9.9" cy="8.3" r=".75" fill="#2a1a0e"/><path d="M6.5 19.8H18" stroke="#2a1a0e" stroke-width=".6"/></svg>`;
  if (ph === "attack") {
    const P = G && G.p[pl],
      pc = P ? cbMap(P.color) : "#c9a24a",
      sc = phSecond(pl),
      pat =
        P && P.pattern != null && P.pattern >= 0 && PREF.pat !== false
          ? P.pattern
          : -1,
      id = `php${pl}_${pat}`;
    const shield =
        "M4.5 4H16.5V10.5C16.5 15.2 13.4 18.4 10.5 20C7.6 18.4 4.5 15.2 4.5 10.5Z",
      sym =
        P && P.solid
          ? `<g transform="translate(10.5 10.6) scale(.3)"><path d="${solidPath(P.solid)}" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="4.4" stroke-linejoin="round"/><path d="${solidPath(P.solid)}" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/></g>`
          : "";
    return `<svg ${S}><defs>${phPatDef(id + "p", pat)}<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".55"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
<path d="${shield}" fill="${pc}"/>${pat >= 0 ? `<path d="${shield}" fill="url(#${id}p)"/>` : ""}${P && P.sheen ? `<path d="${shield}" fill="url(#${id}g)"/>` : ""}${sym}<path d="${shield}" fill="none" stroke="${sc}" stroke-width="1.7" stroke-linejoin="round"/><path d="${shield}" fill="none" stroke="#1a1008" stroke-width=".45" stroke-linejoin="round" transform="translate(0 0)"/>
<path d="M6.47 16.47L19.77 3.17L21.6 2.4L20.83 4.23L7.53 17.53Z" fill="#dfe3ea" stroke="#1a1008" stroke-width=".6" stroke-linejoin="round"/><path d="M7.4 16.6L20.2 3.8" stroke="#8d96a3" stroke-width=".4"/>
<path d="M5.2 15.2L8.8 18.8" stroke="#1a1008" stroke-width="2.4" stroke-linecap="round"/><path d="M5.2 15.2L8.8 18.8" stroke="#d4a53c" stroke-width="1.5" stroke-linecap="round"/>
<path d="M6.6 17.4L4.5 19.5" stroke="#1a1008" stroke-width="2.1" stroke-linecap="round"/><path d="M6.6 17.4L4.5 19.5" stroke="#6b3d1c" stroke-width="1.3" stroke-linecap="round"/><circle cx="3.9" cy="20.1" r="1.1" fill="#d4a53c" stroke="#1a1008" stroke-width=".5"/></svg>`;
  }
  return "";
}
/* on the turn bar (fullscreen, or the buttons at the top) and on the turn line */
{
  const _r = render;
  render = function () {
    rSafe(_r, this, arguments);
    if (!G) return;
    const l = document.querySelector("#controls .phl");
    if (l && !l.querySelector(".phico")) {
      const ico = phIcon(G.phase, G.active);
      if (ico) l.insertAdjacentHTML("afterbegin", ico);
    }
  };
}

/* ---------- v79c: the mining slots fold and unfold by a key (Shift+G: G picks from the hand, just under them) ---------- */
function kbMineFold() {
  const b = $("#minepanel .msfold");
  if (b && b.getClientRects().length) {
    b.click();
    return;
  }
  flash("There are no mining slots to fold now.");
}

if (window.__EC) Object.assign(window.__EC, { phIcon: (...a) => phIcon(...a) });

/* ---------- v79c: the hand says how many cards it holds out of its most ("Your hand 5/7"; in fullscreen a small tag on
   the hand's box); over the most, in red ---------- */
{
  const _r = render;
  render = function () {
    rSafe(_r, this, arguments);
    if (!G) return;
    const V = view(),
      P = G.p[V];
    if (!P || isNPC(V) || (NET.role === "guest" && NET.watch)) return;
    const n = P.hand.length,
      cap = handCap(V),
      over = n > cap,
      txt = `${n}/${cap}`,
      tip = `${n} card${n === 1 ? "" : "s"} in your hand; you may hold ${cap}${over ? ": over the most" : ""}`;
    const shut =
      G.phase === "prep" &&
      G.spent &&
      G.active === V &&
      n > 0 &&
      !isHorde(V) &&
      canAct(); // v79h: why the sacrifice buttons are gone
    const hh = $("#handh");
    if (hh) {
      let s = hh.querySelector(".sacoff");
      if (shut && !s) {
        s = document.createElement("small");
        s.className = "sacoff";
        s.textContent = "Sacrifices closed: mana was spent";
        s.title =
          "Sacrifices come first in the prep phase: once you spend mana (a spell, the Ether, the Bank, land), no more sacrifices until your next prep phase.";
        hh.appendChild(s);
      } else if (!shut && s) s.remove();
      let c = hh.querySelector(".hcnt");
      if (!c) {
        c = document.createElement("span");
        c.className = "hcnt";
        hh.appendChild(c);
      }
      c.textContent = txt;
      c.classList.toggle("over", over);
      c.title = tip;
    }
    const hw = $("#handwrap");
    if (hw) {
      let t = hw.querySelector(":scope>.hcnttag");
      if (!t) {
        t = document.createElement("span");
        t.className = "hcnttag";
        hw.appendChild(t);
      }
      t.textContent = "Hand " + txt;
      t.classList.toggle("over", over);
      t.title = tip;
    }
  };
}
if (window.__EC)
  Object.assign(window.__EC, {
    flash: (t) => flash(t),
    notify: (p, h) => notify(p, h),
    kbRemind: () => kbRemind(),
  });
