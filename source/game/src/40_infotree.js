/* ---------------- v38: the info panels as folders ----------------
   Card info opens on kinds of card (Standard, Special, Support, Bases, Wildcards, and the Wildcards by Emanation); each folder
   holds only a few cards, and the card's page opens right under them. Spells explained has a folder for each school, the
   Emanations' own spells in a folder of their own; Further explanations turns each list into the same buttons. One folder
   is open at a time in each place, so a phone never shows a wall of buttons. */
const CARD_TREE = [
  ["Standard", ["grunt", "infantry", "puppet", "archer", "cannon"]],
  ["Special", ["jack", "queen", "king", "ace", "joker", "assassin"]],
  ["Support", ["scout", "healer", "repair", "ram", "miner"]],
  ["Bases", ["ace", "tree", "wall"]],
  [
    "Wildcards",
    [
      ["Angel Machine", ["samson", "antony"]],
      ["Satan", ["satan"]],
      ["Jester Fool", ["bullgoat", "goatbull", "puppet", "tree"]],
      ["Binah", ["slavemaster", "slave"]],
      ["The Leviathan", ["leviathan"]],
      ["Tiphareth of Kether", ["trafficker"]],
      ["Yaldabaoth", ["debt"]],
    ],
  ],
];
const shortInfo = (k) => INFO[k][0].replace(/ \([^)]*\)$/, "");
const ifold = (name, inner, n) =>
  `<details class="sub ifold"><summary>${esc(name)}${n ? ` <span class="ifn">${n}</span>` : ""}</summary>${inner}</details>`;
