/* ---------- v71k: Neptune's eclipse darkens the grave ----------
   Under Neptune's eclipse (or Lostness II on oneself), whoever takes cards from the grave (the New Moon's gift, Peace,
   Resurrection, Neptune's own grave) only chooses to draw or to stop: which card comes is chance, and for Resurrection it
   is one they can pay for. Grave automation waits with the rest of the automation. */
const NEP_GRAVE = new Set(["grave", "resur", "nepgrave"]);
{
  const _ask = ask;
  ask = async function (pl, spec) {
    if (
      spec &&
      spec.kind === "cards" &&
      NEP_GRAVE.has(spec.id) &&
      G &&
      G.p[pl] &&
      nepEcFor(pl) &&
      Array.isArray(spec.cards) &&
      spec.cards.length
    ) {
      const ok = spec.cards
        .map((c, i) => i)
        .filter((i) => !(spec.offs && spec.offs[i]));
      if (!ok.length) return _ask.apply(this, arguments); // nothing they can pay for: the usual window says so
      const v = await _ask.call(this, pl, {
        kind: "choice",
        id: spec.id + "-blind",
        title: spec.title,
        sub: "Neptune's eclipse darkens the grave: you draw from it blindly.",
        options: [
          {
            id: "take",
            label: "Draw blindly",
            sub:
              spec.id === "resur"
                ? "A card you can pay for, unseen until it comes up."
                : "A card from the grave, unseen until it comes up.",
          },
          { id: "stop", label: spec.cancel || "Stop" },
        ],
        ai: () => (!spec.ai || spec.ai() != null ? "take" : "stop"),
      });
      return v === "take" ? pick(ok) : null;
    }
    return _ask.apply(this, arguments);
  };
}

/* ---------- v71k: Neptune's cloud is one cloud ----------
   It settles where a slow wave over the field rises, on tiles near the cards, and drifts with the wave a little each round.
   (Before, every tile near a card was in it on its own 45% chance, every round, so it looked like loose blue squares.) */
nepCloudTiles = function () {
  const N = NEP();
  let w = N.cloud && N.cw;
  if (w) w.k++;
  else
    w = N.cw = {
      a: Math.random() * 6.283,
      b: Math.random() * 6.283,
      c: Math.random() * 6.283,
      dx: (Math.random() - 0.5) * 1.3,
      dy: (Math.random() - 0.5) * 1.3,
      k: 0,
    };
  const out = [];
  for (let r = 0; r < G.rows; r++)
    for (let c = 0; c < COLS; c++) {
      if (isVoid(r, c) || tileRole(r, c) === "water") continue;
      let near = false;
      for (let dr = -1; dr <= 1 && !near; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const a = r + dr,
            b = c + dc;
          if (a >= 0 && b >= 0 && a < G.rows && b < COLS && G.board[a][b]) {
            near = true;
            break;
          }
        }
      if (!near) continue;
      const x = c + w.dx * w.k,
        y = r + w.dy * w.k,
        v =
          Math.sin(x * 0.95 + w.a) +
          Math.sin(y * 1.05 + w.b) +
          Math.sin((x + y) * 0.62 + w.c);
      if (v > 0.35) out.push(r * 100 + c);
    }
  return out;
};
if (window.__EC)
  Object.assign(window.__EC, { nepCloudTilesW: () => nepCloudTiles() });

/* v71m: while Neptune is in the sky (or on a player through Lostness) its fog of war is bluish: html.nepup */
{
  const _r = render;
  render = function () {
    rSafe(_r, this, arguments);
    document.documentElement.classList.toggle(
      "nepup",
      !!(G && (nepUp() || nepSelf(view()))),
    );
  };
}
