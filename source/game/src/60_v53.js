/* ---------------- v53: bounty Collectors in hand and deck, Demons, the Bank's black Collectors, crits on the cards ----------------
   - Taking a bounty puts 5 Debt Collectors (made from nothing) into the hunter's deck and 2 into the hand, past the hand limit if
     need be: the one place the limit can be broken. Placed, they hunt only the bounty's target. When the bounty ends they vanish;
     when it fails, the Bank takes them from hand, deck and field and sets them on the field as its own.
   - The Demon Band's stacks are crimson; the Bank's Debt Collectors are black cards with red letters and gold edges.
   - The crit banner is a small glowing seal over the card it concerns, carried by the page (it scrolls with the field).
     Every effect over the cards is drawn on the page, not on the screen, so it stays on its card when the page scrolls.
   - The music dips for a moment under a cycle's sound (a bell, drums, a harp…), without touching the volume settings. */

/* ---------- the bounty's own Collectors ---------- */
const BOUNTY_DECK = 5,
  BOUNTY_HAND = 2;
{
  const _ab = acceptBounty;
  acceptBounty = function (pl, id) {
    const ok = _ab.apply(this, arguments);
    if (!ok || NET.role === "guest") return ok;
    const P = G.p[pl],
      mk1 = () => {
        const c = mkUnit("debt", pl);
        c.bounty = id;
        return c;
      };
    for (let i = 0; i < BOUNTY_DECK; i++) P.deck.push(mk1());
    shuffle(P.deck);
    for (let i = 0; i < BOUNTY_HAND; i++) P.hand.push(mk1()); // past the hand limit if need be: the only place it can be broken
    log(
      `The Bank arms ${plName(pl)} for the hunt: ${BOUNTY_DECK} Debt Collectors into the deck and ${BOUNTY_HAND} into the hand.`,
    );
    return ok;
  };
}
/* a Collector card placed on the field carries its bounty with it */
{
  const _pl = place;
  place = function (card, r, c) {
    const out = _pl.apply(this, arguments);
    const st = G.board[r] && G.board[r][c];
    if (card && card.bounty != null && st) st.bounty = card.bounty;
    return out;
  };
}
const bountyCards = (pl, ids) => {
  const P = G.p[pl];
  return P
    ? [...P.hand, ...P.deck].filter(
        (c) => c.bounty != null && ids.includes(c.bounty),
      )
    : [];
};
function dropBountyCards(pl, ids) {
  const P = G.p[pl];
  if (!P) return [];
  const out = bountyCards(pl, ids);
  P.hand = P.hand.filter((c) => !out.includes(c));
  P.deck = P.deck.filter((c) => !out.includes(c));
  return out;
}
{
  const _be = bountyEnd;
  bountyEnd = function (b, state, msg) {
    const out = _be.apply(this, arguments);
    if (b.by != null) {
      const n = dropBountyCards(b.by, [b.id]).length;
      if (n)
        log(
          `${n} unused Debt Collector${n > 1 ? "s" : ""} of the bounty fade${n > 1 ? "" : "s"} back into nothing.`,
        );
    }
    return out;
  };
}
{
  const _bf = bountyFail;
  bountyFail = function (b) {
    const h = b.by,
      ids = bountiesOf()
        .filter((x) => x.by === h && x.state === "taken")
        .map((x) => x.id),
      cards = dropBountyCards(h, ids),
      bk = npcIx("bank");
    const out = _bf.apply(this, arguments);
    let n = 0;
    if (bk >= 0)
      for (const c of cards) {
        const t = freeTilesNear(b.target, true)[0];
        if (!t) break;
        c.owner = bk;
        delete c.bounty;
        G.board[t[0]][t[1]] = {
          owner: bk,
          cards: [c],
          moved: true,
          attacked: true,
          hunt: b.target,
        };
        n++;
      }
    if (n)
      log(
        `The Bank sets ${n} of ${plName(h)}'s Debt Collectors from hand and deck on the field as its own.`,
      );
    return out;
  };
}

/* ---------- the look of the Demons and of the Bank's Collectors ---------- */
{
  const _sd = siegeDecor;
  siegeDecor = function (inner, st, V, r, c) {
    let h = _sd.apply(this, arguments);
    if (!st) return h;
    const P = G.p[st.owner];
    let cls = "";
    if ((P && P.npc === "barb") || st.cards.some((x) => x.barb))
      cls += " demon";
    if (
      P &&
      P.npc === "bank" &&
      st.cards.every((x) => x.unit === "debt" || x.unit === "carriage")
    )
      cls += " bankcoll";
    if (st.bounty != null) cls += " bountycoll";
    return cls ? h.replace('class="stack ', `class="stack${cls} `) : h;
  };
}