function cardTreeHTML() {
  const tabs = (ks) =>
    `<div class="itabs">${ks
      .filter((k) => INFO[k])
      .map(
        (k) =>
          `<button type="button" class="itab" data-k="${k}">${esc(shortInfo(k))}</button>`,
      )
      .join("")}</div>`;
  return CARD_TREE.map(([name, ks]) =>
    Array.isArray(ks[0])
      ? ifold(
          name,
          ks.map(([n2, k2]) => ifold(n2, tabs(k2), k2.length)).join(""),
          ks.length + " Emanations",
        )
      : ifold(name, tabs(ks), ks.length),
  ).join("");
}
/* one list of terms (dt) and their answers (dd) becomes buttons, and the answer opens under them */
function tabify(dl) {
  const pairs = [];
  let dt = null;
  for (const el of [...dl.children]) {
    if (el.tagName === "DT") dt = el;
    else if (el.tagName === "DD" && dt) {
      pairs.push([dt, el]);
      dt = null;
    }
  }
  if (!pairs.length) return null;
  const wrap = document.createElement("div");
  wrap.className = "tabbed";
  wrap.innerHTML = `<div class="itabs">${pairs.map(([t], i) => `<button type="button" class="itab" data-i="${i}">${esc(((t.firstChild && t.firstChild.textContent) || t.textContent).trim())}</button>`).join("")}</div><div class="tbody" hidden></div>`;
  const body = wrap.querySelector(".tbody");
  wrap.querySelectorAll(".itab").forEach(
    (b) =>
      (b.onclick = () => {
        const on = b.classList.contains("on");
        wrap.querySelectorAll(".itab").forEach((x) => x.classList.remove("on"));
        if (on) {
          body.hidden = true;
          return;
        }
        b.classList.add("on");
        const [t, d] = pairs[+b.dataset.i];
        body.innerHTML = `<h4>${t.innerHTML}</h4><div>${d.innerHTML}</div>`;
        body.hidden = false;
      }),
  );
  dl.replaceWith(wrap);
  return wrap;
}
/* one folder open at a time among its siblings */
function oneOpen(root) {
  root.addEventListener(
    "toggle",
    (e) => {
      const d = e.target;
      if (!d.open || !d.classList || !d.classList.contains("ifold")) return;
      for (const s of d.parentElement.children)
        if (s !== d && s.tagName === "DETAILS" && s.classList.contains("ifold"))
          s.open = false;
    },
    true,
  );
}
function infoTree() {
  const box = $("#info");
  if (!box) return;
  const [, cards, spells, further] = [
    ...box.querySelectorAll(":scope > details.cinfo"),
  ];
  // Card info
  if (cards) {
    const tabs = cards.querySelector(".itabs");
    if (tabs) tabs.remove();
    const body = $("#ibody");
    body.innerHTML = '<p class="dim">Pick a kind of card, then a card.</p>';
    cards.insertAdjacentHTML(
      "beforeend",
      `<div class="ctree">${cardTreeHTML()}</div>`,
    );
    cards.appendChild(body);
    cards.querySelectorAll(".ctree .itab").forEach(
      (b) =>
        (b.onclick = () => {
          const on = b.classList.contains("on");
          cards
            .querySelectorAll(".ctree .itab")
            .forEach((x) => x.classList.remove("on"));
          if (on) {
            body.innerHTML =
              '<p class="dim">Pick a kind of card, then a card.</p>';
            cards.appendChild(body);
            return;
          }
          b.classList.add("on");
          b.parentElement.after(body);
          body.innerHTML = infoBody(b.dataset.k);
        }),
    );
    oneOpen(cards);
  }
  // Spells explained: a folder for each school, the Emanations' spells in their own folder
  if (spells) {
    const si = spells.querySelector(".spellinfo");
    if (si) {
      const parts = [];
      let h = null;
      for (const el of [...si.children]) {
        if (el.tagName === "H4") h = el;
        else if (el.tagName === "DL" && h) {
          parts.push([h.textContent, el]);
          h = null;
        }
      }
      const tree = document.createElement("div");
      tree.className = "ctree";
      for (const [school, dl] of parts) {
        const d = document.createElement("details");
        d.className = "sub ifold";
        const all = [...dl.children],
          gen = document.createElement("dl"),
          sub = document.createElement("dl");
        for (let i = 0; i < all.length; i += 2) {
          const dt = all[i],
            dd = all[i + 1];
          if (!dd) break;
          const own = /·/.test(dt.querySelector("span")?.textContent || "");
          (own ? sub : gen).append(dt, dd);
        }
        const n = gen.children.length / 2 + sub.children.length / 2;
        d.innerHTML = `<summary>${esc(school)} <span class="ifn">${n}</span></summary>`;
        if (gen.children.length / 2 > 9) {
          // a big school: split by price, so each folder holds a few
          const tier = (dt) => {
            const t = (dt.querySelector("span")?.textContent || "").trim();
            if (/^free/i.test(t)) return "Free";
            if (/d\d/.test(t)) return "Rolled prices";
            const n = parseInt(t, 10);
            return isNaN(n)
              ? "Other prices"
              : n <= 3
                ? "1 to 3 mana"
                : n <= 6
                  ? "4 to 6 mana"
                  : "7 mana or more";
          };
          const order = [
              "Free",
              "1 to 3 mana",
              "4 to 6 mana",
              "7 mana or more",
              "Rolled prices",
              "Other prices",
            ],
            by = {};
          const g = [...gen.children];
          for (let i = 0; i < g.length; i += 2) {
            const k = tier(g[i]);
            (by[k] = by[k] || document.createElement("dl")).append(
              g[i],
              g[i + 1],
            );
          }
          for (const k of order)
            if (by[k]) {
              const f = document.createElement("details");
              f.className = "sub ifold";
              f.innerHTML = `<summary>${k} <span class="ifn">${by[k].children.length / 2}</span></summary>`;
              f.appendChild(by[k]);
              d.appendChild(f);
              tabify(by[k]);
            }
        } else if (gen.children.length) {
          d.appendChild(gen);
          tabify(gen);
        }
        if (sub.children.length) {
          const s2 = document.createElement("details");
          s2.className = "sub ifold";
          s2.innerHTML = `<summary>The Emanations' own ${esc(school.toLowerCase())} <span class="ifn">${sub.children.length / 2}</span></summary>`;
          s2.appendChild(sub);
          d.appendChild(s2);
          tabify(sub);
        }
        tree.appendChild(d);
      }
      const note = si.querySelector(":scope > p.dim");
      si.innerHTML = "";
      si.appendChild(tree);
      if (note) si.appendChild(note);
      oneOpen(si);
    }
  }
  // Further explanations: the same buttons in each section
  if (further) {
    further.querySelectorAll(":scope > details.sub").forEach((d) => {
      d.classList.add("ifold");
      d.querySelectorAll(":scope > dl.spellinfo").forEach(tabify);
    });
    oneOpen(further);
  }
  oneOpen(box);
}
{
  const _mi = mountInfo;
  mountInfo = function () {
    _mi.apply(this, arguments);
    try {
      infoTree();
    } catch (e) {
      console.error(e);
    }
  };
}
