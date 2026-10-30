/* ---------------- v48: the banners, Dice Plus, the names of the spells on a stack, the Jester's Puppets ---------------- */

/* ---------- the banner: "Crit Hit", "Crit Miss" or "Miss" in red blackletter over a d20, for every player (it rides on the log) ---------- */
const D20_SVG = (n) =>
  `<svg viewBox="-50 -50 100 100" aria-hidden="true"><polygon points="0,-46 40,-23 40,23 0,46 -40,23 -40,-23"/><path d="M0,-46L-24,14L24,14Z M-40,-23L-24,14 M40,-23L24,14 M-40,23L-24,14 M40,23L24,14 M0,46L-24,14 M0,46L24,14"/><text x="0" y="6" text-anchor="middle" dominant-baseline="middle">${n}</text></svg>`;
let critSeen = 0;
function critBanner(k, n) {
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
  b.className = "k-" + k;
  b.innerHTML = `<b>${t}</b>${k === "dodge" ? "" : D20_SVG(n)}`;
  b.hidden = false;
  b.classList.remove("go");
  void b.offsetWidth;
  b.classList.add("go");
  clearTimeout(critBanner.t);
  critBanner.t = setTimeout(() => {
    b.hidden = true;
  }, 1700);
}
{
  const _r = render;
  render = function () {
    rSafe(_r, this, arguments);
    if (!G || !G.log) return;
    const V = view(),
      e = G.log.find(
        (l) => l.crit && !(l.fog && !l.fog.seen[V] && isEnemy(l.fog.by, V)),
      );
    if (!e) return;
    const id = e.n || e.t; // v78j: only fights you see
    if (!critSeen) {
      critSeen = id;
      if (Date.now() - e.t > 4000) return;
    }
    if (id !== critSeen && Date.now() - e.t < 6000) {
      critSeen = id;
      critBanner(e.crit.k, e.crit.n);
    } else critSeen = id;
  };
}

/* ---------- Dice Plus (Enchantment, 1d3 mana): a sword (its next attack) or a shield (its next defense) adds a d12 roll ---------- */
const dpCanAtk = (st) =>
  st.cards.some(
    (c) =>
      !isBase(c) &&
      (!(c.unit && UNIT[c.unit].noAtk) || (c.unit && UNIT[c.unit].shooter)) &&
      kind(c) !== "queen",
  );
const dpCanDef = (st) =>
  !hasK(st, "tree") &&
  st.cards.some((c) => {
    const k = kind(c);
    if (
      k === "jack" ||
      k === "slave" ||
      k === "queen" ||
      (k === "joker" && st.cards.length > 1)
    )
      return false;
    return !(c.unit && UNIT[c.unit].noDef);
  });
let dpArm = null; // a sword or shield picked first, on this device
PRICE.dplus = () => R(3);
SPELLS.push({
  id: "dplus",
  dice: "1d3",
  name: "Dice Plus",
  cost: 2,
  school: "Enchantment",
  text: "Select your stack, then a sword (its next attack) or a shield (its next defense): that roll adds a d12 on the Dice Plus table. Once on a stack; as many stacks as you like.",
  ok: () => {
    const st = selOwn() && selStack();
    return !!st && !st.dplus && (dpCanAtk(st) || dpCanDef(st));
  },
  run: async () => {
    const st = selStack(),
      opts = [];
    if (dpCanAtk(st))
      opts.push({ id: "atk", label: "Sword", sub: "its next attack" });
    if (dpCanDef(st))
      opts.push({ id: "def", label: "Shield", sub: "its next defense" });
    let m =
      dpArm && opts.some((o) => o.id === dpArm)
        ? dpArm
        : opts.length === 1
          ? opts[0].id
          : await ask(G.active, {
              kind: "choice",
              id: "dplus",
              title: "Dice Plus: sword or shield?",
              options: opts,
              ai: () => opts[0].id,
            });
    dpArm = null;
    if (!m) m = opts[0].id;
    st.dplus = { m };
    log(
      `Dice Plus: a ${m === "atk" ? "sword" : "shield"} hangs over ${plName(G.active)}'s stack (a d12 on its next ${m === "atk" ? "attack" : "defense"}).`,
    );
  },
});
SPELL_TEXT.dplus = {
  n: "Select one of your stacks that can attack or defend, one without Dice Plus.",
  e: "Pick a sword (its next attack) or a shield (its next defense). That roll adds a d12 on the table: 1: +1 · 2: +1d2 · 3: +1d3 · 4: +1d4 · 5–6: +1d6 · 7–9: +1d8 · 10: +1d10 · 11: +1d12 · 12: two more d12 on the table, and every 12 rolls again.",
  l: "Once on a stack, as many stacks as you like.",
};
{
  const s = SP("dplus");
  const t = SPELL_TEXT.dplus;
  s.text = [t.n, t.e, t.l].join(" ");
}
/* the row has a sword and a shield: pick one, then click one of your stacks */
{
  const _sr = spellRow;
  spellRow = function (s, live) {
    const h = _sr(s, live);
    if (!s || s.id !== "dplus" || !G) return h;
    return `<div class="spellrow dprow"><button type="button" class="autotog dparm${dpArm === "atk" ? " on" : ""}" data-dparm="atk" aria-label="Dice Plus on an attack" data-tip="Pick the sword, then click one of your stacks.">⚔︎</button><button type="button" class="autotog dparm${dpArm === "def" ? " on" : ""}" data-dparm="def" aria-label="Dice Plus on a defense" data-tip="Pick the shield, then click one of your stacks.">⛨</button>${h}</div>`;
  };
}
{
  const _rs = renderSpells;
  renderSpells = function (live) {
    _rs(live);
    document.querySelectorAll("[data-dparm]").forEach(
      (b) =>
        (b.onclick = (e) => {
          e.stopPropagation();
          if (!canAct()) return;
          const m = b.dataset.dparm;
          dpArm = dpArm === m ? null : m;
          if (dpArm) {
            const st = selOwn() && selStack();
            if (st && spellReady(SP("dplus"))) {
              cast(SP("dplus"));
              return;
            }
            flash(
              `Dice Plus (${m === "atk" ? "sword" : "shield"}): click one of your stacks.`,
            );
          }
          render();
        }),
    );
  };
}
{
  const _tc = tileClick;
  tileClick = function (r, c) {
    const out = _tc.apply(this, arguments);
    if (dpArm && G && canAct()) {
      const st = selOwn() && selStack();
      if (st) {
        const sp = SP("dplus");
        if (spellReady(sp)) cast(sp);
        else {
          flash("Dice Plus can't go on that stack.");
          dpArm = null;
          render();
        }
      }
    }
    return out;
  };
}

