/* ---------- v79l: every ranking of the field's automation in the classes' style ----------
   - The principles: a numbered list, ▲ and ▼; no more equals (the higher one wins when they pull apart). Target bases
     and Focus on crystals still come out of it with × and back with +.
   - Target priority, as a class has it: the type it targets most (one at most), each type's ⚙ (the kind hunted first
     among them, and their order), the hierarchy of the types, Weakest Grunts and Infantry first, and which stacks it goes
     for because of the kind it hunts. Single kinds now live inside their type's ⚙; an older ranking of single kinds
     becomes the order of the types and of the kinds inside each. */
const TG_TYPES = ["wildcard", "special", "base", "standard", "support"];
function faTgFill(o, c) {
  try {
    const kindsOf = (t) => clsTypeKinds(t),
      seen = new Set();
    let order = Array.isArray(o.tgorder)
      ? o.tgorder.filter((t) => TG_TYPES.includes(t))
      : [];
    const old =
      c && c.tgroup === false && Array.isArray(c.torder) ? c.torder : null; // a ranking of single kinds, from before
    if (old) {
      order = [];
      for (const k of old) {
        const t = tkType(k);
        if (TG_TYPES.includes(t) && !seen.has(t)) {
          seen.add(t);
          order.push(t);
        }
      }
    }
    o.tgorder = [...order, ...TG_TYPES.filter((t) => !order.includes(t))];
    const was =
      c && c.tgKinds && typeof c.tgKinds === "object" ? c.tgKinds : {};
    o.tgKinds = {};
    for (const t of TG_TYPES) {
      const ks = kindsOf(t),
        q = was[t] || {},
        o2 = old
          ? old.filter((k) => ks.includes(k))
          : Array.isArray(q.order)
            ? q.order.filter((k) => ks.includes(k))
            : [];
      o.tgKinds[t] = {
        most: ks.includes(q.most) ? q.most : null,
        order: [...o2, ...ks.filter((k) => !o2.includes(k))],
      };
    }
    o.tgMost = TG_TYPES.includes(c && c.tgMost) ? c.tgMost : null;
    o.tgroup = true;
  } catch (e) {} // (the kinds aren't known yet while the page loads)
  return o;
}
/* the principles */
function faPrincHTML(c) {
  const order = c.order.filter((k) => !c.hout.includes(k)),
    name = (k) => FA_PRINC.find((x) => x[0] === k)[1];
  return `<ol class="krank faprinc">${order.map((k, i) => `<li><span class="farank">${i + 1}</span><b>${esc(name(k))}</b><small class="dim">${esc(faVal(k, c) || "")}</small><span class="facolbtns"><button type="button" class="btn ghost sm" data-faact="up:${k}" aria-label="Higher" ${i ? "" : "disabled"}>▲</button><button type="button" class="btn ghost sm" data-faact="down:${k}" aria-label="Lower" ${i < order.length - 1 ? "" : "disabled"}>▼</button>${FA_OUT.includes(k) ? `<button type="button" class="btn ghost sm faout" data-faact="out:${k}" aria-label="Take ${esc(name(k))} out of the ranking" title="Take it out of the ranking">×</button>` : ""}</span></li>`).join("")}</ol>`;
}
/* the targets */
function faTgHTML(K, c) {
  const T = c.tgKinds || {};
  return (
    `<p class="clsh">Targets most</p><div class="clstypes">${TG_TYPES.map(
      (t) => {
        const sel = c.tgMost === t,
          m = T[t] && T[t].most;
        return `<div class="clstype${sel ? " on" : ""}"><label class="clstsel"><input type="checkbox" data-fatgmost="${t}" ${sel ? "checked" : ""}><span><b>${TGROUP_NAMES[t]}</b><small>${m ? esc(clsKindName(m)) + " first" : "in their order"}</small></span></label><button type="button" class="btn ghost sm clsgear" data-fatgwin="${t}" title="Which ${TGROUP_NAMES[t]} it hunts first" aria-label="${TGROUP_NAMES[t]}: which it hunts first">⚙</button></div>`;
      },
    ).join("")}</div>
<p class="clsh">Hierarchy of the types</p>${kindRankHTML(c.tgorder, "data-tgact", TGROUP_NAMES)}` +
    K.row(
      "tWeak",
      c.tWeak,
      "Weakest Grunts and Infantry first",
      "Off: the strongest of them first.",
    ) +
    `<p class="dim clsstk">Go for a stack because of the kind it hunts when that kind is…</p>` +
    K.row("tStk.strongest", c.tStk.strongest, "…its strongest card", "") +
    K.row("tStk.weakest", c.tStk.weakest, "…its weakest card", "") +
    K.row("tStk.minority", c.tStk.minority, "…only a few of its cards", "") +
    K.row("tStk.majority", c.tStk.majority, "…most of its cards", "")
  );
}
/* a type's ⚙: the kind hunted first among them, and the order of the rest */
function faTgWin(t) {
  if (!TG_TYPES.includes(t)) return;
  let box = $("#fatgwin");
  if (!box) {
    box = document.createElement("div");
    box.id = "fatgwin";
    box.className = "faov";
    document.body.appendChild(box);
  }
  const c = faMine(),
    T = c.tgKinds[t],
    nm = TGROUP_NAMES[t];
  box.innerHTML = `<div class="ovbox clstgbox" role="dialog" aria-labelledby="fatgh"><button type="button" class="xclose" aria-label="Close">×</button><h2 id="fatgh">Your field · ${nm}</h2>
<p class="dim">Among the ${nm}, the kind your field hunts first, and the order of the rest.</p>
<p class="clsh">Hunts first</p><div class="opts fakinds">${[["", "None"], ...clsTypeKinds(t).map((x) => [x, clsKindName(x)])].map(([v, l]) => `<label class="opt"><input type="radio" name="fatgm" value="${v}" ${(T.most || "") === v ? "checked" : ""}><span>${esc(l)}</span></label>`).join("")}</div>
<p class="clsh">Hierarchy of the ${nm}</p>${kindRankHTML(T.order, "data-fatgk", {})}
<p class="acts"><button type="button" class="btn" data-fatgok>Done</button></p></div>`;
  box.querySelectorAll(".krank b").forEach((b, i) => {
    b.textContent = clsKindName(T.order[i]);
  });
  box.hidden = false;
  const close = () => {
    box.hidden = true;
    paintFA();
  };
  box.querySelector(".xclose").onclick = close;
  box.querySelector("[data-fatgok]").onclick = close;
  box.onclick = (e) => {
    if (e.target === box) close();
  };
  const save = () => {
    faSave(c);
    faTgWin(t);
  };
  box.querySelectorAll("input[name=fatgm]").forEach(
    (i) =>
      (i.onchange = () => {
        T.most = i.value || null;
        save();
      }),
  );
  box.querySelectorAll("[data-fatgk]").forEach(
    (b) =>
      (b.onclick = () => {
        T.order = rankMove(T.order, b.dataset.fatgk);
        save();
      }),
  );
}
{
  const _fw = faWire;
  faWire = function (root) {
    _fw.apply(this, arguments);
    root.querySelectorAll("[data-fatgmost]").forEach(
      (i) =>
        (i.onchange = () => {
          const c = faMine();
          c.tgMost = i.checked ? i.dataset.fatgmost : null;
          faSave(c);
        }),
    );
    root
      .querySelectorAll("[data-fatgwin]")
      .forEach((b) => (b.onclick = () => faTgWin(b.dataset.fatgwin)));
  };
}