/* ---------- every effect is drawn on the page, so it stays on its card when the page scrolls ---------- */
{
  const _ly = FX.layer;
  FX.layer = function () {
    const l = _ly.call(FX);
    if (!l._paged) {
      l._paged = true;
      l.appendChild = function (e) {
        if (e && e.style) {
          const L = parseFloat(e.style.left),
            T = parseFloat(e.style.top); // screen spots become page spots
          if (!isNaN(L)) e.style.left = L + scrollX + "px";
          if (!isNaN(T)) e.style.top = T + scrollY + "px";
        }
        return Node.prototype.appendChild.call(this, e);
      };
    }
    /* v59: the page is measured without the layer (it used to count itself, so it could only grow: dead space at the
     bottom after zooming out), and the layer folds to nothing when no effect is playing */
    l.style.height = "0px";
    const h =
      Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      ) + "px";
    l.style.height = h;
    if (!l._watch) {
      l._watch = new MutationObserver(() => {
        if (!l.childElementCount) l.style.height = "0px";
      });
      l._watch.observe(l, { childList: true });
    }
    return l;
  };
}

/* ---------- the crit seal, over the card it concerns ---------- */
{
  const _ar = attackRun;
  attackRun = function (r1, c1, r2, c2) {
    const was = G._atk;
    G._atk = [r2, c2];
    try {
      return _ar.apply(this, arguments);
    } finally {
      G._atk = was;
    }
  };
}
{
  const _cl = critLog;
  critLog = function (k, n, html) {
    _cl.apply(this, arguments);
    if (G._atk && G.log[0] && G.log[0].crit)
      Object.assign(G.log[0].crit, { r: G._atk[0], c: G._atk[1] });
  };
}
const SEAL_SVG = (n) =>
  `<svg viewBox="-50 -50 100 100" aria-hidden="true"><polygon class="s1" points="0,-46 40,-23 40,23 0,46 -40,23 -40,-23"/><path class="s2" d="M0,-46L-24,14L24,14Z M-40,-23L-24,14 M40,-23L24,14 M-40,23L-24,14 M40,23L24,14 M0,46L-24,14 M0,46L24,14"/><circle class="s3" r="48"/><text x="0" y="6" text-anchor="middle" dominant-baseline="middle">${n}</text></svg>`;
critBanner = function (k, n, r, c) {
  if (typeof fxPartOn === "function" && !fxPartOn("banners")) return;
  if (r == null && G && G.log) {
    const V = view(),
      e = G.log.find(
        (l) => l.crit && !(l.fog && !l.fog.seen[V] && isEnemy(l.fog.by, V)),
      );
    if (e && e.crit.k === k && e.crit.n === n) {
      r = e.crit.r;
      c = e.crit.c;
    }
  }
  let b = $("#critfx");
  if (!b) {
    b = document.createElement("div");
    b.id = "critfx";
    b.setAttribute("aria-live", "polite");
    document.body.appendChild(b);
  }
  const t =
    k === "hit"
      ? "Crit Hit"
      : k === "miss"
        ? "Crit Miss"
        : k === "success"
          ? "Crit Success"
          : "Miss";
  const tile =
      r != null
        ? document.querySelector(`#board .tile[data-r="${r}"][data-c="${c}"]`)
        : null,
    box = (tile || $("#board") || document.body).getBoundingClientRect();
  b.style.left = box.left + box.width / 2 + scrollX + "px";
  b.style.top =
    (tile ? box.top + box.height * 0.15 : box.top + box.height / 2) +
    scrollY +
    "px";
  b.className = "k-" + k + (tile ? " ontile" : "");
  b.innerHTML = `${k === "dodge" ? "" : SEAL_SVG(n)}<b>${t}</b><i class="sp a"></i><i class="sp b"></i><i class="sp c"></i>`;
  b.hidden = false;
  b.classList.remove("go");
  void b.offsetWidth;
  b.classList.add("go");
  clearTimeout(critBanner.t);
  critBanner.t = setTimeout(() => {
    b.hidden = true;
  }, 1900);
};

/* ---------- the music dips under a cycle's sound ---------- */
for (const k of [
  "moonchime",
  "bell",
  "horn",
  "harp",
  "coins",
  "drums",
  "quill",
  "whispers",
])
  if (typeof AUD[k] === "function") {
    const f = AUD[k];
    AUD[k] = function () {
      try {
        if (window.ECMusic && ECMusic.duck)
          ECMusic.duck(k === "whispers" ? 3200 : 2600);
      } catch (e) {}
      return f.apply(this, arguments);
    };
  }

if (window.__EC)
  Object.assign(window.__EC, {
    critBanner: (...a) => critBanner(...a),
    acceptBounty: (...a) => acceptBounty(...a),
    place: (...a) => place(...a),
    canPlace: (...a) => canPlace(...a),
    attackRun: (...a) => attackRun(...a),
  });