/* ---------- the spells on a stack: their names in see-through blackletter at the bottom, how long and the odds at the top right ---------- */
function stackSpells(st) {
  const L = [],
    t = (n) => `${n} round${n === 1 ? "" : "s"}`;
  if (st.odds === "adv") L.push(["Divine Odds", "next fight", "advantage"]);
  if (st.odds === "dis") L.push(["Hexed Odds", "next fight", "disadvantage"]);
  if (st.dplus)
    L.push([
      "Dice Plus",
      st.dplus.m === "atk" ? "next attack" : "next defense",
      "+d12",
    ]);
  if (st.mars) L.push(["Mars", "next attack", "advantage"]);
  if (st.hypo) L.push(["Hypostasis", t(st.hypo), ""]);
  if (st.pin) L.push(["Behooved", t(st.pin.turns || 1), "pinned"]);
  if (st.stun) L.push(["Lightning Strike", t(st.stun), "pinned"]);
  if (st.supp) L.push(["Suppressed", t(st.supp.n || 1), "disadvantage"]);
  if (hated(st)) L.push(["Hate", "until it fights", "disadvantage"]);
  return L;
}
{
  const _sd = siegeDecor;
  siegeDecor = function (inner, st, V, r, c) {
    let h = _sd(inner, st, V, r, c);
    const L = stackSpells(st);
    const add = [];
    if (st.dplus) {
      h = h.replace('class="stack ', `class="stack dp-${st.dplus.m} `);
      add.push(
        `<span class="dpicon" aria-hidden="true">${st.dplus.m === "atk" ? "⚔︎" : "⛨"}</span>`,
      );
    }
    if (L.length)
      add.push(
        `<span class="spfx" title="${esc(L.map((x) => `${x[0]}: ${x[1]}${x[2] ? ", " + x[2] : ""}`).join(" · "))}"><span class="spdur">${L[0][1]}${L[0][2] ? " · " + L[0][2] : ""}${L.length > 1 ? ` +${L.length - 1}` : ""}</span><span class="spname">${L.map((x) => x[0]).join(" · ")}</span></span>`,
      );
    if (add.length && h.endsWith("</div>"))
      h = h.slice(0, -6) + add.join("") + "</div>";
    return h;
  };
}

/* ---------- the Jester's Puppets from the Ether: two for 1 mana, the Jester only ---------- */
SPELLS.push({
  id: "cpup",
  tribe: "jester",
  name: "Puppet Conjure",
  cost: 1,
  school: "Conjuring",
  text: "The Jester only: two Puppets (1d1 + 1) come from the Ether into your deck. A Puppet fights like a 2 Grunt and always goes to the Outer Darkness when it dies.",
  ok: () => true,
  run: async () => {
    const P = me();
    for (let i = 0; i < 2; i++) {
      const c = mk("2", pick(["S", "H", "D", "C"]));
      c.puppet = true;
      c.owner = G.active;
      P.deck.push(c);
    }
    shuffle(P.deck);
    log(`Two Puppets come from the Ether into ${plName(G.active)}'s deck.`);
  },
});
SPELL_TEXT.cpup = {
  e: "Two Puppets (1d1 + 1) come from the Ether into your deck.",
  l: "The Jester only. A Puppet fights like a 2 Grunt; it never misses, shrugs off Crit Hits, and goes to the Outer Darkness when it dies.",
};
ETHER_SHOP[0][1].push(["cpup", "Puppets", "two for 1 mana"]);
ETHER_IDS.add("cpup");
ETHER_KIND.cpup = "puppet";
if (window.__EC)
  Object.assign(window.__EC, { critBanner, dicePlusRoll, landRoll });
